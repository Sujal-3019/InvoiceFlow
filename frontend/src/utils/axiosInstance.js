import axios from 'axios';

export const ACTIVE_COMPANY_STORAGE_KEY = 'activeCompanyId';

export const getStoredActiveCompanyId = () =>
  localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);

export const setStoredActiveCompanyId = (companyId) => {
  if (!companyId) {
    localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    ACTIVE_COMPANY_STORAGE_KEY,
    String(companyId)
  );
};

const COMPANY_SCOPED_PATHS = [
  '/clients',
  '/products',
  '/invoices',
  '/dashboard',
];

const shouldAttachCompanyId = (url = '') => {
  if (!url) {
    return false;
  }

  if (url.startsWith('/users/companies')) {
    return false;
  }

  return COMPANY_SCOPED_PATHS.some((path) =>
    url.startsWith(path)
  );
};

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeCompanyId = getStoredActiveCompanyId();

    if (
      activeCompanyId &&
      shouldAttachCompanyId(config.url)
    ) {
      config.params = {
        ...config.params,
        company_id:
          config.params?.company_id || activeCompanyId,
      };
    }

    // Add request timestamp for caching prevention
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Return response data directly for convenience
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response) {
      const { status } = error.response;

      // Handle 401 - Unauthorized
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      // Handle 403 - Forbidden
      if (status === 403) {
        console.error('Access forbidden:', error.response.data);
      }

      // Handle 404 - Not Found
      if (status === 404) {
        console.error('Resource not found:', error.config.url);
      }

      // Handle 500 - Server Error
      if (status === 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API service methods
export const api = {
  // Generic methods
  get: (url, config = {}) => axiosInstance.get(url, config),
  post: (url, data, config = {}) => axiosInstance.post(url, data, config),
  put: (url, data, config = {}) => axiosInstance.put(url, data, config),
  patch: (url, data, config = {}) => axiosInstance.patch(url, data, config),
  delete: (url, config = {}) => axiosInstance.delete(url, config),
  upload: (url, formData, onProgress) => {
    return axiosInstance.post(url, formData, {
      onUploadProgress: (progressEvent) => {
        if (
          onProgress &&
          progressEvent.total
        ) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) /
            progressEvent.total
          );

          onProgress(percentCompleted);
        }
      },
    });
  },


  // Auth methods
  auth: {
    login: (credentials) =>
      api.post('/auth/login', credentials),

    register: (data) =>
      api.post('/auth/register', data),

    googleLogin: (token) =>
      api.post('/auth/google', {
        token,
      }),

    logout: () =>
      api.post('/auth/logout'),

    refreshToken: () =>
      api.post('/auth/refresh'),

    forgotPassword: (email) =>
      api.post('/auth/forgot-password', {
        email,
      }),

    resetPassword: (token, password) =>
      api.post('/auth/reset-password', {
        token,
        password,
      }),

    verifyEmail: (token) =>
      api.post('/auth/verify-email', {
        token,
      }),
  },

  // User methods
  user: {
    getProfile: () => api.get('/users/profile'),

    updateProfile: (data) =>
      api.put('/users/profile', data),

    uploadLogo: (file, onProgress) => {
      const formData = new FormData();

      formData.append('file', file, file.name);

      return api.post('/users/logo', formData, {
        params: {
          company_id: getStoredActiveCompanyId(),
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const progress = Math.round(
            (progressEvent.loaded * 100) /
            progressEvent.total
          );

          if (onProgress) {
            onProgress(progress);
          }
        },
      });
    },

    removeLogo: () =>
      api.delete('/users/logo', {
        params: {
          company_id: getStoredActiveCompanyId(),
        },
      }),

    changePassword: (data) =>
      api.put('/users/change-password', data),
  },
  // Profile methods
  profile: {
    get: () =>
      api.get('/users/profile'),

    update: (data) =>
      api.put('/users/profile', data),

    uploadLogo: (file, onProgress) => {
      const formData = new FormData();

      formData.append('file', file, file.name);

      return api.post('/users/logo', formData, {
        params: {
          company_id: getStoredActiveCompanyId(),
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const progress = Math.round(
            (progressEvent.loaded * 100) /
            progressEvent.total
          );

          if (onProgress) {
            onProgress(progress);
          }
        },
      });
    },

    removeLogo: () =>
      api.delete('/users/logo', {
        params: {
          company_id: getStoredActiveCompanyId(),
        },
      }),
  },

  companies: {
    list: () =>
      api.get('/users/companies'),

    get: (id) =>
      api.get(`/users/companies/${id}`),

    create: (data) =>
      api.post('/users/companies', data),

    update: (id, data) =>
      api.put(`/users/companies/${id}`, data),

    delete: (id) =>
      api.delete(`/users/companies/${id}`),

    switch: (id) =>
      api.post(`/users/companies/${id}/switch`),
  },


  // Invoice methods
  invoices: {
    list: (params) => api.get('/invoices/', { params }),

    nextNumber: () => api.get('/invoices/next-number'),

    get: (id) => api.get(`/invoices/${id}`),

    create: (data) => api.post('/invoices/', data),

    update: (id, data) =>
      api.put(`/invoices/${id}`, data),

    delete: (id) =>
      api.delete(`/invoices/${id}`),

    updateStatus: (id, status) =>
      api.post(`/invoices/${id}/status`, { status }),

    updatePayment: (invoiceId, data) =>
      api.patch(`/invoices/${invoiceId}/payment`, data),

    generatePdf: (invoiceId) =>
      api.post(`/invoices/${invoiceId}/pdf`),

    downloadPdf: (invoiceId) =>
      api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      }),

    uploadLogo: (invoiceId, file, onProgress) => {
      const formData = new FormData();

      formData.append('file', file, file.name);

      return api.post(
        `/invoices/${invoiceId}/logo`,
        formData,
        {
          onUploadProgress: (event) => {
            if (!event.total) {
              return;
            }

            const progress = Math.round(
              (event.loaded * 100) / event.total
            );

            if (onProgress) {
              onProgress(progress);
            }
          },
        }
      );
    },

    send: (id) =>
      api.post(`/invoices/${id}/send`),

    download: (id) =>
      api.get(`/invoices/${id}/download`, {
        responseType: 'blob',
      }),
  },

  // Client methods
  clients: {
    list: (params) => api.get('/clients/', { params }),
    get: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post('/clients/', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
  },

  // Dashboard methods
  dashboard: {
    summary: () => api.get('/dashboard/summary'),
  },

  // Settings methods
  settings: {
    get: () => api.get('/settings'),
    update: (data) => api.put('/settings', data),
  },
  // Product methods
  products: {
    list: (params) => api.get('/products/', { params }),
    get: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products/', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
  },

};

export default axiosInstance;
