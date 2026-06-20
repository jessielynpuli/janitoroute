import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, PanResponder, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import components
import AreaDropdown, { DropdownItem } from '@/components/areaDropdown';
import NodalGraph, { LandmarkRow } from '@/components/GraphNodes'; // will change to bfs
//import nodeCoordinates from '@/components/GraphNodes';
import { AddAreaButton } from '@/components/addArea';
import { AddDetailsModal, PopupType } from '@/components/AddDetailsModal';
import { AddLandmarkButton } from '@/components/addLandmark';
import { AddTrashbinButton } from '@/components/addTrashbin';
import { RemoveButton } from '@/components/RemoveButton';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

//import api functions
import { DBEdge, fetchNetworkEdges, insertNetworkEdges, UIWeight, WEIGHT_MAP } from '@/api/edges/edges_queries';
import { createArea, createLandmark, createWastebin, deleteArea, deleteLandmark, deleteWastebin, fetchAllAreas, fetchMapDataByArea, updateLandmark, updateWastebin } from '@/api/wastebins/wb_queries';
import { s } from 'react-native-size-matters';

import { buildNodeCoordinates } from '@/hooks/graphUtils';



// Then in your component:

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  
  const [areaData, setAreaData] = useState<DropdownItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<LandmarkRow[]>([]);
  //for zooming
  const [scaleValue] = useState(new Animated.Value(1));
  
  // for node
  const nodeCoordinates = useMemo(() => buildNodeCoordinates(mapData), [mapData]);

  //for edges
  const [edgesData, setEdgesData] = useState<DBEdge[]>([]);
  
  const refreshEdges = async () => {
  try {
    const edges = await fetchNetworkEdges();
    console.log("DEBUG: Refreshing Edges State:", edges); // You MUST see your data here
    setEdgesData(edges);
  } catch (error) {
    console.error("DEBUG: Failed to fetch edges:", error);
  }
};

console.log("EDGES DATA: " , edgesData)

    

const pan = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;

// Locate your PanResponder initialization ref in edit_map.tsx:
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
        useNativeDriver: true,
        friction: 7,
      }).start();
    },
  })
).current;

  //zoom
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
  //until here zooming

  // for popup modal editing
  const [modalVisible, setModalVisible] = useState(false);
  const [popupType, setActivePopupType] = useState<PopupType>(null);

  const [editingNode, setEditingNode] = useState<{
    id: string;
    type: 'landmark' | 'wastebin';
    name: string;
  } | null>(null);

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

  // State tracking context info generated by UI interactions
  const [activeContext, setActiveContext] = useState<{
    x_position?: number;
    y_position?: number;
    area_id?: string;
    landmark_id?: string;
  }>({});

  // Mock workspace tap handler
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

  // Handles any valid structured payload outputted by the Modal layer
  // 1. Update the parameter signature to accept the bundle layout
