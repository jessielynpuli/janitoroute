import { Platform } from 'react-native';

export const Colors = {
  text: '#11181C',        // Your app's default dark charcoal text color
  background: '#ffffff',  // Your app's default clean white background
  tint: '#0a7ea4',        // Your app's main blue brand/accent color
  icon: '#687076',        // Your app's default grey icon color
};

export const Fonts = Platform.select({
  default: { sans: 'normal' },
});