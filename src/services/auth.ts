import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  school_id: number | null;
  mobile?: string;
  is_active?: boolean;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/login', credentials);
    const { access_token, user } = response.data;
    
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token: access_token };
  },
  
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },
  
  getCurrentUser: (): User | null => {
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
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};
