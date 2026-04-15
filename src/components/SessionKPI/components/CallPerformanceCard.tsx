"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiPhone,
  FiClock,
  FiServer,
  FiMic,
  FiVolume2,
  FiCpu,
  FiArrowUpRight,
  FiCalendar,
} from "react-icons/fi";
import { CallPerformance, CallStatusCategory } from "../types";
import { formatDuration, getCallStatusCategory, getCallStatusColor } from "../utils";

interface CallPerformanceCardProps {
  callPerformance: CallPerformance;
}

const STATUS_COLORS = {
  green: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
};

const CallPerformanceCard: React.FC<CallPerformanceCardProps> = ({
  callPerformance,
}) => {
  // Use category directly if available, otherwise derive from status
  const statusCategory: CallStatusCategory = (callPerformance.call_status?.category as CallStatusCategory) ||
    getCallStatusCategory(
      callPerformance.call_status?.status ||
      callPerformance.call_status?.raw_status || ""
    );
  const statusColor = getCallStatusColor(statusCategory);
  const colors = STATUS_COLORS[statusColor];

  // Get duration value
  const durationSeconds = callPerformance.duration?.total_seconds ||
    callPerformance.duration?.seconds || 0;

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
          <FiPhone className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Call Performance
        </h3>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <div
          className={`
            inline-flex items-center gap-2 px-3 py-2 rounded-lg
            ${colors.bg} ${colors.border} border
          `}
        >
          <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
          <span className={`text-sm font-semibold ${colors.text}`}>
            {statusCategory}
          </span>
        </div>
        {callPerformance.call_status?.status && (
          <p className="text-xs text-gray-500 mt-1 ml-1">
            Status: {callPerformance.call_status.status}
          </p>
        )}
      </div>

      {/* Duration & Direction */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="p-2 rounded-lg bg-blue-100">
            <FiClock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Duration</p>
            <p className="text-lg font-bold text-[#263978]">
              {callPerformance.duration?.formatted_duration ||
                formatDuration(durationSeconds)}
            </p>
            {callPerformance.duration?.billable_seconds !== undefined && (
              <p className="text-xs text-gray-500">
                Billable: {callPerformance.duration.formatted_billable ||
                  formatDuration(callPerformance.duration.billable_seconds)}
              </p>
            )}
          </div>
        </div>

        {callPerformance.direction && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 rounded-lg bg-purple-100">
              <FiArrowUpRight className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Direction</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">
                {callPerformance.direction}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timing Info */}
      {callPerformance.timing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {callPerformance.timing.start_time && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Start Time</p>
                <p className="text-xs font-medium text-gray-700">
                  {callPerformance.timing.start_time}
                </p>
              </div>
            </div>
          )}
          {callPerformance.timing.end_time && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">End Time</p>
                <p className="text-xs font-medium text-gray-700">
                  {callPerformance.timing.end_time}
                </p>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Services */}
      {(callPerformance.provider ||
        callPerformance.stt_service ||
        callPerformance.tts_service ||
        callPerformance.llm_service) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
            Services Used
          </p>
          <div className="grid grid-cols-2 gap-2">
            {callPerformance.provider && (
              <div className="flex items-center gap-2 text-xs">
                <FiServer className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500">Provider:</span>
                <span className="text-gray-700 font-medium">
                  {callPerformance.provider}
                </span>
              </div>
            )}
            {callPerformance.stt_service && (
              <div className="flex items-center gap-2 text-xs">
                <FiMic className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500">STT:</span>
                <span className="text-gray-700 font-medium">
                  {callPerformance.stt_service}
                </span>
              </div>
            )}
            {callPerformance.tts_service && (
              <div className="flex items-center gap-2 text-xs">
                <FiVolume2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500">TTS:</span>
                <span className="text-gray-700 font-medium">
                  {callPerformance.tts_service}
                </span>
              </div>
            )}
            {callPerformance.llm_service && (
              <div className="flex items-center gap-2 text-xs">
                <FiCpu className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500">LLM:</span>
                <span className="text-gray-700 font-medium">
                  {callPerformance.llm_service}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CallPerformanceCard;
