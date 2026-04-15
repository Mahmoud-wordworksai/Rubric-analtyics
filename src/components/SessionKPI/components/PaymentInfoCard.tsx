"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiLink,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import { PaymentInfo } from "../types";
import {
  formatCurrencyFull,
  formatDate,
  getPaymentStatusText,
  getPaymentStatusColor,
} from "../utils";

interface PaymentInfoCardProps {
  paymentInfo: PaymentInfo;
  hasPtpPrevious?: boolean;
  isPaidPrevious?: boolean;
}

const STATUS_STYLES = {
  green: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    icon: FiCheckCircle,
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: FiCalendar,
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: FiAlertCircle,
  },
};

// Helper to get bill amount value
const getBillAmountValue = (billAmount?: { value?: number; raw?: number | string; formatted?: string }): number => {
  if (!billAmount) return 0;
  if (typeof billAmount.value === 'number') return billAmount.value;
  if (typeof billAmount.raw === 'number') return billAmount.raw;
  if (typeof billAmount.raw === 'string') return parseFloat(billAmount.raw) || 0;
  return 0;
};

// Helper to get PTP amount value
const getPtpAmountValue = (ptpDetails?: { ptp_amt?: number; ptp_amount?: { value?: number; formatted?: string } }): number | undefined => {
  if (!ptpDetails) return undefined;
  if (typeof ptpDetails.ptp_amt === 'number') return ptpDetails.ptp_amt;
  if (ptpDetails.ptp_amount?.value !== undefined) return ptpDetails.ptp_amount.value;
  return undefined;
};

// Helper to get PTP amount formatted
const getPtpAmountFormatted = (ptpDetails?: { ptp_amt?: number; ptp_amount?: { value?: number; formatted?: string } }): string | undefined => {
  if (!ptpDetails) return undefined;
  if (ptpDetails.ptp_amount?.formatted && ptpDetails.ptp_amount.formatted !== 'N/A') {
    return ptpDetails.ptp_amount.formatted;
  }
  const value = getPtpAmountValue(ptpDetails);
  if (value !== undefined) return formatCurrencyFull(value);
  return undefined;
};

const PaymentInfoCard: React.FC<PaymentInfoCardProps> = ({
  paymentInfo,
  hasPtpPrevious,
  isPaidPrevious,
}) => {
  const isPaid = paymentInfo.payment_status?.is_paid || false;
  const hasPtp = paymentInfo.ptp_details?.has_ptp || false;
  const statusColor = getPaymentStatusColor(isPaid, hasPtp);
  const statusText = getPaymentStatusText(isPaid, hasPtp);
  const styles = STATUS_STYLES[statusColor];
  const StatusIcon = styles.icon;

  const billAmountValue = getBillAmountValue(paymentInfo.bill_amount);
  const ptpAmountFormatted = getPtpAmountFormatted(paymentInfo.ptp_details);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-orange-100">
          <FiDollarSign className="w-4 h-4 text-orange-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Payment Information
        </h3>
      </div>

      {/* Bill Amount - Prominent Display */}
      <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
          Bill Amount
        </p>
        <p className="text-3xl sm:text-4xl font-bold text-[#263978]">
          {paymentInfo.bill_amount?.formatted || formatCurrencyFull(billAmountValue)}
        </p>
        {paymentInfo.due_date && paymentInfo.due_date !== 'N/A' && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-gray-600">
            <FiCalendar className="w-4 h-4" />
            <span>Due: {paymentInfo.due_date}</span>
          </div>
        )}
      </div>

      {/* Payment Status Badge */}
      <div className="mb-4">
        <div
          className={`
            flex items-center justify-center gap-2 p-3 rounded-lg
            ${styles.bg} ${styles.border} border
          `}
        >
          <StatusIcon className={`w-5 h-5 ${styles.text}`} />
          <span className={`text-base font-semibold ${styles.text}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Current vs Previous Comparison */}
      {(hasPtpPrevious !== undefined || isPaidPrevious !== undefined) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-1">Current</p>
            <div className="flex items-center gap-2">
              {isPaid ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <FiCheckCircle className="w-4 h-4" /> Paid
                </span>
              ) : hasPtp ? (
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" /> PTP
                </span>
              ) : (
                <span className="text-orange-600 font-medium">Unpaid</span>
              )}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-1">Previous</p>
            <div className="flex items-center gap-2">
              {isPaidPrevious ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <FiCheckCircle className="w-4 h-4" /> Paid
                </span>
              ) : hasPtpPrevious ? (
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" /> PTP
                </span>
              ) : (
                <span className="text-gray-500 font-medium">No PTP</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PTP Information - Updated to use ptp_details */}
      {hasPtp && paymentInfo.ptp_details && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FiCalendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              Promise to Pay Details
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {paymentInfo.ptp_details.ptp_date && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Date</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatDate(paymentInfo.ptp_details.ptp_date)}
                </p>
              </div>
            )}
            {ptpAmountFormatted && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Amount</p>
                <p className="text-sm font-medium text-gray-800">
                  {ptpAmountFormatted}
                </p>
              </div>
            )}
            {paymentInfo.ptp_details.ptp_days !== undefined && paymentInfo.ptp_details.ptp_days !== null && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Days</p>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {paymentInfo.ptp_details.ptp_days} days
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="space-y-3">
        {paymentInfo.payment_link && paymentInfo.payment_link_available !== false && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 rounded-lg bg-purple-100">
              <FiLink className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase">
                Payment Link
              </p>
              <a
                href={paymentInfo.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 font-medium truncate block hover:underline"
              >
                {paymentInfo.payment_link}
              </a>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PaymentInfoCard;
