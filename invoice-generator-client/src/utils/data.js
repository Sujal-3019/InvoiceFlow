// Sample data for demonstration

export const sampleInvoices = [
  {
    id: 'INV-001',
    status: 'paid',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    paidDate: '2024-01-20',
    currency: 'USD',
    paymentTerms: 'Net 30',
    company: {
      name: 'Your Company',
      email: 'billing@yourcompany.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'United States',
      taxId: '12-3456789',
    },
    client: {
      name: 'Acme Corp',
      email: 'billing@acme.com',
      phone: '+1 (555) 987-6543',
      address: '456 Client Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
      taxId: '98-7654321',
    },
    items: [
      { id: 1, description: 'Web Development Services', quantity: 40, unitPrice: 150, tax: 0 },
      { id: 2, description: 'UI/UX Design', quantity: 20, unitPrice: 120, tax: 0 },
    ],
    discount: 0,
    discountType: 'fixed',
    shipping: 0,
    notes: 'Thank you for your business!',
    terms: 'Payment is due within 30 days.',
  },
  {
    id: 'INV-002',
    status: 'pending',
    invoiceDate: '2024-01-14',
    dueDate: '2024-02-14',
    currency: 'USD',
    paymentTerms: 'Net 30',
    company: {
      name: 'Your Company',
      email: 'billing@yourcompany.com',
      phone: '+1 (555) 123-4567',
    },
    client: {
      name: 'TechStart Inc',
      email: 'finance@techstart.com',
      phone: '+1 (555) 234-5678',
    },
    items: [
      { id: 1, description: 'Consulting Services', quantity: 15, unitPrice: 120, tax: 0 },
    ],
    discount: 0,
    discountType: 'fixed',
    shipping: 0,
  },
  {
    id: 'INV-003',
    status: 'overdue',
    invoiceDate: '2024-01-10',
    dueDate: '2024-01-25',
    currency: 'USD',
    paymentTerms: 'Net 15',
    company: {
      name: 'Your Company',
      email: 'billing@yourcompany.com',
    },
    client: {
      name: 'Global Solutions',
      email: 'ap@globalsolutions.com',
    },
    items: [
      { id: 1, description: 'Project Management', quantity: 32, unitPrice: 100, tax: 0 },
    ],
    discount: 0,
    discountType: 'fixed',
    shipping: 0,
  },
];

export const sampleClients = [
  {
    id: 1,
    name: 'Acme Corp',
    email: 'billing@acme.com',
    phone: '+1 (555) 123-4567',
    address: '456 Client Ave, New York, NY 10001',
    totalInvoices: 12,
    totalRevenue: 28500,
    status: 'active',
    lastInvoice: '2024-01-15',
  },
  {
    id: 2,
    name: 'TechStart Inc',
    email: 'finance@techstart.com',
    phone: '+1 (555) 234-5678',
    address: '789 Startup Blvd, San Francisco, CA 94102',
    totalInvoices: 8,
    totalRevenue: 15200,
    status: 'active',
    lastInvoice: '2024-01-14',
  },
  {
    id: 3,
    name: 'Global Solutions',
    email: 'ap@globalsolutions.com',
    phone: '+1 (555) 345-6789',
    address: '321 Enterprise Dr, Chicago, IL 60601',
    totalInvoices: 15,
    totalRevenue: 45000,
    status: 'active',
    lastInvoice: '2024-01-10',
  },
  {
    id: 4,
    name: 'Design Studio',
    email: 'hello@designstudio.com',
    phone: '+1 (555) 456-7890',
    address: '654 Creative Ln, Los Angeles, CA 90001',
    totalInvoices: 5,
    totalRevenue: 8500,
    status: 'inactive',
    lastInvoice: '2023-12-20',
  },
];

export const dashboardStats = {
  totalRevenue: 45280,
  totalInvoices: 128,
  paidInvoices: 89,
  pendingInvoices: 24,
  overdueInvoices: 15,
  revenueGrowth: 12.5,
  invoiceGrowth: 8.2,
};

export const revenueData = [
  { month: 'Jan', revenue: 12500 },
  { month: 'Feb', revenue: 15200 },
  { month: 'Mar', revenue: 18300 },
  { month: 'Apr', revenue: 14800 },
  { month: 'May', revenue: 21500 },
  { month: 'Jun', revenue: 24100 },
];

export const invoiceStatusDistribution = [
  { name: 'Paid', value: 45, color: '#16A34A' },
  { name: 'Pending', value: 25, color: '#F59E0B' },
  { name: 'Overdue', value: 15, color: '#DC2626' },
  { name: 'Draft', value: 15, color: '#64748B' },
];

export const recentActivity = [
  { id: 1, action: 'Invoice #INV-001 paid', time: '2 hours ago', type: 'success' },
  { id: 2, action: 'New client "TechStart Inc" added', time: '4 hours ago', type: 'info' },
  { id: 3, action: 'Invoice #INV-003 overdue', time: '1 day ago', type: 'warning' },
  { id: 4, action: 'Invoice #INV-004 sent to client', time: '2 days ago', type: 'info' },
  { id: 5, action: 'Payment received for #INV-002', time: '3 days ago', type: 'success' },
];

export const currencies = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
];

export const paymentTerms = [
  { value: 'Due on Receipt', label: 'Due on Receipt' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Net 90', label: 'Net 90' },
];

export const timezones = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
];

export default {
  sampleInvoices,
  sampleClients,
  dashboardStats,
  revenueData,
  invoiceStatusDistribution,
  recentActivity,
  currencies,
  paymentTerms,
  timezones,
};