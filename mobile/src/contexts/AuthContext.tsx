import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface AuthContextType {
  // Context can be extended as needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Initialize auth state, check token validity, etc.
  }, [isAuthenticated]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
