"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiClock, FiActivity, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { DurationMetrics } from "../types";

interface DurationMetricsCardProps {
  durationMetrics: DurationMetrics;
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  iconBg: string;
}

const MetricItem: React.FC<MetricItemProps> = ({
  icon,
  label,
  value,
  subValue,
  iconBg,
}) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
    <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium uppercase">{label}</p>
      <p className="text-lg font-bold text-[#263978]">{value}</p>
      {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
    </div>
  </div>
);

const DurationMetricsCard: React.FC<DurationMetricsCardProps> = ({
  durationMetrics,
}) => {
  const totalDuration = durationMetrics?.total_duration_formatted || "0s";
  const totalBillable = durationMetrics?.total_billable_formatted || "0s";
  const avgDuration = durationMetrics?.average_duration_formatted || "0s";
  const maxDuration = durationMetrics?.max_duration_formatted || "0s";
  const minDuration = durationMetrics?.min_duration_formatted || "0s";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-cyan-100">
          <FiClock className="w-4 h-4 text-cyan-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Duration Metrics
        </h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricItem
          icon={<FiClock className="w-4 h-4 text-cyan-600" />}
          iconBg="bg-cyan-100"
          label="Total Duration"
          value={totalDuration}
          subValue={durationMetrics?.total_duration_seconds ? `${durationMetrics.total_duration_seconds.toLocaleString()}s` : undefined}
        />

        <MetricItem
          icon={<FiActivity className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-100"
          label="Total Billable"
          value={totalBillable}
          subValue={durationMetrics?.total_billable_seconds ? `${durationMetrics.total_billable_seconds.toLocaleString()}s` : undefined}
        />

        <MetricItem
          icon={<FiClock className="w-4 h-4 text-purple-600" />}
          iconBg="bg-purple-100"
          label="Average Duration"
          value={avgDuration}
          subValue={durationMetrics?.average_call_duration ? `${durationMetrics.average_call_duration.toFixed(1)}s per call` : undefined}
        />

        <MetricItem
          icon={<FiTrendingUp className="w-4 h-4 text-green-600" />}
          iconBg="bg-green-100"
          label="Max Duration"
          value={maxDuration}
          subValue={durationMetrics?.max_call_duration ? `${durationMetrics.max_call_duration.toLocaleString()}s` : undefined}
        />

        <MetricItem
          icon={<FiTrendingDown className="w-4 h-4 text-orange-600" />}
          iconBg="bg-orange-100"
          label="Min Duration"
          value={minDuration}
          subValue={durationMetrics?.min_call_duration ? `${durationMetrics.min_call_duration}s` : undefined}
        />
      </div>
    </motion.div>
  );
};

export default DurationMetricsCard;