const handleSavePayload = async (bundle: {
  type: 'AREA' | 'LANDMARK' | 'TRASHBIN';
  nodeData: any;
  edgeData: any;
}) => {
  

  try {
    const createEdge = async (
            fromId: string, 
            fromType: 'landmark' | 'wastebin', 
            toId: string, 
            toType: 'landmark' | 'wastebin',
            weight: number = 1
          ) => {
            return await insertNetworkEdges([{
              from_node_id: fromId,
              to_node_id: toId,
              source_type: fromType.toLowerCase() as 'landmark' | 'wastebin',
              target_type: toType.toLowerCase() as 'landmark' | 'wastebin',
              weight: 1
            }]);
          };
    if (editingNode) {
      console.log(`[EDIT] Updating ${editingNode.type} ID: ${editingNode.id}`);
       console.log(`[EDIT] Received bundle nodeData:`, bundle.nodeData);
        //console.log(`Updating existing ${editingNode.type} Node ID: ${editingNode.id} with data:`, bundle.nodeData);
        
        let result;
        if (editingNode.type === 'landmark') {
          const newName = bundle.nodeData.landmark_name || bundle.nodeData.name || bundle.nodeData.description;
          result = await updateLandmark(editingNode.id, {
            landmark_name: newName,
            // optionally pass updated coordinates if your details modal modifies them
          });
        } else {
          const newDescription = bundle.nodeData.description || bundle.nodeData.landmark_name || bundle.nodeData.name;
          result = await updateWastebin(editingNode.id, {
            description: newDescription,
          });
        }

        // Handle edge connection modifications if edgeData details are passed from the modal
        if (bundle.edgeData?.to_node_id) {
          console.log(`Formulating updated edge mapping connection to target node: ${bundle.edgeData.to_node_id}`);
          await insertNetworkEdges([{
            from_node_id: editingNode.id,
            to_node_id: bundle.edgeData.to_node_id,
            source_type: editingNode.type,
            target_type: bundle.edgeData.target_type || 'landmark',
            weight: 1
          }]);
        }

        if (result?.success) {
          Alert.alert("Success", `${editingNode.type === 'landmark' ? 'Landmark' : 'Wastebin'} updated successfully.`);
          await refreshActiveCanvasMap();
          await refreshEdges();
        } else {
          Alert.alert("Error", "Failed to update node properties: " + (result?.error?.message || "Unknown error"));
        }

        // Clean up state tracking setups
        setEditingNode(null);
        setModalVisible(false);
        return;
      }
    
    
    // ==========================================
    // PHASE 1: EXECUTE AREA CREATION CRUD
    // ==========================================
    if (bundle.type === 'AREA') {
      console.log("Inserting new area into Supabase:", bundle.nodeData);
      
      const result = await createArea({
        area_name: bundle.nodeData.area_name 
      });

      if (result.success) {
        console.log("Area created successfully in database!", result.data);
        
        // 2. Refresh the dropdown menu items list instantly
        const updatedAreas = await loadAreas();
        
        // 3. Auto-select the newly created area so the admin can start adding nodes to it immediately
        if (result.data?.area_id) { 
          setSelectedAreaId(String(result.data.area_id));
        } else if (updatedAreas.length > 0) {
          // Fallback to the first item in the list
          setSelectedAreaId(String(updatedAreas[0].value));
        }
            
      } else {
        Alert.alert("Failed to create area: " + result.error?.message);
      }
      
      setModalVisible(false);
      return; // Stop here since Areas don't need network routing edge logic!
    }

    if (!selectedAreaId) {
      Alert.alert("Please select a target area before modifying the map structure!");
      return;
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

      let finalCalculatedX = bundle.nodeData?.x_position ?? clickCoords.x;
      let finalCalculatedY = bundle.nodeData?.y_position ?? clickCoords.y;

      // 2. Grid engine layout rule if no valid click interaction properties exist
  if (!finalCalculatedX || finalCalculatedX === 0 || !finalCalculatedY || finalCalculatedY === 0) {
    if (existingCount > 0) {
      const row = Math.floor(existingCount / MAX_NODES_PER_ROW);
      const column = existingCount % MAX_NODES_PER_ROW;
      
      finalCalculatedX = START_CENTER_X + (column * STEP_OFFSET);
      finalCalculatedY = START_CENTER_Y + (row * STEP_OFFSET);
      console.log(`Grid Engine applied coordinates layout index #${existingCount}: Row ${row}, Col ${column}`);
    } else {
      finalCalculatedX = START_CENTER_X;
      finalCalculatedY = START_CENTER_Y;
      console.log("Grid Engine positioning root baseline anchor at center canvas framework.");
    }
  }

  // 3. ✨ ANTI-STACKING RADIUS ENGINE
  // Checks if any node shares these exact coordinates, shifting it by an offset if so
  let isOverlapping = true;
  let safetyLoopCounter = 0; // Prevent infinite loops if map gets extremely crowded

  while (isOverlapping && safetyLoopCounter < 20) {
    const overlappingNode = mapData.find(landmark => 
      Math.abs(Number(landmark.x_position) - finalCalculatedX) < 30 && 
      Math.abs(Number(landmark.y_position) - finalCalculatedY) < 30
    );

    if (overlappingNode) {
      finalCalculatedX += 45; // Shift down-right slightly to break overlap visually
      finalCalculatedY += 45;
      safetyLoopCounter++;
    } else {
      isOverlapping = false;
    }
  }

  // 4. Reset click cache properties instantly so it won't haunt subsequent operations
  setClickCoords({ x: 0, y: 0 });

  console.log(`Overriding touch parameters. Deploying to live DB -> X: ${finalCalculatedX}, Y: ${finalCalculatedY}`);
  
    if (!bundle.nodeData?.x_position && !clickCoords.x && existingCount > 0) {
    const row = Math.floor(existingCount / MAX_NODES_PER_ROW);
    const column = existingCount % MAX_NODES_PER_ROW;
    
    console.log(`Grid Pattern Engine generated coordinates for Node #${existingCount + 1}: Row ${ row }, Col ${ column }`);
  } else {
    console.log("Grid Pattern Engine positioning baseline root anchor node at center.");
  }

  console.log(`Overriding touch parameters. Deploying to live DB -> X: ${finalCalculatedX}, Y: ${finalCalculatedY}`);
    
   /*
      if (isFirstLandmarkInArea) {
        console.log("Empty area detected! Auto-forcing landmark placement to canvas center coordinates.");
        targetX = CANVAS_CENTER_X;
        targetY = CANVAS_CENTER_Y;
      }*/

      // 1. Insert the landmark node first
      console.log("Payload being sent to createLandmark:", {
          area_id: selectedAreaId,
          landmark_name: bundle.nodeData.landmark_name,
          x_position: finalCalculatedX,
          y_position: finalCalculatedY,
        });

      const result = await createLandmark({
        area_id: selectedAreaId,
        landmark_name: bundle.nodeData.landmark_name,
        x_position: finalCalculatedX, 
        y_position: finalCalculatedY,
      });

      if (result.success && result.data) {
        console.log("Landmark saved and positioned seamlessly!", result.data);
        
        // Extract the freshly minted UUID primary key
        const newLandmarkId = result.data.landmark_id;

        // 2. RUN DYNAMIC PATHWAY EDGE CREATION CHECK
        // Get the chosen target connection from your modal input bundle package
        const targetNodeId = bundle.edgeData?.to_node_id;

        if (targetNodeId && existingCount > 0) {
          console.log(`Linking pathway edge: Source=${newLandmarkId} 🔗 Target=${targetNodeId}`);
          
          const uiWeightString = (bundle.edgeData?.chosenUIWeight ?? 'Adjacent') as UIWeight;
          const numericalWeight = WEIGHT_MAP[uiWeightString] ?? 1;
          

  // 1. Build the correct runtime structure
  const rawPayload = [
    {
      from_node_id: newLandmarkId,
      source_type: 'landmark',
      to_node_id: targetNodeId, // Debug here, if undefined or null, will not render
      target_type: bundle.edgeData?.target_type ?? 'landmark',
      weight: numericalWeight,
    }
  ];
  console.log("DEBUG: Sending Edge Payload to Supabase: ", rawPayload)
          const edgeResult = await insertNetworkEdges(
           rawPayload as Parameters<typeof insertNetworkEdges>[0]
          );

          if (edgeResult.success) {
            console.log("Graph network routing edge saved successfully into Supabase!");
            await refreshEdges();
          } else {
            console.error("Failed to link path connection edge:", edgeResult.error?.message);
            Alert.alert("Landmark saved, but routing pathway connection failed to link.");
          }
        }

        // 3. RE-DRAW SCREEN WORKSPACE INSTANTLY!
        await refreshActiveCanvasMap(); 
        await refreshEdges();
      } else {
        console.error("DEBUG - Full API Error: ", result.error);
        const errorMessage = (result.error as any)?.message || JSON.stringify(result.error) || "Unknown error";

        Alert.alert("Failed to insert landmark: " + errorMessage);
      }
    }

    // ==========================================
    // CASE 3: TRASHBIN/WASTEBIN CREATION CRUD
    // ==========================================
 // 📝 Replace your entire CASE 3 block in edit_map.tsx with this safely instrumented version:

else if (bundle.type === 'TRASHBIN') {
  console.log("Inserting new wastebin into Supabase... Modal Bundle payload:", bundle);
  
  const parentId = bundle.edgeData?.to_node_id || activeContext?.landmark_id;

  if (!parentId) {
    Alert.alert("Missing Connection Anchor", "Please select a landmark.");
    return;
  }

  const parentNode = mapData.find(l => l.landmark_id === parentId);
  const parentCoords = nodeCoordinates[parentId]; 

  if (!parentCoords || !parentNode) {
    Alert.alert("Error", "Parent landmark node could not be found.");
    return;
  }

  const existingBinsCount = parentNode.wastebins?.length || 0;
  const RADIUS = 22; 
  const angle = (existingBinsCount * (2 * Math.PI)) / (existingBinsCount + 1);

  const calculatedX = parentCoords.x + RADIUS * Math.cos(angle);
  const calculatedY = parentCoords.y + RADIUS * Math.sin(angle);

  const result = await createWastebin({
    landmark_id: parentId, 
    x_position: Math.round(calculatedX),
    y_position: Math.round(calculatedY),
    description: bundle.nodeData.description || 'New Trashbin',
    status: 'empty', 
  });
  
  // Cleanly unwrap the return payload regardless of whether it's an array or a flat object
  const createdWastebin = result.data 
    ? (Array.isArray(result.data) ? result.data[0] : result.data) 
    : null;

  // CRITICAL CHECK: Extract the database ID securely
  const wastebinId = createdWastebin?.wastebin_id || createdWastebin?.id || (result.data as any)?.wastebin_id;

  if (result.success && wastebinId) {
    console.log(`Wastebin created successfully with ID: ${wastebinId}. Mapping edge now...`);
    
    const distance = Math.sqrt(Math.pow(calculatedX - parentCoords.x, 2) + Math.pow(calculatedY - parentCoords.y, 2));
    const dynamicWeight = distance > 60 ? 3 : distance > 45 ? 2 : 1; 

    // Fire edge creation sequence
    const edgeResult = await createEdge(
      parentId,
      'landmark', 
      wastebinId,
      'wastebin',
      dynamicWeight
    );

    // ✨ EXPLICIT RESULT TRACING ENGINE:
    if (edgeResult && edgeResult.success) {
      console.log("SUCCESS: Edge network line mapped successfully into DB table!");
      await refreshActiveCanvasMap();
              setTimeout(async () => {
            console.log("DEBUG - Delayed thread: Hydrating edge routing vector lines now.");
            await refreshEdges();
          }, 50);//may be just await refreshEdges();
    } else {
      // This will catch silent failures like column naming discrepancies or schema validation violations
      console.error("CRITICAL DATABASE EDGE FAILURE INTERCEPTED:", edgeResult);
      const dbErrorMessage = edgeResult?.error?.message || "Check table schema column names.";
      Alert.alert("Edge Failed to Save", `Database rejected the edge row connection: ${dbErrorMessage}`);   
    }
  } else {
    console.error("Wastebin creation layout succeeded, but no valid target ID could be resolved from response context:", result);
    Alert.alert("Error", "Failed to retrieve a valid Wastebin ID for graph linking.");
  }
}

    setModalVisible(false);

  } catch (error) {
    console.error("Error running the area save routine layout orchestration:", error);
  }

  return;  
};

  // Helper to open the pop-up with the right configuration
  const openPopup = (type: PopupType) => {
    setActivePopupType(type);
    setModalVisible(true);
  };

  //for dropdown areas
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

    useEffect(() => {
  loadAreas();
}, []);
  // 2. Define your list data exactly matching your mockup

  // 3. Handle what happens when a user clicks an area
  const handleAreaSelect = async (item: DropdownItem) => {
    if (item.value === 'add_new') {
      openPopup('AREA');
      console.log('Open modal or prompt to add a new area!');
    } else if(item.value === 'delete_current') {
    if (!selectedAreaId) return;

   // REPLACED OLD WEB CONFIRM WITH NATIVE ALERT:
      Alert.alert(
        "WARNING",
        "Deleting this Area will permanently wipe out all its nested Landmarks, Wastebins, and Routing Edges. Do you want to continue?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete Everything",
            style: "destructive",
            onPress: async () => {
              const result = await deleteArea(selectedAreaId);
              if (result.success) {
                console.log("Area and all cascaded children removed from database.");
                // Fetch fresh database data down right away to see what remains
                const remainingAreas = await loadAreas();
                
                // Dynamic Fallback: Auto-route user view to the first remaining area slot if possible
                if (remainingAreas.length > 0) {
                  setSelectedAreaId(String(remainingAreas[0].value));
                } else {
                  setSelectedAreaId(null); // Completely clear the canvas view if zero records remain
                }
              } else {
                Alert.alert("Error", "Could not complete the request: " + result.error?.message);
              }
            }
          }
        ]
      );
    } else {
      setSelectedAreaId(String(item.value));
    }
  };
          //fetch map data
          // Reusable function to refresh the current map viewport

          console.log("DEBUG - Inserting Landmark into Area:", selectedAreaId);
      const refreshActiveCanvasMap = async () => {
        if (!selectedAreaId || selectedAreaId === "undefined") {
          //console.error("CRITICAL: Attempting to insert into an invalid area ID!");
          setMapData([]);
          await refreshEdges();
          return;
        }
      try{
        console.log("Fetching live map nodes for Area UUID:", selectedAreaId);
        const result = await fetchMapDataByArea(selectedAreaId);

        if (result.success && Array.isArray(result.data)) {
          console.log(`Successfully loaded ${result.data.length} landmarks for this viewport.`);
          setMapData(result.data as LandmarkRow[]); // Drop rows into state to trigger NodalGraph redraw
        } else {
          setMapData([]);
        }
      } catch (error) {
          console.error("Failed to refresh canvas map:", error);
          setMapData([]);
        }
      };

        useEffect(() => {
          refreshActiveCanvasMap();
          refreshEdges();
        }, [selectedAreaId]); // s instantly when screen boots or admin selects a different area

  //for nodes

  const [clickCoords, setClickCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
  // Add this near your modalVisible state:
const [isDeleteMode, setIsDeleteMode] = useState(false);

  const handleNodeInteraction = async (id: string, type: 'landmark' | 'wastebin') => {
 if (isDeleteMode) {
      // SWAPPED WEB CONFIRM FOR NATIVE ALERT:
      Alert.alert(
        "Confirm Deletion",
        `WARNING: Are you sure you want to permanently delete this ${type}? ${
          type === 'landmark' ? '(This will also cascade delete all its nested wastebins!)' : ''
        }`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              console.log(`Sending target delete query for execution: Type=${type}, ID=${id}`);
              // Route dynamically to the correct database API function
              const result = type === 'landmark' 
                ? await deleteLandmark(id) 
                : await deleteWastebin(id);
              
              if (result.success) {
                console.log(`Successfully removed ${type} from the database cloud cluster.`);
                // Trigger a quiet background re-fetch to clear the marker off the viewport canvas instantly
                await refreshActiveCanvasMap(); 
              } else {
                Alert.alert("Deletion Error", `Could not delete the selected ${type}: ` + ((result.error as any)?.message || "Unknown error"));
              }
            }
          }
        ]
      );
    } else {
      console.log(`Normal mode tap: Admin opened configuration summary details for ${type} ID:`, id);
      console.log(`Normal mode tap: Admin opened configuration summary details for ${type} ID:`, id);
      
      let currentName = '';
      if (type === 'landmark') {
        const node = mapData.find(l => l.landmark_id === id);
        currentName = node ? node.landmark_name : '';
      } else {
        for (const landmark of mapData) {
          const bin = landmark.wastebins?.find(b => b.wastebin_id === id);
          if (bin) {
            currentName = bin.description || 'Trashbin';
            break;
          }
        }
      }
      // Configure edit targeting context payloads
      setEditingNode({ id, type, name: currentName });
      setActivePopupType('EDIT' as any); // Cast as any if your type definition layout restricts it
      setModalVisible(true);
    }

};

  const handleLandmarkPress = () => console.log('Landmark clicked!');
  const handleTrashbinPress = () => console.log('Trashbin clicked!');
  const handleAreaPress = () => console.log('Area clicked!');
  const handleRemovePress = () => {
    setIsDeleteMode(!isDeleteMode);
    console.log('Delete Mode toggled via RemoveButton component to:', !isDeleteMode);
  };

      // 1. Create a reference to your graph window container to calculate its location boundaries
      const graphWindowRef = useRef<View>(null);
      const [windowOffset, setWindowOffset] = useState({ x: 0, y: 0 });

      // Measure the window container position on layout bootup
      const handleWindowLayout = () => {
        graphWindowRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setWindowOffset({ x: pageX, y: pageY });
        });
      };


  // 1. Declare a state array to hold the formatted options for your modal dropdown
