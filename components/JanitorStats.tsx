import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function JanitorStats() {
  return (
    <View style={styles.container}>
      <View style={styles.statRow}>
        <Text style={styles.label}>Full Bins Pending:</Text>
        <Text style={[styles.value, { color: '#D32F2F' }]}>4</Text>
      </View>
      
      <View style={styles.statRow}>
        <Text style={styles.label}>Bins Nearly Full:</Text>
        <Text style={[styles.value, { color: '#FBC02D' }]}>7</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statRow}>
        <Text style={styles.label}>Total Bins in Area:</Text>
        <Text style={styles.value}>22</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: { fontSize: 14, color: '#444', fontWeight: '500' },
  value: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },
});