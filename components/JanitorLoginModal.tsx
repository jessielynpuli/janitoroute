import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

// 1. IMPORT YOUR AUTH API FUNCTION
import { signInJanitor } from '@/api/auth/auth_queries'; 

interface JanitorLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JanitorLoginModal({ visible, onClose, onSuccess }: JanitorLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both your username and password.');
      return;
    }

    setLoading(true);

    try {
      // 2. CONNECT TO THE BACKEND AUTH QUERY
      // It handles the trim, lowercase formatting, and email transformation behind the scenes!
      const result = await signInJanitor(username, password);

      if (result.success) {
        Alert.alert('Login Success', `Welcome back, Janitor ${username.trim()}!`);
        setUsername('');
        setPassword('');
        onSuccess(); // Grants role permission change inside your SideBar/Index setup
      } else {
        // 3. DISPLAY THE SECURE CUSTOM ERROR RESPONSE FROM YOUR API
        Alert.alert('Login Failed', result.errorMessage || 'Something went wrong.');
      }
    } catch (error: any) {
      console.error('Unhandled login connection error:', error);
      Alert.alert('Network Error', 'Could not establish connection to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Janitor Sign In</Text>
          <Text style={styles.subtitle}>Enter your campus username and assigned password to log in.</Text>
          
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., janitor1"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.cancelBtn]} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.btnText}>CANCEL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.loginBtn]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.btnText}>LOG IN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', maxWidth: 320, backgroundColor: '#FFF', borderRadius: 10, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0D47A1', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  buttonRow: { flexDirection: 'row', width: '100%', gap: 10, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#64748b' },
  loginBtn: { backgroundColor: '#0D47A1' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
});