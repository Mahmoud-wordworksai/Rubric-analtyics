import { CallStatusCategory } from './types';

/**
 * Format duration in seconds to human-readable format
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Format currency amount to Indian format with suffix
 */
export const formatCurrency = (amount: number): string => {
  if (amount === null || amount === undefined) return '₹0';

  const absAmount = Math.abs(amount);
  let formatted: string;

  if (absAmount >= 10000000) {
    // Crores
    formatted = `₹${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs
    formatted = `₹${(absAmount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    // Thousands
    formatted = `₹${(absAmount / 1000).toFixed(2)}K`;
  } else {
    formatted = `₹${absAmount.toFixed(0)}`;
  }

  return amount < 0 ? `-${formatted}` : formatted;
};

/**
 * Format currency without abbreviation
 */
export const formatCurrencyFull = (amount: number): string => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Format phone number for display in Indian format
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return 'N/A';

  // Remove any non-digit characters except +
  const digitsOnly = phone.replace(/[^\d]/g, '');

  // Remove country code (91) if present at start
  const cleaned = digitsOnly.replace(/^91/, '');

  // Format as +91 XXXXX XXXXX for 10-digit numbers (Indian format)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  // If not 10 digits, return with +91 prefix if it looks like Indian number
  if (cleaned.length > 0) {
    return `+91 ${cleaned}`;
  }

  return phone;
};

/**
 * Format date string to readable format
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format datetime string to readable format
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

/**
 * Get call status category from raw status
 */
export const getCallStatusCategory = (rawStatus: string): CallStatusCategory => {
  if (!rawStatus) return 'Unknown';

  const status = rawStatus.toLowerCase();

  if (
    status.includes('completed') ||
    status.includes('answered') ||
    status.includes('connected')
  ) {
    return 'Connected';
  }

  if (
    status.includes('no answer') ||
    status.includes('no-answer') ||
    status.includes('noanswer') ||
    status.includes('not answered') ||
    status.includes('ring')
  ) {
    return 'No Answer';
  }

  if (status.includes('busy') || status.includes('user_busy')) {
    return 'Busy';
  }

  if (
    status.includes('voicemail') ||
    status.includes('voice mail') ||
    status.includes('vm')
  ) {
    return 'Voicemail';
  }

  if (
    status.includes('failed') ||
    status.includes('error') ||
    status.includes('rejected') ||
    status.includes('unavailable')
  ) {
    return 'Failed';
  }

  return 'Unknown';
};

/**
 * Get color for call status
 */
export const getCallStatusColor = (
  category: CallStatusCategory
): 'green' | 'orange' | 'red' | 'purple' | 'blue' => {
  switch (category) {
    case 'Connected':
      return 'green';
    case 'No Answer':
      return 'orange';
    case 'Busy':
      return 'orange';
    case 'Voicemail':
      return 'purple';
    case 'Failed':
      return 'red';
    default:
      return 'blue';
  }
};

/**
 * Get payment status display text
 */
export const getPaymentStatusText = (isPaid: boolean, hasPtp?: boolean): string => {
  if (isPaid) return 'Paid';
  if (hasPtp) return 'Promise to Pay';
  return 'Unpaid';
};

/**
 * Get payment status color
 */
export const getPaymentStatusColor = (
  isPaid: boolean,
  hasPtp?: boolean
): 'green' | 'blue' | 'orange' => {
  if (isPaid) return 'green';
  if (hasPtp) return 'blue';
  return 'orange';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format snake_case or kebab-case to Title Case
 */
export const formatLabel = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(dateString);
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Safe access nested object property
 */
export const getNestedValue = <T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue: T
): T => {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result as T) ?? defaultValue;
};

/**
 * Generate chart colors for Recharts
 */
export const CHART_COLORS = {
  primary: '#263978',
  success: '#22c55e',
  warning: '#f97316',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  cyan: '#06b6d4',
  pink: '#ec4899',
  gray: '#6b7280',
};

export const CHART_COLOR_ARRAY = [
  '#263978', // primary blue
  '#22c55e', // green
  '#f97316', // orange
  '#ef4444', // red
  '#a855f7', // purple
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#ec4899', // pink
];

/**
 * Get chart color by index
 */
export const getChartColor = (index: number): string => {
  return CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length];
};
