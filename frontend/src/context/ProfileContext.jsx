import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  api,
  getStoredActiveCompanyId,
  setStoredActiveCompanyId,
} from '../utils/axiosInstance';

import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

// ============================================================
// COMPANY PAYLOAD MAPPER
// ============================================================

const toCompanyPayload = (payload = {}) => ({
  company: payload.businessName ?? payload.company ?? '',

  business_name: payload.businessName ?? payload.company ?? '',

  business_type: payload.businessType ?? '',

  website: payload.website ?? '',

  bio: payload.bio ?? '',

  phone: payload.phone ?? '',

  address: payload.address ?? '',

  city: payload.city ?? '',

  state: payload.state ?? '',

  zip: payload.zip ?? '',

  country: payload.country ?? '',

  tax_id: payload.taxId ?? '',

  gst_number: payload.gstNumber ?? '',

  pan_number: payload.panNumber ?? '',

  registration_number: payload.registrationNumber ?? '',

  invoice_prefix: payload.invoicePrefix ?? '',

  invoice_starting_number: Number(payload.invoiceStartingNumber) || 1001,

  currency: payload.currency ?? 'INR',

  payment_terms: payload.paymentTerms ?? 'Net 30',

  invoice_notes: payload.invoiceNotes ?? '',

  invoice_terms: payload.invoiceTerms ?? '',
});

const fromCompanyResponse = (company = {}) => ({
  ...company,

  company:
    company.company ??
    company.business_name ??
    '',

  businessName:
    company.business_name ??
    company.company ??
    '',

  businessType:
    company.business_type ??
    '',

  website:
    company.website ??
    '',

  bio:
    company.bio ??
    '',

  phone:
    company.phone ??
    '',

  address:
    company.address ??
    '',

  city:
    company.city ??
    '',

  state:
    company.state ??
    '',

  zip:
    company.zip ??
    '',

  country:
    company.country ??
    '',

  taxId:
    company.tax_id ??
    '',

  gstNumber:
    company.gst_number ??
    '',

  panNumber:
    company.pan_number ??
    '',

  registrationNumber:
    company.registration_number ??
    '',

  invoicePrefix:
    company.invoice_prefix ??
    '',

  invoiceStartingNumber:
    company.invoice_starting_number ??
    1001,

  currency:
    company.currency ??
    'INR',

  paymentTerms:
    company.payment_terms ??
    'Net 30',

  invoiceNotes:
    company.invoice_notes ??
    '',

  invoiceTerms:
    company.invoice_terms ??
    '',

  logo:
    company.logo_url ??
    '',
});

// ============================================================
// MERGE USER + COMPANY
// ============================================================

const mergeProfile = (user, company) => ({
  ...(fromCompanyResponse(company) || {}),
  ...(user || {}),
  activeCompanyId: company?.id || null,
});

// ============================================================
// EXTRACT ACCOUNT INFO
// ============================================================

const accountFromProfile = (profile) => ({
  id: profile?.id,
  name: profile?.name,
  email: profile?.email,
});

// ============================================================
// PROVIDER
// ============================================================

