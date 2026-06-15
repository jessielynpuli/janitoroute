import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

//from api
import { AreaInput, LandmarkInput, WastebinInput } from '@/api/wastebins/wb_queries';
import { insertNetworkEdges, WEIGHT_MAP, UIWeight } from '@/api/edges/edges_queries';

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
  };

   // We pass existing nodes into the modal so the user can choose them from a list
  existingNodesList: Array<{ id: string; name: string; type: 'landmark' | 'wastebin' }>;

  onSave: (bundle: {
    type: 'AREA' | 'LANDMARK' | 'TRASHBIN';
    nodeData: AreaInput | LandmarkInput | WastebinInput;
    edgeData: {
      target_node_id: string;
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


  useEffect(() => {
    if (visible) {
      setInputValue('');
      setConnections([]);
    }
  }, [visible]);

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

    // Filter out any blocks where the user didn't actually select a target node
    const formattedEdges = connections
      .filter(c => c.targetNodeId !== null)
      .map(c => {
        const matchingNode = existingNodesList.find(n => n.id === c.targetNodeId);
        return {
          target_node_id: c.targetNodeId!,
          target_type: matchingNode?.type ?? 'landmark',
          chosenUIWeight: c.chosenWeight
        };
      });

    // Standard fallback coordinate variables
    const x = contextData?.x_position ?? 0;
    const y = contextData?.y_position ?? 0;

    let nodePayload: AreaInput | LandmarkInput | WastebinInput;
    let edgePayload = null;

    //Build the Connection (Edge) bundle if an item is selected
    if (selectedTargetId) {
      const targetNode = existingNodesList.find(n => n.id === selectedTargetId);
      if (targetNode) {
        edgePayload = {
          target_node_id: selectedTargetId,
          target_type: targetNode.type,
          chosenUIWeight: selectedWeight
        };
      }
    }

  // 2. Build the specific Node payload
    if (type === 'AREA') {
      nodePayload = { area_name: inputValue };
      onSave({ type: 'AREA', nodeData: nodePayload, edgeData: null });
    } 
    
    else if (type === 'LANDMARK') {
      nodePayload = {
        area_id: contextData?.area_id ?? '',
        x_position: x,
        y_position: y,
        landmark_name: inputValue,
      };
      onSave({ type: 'LANDMARK', nodeData: nodePayload, edgeData: edgePayload });
    } 
    
    else if (type === 'TRASHBIN') {
      nodePayload = {
        landmark_id: contextData?.landmark_id ?? '',
        status: 'empty',
        x_position: x,
        y_position: y,
        description: inputValue,
      };
      onSave({ type: 'TRASHBIN', nodeData: nodePayload, edgeData: edgePayload });
    }

    onClose();
  };


  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>ADD {type}</Text>

          {/* Core Node Text Input */}
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Enter name or description..."
          />

          {/* --- NEW EDGE SECTION LAYER --- */}
          {type !== 'AREA' && (
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

        {/* 1. Target Node Dropdown Selection Area */}
        {/* You can replace this placeholder with your actual AreaDropdown layout component */}
        <View style={styles.dropdownPlaceholderBox}>
          <Text style={styles.dropdownPlaceholderText}>
            {conn.targetNodeId 
              ? existingNodesList.find(n => n.id === conn.targetNodeId)?.name 
              : "Select Target Landmark or Wastebin..."}
          </Text>
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
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}><Text>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text>SAVE</Text></TouchableOpacity>
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
});