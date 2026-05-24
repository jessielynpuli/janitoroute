import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { s } from 'react-native-size-matters';

interface HelpButtonProps {
  onPress: () => void;
}

const BUTTON_SIZE = s(40);
const ICON_SIZE = BUTTON_SIZE * 0.6;

const HelpButton = ({ onPress }: HelpButtonProps) => {
  return (
    <View style={styles.anchorContainer}>
      <TouchableOpacity style={styles.squareButton} onPress={onPress}>
        <Ionicons 
          name="help"
          size={ICON_SIZE}
          color="#ffffff"
        />
      </TouchableOpacity>
    </View>
  );
}
export default HelpButton;

const styles = StyleSheet.create({
  anchorContainer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  squareButton: {
    width: '100%',
    height: '100%',  
    borderRadius: 32.5,         
    backgroundColor: '#007AFF',  
    justifyContent: 'center',
    alignItems: 'center',
    
    // Rendering security layers
    overflow: 'hidden',
    
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',            
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});