const [availableNodesList, setAvailableNodesList] = useState<Array<{ id: string; name: string; type: 'landmark' | 'wastebin' }>>([]);

// 2. Build the async worker function to gather map structures
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

// 3. Keep the dropdown list updated automatically whenever the active map changes
useEffect(() => {
  refreshModalDropdownOptions(selectedAreaId ?? '');
}, [mapData]); // Refreshes instantly whenever mapData updates (adds, deletes, or area switches)


  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 85 }]}>
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
          {/*<Text style={{ color: 'white' }}>Node and Graph Area (The Blue Square)</Text>*/}
                  {/* PASS THE DATA STATE DOWN TO THE GRAPH COMPONENT */}
                              <Animated.View
                              {...panResponder.panHandlers}
                              style={[ //For zooming 
                              styles.canvas, 
                              { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scaleValue }] }
                            ]}>

                              <Pressable style={StyleSheet.absoluteFill} onPress={handleCanvasPress} />

                              <NodalGraph 
                              mapData ={mapData} 
                              edges={edgesData}
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
  onClose={() => {setModalVisible(false); setEditingNode(null);}}
  onSave={handleSavePayload}
  // CRITICAL: Hand down your tapped state coordinates explicitly here!
  contextData={{
    x_position: clickCoords.x,
    y_position: clickCoords.y,
    area_id: selectedAreaId ?? '',
    landmark_id: activeContext.landmark_id ?? undefined,
    edit_node_id: editingNode?.id ?? undefined
  }}
  existingNodesList={availableNodesList} 
/>
    </View>
    </View>
  );
}

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

 