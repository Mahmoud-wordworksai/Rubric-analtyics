"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiFileText, FiMessageSquare } from "react-icons/fi";

interface CallSummaryCardProps {
  callSummary: string;
  disposition?: string;
  outcome?: string;
}

const CallSummaryCard: React.FC<CallSummaryCardProps> = ({
  callSummary,
  disposition,
  outcome,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#263978]/10">
            <FiFileText className="w-4 h-4 text-[#263978]" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
            Call Summary
          </h3>
        </div>
        {disposition && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            {disposition}
          </span>
        )}
      </div>

      {/* Summary Content */}
      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">
            <FiMessageSquare className="w-5 h-5 text-[#263978]/60" />
          </div>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {callSummary || "No call summary available."}
          </p>
        </div>
      </div>

      {/* Outcome Badge */}
      {outcome && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase font-medium">
            Outcome:
          </span>
          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
            {outcome}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default CallSummaryCard;
