import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { api } from '../utils/axiosInstance';

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

      if (!storedUser || !token) {
        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // Load cached user
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
      // Fetch latest profile
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
    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );

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

    const data = response.data;

    // ----------------------------------------------------------
    // Google account needs password setup
    // ----------------------------------------------------------

    if (data.requires_password_setup) {
      return data;
    }

    // ----------------------------------------------------------
    // Normal Google login
    // ----------------------------------------------------------

    const { user, access_token } = data;

    localStorage.setItem(
      'token',
      access_token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );

    setUser(user);

    return data;
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const register = async (userData) => {
    const response = await api.auth.register(
      userData
    );

    /*
      New backend registration does NOT log the user in.

      Backend returns:

      {
        message: "...",
        email: "user@example.com"
      }

      Therefore:
      - Do NOT save token
      - Do NOT save user
      - Do NOT setUser()
      - Return backend response
    */

    return response.data;
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