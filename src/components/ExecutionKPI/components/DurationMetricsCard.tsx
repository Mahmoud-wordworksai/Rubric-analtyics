"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiClock } from "react-icons/fi";
import { DurationMetrics } from "../types";

interface DurationMetricsCardProps {
  durationMetrics: DurationMetrics;
}

const DurationMetricsCard: React.FC<DurationMetricsCardProps> = ({
  durationMetrics,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-purple-100">
          <FiClock className="w-4 h-4 text-purple-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Duration Metrics
        </h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
          <p className="text-xs text-gray-500 font-medium uppercase">Total Duration</p>
          <p className="text-lg font-bold text-purple-700">
            {durationMetrics.total_duration_formatted}
          </p>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <p className="text-xs text-gray-500 font-medium uppercase">Billable</p>
          <p className="text-lg font-bold text-blue-700">
            {durationMetrics.total_billable_formatted}
          </p>
        </div>

        <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
          <p className="text-xs text-gray-500 font-medium uppercase">Avg Duration</p>
          <p className="text-lg font-bold text-green-700">
            {durationMetrics.average_duration_formatted}
          </p>
        </div>

        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
          <p className="text-xs text-gray-500 font-medium uppercase">Max Duration</p>
          <p className="text-lg font-bold text-orange-700">
            {durationMetrics.max_duration_formatted}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-xs text-gray-500 font-medium uppercase">Min Duration</p>
          <p className="text-lg font-bold text-gray-700">
            {durationMetrics.min_duration_formatted}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DurationMetricsCard;
