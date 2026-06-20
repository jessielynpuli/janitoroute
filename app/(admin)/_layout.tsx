import { BottomNavBar } from '@/components/AdminBottomNavbar';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  // Keep your font loading here if it's only needed for these specific screens
  const [loaded] = useFonts({
    'Dropdown-Placeholder': require('@/assets/fonts/Roboto-ExtraBold.ttf'),
    'Dropdown-Options': require('@/assets/fonts/Roboto-Medium.ttf'),
    'ForOval-Font': require('@/assets/fonts/Inter_28pt-ExtraBold.ttf'),
    'Inter-Font': require('@/assets/fonts/Inter_18pt-SemiBold.ttf'),
  });

  if (!loaded) return null; 

  return (
    <Tabs
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: false, // Set to false! The RootLayout is already showing the header
        tabBarActiveTintColor: '#2f95dc',
        tabBarStyle: { paddingBottom: 30, height: 60 },
      }}
    >
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="edit_map" options={{ title: 'Edit Map' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
    </Tabs>
  );
}