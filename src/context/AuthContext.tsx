import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('access_token');
        if (!storedToken) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('access_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      throw new Error(message || error.error || 'Login failed');
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      const message = Array.isArray(error.message) ? error.message[0] : error.message;
      throw new Error(message || error.error || 'Registration failed');
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    setUser(data.user);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('access_token');
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
