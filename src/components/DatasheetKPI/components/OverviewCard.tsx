"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiActivity,
  FiLayers,
  FiTrendingUp,
  FiClock,
  FiDollarSign,
} from "react-icons/fi";
import { DatasheetOverview } from "../types";

interface OverviewCardProps {
  overview: DatasheetOverview;
  totalDuration?: string;
  totalAmount?: string;
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

const OverviewCard: React.FC<OverviewCardProps> = ({ overview, totalDuration: durationProp, totalAmount: amountProp }) => {
  const executionsCount = overview?.executions_count ?? 0;
  const totalSessions = overview?.total_sessions ?? 0;
  const uniqueCustomers = overview?.unique_customers ?? 0;
  // Use props if provided, otherwise fall back to overview fields
  const totalBillAmount = amountProp || overview?.total_bill_amount || "₹0";
  const totalDuration = durationProp || overview?.total_duration || "0s";

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
          Datasheet Overview
        </h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricItem
          icon={<FiLayers className="w-4 h-4 text-purple-600" />}
          iconBg="bg-purple-100"
          label="Executions"
          value={executionsCount.toLocaleString()}
        />

        <MetricItem
          icon={<FiActivity className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-100"
          label="Total Sessions"
          value={totalSessions.toLocaleString()}
        />

        <MetricItem
          icon={<FiUsers className="w-4 h-4 text-green-600" />}
          iconBg="bg-green-100"
          label="Unique Customers"
          value={uniqueCustomers.toLocaleString()}
        />

        <MetricItem
          icon={<FiDollarSign className="w-4 h-4 text-orange-600" />}
          iconBg="bg-orange-100"
          label="Total Amount"
          value={totalBillAmount}
        />

        <MetricItem
          icon={<FiClock className="w-4 h-4 text-cyan-600" />}
          iconBg="bg-cyan-100"
          label="Total Duration"
          value={totalDuration}
        />
      </div>
    </motion.div>
  );
};

export default OverviewCard;
