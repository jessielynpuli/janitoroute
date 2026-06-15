import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

interface ReportButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  title?: string;
}

export const ReportButton: React.FC<ReportButtonProps> = ({ 
  onPress, 
  title = "Report" 
}) => {
  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#D9EAD3', // Slate 800
    paddingVertical: 10,
    borderRadius: 50,
    borderColor: '#097000',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    // Component shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    color: '#097000',
    fontSize: 28,
    fontFamily: 'ForOval-Font',
    letterSpacing: 0.5,
  },
});