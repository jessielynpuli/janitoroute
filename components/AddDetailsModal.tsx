import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
//from api
import { UIWeight } from '@/api/edges/edges_queries';
import { AreaInput, LandmarkInput, WastebinInput } from '@/api/wastebins/wb_queries';

export type PopupType = 'LANDMARK' | 'TRASHBIN' | 'AREA' | null;

interface ConnectionSelection {
  id: string; // Internal temporary UI key (e.g., Date.now().toString())
  targetNodeId: string | null;
  chosenWeight: UIWeight;
}

interface AddDetailsModalProps {
  visible: boolean;
  type: PopupType;
  onClose: () => void;
  contextData?: {
    x_position?: number;
    y_position?: number;
    area_id?: string;
    landmark_id?: string;
    edit_node_id?: string; // Passed from parent screen
  };

   // We pass existing nodes into the modal so the user can choose them from a list
  existingNodesList: Array<{ id: string; name: string; type: 'landmark' | 'wastebin' }>;

  onSave: (bundle: {
    type: 'AREA' | 'LANDMARK' | 'TRASHBIN';
    nodeData: AreaInput | LandmarkInput | WastebinInput;
    edgeData: {
      to_node_id: string;
      target_type: 'landmark' | 'wastebin';
      
      chosenUIWeight: UIWeight;
    } | null; // null if they choose not to connect to anything
  }) => void;
 
}

