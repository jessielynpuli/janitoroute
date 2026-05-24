import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* This just displays your home screen without the native top header bar */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}