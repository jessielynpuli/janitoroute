import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- IMPORT COMPONENTS ---
import AreaDropdown, { DropdownItem } from '@/components/areaDropdown';
//import NodalGraph, { WastebinRow, LandmarkRow } from '@/components/GraphNodes';
import { AddAreaButton } from '@/components/addArea';
import { AddDetailsModal, PopupType } from '@/components/AddDetailsModal';
import { AddLandmarkButton } from '@/components/addLandmark';
import { AddTrashbinButton } from '@/components/addTrashbin';
import NodalGraph, { LandmarkRow } from '@/components/NodalGraph';
import { RemoveButton } from '@/components/RemoveButton';

// --- IMPORT API FUNCTIONS ---
import { DBEdge, fetchNetworkEdges, insertNetworkEdges, UIWeight, WEIGHT_MAP } from '@/api/edges/edges_queries';
import { AreaInput, createArea, createLandmark, createWastebin, deleteArea, deleteLandmark, deleteWastebin, fetchAllAreas, fetchMapDataByArea, updateLandmark, updateWastebin } from '@/api/wastebins/wb_queries';

import { s } from 'react-native-size-matters';

export default function IndexScreen() {
  // ==========================================
  // 1. STATE MANAGEMENT (useState)
  // ==========================================
  
  // Core Map Data States
  const [areaData, setAreaData] = useState<DropdownItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<LandmarkRow[]>([]);
  const [edgesData, setEdgesData] = useState<DBEdge[]>([]);
  
  // Zooming State
  const [scaleValue] = useState(new Animated.Value(1));
  
  // Modal & Popup Editing States
  const [modalVisible, setModalVisible] = useState(false);
  const [popupType, setActivePopupType] = useState<PopupType>(null);
  const [availableNodesList, setAvailableNodesList] = useState<Array<{ id: string; name: string; type: 'landmark' | 'wastebin' }>>([]);
  const [activeContext, setActiveContext] = useState<{
    x_position?: number;
    y_position?: number;
    area_id?: string;
    landmark_id?: string;
    edit_node_id?: string;
  }>({});
  
  // Canvas Interaction States
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [windowOffset, setWindowOffset] = useState({ x: 0, y: 0 });

  // ==========================================
  // 2. REFS & GESTURE RESPONDERS (useRef)
  // ==========================================

  // Calculates location boundaries of the graph window container
  const graphWindowRef = useRef<View>(null);

  // Pan (drag) references for the canvas layout
  const pan = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;

  // Handles drag interactions on the canvas and enforces edge boundaries
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
        
        // DEFINE CANVAS GRAPH GRID EDGE RESTRAINT BOUNDARIES (Adjust to fit your grid frame)
        const MAX_DRAG_LIMIT_X = 1000;
        const MAX_DRAG_LIMIT_Y = 1000;

        let currentX = (pan.x as any)._value;
        let currentY = (pan.y as any)._value;

        let targetX = currentX;
        let targetY = currentY;

        // Clamp Horizontal Axis Constraints
        if (currentX > MAX_DRAG_LIMIT_X) targetX = MAX_DRAG_LIMIT_X;
        if (currentX < -MAX_DRAG_LIMIT_X) targetX = -MAX_DRAG_LIMIT_X;

        // Clamp Vertical Axis Constraints
        if (currentY > MAX_DRAG_LIMIT_Y) targetY = MAX_DRAG_LIMIT_Y;
        if (currentY < -MAX_DRAG_LIMIT_Y) targetY = -MAX_DRAG_LIMIT_Y;

        // Smoothly snap back the map layout viewport if dragged past limits
        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  // ==========================================
  // 3. COMPUTED VARIABLES
  // ==========================================

  // Flattens the map data to list landmarks and wastebins together for modal choices
  const existingNodesList = mapData.flatMap((landmark) => {
    // 1. Add the landmark itself to the choices
    const nodes = [{ id: landmark.landmark_id, name: landmark.landmark_name, type: 'landmark' as const }];
    
    // 2. Add its connected wastebins to the choices
    const bins = (landmark.wastebins || []).map(bin => ({
      id: bin.wastebin_id, // Assuming your database wastebin row has an 'id'
      name: `🗑️ ${bin.description || 'Trashbin'}`,
      type: 'wastebin' as const
    }));

    return [...nodes, ...bins];
  });

  // ==========================================
  // 4. DATA FETCHING & SIDE EFFECTS (useEffect)
  // ==========================================

  // Fetches areas from Supabase to populate the dropdown
  const loadAreas = async (): Promise<DropdownItem[]> => {
    try {
      const data = await fetchAllAreas(); // Runs your real Supabase call
      
      // Create ONLY your real database area item arrays first
      const dbAreas: DropdownItem[] = (data || []).map((area: any) => ({
        label: area.area_name,
        value: String(area.area_id), 
      }));

      // Attach system control layout items for rendering display 
      setAreaData([
        ...dbAreas,
        { label: '+ Add New Area', value: 'add_new' },
        { label: '❌ Delete Current Area', value: 'delete_current' }
      ]);

      return dbAreas; // Return ONLY the valid DB elements array block!

    } catch (error) {
      console.error("Error loading areas into dropdown layout:", error);
      return[];
    }
  };

  // Reusable function to refresh the nodes on the active map viewport
  const refreshActiveCanvasMap = async () => {
    if (!selectedAreaId || selectedAreaId === "undefined") {
      setMapData([]);
      setEdgesData([]);
      return;
    }
    try{
      console.log("Fetching live map nodes for Area UUID:", selectedAreaId);
      const [nodesResult, edgesResult] = await Promise.all([
        fetchMapDataByArea(selectedAreaId),
        fetchNetworkEdges() // Fetches the connection framework
      ]);

      console.log("DEBUG: Edges fetched from Supabase:", edgesResult);

      if (nodesResult.success && Array.isArray(nodesResult.data)) {
        console.log(`Successfully loaded ${nodesResult.data.length} landmarks for this viewport.`);
        console.log("FIRST NODE DATA:", JSON.stringify(nodesResult.data[0], null, 2));
        setMapData(nodesResult.data as LandmarkRow[]); // Drop rows into state to trigger NodalGraph redraw
      } else {
        setMapData([]);
      }

      if (edgesResult) {
         setEdgesData(edgesResult);
      }

    } catch (error) {
      console.error("Failed to refresh canvas map:", error);
      setMapData([]);
      setEdgesData([]);
    }
  };

  // Worker function to gather map structures for connection dropdown listings
  const refreshModalDropdownOptions = async (areaId: string) => {
    if (!areaId || areaId === "undefined") {
      setAvailableNodesList([]);
      return;
    }

    try {
      console.log("Gathering all available nodes for dropdown sync... Area UUID:", areaId);
      
      // We can read directly from our existing mapData state since it already fetches 
      // landmarks AND joins their nested wastebins array for the current area!
      const formattedOptions: Array<{ id: string; name: string; type: 'landmark' | 'wastebin' }> = [];

      mapData.forEach((landmark) => {
        // A. Add the landmark row to the selection options list
        formattedOptions.push({
          id: landmark.landmark_id,
          name: `📍 Landmark: ${landmark.landmark_name}`,
          type: 'landmark'
        });

        // B. Add all its linked child wastebins to the selection options list
        if (landmark.wastebins && landmark.wastebins.length > 0) {
          landmark.wastebins.forEach((bin) => {
            formattedOptions.push({
              id: bin.wastebin_id,
              name: `🗑️ Trashbin: ${bin.description || 'Unnamed Bin'} (${bin.status})`,
              type: 'wastebin'
            });
          });
        }
      });

      console.log(`Dropdown synchronized with ${formattedOptions.length} connectable destination pathways.`);
      setAvailableNodesList(formattedOptions);

    } catch (error) {
      console.error("Failed to compile modal connection dropdown listings:", error);
      setAvailableNodesList([]);
    }
  };

  // Triggers loadAreas on component mount
  useEffect(() => {
    loadAreas();
  }, []);

  // Refreshes the canvas map whenever a new area is selected
  useEffect(() => {
    refreshActiveCanvasMap();
  }, [selectedAreaId]);

  // Keeps the dropdown list updated automatically whenever the active map changes
  useEffect(() => {
    refreshModalDropdownOptions(selectedAreaId ?? '');
  }, [mapData]); 


  // ==========================================
  // 5. EVENT HANDLERS
  // ==========================================

  // Controls scaling boundaries for zooming the canvas in and out
  const handleZoom = (type: 'IN' | 'OUT') => {
    let currentScale = (scaleValue as any)._value;
    let nextScale = type === 'IN' ? currentScale + 0.2 : currentScale - 0.2;

    // Boundary limits: Don't let it shrink past 40% or grow past 200%
    if (nextScale < 0.4) nextScale = 0.4;
    if (nextScale > 2.0) nextScale = 2.0;

      Animated.timing(scaleValue, {
      toValue: nextScale,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Helper to open the generic AddDetailsModal configuration
  const openPopup = (type: PopupType) => {
    setActivePopupType(type);
    setModalVisible(true);
  };

  // Mock workspace tap handler (sets dynamic tracking IDs before opening modal)
  const triggerAddNodeOnCanvas = (type: PopupType, clickX: number, clickY: number) => {
    setActiveContext({
      x_position: clickX,
      y_position: clickY,
      area_id: 'current-active-campus-area-uuid', // Dynamic ID context tracking
      landmark_id: 'current-active-landmark-uuid',
    });
    setActivePopupType(type);
    setModalVisible(true);
  };

  // Handles adding new areas, selecting existing areas, or deleting areas from dropdown
  const handleAreaSelect = async (item: DropdownItem) => {
    if (item.value === 'add_new') {
      openPopup('AREA');
      console.log('Open modal or prompt to add a new area!');
    } else if(item.value === 'delete_current') {
      if (!selectedAreaId) return;

      // Quick confirmation alert layout warning
      const confirmDelete = confirm("WARNING: Deleting this Area will permanently wipe out all its nested Landmarks, Wastebins, and Routing Edges. Do you want to continue?");
      
      if (confirmDelete) {
        const result = await deleteArea(selectedAreaId);
        if (result.success) {
          console.log("Area and all cascaded children removed from database.");
          // 2. Fetch fresh database data down right away to see what remains
          const remainingAreas = await loadAreas();
          
          // 3. Dynamic Fallback: Auto-route user view to the first remaining area slot if possible
          if (remainingAreas.length > 0) {
            setSelectedAreaId(String(remainingAreas[0].value));
          } else {
            setSelectedAreaId(null); // Completely clear the canvas view if zero records remain
          }
        } else {
          alert("Could not complete the request: " + result.error?.message);
        }
      }
    } else {
      setSelectedAreaId(String(item.value));
    }
  };

  // Captures the exact physical tap coordinates on the canvas and offsets them properly
  const handleCanvasPress = (event: any) => {
    // Ignore canvas clicks if the admin is trying to delete items
    if (isDeleteMode) return;

    // Extract the localized click position relative to the blue canvas grid boundaries
    const { pageX, pageY } = event.nativeEvent;

    // 3. Subtract the container's top-left offsets to get the exact relative click point
    let clickedX = pageX - windowOffset.x;
    let clickedY = pageY - windowOffset.y;

    // Safety Fallback: If calculation fails, don't let it write 0,0 blindly
    if (clickedX < 0) clickedX = 150;
    if (clickedY < 0) clickedY = 150;

    setClickCoords({ x: Math.round(clickedX), y: Math.round(clickedY) });
    console.log(`Canvas tapped at pixel grid matrix: X=${Math.round(clickedX)}, Y=${Math.round(clickedY)}`);
    
    // Open your AddDetailsModal container and set its context payload to 'LANDMARK'
    openPopup('LANDMARK'); 
  };

  // Handles clicking specific nodes to either open configs or permanently delete them
  const handleNodeInteraction = async (id: string, isLandmark: boolean, nodeDetails: any) => {
    const type = isLandmark ? 'landmark' : 'wastebin';
    
    if (isDeleteMode) {
      const confirmNodeDelete = confirm(
        `WARNING: Are you sure you want to permanently delete this ${type}? ${
          type === 'landmark' ? '(This will also cascade delete all its nested wastebins!)' : ''
        }`
      );

      if (confirmNodeDelete) {
        console.log(`Sending target delete query for execution: Type=${type}, ID=${id}`);
        // 2. Route dynamically to the correct database API function
        const result = type === 'landmark' 
          ? await deleteLandmark(id) 
          : await deleteWastebin(id);
        
        if (result.success) {
          console.log(`Successfully removed ${type} from the database cloud cluster.`);

          // ==========================================
          // OPTIMISTIC UPDATE: Instantly clear it off the screen!
          // ==========================================
          if (type === 'landmark') {
            // Remove the landmark (and inherently all its wastebins) from the state
            setMapData((prevData) => prevData.filter(node => node.landmark_id !== id));
          } 
          else if (type === 'wastebin') {
            // Dig into the nested arrays and filter out just the specific trashbin
         setMapData((prevData) => {
              // Create a completely fresh clone of the map data so React is forced to redraw
              const newData = prevData.map(node => {
                // If this specific landmark has wastebins, filter the deleted one out
                if (node.wastebins && node.wastebins.length > 0) {
                  const filteredBins = node.wastebins.filter(bin => bin.wastebin_id !== id);
                  return {
                    ...node,
                    wastebins: filteredBins
                  };
                }
                return node; // Leave nodes without wastebins completely alone
              });
              
              console.log("React state deeply updated! Redrawing map...");
              return newData;
            });
          }
          
          // 3. Trigger a quiet background re-fetch to clear the marker off the viewport canvas instantly
          await refreshActiveCanvasMap(); 
        } else {
          alert(`Could not delete the selected ${type}: ` + ((result.error as any)?.message || "Unknown error"));
        }
      }
    } else {
      console.log(`Normal mode tap: Admin opened configuration summary details for ${type} ID:`, id);
      setActiveContext(prev => ({
        ...prev,
        edit_node_id: id 
      }));

      const mappedPopupType: PopupType = type === 'landmark' ? 'LANDMARK' : 'TRASHBIN';
      
      // 3. Open the modal
      openPopup(mappedPopupType);
    }
  };

  // Auxiliary button handlers
  const handleLandmarkPress = () => console.log('Landmark clicked!');
  const handleTrashbinPress = () => console.log('Trashbin clicked!');
  const handleAreaPress = () => console.log('Area clicked!');
  const handleRemovePress = () => {
    setIsDeleteMode(!isDeleteMode);
    console.log('Delete Mode toggled via RemoveButton component to:', !isDeleteMode);
  };

  // Measure the window container position on layout bootup
  const handleWindowLayout = () => {
    graphWindowRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setWindowOffset({ x: pageX, y: pageY });
    });
  };

  // ==========================================
  // 6. MASTER DATABASE SAVE HANDLER (Modal Bundle)
  // ==========================================
  
  // Orchestrates area, landmark, and trashbin creation based on the payload type
  const handleSavePayload = async (bundle: {
    type: 'AREA' | 'LANDMARK' | 'TRASHBIN';
    nodeData: any;
    edgeData: any;
  }) => {

    console.log("--- ATTEMPTING SAVE ---");
    console.log("Node Type:", bundle.type);
    console.log("Edge Payload Received from Modal:", bundle.edgeData);

    try {
      if (!selectedAreaId) {
        alert("Please select a target area before modifying the map structure!");
        return;
      }
      
      // ==========================================
      // PHASE 1: EXECUTE AREA CREATION CRUD
      // ==========================================
      if (bundle.type === 'AREA') {
        console.log("Inserting new area into Supabase:", bundle.nodeData);
        
        const areaInput = bundle.nodeData as AreaInput; // Explicitly cast the type

        const result = await createArea({
          area_name: areaInput.area_name 
        });

        if (result.success) {
          console.log("Area created successfully in database!", result.data);
          
          // 2. Refresh the dropdown menu items list instantly
          const updatedAreas = await loadAreas();
          
          // 3. Auto-select the newly created area so the admin can start adding nodes to it immediately
          if (result.data?.id) {
            setSelectedAreaId(String(result.data.id));
          } else if (updatedAreas.length > 0) {
            // Fallback to the last item in the list if ID extraction fails
            setSelectedAreaId(String(updatedAreas[updatedAreas.length - 1].value));
          }
          
        } else {
          alert("Failed to create area: " + result.error?.message);
        }
        
        setModalVisible(false);
        return; // Stop here since Areas don't need network routing edge logic!
      }

      // ==========================================
      // PHASE 2: LANDMARK CREATION CRUD + LIVE EDGES
      // ==========================================
      if (bundle.type === 'LANDMARK') {
        // Define your canvas midpoints (Adjust based on your actual blue graphWindow layout dimensions)
        const START_CENTER_X = 250; 
        const START_CENTER_Y= 250;
        const STEP_OFFSET = 120; 
        const MAX_NODES_PER_ROW = 3;

        // Check how many nodes are already living in this specific area
        const existingCount = mapData.length;

        if (activeContext.edit_node_id) {
          const result = await updateLandmark(activeContext.edit_node_id, { landmark_name: bundle.nodeData.landmark_name });
          if (result.success) {
            setMapData((prevData) => 
              prevData.map(node => node.landmark_id === activeContext.edit_node_id 
                  ? { ...node, landmark_name: bundle.nodeData.landmark_name } : node)
            );
            await refreshActiveCanvasMap();
          } else {
             alert("Failed to update landmark: " + ((result.error as any)?.message || "Unknown error"));
          }
        } else {
  let finalCalculatedX = bundle.nodeData?.x_position ?? START_CENTER_X;
  let finalCalculatedY = bundle.nodeData?.y_position ?? START_CENTER_Y;

  // 1. Grid Pattern Engine logic
  if (!bundle.nodeData?.x_position && existingCount > 0) {
    const row = Math.floor(existingCount / MAX_NODES_PER_ROW);
    const column = existingCount % MAX_NODES_PER_ROW;
    finalCalculatedX = START_CENTER_X + (column * STEP_OFFSET);
    finalCalculatedY = START_CENTER_Y + (row * STEP_OFFSET);
  }

  // 2. Insert the landmark node
  const result = await createLandmark({
    area_id: selectedAreaId,
    landmark_name: bundle.nodeData.landmark_name,
    x_position: finalCalculatedX,
    y_position: finalCalculatedY,
  });

  if (result.success && result.data) {
    console.log("Landmark saved successfully!");
    
    // Safely extract the new ID from Supabase response
    const createdNode = Array.isArray(result.data) ? result.data[0] : result.data;
    const newLandmarkId = createdNode?.landmark_id;
    const edgeBundle = bundle.edgeData;

    // 3. Perform the clean edge insertion
    if (edgeBundle && newLandmarkId) {
      console.log(`Linking pathway edge: ${newLandmarkId} 🔗 ${edgeBundle.to_node_id}`);
      
      const numericalWeight = WEIGHT_MAP[edgeBundle.chosenUIWeight as UIWeight] ?? 1;
      
      const rawPayload = [{
        from_node_id: newLandmarkId,
        source_type: 'landmark' as const,
        to_node_id: edgeBundle.to_node_id,
        target_type: edgeBundle.target_type as 'landmark' | 'wastebin', 
        weight: numericalWeight,
      }];
      
      const edgeResult = await insertNetworkEdges(rawPayload);

      if (edgeResult.success) {
        console.log("Graph network routing edge saved successfully!");
      } else {
        console.error("Edge save failed:", edgeResult.error);
        alert("Landmark saved, but routing pathway connection failed.");
      }
    }

    // 4. RE-DRAW SCREEN WORKSPACE
    await refreshActiveCanvasMap(); 
  } else {
    alert("Failed to insert landmark: " + ((result.error as any)?.message || "Unknown Error"));
  }
}
    }

      // ==========================================
      // CASE 3: TRASHBIN/WASTEBIN CREATION CRUD
      // ==========================================
      else if (bundle.type === 'TRASHBIN') {
        if (activeContext.edit_node_id) {
        // --- EDIT EXISTING TRASHBIN ---
        console.log("Updating existing wastebin ID:", activeContext.edit_node_id);

        // Call your Supabase update function
        const result = await updateWastebin(activeContext.edit_node_id, {
          description: bundle.nodeData.description,
          status: bundle.nodeData.status, // Assuming your form passes back the new status
        });

        if (result.success) {
          console.log("Wastebin updated successfully!");

          // 1. OPTIMISTIC UPDATE: Dig into the nested array and update the exact bin instantly
          setMapData((prevData) => 
            prevData.map(node => ({
              ...node,
              wastebins: (node.wastebins || []).map(bin => 
                bin.wastebin_id === activeContext.edit_node_id
                  ? { 
                      ...bin, 
                      description: bundle.nodeData.description, 
                      status: bundle.nodeData.status 
                    }
                  : bin
              )
            }))
          );

          await refreshActiveCanvasMap(); // Instantly redraw the map with new data
        } else {
          alert("Failed to update wastebin: " + result.error?.message);
        }

      
      
      } else {
         // CREATE NEW WASTEBIN
        console.log("Inserting new wastebin into Supabase...");

        const targetLandmarkId = bundle.nodeData.landmark_id;

        if (!targetLandmarkId) {
          alert("Error: A trashbin must be linked to a parent landmark structure!");
          return;
        }
        const parentLandmark = mapData.find(l => l.landmark_id === targetLandmarkId);

          if (!parentLandmark) {
            alert("Error: Parent landmark could not be found on the map!");
            return;
          }

          // 2. Count how many bins already exist on this landmark so they don't stack
          const existingBinCount = parentLandmark.wastebins?.length || 0;

          // ==========================================
          // 3. ORBIT CALCULATION (Circular Distribution)
          // ==========================================
          const ORBIT_RADIUS = 80; // Distance in pixels from the landmark center (Adjust as needed)
          
          // Space each new bin 45 degrees apart (Math.PI / 4 radians)
          const angle = existingBinCount * (Math.PI / 4); 

          const autoX = parentLandmark.x_position + ORBIT_RADIUS * Math.cos(angle);
          const autoY = parentLandmark.y_position + ORBIT_RADIUS * Math.sin(angle);

          console.log(`Auto-positioning bin #${existingBinCount + 1} at X:${Math.round(autoX)}, Y:${Math.round(autoY)}`);

        const result = await createWastebin({
          landmark_id: targetLandmarkId,
          x_position: Math.round(autoX),
          y_position: Math.round(autoY),
          description: bundle.nodeData.description || 'New Trashbin',
          status: 'empty', 
        });

        if (result.success) {
          console.log("Wastebin created successfully!", result.data);
          await refreshActiveCanvasMap(); 
        } else {
          alert("Failed to create wastebin: " + result.error?.message);
        }
      }
    }
    
      setModalVisible(false);

    } catch (error) {
      console.error("Error running the area save routine layout orchestration:", error);
    }

    return;  
  };


  // ==========================================
  // 7. RENDER VIEW
  // ==========================================
  return (
    <View style={styles.container}>

        <View style = {styles.dropdownContainer}>
          {/* Dropdown Component nested*/}
                  <AreaDropdown 
                  data={areaData} 
                  placeholder="CHOOSE AREA" 
                  onSelect={handleAreaSelect}
                  selectedValue={selectedAreaId}
                  />
        </View>

        <View ref = {graphWindowRef} onLayout = {handleWindowLayout} style = {[styles.graphWindow, isDeleteMode && styles.graphWindowDeleteActive]}>
          <Text style={{ color: 'white' }}>Node and Graph Area (The Blue Square)</Text>
                  {/* PASS THE DATA STATE DOWN TO THE GRAPH COMPONENT */}
                              <Animated.View
                              {...panResponder.panHandlers}
                              style={[ //For zooming 
                              styles.canvas, 
                              { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scaleValue }] }
                            ]}>

                          {/* <Pressable style={StyleSheet.absoluteFill} onPress={handleCanvasPress} />*/}

                              <NodalGraph 
                              mapData ={mapData}
                              edges = {edgesData} 
                              isDeleteMode={isDeleteMode} 
                              onNodePress={handleNodeInteraction}/>
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
        
        <View style = {styles.buttonContainer}>
          <RemoveButton isActive = {isDeleteMode}
            onPress= {handleRemovePress}/>
        <View style = {styles.buttonWrapper}>
          <AddLandmarkButton onPress = {() => openPopup('LANDMARK')}/>
          <AddTrashbinButton onPress = {() => openPopup('TRASHBIN')}/>
          <AddAreaButton onPress = {() => openPopup('AREA')}/>
        </View>
        </View>
      
      <AddDetailsModal
  visible={modalVisible}
  type={popupType}
  onClose={() => {setModalVisible(false); setActiveContext({}); }}
  onSave={handleSavePayload}
  // CRITICAL: Hand down your tapped state coordinates explicitly here!
  contextData={{
    x_position: clickCoords.x,
    y_position: clickCoords.y,
    area_id: selectedAreaId ?? '',
    landmark_id: mapData.length > 0 ? mapData[0].landmark_id : undefined ,
    edit_node_id: activeContext.edit_node_id
  }}
  existingNodesList={availableNodesList} 
/>
    </View>
  );
}

// ==========================================
// 8. STYLES
// ==========================================
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
  placeholderDropdown: {
    height: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  graphWindow: {
    flex: 1, // Fills the rest of the available space
    backgroundColor: '#B6D7E8', // The "blue square"
    borderRadius: 0,
    borderColor: '#6D6D6D',
    borderWidth: 3,
    
    // CRITICAL: This is what creates the "window" effect. 
    // Anything drawn outside the bounds of this View is clipped.
    overflow: 'hidden', 
    alignSelf: 'center',
    margin: s(5),
    marginHorizontal: 20,
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
  buttonContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'row',
    alignContent: 'center',
    paddingHorizontal: 20,
    marginTop: 10,             // Spacing directly under the blue graph window
    marginBottom: 10,
  },
  // Add this inside your styles object:
  graphWindowDeleteActive: {
  borderColor: '#FF6B6B', // Flashes red when delete mode is active
  },
});