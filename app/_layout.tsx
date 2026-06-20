import HelpButton from '@/components/HelpButton';
import MenuButton from '@/components/MenuButton';
import Sidebar from '@/components/SideBar';
import { AuthProvider } from '@/constants/AuthContext';
import { Stack } from 'expo-router';
import { default as React, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RootLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
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
                <HelpButton onPress={() => console.log('Help opened!')} />
              </View>
            ),
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(janitor)" />
        </Stack>

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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#0D47A1' // Match your sidebar blue
  },
  logoGreen: { 
    color: '#1B5E20' // Match your sidebar green
  },
});