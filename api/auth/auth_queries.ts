// api/auth/auth_queries.ts
import { supabase } from '../supabase'; // Your standard Supabase client

// 1. Silent Sign-In for General Users
export const signInAnonymously = async () => {
  // Supabase automatically generates the token and saves it to the browser/device!
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    return { success: false, errorMessage: error.message }; 
  }
  
  return { success: true, user: data.user };
};

// 2. PIN Code Verification for Staff
export const verifyStaffPin = async (enteredPin: string) => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key_name')
    .eq('key_value', enteredPin)
    .single();

  if (error || !data) {
    return { success: false, role: null };
  }
  
  return { success: true, role: data.key_name };
};