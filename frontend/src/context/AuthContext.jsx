import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || localStorage.getItem('unievent_token') || null;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('unievent_user');
    const savedToken = localStorage.getItem('token') || localStorage.getItem('unievent_token');
    if (saved && savedToken) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = (tokenData, fallbackUser = null) => {
    let accessToken = null;
    let userData = null;

    if (typeof tokenData === 'string') {
      accessToken = tokenData;
      userData = fallbackUser || {
        id: 'usr_active',
        name: 'Active User',
        email: 'user@vit.edu',
        role: 'Student Organizer',
        department: 'Student Organization Directorate',
      };
    } else if (tokenData && tokenData.access_token) {
      accessToken = tokenData.access_token;
      userData = {
        id: tokenData.user?.id || fallbackUser?.id || 'usr_active',
        name: tokenData.user?.name || fallbackUser?.name || tokenData.user?.email || 'Active User',
        email: tokenData.user?.email || fallbackUser?.email || '',
        role:
          tokenData.user?.roles?.[0]?.role_name ||
          fallbackUser?.role ||
          'Student Organizer',
        department:
          fallbackUser?.department ||
          (tokenData.user?.roles?.[0]?.role_name === 'Faculty Advisor'
            ? 'Academic Review Directorate'
            : tokenData.user?.roles?.[0]?.role_name === 'Finance Officer'
            ? 'University Finance Office'
            : tokenData.user?.roles?.[0]?.role_name === 'Security Officer'
            ? 'Campus Security Directorate'
            : tokenData.user?.roles?.[0]?.role_name === 'Admin'
            ? 'Central Administration'
            : 'Student Technical Association'),
      };
    } else if (fallbackUser) {
      userData = fallbackUser;
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
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout }}>
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
