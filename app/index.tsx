import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { s } from 'react-native-size-matters';

import HelpButton from '@/components/HelpButton';
import MenuButton from '@/components/MenuButton';
import NodalGraph from '@/components/NodalGraph';
import Sidebar from '@/components/SideBar';

// Import data types and mock database
import { MOCK_DATABASE_BY_AREA, SupabaseLandmarkPayload } from '@/constants/interfaceData';
type Role = 'ADMIN' | 'JANITOR' | 'GUEST';
export default function HomeScreen() {

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>("1dcbb286-0d5f-4dd7-91a8-bcb39242815a");
  const [mapData, setMapData] = useState<SupabaseLandmarkPayload[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const router = useRouter();

  // Simulate an API data fetch whenever the selected Area changes
  useEffect(() => {
    if (selectedAreaId && MOCK_DATABASE_BY_AREA[selectedAreaId]) {
      // Mimics running your: const data = await fetchMapDataByArea(selectedAreaId)
      setMapData(MOCK_DATABASE_BY_AREA[selectedAreaId]);
    } else {
      setMapData([]);
    }
  }, [selectedAreaId]);

  const handleHelpPress = () => console.log('Help opened!');
  const handleMenuPress = () => console.log('Menu opened!');

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
        title="Test Admin View" 
        onPress={() => router.push('/(admin)/edit_map')} 
      />
            <Button 
        title="Test Janitor View" 
        onPress={() => router.push('/(janitor)/janitor')} 
      />

      {isSidebarOpen && (
                  <Sidebar 
                    currentRole="GUEST"
                    onClose={() => setIsSidebarOpen(false)}
                    onRoleChange={(newRole: Role) => {
                      setIsSidebarOpen(false); // Close the drawer
                      
                      // Handle routing into specific folders based on selection
                      if (newRole === 'ADMIN') {
                        // Redirects into your app/(admin)/_layout.tsx tabs structure
                        router.replace('/(admin)/dashboard'); 
                      } else if (newRole === 'JANITOR') {
                        // Redirects into your janitor directory once active
                        // router.replace('/(janitor)/tasks'); 
                      }
                    }}
                  />
                )}

      <View style={styles.graphWrapper}>
        {/* PASS THE DATA STATE DOWN TO THE GRAPH COMPONENT */}
        <NodalGraph mapData={mapData} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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