
import React from "react";
import { motion } from "framer-motion";

interface DataItem {
  count?: number;
  amount?: number;
}

interface StatCardProps {
  title: string;
  data?: DataItem;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  displayType: 'count' | 'amount' | 'both';
  formatAmount?: boolean;
  currency?: string;
  subtitle?: string;
}

const StatCardValue: React.FC<StatCardProps> = ({ 
  title, 
  data, 
  icon, 
  iconBgColor, 
  iconColor,
  displayType = 'both',
  formatAmount = false,
  currency = 'INR',
  subtitle
}) => {
  const formatValue = (value: number | undefined | null, type: 'count' | 'amount'): string => {
    const safeValue = value ?? 0;
    if (type === 'amount' && formatAmount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(safeValue);
    }
    return safeValue.toLocaleString();
  };

  const formatValueWithoutCurrency = (value: number | undefined | null): string => {
    const safeValue = value ?? 0;
    return safeValue.toLocaleString();
  };

  const getCurrencySymbol = (): string => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    return symbols[currency] || '$';
  };

  const getDisplayValue = (): React.ReactNode => {
    if (!data) return <span className="text-gray-400">0</span>;
    
    switch (displayType) {
      case 'count':
        return (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">
              {formatValueWithoutCurrency(data.count)}
            </span>
          </div>
        );
      case 'amount':
        return (
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-medium text-slate-600">
              {getCurrencySymbol()}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">
              {formatValueWithoutCurrency(data.amount)}
            </span>
          </div>
        );
      case 'both':
        return (
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Count:</span>
              <span className="text-xl font-bold text-slate-800">
                {formatValueWithoutCurrency(data.count)}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Amount:</span>
              <span className="text-lg font-medium text-emerald-600">
                {getCurrencySymbol()}
              </span>
              <span className="text-xl font-bold text-emerald-600">
                {formatValueWithoutCurrency(data.amount)}
              </span>
            </div>
          </div>
        );
      default:
        return formatValue(data.count, 'count');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.2 }
      }}
      className="relative bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-xl p-6 overflow-hidden transition-all duration-300 group"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      
      {/* Content container */}
      <div className="relative flex items-start justify-between">
        {/* Icon section */}
        <div className={`p-4 rounded-xl ${iconBgColor} ${iconColor} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        
        {/* Main content */}
        <div className="flex-1 ml-4 space-y-3">
          {/* Title and subtitle */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Values */}
          <div className="space-y-2">
            {getDisplayValue()}
          </div>
        </div>
      </div>
      
      {/* Bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 group-hover:from-blue-200 group-hover:via-blue-400 group-hover:to-blue-200 transition-all duration-300" />
    </motion.div>
  );
};

export default StatCardValue;