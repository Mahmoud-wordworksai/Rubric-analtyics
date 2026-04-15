"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiMessageSquare } from "react-icons/fi";
import { DispositionDistributionItem } from "../types";

interface DispositionDistributionCardProps {
  dispositions: DispositionDistributionItem[];
  totalSessions?: number;
}

// Color palette for disposition bars
const DISPOSITION_COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-green-500", light: "bg-green-50", text: "text-green-700" },
  { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700" },
  { bg: "bg-purple-500", light: "bg-purple-50", text: "text-purple-700" },
  { bg: "bg-cyan-500", light: "bg-cyan-50", text: "text-cyan-700" },
  { bg: "bg-pink-500", light: "bg-pink-50", text: "text-pink-700" },
  { bg: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-700" },
  { bg: "bg-teal-500", light: "bg-teal-50", text: "text-teal-700" },
  { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-red-500", light: "bg-red-50", text: "text-red-700" },
];

const DispositionDistributionCard: React.FC<DispositionDistributionCardProps> = ({
  dispositions,
  totalSessions = 0,
}) => {
  if (!dispositions || dispositions.length === 0) {
    return null;
  }

  // Sort by count descending
  const sortedDispositions = [...dispositions].sort((a, b) => b.count - a.count);

  // Calculate total for percentage if not provided
  const total = totalSessions > 0 ? totalSessions : sortedDispositions.reduce((sum, d) => sum + d.count, 0);

  // Find max count for bar scaling
  const maxCount = Math.max(...sortedDispositions.map(d => d.count));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-indigo-100">
          <FiMessageSquare className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
            Disposition Distribution
          </h3>
          <p className="text-xs text-gray-500">
            {sortedDispositions.length} dispositions
          </p>
        </div>
      </div>

      {/* Disposition List */}
      <div className="space-y-3">
        {sortedDispositions.map((item, index) => {
          const colorSet = DISPOSITION_COLORS[index % DISPOSITION_COLORS.length];
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

          return (
            <motion.div
              key={item.disposition}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`p-3 rounded-lg ${colorSet.light} border border-gray-100`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${colorSet.text}`}>
                  {item.disposition}
                </span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-800">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-gray-500">
                    ({percentage.toFixed(1)}%)
                  </span>
                  {item.total_amount > 0 && (
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      | {formatAmount(item.total_amount)}
                    </span>
                  )}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                  className={`h-full ${colorSet.bg} rounded-full`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Total: {total.toLocaleString()} sessions</span>
        <span>
          Total Amount: {formatAmount(sortedDispositions.reduce((sum, d) => sum + (d.total_amount || 0), 0))}
        </span>
      </div>
    </motion.div>
  );
};

// Helper to format amount
const formatAmount = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}K`;
  }
  return `₹${amount.toLocaleString()}`;
};

export default DispositionDistributionCard;
