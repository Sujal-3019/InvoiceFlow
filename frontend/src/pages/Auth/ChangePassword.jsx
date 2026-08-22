import React, { useMemo, useState } from 'react';
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiShield,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { api } from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  // ============================================================
  // PASSWORD REQUIREMENTS
  // ============================================================

  const passwordRequirements = useMemo(
    () => [
      {
        label: 'At least 8 characters',
        valid: formData.newPassword.length >= 8,
      },
      {
        label: 'Contains an uppercase letter',
        valid: /[A-Z]/.test(formData.newPassword),
      },
      {
        label: 'Contains a lowercase letter',
        valid: /[a-z]/.test(formData.newPassword),
      },
      {
        label: 'Contains a number',
        valid: /\d/.test(formData.newPassword),
      },
    ],
    [formData.newPassword]
  );

  const passwordStrength = useMemo(() => {
    if (!formData.newPassword) {
      return {
        label: 'Enter a new password',
        width: '0%',
      };
    }

    const score = passwordRequirements.filter(
      (item) => item.valid
    ).length;

    if (score <= 1) {
      return {
        label: 'Weak password',
        width: '25%',
      };
    }

    if (score === 2) {
      return {
        label: 'Fair password',
        width: '50%',
      };
    }

    if (score === 3) {
      return {
        label: 'Good password',
        width: '75%',
      };
    }

    return {
      label: 'Strong password',
      width: '100%',
    };
  }, [formData.newPassword, passwordRequirements]);

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword =
        'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword =
        'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword =
        'New password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        'Please confirm your new password';
    } else if (
      formData.newPassword !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        'Passwords do not match';
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      newErrors.newPassword =
        'New password must be different from current password';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      await api.user.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });

      success('Password changed successfully!');

      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (err) {
      console.error('Change password error:', err);

      const message =
        err?.response?.data?.detail ||
        'Failed to change password. Please try again.';

      error(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PASSWORD FIELD
  // ============================================================

  const PasswordField = ({
    label,
    field,
    value,
    show,
    setShow,
    placeholder,
    error: fieldError,
  }) => {
    return (
      <div className="relative">
        <Input
          label={label}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) =>
            handleChange(field, e.target.value)
          }
          error={fieldError}
          leftIcon={<FiLock size={18} />}
          placeholder={placeholder}
          className="pr-12"
        />

        <button
          type="button"
          aria-label={
            show ? 'Hide password' : 'Show password'
          }
          onClick={() => setShow((prev) => !prev)}
          className="
            absolute right-3 top-[38px]
            w-9 h-9
            flex items-center justify-center
            rounded-lg
            text-gray-400
            hover:text-gray-700
            dark:hover:text-gray-200
            hover:bg-gray-100
            dark:hover:bg-gray-700
            transition-all
          "
        >
          {show ? (
            <FiEyeOff size={18} />
          ) : (
            <FiEye size={18} />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-120px)] py-6">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="max-w-5xl mx-auto mb-8">

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="
            inline-flex items-center gap-2
            text-sm font-medium
            text-gray-500 dark:text-gray-400
            hover:text-primary
            transition-colors
            mb-6
          "
        >
          <FiArrowLeft size={17} />
          Back to Profile
        </button>

        <div className="flex items-start gap-4">

          <div
            className="
              w-12 h-12
              rounded-2xl
              bg-primary/10
              text-primary
              flex items-center justify-center
              shrink-0
            "
          >
            <FiShield size={24} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Change Password
            </h1>

            <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl">
              Keep your account secure by updating your password
              regularly. Choose a strong password that you don't
              use elsewhere.
            </p>
          </div>

        </div>
      </div>

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ======================================================
            FORM
        ====================================================== */}

        <div className="lg:col-span-2">

          <Card className="overflow-hidden">

            {/* Card Header */}

            <div
              className="
                flex items-center gap-3
                pb-6
                border-b border-gray-100
                dark:border-gray-800
              "
            >
              <div
                className="
                  w-10 h-10
                  rounded-xl
                  bg-gray-100
                  dark:bg-gray-800
                  flex items-center justify-center
                  text-gray-600
                  dark:text-gray-300
                "
              >
                <FiLock size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  Update your password
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Enter your current password and choose a new one.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="pt-6 space-y-6"
            >

              {/* Current Password */}

              <PasswordField
                label="Current Password"
                field="currentPassword"
                value={formData.currentPassword}
                show={showCurrent}
                setShow={setShowCurrent}
                placeholder="Enter your current password"
                error={errors.currentPassword}
              />

              {/* Divider */}

              <div className="border-t border-gray-100 dark:border-gray-800" />

              {/* New Password */}

              <PasswordField
                label="New Password"
                field="newPassword"
                value={formData.newPassword}
                show={showNew}
                setShow={setShowNew}
                placeholder="Create a new password"
                error={errors.newPassword}
              />

              {/* Password Strength */}

              {formData.newPassword && (
                <div className="-mt-3">

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Password strength
                    </span>

                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-primary
                        transition-all duration-300
                      "
                      style={{
                        width: passwordStrength.width,
                      }}
                    />
                  </div>

                </div>
              )}

              {/* Confirm Password */}

              <PasswordField
                label="Confirm New Password"
                field="confirmPassword"
                value={formData.confirmPassword}
                show={showConfirm}
                setShow={setShowConfirm}
                placeholder="Re-enter your new password"
                error={errors.confirmPassword}
              />

              {/* Match indicator */}

              {formData.confirmPassword && (
                <div
                  className={`flex items-center gap-2 text-xs ${
                    formData.newPassword ===
                    formData.confirmPassword
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {formData.newPassword ===
                  formData.confirmPassword ? (
                    <FiCheck size={15} />
                  ) : (
                    <FiX size={15} />
                  )}

                  {formData.newPassword ===
                  formData.confirmPassword
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </div>
              )}

              {/* Buttons */}

              <div
                className="
                  flex flex-col-reverse sm:flex-row
                  sm:justify-end
                  gap-3
                  pt-4
                  border-t border-gray-100
                  dark:border-gray-800
                "
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/profile')}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  leftIcon={<FiLock size={17} />}
                  className="w-full sm:w-auto"
                >
                  {loading
                    ? 'Updating Password...'
                    : 'Change Password'}
                </Button>
              </div>

            </form>
          </Card>
        </div>

        {/* ======================================================
            SECURITY SIDEBAR
        ====================================================== */}

        <div className="space-y-6">

          {/* Password Requirements */}

          <Card>

            <div className="flex items-center gap-3 mb-5">

              <div
                className="
                  w-10 h-10
                  rounded-xl
                  bg-primary/10
                  text-primary
                  flex items-center justify-center
                "
              >
                <FiShield size={19} />
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Password security
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Make your password stronger
                </p>
              </div>

            </div>

            <div className="space-y-3">

              {passwordRequirements.map((requirement) => (
                <div
                  key={requirement.label}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className={`
                      w-5 h-5
                      rounded-full
                      flex items-center justify-center
                      shrink-0
                      ${
                        requirement.valid
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                      }
                    `}
                  >
                    {requirement.valid ? (
                      <FiCheck size={12} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>

                  <span
                    className={`
                      text-xs
                      ${
                        requirement.valid
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {requirement.label}
                  </span>
                </div>
              ))}

            </div>

          </Card>

          {/* Security Tips */}

          <Card>

            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Security tips
            </h3>

            <div className="space-y-4">

              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Use a unique password
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Don't reuse your InvoiceFlow password on other
                  websites or applications.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Avoid easy-to-guess information
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Avoid names, birthdays, phone numbers and common
                  passwords.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Keep your credentials private
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Never share your password with anyone.
                </p>
              </div>

            </div>

          </Card>

        </div>
      </div>
    </div>
  );
};

export default ChangePassword;