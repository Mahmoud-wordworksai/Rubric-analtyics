"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  StatCardProps,
  BORDER_COLORS,
  ICON_COLORS,
  ICON_BG_COLORS,
} from "../types";

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  borderColor,
  trend,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    const { value: trendValue, direction } = trend;

    if (direction === "up") {
      return (
        <span className="flex items-center text-xs text-green-600 font-medium">
          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {trendValue}%
        </span>
      );
    }

    if (direction === "down") {
      return (
        <span className="flex items-center text-xs text-red-600 font-medium">
          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {trendValue}%
        </span>
      );
    }

    return (
      <span className="flex items-center text-xs text-gray-500 font-medium">
        <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {trendValue}%
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 8px 32px rgba(38, 57, 120, 0.12)",
        transition: { duration: 0.2 },
      }}
      className={`
        bg-white border border-gray-200 rounded-xl shadow-sm
        hover:shadow-lg p-4 sm:p-5 flex items-start gap-4
        overflow-hidden transition-all duration-300
        border-l-4 ${BORDER_COLORS[borderColor]}
      `}
    >
      {/* Icon */}
      <div
        className={`
          p-3 rounded-xl flex items-center justify-center flex-shrink-0
          ${ICON_BG_COLORS[borderColor]} ${ICON_COLORS[borderColor]}
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1 truncate">
          {title}
        </p>
        <div className="flex items-end flex-wrap gap-2">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#263978]">
            {value ?? "N/A"}
          </h3>
          {getTrendIcon()}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
