"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiCalendar, FiDollarSign } from "react-icons/fi";
import { CollectionMetrics, DispositionDistributionItem } from "../types";

interface CollectionMetricsCardProps {
  collectionMetrics: CollectionMetrics;
  dispositionDistribution?: DispositionDistributionItem[];
  connectedCalls?: number;
}

const CollectionMetricsCard: React.FC<CollectionMetricsCardProps> = ({
  collectionMetrics,
  dispositionDistribution = [],
  connectedCalls = 0,
}) => {
  // Get PTP and Paid from disposition distribution (case-insensitive)
  const ptpData = dispositionDistribution.find(
    (item) => item.disposition?.toLowerCase() === "ptp"
  );
  const ptpCount = ptpData?.count || 0;
  const ptpAmount = ptpData?.total_amount || 0;

  const paidData = dispositionDistribution.find(
    (item) => item.disposition?.toLowerCase() === "paid"
  );
  const paidCount = paidData?.count || 0;

  // Calculate rates based on connected calls
  const ptpRate = connectedCalls > 0 ? (ptpCount / connectedCalls) * 100 : 0;
  const paidRate = connectedCalls > 0 ? (paidCount / connectedCalls) * 100 : 0;

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

      {/* Outstanding Amount */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-xs text-gray-500 font-medium uppercase">
          Total Outstanding
        </p>
        <p className="text-2xl font-bold text-[#263978]">
          {collectionMetrics.total_amount_formatted}
        </p>
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
            {ptpAmount > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                <span className="text-xs text-gray-500 uppercase">Amount</span>
                <span className="text-lg font-bold text-blue-700">
                  ₹{ptpAmount.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CollectionMetricsCard;
