"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiRefreshCw, FiPhone, FiClock } from "react-icons/fi";
import { AttemptAnalysis } from "../types";
import { formatDateTime, formatDuration } from "../utils";

interface AttemptHistoryCardProps {
  attemptAnalysis: AttemptAnalysis;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  blue: "bg-blue-500",
};

const getStatusColor = (status?: string, disposition?: string): string => {
  const combined = `${status || ''} ${disposition || ''}`.toLowerCase();

  if (
    combined.includes("ptp") ||
    combined.includes("promise") ||
    combined.includes("callback")
  ) {
    return "blue";
  }
  if (
    combined.includes("paid") ||
    combined.includes("connected") ||
    combined.includes("success")
  ) {
    return "green";
  }
  if (
    combined.includes("no answer") ||
    combined.includes("busy") ||
    combined.includes("unavailable") ||
    combined.includes("not received")
  ) {
    return "orange";
  }
  if (
    combined.includes("failed") ||
    combined.includes("refused") ||
    combined.includes("reject")
  ) {
    return "red";
  }
  return "purple";
};

const AttemptHistoryCard: React.FC<AttemptHistoryCardProps> = ({
  attemptAnalysis,
}) => {
  const {
    current_attempt_number,
    previous_attempts_count,
    total_attempts,
    attempt_history = [],
    attempt_summary,
    previous_connection_rate,
    is_first_attempt,
    max_attempts_reached,
  } = attemptAnalysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-100">
            <FiRefreshCw className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
            Attempt History
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {max_attempts_reached && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded">
              Max Reached
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
            <span className="text-sm font-bold text-[#263978]">
              {current_attempt_number}
            </span>
            <span className="text-sm text-gray-500">of</span>
            <span className="text-sm font-bold text-[#263978]">
              {total_attempts}
            </span>
          </div>
        </div>
      </div>

      {/* Attempt Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Previous</p>
          <p className="text-xl font-bold text-[#263978]">
            {previous_attempts_count}
          </p>
          <p className="text-xs text-gray-500">attempts</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
          <p className="text-xs text-blue-600 uppercase mb-1">Current</p>
          <p className="text-xl font-bold text-[#263978]">
            {current_attempt_number}
          </p>
          <p className="text-xs text-blue-600">attempt</p>
        </div>
      </div>

      {/* Attempt Summary Breakdown - Only show if there are meaningful positive values */}
      {attempt_summary && (
        (attempt_summary.connected_attempts !== undefined && attempt_summary.connected_attempts > 0) ||
        (attempt_summary.busy_attempts !== undefined && attempt_summary.busy_attempts > 0) ||
        (attempt_summary.no_answer_attempts !== undefined && attempt_summary.no_answer_attempts > 0) ||
        (previous_connection_rate !== undefined && previous_connection_rate > 0)
      ) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {attempt_summary.connected_attempts !== undefined && attempt_summary.connected_attempts > 0 && (
            <div className="p-2 bg-green-50 rounded text-center">
              <p className="text-xs text-green-600">Connected</p>
              <p className="text-lg font-bold text-green-700">{attempt_summary.connected_attempts}</p>
            </div>
          )}
          {attempt_summary.busy_attempts !== undefined && attempt_summary.busy_attempts > 0 && (
            <div className="p-2 bg-orange-50 rounded text-center">
              <p className="text-xs text-orange-600">Busy</p>
              <p className="text-lg font-bold text-orange-700">{attempt_summary.busy_attempts}</p>
            </div>
          )}
          {attempt_summary.no_answer_attempts !== undefined && attempt_summary.no_answer_attempts > 0 && (
            <div className="p-2 bg-yellow-50 rounded text-center">
              <p className="text-xs text-yellow-600">No Answer</p>
              <p className="text-lg font-bold text-yellow-700">{attempt_summary.no_answer_attempts}</p>
            </div>
          )}
          {previous_connection_rate !== undefined && previous_connection_rate > 0 && (
            <div className="p-2 bg-blue-50 rounded text-center">
              <p className="text-xs text-blue-600">Connect Rate</p>
              <p className="text-lg font-bold text-blue-700">{(previous_connection_rate * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Attempts Progress */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: total_attempts }, (_, i) => (
          <div
            key={i}
            className={`
              flex-1 h-2 rounded-full transition-all
              ${i < current_attempt_number ? "bg-[#263978]" : "bg-gray-200"}
            `}
          />
        ))}
      </div>

      {/* Attempt History List */}
      {attempt_history.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase">
            Previous Attempts
          </p>
          {attempt_history.map((attempt, index) => {
            const statusColor = getStatusColor(attempt.bot_ivr_status, attempt.disposition || undefined);
            const isLatest = index === 0;
            const displayStatus = attempt.bot_ivr_status || attempt.disposition || 'N/A';

            return (
              <motion.div
                key={attempt.attempt_number || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative p-3 rounded-lg border
                  ${
                    isLatest
                      ? "border-gray-300 bg-gray-50"
                      : "border-gray-200 bg-white"
                  }
                `}
              >
                {/* Attempt Number Badge */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`
                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                        bg-gray-200 text-gray-700
                      `}
                    >
                      {attempt.attempt_number || index + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[statusColor]}`}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {displayStatus}
                      </span>
                    </div>
                  </div>
                  {attempt.duration !== undefined && attempt.duration > 0 && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {formatDuration(attempt.duration)}
                    </span>
                  )}
                </div>

                {/* Attempt Details */}
                <div className="flex items-center flex-wrap gap-4 text-xs">
                  {attempt.dialed_datetime && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <FiClock className="w-3.5 h-3.5" />
                      <span>{formatDateTime(attempt.dialed_datetime)}</span>
                    </div>
                  )}
                  {attempt.disposition && attempt.disposition !== displayStatus && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span>Disposition: {attempt.disposition}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <FiPhone className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No previous attempt history</p>
          <p className="text-xs text-gray-400 mt-1">
            {is_first_attempt ? "This is the first attempt" : "No previous attempts recorded"}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default AttemptHistoryCard;
