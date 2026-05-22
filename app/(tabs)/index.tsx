import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions } from 'react-native';
import Svg, {Line, Circle, Text as SvgText } from 'react-native-svg';
import { Image } from 'expo-image'; //idk para san to huhu

// hindi po ito ginamit. but di ko dinelete, baka magamit
import { mockBins, mockEdges, Bin } from '@/components/mockData'; // Adjust path based on your folder
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

// Imported APIs
import { fetchAllAreas, fetchMapDataByArea, updateWastebin } from '@/api/wastebins/wb_queries';
import { fetchNetworkEdges } from '@/api/edges/edges_queries'
// use @/api/folder or filename to import apis

//auto window?
const {width} = Dimensions.get('window');
const SVG_CONTAINER_SIZE = width - 40; //dynamic size with padding
const DB_GRID_MAX = 1000;


//eto default screen. wala me magets dyan, gemini-generated haha. use console.log to check errors. try using web to inspect console
export default function UnifiedGraphScreen() {
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBin, setSelectedBin] = useState<any>(null);

  // 1. INITIALIZE: Load Dropdown Filter Areas
  useEffect(() => {
    async function loadInitialData() {
      try {
        console.log("Requesting areas list from supabase...");
        const areaList = await fetchAllAreas();
        console.log("Received areas array ->", JSON.stringify(areaList));

        setAreas(areaList);

        if (areaList && areaList.length > 0) {
          console.log("Setting default area ID to:", areaList[0].area_id);
          // Default to the first available campus wing/area automatically
          setSelectedAreaId(areaList[0].area_id);
        } else {
          console.log("The areas table returned an empty array. Seed your database rows");
        }
      } catch (err) {
        Alert.alert("Network Error", "Could not talk to Supabase cloud.");
      }
    }
    loadInitialData();
  }, []);

  // 2. DATA BINDING HYDRATION: Refetch map layout whenever the area filter shifts
  useEffect(() => {
    if (!selectedAreaId) {
      console.log("Hydration blocked: selectedAreaId is empty.");
      return;
    }

    async function loadMapLayout() {
      console.log("Attempting to contact Supabase for Area ID:", selectedAreaId);
      setLoading(true);
      try {
        const structuralNodes = await fetchMapDataByArea(selectedAreaId);
        console.log("Successfully fetched Landmarks:", structuralNodes.length);

        const physicalPaths = await fetchNetworkEdges();
        console.log("Successfully fetched Network Edges:", physicalPaths.length);

        setLandmarks(structuralNodes);
        setEdges(physicalPaths);
      } catch (err: any) {
        console.error("Supabase transaction crashed:", err);

        Alert.alert(
          "Supabase Sync Failed",
          `Error Message: ${err?.message || err || "Unknown Connection Timeout"}`
        );
      } finally {
        setLoading(false);
      }
    }
    loadMapLayout();
  }, [selectedAreaId]);

  // Helper: Converts strict DB coordinates into responsive screen pixels
  const getResponsiveCoords = (pos: number) => {
    return (Number(pos) / DB_GRID_MAX) * SVG_CONTAINER_SIZE;
  };

  // Helper: Looks through our active dataset to find the exact x/y of ANY node id
  const findNodePosition = (nodeId: string) => {
    // Check if the target ID belongs to a Landmark node
    const foundLandmark = landmarks.find(l => l.landmark_id === nodeId);
    if (foundLandmark) {
      return {
        x: getResponsiveCoords(foundLandmark.x_position),
        y: getResponsiveCoords(foundLandmark.y_position)
      };
    }

    // Check if the target ID belongs to a nested Wastebin node
    for (const land of landmarks) {
      const foundBin = land.wastebins?.find((b: any) => b.wastebin_id === nodeId);
      if (foundBin) {
        // 🌟 CO-LEAD MATH: Render wastebins 35 pixels up and right from parent landmark location
        return {
          x: getResponsiveCoords(land.x_position) + 35,
          y: getResponsiveCoords(land.y_position) - 35
        };
      }
    }
    return null;
  };

  // 3. STUDENT HANDLER: Fire reporting changes right up to Supabase
  const handleReportSubmit = async (newStatus: 'half-full' | 'full') => {
    if (!selectedBin) return;

    const result = await updateWastebin(selectedBin.wastebin_id, {status: newStatus});
    if (result.success) {
      // Optimistic layout update so the color updates on screen instantly without reloading
      setLandmarks(prev => prev.map(land => ({
        ...land,
        wastebins: land.wastebins?.map((b: any) => 
          b.wastebin_id === selectedBin.wastebin_id ? { ...b, status: newStatus } : b
        )
      })));
      Alert.alert("Success", "Condition reported directly to server logs.");
    } else {
      Alert.alert("Failed", "Could not complete report transaction.");
    }
    setSelectedBin(null);
  };

  
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Syncing Grid Network Layout...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <Text style={styles.header}>JanitoRoute Map</Text>
      
      {/* AREA FILTER SELECTOR BUTTONS */}
      <View style={styles.dropdownFake}>
        {areas.map((area) => (
          <TouchableOpacity 
            key={area.area_id} 
            style={[styles.areaTab, selectedAreaId === area.area_id && styles.activeTab]}
            onPress={() => setSelectedAreaId(area.area_id)}
          >
            <Text style={[styles.tabText, selectedAreaId === area.area_id && styles.activeTabText]}>
              {area.area_name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* GRAPH CANVAS DISPLAY */}
      <View style={styles.canvasContainer}>
        <Svg height={SVG_CONTAINER_SIZE} width={SVG_CONTAINER_SIZE}>
          
          {/* A. DRAW DYNAMIC CLOUD EDGES (PATHWAYS) */}
          {edges.map((edge) => {
            const sourcePos = findNodePosition(edge.from_node_id);
            const targetPos = findNodePosition(edge.to_node_id);

            // Skip rendering if nodes live on an unselected area wing right now
            if (!sourcePos || !targetPos) return null;

            return (
              <Line
                key={edge.edge_id}
                x1={sourcePos.x} y1={sourcePos.y}
                x2={targetPos.x} y2={targetPos.y}
                stroke={edge.weight > 3 ? '#e57373' : '#b0bec5'} // Red lines for complex path difficulties
                strokeWidth={edge.weight > 3 ? "5" : "3"}
                pointerEvents="none"
              />
            );
          })}

          {/* B. DRAW PRIMARY LANDMARK NODES */}
          {landmarks.map((landmark) => {
            const rx = getResponsiveCoords(landmark.x_position);
            const ry = getResponsiveCoords(landmark.y_position);

            return (
              <React.Fragment key={landmark.landmark_id}>
                {/* Visual Connector String to its own physical trash bins */}
                {landmark.wastebins?.map((bin: any) => {
                  const bx = rx + 35;
                  const by = ry - 35;
                  return (
                    <Line 
                      key={`bin-string-${bin.wastebin_id}`}
                      x1={rx} y1={ry} x2={bx} y2={by}
                      stroke="#90a4ae" strokeWidth="2" strokeDasharray="4,4"
                      pointerEvents="none"
                    />
                  );
                })}

                {/* Base Landmark Node */}
                <Circle
                  cx={rx} cy={ry} r="22"
                  fill="#ffffff" stroke="#1a237e" strokeWidth="3"
                />
                <SvgText x={rx} y={ry + 4} fontSize="9" fontWeight="bold" fill="#1a237e" textAnchor="middle">
                  Node
                </SvgText>

                {/* C. DRAW NESTED WASTEBIN NODES (Sits at computed offset targets) */}
                {landmark.wastebins?.map((bin: any) => {
                  const bx = rx + 35;
                  const by = ry - 35;
                  const binColor = bin.status === 'full' ? '#d9534f' : bin.status === 'half-full' ? '#f0ad4e' : '#5cb85c';

                  return (
                    <Circle
                      key={bin.wastebin_id}
                      cx={bx} cy={by} r="14"
                      fill={binColor} stroke="#ffffff" strokeWidth="2"
                      onPress={() => setSelectedBin({ ...bin, parentName: landmark.landmark_name })}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* DETAILED STUDENT POPUP ACTION SHEET */}
      {selectedBin && (
        <View style={styles.popup}>
          <Text style={styles.popupTitle}>Reporting Node Condition</Text>
          <Text style={styles.popupSub}>Location: {selectedBin.parentName}</Text>
          <Text style={styles.popupDesc}>Current Logged Status: <Text style={{fontWeight:'bold'}}>{selectedBin.status.toUpperCase()}</Text></Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f0ad4e' }]} onPress={() => handleReportSubmit('half-full')}>
              <Text style={styles.btnText}>Mark Half-Full</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#d9534f' }]} onPress={() => handleReportSubmit('full')}>
              <Text style={styles.btnText}>Mark Full</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedBin(null)}>
            <Text style={styles.cancelText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// eto parang css. i know dapat bukod na file 'to. you may move nalang eto
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9', padding: 20, paddingTop: 60, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#546e7a', fontWeight: '500' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1a237e', marginBottom: 15 },
  dropdownFake: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: 15 },
  areaTab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#e0e0e0' },
  activeTab: { backgroundColor: '#1a237e' },
  tabText: { fontSize: 12, color: '#37474f', fontWeight: '600' },
  activeTabText: { color: '#ffffff' },
  canvasContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  popup: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#ffffff', padding: 22, borderRadius: 20, elevation: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 },
  popupTitle: { fontSize: 18, fontWeight: 'bold', color: '#263238' },
  popupSub: { fontSize: 14, color: '#546e7a', marginVertical: 2 },
  popupDesc: { fontSize: 13, color: '#78909c', marginBottom: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionButton: { flex: 1, padding: 14, borderRadius: 10, marginHorizontal: 6, alignItems: 'center' },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  cancelButton: { marginTop: 16, alignItems: 'center' },
  cancelText: { color: '#90a4ae', fontWeight: '600' }
});