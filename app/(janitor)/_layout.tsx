import { BottomNavBar } from '@/components/AdminBottomNavbar';
import { Tabs } from 'expo-router';
import React from 'react';

export default function JanitorLayout() {
  return (
      <Tabs
        tabBar={(props) => <BottomNavBar {...props} />}
        screenOptions={{
          headerShown: false, // Set to false! The RootLayout is already showing the header
          tabBarActiveTintColor: '#2f95dc',
          tabBarStyle: { paddingBottom: 30, height: 60 },
        }}
      >
      <Tabs.Screen name="janitor" options={{ title: 'Janitor Map' }} />
      <Tabs.Screen name="janitor-dashboard" options={{ title: 'Dashboard' }} />
    </Tabs>
  );
}