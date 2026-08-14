import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { api } from '../utils/axiosInstance';
import { GoogleOAuthProvider } from '@react-oauth/google';
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LOAD AUTHENTICATED USER
  // ============================================================

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      // No authentication data
      if (!storedUser || !token) {
        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // First load cached user for immediate UI
      // --------------------------------------------------------

      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Invalid stored user data:', error);

        localStorage.removeItem('user');
        localStorage.removeItem('token');

        setUser(null);
        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // Then fetch latest profile from backend
      // --------------------------------------------------------

      try {
        const response = await api.user.getProfile();

        const latestUser = response.data;

        setUser(latestUser);

        localStorage.setItem(
          'user',
          JSON.stringify(latestUser)
        );
      } catch (error) {
        console.error(
          'Failed to refresh user profile:',
          error
        );

        // Keep cached user if profile refresh fails.
        // Axios interceptor will handle 401 automatically.
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (email, password) => {
    const response = await api.auth.login({
      email,
      password,
    });

    const { user, access_token } = response.data;

    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));

    setUser(user);

    return user;
  };
  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  const googleLogin = async (googleToken) => {
    const response = await api.auth.googleLogin(
      googleToken
    );

    const { user, access_token } = response.data;

    localStorage.setItem(
      'token',
      access_token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );

    setUser(user);

    return user;
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const register = async (userData) => {
    const response = await api.auth.register(userData);

    const { user, access_token } = response.data;

    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));

    setUser(user);

    return user;
  };

  // ============================================================
  // REFRESH PROFILE
  // ============================================================

  const refreshProfile = async () => {
    try {
      const response = await api.user.getProfile();

      const latestUser = response.data;

      setUser(latestUser);

      localStorage.setItem(
        'user',
        JSON.stringify(latestUser)
      );

      return latestUser;
    } catch (error) {
      console.error(
        'Failed to refresh profile:',
        error
      );

      throw error;
    }
  };

  // ============================================================
  // UPDATE PROFILE STATE
  // ============================================================

  const updateProfile = (updates) => {
    setUser((currentUser) => {
      const updatedUser = {
        ...currentUser,
        ...updates,
      };

      localStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      );

      return updatedUser;
    });
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    setUser(null);

    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
        refreshProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;