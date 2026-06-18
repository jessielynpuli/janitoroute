import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (status: 'empty' | 'half-full' | 'full') => void;
}

// 1. Define a color dictionary for each status state mapping
const STATUS_COLORS = {
  'empty': '#2E7D32',      // Forest Green
  'half-full': '#F59E0B',  // Warning Amber/Orange
  'full': '#D32F2F',       // Alert Red
};

export const BinStatusModal = ({ visible, onClose, onSelect }: Props) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Update Bin Status</Text>
        
        {(['empty', 'half-full', 'full'] as const).map((s) => (
          <TouchableOpacity 
            key={s} 
            // 2. Inject the background color dynamically inline paired with base button styles
            style={[styles.btn, { backgroundColor: STATUS_COLORS[s] }]} 
            onPress={() => onSelect(s)}
          >
            <Text style={styles.btnText}>{s.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
          <Text style={styles.btnText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modal: { 
    width: 250, 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 10 
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  btn: { 
    padding: 12, 
    marginVertical: 5, 
    borderRadius: 5 
    // Removed the hardcoded background color from here so the inline style handles it cleanly
  },
  cancel: { 
    backgroundColor: '#757575',
    marginTop: 20,
  },
  btnText: { 
    color: 'white', 
    textAlign: 'center', 
    fontWeight: 'bold' 
  }
});