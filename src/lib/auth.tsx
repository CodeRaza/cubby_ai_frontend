import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import api from '@/lib/axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => void;
  setAuthState: (authenticated: boolean, userData?: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const setAuthState = useCallback((authenticated: boolean, userData?: any) => {
    setIsAuthenticated(authenticated);
    if (authenticated && userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setAuthState(false);
        return false;
      }

      const response = await api.get('/api/auth/profile/');
      if (response.data) {
        setAuthState(true, response.data);
        // Force a small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 50));
        return true;
      }
      setAuthState(false);
      return false;
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens only if it's an auth error
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      setAuthState(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuthState(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, checkAuth, logout, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}