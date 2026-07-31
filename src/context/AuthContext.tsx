import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  school_id: number | null;
  permissions?: string[];
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLocked: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  lockSession: () => void;
  unlockSession: (password: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const loginUser = async (credentials: LoginCredentials) => {
  const response = await api.post('/login', credentials);
  const { access_token, user } = response.data;
  
  localStorage.setItem('auth_token', access_token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.removeItem('session_locked');
  
  return { user, token: access_token };
};

const logoutUser = async () => {
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('session_locked');
  }
};

const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user:', e);
      return null;
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
    if (localStorage.getItem('session_locked') === 'true') {
      setIsLocked(true);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!user || isLocked) return;
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      lockSession();
      toast('Session auto-locked due to inactivity', { icon: '🔒' });
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, isLocked]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach(ev => window.addEventListener(ev, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const { user } = await loginUser(credentials);
      setUser(user);
      setIsLocked(false);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setIsLocked(false);
    toast.success('Logged out successfully');
  };

  const lockSession = () => {
    setIsLocked(true);
    localStorage.setItem('session_locked', 'true');
  };

  const unlockSession = async (password: string): Promise<boolean> => {
    if (!user) return false;
    try {
      // Validate password against backend
      await api.post('/login', { email: user.email, password });
      setIsLocked(false);
      localStorage.removeItem('session_locked');
      toast.success('Session unlocked!');
      return true;
    } catch {
      toast.error('Invalid password. Session remains locked.');
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.user_type === 'super_admin') return true;
    return user.permissions?.includes(permission) ?? true;
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    if (user.user_type === 'super_admin') return true;
    return user.user_type === role || (user.roles?.includes(role) ?? false);
  };

  const isSuperAdmin = user?.user_type === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLocked,
        isAuthenticated: !!user,
        login,
        logout,
        lockSession,
        unlockSession,
        hasPermission,
        hasRole,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
