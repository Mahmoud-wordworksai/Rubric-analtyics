"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiPhone } from "react-icons/fi";
import { DatasheetCallPerformance } from "../types";
import { getCallStatusColor, STATUS_COLORS, parsePercentage } from "../utils";

interface CallPerformanceCardProps {
  callPerformance: DatasheetCallPerformance;
  totalSessions: number;
}

const CallPerformanceCard: React.FC<CallPerformanceCardProps> = ({
  callPerformance,
  totalSessions,
}) => {
  const connectionRate = parsePercentage(callPerformance?.connection_rate);
  const connectedCalls = callPerformance?.connected_calls ?? 0;

  // Use status_distribution array if available, fall back to legacy status_breakdown object
  const statusDistribution = callPerformance?.status_distribution;
  const statusBreakdown = callPerformance?.status_breakdown;

  // Calculate status entries for display
  const statusEntries = statusDistribution && statusDistribution.length > 0
    ? statusDistribution
        .filter((item) => item.count > 0)
        .map((item) => ({
          status: item.status,
          count: item.count ?? 0,
          percentage: item.percentage ?? 0,
        }))
        .sort((a, b) => b.count - a.count)
    : statusBreakdown
      ? Object.entries(statusBreakdown)
          .filter(([, count]) => count > 0)
          .map(([status, count]) => ({
            status,
            count,
            percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count)
      : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-green-100">
          <FiPhone className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Call Performance
        </h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <p className="text-xs text-gray-500 font-medium uppercase">
            Total Calls
          </p>
          <p className="text-xl font-bold text-blue-700">
            {totalSessions.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
          <p className="text-xs text-gray-500 font-medium uppercase">
            Connected
          </p>
          <p className="text-xl font-bold text-green-700">
            {connectedCalls.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 font-medium uppercase">
            Connection Rate
          </p>
          <p className="text-xl font-bold text-purple-700">
            {connectionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Status Distribution */}
      {statusEntries.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
            Status Breakdown
          </p>
          <div className="space-y-2">
            {statusEntries.map((item) => {
              const color = getCallStatusColor(item.status);
              const colors = STATUS_COLORS[color];

              return (
                <div key={item.status} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium">
                        {item.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.count.toLocaleString()} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.dot} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CallPerformanceCard;
