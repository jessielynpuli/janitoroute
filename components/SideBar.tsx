import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';


type Role = 'ADMIN' | 'JANITOR' | 'GUEST';

interface SidebarProps {
  currentRole: Role;
  onClose: () => void;
  onRoleChange: (newRole: Role) => void;
}

export default function SideBar({ currentRole, onClose, onRoleChange }: SidebarProps) {
  
  // Helper to color-code the role indicators dynamically
  const getRoleColor = (role: Role) => {
    if (role === 'ADMIN') return '#8B0000'; // Dark Red
    if (role === 'JANITOR') return '#0D47A1'; // Blue
    return '#555'; // Gray for Guest
  };

  return (
    <SafeAreaView style={styles.sidebarContainer}>
      {/* Top Header Row */}
      <View style={styles.header}>
        <Text style={styles.logoText}>
          Janito<Text style={styles.logoGreen}>Route</Text>
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.menuIcon}><FontAwesome name="close" size={24} color="black" /></Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerLine} />

      {/* Main Action Area */}
      <View style={styles.content}>
        
        {/* SECTION 1: Current Role */}
        <Text style={styles.sectionLabel}>Current Role:</Text>
        <View style={[styles.roleDisplayBox, { borderColor: '#0D47A1' }]}>
          <Text style={[styles.roleDisplayText, { color: getRoleColor(currentRole) }]}>
            {currentRole}
          </Text>
          {currentRole !== 'GUEST' && (
            <Text style={[styles.icon, { color: getRoleColor(currentRole) }]}>
              {currentRole === 'ADMIN' ? <MaterialCommunityIcons name="account-star" size={24} color="black" /> : <FontAwesome5 name="user-alt" size={24} color="black" />}
            </Text>
          )}
        </View>

        {/* SECTION 2: Change Role / Sign In (Conditional Rendering) */}
        {currentRole === 'ADMIN' && (
          <>
            <Text style={styles.sectionLabel}>Change Role:</Text>
            <TouchableOpacity style={styles.button} onPress={() => onRoleChange('GUEST')}>
              <Text style={styles.buttonText}>GUEST</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => onRoleChange('JANITOR')}>
              <Text style={styles.buttonText}>JANITOR <FontAwesome5 name="user-alt" size={18} color="black" /></Text>
            </TouchableOpacity>
          </>
        )}

        {currentRole === 'JANITOR' && (
          <>
            <Text style={styles.sectionLabel}>Change Role:</Text>
            <TouchableOpacity style={styles.button} onPress={() => onRoleChange('GUEST')}>
              <Text style={styles.buttonText}>GUEST</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionLabel}>Sign in:</Text>
            <TouchableOpacity style={styles.button} onPress={() => onRoleChange('ADMIN')}>
              <Text style={[styles.buttonText, { color: '#8B0000' }]}>ADMIN 👤⭐</Text>
            </TouchableOpacity>
          </>
        )}

        {currentRole === 'GUEST' && (
          <>
            <Text style={styles.sectionLabel}>Sign in:</Text>
            <TouchableOpacity style={styles.button} onPress={() => onRoleChange('JANITOR')}>
              <Text style={styles.buttonText}>JANITOR 
              </Text>
              <FontAwesome5 name="user-alt" size={24} color="black" />
            </TouchableOpacity>
          </>
        )}

        {/* SECTION 3: Contact Support (Universal) */}
        <Text style={styles.sectionLabel}>Contact Us:</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>SUPPORT <MaterialIcons name="support-agent" size={24} color="black" /></Text>
        </TouchableOpacity>

      </View>

      {/* Footer Branding Logo */}
      <View style={styles.footer}>
        <Text style={styles.logoAbbreviation}>JR</Text>
        <Text style={styles.broomIcon}>🧹</Text>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    right: 0, // Swappable to left: 0 depending on your exact drawer preference
    width: width * 0.75, // Takes up 75% of the screen width
    height: '100%',
    backgroundColor: '#B3D7E8', // Light blue background from your wireframe
    zIndex: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#0D47A1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  logoText: { fontSize: 22, fontWeight: 'bold', color: '#0D47A1' },
  logoGreen: { color: '#1B5E20' },
  menuIcon: { fontSize: 26, color: '#1B5E20' },
  dividerLine: { height: 3, backgroundColor: '#1B5E20' },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 20 },
  sectionLabel: { fontSize: 13, color: '#4682B4', fontWeight: '600', marginTop: 15, marginBottom: 4 },
  roleDisplayBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    paddingVertical: 8,
    borderRadius: 2,
    gap: 8,
    marginBottom: 10,
  },
  roleDisplayText: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  icon: { fontSize: 18 },
  button: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#0D47A1',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 2,
    marginVertical: 5,
  },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1', letterSpacing: 1 },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  logoAbbreviation: {
    fontSize: 70,
    fontWeight: '900',
    color: '#0D47A1',
    fontFamily: 'serif',
  },
  broomIcon: {
    fontSize: 35,
    color: '#1B5E20',
    position: 'absolute',
    bottom: 10,
    right: '35%',
  },
});