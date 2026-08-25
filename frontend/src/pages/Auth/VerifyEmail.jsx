import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';

const VerifyEmail = () => {
  const navigate = useNavigate();

  const { success, error } = useToast();

  const [status, setStatus] = useState('waiting');
  const [email, setEmail] = useState('');

  // Prevent duplicate verification API calls in React StrictMode
  const verificationStarted = useRef(false);

  useEffect(() => {
    // ============================================================
    // GET EMAIL FROM LOCAL STORAGE
    // ============================================================

    const pendingEmail =
      localStorage.getItem('pendingVerificationEmail');

    if (pendingEmail) {
      setEmail(pendingEmail);
    }

    // ============================================================
    // GET TOKEN FROM URL
    // ============================================================

    const token = new URLSearchParams(
      window.location.search
    ).get('token');

    console.log('Current URL:', window.location.href);
    console.log('Verification token:', token);

    // ============================================================
    // NO TOKEN
    // ============================================================
    // This is NOT an error.
    //
    // User has just registered and is waiting for the
    // verification email.
    // ============================================================

    if (!token) {
      setStatus('waiting');
      return;
    }

    // ============================================================
    // PREVENT DUPLICATE API CALL
    // ============================================================

    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    // ============================================================
    // VERIFY EMAIL
    // ============================================================

    const verifyEmail = async () => {
      setStatus('verifying');

      try {
        const response = await api.auth.verifyEmail(token);

        console.log(
          'Email verification successful:',
          response.data
        );

        // ========================================================
        // REMOVE PENDING VERIFICATION EMAIL
        // ========================================================

        localStorage.removeItem(
          'pendingVerificationEmail'
        );

        // ========================================================
        // SUCCESS STATE
        // ========================================================

        setStatus('success');

        success('Email verified successfully!');

        // ========================================================
        // REDIRECT TO LOGIN
        // ========================================================

        setTimeout(() => {
          navigate('/login', {
            replace: true,
          });
        }, 1500);

      } catch (err) {
        console.error(
          'Email verification error:',
          err
        );

        setStatus('error');

        error(
          err?.response?.data?.detail ||
          'Email verification failed. The link may be invalid or expired.'
        );
      }
    };

    verifyEmail();

  }, [navigate, success, error]);

  // ============================================================
  // WAITING FOR EMAIL VERIFICATION
  // ============================================================

  if (status === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">

        <div className="w-full max-w-md text-center">

          {/* Email Icon */}
          <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-6">

            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>

          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Verify your email
          </h1>

          {/* Description */}
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            We've sent a verification link to your email address.
          </p>

          {/* Email */}
          {email && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-gray-100 dark:bg-dark-card">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Verification email sent to
              </p>

              <p className="mt-1 font-medium text-gray-900 dark:text-gray-100 break-all">
                {email}
              </p>

            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 space-y-2">

            <p>
              📩 Open the verification email and click the
              <strong className="text-gray-700 dark:text-gray-300">
                {' '}Verify Email{' '}
              </strong>
              button.
            </p>

            <p>
              You need to verify your email before you can
              access your InvoiceFlow account.
            </p>

          </div>

          {/* Waiting Indicator */}
          <div className="mt-8 flex items-center justify-center gap-2">

            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: '0.4s' }}
            />

            <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">
              Waiting for verification...
            </span>

          </div>

          {/* Back to Login */}
          <button
            onClick={() => navigate('/login')}
            className="mt-8 text-sm text-primary font-medium hover:underline"
          >
            Back to Login
          </button>

        </div>

      </div>
    );
  }

  // ============================================================
  // VERIFYING
  // ============================================================

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">

        <div className="text-center">

          <div className="mb-5">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Verifying your email...
          </h2>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Please wait while we verify your email address.
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // SUCCESS
  // ============================================================

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">

        <div className="text-center max-w-md">

          {/* Success Icon */}
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">

            <span className="text-3xl text-green-600 dark:text-green-400">
              ✓
            </span>

          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Email Verified Successfully
          </h2>

          {/* Description */}
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Your email address has been verified successfully.
          </p>

          {/* Redirect */}
          <p className="mt-5 text-sm text-gray-400 dark:text-gray-500">
            Redirecting you to login...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">

      <div className="text-center max-w-md">

        {/* Error Icon */}
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">

          <span className="text-3xl text-red-600 dark:text-red-400">
            ✕
          </span>

        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Verification Failed
        </h2>

        {/* Description */}
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          The verification link is invalid or has expired.
        </p>

        {/* Login Button */}
        <button
          onClick={() => navigate('/login')}
          className="mt-6 px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition"
        >
          Go to Login
        </button>

      </div>

    </div>
  );
};

export default VerifyEmail;