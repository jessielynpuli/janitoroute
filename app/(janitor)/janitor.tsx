import AreaDropdown, { DropdownItem } from '@/components/areaDropdown';
import { BinStatusModal } from '@/components/BinStatusModal';
import NodalGraph, { LandmarkRow } from '@/components/GraphNodes';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Live Supabase API queries
import { DBEdge, fetchNetworkEdges } from '@/api/edges/edges_queries';
import { fetchAllAreas, fetchMapDataByArea, updateWastebin } from '@/api/wastebins/wb_queries';

export default function JanitorScreen() {
  const insets = useSafeAreaInsets();
  
  const [areaData, setAreaData] = useState<DropdownItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<LandmarkRow[]>([]);
  const [edgesData, setEdgesData] = useState<DBEdge[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Target State Hooks
  const [modalVisible, setModalVisible] = useState(false);
  const [targetBinId, setTargetBinId] = useState<string | null>(null);
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [highlightedEdges, setHighlightedEdges] = useState<Array<{ from: string; to: string }>>([]);

  // Map Panning and Zooming Drivers
  const [scaleValue] = useState(new Animated.Value(1));
  const pan = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        Animated.spring(pan, { toValue: { x: Math.min(Math.max((pan.x as any)._value, -1000), 1000), y: Math.min(Math.max((pan.y as any)._value, -1000), 1000) }, useNativeDriver: true, friction: 7 }).start();
      },
    })
  ).current;

  const handleZoom = (type: 'IN' | 'OUT') => {
    let nextScale = (scaleValue as any)._value + (type === 'IN' ? 0.2 : -0.2);
    Animated.timing(scaleValue, { toValue: Math.min(Math.max(nextScale, 0.4), 2.0), duration: 150, useNativeDriver: true }).start();
  };

  // --- Core API Data Pull System ---
  const loadInitialWorkspaceData = async () => {
    try {
      const data = await fetchAllAreas();
      const dbAreas = (data || []).map((area: any) => ({ label: area.area_name, value: String(area.area_id) }));
      setAreaData(dbAreas);
      if (dbAreas.length > 0) setSelectedAreaId(dbAreas[0].value);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refreshCanvasMap = async () => {
    if (!selectedAreaId) return;
    const result = await fetchMapDataByArea(selectedAreaId);
    if (result.success) setMapData(result.data as LandmarkRow[]);
    const edges = await fetchNetworkEdges();
    setEdgesData(edges);
  };

  useEffect(() => { loadInitialWorkspaceData(); }, []);
  useEffect(() => { refreshCanvasMap(); setHighlightedEdges([]); setStartNodeId(null); }, [selectedAreaId]);

  // --- Dynamic Live Updating Method ---
  const handleUpdateBinStatus = async (status: 'empty' | 'half-full' | 'full') => {
    if (!targetBinId) return;
    setModalVisible(false);
    const result = await updateWastebin(targetBinId, { status });
    if (result.success) {
      Alert.alert("Status Synced", "Wastebin metrics updated successfully.");
      await refreshCanvasMap();
    } else {
      Alert.alert("Sync Error", "Could not write modifications to database server.");
    }
  };

  // --- BFS Graph Traversal Core Engine ---
  const runBFSPathfinder = (mode: 'NEAREST' | 'ALL') => {
    if (!startNodeId) {
      Alert.alert("Anchor Point Required", "Tap any node on the graph canvas workspace to define your baseline location first!");
      return;
    }

    // 1. Build an adjacency map representing your graph structure
    const adjList: Record<string, string[]> = {};
    const nodeStatusLookup: Record<string, string> = {};

    // Map explicit edge routes
    edgesData.forEach(edge => {
      if (!adjList[edge.from_node_id]) adjList[edge.from_node_id] = [];
      if (!adjList[edge.to_node_id]) adjList[edge.to_node_id] = [];
      adjList[edge.from_node_id].push(edge.to_node_id);
      adjList[edge.to_node_id].push(edge.from_node_id);
    });

    // Capture bin occupancy statuses across locations
    mapData.forEach(landmark => {
      landmark.wastebins?.forEach(bin => {
        nodeStatusLookup[bin.wastebin_id] = bin.status;
      });
    });

    // 2. Traversal setup parameters
    const queue: string[] = [startNodeId];
    const visited = new Set<string>([startNodeId]);
    const parentTracker: Record<string, string> = {};
    const compiledPaths: Array<{ from: string; to: string }> = [];

    let nearestFound = false;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (nodeStatusLookup[current] === 'full') {
        // Backtrace route to the current node using our structural path map pointers
        let step = current;
        while (parentTracker[step]) {
          compiledPaths.push({ from: parentTracker[step], to: step });
          step = parentTracker[step];
        }
        nearestFound = true;
        if (mode === 'NEAREST') break; 
      }

      const neighbors = adjList[current] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parentTracker[neighbor] = current;
          queue.push(neighbor);
        }
      }
    }

    if (!nearestFound) {
      setHighlightedEdges([]);
      Alert.alert("All Clean!", "No full wastebins detected inside this area quadrant map layout.");
      return;
    }

    setHighlightedEdges(compiledPaths);
    Alert.alert("Routes Calculated", mode === 'NEAREST' ? "Shortest route to closest full bin highlighted!" : "All active full bin paths highlighted.");
  };

  if (loading) return <ActivityIndicator size="large" color="#0D47A1" style={styles.center} />;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 85 }]}>
      <View style={styles.container}>
        <View style={styles.dropdownContainer}>
          <AreaDropdown data={areaData} placeholder="CHOOSE AREA" onSelect={(item) => setSelectedAreaId(String(item.value))} selectedValue={selectedAreaId} />
        </View>

        <View style={styles.graphWindow}>
          <Animated.View {...panResponder.panHandlers} style={[styles.canvas, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scaleValue }] }]}>
            <NodalGraph 
              mapData={mapData} 
              edges={edgesData} 
              isDeleteMode={false} 
              highlightedEdges={highlightedEdges}
              selectedStartNodeId={startNodeId}
              onNodePress={(id, type) => {
                if (type === 'landmark') {
                  setStartNodeId(id);
                  setHighlightedEdges([]); // Clear old path selections automatically
                } else {
                  setTargetBinId(id);
                  setModalVisible(true);
                }
              }} 
            />
          </Animated.View>

          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('IN')}><Text style={styles.zoomText}>+</Text></TouchableOpacity>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('OUT')}><Text style={styles.zoomText}>−</Text></TouchableOpacity>
          </View>
        </View>

        {/* Control Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => runBFSPathfinder('NEAREST')}>
            <Text style={styles.btnText}>Find Nearest Full Bin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => runBFSPathfinder('ALL')}>
            <Text style={styles.btnText}>Highlight All Full</Text>
          </TouchableOpacity>
        </View>

        <BinStatusModal visible={modalVisible} onClose={() => setModalVisible(false)} onSelect={handleUpdateBinStatus} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFFAFF', padding: 20 },
  dropdownContainer: { zIndex: 10, marginBottom: 20 },
  graphWindow: { flex: 1, backgroundColor: '#B6D7E8', borderWidth: 3, borderColor: '#6D6D6D', overflow: 'hidden', width: '100%', height: 400 },
  canvas: { width: 1000, height: 1000 },
  zoomControls: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: 4 },
  zoomBtn: { padding: 8, alignItems: 'center' },
  zoomText: { fontSize: 20, fontWeight: 'bold', color: '#1E56A0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 15, marginBottom: 5 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  primaryBtn: { backgroundColor: '#1B5E20' },
  secondaryBtn: { backgroundColor: '#0D47A1' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 }
});