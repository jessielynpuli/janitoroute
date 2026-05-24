import { Colors } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { s } from 'react-native-size-matters';

// 1. Import your brand new reusable button component!
import HelpButton from '@/components/HelpButton';
import MenuButton from '@/components/MenuButton';

export default function HomeScreen() {
  
  // 2. This is the action you want to happen when the button is clicked on THIS screen
  const handleHelpPress = () => {
    console.log('Help opened from the Home Screen!');
  };
const handleMenuPress = () => {
    console.log('Menu opened from the Home Screen!');
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      
      // Home Screen Header
      <View style={styles.header}>
        <MenuButton onPress={handleMenuPress} />
        <Text style={[styles.welcomeText, { color: Colors.text }]}>
            Janitoroute - Home Screen
        </Text>
        <HelpButton onPress={handleHelpPress} />
      </View>

      <View style={styles.centerContent}>
        <Text style={[styles.welcomeText, { color: Colors.text }]}>
          Currently Testing the App!
        </Text>
      </View>



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: s(20),
    marginTop: s(20)
  }
});