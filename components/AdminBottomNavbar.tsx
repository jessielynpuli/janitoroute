import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BottomNavBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const { options } = descriptors[route.key];
          
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
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: 'transparent', 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999, // Ensure it floats cleanly above map elements
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E56A0',
    borderRadius: 8, 
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: { backgroundColor: '#D6E4F0' },
  inactiveTab: { backgroundColor: '#F8FAFC' },
  borderLeft: { borderLeftWidth: 2, borderColor: '#1E56A0' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#1E56A0' },
  activeTabText: { fontWeight: '700' },
});