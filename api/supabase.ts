// api/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!; // Use your actual env variables
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,       // Tells Supabase to save the anon session here
    autoRefreshToken: true,      // Keeps the user logged in automatically
    persistSession: true,        // Remembers them when they close the app
    detectSessionInUrl: false,   // Not needed for mobile apps
  },
});