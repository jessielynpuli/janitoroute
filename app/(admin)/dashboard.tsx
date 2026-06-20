import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s } from 'react-native-size-matters';

// Import our live dashboard tracking hooks
import { AreaPriorityRow, fetchAreasByUrgency, fetchRecentActivityStream, RecentActivityRow } from '@/api/wastebins/wb_queries';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const [areaSummaries, setAreaSummaries] = useState<AreaPriorityRow[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<RecentActivityRow[]>([]);

  const loadDashboardData = async () => {
    // 1. Load active priority metrics for the area summaries
    const areaResult = await fetchAreasByUrgency();
    if (areaResult.success) {
      setAreaSummaries(areaResult.data);
    }

    // 2. Load the recent updates stream using your existing timestamps
    const activityStream = await fetchRecentActivityStream(15);
    setRecentUpdates(activityStream);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0D47A1" />
        <Text style={styles.loadingText}>Loading dashboard analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D47A1" />}
    >
      {/* Header Block */}
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Administrator Dashboard</Text>
        <Text style={styles.subheading}>Area matrix & Recent wastebin updates</Text>
      </View>

      {/* Part A: High-Level Zone Overviews */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Area Summaries</Text>
        {areaSummaries.map((area) => (
          <View key={area.area_id} style={styles.areaRowCard}>
            <Text style={styles.areaName}>{area.area_name}</Text>
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: '#FFECEC' }]}><Text style={{ color: '#D32F2F', fontSize: 11, fontWeight: '600' }}>{area.full_count} Full</Text></View>
              <View style={[styles.pill, { backgroundColor: '#FFF9E6' }]}><Text style={{ color: '#F57C00', fontSize: 11, fontWeight: '600' }}>{area.half_full_count} Half</Text></View>
              <View style={[styles.pill, { backgroundColor: '#E8F5E9' }]}><Text style={{ color: '#388E3C', fontSize: 11, fontWeight: '600' }}>{area.empty_count} Empty</Text></View>
            </View>
          </View>
        ))}
      </View>

      {/* Part B: Live Updates Stream */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Wastebin Updates</Text>
        {recentUpdates.length === 0 ? (
          <Text style={styles.emptyText}>No recent wastebin updates recorded yet.</Text>
        ) : (
          recentUpdates.map((item) => {
            // Deduce the worker role context using the status value directly!
            const isCleanup = item.status === 'empty';
            return (
              <View key={item.wastebin_id} style={[styles.logCard, isCleanup ? styles.cleanupIndicator : styles.reportIndicator]}>
                <View style={styles.logHeader}>
                  <View style={[styles.badge, { backgroundColor: isCleanup ? '#E8F5E9' : '#FFECEC' }]}>
                    <Text style={[styles.badgeText, { color: isCleanup ? '#2E7D32' : '#C62828' }]}>
                      {isCleanup ? '🧽 JANITOR CLEANUP' : '🚨 GUEST REPORT'}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{formatTimestamp(item.updated_at)}</Text>
                </View>
                <Text style={styles.logBody}>
                  Wastebin inside <Text style={{ color: '#0D47A1', fontWeight: 'bold' }}>{item.area_name}</Text> was updated to{' '}
                  <Text style={{ fontWeight: 'bold' }}>{item.status}</Text>.
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFFAFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFFAFF',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6D6D6D',
  },
  headerBlock: {
    paddingHorizontal: 20,
    marginVertical: 20,
    marginTop: s(15),
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  subheading: {
    fontSize: 14,
    color: '#5584AC',
    marginTop: 2,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  areaRowCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  areaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cleanupIndicator: {
    borderLeftColor: '#4CAF50',
  },
  reportIndicator: {
    borderLeftColor: '#F44336',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 11,
    color: '#888888',
  },
  logBody: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
  },
  emptyText: {
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 15,
  },
});