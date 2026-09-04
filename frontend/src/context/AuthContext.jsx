import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Intercepteur Axios global enregistré immédiatement au chargement du module
axios.interceptors.request.use((config) => {
  try {
    const savedUser = localStorage.getItem('sirh_auth_user');
    if (savedUser && savedUser !== 'undefined') {
      const parsed = JSON.parse(savedUser);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch (e) {}
  return config;
}, (error) => Promise.reject(error));

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sirh_auth_user');
      if (savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error parsing saved user session:', error);
      localStorage.removeItem('sirh_auth_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('sirh_auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sirh_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
