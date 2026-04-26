import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchCurrentUser(): Promise<User | null> {
  return dataService.getCurrentUser() as Promise<User | null>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const handleUnauthorized = () => {
      if (!cancelled) {
        setUser(null);
        setLoading(false);
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    void restoreSession();

    return () => {
      cancelled = true;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await dataService.login(email, password);
      const nextUser = await dataService.getCurrentUser();
      if (!nextUser) {
        throw new Error('Login succeeded but the user session could not be restored');
      }
      setUser(nextUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await dataService.signup(email, password, name);
      const nextUser = await dataService.getCurrentUser();
      if (!nextUser) {
        throw new Error('Registration succeeded but the user session could not be restored');
      }
      setUser(nextUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await dataService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
