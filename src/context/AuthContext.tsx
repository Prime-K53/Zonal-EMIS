import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchCurrentUser(): Promise<User | null> {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload.user ?? null;
}

function clearLegacyTokens() {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await res.json();
    const nextUser = data.user ?? await fetchCurrentUser();

    if (!nextUser) {
      throw new Error('Login succeeded but the user session could not be restored');
    }

    clearLegacyTokens();
    setUser(nextUser);
    window.dispatchEvent(new Event('auth:changed'));
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
      throw new Error(error.message || 'Registration failed');
    }

    const data = await res.json();
    const nextUser = data.user ?? await fetchCurrentUser();

    if (!nextUser) {
      throw new Error('Registration succeeded but the user session could not be restored');
    }

    clearLegacyTokens();
    setUser(nextUser);
    window.dispatchEvent(new Event('auth:changed'));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      clearLegacyTokens();
      setUser(null);
      window.dispatchEvent(new Event('auth:changed'));
    }
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
