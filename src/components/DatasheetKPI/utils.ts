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
 * Format percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Parse percentage string or number to number
 */
export const parsePercentage = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;

  // If it's already a number, return it directly
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  // If it's a string, remove % and parse
  const numStr = String(value).replace('%', '').trim();
  return parseFloat(numStr) || 0;
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
 * Get call status color
 */
export const getCallStatusColor = (
  category: CallStatusCategory | string
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

/**
 * Status color mappings for UI
 */
export const STATUS_COLORS = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
};

/**
 * Get execution status color
 */
export const getExecutionStatusColor = (status: string): 'green' | 'orange' | 'red' | 'blue' => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'green';
    case 'running':
    case 'in_progress':
      return 'orange';
    case 'failed':
    case 'error':
      return 'red';
    default:
      return 'blue';
  }
};
