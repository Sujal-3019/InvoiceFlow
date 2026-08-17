import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiCheck } from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

import { api } from '../../utils/axiosInstance';

const GooglePasswordSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { updateProfile } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ----------------------------------------------------------
  // Get temporary setup token
  // ----------------------------------------------------------

  const setupToken =
    location.state?.setupToken ||
    sessionStorage.getItem('google_setup_token');

  const googleUser =
    location.state?.user ||
    JSON.parse(
      sessionStorage.getItem('google_setup_user') || 'null'
    );

  // ----------------------------------------------------------
  // Password strength
  // ----------------------------------------------------------

  const passwordStrength = () => {
    const password = formData.password;

    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
  };

  const getStrengthText = () => {
    const strength = passwordStrength();

    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';

    return 'Strong';
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();

    if (strength <= 2) return 'bg-danger';
    if (strength <= 3) return 'bg-warning';

    return 'bg-success';
  };

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password =
        'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        'Please confirm your password';
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        'Passwords do not match';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!setupToken) {
      error(
        'Password setup session has expired. Please sign in with Google again.'
      );

      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // ------------------------------------------------------
      // IMPORTANT
      //
      // The backend's /auth/set-password endpoint expects
      // authentication through the Bearer token.
      //
      // Temporarily use the Google password-setup token.
      // ------------------------------------------------------

      const response = await api.post(
        '/auth/set-password',
        {
          password: formData.password,
          confirm_password: formData.confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${setupToken}`,
          },
        }
      );

      const {
        access_token,
        user,
      } = response.data;

      // ------------------------------------------------------
      // Save normal authentication token
      // ------------------------------------------------------

      localStorage.setItem(
        'token',
        access_token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(user)
      );

      // Update AuthContext immediately
      updateProfile(user);

      // Clean temporary Google setup data
      sessionStorage.removeItem(
        'google_setup_token'
      );

      sessionStorage.removeItem(
        'google_setup_user'
      );

      success(
        'Password created successfully! Welcome to InvoiceFlow.'
      );

      navigate('/dashboard');

    } catch (err) {
      console.error(
        'Password setup error:',
        err
      );

      error(
        err?.response?.data?.detail ||
        'Failed to create password. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // No setup token
  // ----------------------------------------------------------

  if (!setupToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-6">

        <Card className="w-full max-w-md border-0 shadow-lg">

          <div className="text-center">

            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-danger/10 flex items-center justify-center">
              <FiLock
                size={26}
                className="text-danger"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Setup session expired
            </h2>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Please sign in with Google again to continue.
            </p>

            <Button
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>

          </div>

        </Card>

      </div>
    );
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg">

      {/* ======================================================
          LEFT SIDE
      ====================================================== */}

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-dark to-primary relative overflow-hidden">

        <div className="absolute inset-0 opacity-10">

          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow" />

          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse-slow"
            style={{
              animationDelay: '1s',
            }}
          />

        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
            }}
          >

            <div className="flex items-center gap-3 mb-8">

              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">

                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>

              </div>

              <span className="text-2xl font-bold">
                InvoiceFlow
              </span>

            </div>

            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Secure Your <br />
              InvoiceFlow Account
            </h1>

            <p className="text-xl text-white/80 mb-8 max-w-md">
              Your Google account is connected. Create a
              password so you can also securely access your
              InvoiceFlow account with email and password.
            </p>

            <div className="space-y-4">

              {[
                'Secure account access',
                'Use Google or email login',
                'Your existing data stays safe',
              ].map((feature, index) => (

                <div
                  key={index}
                  className="flex items-center gap-3"
                >

                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">

                    <FiCheck size={14} />

                  </div>

                  <span className="text-white/90">
                    {feature}
                  </span>

                </div>

              ))}

            </div>

          </motion.div>

        </div>

      </div>

      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="w-full max-w-md"
        >

          <Card className="border-0 shadow-lg">

            {/* Header */}

            <div className="mb-8">

              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">

                <FiLock
                  size={24}
                  className="text-primary"
                />

              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Create your password
              </h2>

              <p className="text-gray-500 dark:text-gray-400">
                Your Google account is connected. Create a
                password for additional login access.
              </p>

              {googleUser?.email && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-dark-bg">

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Account
                  </p>

                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {googleUser.email}
                  </p>

                </div>
              )}

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                error={errors.password}
                required
                leftIcon={
                  <FiLock size={18} />
                }
                hint="Use 8+ characters with letters, numbers & symbols"
              />

              {/* Password strength */}

              {formData.password && (

                <div className="space-y-2">

                  <div className="flex gap-1">

                    {[1, 2, 3, 4, 5].map(
                      (level) => (

                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength()
                              ? getStrengthColor()
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />

                      )
                    )}

                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">

                    Password strength:{' '}

                    <span className="font-medium">
                      {getStrengthText()}
                    </span>

                  </p>

                </div>

              )}

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                error={errors.confirmPassword}
                required
                leftIcon={
                  <FiLock size={18} />
                }
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Create Password
              </Button>

            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              You can continue using Google sign-in after
              creating your password.
            </p>

          </Card>

        </motion.div>

      </div>

    </div>
  );
};

export default GooglePasswordSetup;