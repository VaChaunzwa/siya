import React, {createContext, useContext, useEffect, useState} from 'react';
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import authService from '../../services/authService';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'dispatcher' | 'driver' | 'client' | 'fleet_manager';
  name?: string;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      setIsLoading(true);
      
      if (firebaseUser) {
        try {
          // Get user data from authService
          const userData = await authService.getCurrentUser();
          setUserState(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserState(null);
        }
      } else {
        setUserState(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login({ email, password });
      if (result.success && result.user) {
        setUserState(result.user);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
      setUserState(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{user, isLoading, signIn, signOut}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};