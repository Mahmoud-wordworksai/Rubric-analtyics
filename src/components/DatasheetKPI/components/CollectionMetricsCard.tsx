"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiCalendar, FiDollarSign } from "react-icons/fi";
import { DatasheetCollectionMetrics } from "../types";
import { parsePercentage } from "../utils";

interface CollectionMetricsCardProps {
  collectionMetrics: DatasheetCollectionMetrics;
}

const CollectionMetricsCard: React.FC<CollectionMetricsCardProps> = ({
  collectionMetrics,
}) => {
  // Handle both flat and nested structures
  const paidCount = collectionMetrics?.paid_metrics?.paid_count ?? collectionMetrics?.paid_count ?? 0;
  const ptpCount = collectionMetrics?.ptp_metrics?.ptp_count ?? collectionMetrics?.ptp_count ?? 0;
  const paidRate = parsePercentage(collectionMetrics?.paid_metrics?.paid_rate ?? collectionMetrics?.paid_rate);
  const ptpRate = parsePercentage(collectionMetrics?.ptp_metrics?.ptp_rate ?? collectionMetrics?.ptp_rate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-green-100">
          <FiDollarSign className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Collection Metrics
        </h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Paid Section */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <FiCheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Paid</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Count</span>
              <span className="text-lg font-bold text-green-700">
                {paidCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Rate</span>
              <span className="text-lg font-bold text-green-700">
                {paidRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* PTP Section */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <FiCalendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              Promise to Pay (PTP)
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Count</span>
              <span className="text-lg font-bold text-blue-700">
                {ptpCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">Rate</span>
              <span className="text-lg font-bold text-blue-700">
                {ptpRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CollectionMetricsCard;
