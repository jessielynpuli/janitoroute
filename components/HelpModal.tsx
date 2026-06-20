import { HELP_SECTIONS } from '@/constants/HelpText';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AccordionItem from './AccordionItem';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  role: 'ADMIN' | 'JANITOR' | 'GUEST';
}

export default function HelpModal({ visible, onClose, role }: HelpModalProps) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Help Center</Text>
        <ScrollView>
          {/* Always show System and Support */}
          {HELP_SECTIONS.SYSTEM.map((item, i) => <AccordionItem key={i} {...item} />)}
          
          {/* Show Role Specific */}
          {role === 'GUEST' && HELP_SECTIONS.GUEST.map((item, i) => <AccordionItem key={i} {...item} />)}
          {role === 'JANITOR' && HELP_SECTIONS.JANITOR.map((item, i) => <AccordionItem key={i} {...item} />)}
          {role === 'ADMIN' && HELP_SECTIONS.ADMIN.map((item, i) => <AccordionItem key={i} {...item} />)}
          
          {HELP_SECTIONS.SUPPORT.map((item, i) => <AccordionItem key={i} {...item} />)}
        </ScrollView>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#F0F8FF' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0D47A1' },
  closeBtn: { backgroundColor: '#0D47A1', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 }
});