export const ProfileProvider = ({ children }) => {
  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyIdState] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [switchingCompany, setSwitchingCompany] =
    useState(false);

  const [error, setError] = useState(null);

  // ==========================================================
  // ACTIVE COMPANY
  // ==========================================================

  const activeCompany = useMemo(
    () =>
      companies.find(
        (company) =>
          String(company.id) ===
          String(activeCompanyId)
      ) || null,
    [companies, activeCompanyId]
  );

  // ==========================================================
  // SYNC PROFILE
  // ==========================================================

  const syncProfile = useCallback(
    (user, company) => {
      setProfile(
        mergeProfile(user, company)
      );
    },
    []
  );

  // ==========================================================
  // LOAD PROFILE + COMPANIES
  // ==========================================================

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setCompanies([]);
      setActiveCompanyIdState(null);
      setStoredActiveCompanyId(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        userResponse,
        companiesResponse,
      ] = await Promise.all([
        api.user.getProfile(),
        api.companies.list(),
      ]);

      const userData =
        userResponse?.data?.user ||
        userResponse?.data ||
        null;

      const companyList =
        companiesResponse?.data?.companies ||
        [];

      // ======================================================
      // IMPORTANT:
      // Backend active_company_id is the SOURCE OF TRUTH.
      // ======================================================

      const backendActiveCompanyId =
        userData?.active_company_id;

      const backendActiveCompany =
        companyList.find(
          (company) =>
            String(company.id) ===
            String(backendActiveCompanyId)
        );

      // ------------------------------------------------------
      // Fallback only if backend doesn't provide an active
      // company.
      // ------------------------------------------------------

      const storedCompanyId =
        getStoredActiveCompanyId();

      const storedCompany =
        companyList.find(
          (company) =>
            String(company.id) ===
            String(storedCompanyId)
        );

      const selectedCompany =
        backendActiveCompany ||
        storedCompany ||
        companyList[0] ||
        null;

      setCompanies(companyList);

      setActiveCompanyIdState(
        selectedCompany?.id || null
      );

      setStoredActiveCompanyId(
        selectedCompany?.id || null
      );

      syncProfile(
        userData,
        selectedCompany
      );

    } catch (err) {
      console.error(
        'Failed to load profile:',
        err
      );

      setError(err);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    syncProfile,
  ]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadProfile();
  }, [
    authLoading,
    loadProfile,
  ]);

  // ==========================================================
  // SWITCH ACTIVE COMPANY
  // ==========================================================

  const setActiveCompany = useCallback(
    async (companyId) => {
      const selectedCompany = companies.find(
        (company) =>
          String(company.id) === String(companyId)
      );

      if (!selectedCompany) {
        return null;
      }

      try {
        setError(null);

        // ============================================
        // 1. Tell backend to switch active company
        // ============================================

        const response = await api.companies.switch(
          selectedCompany.id
        );

        const switchedCompanyId =
          response?.data?.active_company_id ||
          selectedCompany.id;

        // ============================================
        // 2. Update frontend active company
        // ============================================

        setActiveCompanyIdState(switchedCompanyId);

        setStoredActiveCompanyId(switchedCompanyId);

        // ============================================
        // 3. Update profile with selected company
        // ============================================

        setProfile((currentProfile) =>
          mergeProfile(
            accountFromProfile(currentProfile),
            selectedCompany
          )
        );

        // ============================================
        // 4. Notify other parts of application
        // ============================================

        window.dispatchEvent(
          new CustomEvent('activeCompanyChanged', {
            detail: {
              companyId: switchedCompanyId,
            },
          })
        );

        return selectedCompany;

      } catch (err) {
        console.error(
          'Failed to switch active company:',
          err
        );

        setError(err);

        throw err;
      }
    },
    [companies]
  );

  // ==========================================================
  // UPDATE PROFILE / COMPANY
  // ==========================================================

  const updateProfile = useCallback(
    async (payload) => {
      try {
        setError(null);

        const accountPayload = {
          name: payload.name,
          email: payload.email,
        };

        const [
          userResponse,
          companyResponse,
        ] = await Promise.all([
          api.user.updateProfile(
            accountPayload
          ),

          activeCompanyId
            ? api.companies.update(
              activeCompanyId,
              toCompanyPayload(
                payload
              )
            )
            : api.companies.create(
              toCompanyPayload(
                payload
              )
            ),
        ]);

        const updatedUser =
          userResponse?.data?.user ||
          userResponse?.data ||
          null;

        const updatedCompany =
          companyResponse?.data?.company ||
          companyResponse?.data ||
          null;

        setCompanies(
          (currentCompanies) => {
            const exists =
              currentCompanies.some(
                (company) =>
                  company.id ===
                  updatedCompany?.id
              );

            if (!updatedCompany) {
              return currentCompanies;
            }

            if (!exists) {
              return [
                ...currentCompanies,
                updatedCompany,
              ];
            }

            return currentCompanies.map(
              (company) =>
                company.id ===
                  updatedCompany.id
                  ? updatedCompany
                  : company
            );
          }
        );

        setActiveCompanyIdState(
          updatedCompany?.id ||
          activeCompanyId
        );

        setStoredActiveCompanyId(
          updatedCompany?.id ||
          activeCompanyId
        );

        const updatedProfile =
          mergeProfile(
            updatedUser,
            updatedCompany
          );

        setProfile(updatedProfile);

        return updatedProfile;

      } catch (err) {
        console.error(
          'Failed to update profile:',
          err
        );

        setError(err);

        throw err;
      }
    },
    [activeCompanyId]
  );

  // ==========================================================
  // CREATE COMPANY
  // ==========================================================

  const createCompany = useCallback(
    async (payload) => {
      try {
        setError(null);

        const response =
          await api.companies.create(
            toCompanyPayload(payload)
          );

        // Backend directly returns the company object
        const company = response?.data;

        if (!company?.id) {
          throw new Error(
            'Company was created but no company ID was returned.'
          );
        }

        // Add company to frontend list
        setCompanies(
          (currentCompanies) => [
            ...currentCompanies,
            company,
          ]
        );

        // Make newly created company active on backend
        await api.companies.switch(
          company.id
        );

        // Update frontend active company
        setActiveCompanyIdState(
          company.id
        );

        setStoredActiveCompanyId(
          company.id
        );

        // Update profile
        setProfile(
          (currentProfile) =>
            mergeProfile(
              accountFromProfile(
                currentProfile
              ),
              company
            )
        );

        // Notify other parts of application
        window.dispatchEvent(
          new CustomEvent(
            'activeCompanyChanged',
            {
              detail: {
                companyId: company.id,
              },
            }
          )
        );

        return company;

      } catch (err) {
        console.error(
          'Failed to create company:',
          err
        );

        setError(err);

        throw err;
      }
    },
    []
  );

  // ==========================================================
  // DELETE COMPANY
  // ==========================================================

  const deleteCompany = useCallback(
    async (companyId) => {
      try {
        setError(null);

        await api.companies.delete(
          companyId
        );

        const remainingCompanies =
          companies.filter(
            (company) =>
              String(company.id) !==
              String(companyId)
          );

        const nextCompany =
          remainingCompanies[0] ||
          null;

        setCompanies(
          remainingCompanies
        );

        // ====================================================
        // If another company remains,
        // make it active on BACKEND.
        // ====================================================

        if (nextCompany) {
          await api.companies.switch(
            nextCompany.id
          );
        }

        setActiveCompanyIdState(
          nextCompany?.id || null
        );

        setStoredActiveCompanyId(
          nextCompany?.id || null
        );

        setProfile(
          (currentProfile) =>
            mergeProfile(
              accountFromProfile(
                currentProfile
              ),
              nextCompany
            )
        );

        if (nextCompany) {
          window.dispatchEvent(
            new CustomEvent(
              'activeCompanyChanged',
              {
                detail: {
                  companyId:
                    nextCompany.id,
                },
              }
            )
          );
        }

        return nextCompany;

      } catch (err) {
        console.error(
          'Failed to delete company:',
          err
        );

        setError(err);

        throw err;
      }
    },
    [companies]
  );

  // ==========================================================
  // UPLOAD LOGO
  // ==========================================================

  const uploadLogo = useCallback(
    async (file) => {
      try {
        setError(null);

        const response =
          await api.profile.uploadLogo(
            file
          );

        const updatedCompany =
          response?.data || null;

        setCompanies(
          (currentCompanies) =>
            currentCompanies.map(
              (company) =>
                company.id ===
                  updatedCompany?.id
                  ? updatedCompany
                  : company
            )
        );

        setProfile(
          (currentProfile) =>
            mergeProfile(
              accountFromProfile(
                currentProfile
              ),
              updatedCompany
            )
        );

        return mergeProfile(
          profile,
          updatedCompany
        );

      } catch (err) {
        console.error(
          'Failed to upload logo:',
          err
        );

        setError(err);

        throw err;
      }
    },
    [profile]
  );

  // ==========================================================
  // REMOVE LOGO
  // ==========================================================

  const removeLogo = useCallback(
    async () => {
      try {
        setError(null);

        const response =
          await api.profile.removeLogo();

        const updatedCompany =
          response?.data || null;

        setCompanies(
          (currentCompanies) =>
            currentCompanies.map(
              (company) =>
                company.id ===
                  updatedCompany?.id
                  ? updatedCompany
                  : company
            )
        );

        setProfile(
          (currentProfile) =>
            mergeProfile(
              accountFromProfile(
                currentProfile
              ),
              updatedCompany
            )
        );

        return mergeProfile(
          profile,
          updatedCompany
        );

      } catch (err) {
        console.error(
          'Failed to remove logo:',
          err
        );

        setError(err);

        throw err;
      }
    },
    [profile]
  );

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  return (
    <ProfileContext.Provider
      value={{
        profile,
        companies,

        activeCompany,
        activeCompanyId,

        loading,
        switchingCompany,
        error,

        refreshProfile:
          loadProfile,

        updateProfile,
        createCompany,
        deleteCompany,

        setActiveCompany,

        uploadLogo,
        removeLogo,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

// ============================================================
// HOOK
// ============================================================

export const useProfile = () => {
  const context =
    useContext(ProfileContext);

  if (!context) {
    throw new Error(
      'useProfile must be used inside ProfileProvider'
    );
  }

  return context;
};