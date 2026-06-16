import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

interface AddTrashbinButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  title?: string;
}

export const AddTrashbinButton: React.FC<AddTrashbinButtonProps> = ({ 
  onPress, 
  title = "Add Trashbin" 
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
    borderRadius: 3,
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
    margin: 1,
  },
  text: {
    padding: 5,
    color: '#097000',
    fontSize: 17,
    fontFamily: 'Inter-Font',
    letterSpacing: 0.5,
  },
});