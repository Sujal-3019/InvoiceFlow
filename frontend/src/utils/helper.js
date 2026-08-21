// Format currency based on currency code
export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

// Format date to readable format
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};

// Format date to input format (YYYY-MM-DD)
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Calculate invoice totals
export const calculateInvoiceTotals = (
  items,
  discount,
  discountType,
  shipping
) => {
  // 1. Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;

    return sum + quantity * unitPrice;
  }, 0);

  // 2. Calculate discount
  let discountAmount = 0;

  if (discountType === 'percentage') {
    discountAmount =
      subtotal * ((Number(discount) || 0) / 100);
  } else {
    discountAmount = Number(discount) || 0;
  }

  // Prevent discount from exceeding subtotal
  discountAmount = Math.min(
    discountAmount,
    subtotal
  );

  // 3. Calculate taxable amount AFTER discount
  const taxableAmount =
    subtotal - discountAmount;

  // 4. Calculate GST on discounted amount
  //
  // Important:
  // Discount is distributed proportionally
  // across items so each item's GST is reduced.
  const discountRatio =
    subtotal > 0
      ? taxableAmount / subtotal
      : 0;

  const taxTotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const taxRate = Number(item.tax) || 0;

    const itemSubtotal =
      quantity * unitPrice;

    const discountedItemSubtotal =
      itemSubtotal * discountRatio;

    const itemTax =
      discountedItemSubtotal *
      (taxRate / 100);

    return sum + itemTax;
  }, 0);

  // 5. Shipping
  const shippingAmount =
    Number(shipping) || 0;

  // 6. Final total
  const total =
    taxableAmount +
    taxTotal +
    shippingAmount;

  return {
    subtotal,
    discount: discountAmount,
    taxableAmount,
    tax: taxTotal,
    shipping: shippingAmount,
    total,
  };
};

// Generate invoice number
export const generateInvoiceNumber = (prefix = 'INV') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${timestamp}${random}`;
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (basic validation)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-+()]{7,15}$/;
  return phoneRegex.test(phone);
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(dateString);
};

// Check if invoice is overdue
export const isOverdue = (dueDate, status) => {
  if (status === 'paid') return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

// Get days until due
export const getDaysUntilDue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffInDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diffInDays;
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Download file helper
export const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

// Sort array by key
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Filter array by search query
export const filterBySearch = (array, query, keys) => {
  if (!query) return array;
  const lowerQuery = query.toLowerCase();
  return array.filter(item =>
    keys.some(key => {
      const value = item[key];
      return value && value.toString().toLowerCase().includes(lowerQuery);
    })
  );
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Status color mapping
export const statusColors = {
  paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400' },
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400' },
  overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400' },
  draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-400' },
};

// Currency symbols
export const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  CHF: 'Fr',
  SEK: 'kr',
};

export default {
  formatCurrency,
  formatDate,
  formatDateForInput,
  calculateInvoiceTotals,
  generateInvoiceNumber,
  isValidEmail,
  isValidPhone,
  truncateText,
  getRelativeTime,
  isOverdue,
  getDaysUntilDue,
  debounce,
  downloadFile,
  copyToClipboard,
  groupBy,
  sortBy,
  filterBySearch,
  getInitials,
  statusColors,
  currencySymbols,
};