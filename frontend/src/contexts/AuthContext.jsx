import React, { createContext, useState, useEffect } from 'react';
import { getMyProfile, loginUser } from '../api/apiConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar auth al cargar
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profileData = await getMyProfile();
          setUser(profileData.user);
        } catch (error) {
          console.error("Token inválido o expirado", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await loginUser(username, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error al iniciar sesión' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
