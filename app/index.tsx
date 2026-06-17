import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { s } from 'react-native-size-matters';

import HelpButton from '@/components/HelpButton';
import MenuButton from '@/components/MenuButton';
import NodalGraph from '@/components/NodalGraph';
import { ReportStatusModal } from '@/components/ReportStatusModal';
import Sidebar from '@/components/SideBar';

// Import data types and mock database
import { MOCK_DATABASE_BY_AREA, SupabaseLandmarkPayload } from '@/constants/interfaceData';

type Role = 'ADMIN' | 'JANITOR' | 'GUEST';

export default function HomeScreen() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>("1dcbb286-0d5f-4dd7-91a8-bcb39242815a");
  const [mapData, setMapData] = useState<SupabaseLandmarkPayload[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const router = useRouter();

  // Simulate an API data fetch whenever the selected Area changes
  useEffect(() => {
    if (selectedAreaId && MOCK_DATABASE_BY_AREA[selectedAreaId]) {
      setMapData(MOCK_DATABASE_BY_AREA[selectedAreaId]);
    } else {
      setMapData([]);
    }
  }, [selectedAreaId]);

  const handleHelpPress = () => console.log('Help opened!');
  
  const handleReportSubmit = (status: 'Empty' | 'Half-Full' | 'Full') => {
    console.log(`Reported as: ${status}`);
    // Future: Add your Supabase update logic here
    setIsReportModalOpen(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      
      <View style={styles.header}>
        <MenuButton onPress={() => setIsSidebarOpen(true)} />
        <Text style={[styles.welcomeText, { color: Colors.text }]}>
            Janitoroute - Home Screen
        </Text>
        <HelpButton onPress={handleHelpPress} />
      </View>

      <Button 
        title="Report Wastebin Status" 
        onPress={() => setIsReportModalOpen(true)} 
      />

      {isSidebarOpen && (
        <Sidebar 
          currentRole="GUEST"
          onClose={() => setIsSidebarOpen(false)}
          onRoleChange={(newRole: Role) => {
            setIsSidebarOpen(false);
            if (newRole === 'ADMIN') {
              router.replace('/(admin)/map'); 
            } else if (newRole === 'JANITOR') {
              router.replace('/(janitor)/janitor'); 
            }
          }}
        />
      )}

      <View style={styles.graphWrapper}>
        <NodalGraph mapData={mapData} />
      </View>

      <ReportStatusModal 
        visible={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSelectStatus={handleReportSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: s(20),
    marginTop: s(20)
  },
  graphWrapper: {
    flex: 1,
    margin: s(20),
  }
});