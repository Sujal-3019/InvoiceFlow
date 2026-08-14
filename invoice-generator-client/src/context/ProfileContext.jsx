import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api } from '../utils/axiosInstance';
import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.profile.get();

      setProfile(response?.data || null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadProfile();
  }, [authLoading, loadProfile]);

  const updateProfile = useCallback(async (payload) => {
    try {
      setError(null);

      const response = await api.profile.update(payload);

      const updatedProfile = response?.data || null;

      setProfile(updatedProfile);

      return updatedProfile;
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err);
      throw err;
    }
  }, []);

  const uploadLogo = useCallback(async (file) => {
    try {
      setError(null);

      const response = await api.profile.uploadLogo(file);

      const updatedProfile = response?.data || null;

      setProfile(updatedProfile);

      return updatedProfile;
    } catch (err) {
      console.error('Failed to upload logo:', err);
      setError(err);
      throw err;
    }
  }, []);

  const removeLogo = useCallback(async () => {
    try {
      setError(null);

      const response = await api.profile.removeLogo();

      const updatedProfile = response?.data || null;

      setProfile(updatedProfile);

      return updatedProfile;
    } catch (err) {
      console.error('Failed to remove logo:', err);
      setError(err);
      throw err;
    }
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        refreshProfile: loadProfile,
        updateProfile,
        uploadLogo,
        removeLogo,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error(
      'useProfile must be used inside ProfileProvider'
    );
  }

  return context;
};
