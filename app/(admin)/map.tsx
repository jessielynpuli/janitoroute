import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s } from 'react-native-size-matters';

// Component layout extensions
import AreaDropdown, { DropdownItem } from '@/components/areaDropdown';
import { BinStatusModal } from '@/components/BinStatusModal';
import NodalGraph, { LandmarkRow } from '@/components/GraphNodes';

// Import real API hooks from your queries
import { DBEdge, fetchNetworkEdges } from '@/api/edges/edges_queries';
import { fetchAllAreas, fetchMapDataByArea, updateWastebin } from '@/api/wastebins/wb_queries';

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  
  // Core Map and Infrastructure States
  const [areaData, setAreaData] = useState<DropdownItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<LandmarkRow[]>([]);
  const [edgesData, setEdgesData] = useState<DBEdge[]>([]);

  // --- BIN STATUS MODAL STATES ---
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [targetedBinId, setTargetedBinId] = useState<string | null>(null);

  // Zooming & Panning Animation States
  const [scaleValue] = useState(new Animated.Value(1));
  const pan = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;

  // 1. Initialize PanResponder for moving across the 1000x1000 matrix boundary
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

  // 3. Core data refreshing workers
  const refreshActiveCanvasMap = async () => {
    if (!selectedAreaId || selectedAreaId === "undefined") {
      setMapData([]);
      return;
    }
    try {
      const result = await fetchMapDataByArea(selectedAreaId);
      if (result.success && Array.isArray(result.data)) {
        setMapData(result.data as LandmarkRow[]);
      } else {
        setMapData([]);
      }
    } catch (error) {
      console.error("Failed to refresh user canvas map viewport:", error);
      setMapData([]);
    }
  };

  const refreshEdges = async () => {
    try {
      const edges = await fetchNetworkEdges();
      setEdgesData(edges);
    } catch (error) {
      console.error("Failed to sync edges into user layout viewport:", error);
    }
  };

  // 4. Dropdown Area Initializer 
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
      console.error("Error loading workspace areas:", error);
    }
  };

  // 5. Life Cycle Hooks
  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    refreshActiveCanvasMap();
    refreshEdges();
  }, [selectedAreaId]);

  const handleAreaSelect = (item: DropdownItem) => {
    setSelectedAreaId(String(item.value));
    console.log('User synced viewport area:', item.label);
  };

  // --- NODE INTERACTION ROUTER ---
  const handleNodePress = (id: string, type: 'landmark' | 'wastebin') => {
    if (type === 'wastebin') {
      setTargetedBinId(id);
      setStatusModalVisible(true);
    } else {
      console.log(`User clicked landmark anchor node context: ${id}`);
    }
  };

  // --- REPORT TRIGGER HANDLER ---
  const handleReportPress = () => {
    if (targetedBinId) {
      setStatusModalVisible(true);
    } else {
      Alert.alert("Select a Bin First", "Please tap any wastebin icon on the graph network first to configure its report status.");
    }
  };

  // --- DATABASE UPDATE SYNCHRONIZER ---
  const handleStatusUpdate = async (newStatus: 'empty' | 'half-full' | 'full') => {
    if (!targetedBinId) return;

    console.log(`[DB UPDATE] Sending status report for Bin ${targetedBinId} to: ${newStatus}`);

    try {
      const result = await updateWastebin(targetedBinId, { 
        status: newStatus 
      });

      if (result.success) {
        Alert.alert("Report Submitted", "Thank you! The bin status update has been broadcasted.");
        await refreshActiveCanvasMap();
      } else {
        // Fallback local update UI mapping optimization if offline/network error happens
        setMapData((prevData) =>
          prevData.map((landmark) => ({
            ...landmark,
            wastebins: landmark.wastebins?.map((bin) =>
              bin.wastebin_id === targetedBinId ? { ...bin, status: newStatus } : bin
            ),
          }))
        );
        console.error("Failed to sync report state to database:", result.error);
      }
    } catch (error) {
      console.error("Error during wastebin status transaction:", error);
    }

    setStatusModalVisible(false);
    // Note: We keep the targetedBinId active so they can hit the 'Report' CTA multiple times if needed, 
    // or you can clear it based on preference. Clearing it here forces them to select again.
    setTargetedBinId(null);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 85 }]}>
      <View style={styles.dropdownContainer}>
        <AreaDropdown 
          data={areaData} 
          placeholder="CHOOSE AREA" 
          onSelect={handleAreaSelect} 
          selectedValue={selectedAreaId}
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
            onNodePress={handleNodePress}
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

      {/* Action overlay dialog window popup context */}
      <BinStatusModal 
        visible={statusModalVisible}
        onClose={() => {
          setStatusModalVisible(false);
          setTargetedBinId(null);
        }}
        onSelect={handleStatusUpdate}
      />
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
  buttonWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,             
    marginBottom: 10,          
  },
  graphWindow: {
    flex: 1, 
    backgroundColor: '#B6D7E8', 
    borderRadius: 0,
    borderColor: '#6D6D6D',
    borderWidth: 3,
    overflow: 'hidden', 
    alignSelf: 'center',
    margin: s(5),
    width: '100%',
    height: 400,
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
  },
  zoomBtn: {
    padding: 8,
    alignItems: 'center',
  },
  zoomText: { fontSize: 20, fontWeight: 'bold', color: '#1E56A0' },
});