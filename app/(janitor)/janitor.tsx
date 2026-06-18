import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, Animated, PanResponder } from 'react-native';
import { s } from 'react-native-size-matters';

// Component Extensions
import AreaDropdown, { DropdownItem } from '@/components/areaDropdown';
import NodalGraph, { WastebinRow, LandmarkRow } from '@/components/GraphNodes';
import { BinStatusModal } from '@/components/BinStatusModal';

// API queries
import { fetchAllAreas, fetchMapDataByArea, updateWastebin } from '@/api/wastebins/wb_queries';
import { fetchNetworkEdges, DBEdge } from '@/api/edges/edges_queries';

export default function JanitorScreen() {
  const [areaData, setAreaData] = useState<DropdownItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<LandmarkRow[]>([]);
  const [edgesData, setEdgesData] = useState<DBEdge[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal tracking variables
  const [modalVisible, setModalVisible] = useState(false);
  const [targetBinId, setTargetBinId] = useState<string | null>(null);
    
  // Pathfinding Routing Logic States
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [highlightedEdges, setHighlightedEdges] = useState<Array<{ from: string; to: string }>>([]);

  // Zooming & Panning Animation States
  const [scaleValue] = useState(new Animated.Value(1));
  const pan = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;

  // 1. Initialize PanResponder matrix boundary
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        const MAX_DRAG_LIMIT_X = 1000;
        const MAX_DRAG_LIMIT_Y = 1000;

        let currentX = (pan.x as any)._value;
        let currentY = (pan.y as any)._value;
        let targetX = currentX;
        let targetY = currentY;

        if (currentX > MAX_DRAG_LIMIT_X) targetX = MAX_DRAG_LIMIT_X;
        if (currentX < -MAX_DRAG_LIMIT_X) targetX = -MAX_DRAG_LIMIT_X;
        if (currentY > MAX_DRAG_LIMIT_Y) targetY = MAX_DRAG_LIMIT_Y;
        if (currentY < -MAX_DRAG_LIMIT_Y) targetY = -MAX_DRAG_LIMIT_Y;

        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: true,
          friction: 7,
        }).start();
      },
    })
  ).current;

  // 2. Zoom Button Handlers
  const handleZoom = (type: 'IN' | 'OUT') => {
    let currentScale = (scaleValue as any)._value;
    let nextScale = type === 'IN' ? currentScale + 0.2 : currentScale - 0.2;

    if (nextScale < 0.4) nextScale = 0.4;
    if (nextScale > 2.0) nextScale = 2.0;

    Animated.timing(scaleValue, {
      toValue: nextScale,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // 3. Database Hydration Data Sync
  const loadAreas = async () => {
    try {
      const data = await fetchAllAreas();
      const dbAreas: DropdownItem[] = (data || []).map((area: any) => ({
        label: area.area_name,
        value: String(area.area_id), 
      }));
      setAreaData(dbAreas);
      if (dbAreas.length > 0 && !selectedAreaId) {
        setSelectedAreaId(String(dbAreas[0].value));
      }
    } catch (error) {
      console.error("Error loading areas:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveCanvasMap = async () => {
    if (!selectedAreaId) return;
    try {
      const result = await fetchMapDataByArea(selectedAreaId);
      if (result.success && Array.isArray(result.data)) {
        setMapData(result.data as LandmarkRow[]);
      }
    } catch (error) {
      console.error("Failed to refresh map nodes:", error);
    }
  };

  const refreshEdges = async () => {
    try {
      const edges = await fetchNetworkEdges();
      setEdgesData(edges);
    } catch (error) {
      console.error("Failed to sync structural routing edges:", error);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    if (selectedAreaId) {
      refreshActiveCanvasMap();
      refreshEdges();
    }
  }, [selectedAreaId]);

  const handleAreaSelect = (item: DropdownItem) => {
    setSelectedAreaId(String(item.value));
    setStartNodeId(null);
    setHighlightedEdges([]);
  };

  const updateBinStatus = async (binId: string, newStatus: 'empty' | 'half-full' | 'full') => {
    // Immediate local update fallback layout
    setMapData(prevData => 
      prevData.map(landmark => ({
        ...landmark,
        wastebins: landmark.wastebins?.map((bin) => 
          bin.wastebin_id === binId ? { ...bin, status: newStatus } : bin
        )
      }))
    );
    
    // Live Supabase update execution trigger
    const result = await updateWastebin(binId, { status: newStatus });
    if (result.success) {
      await refreshActiveCanvasMap();
    } else {
      Alert.alert("Database Error", "Could not sync new status profile to servers.");
    }
  };

  // 4. Pathfinding Logic (The Brain)
  const runBFS = () => {
    if (!startNodeId) {
      Alert.alert("Select a Start Location", "Please tap a landmark icon node first to establish your path baseline source context.");
      return;
    }

    const adj: Record<string, string[]> = {};
    const binStatuses: Record<string, string> = {};

    // Map structural data vectors out from data arrays
    mapData.forEach(landmark => {
      landmark.wastebins?.forEach((bin) => {
        if (!adj[landmark.landmark_id]) adj[landmark.landmark_id] = [];
        adj[landmark.landmark_id].push(bin.wastebin_id);
        
        if (!adj[bin.wastebin_id]) adj[bin.wastebin_id] = [];
        adj[bin.wastebin_id].push(landmark.landmark_id);
        
        binStatuses[bin.wastebin_id] = bin.status;
      });
    });

    const queue = [startNodeId];
    const visited = new Set([startNodeId]);
    const parent: Record<string, string> = {};

    while (queue.length > 0) {
      const curr = queue.shift()!;
      
      if (binStatuses[curr] === 'full' || binStatuses[curr] === 'half-full') {
        const path = [];
        let temp = curr;
        while (parent[temp]) {
          path.push({ from: parent[temp], to: temp });
          temp = parent[temp];
        }
        setHighlightedEdges(path);
        Alert.alert("Route Compiled!", "Follow the map paths lines grid down to your target bin.");
        return;
      }

      for (const neighbor of (adj[curr] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent[neighbor] = curr;
          queue.push(neighbor);
        }
      }
    }
    Alert.alert("Clean Zone", "No full or half-full bins discovered inside this map selection cluster area.");
  };

  if (loading) return <ActivityIndicator size="large" style={styles.center} />;

  return (
    <View style={styles.container}>
      <View style={styles.dropdownContainer}>
        <AreaDropdown 
          data={areaData}
          placeholder="CHOOSE AREA"
          selectedValue={selectedAreaId}
          onSelect={handleAreaSelect} 
        />
      </View>
      
      <View style={styles.graphWindow}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[ 
            styles.canvas, 
            { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scaleValue }] }
          ]}
        >
          <NodalGraph 
            mapData={mapData}
            edges={edgesData}
            isDeleteMode={false}
            onNodePress={(id, type) => {
              if (type === 'landmark') {
                setStartNodeId(id);
                console.log(`BFS origin starting point lock assigned to Landmark ID: ${id}`);
              } else {
                setTargetBinId(id);
                setModalVisible(true);
              }
            }}
          />
        </Animated.View>

        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('IN')}>
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('OUT')}>
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BinStatusModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={(status) => {
          if (targetBinId) updateBinStatus(targetBinId, status);
          setModalVisible(false);
        }}
      />

      <TouchableOpacity style={styles.button} onPress={runBFS}>
        <Text style={styles.btnText}>Find Nearest Full Bin (BFS)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#EFFAFF', 
    padding: 20,
  },
  dropdownContainer: {
    zIndex: 10, 
    marginBottom: 20, 
    justifyContent: 'center',
  },
  graphWindow: {
    flex: 1, 
    backgroundColor: '#B6D7E8', 
    borderColor: '#6D6D6D',
    borderWidth: 3,
    overflow: 'hidden', 
    alignSelf: 'center',
    margin: s(5),
    width: '100%',
    height: 400,
    marginBottom: 20,
  },
  canvas: {
    width: 1000,
    height: 1000,
    justifyContent: 'flex-start',
    position: 'relative',
    alignItems: 'flex-start',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 4,
    zIndex: 20,
  },
  zoomBtn: {
    padding: 8,
    alignItems: 'center',
  },
  zoomText: { fontSize: 20, fontWeight: 'bold', color: '#1E56A0' },
  button: { 
    backgroundColor: '#D9EAD3', 
    padding: 15, 
    borderRadius: 10, 
    borderColor: '#097000',
    borderWidth: 3,
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  btnText: { color: '#097000', fontWeight: 'bold', letterSpacing: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});