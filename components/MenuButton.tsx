import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { s } from 'react-native-size-matters';

interface MenuButtonProps {
  onPress: () => void;
}

const BUTTON_SIZE = s(40);
const ICON_SIZE = BUTTON_SIZE * 0.8;

const MenuButton = ({ onPress }: MenuButtonProps) => {
  return (
    <View style={styles.anchorContainer}>
      <TouchableOpacity style={styles.squareButton} onPress={onPress}>
        <Ionicons 
          name="menu"
          size={ICON_SIZE}
          color="#097000"
        />
      </TouchableOpacity>
    </View>
  );
}
export default MenuButton;

const styles = StyleSheet.create({
  anchorContainer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  squareButton: {
    width: '100%',
    height: '100%',       
    backgroundColor: '#D9EAD3',  
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#097000',
    borderWidth: 2,
    
    // Rendering security layers
    overflow: 'hidden',
    
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
});