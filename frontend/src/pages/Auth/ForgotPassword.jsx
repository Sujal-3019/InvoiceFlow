import React, { useState } from 'react';

import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import { FiMail, FiArrowLeft, FiCheck , FiLock} from 'react-icons/fi';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

import { useToast } from '../../context/ToastContext';

import axiosInstance from "../../utils/axiosInstance";
import apiPaths from "../../utils/apiPaths";


const ForgotPassword = () => {

  const { success, error } = useToast();

  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [emailSent, setEmailSent] = useState(false);


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setErrorMessage('');


    if (!email) {

      setErrorMessage('Email is required.');

      return;

    }


    if (!/\S+@\S+\.\S+/.test(email)) {

      setErrorMessage('Please enter a valid email address.');

      return;

    }


    setLoading(true);


    try {

      const response = await axiosInstance.post(
        apiPaths.auth.forgotPassword,
        {
          email,
        }
      );


      setEmailSent(true);


      success(
        response.data.message ||
        'Password reset link sent to your email.'
      );


    } catch (err) {

      console.error(
        'Forgot password error:',
        err
      );


      error(
        err?.response?.data?.detail ||
        'Unable to send reset link. Please try again.'
      );

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // SUCCESS SCREEN
  // ============================================================

  if (emailSent) {

    return (

      <div className="min-h-screen flex">

        {/* ======================================================
            LEFT BRANDING
        ====================================================== */}

        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">

          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark" />

          <div className="absolute inset-0 opacity-10">

            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow" />

            <div
              className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse-slow"
              style={{ animationDelay: '1s' }}
            />

          </div>


          <div className="relative z-10 flex flex-col justify-center px-16 text-white">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
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

                Get Back Into
                <br />

                Your Account

              </h1>


              <p className="text-xl text-white/80 mb-8 max-w-md">

                Don't worry. We'll help you securely reset
                your password and get back to managing your
                invoices.

              </p>


              <div className="space-y-4 text-white/80">

                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">

                    <FiCheck size={16} />

                  </div>

                  <span>
                    Secure password recovery
                  </span>

                </div>


                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">

                    <FiCheck size={16} />

                  </div>

                  <span>
                    Reset link sent directly to your email
                  </span>

                </div>


                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">

                    <FiCheck size={16} />

                  </div>

                  <span>
                    Your account remains protected
                  </span>

                </div>

              </div>

            </motion.div>

          </div>

        </div>


        {/* ======================================================
            SUCCESS CONTENT
        ====================================================== */}

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
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >

            <Card className="border-0 shadow-lg text-center">

              <div className="flex justify-center mb-6">

                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">

                  <FiMail
                    size={28}
                    className="text-green-600 dark:text-green-400"
                  />

                </div>

              </div>


              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">

                Check Your Email

              </h2>


              <p className="text-gray-500 dark:text-gray-400 mb-2">

                We've sent a password reset link to:

              </p>


              <p className="font-medium text-gray-900 dark:text-gray-100 mb-6 break-all">

                {email}

              </p>


              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">

                The link will expire after a limited time.
                If you don't see the email, check your spam
                or junk folder.

              </p>


              <Link to="/login">

                <Button className="w-full">

                  Back to Login

                </Button>

              </Link>

            </Card>

          </motion.div>

        </div>

      </div>

    );

  }


  // ============================================================
  // MAIN FORM
  // ============================================================

  return (

    <div className="min-h-screen flex">

      {/* ======================================================
          LEFT SIDE - BRANDING
      ====================================================== */}

      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark" />


        <div className="absolute inset-0 opacity-10">

          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow" />

          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />

        </div>


        <div className="relative z-10 flex flex-col justify-center px-16 text-white">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"
                  />

                </svg>

              </div>

              <span className="text-2xl font-bold">
                InvoiceFlow
              </span>

            </div>


            <h1 className="text-5xl font-bold mb-6 leading-tight">

              Forgot Your
              <br />

              Password?

            </h1>


            <p className="text-xl text-white/80 mb-8 max-w-md">

              No problem. Enter your email address and
              we'll send you a secure link to create a
              new password.

            </p>


            <div className="space-y-4 text-white/80">

              <div className="flex items-center gap-3">

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">

                  <FiCheck size={16} />

                </div>

                <span>
                  Secure password recovery
                </span>

              </div>


              <div className="flex items-center gap-3">

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">

                  <FiCheck size={16} />

                </div>

                <span>
                  Quick and easy reset process
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

                Forgot password?

              </h2>


              <p className="text-gray-500 dark:text-gray-400">

                Enter your email address and we'll send you
                a link to reset your password.

              </p>

            </div>


            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                error={errorMessage}
                required
                leftIcon={<FiMail size={18} />}
              />


              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >

                Send Reset Link

              </Button>


              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
              >

                <FiArrowLeft size={16} />

                Back to Login

              </Link>

            </form>

          </Card>

        </motion.div>

      </div>

    </div>

  );

};


export default ForgotPassword;