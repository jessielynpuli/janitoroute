import HelpButton from '@/components/HelpButton';
import MenuButton from '@/components/MenuButton';
import Sidebar from '@/components/SideBar';
import { AuthProvider } from '@/constants/AuthContext';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function RootLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <View style={styles.container}>
        {/* The Stack now handles the Header buttons universally */}
        <Stack
          screenOptions={{
            headerShown: true,
            headerTitleAlign: 'center', // <--- THIS CENTERS THE TITLE
            headerLeft: () => (
              <View style={styles.headerLeftPadding}>
                <MenuButton onPress={() => setIsSidebarOpen(true)} />
              </View>
            ),
            headerRight: () => (
              <View style={styles.headerRightPadding}>
                <HelpButton onPress={() => console.log('Help opened!')} />
              </View>
            ),
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="(admin)" options={{ title: 'Admin' }} />
          <Stack.Screen name="(janitor)" options={{ title: 'Janitor' }} />
        </Stack>

        {/* Sidebar Overlay (Universal) */}
        {isSidebarOpen && (
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        )}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  headerLeftPadding: { paddingLeft: 10 },
  headerRightPadding: { paddingRight: 10 },
});