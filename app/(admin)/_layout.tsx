import React, { useState } from 'react';
import { useRouter, Tabs } from 'expo-router';
import { useFonts } from 'expo-font';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import HelpButton from '@/components/HelpButton';
import MenuButton from '@/components/MenuButton';
import Sidebar from '@/components/SideBar';
import { BottomNavBar } from '@/components/AdminBottomNavbar';


import { s } from 'react-native-size-matters';

type Role = 'ADMIN' | 'JANITOR' | 'GUEST';

export default function AdminLayout() {
  const [loaded, error] = useFonts({
    'Dropdown-Placeholder': require('@/assets/fonts/Roboto-ExtraBold.ttf'),
    'Dropdown-Options': require('@/assets/fonts/Roboto-Medium.ttf'),
    'ForOval-Font': require('@/assets/fonts/Inter_28pt-ExtraBold.ttf'),
    'Inter-Font': require('@/assets/fonts/Inter_18pt-SemiBold.ttf'),
  });

  const handleHelpPress = () => console.log('Help opened!');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const router = useRouter();

  return (
    // We wrap the entire UI container in a View so the Sidebar can absolute-overlay correctly over everything, including the tabs framework
    <View style={styles.layoutContainer}>
      <Tabs
        // Inject your custom bar here
        tabBar={(props) => (
          <BottomNavBar 
            {...props} 
            // Let the nav bar handle device-specific safe margins if needed
          />
        )}
      screenOptions={{
        tabBarActiveTintColor: '#2f95dc',
        tabBarStyle: { paddingBottom: 30, height: 60 },
        headerShown: true,
        
        // Cleaned up header button placements
        headerLeft: () => (
          <View style={styles.headerLeftPadding}>
            <MenuButton onPress={() => setIsSidebarOpen(true)} />
          </View>
        ),
        headerRight: () => (
          <View style={styles.headerRightPadding}>
            <HelpButton onPress={handleHelpPress} />
          </View>
        ),
      }}>
        {/* Define your targeted screens matching the file names */}
        <Tabs.Screen name="map"
          options={{
            title: 'Map'
          }} />
        <Tabs.Screen name="edit_map" 
          options = {{
            title: 'Edit Map'
          }}/>
        <Tabs.Screen name="dashboard" 
         options = {{
          title: 'Dashboard'
         }}
        />

        
      </Tabs>

      {/* 4. Sidebar Overlay safely sits underneath the root container frame wrapper */}
      {isSidebarOpen && (
        <Sidebar 
          currentRole="ADMIN"
          onClose={() => setIsSidebarOpen(false)}
          onRoleChange={(newRole: Role) => {
            setIsSidebarOpen(false);
            
            if (newRole === 'GUEST') {
              router.replace('/');
            } else if (newRole === 'JANITOR') {
              // router.replace('/(janitor)/tasks'); 
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layoutContainer: {
    flex: 1,
    position: 'relative', // Ensures the absolute-positioned sidebar tracks layout constraints properly
    padding: 10,
  },
  headerLeftPadding: {
    paddingLeft: s(10), // Give buttons a little breathing room from the edges
  },
  headerRightPadding: {
    paddingRight: s(10),
  },
});