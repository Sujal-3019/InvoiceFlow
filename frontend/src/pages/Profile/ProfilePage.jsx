import React, { useEffect, useRef, useState } from 'react';
import {
  FiUser,
  FiUpload,
  FiSave,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiGlobe,
  FiCreditCard,
  FiShield,
  FiFileText,
  FiTrash2,
  FiCheckCircle,
  FiHash,
  FiDollarSign,
} from 'react-icons/fi';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getLogoUrl = (logo) => {
  if (!logo) return null;

  // Already an absolute URL
  if (
    logo.startsWith('http://') ||
    logo.startsWith('https://') ||
    logo.startsWith('blob:')
  ) {
    return logo;
  }

  return `${API_URL}${logo.startsWith('/') ? '' : '/'}${logo}`;
};

const ProfilePage = () => {

  const { user } = useAuth();
  const {
    profile,
    loading: profileLoading,
    updateProfile,
    uploadLogo,
    removeLogo: removeProfileLogo,
  } = useProfile();

  const { success } = useToast();



  const logoInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  /*
   * IMPORTANT:
   * These values are populated from `user`.
   * There are NO mock business values here.
   */
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',

    company: '',
    businessName: '',
    businessType: '',

    website: '',
    bio: '',

    logo: '',

    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',

    taxId: '',
    gstNumber: '',
    panNumber: '',

    registrationNumber: '',

    invoicePrefix: '',
    invoiceStartingNumber: '',
  });

  const [invoiceDefaults, setInvoiceDefaults] = useState({
    currency: 'USD',
    paymentTerms: 'Net 30',
    notes: '',
    terms: '',
  });

  /*
   * Keep the local form synchronized with the authenticated
   * user whenever user data changes.
   */
  useEffect(() => {
    if (!profile) return;

    setProfileData({
      name: profile.name || '',
      email: profile.email || user?.email || '',
      phone: profile.phone || '',

      // Backend returns both company and business_name
      company: profile.company || profile.business_name || '',
      businessName: profile.business_name || profile.company || '',
      businessType: profile.business_type || profile.businessType || '',

      website: profile.website || '',
      bio: profile.bio || '',

      logo:
        profile.logo_url ||
        profile.logoUrl ||
        profile.logo ||
        '',

      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      zip: profile.zip || profile.postal_code || profile.postalCode || '',
      country: profile.country || '',

      // IMPORTANT: API uses snake_case
      taxId: profile.tax_id || profile.taxId || '',
      gstNumber: profile.gst_number || profile.gstNumber || '',
      panNumber: profile.pan_number || profile.panNumber || '',

      registrationNumber:
        profile.registration_number ||
        profile.registrationNumber ||
        '',

      invoicePrefix:
        profile.invoice_prefix ||
        profile.invoicePrefix ||
        '',

      invoiceStartingNumber:
        profile.invoice_starting_number ||
        profile.invoiceStartingNumber ||
        '',
    });

    setInvoiceDefaults({
      currency:
        profile.currency ||
        profile.invoice_defaults?.currency ||
        'INR',

      paymentTerms:
        profile.payment_terms ||
        profile.invoiceDefaults?.paymentTerms ||
        'Net 30',

      // IMPORTANT: API uses invoice_notes
      notes:
        profile.invoice_notes ||
        profile.invoiceNotes ||
        profile.invoice_defaults?.notes ||
        '',

      // IMPORTANT: API uses invoice_terms
      terms:
        profile.invoice_terms ||
        profile.invoiceTerms ||
        profile.invoice_defaults?.terms ||
        '',
    });

    const logo =
      profile.logo_url ||
      profile.logoUrl ||
      profile.logo ||
      null;

    setLogoPreview(getLogoUrl(logo));
  }, [profile, user?.email]);


  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDefaultsChange = (field, value) => {
    setInvoiceDefaults((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /*
   * Logo selection.
   *
   * The actual database/storage upload should happen inside
   * updateProfile() or your backend service.
   */
  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file.');
      return;
    }

    // 2 MB limit
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be smaller than 2MB.');
      return;
    }

    setLogoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const handleRemoveLogo = async () => {
    try {
      setSaving(true);

      await removeProfileLogo();

      setLogoFile(null);
      setLogoPreview(null);

      setProfileData((prev) => ({
        ...prev,
        logo: '',
      }));

      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }

      success('Logo removed successfully');
    } catch (error) {
      console.error('Failed to remove logo:', error);

      alert(
        error?.response?.data?.detail ||
        'Failed to remove logo. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Saves all business/user information.
   *
   * updateProfile should persist this object to your DB.
   *
   * If your backend uses multipart/form-data for logo uploads,
   * updateProfile should handle the File accordingly.
   */
  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // --------------------------------------------
      // 1. Save normal profile information
      // --------------------------------------------

      const dataToSave = {
        name: profileData.name,
        email: profileData.email,

        phone: profileData.phone,

        businessName: profileData.businessName,
        businessType: profileData.businessType,

        website: profileData.website,
        bio: profileData.bio,

        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zip: profileData.zip,
        country: profileData.country,

        taxId: profileData.taxId,
        gstNumber: profileData.gstNumber,
        panNumber: profileData.panNumber,
        registrationNumber: profileData.registrationNumber,

        invoicePrefix: profileData.invoicePrefix,
        invoiceStartingNumber:
          profileData.invoiceStartingNumber,

        currency: invoiceDefaults.currency,
        paymentTerms: invoiceDefaults.paymentTerms,
        invoiceNotes: invoiceDefaults.notes,
        invoiceTerms: invoiceDefaults.terms,
      };

      delete dataToSave.logoFile;


      const updatedProfile = await updateProfile(dataToSave);

      // --------------------------------------------
      // 2. Upload logo separately
      // --------------------------------------------

      let finalProfile = updatedProfile;

      if (logoFile) {
        const response = await api.profile.uploadLogo(logoFile);

        finalProfile = response?.data || updatedProfile;
      }

      // --------------------------------------------
      // 3. Update local preview with persisted URL
      // --------------------------------------------

      const savedLogo =
        finalProfile?.logo_url ||
        finalProfile?.logoUrl ||
        finalProfile?.logo ||
        null;

      if (savedLogo) {
        setLogoPreview(getLogoUrl(savedLogo));
      }

      setLogoFile(null);
      success('Profile updated successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /*
   * Use the user's real name instead of fallback fake data.
   */
  if (profileLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const displayName =
    profileData.name ||
    profileData.businessName ||
    profileData.company ||
    'Your Profile';

  return (
    <div className="space-y-6 pb-10">
      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Profile & Settings
        </h1>

        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your account, business identity, invoice defaults and
          information used throughout the application.
        </p>
      </div>

      {/* =========================================================
          PROFILE COMPLETION
      ========================================================= */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FiCheckCircle size={24} />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Keep your business profile complete
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                This information can be reused automatically in invoices,
                documents and other parts of your application.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}
        <div className="xl:col-span-2 space-y-6">

          {/* =======================================================
              BUSINESS IDENTITY
          ======================================================= */}
          <Card>
            <Card.Header>
              <Card.Title>Business Identity</Card.Title>
            </Card.Header>

            <div className="space-y-6">

              {/* Logo */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative shrink-0">
                  {logoPreview ? (
                    <div className="w-24 h-24 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card flex items-center justify-center overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Business logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <Avatar
                      name={displayName}
                      size="2xl"
                      className="w-24 h-24"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Business Logo
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    This logo should be reused automatically when creating
                    invoices and other business documents.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                    />

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      leftIcon={<FiUpload size={16} />}
                    >
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </Button>

                    {logoPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        leftIcon={<FiTrash2 size={16} />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    PNG, JPG, WEBP, GIF or SVG · Maximum 2MB
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Input
                    label="Your Name"
                    value={profileData.name}
                    onChange={(e) =>
                      handleProfileChange('name', e.target.value)
                    }
                    leftIcon={<FiUser size={18} />}
                    placeholder="Your full name"
                  />

                  <Input
                    label="Company Name"
                    value={profileData.businessName}
                    onChange={(e) => {
                      const value = e.target.value;

                      setProfileData((prev) => ({
                        ...prev,
                        businessName: value,
                        company: value,
                      }));
                    }}
                    leftIcon={<FiBriefcase size={18} />}
                    placeholder="Your business name"
                  />

                  <Input
                    label="Business Type"
                    value={profileData.businessType}
                    onChange={(e) =>
                      handleProfileChange('businessType', e.target.value)
                    }
                    leftIcon={<FiBriefcase size={18} />}
                    placeholder="e.g. Freelancer, Agency, Company"
                  />

                  <Input
                    label="Website"
                    value={profileData.website}
                    onChange={(e) =>
                      handleProfileChange('website', e.target.value)
                    }
                    leftIcon={<FiGlobe size={18} />}
                    placeholder="https://yourcompany.com"
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={profileData.email}
                    readOnly
                    leftIcon={<FiMail size={18} />}
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  />

                  <Input
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={(e) =>
                      handleProfileChange('phone', e.target.value)
                    }
                    leftIcon={<FiPhone size={18} />}
                    placeholder="+91..."
                  />
                </div>

                <div className="mt-4">
                  <Textarea
                    label="Business Description"
                    value={profileData.bio}
                    onChange={(e) =>
                      handleProfileChange('bio', e.target.value)
                    }
                    rows={4}
                    placeholder="Tell your clients about your business..."
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* =======================================================
              BUSINESS ADDRESS
          ======================================================= */}
          <Card>
            <Card.Header>
              <Card.Title>Business Address</Card.Title>
            </Card.Header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <Input
                  label="Street Address"
                  value={profileData.address}
                  onChange={(e) =>
                    handleProfileChange('address', e.target.value)
                  }
                  leftIcon={<FiMapPin size={18} />}
                  placeholder="Street address"
                />
              </div>

              <Input
                label="City"
                value={profileData.city}
                onChange={(e) =>
                  handleProfileChange('city', e.target.value)
                }
                placeholder="City"
              />

              <Input
                label="State / Province"
                value={profileData.state}
                onChange={(e) =>
                  handleProfileChange('state', e.target.value)
                }
                placeholder="State / Province"
              />

              <Input
                label="ZIP / Postal Code"
                value={profileData.zip}
                onChange={(e) =>
                  handleProfileChange('zip', e.target.value)
                }
                placeholder="Postal code"
              />

              <Input
                label="Country"
                value={profileData.country}
                onChange={(e) =>
                  handleProfileChange('country', e.target.value)
                }
                placeholder="Country"
              />
            </div>
          </Card>

          {/* =======================================================
              TAX & LEGAL
          ======================================================= */}
          <Card>
            <Card.Header>
              <Card.Title>Tax & Legal Information</Card.Title>
            </Card.Header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input
                label="Tax ID"
                value={profileData.taxId}
                onChange={(e) =>
                  handleProfileChange('taxId', e.target.value)
                }
                leftIcon={<FiHash size={18} />}
                placeholder="Tax identification number"
              />

              <Input
                label="GST Number"
                value={profileData.gstNumber}
                onChange={(e) =>
                  handleProfileChange('gstNumber', e.target.value)
                }
                leftIcon={<FiFileText size={18} />}
                placeholder="GSTIN"
              />

              <Input
                label="PAN Number"
                value={profileData.panNumber}
                onChange={(e) =>
                  handleProfileChange('panNumber', e.target.value)
                }
                leftIcon={<FiCreditCard size={18} />}
                placeholder="PAN"
              />

              <Input
                label="Business Registration Number"
                value={profileData.registrationNumber}
                onChange={(e) =>
                  handleProfileChange(
                    'registrationNumber',
                    e.target.value
                  )
                }
                leftIcon={<FiBriefcase size={18} />}
                placeholder="Registration number"
              />
            </div>
          </Card>

          {/* =======================================================
              INVOICE DEFAULTS
          ======================================================= */}
          <Card>
            <Card.Header>
              <Card.Title>Invoice Defaults</Card.Title>
            </Card.Header>

            <div className="space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Currency
                  </label>

                  <div className="relative">
                    <FiDollarSign
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <select
                      value={invoiceDefaults.currency}
                      onChange={(e) =>
                        handleDefaultsChange(
                          'currency',
                          e.target.value
                        )
                      }
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Payment Terms
                  </label>

                  <select
                    value={invoiceDefaults.paymentTerms}
                    onChange={(e) =>
                      handleDefaultsChange(
                        'paymentTerms',
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Due on Receipt">
                      Due on Receipt
                    </option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Net 90">Net 90</option>
                  </select>
                </div>
              </div>

              <Textarea
                label="Default Invoice Notes"
                value={invoiceDefaults.notes}
                onChange={(e) =>
                  handleDefaultsChange('notes', e.target.value)
                }
                rows={3}
                placeholder="Notes automatically added to new invoices..."
              />

              <Textarea
                label="Default Terms & Conditions"
                value={invoiceDefaults.terms}
                onChange={(e) =>
                  handleDefaultsChange('terms', e.target.value)
                }
                rows={4}
                placeholder="Terms automatically added to new invoices..."
              />

            </div>
          </Card>

          {/* =======================================================
              INVOICE NUMBERING
          ======================================================= */}
          <Card>
            <Card.Header>
              <Card.Title>Invoice Numbering</Card.Title>
            </Card.Header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input
                label="Invoice Prefix"
                value={profileData.invoicePrefix}
                onChange={(e) =>
                  handleProfileChange(
                    'invoicePrefix',
                    e.target.value
                  )
                }
                placeholder="INV-"
              />

              <Input
                label="Starting Number"
                type="number"
                value={profileData.invoiceStartingNumber}
                onChange={(e) =>
                  handleProfileChange(
                    'invoiceStartingNumber',
                    e.target.value
                  )
                }
                placeholder="1001"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              These settings can be used by the invoice generator when
              creating new invoices.
            </p>
          </Card>

          {/* =======================================================
              SAVE
          ======================================================= */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              leftIcon={<FiSave size={18} />}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </div>

        {/* =========================================================
            SIDEBAR
        ========================================================= */}
        <div className="space-y-6">

          {/* Profile Preview */}
          <Card>
            <Card.Header>
              <Card.Title>Business Preview</Card.Title>
            </Card.Header>

            <div className="text-center">

              <div className="flex justify-center mb-4">
                {logoPreview ? (
                  <div className="w-24 h-24 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-2 flex items-center justify-center">
                    <img
                      src={logoPreview}
                      alt="Business logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <Avatar
                    name={displayName}
                    size="2xl"
                    className="w-24 h-24"
                  />
                )}
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {profileData.businessName ||
                  profileData.company ||
                  'Business Name'}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {profileData.name || 'Your Name'}
              </p>

              {profileData.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {profileData.email}
                </p>
              )}

              {profileData.phone && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {profileData.phone}
                </p>
              )}

              {(profileData.city || profileData.country) && (
                <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <FiMapPin size={13} />

                  <span>
                    {[profileData.city, profileData.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Account */}
          <Card>
            <Card.Header>
              <Card.Title>Account</Card.Title>
            </Card.Header>

            <div className="space-y-4">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Email
                </span>

                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate ml-4">
                  {profile?.email || user?.email || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Status
                </span>

                <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <FiCheckCircle size={14} />
                  Active
                </span>
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <Card.Header>
              <Card.Title>Security</Card.Title>
            </Card.Header>

            <div className="space-y-2">

              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <FiShield size={18} />
                <span>Change Password</span>
              </button>
            </div>
          </Card>

          {/* Used Throughout App */}
          <Card>
            <Card.Header>
              <Card.Title>Used Across Your App</Card.Title>
            </Card.Header>

            <div className="space-y-3">

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FiFileText size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Invoices
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Logo, Company name, address, tax information and
                    invoice defaults.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FiBriefcase size={16} />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Business Identity
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Your saved business information can be reused
                    throughout the application.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;