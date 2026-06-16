import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (status: 'empty' | 'half-full' | 'full') => void;
}

export const BinStatusModal = ({ visible, onClose, onSelect }: Props) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Update Bin Status</Text>
        {(['empty', 'half-full', 'full'] as const).map((s) => (
          <TouchableOpacity key={s} style={styles.btn} onPress={() => onSelect(s)}>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: 250, backgroundColor: 'white', padding: 20, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  btn: { padding: 12, backgroundColor: '#2E7D32', marginVertical: 5, borderRadius: 5 },
  cancel: { backgroundColor: '#757575' },
  btnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' }
});