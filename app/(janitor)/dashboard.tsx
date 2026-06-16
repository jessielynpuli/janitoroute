import HotspotStats from '@/components/HotspotStats';
import StatCard from '@/components/StatCard';
import TaskList from '@/components/TaskList';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
     
      {/* Content Areas */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <StatCard title="Wastebin Statistics">
          <HotspotStats />
        </StatCard>

        <StatCard title="Accomplished Tasks">
          <TaskList />
        </StatCard>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8FF', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuIcon: { fontSize: 28, color: '#1B5E20' },
  logoText: { fontSize: 26, fontWeight: 'bold', color: '#0D47A1' },
  logoGreen: { color: '#1B5E20' },
  helpIcon: { fontSize: 28, color: '#1B5E20' },
  scrollContent: { padding: 20, gap: 30 },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#0D47A1',
    backgroundColor: '#FFF',
  },
  footerTab: { flex: 1, textAlign: 'center', padding: 15, color: '#0D47A1', fontWeight: '600' },
  activeTab: { backgroundColor: '#BBDEFB' },
});