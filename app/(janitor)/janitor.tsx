import { fetchAllAreas } from '@/api/wastebins/wb_queries';
import AreaDropdown from '@/components/areaDropdown';
import NodalGraph from '@/components/NodalGraph';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BinStatusModal } from '@/components/BinStatusModal';

import { MOCK_DATABASE_BY_AREA } from '@/constants/interfaceData';

export default function JanitorScreen() {
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [targetBinId, setTargetBinId] = useState<string | null>(null);
    
  // Janitor Logic States
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [highlightedEdges, setHighlightedEdges] = useState<Array<{ from: string; to: string }>>([]);

  const updateBinStatus = (binId: string, newStatus: string) => {
  // Update local mapData state to trigger immediate re-render
  setMapData(prevData => 
    prevData.map(landmark => ({
      ...landmark,
      wastebins: landmark.wastebins.map((bin: any) => 
        bin.wastebin_id === binId ? { ...bin, status: newStatus } : bin
      )
    }))
  );
  
  // OPTIONAL: Add an API call here to persist to Supabase
  // await updateWastebin(binId, { status: newStatus });
};

  // 1. Initial Load: Fetch Areas
  useEffect(() => {
    fetchAllAreas().then(data => {
      setAreas(data);
      if (data.length > 0) setSelectedAreaId(data[0].area_id);
      setLoading(false);
    });
  }, []);

  // 2. Fetch Map Data whenever Area changes
    useEffect(() => {
    // Just load the mock data directly. No API calls, no errors, no waiting.
    if (selectedAreaId && MOCK_DATABASE_BY_AREA[selectedAreaId]) {
        setMapData(MOCK_DATABASE_BY_AREA[selectedAreaId]);
        setLoading(false); // Stop the loading spinner immediately
    }
    }, [selectedAreaId]);

  // 3. BFS Logic (The "Brain")
  const runBFS = () => {
    if (!startNodeId) {
      Alert.alert("Select a Node", "Please tap a landmark or bin first.");
      return;
    }

    // Build Adjacency List dynamically from live mapData
    const adj: Record<string, string[]> = {};
    const binStatuses: Record<string, string> = {};

    mapData.forEach(landmark => {
      landmark.wastebins.forEach((bin: any) => {
        if (!adj[landmark.landmark_id]) adj[landmark.landmark_id] = [];
        adj[landmark.landmark_id].push(bin.wastebin_id);
        binStatuses[bin.wastebin_id] = bin.status;
      });
    });

    // BFS Search
    const queue = [startNodeId];
    const visited = new Set([startNodeId]);
    const parent: Record<string, string> = {};

    while (queue.length > 0) {
      const curr = queue.shift()!;
      
      if (binStatuses[curr] === 'full') {
        const path = [];
        let temp = curr;
        while (parent[temp]) {
          path.push({ from: parent[temp], to: temp });
          temp = parent[temp];
        }
        setHighlightedEdges(path);
        Alert.alert("Route Found!", "Follow the highlighted path to the full bin.");
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
    Alert.alert("All Clear", "No full bins found in this area!");
  };

  if (loading) return <ActivityIndicator style={styles.center} />;

  return (
    <View style={styles.container}>
      <AreaDropdown 
        data={areas.map(a => ({ label: a.area_name, value: a.area_id }))}
        placeholder="CHOOSE AREA"
        selectedValue={selectedAreaId}
        onSelect={(item: { label: string; value: string }) => setSelectedAreaId(item.value)}      />
      
      <View style={styles.graphWrapper}>
        <NodalGraph 
          mapData={mapData}
          edges={[]}
          isDeleteMode={false}
          highlightedEdges={highlightedEdges}
          onNodePress={(id, isLandmark, nodeDetails) => {
    // 1. If it's a landmark, just set it as the start node
    if (isLandmark) {
      setStartNodeId(id);
      return;
    } else {
      setTargetBinId(id);
      setModalVisible(true);
    }

    // 2. If it's a wastebin, show the toggle alert
    Alert.alert(
      "Update Bin Status",
      `Current Status: ${nodeDetails.status}`,
      [
        { text: "Empty", onPress: () => updateBinStatus(id, 'empty') },
        { text: "Half-Full", onPress: () => updateBinStatus(id, 'half-full') },
        { text: "Full", onPress: () => updateBinStatus(id, 'full') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  }}
        />
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
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  graphWrapper: { flex: 1, marginVertical: 20, borderWidth: 1, borderColor: '#ccc' },
  button: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center' }
});