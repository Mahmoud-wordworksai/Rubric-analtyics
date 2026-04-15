"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiLayers, FiPhone, FiClock, FiDollarSign } from "react-icons/fi";
import { ExecutionBreakdownItem } from "../types";
import { parsePercentage, getExecutionStatusColor, STATUS_COLORS } from "../utils";

interface ExecutionBreakdownCardProps {
  executions: ExecutionBreakdownItem[];
  onExecutionClick?: (executionId: string) => void;
}

const ExecutionBreakdownCard: React.FC<ExecutionBreakdownCardProps> = ({
  executions,
  onExecutionClick,
}) => {
  if (!executions || executions.length === 0) {
    return null;
  }

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
          <FiLayers className="w-4 h-4 text-purple-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Execution Breakdown
        </h3>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          {executions.length} executions
        </span>
      </div>

      {/* Execution List */}
      <div className="space-y-3">
        {executions.map((execution, index) => {
          const connectionRate = parsePercentage(execution.connection_rate);
          const statusColor = getExecutionStatusColor(execution.status || "completed");
          const colors = STATUS_COLORS[statusColor];

          return (
            <motion.div
              key={execution.execution_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 bg-gray-50 rounded-lg border border-gray-100 ${
                onExecutionClick ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
              }`}
              onClick={() => onExecutionClick?.(execution.execution_id)}
            >
              {/* Execution Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[#263978] truncate max-w-[200px]">
                    {execution.execution_name || `Execution ${index + 1}`}
                  </h4>
                  {execution.status && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {execution.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Execution Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Sessions</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {(execution.total_sessions ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <span className="text-xs text-green-600 font-bold">%</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Connected</p>
                    <p className="text-sm font-semibold text-green-700">
                      {(execution.connected_calls ?? 0).toLocaleString()} ({connectionRate.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {execution.total_amount || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {execution.total_duration || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ExecutionBreakdownCard;
