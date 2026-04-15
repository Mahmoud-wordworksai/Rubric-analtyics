"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiMail, FiMessageCircle, FiBell } from "react-icons/fi";
import { CommunicationMetrics } from "../types";

interface CommunicationMetricsCardProps {
  communicationMetrics: CommunicationMetrics;
}

const CommunicationMetricsCard: React.FC<CommunicationMetricsCardProps> = ({
  communicationMetrics,
}) => {
  const emailTriggered = communicationMetrics?.email_triggered ?? 0;
  const emailRate = communicationMetrics?.email_rate ?? 0;
  const smsTriggered = communicationMetrics?.sms_triggered ?? 0;
  const smsRate = communicationMetrics?.sms_rate ?? 0;
  const totalNotifications = communicationMetrics?.total_notifications ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-pink-100">
          <FiBell className="w-4 h-4 text-pink-600" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
            Communication Metrics
          </h3>
          <p className="text-xs text-gray-500">
            {totalNotifications.toLocaleString()} total notifications
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email Section */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <FiMail className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Email</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Triggered</span>
              <span className="text-lg font-bold text-blue-700">
                {emailTriggered.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Rate</span>
              <span className="text-lg font-bold text-blue-700">
                {emailRate.toFixed(1)}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(emailRate, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* SMS Section */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <FiMessageCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-700">SMS</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Triggered</span>
              <span className="text-lg font-bold text-green-700">
                {smsTriggered.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Rate</span>
              <span className="text-lg font-bold text-green-700">
                {smsRate.toFixed(1)}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-green-100 rounded-full overflow-hidden mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(smsRate, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
          <FiBell className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Total Notifications:</span>
          <span className="text-lg font-bold text-[#263978]">
            {totalNotifications.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CommunicationMetricsCard;
