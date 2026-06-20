import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/constants/AuthContext';

//for verification
import AdminPasskeyModal from '@/components/AdminPasskeyModal';
import JanitorPasskeyModal from './JanitorPasskeyModal';

const ROLE_ICONS = {
  ADMIN: require('@/assets/images/admin-icon.png'),
  JANITOR: require('@/assets/images/janitor-icon.png'),
  SUPPORT: require('@/assets/images/support-icon.png'),
}

export default function SideBar({ onClose }: { onClose: () => void }) {
  // Pull the current role and the setter function from your global AuthContext
  const { role, setRole } = useAuth();
  const router = useRouter();
  const roleIconSource = role && role !== 'GUEST' ? ROLE_ICONS[role as keyof typeof ROLE_ICONS] : null;
  
  const [passkeyVisible, setPasskeyVisible] = useState(false);
  const [janitorLoginVisible, setJanitorLoginVisible] = useState(false);

  // Helper to color-code based on the current context role
  const getRoleColor = (r: string | null) => {
    if (r === 'ADMIN') return '#8B0000';
    if (r === 'JANITOR') return '#0D47A1';
    return '#555';
  };

  return (
    <SafeAreaView style={styles.sidebarContainer}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Janito<Text style={styles.logoGreen}>Route</Text></Text>
        <TouchableOpacity onPress={onClose}>
          <Text><FontAwesome name="close" size={24} color="black" /></Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerLine} />

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Current Role:</Text>

        <View style={styles.roleDisplayBox}>
          <Text style={[styles.roleDisplayText, { color: getRoleColor(role) }]}>
            {role || 'GUEST'}
          </Text>
          {role !== 'GUEST' && (
            <Image source={ROLE_ICONS[role as keyof typeof ROLE_ICONS]} style={styles.roleIcon} />
          )}
        </View>
   
        {/* Change Role Section */}
        <Text style={styles.sectionLabel}>Change Role:</Text>

        {/* Always show GUEST button unless already GUEST */}
        {role !== 'GUEST' && (
          <TouchableOpacity style={styles.button} onPress={() => { setRole('GUEST'); router.replace('/'); onClose(); }}>
            <Text style={styles.buttonText}>GUEST</Text>
          </TouchableOpacity>
        )}

        {/*JANITOR button */}
        {role !== 'JANITOR' && (
          <TouchableOpacity style={styles.button} onPress={() => setJanitorLoginVisible(true)}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>JANITOR</Text>
              <View style={styles.iconSpacer} />
              <Image source={ROLE_ICONS.JANITOR} style={styles.roleIcon} />
            </View>
          </TouchableOpacity>
        )}

        {/*ADMIN button */}
        {role === 'JANITOR' && (
          <TouchableOpacity style={styles.button} onPress={() => setPasskeyVisible(true)}>
            <View style={styles.buttonContent}>
              <Text style={[styles.buttonText, { color: '#8B0000' }]}>ADMIN</Text>
              <View style={styles.iconSpacer} />
              <Image source={ROLE_ICONS.ADMIN} style={styles.roleIcon} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Contact Us:</Text>
        <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
              Linking.openURL(`mailto:${email}`);
            }}
          >
            <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>SUPPORT</Text>
            <View style={styles.iconSpacer} />
            <Image 
              source={require('@/assets/images/support-icon.png')} 
              style={styles.roleIcon} 
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer Branding Logo */}
      <View style={styles.footer}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.footerLogo} 
        />
        <Text style={styles.footerText}>v1.0</Text>
      </View>

      {/* These modals now just call setRole when successful */}
      <AdminPasskeyModal
          visible={passkeyVisible}
          onClose={() => setPasskeyVisible(false)}
          onSuccess={() => {
            setPasskeyVisible(false);
            setRole('ADMIN');
            onClose(); 
            router.replace('/(admin)/map');
          }}
        />

        <JanitorPasskeyModal
          visible={janitorLoginVisible}
          onClose={() => setJanitorLoginVisible(false)}
          onSuccess={() => {
            setJanitorLoginVisible(false);
            setRole('JANITOR');
            onClose(); 
            router.replace('/(janitor)/janitor');
          }}
        />
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    right: 0, 
    width: width * 0.75, 
    height: '100%',
    backgroundColor: '#B3D7E8',
    zIndex: 20,
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
  footerText: {
  fontSize: 12,
  color: '#4682B4',
  fontWeight: '600',
  },
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
  iconSpacer: {
    width: 10,
  },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1', letterSpacing: 1 },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#AAB8C2',
    marginTop: 'auto', // Pushes the footer to the bottom of the content container
  },
  footerLogo: {
    width: 150,
    height: 150,
    marginBottom: 8,
  },
    buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIcon: {
  width: 24,
  height: 24,
  marginLeft: 8,
  },
});


