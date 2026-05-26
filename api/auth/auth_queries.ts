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


export const signInJanitor = async (username: string, password: string) => {
  

  // Supabase requires phone number or email
  // Convert the username into a fake email behind the scenes
  // Sa UI, username lang tatanggapin nito. This function below will convert the username into email
  // Example: "Janitor1 " becomes "janitor1@janitor.local"
  const formattedEmail = `${username.trim().toLowerCase()}@janitor.local`;

  // Send the formatted email to Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formattedEmail,
    password: password,
  });

  if (error) {
    // Keep the error message relevant to what the user actually typed!
    return { success: false, errorMessage: "Invalid username or password." };
  }

  // Verify they are actually a janitor (Security check)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError || profile?.role !== 'janitor') {
    await supabase.auth.signOut();
    return { success: false, errorMessage: "Unauthorized account." };
  }

  return { success: true, user: data.user, role: profile.role };
};