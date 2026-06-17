import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const BottomNavBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const BRAND_BLUE = '#1E56A0';
  const ACTIVE_BLUE_BG = '#D6E4F0';

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isActive = state.index === index;

        const { options } = descriptors[route.key];
        
        // Use tabBarLabel if available, otherwise fallback to title, otherwise fallback to filename
        const label = 
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[
              styles.tab,
              isActive ? styles.activeTab : styles.inactiveTab,
              index > 0 && styles.borderLeft,
            ]}
            onPress={onPress}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E56A0',
    borderRadius: 4,
    marginHorizontal: 16,
    overflow: 'hidden',
    // Position it safely above screen bottom
    marginBottom: 24, 
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: { backgroundColor: '#D6E4F0' },
  inactiveTab: { backgroundColor: '#F8FAFC' },
  borderLeft: { borderLeftWidth: 2, borderColor: '#1E56A0' },
  tabText: { fontSize: 16, fontWeight: '500', color: '#1E56A0' },
  activeTabText: { fontWeight: '700' },
});