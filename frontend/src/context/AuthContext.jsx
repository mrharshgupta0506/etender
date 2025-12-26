import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const STORAGE_KEY = 'etender_auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper to decode JWT and check expiry
  const isTokenExpired = (jwtToken) => {
    if (!jwtToken) return true;
    try {
      const payload = JSON.parse(atob(jwtToken.split('.')[1]));
      if (!payload.exp) return false;
      // exp is in seconds
      return Date.now() / 1000 > payload.exp;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token && isTokenExpired(parsed.token)) {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setToken(null);
          navigate('/login', { replace: true });
        } else {
          setUser(parsed.user || null);
          setToken(parsed.token || null);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, [navigate]);

  // Auto-logout if token expires during session
  useEffect(() => {
    if (!token) return;
    const payload = (() => {
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch {
        return null;
      }
    })();
    if (!payload?.exp) return;
    const expiryMs = payload.exp * 1000 - Date.now();
    if (expiryMs <= 0) {
      logout();
      navigate('/login', { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      logout();
      navigate('/login', { replace: true });
    }, expiryMs);
    return () => clearTimeout(timer);
  }, [token, navigate]);

  const login = (nextToken, nextUser) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


