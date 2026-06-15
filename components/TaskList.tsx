import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Dummy data array mimicking an API response
const completedTasks = [
  { id: '1', janitor: 'Jessie Lyn', location: 'Building A - 2nd Flr', time: '10:14 AM' },
  { id: '2', janitor: 'Alex Smith', location: 'Main Lobby Bin #3', time: '09:45 AM' },
  { id: '3', janitor: 'Maria Santos', location: 'Gymnasium Exit Left', time: '08:30 AM' },
];

export default function TaskList() {
  return (
    <View style={styles.container}>
      {completedTasks.map((item) => (
        <View key={item.id} style={styles.taskRow}>
          {/* Custom "File/Document" minimal icon look */}
          <View style={styles.fileIcon}>
            <Text style={styles.fileIconText}>✓</Text>
          </View>
          
          <View style={styles.details}>
            <Text style={styles.janitorName}>{item.janitor}</Text>
            <Text style={styles.locationText}>{item.location}</Text>
          </View>

          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 6,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  fileIcon: {
    width: 32,
    height: 36,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#81C784',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIconText: { color: '#2E7D32', fontWeight: 'bold' },
  details: { flex: 1 },
  janitorName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  locationText: { fontSize: 12, color: '#666' },
  timeText: { fontSize: 11, color: '#999', fontWeight: '600' },
});