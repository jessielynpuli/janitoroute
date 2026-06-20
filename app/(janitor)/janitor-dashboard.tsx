import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s } from 'react-native-size-matters';

// Import your new priority query function
import { AreaPriorityRow, fetchAreasByUrgency } from '@/api/wastebins/wb_queries';

export default function JanitorDashboard() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<AreaPriorityRow[]>([]);

  const loadDashboardMetrics = async () => {
    const result = await fetchAreasByUrgency();
    if (result.success) {
      setDashboardData(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardMetrics();
  };

  const renderAreaCard = ({ item, index }: { item: AreaPriorityRow; index: number }) => {
    const isUrgent = item.full_count > 0;
    
    return (
      <View style={[styles.card, isUrgent && styles.urgentCardBorder]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.rankText}>#{index + 1}</Text>
            <Text style={styles.areaNameText}>{item.area_name}</Text>
          </View>
          {isUrgent && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ATTENTION REQUIRED</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: '#FFECEC' }]}>
            <Text style={[styles.statNumber, { color: '#D32F2F' }]}>{item.full_count}</Text>
            <Text style={styles.statLabel}>Full</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#FFF9E6' }]}>
            <Text style={[styles.statNumber, { color: '#F57C00' }]}>{item.half_full_count}</Text>
            <Text style={styles.statLabel}>Half-Full</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statNumber, { color: '#388E3C' }]}>{item.empty_count}</Text>
            <Text style={styles.statLabel}>Empty</Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Total Bins: <Text style={{ fontWeight: 'bold' }}>{item.total_bins}</Text>
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E56A0" />
        <Text style={styles.loadingText}>Compiling prioritization metrics...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 85 }]}>
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Janitor Tasks</Text>
        <Text style={styles.subheading}>Areas sorted by critical cleaning urgency</Text>
      </View>

      <FlatList
        data={dashboardData}
        keyExtractor={(item) => item.area_id}
        renderItem={renderAreaCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1E56A0" />
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>No registered workspace zones found.</Text>
          </View>
        }
      />
    </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6D6D6D',
  },
  headerBlock: {
    paddingHorizontal: 20,
    marginVertical: 15,
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  urgentCardBorder: {
    borderColor: '#FF8A8A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E56A0',
    marginRight: 8,
  },
  areaNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  badge: {
    backgroundColor: '#FF8A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#555555',
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'right',
  },
  emptyView: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#6D6D6D',
    fontSize: 15,
  },
});