import React, { createContext, ReactNode, useContext, useState } from 'react';

// Define the available roles in your app
type Role = 'ADMIN' | 'JANITOR' | 'GUEST';

// Define the shape of the context data
interface AuthContextType {
  role: Role | 'GUEST'; // The current user role
  setRole: (role: Role | 'GUEST') => void; // Function to update the role
  isLoading: boolean; // Useful for showing a loading spinner during auth checks
}

// Create the Context object
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The Provider component that wraps the app and provides the state
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role | 'GUEST'>('GUEST'); // Initialize role as 'GUEST'
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  return (
    // Pass the state and setter function down to the rest of the app
    <AuthContext.Provider value={{ role, setRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// A custom hook to easily access auth state from any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};