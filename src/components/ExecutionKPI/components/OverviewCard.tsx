"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiActivity,
  FiLayers,
  FiFolder,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import { ExecutionOverview } from "../types";
import { formatDateTime } from "../utils";

interface OverviewCardProps {
  overview: ExecutionOverview;
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
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

const OverviewCard: React.FC<OverviewCardProps> = ({ overview }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-blue-100">
          <FiTrendingUp className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Execution Overview
        </h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricItem
          icon={<FiActivity className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-100"
          label="Total Sessions"
          value={overview.total_sessions.toLocaleString()}
        />

        <MetricItem
          icon={<FiUsers className="w-4 h-4 text-purple-600" />}
          iconBg="bg-purple-100"
          label="Unique Customers"
          value={overview.unique_customers.toLocaleString()}
        />

        <MetricItem
          icon={<FiLayers className="w-4 h-4 text-green-600" />}
          iconBg="bg-green-100"
          label="Campaigns"
          value={overview.campaigns_count}
        />

        <MetricItem
          icon={<FiFolder className="w-4 h-4 text-orange-600" />}
          iconBg="bg-orange-100"
          label="Allocations"
          value={overview.allocations_count}
        />

        {overview.active_calls > 0 && (
          <MetricItem
            icon={<FiActivity className="w-4 h-4 text-red-600" />}
            iconBg="bg-red-100"
            label="Active Calls"
            value={overview.active_calls}
          />
        )}
      </div>

      {/* Time Range */}
      {overview.time_range && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
            Time Range
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">First Call</p>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateTime(overview.time_range.first_call)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Last Call</p>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateTime(overview.time_range.last_call)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OverviewCard;
