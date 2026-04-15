"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiTarget,
  FiGlobe,
  FiLayers,
  FiUsers,
  FiAlertTriangle,
  FiTrendingUp,
} from "react-icons/fi";
import { CurrentAttemptInfo } from "../types";
import { formatLabel } from "../utils";

interface CurrentAttemptInfoCardProps {
  currentAttemptInfo: CurrentAttemptInfo;
}

const getCooperationColor = (level?: string): string => {
  if (!level) return "gray";

  const lvl = level.toLowerCase();
  if (lvl.includes("cooperative") || lvl.includes("positive")) return "green";
  if (lvl.includes("neutral") || lvl.includes("moderate")) return "blue";
  if (
    lvl.includes("uncooperative") ||
    lvl.includes("hostile") ||
    lvl.includes("negative")
  )
    return "red";
  return "orange";
};

const COLOR_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  green: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  gray: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  colorStyle?: { bg: string; text: string; border: string };
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  label,
  value,
  colorStyle,
}) => {
  if (!value && value !== 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="p-2 rounded-lg bg-white border border-gray-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase">{label}</p>
        {colorStyle ? (
          <span
            className={`
              inline-block mt-1 px-2 py-0.5 rounded text-sm font-medium
              ${colorStyle.bg} ${colorStyle.text}
            `}
          >
            {value}
          </span>
        ) : (
          <p className="text-sm font-medium text-gray-800">{value}</p>
        )}
      </div>
    </div>
  );
};

const CurrentAttemptInfoCard: React.FC<CurrentAttemptInfoCardProps> = ({
  currentAttemptInfo,
}) => {
  const cooperationColor = getCooperationColor(
    currentAttemptInfo.user_cooperation_level
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100">
            <FiActivity className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
            Current Attempt Details
          </h3>
        </div>
        <span className="px-3 py-1.5 bg-[#263978] text-white text-sm font-bold rounded-full">
          #{currentAttemptInfo.attempt_number}
        </span>
      </div>

      {/* Disposition Row */}
      {currentAttemptInfo.disposition_code && (
        <div className="mb-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-xs text-blue-600 uppercase mb-1 font-medium">
              Disposition
            </p>
            <p className="text-lg font-bold text-[#263978]">
              {currentAttemptInfo.disposition_code}
            </p>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoItem
          icon={<FiGlobe className="w-4 h-4 text-blue-600" />}
          label="Language Detected"
          value={currentAttemptInfo.language_detected}
        />

        <InfoItem
          icon={<FiLayers className="w-4 h-4 text-purple-600" />}
          label="Conversation Stage"
          value={
            currentAttemptInfo.conversation_stage
              ? formatLabel(currentAttemptInfo.conversation_stage)
              : undefined
          }
        />

        <InfoItem
          icon={<FiTrendingUp className="w-4 h-4 text-indigo-600" />}
          label="Strategy"
          value={
            currentAttemptInfo.conversation_strategy
              ? formatLabel(currentAttemptInfo.conversation_strategy)
              : undefined
          }
        />

        <InfoItem
          icon={<FiUsers className="w-4 h-4 text-green-600" />}
          label="Cooperation Level"
          value={currentAttemptInfo.user_cooperation_level}
          colorStyle={COLOR_STYLES[cooperationColor]}
        />

        {currentAttemptInfo.interruption_count !== undefined && (
          <InfoItem
            icon={<FiAlertTriangle className="w-4 h-4 text-orange-600" />}
            label="Interruptions"
            value={currentAttemptInfo.interruption_count}
          />
        )}
      </div>

      {/* PTP Details from Current Attempt */}
      {currentAttemptInfo.ptp_details?.has_ptp && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FiTarget className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              Current Attempt PTP
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {currentAttemptInfo.ptp_details.ptp_date && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Date</p>
                <p className="font-medium text-gray-800">
                  {currentAttemptInfo.ptp_details.ptp_date}
                </p>
              </div>
            )}
            {(currentAttemptInfo.ptp_details.ptp_amt !== undefined || currentAttemptInfo.ptp_details.ptp_amt_formatted) && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Amount</p>
                <p className="font-medium text-gray-800">
                  {currentAttemptInfo.ptp_details.ptp_amt_formatted ||
                    `₹${currentAttemptInfo.ptp_details.ptp_amt?.toLocaleString("en-IN")}`}
                </p>
              </div>
            )}
            {currentAttemptInfo.ptp_details.ptp_days !== undefined && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Days</p>
                <p className="font-medium text-gray-800">
                  {currentAttemptInfo.ptp_details.ptp_days} days
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CurrentAttemptInfoCard;
