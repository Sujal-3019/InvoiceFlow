// API endpoint paths
const apiPaths = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    changePassword: '/auth/change-password',
  },
  
  // Users
  users: {
    base: '/users',
    profile: '/users/profile',
    updateProfile: '/users/profile',
    updateAvatar: '/users/avatar',
  },
  
  // Invoices
  invoices: {
    base: '/invoices',
    list: '/invoices',
    create: '/invoices',
    getById: (id) => `/invoices/${id}`,
    update: (id) => `/invoices/${id}`,
    delete: (id) => `/invoices/${id}`,
    duplicate: (id) => `/invoices/${id}/duplicate`,
    send: (id) => `/invoices/${id}/send`,
    download: (id) => `/invoices/${id}/download`,
    payments: (id) => `/invoices/${id}/payments`,
  },
  
  // Clients
  clients: {
    base: '/clients',
    list: '/clients',
    create: '/clients',
    view_invoices: '/clients/ClientInvoices.jsx',
    getById: (id) => `/clients/${id}`,
    update: (id) => `/clients/${id}`,
    delete: (id) => `/clients/${id}`,
  },
  
  // Dashboard
  dashboard: {
    stats: '/dashboard/stats',
    revenue: '/dashboard/revenue',
    recentInvoices: '/dashboard/recent-invoices',
    recentActivity: '/dashboard/recent-activity',
  },
  
  // Reports
  reports: {
    revenue: '/reports/revenue',
    invoices: '/reports/invoices',
    clients: '/reports/clients',
    taxes: '/reports/taxes',
  },
  
  // Files
  files: {
    upload: '/files/upload',
    delete: (id) => `/files/${id}`,
  },
};

export default apiPaths;