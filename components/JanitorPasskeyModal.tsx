import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface JanitorPasskeyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JanitorPasskeyModal({ visible, onClose, onSuccess }: JanitorPasskeyModalProps) {
  const [passkey, setPasskey] = useState('');
  
  // Set your janitor passkey here
  const CORRECT_PASSKEY = '1234'; 

  const handleVerify = () => {
    if (passkey === CORRECT_PASSKEY) {
      setPasskey('');
      onSuccess();
    } else {
      Alert.alert('Access Denied', 'Incorrect janitor passkey.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Janitor Verification</Text>
          <Text style={styles.subtitle}>Enter the janitor passkey to access tasks.</Text>
          
          <TextInput
            style={styles.input}
            placeholder="••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            value={passkey}
            onChangeText={setPasskey}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.btnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.verifyBtn]} onPress={handleVerify}>
              <Text style={styles.btnText}>VERIFY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 280, backgroundColor: '#FFF', borderRadius: 10, padding: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0D47A1', marginBottom: 6 }, // Blue title
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 10,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 20,
    backgroundColor: '#f8fafc',
  },
  buttonRow: { flexDirection: 'row', width: '100%', gap: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#64748b' },
  verifyBtn: { backgroundColor: '#0D47A1' }, // Blue button
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});