export const AddDetailsModal: React.FC<AddDetailsModalProps> = ({ visible, type, onClose, contextData, onSave, existingNodesList }) => {
  const [inputValue, setInputValue] = useState('');

  // Form states for the Edge connection inputs
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<UIWeight>('Adjacent');
  const [connections, setConnections] = useState<ConnectionSelection[]>([]);

  // Dropdown state
  const [expandedDropdownId, setExpandedDropdownId] = useState<string | null>(null);
  // link
  const [mode, setMode] = useState<'view' | 'link'>('view')
  
  const isEditing = !!contextData?.edit_node_id;

  // ==========================================
  // INITIALIZATION EFFECT (Fires when modal opens)
  // ==========================================
  useEffect(() => {
    if (visible) {
      if (isEditing && contextData?.edit_node_id) {
        // --- EDIT MODE: Pre-fill the form ---
        const targetNode = existingNodesList.find((node) => node.id === contextData.edit_node_id);
        
        if (targetNode) {
          // Clean up the visual emojis to get the raw name
          const cleanName = targetNode.name
            .replace('📍 Landmark: ', '')
            .replace('🗑️ Trashbin: ', '')
            .split(' (')[0];
            
          setInputValue(cleanName);
          setConnections([]); // You can modify this later if you want to load existing edges
        }
      } else {
        // --- CREATE MODE: Wipe the form clean ---
        setInputValue('');
        setConnections([]);
      }
      setExpandedDropdownId(null);
    }
  }, [visible, contextData?.edit_node_id, existingNodesList]);

  // Helper functions to manage the dynamic layout blocks
  const addConnectionBlock = () => {
    setConnections([
      ...connections, 
      { id: Date.now().toString(), targetNodeId: null, chosenWeight: 'Adjacent' }
    ]);
  };

  const updateConnectionBlock = (id: string, fields: Partial<Omit<ConnectionSelection, 'id'>>) => {
    setConnections(connections.map(conn => 
      conn.id === id ? { ...conn, ...fields } : conn
    ));
  };

  const removeConnectionBlock = (id: string) => {
    setConnections(connections.filter(conn => conn.id !== id));
  };

  const handleSave = () => {
    if (inputValue.trim() === '') return;

    // 1. Filter out empty connection blocks where the user hasn't selected a node yet
    const activeConnections = connections.filter(c => c.targetNodeId !== null);

    let edgePayload = null;

    // 2. Map the first valid connection row directly to your onSave prop contract
    if (activeConnections.length > 0) {
      const primaryConnection = activeConnections[0];
      const targetNode = existingNodesList.find(n => n.id === primaryConnection.targetNodeId);
      
      if (targetNode) {
        edgePayload = {
          to_node_id: primaryConnection.targetNodeId!,
          target_type: targetNode.type,
          chosenUIWeight: primaryConnection.chosenWeight // Passes 'Adjacent' | 'Midway' | 'Remote'
        };
      }
    }

    // Standard fallback coordinate variables
    // added zeroes. might edit.
    const x = contextData?.x_position ?? 0;
    const y = contextData?.y_position ?? 0;

    console.log(`Modal package payload confirming coordinates: X=${x}, Y=${y}`);

    if (!isEditing && (x === undefined || y === undefined) && type !== 'AREA') {
      Alert.alert("Coordinate placement error! Re-tap the map grid.");
      return;
    }

    let nodePayload: AreaInput | LandmarkInput | WastebinInput;

    // ==========================================
    // 3. Build and hand off the specific Node payloads
    // ==========================================
    if (type === 'AREA') {
      nodePayload = { area_name: inputValue };
      onSave({ type: 'AREA', nodeData: nodePayload, edgeData: null });
    } 
    
    else if (type === 'LANDMARK') {
      nodePayload = {
        area_id: contextData?.area_id ?? '',
        x_position: x!,
        y_position: y!,
        landmark_name: inputValue,
      };
      onSave({ type: 'LANDMARK', nodeData: nodePayload, edgeData: edgePayload });
    } 
    
    else if (type === 'TRASHBIN') {
      nodePayload = {
        landmark_id: contextData?.landmark_id ?? '',
        status: 'empty',
        x_position: x!,
        y_position: y!,
        description: inputValue,
      };
      onSave({ type: 'TRASHBIN', nodeData: nodePayload, edgeData: edgePayload });
    }

    onClose();
  };

  // Dynamic UI Text
  const modalTitleText = isEditing ? `EDIT ${type}` : `ADD ${type}`;
  const saveButtonText = isEditing ? 'UPDATE' : 'SAVE';

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{modalTitleText}</Text>

          {/* Core Node Text Input */}
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Enter name or description..."
          />

          {/* --- NEW EDGE SECTION LAYER --- */}
          {/* We only show the edge builder if creating a new node, or you can allow it for edits too */}
          {type !== 'AREA' && !isEditing && (
            <View style={styles.edgeFormSection}>
             {/* Loop and render every configured connection block dynamically */}
    {connections.map((conn, index) => (
      <View key={conn.id} style={styles.connectionBlockBox}>
        
        <View style={styles.blockHeaderRow}>
          <Text style={styles.sectionLabel}>Connection #{index + 1}</Text>
          <TouchableOpacity onPress={() => removeConnectionBlock(conn.id)}>
            <Text style={styles.removeBlockText}>[ Remove ]</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Target Node Dropdown Selection Area inside AddDetailsModal.tsx */}
        {/* Replace your old dropdownPlaceholderBox layout with this: */}
        <View style={{ marginBottom: 12, position: 'relative', zIndex: 100 - index }}>
          <Text style={{ fontSize: 11, color: '#6D6D6D', fontWeight: '700', marginBottom: 4 }}>
            SELECT DESTINATION NODE:
          </Text>
          
          {/* The Main Select Field Header Box Toggler */}
          <TouchableOpacity 
            style={styles.dropdownPlaceholderBox}
            onPress={() => setExpandedDropdownId(expandedDropdownId === conn.id ? null : conn.id)}
          >
            <Text style={[styles.dropdownPlaceholderText, conn.targetNodeId && { color: '#1E56A0', fontStyle: 'normal', fontWeight: '600' }]}>
              {conn.targetNodeId 
                ? existingNodesList.find(n => n.id === conn.targetNodeId)?.name 
                : "Choose Landmark or Trashbin... ▾"}
            </Text>
          </TouchableOpacity>

          {/* DYNAMIC COLLAPSIBLE DROPDOWN CHOICES DRAWER */}
          {expandedDropdownId === conn.id && (
            <View style={styles.dropdownDrawerOverlayList}>
              {existingNodesList.length === 0 ? (
                <Text style={styles.dropdownEmptyText}>No structures built in this area yet.</Text>
              ) : (
                existingNodesList.map((node) => (
                  <TouchableOpacity
                    key={node.id}
                    style={[
                      styles.dropdownItemRow,
                      conn.targetNodeId === node.id && { backgroundColor: '#E2E8F0' }
                    ]}
                    onPress={() => {
                      updateConnectionBlock(conn.id, { targetNodeId: node.id });
                      setExpandedDropdownId(null); // Instantly collapse panel on choice selection
                    }}
                  >
                    <Text style={{ fontSize: 13, color: '#334155' }}>{node.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* 2. Weight Segment Picker Row */}
        <View style={styles.weightButtonRow}>
          {(['Adjacent', 'Midway', 'Remote'] as UIWeight[]).map((w) => (
            <TouchableOpacity
              key={w}
              style={[
                styles.weightBtn,
                conn.chosenWeight === w ? styles.weightBtnActive : styles.weightBtnInactive
              ]}
              onPress={() => updateConnectionBlock(conn.id, { chosenWeight: w })}
            >
              <Text style={conn.chosenWeight === w ? styles.textActive : styles.textInactive}>
                {w}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ))}

    {/* 3. The Clickable "+ Add Connections" trigger */}
    <TouchableOpacity style={styles.addConnectionTrigger} onPress={addConnectionBlock}>
      <Text style={styles.addConnectionTriggerText}>+ Add Connections</Text>
    </TouchableOpacity>

  </View>
)}

          {/* Save & Cancel Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={[styles.actionBtn, styles.cancelBtn]}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.actionBtn, styles.saveBtn]}>
                <Text style={styles.saveBtnText}>{saveButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dim screen overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#6D6D6D',
    padding: 20,
    borderRadius: 0, // Industrial square design matching dropdowns
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E56A0',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: '#6D6D6D',
    backgroundColor: '#F8FAFC',
    padding: 12,
    fontSize: 16,
    color: '#334155',
    marginBottom: 16,
  },
  
  // New Edge Section Structural Containers
  edgeFormSection: {
    marginVertical: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D6D6D',
    marginBottom: 8,
    marginTop: 8,
  },
  dropdownPlaceholderBox: {
    height: 45,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#6D6D6D',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dropdownPlaceholderText: {
    color: '#6D6D6D',
    fontStyle: 'italic',
  },
  
  // Segmented Weight Buttons row layout
  weightButtonRow: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#1E56A0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  weightBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightBtnActive: {
    backgroundColor: '#D6E4F0', // Light blue segment highlight
  },
  weightBtnInactive: {
    backgroundColor: '#FFFFFF',
  },
  textActive: {
    color: '#1E56A0',
    fontWeight: '700',
    fontSize: 14,
  },
  textInactive: {
    color: '#94A3B8',
    fontWeight: '500',
    fontSize: 14,
  },

  // Base action buttons
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  cancelBtn: {
    borderColor: '#6D6D6D',
    backgroundColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#6D6D6D',
    fontWeight: '600',
  },
  saveBtn: {
    borderColor: '#1E56A0',
    backgroundColor: '#1E56A0', // Full brand solid blue accent
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  connectionBlockBox: {
    borderWidth: 1,
    borderColor: '#6D6D6D',
    backgroundColor: '#F8FAFC',
    padding: 10,
    marginBottom: 12,
  },
  blockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeBlockText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  addConnectionTrigger: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#1E56A0',
    marginTop: 6,
    marginBottom: 12,
  },
  addConnectionTriggerText: {
    color: '#1E56A0',
    fontWeight: '700',
    fontSize: 14,
  },
  dropdownDrawerOverlayList: {
  position: 'absolute',
  top: 65, // Positions directly below the click trigger button row
  left: 0,
  right: 0,
  backgroundColor: '#FFFFFF',
  borderWidth: 2,
  borderColor: '#6D6D6D',
  maxHeight: 150, // Limits huge overflow scrolls
  elevation: 5, // Appends clear visibility shadows over background text
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
},
dropdownItemRow: {
  padding: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
  backgroundColor: '#FFF',
},
dropdownEmptyText: {
  padding: 12,
  color: '#94A3B8',
  fontStyle: 'italic',
  textAlign: 'center',
},
});