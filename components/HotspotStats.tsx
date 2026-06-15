import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HotspotStats() {
  return (
    <View style={styles.container}>
      <View style={styles.statRow}>
        <Text style={styles.emoji}>⏰</Text>
        <View style={styles.textGroup}>
          <Text style={styles.label}>Peak Rush Hour</Text>
          <Text style={styles.value}>2:00 PM – 4:00 PM</Text>
          <Text style={styles.subtext}>Most "Full Bin" reports submitted</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statRow}>
        <Text style={styles.emoji}>📍</Text>
        <View style={styles.textGroup}>
          <Text style={styles.label}>TOP HOTSPOT AREA</Text>
          <Text style={styles.value}>Cafeteria / Quadrangle</Text>
          <Text style={styles.subtext}>5 bins reached 100% simultaneously</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-around' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  emoji: { fontSize: 28, marginRight: 15 },
  textGroup: { flex: 1 },
  label: { fontSize: 12, color: '#555', fontWeight: 'bold' },
  value: { fontSize: 16, fontWeight: 'bold', color: '#111', marginVertical: 2 },
  subtext: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#90A4AE', marginVertical: 5 },
});