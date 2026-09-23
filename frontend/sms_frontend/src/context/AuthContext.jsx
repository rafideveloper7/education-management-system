/**
 * ============================================================================
 * FILE: src/context/AuthContext.jsx
 * PURPOSE: Global React Context for Authentication State Management.
 * ============================================================================
 * 
 * WHY USE CONTEXT FOR AUTH?
 * In a production web application, many components need to know:
 * 1. Is someone logged in? (`isAuthenticated`)
 * 2. Who is logged in and what is their role? (`user`, `user.role`)
 * 3. Can I trigger a login, register, or logout from anywhere? (`login()`, `register()`, `logout()`)
 * 
 * By wrapping the root of our app in <AuthProvider>, any component can simply call:
 *    const { user, login, logout } = useAuth();
 * 
 * TOKEN STORAGE STRATEGY:
 * - `sms_access_token`: Short-lived JWT used for API requests.
 * - `sms_refresh_token`: Long-lived token used to refresh sessions.
 * - `sms_user`: Cached user profile JSON for instant UI rendering on page refresh.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth.service';

// 1. Create the Context object
const AuthContext = createContext(null);

// Storage keys kept as constants to avoid typos
const ACCESS_TOKEN_KEY = 'sms_access_token';
const REFRESH_TOKEN_KEY = 'sms_refresh_token';
const USER_KEY = 'sms_user';

/**
 * AuthProvider component that wraps the application.
 */
export function AuthProvider({ children }) {
  // State for user data (id, fullName, email, role, status)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // State for token
  const [token, setToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY) || null);

  // Loading state indicates if we're verifying the token on initial app load
  const [isLoading, setIsLoading] = useState(true);

  // Helper to persist auth data to localStorage and component state
  const saveAuthSession = useCallback((authData) => {
    const { user: userData, accessToken, refreshToken } = authData;

    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      setToken(accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  // Helper to clear auth data from localStorage and component state
  const clearAuthSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /**
   * On initial mount, verify whether the saved access token is still valid.
   * If valid, refresh user details via `/auth/me`.
   * If expired or invalid, attempt refresh token exchange or log out.
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Check current profile from backend
        const res = await authService.getMe();
        if (res?.data?.user) {
          setUser(res.data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        }
      } catch (err) {
        // If access token is expired, try refreshing with refresh token
        if (storedRefreshToken) {
          try {
            const refreshRes = await authService.refreshAccessToken(storedRefreshToken);
            if (refreshRes?.data) {
              saveAuthSession(refreshRes.data);
              setIsLoading(false);
              return;
            }
          } catch (refreshErr) {
            console.warn('Session expired. Logging out.');
            clearAuthSession();
          }
        } else {
          clearAuthSession();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [saveAuthSession, clearAuthSession]);

  /**
   * Action: Register
   */
  const register = async (formData) => {
    const response = await authService.registerUser(formData);
    if (response?.data) {
      saveAuthSession(response.data);
    }
    return response;
  };

  /**
   * Action: Login
   */
  const login = async (credentials) => {
    const response = await authService.loginUser(credentials);
    if (response?.data) {
      saveAuthSession(response.data);
    }
    return response;
  };

  /**
   * Action: Logout
   */
  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) {
        await authService.logoutUser(refreshToken);
      }
    } catch (err) {
      console.warn('Server logout error:', err);
    } finally {
      clearAuthSession();
    }
  };

  // The value object provided to all consumer components
  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook: useAuth
 * Convenient shortcut so components don't have to import `useContext` and `AuthContext` manually.
 * 
 * Example usage:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
