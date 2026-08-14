import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HomeRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  // Wait until authentication state is known
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Logged-in user → Dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Logged-out user → Landing Page
  return <Navigate to="/landing" replace />;
};

export default HomeRedirect;