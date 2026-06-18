import { Colors } from '@/constants/theme';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Button, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { s } from 'react-native-size-matters';
import { useRouter } from 'expo-router';

// Component layout extensions
import HelpButton from '@/components/HelpButton';
import MenuButton from '@/components/MenuButton';
import AreaDropdown, { DropdownItem } from '@/components/areaDropdown'; 
import NodalGraph, { WastebinRow, LandmarkRow } from '@/components/GraphNodes';
import Sidebar from '@/components/SideBar';
import { BinStatusModal } from '@/components/BinStatusModal';

// Real API integration points
import { updateWastebin, fetchAllAreas, fetchMapDataByArea } from '@/api/wastebins/wb_queries'; 
import { fetchNetworkEdges, DBEdge } from '@/api/edges/edges_queries';
import JanitorScreen from '@/app/(janitor)/janitor';

type Role = 'ADMIN' | 'JANITOR' | 'GUEST';

export default function HomeScreen() {
  // Core Map and Infrastructure States
  const [areaData, setAreaData] = useState<DropdownItem[]>([]); 
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null); 
  const [mapData, setMapData] = useState<LandmarkRow[]>([]);
  const [edgesData, setEdgesData] = useState<DBEdge[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const router = useRouter();
  
  // -- currentRole for sidebar menu
  const [currentRole, setCurrentRole] = useState<Role>('GUEST'); 

  // --- BIN STATUS MODAL STATES ---
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [targetedBinId, setTargetedBinId] = useState<string | null>(null);

  // --- ZOOMING & PANNING ANIMATION STATES ---
  const [scaleValue] = useState(new Animated.Value(1));
  const pan = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;

  // Initialize Canvas Grid PanResponder matrix boundary
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

  // Zoom Button Handlers
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

  // --- DATABASE DATA FRESHENERS ---
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

  const refreshActiveCanvasMap = async () => {
    if (!selectedAreaId) return;
    try {
      const result = await fetchMapDataByArea(selectedAreaId);
      if (result.success && Array.isArray(result.data)) {
        setMapData(result.data as LandmarkRow[]);
      }
    } catch (error) {
      console.error("Home viewport hydration error:", error);
    }
  };

  const refreshEdges = async () => {
    try {
      const edges = await fetchNetworkEdges();
      setEdgesData(edges);
    } catch (error) {
      console.error("Home edge hydration error:", error);
    }
  };

  // Initializing lifecycle load
  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    refreshActiveCanvasMap();
    refreshEdges();
  }, [selectedAreaId]);

  // Dropdown option click coordinator
  const handleAreaSelect = (item: DropdownItem) => {
    setSelectedAreaId(String(item.value));
    console.log('User synced layout viewport area to:', item.label);
  };

  // --- NODE TOUCH CONTROLLER INTERCEPT ---
  const handleNodePress = (id: string, type: 'landmark' | 'wastebin') => {
    if (type === 'wastebin') {
      setTargetedBinId(id);
      setStatusModalVisible(true);
    } else {
      console.log(`User clicked landmark anchor node context: ${id}`);
    }
  };

  const handleStatusUpdate = async (newStatus: 'empty' | 'half-full' | 'full') => {
    if (!targetedBinId) return;

    console.log(`[DB UPDATE] Sending status change for Bin ${targetedBinId} to: ${newStatus}`);

    try {
      const result = await updateWastebin(targetedBinId, { 
        status: newStatus 
      });

      if (result.success) {
        console.log("Successfully synchronized bin status with Supabase!");
        await refreshActiveCanvasMap();
      } else {
        setMapData((prevData) =>
          prevData.map((landmark) => ({
            ...landmark,
            wastebins: landmark.wastebins?.map((bin) =>
              bin.wastebin_id === targetedBinId ? { ...bin, status: newStatus } : bin
            ),
          }))
        );
        console.error("Failed to sync status to database:", result.error);
      }
    } catch (error) {
      console.error("Error during wastebin database status update:", error);
    }

    setStatusModalVisible(false);
    setTargetedBinId(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      
      {/* Main App Navigation Bar Row */}
      <View style={styles.header}>
        <MenuButton onPress={() => setIsSidebarOpen(true)} />
        <Text style={[styles.welcomeText, { color: Colors.text }]}>
          Janitoroute - {currentRole === 'JANITOR' ? 'Janitor Portal' : 'Home Screen'}
        </Text>
        <HelpButton onPress={() => console.log('Help opened!')} />
      </View>

      {/* Sidebar Drawer Layout Toggle Container */}
      {isSidebarOpen && (
        <Sidebar 
          currentRole={currentRole}
          onClose={() => setIsSidebarOpen(false)}
          onRoleChange={(newRole: Role) => {
            setCurrentRole(newRole);
            setIsSidebarOpen(false); 

            if (newRole === 'ADMIN') {
              router.replace('/(admin)/map'); 
            }
          }}
        />
      )}    

      {/* ========================================================= */}
      {/* PLACE CONDITIONAL WORKSPACE SWITCHER HERE              */}
      {/* ========================================================= */}
      {currentRole === 'JANITOR' ? (
        <JanitorScreen />
      ) : (
        <>
          {/* INTEGRATED AREA SELECTOR DROPDOWN MODULE CONTAINER */}
          <View style={styles.dropdownContainer}>
            <AreaDropdown 
              data={areaData} 
              placeholder="CHOOSE AREA" 
              onSelect={handleAreaSelect} 
              selectedValue={selectedAreaId}
            />
          </View>

          {/* Admin Quick Shortcut Navigation Toggle */}
          <Button 
            title="Test Admin View" 
            onPress={() => router.push('/(admin)/edit_map')} 
          />

          {/* Full Map viewport frame inside home layout content window */}
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

            {/* Float Control Layer modules */}
            <View style={styles.zoomControls}>
              <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('IN')}>
                <Text style={styles.zoomText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('OUT')}>
                <Text style={styles.zoomText}>−</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action overlay dialog window popup layout */}
          <BinStatusModal 
            visible={statusModalVisible}
            onClose={() => {
              setStatusModalVisible(false);
              setTargetedBinId(null);
            }}
            onSelect={handleStatusUpdate}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingTop: s(20),
    marginTop: s(20),
  },
  dropdownContainer: {
    zIndex: 10, 
    paddingHorizontal: s(20),
    marginVertical: s(10),
    justifyContent: 'center',
  },
  graphWindow: {
    flex: 1, 
    backgroundColor: '#B6D7E8', 
    borderColor: '#6D6D6D',
    borderWidth: 3,
    overflow: 'hidden', 
    alignSelf: 'center',
    margin: s(20),
    width: '90%',
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
    zIndex: 10,
  },
  zoomBtn: {
    padding: 8,
    alignItems: 'center',
  },
  zoomText: { fontSize: 20, fontWeight: 'bold', color: '#1E56A0' },
});