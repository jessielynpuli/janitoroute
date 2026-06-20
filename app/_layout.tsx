import HelpButton from '@/components/HelpButton';
import HelpModal from '@/components/HelpModal';
import MenuButton from '@/components/MenuButton';
import Sidebar from '@/components/SideBar';
import { AuthProvider, useAuth } from '@/constants/AuthContext';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// This component now has access to useAuth() because it's wrapped by the Provider
function MainContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const { role } = useAuth();

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Text style={styles.logoText}>
                Janito<Text style={styles.logoGreen}>Route</Text>
              </Text>
            </View>
          ),
          headerLeft: () => (
            <View style={styles.headerLeftPadding}>
              <MenuButton onPress={() => setIsSidebarOpen(true)} />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRightPadding}>
              <HelpButton onPress={() => setHelpVisible(true)} />
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(admin)/map" />
        <Stack.Screen name="(janitor)/janitor" />
      </Stack>

      {/* Modals and Sidebars are placed outside the Stack but inside the container */}
      <HelpModal 
        visible={helpVisible} 
        onClose={() => setHelpVisible(false)} 
        role={role || 'GUEST'} 
      />

      {isSidebarOpen && (
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      )}
    </View>
  );
}

// The RootLayout just provides the context to everything below it
export default function RootLayout() {
  return (
    <AuthProvider>
      <MainContent />
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#0D47A1' 
  },
  logoGreen: { 
    color: '#1B5E20' 
  },
});