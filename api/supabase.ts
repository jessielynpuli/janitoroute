// api/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// 1. The Universal Storage Wrapper
const UniversalStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      // Safety check for SSR builds (avoids the "window is not defined" error)
      if (typeof window === 'undefined') return null; 
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key); // For iOS/Android
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
      return;
    }
    AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
      return;
    }
    AsyncStorage.removeItem(key);
  },
};

// 2. Initialize the client using our Universal wrapper
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: UniversalStorage, // <-- We drop it in right here
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 