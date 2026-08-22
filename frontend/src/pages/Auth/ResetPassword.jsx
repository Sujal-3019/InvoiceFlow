import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import apiPaths from "../../utils/apiPaths";
import React from "react";

import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { motion } from 'framer-motion';

import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiArrowLeft,
  FiShield,
} from 'react-icons/fi';

import { useToast } from '../../context/ToastContext';

import Button from '../../components/ui/Button';

import Input from '../../components/ui/Input';

import Card from '../../components/ui/Card';

const ResetPassword = () => {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const { success, error: showError } = useToast();

  // ============================================================
  // TOKEN
  // ============================================================

  const token = searchParams.get('token');


  // ============================================================
  // FORM STATE
  // ============================================================

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });


  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [resetComplete, setResetComplete] = useState(false);


  // ============================================================
  // PASSWORD REQUIREMENTS
  // ============================================================

  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
  };


  const passwordScore =
    Object.values(passwordRequirements).filter(Boolean).length;


  // ============================================================
  // PASSWORD STRENGTH
  // ============================================================

  const getPasswordStrength = () => {

    if (!formData.password) {
      return {
        label: '',
        width: '0%',
      };
    }

    if (passwordScore <= 1) {
      return {
        label: 'Weak',
        width: '25%',
      };
    }

    if (passwordScore === 2) {
      return {
        label: 'Fair',
        width: '50%',
      };
    }

    if (passwordScore === 3) {
      return {
        label: 'Good',
        width: '75%',
      };
    }

    return {
      label: 'Strong',
      width: '100%',
    };
  };


  const passwordStrength = getPasswordStrength();


  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {

    const newErrors = {};


    if (!token) {

      newErrors.token =
        'This password reset link is invalid or missing.';

    }


    if (!formData.password) {

      newErrors.password =
        'Password is required.';

    } else if (formData.password.length < 8) {

      newErrors.password =
        'Password must be at least 8 characters.';

    }


    if (!formData.confirmPassword) {

      newErrors.confirmPassword =
        'Please confirm your password.';

    } else if (
      formData.password !== formData.confirmPassword
    ) {

      newErrors.confirmPassword =
        'Passwords do not match.';

    }


    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange = (field, value) => {

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));


    // Remove field error while typing

    if (errors[field]) {

      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));

    }
  };


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {

    e.preventDefault();


    if (!validateForm()) {
      return;
    }


    setLoading(true);


    try {

      const response = await axiosInstance.post(
        apiPaths.auth.resetPassword,
        {
          token,
          password: formData.password,
          confirm_password:
            formData.confirmPassword,
        }
      );


      setResetComplete(true);


      success(
        response.data.message ||
        'Password reset successfully!'
      );


      // Redirect after a short delay

      setTimeout(() => {
        navigate('/login');
      }, 2000);


    } catch (err) {

      console.error(
        'Reset password error:',
        err
      );


      showError(
        err?.response?.data?.detail ||
        'Unable to reset your password. The link may be invalid or expired.'
      );

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // SUCCESS SCREEN
  // ============================================================

  if (resetComplete) {

    return (

      <div className="min-h-screen flex">

        {/* ====================================================
            LEFT BRANDING
        ==================================================== */}

        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">

          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark" />

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

                  <FiShield
                    size={24}
                    className="text-white"
                  />

                </div>

                <span className="text-2xl font-bold">
                  InvoiceFlow
                </span>

              </div>


              <h1 className="text-5xl font-bold mb-6 leading-tight">

                Your Account
                <br />

                Is Secure

              </h1>


              <p className="text-xl text-white/80 max-w-md">

                Your password has been updated successfully.
                You can now sign in and continue managing your
                invoices securely.

              </p>

            </motion.div>

          </div>

        </div>


        {/* ====================================================
            SUCCESS CONTENT
        ==================================================== */}

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.4,
            }}
            className="w-full max-w-md"
          >

            <Card className="border-0 shadow-lg text-center">

              <div className="flex justify-center mb-6">

                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">

                  <FiCheck
                    size={30}
                    className="text-green-600 dark:text-green-400"
                  />

                </div>

              </div>


              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">

                Password Reset Successful

              </h2>


              <p className="text-gray-500 dark:text-gray-400 mb-8">

                Your password has been changed successfully.
                You will be redirected to the login page shortly.

              </p>


              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Continue to Login
              </Button>

            </Card>

          </motion.div>

        </div>

      </div>

    );

  }


  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <div className="min-h-screen flex">


      {/* ======================================================
          LEFT SIDE - BRANDING
      ====================================================== */}

      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark" />


        {/* Animated Background */}

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

            {/* Logo */}

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

              Secure Your
              <br />

              Account

            </h1>


            <p className="text-xl text-white/80 mb-8 max-w-md">

              Create a strong new password to keep your
              invoices, clients, and business information secure.

            </p>


            {/* Security points */}

            <div className="space-y-4 text-white/80">

              <div className="flex items-center gap-3">

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">

                  <FiCheck size={16} />

                </div>

                <span>
                  Protect your business information
                </span>

              </div>


              <div className="flex items-center gap-3">

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">

                  <FiCheck size={16} />

                </div>

                <span>
                  Keep your invoices secure
                </span>

              </div>


              <div className="flex items-center gap-3">

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">

                  <FiCheck size={16} />

                </div>

                <span>
                  Sign in securely from anywhere
                </span>

              </div>

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
            delay: 0.2,
          }}
          className="w-full max-w-md"
        >

          <Card className="border-0 shadow-lg">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8">

              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">

                <FiLock size={22} />

              </div>


              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">

                Reset your password

              </h2>


              <p className="text-gray-500 dark:text-gray-400">

                Enter a new password for your InvoiceFlow account.

              </p>

            </div>


            {/* =================================================
                INVALID TOKEN
            ================================================= */}

            {errors.token ? (

              <div className="space-y-6">

                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4">

                  <div className="flex gap-3">

                    <FiLock
                      className="text-red-500 mt-0.5 flex-shrink-0"
                      size={18}
                    />

                    <div>

                      <p className="font-medium text-red-700 dark:text-red-400">

                        Invalid reset link

                      </p>

                      <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">

                        This link may be missing, expired, or
                        already used.

                      </p>

                    </div>

                  </div>

                </div>


                <Link
                  to="/forgot-password"
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary-dark font-medium"
                >

                  <FiArrowLeft size={16} />

                  Request a new reset link

                </Link>

              </div>

            ) : (

              /* =================================================
                 FORM
              ================================================= */

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* =================================================
                    NEW PASSWORD
                ================================================= */}

                <div className="relative">

                  <Input
                    label="New Password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={(e) =>
                      handleChange(
                        'password',
                        e.target.value
                      )
                    }
                    error={errors.password}
                    required
                    leftIcon={<FiLock size={18} />}
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-3 top-[38px] p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >

                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}

                  </button>

                </div>


                {/* =================================================
                    PASSWORD STRENGTH
                ================================================= */}

                {formData.password && (

                  <div className="space-y-2">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">

                        Password strength

                      </span>


                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">

                        {passwordStrength.label}

                      </span>

                    </div>


                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">

                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width:
                            passwordStrength.width,
                        }}
                        transition={{
                          duration: 0.3,
                        }}
                        className="h-full bg-primary rounded-full"
                      />

                    </div>

                  </div>

                )}


                {/* =================================================
                    PASSWORD REQUIREMENTS
                ================================================= */}

                <div className="rounded-xl bg-gray-50 dark:bg-dark-card/60 p-4">

                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-3">

                    Your password should contain:

                  </p>


                  <div className="grid grid-cols-2 gap-2">

                    <PasswordRequirement
                      valid={
                        passwordRequirements.length
                      }
                    >
                      8+ characters
                    </PasswordRequirement>


                    <PasswordRequirement
                      valid={
                        passwordRequirements.uppercase
                      }
                    >
                      Uppercase letter
                    </PasswordRequirement>


                    <PasswordRequirement
                      valid={
                        passwordRequirements.lowercase
                      }
                    >
                      Lowercase letter
                    </PasswordRequirement>


                    <PasswordRequirement
                      valid={
                        passwordRequirements.number
                      }
                    >
                      Number
                    </PasswordRequirement>

                  </div>

                </div>


                {/* =================================================
                    CONFIRM PASSWORD
                ================================================= */}

                <div className="relative">

                  <Input
                    label="Confirm Password"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Confirm your new password"
                    value={
                      formData.confirmPassword
                    }
                    onChange={(e) =>
                      handleChange(
                        'confirmPassword',
                        e.target.value
                      )
                    }
                    error={
                      errors.confirmPassword
                    }
                    required
                    leftIcon={<FiLock size={18} />}
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-[38px] p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >

                    {showConfirmPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}

                  </button>

                </div>


                {/* =================================================
                    SUBMIT
                ================================================= */}

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  Reset Password
                </Button>


                {/* =================================================
                    BACK TO LOGIN
                ================================================= */}

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                >

                  <FiArrowLeft size={16} />

                  Back to Login

                </Link>

              </form>

            )}

          </Card>

        </motion.div>

      </div>

    </div>

  );
};


// ============================================================
// PASSWORD REQUIREMENT COMPONENT
// ============================================================

const PasswordRequirement = ({
  valid,
  children,
}) => {

  return (

    <div className="flex items-center gap-2">

      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          valid
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >

        <FiCheck
          size={10}
          className={
            valid
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400 dark:text-gray-500'
          }
        />

      </div>


      <span
        className={`text-xs ${
          valid
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {children}
      </span>

    </div>

  );
};


export default ResetPassword;