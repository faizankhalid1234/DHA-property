import { createContext, useContext, useState, useEffect } from 'react';
import api, { getApiError } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('dha_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (!['super_admin', 'admin'].includes(data.data.role)) {
        throw new Error('Access denied. Admin only.');
      }
      localStorage.setItem('dha_admin_token', data.data.token);
      localStorage.setItem('dha_admin_user', JSON.stringify(data.data));
      setUser(data.data);
      return data.data;
    } catch (err) {
      const message = getApiError(err);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dha_admin_token');
    localStorage.removeItem('dha_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
