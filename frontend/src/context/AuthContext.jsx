import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USER } from '../data/mockData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || localStorage.getItem('unievent_token') || null;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('unievent_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return MOCK_USER;
      }
    }
    return MOCK_USER;
  });

  const login = (tokenData, fallbackUser = null) => {
    let accessToken = null;
    let userData = null;

    if (typeof tokenData === 'string') {
      accessToken = tokenData;
      userData = fallbackUser || MOCK_USER;
    } else if (tokenData && tokenData.access_token) {
      accessToken = tokenData.access_token;
      userData = {
        id: tokenData.user?.id || 'usr_0918',
        name: tokenData.user?.name || fallbackUser?.name || 'Alexandre Morgan',
        email: tokenData.user?.email || fallbackUser?.email || 'alex.morgan@university.edu',
        role:
          tokenData.user?.roles?.[0]?.role_name ||
          fallbackUser?.role ||
          'Student Organizer',
        department: fallbackUser?.department || 'Computer Science & Engineering Society',
      };
    } else {
      userData = fallbackUser || MOCK_USER;
    }

    if (accessToken) {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('unievent_token', accessToken);
      setToken(accessToken);
    }

    if (userData) {
      localStorage.setItem('unievent_user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('unievent_token');
    localStorage.removeItem('unievent_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token || !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
