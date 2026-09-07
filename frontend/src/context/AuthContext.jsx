import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configuration globale de l'URL API (utile si le backend est hébergé séparément, ex: Railway)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://gebatrh-production.up.railway.app' : '');
if (API_URL) {
  axios.defaults.baseURL = API_URL;
}

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
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object' && parsed.token && typeof parsed.token === 'string') {
          setUser(parsed);
        } else {
          localStorage.removeItem('sirh_auth_user');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error parsing saved user session:', error);
      localStorage.removeItem('sirh_auth_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    if (userData && userData.token) {
      setUser(userData);
      localStorage.setItem('sirh_auth_user', JSON.stringify(userData));
    }
  };

  const updateUser = (newUserData) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...newUserData };
      localStorage.setItem('sirh_auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
