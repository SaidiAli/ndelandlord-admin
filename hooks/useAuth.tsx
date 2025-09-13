'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authStorage } from '@/lib/auth';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user && !!authStorage.getToken();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authStorage.getToken();
        const storedUser = authStorage.getUser();

        if (token && storedUser) {
          // Verify token is still valid by calling /me endpoint
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            authStorage.setUser(currentUser); // Update stored user data
          } catch (error) {
            // Token is invalid, clear auth data
            authStorage.clear();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password });
      authStorage.setToken(response.token);
      authStorage.setUser(response.user);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      authStorage.setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}