import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ReportStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStatus: (status: 'Empty' | 'Half-Full' | 'Full') => void;
}

export const ReportStatusModal: React.FC<ReportStatusModalProps> = ({ visible, onClose, onSelectStatus }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>REPORT WASTEBIN</Text>
          
          {(['Empty', 'Half-Full', 'Full'] as const).map((status) => (
            <TouchableOpacity 
              key={status} 
              style={styles.optionBtn} 
              onPress={() => onSelectStatus(status)}
            >
              <Text style={styles.optionText}>{status}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: '#FFF', padding: 20, borderWidth: 3, borderColor: '#6D6D6D' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E56A0', marginBottom: 20, textAlign: 'center' },
  optionBtn: { padding: 15, backgroundColor: '#D6E4F0', marginBottom: 10, alignItems: 'center' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#1E56A0' },
  cancelBtn: { marginTop: 10, alignItems: 'center' },
  cancelBtnText: { color: '#6D6D6D', fontWeight: 'bold' }
});