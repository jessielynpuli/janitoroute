// 📝 Replace the top block of map.tsx down to IndexScreen() with this:

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Animated, PanResponder, TouchableOpacity } from 'react-native';
import AreaDropdown, { DropdownItem } from '@/components/areaDropdown'; 
import NodalGraph, { WastebinRow, LandmarkRow } from '@/components/GraphNodes';
import { ReportButton } from '@/components/ReportButton';
import { s } from 'react-native-size-matters';

// Import real API hooks from your queries
import { fetchAllAreas, fetchMapDataByArea } from '@/api/wastebins/wb_queries';
import { fetchNetworkEdges } from '@/api/edges/edges_queries';
import { DBEdge } from '@/api/edges/edges_queries';

export default function IndexScreen() {
  const [areaData, setAreaData] = useState<DropdownItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<LandmarkRow[]>([]);
  const [edgesData, setEdgesData] = useState<DBEdge[]>([]);

  // Zooming & Panning Animation States
  const [scaleValue] = useState(new Animated.Value(1));
  const pan = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;


  // 📝 Insert this code right below your state declarations inside IndexScreen():

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

  // 📝 Replace the old mock data useEffect statement with these synchronization blocks:

  // 1. Core data refreshing workers
  const refreshActiveCanvasMap = async () => {
    if (!selectedAreaId || selectedAreaId === "undefined") {
      setMapData([]);
      setEdgesData([]);
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

  // 2. Dropdown Area Initializer (Filters out admin CRUD choices like 'add_new')
  const loadAreas = async () => {
    try {
      const data = await fetchAllAreas();
      const dbAreas: DropdownItem[] = (data || []).map((area: any) => ({
        label: area.area_name,
        value: String(area.area_id), 
      }));
      setAreaData(dbAreas);
    } catch (error) {
      console.error("Error loading workspace areas:", error);
    }
  };

  // 3. Life Cycle Hooks
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

  const handleReportPress = () => console.log('Report clicked!');


  // 📝 Replace the return statement code inside map.tsx with this layout block:

  return (
    <View style={styles.container}>
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
            isDeleteMode={false} // Users cannot delete nodes
            onNodePress={(id, type) => console.log(`User clicked node context: ${type} - ${id}`)}
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

      <View style={styles.buttonWrapper}>
        <ReportButton onPress={handleReportPress}/>
      </View>
    </View>
  );
}
// 📝 Append the .canvas and .zoom styles inside your StyleSheet object at the bottom of map.tsx:
const styles = StyleSheet.create({
    container: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#EFFAFF', // Using the soft background color from your Figma image
    padding: 20,
  },
  dropdownContainer: {
    // CRITICAL: zIndex ensures the dropdown menu renders OVER the graph
    zIndex: 10, 
    marginBottom: 20, // Space between dropdown and graph
    justifyContent: 'center',
  },
  buttonWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,             // Spacing directly under the blue graph window
    marginBottom: 10,          // Spacing between the button and the nav bar
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