"use client";

import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  borderColor?: "green" | "orange" | "red" | "purple" | "blue" | "emerald" | "cyan";
}

const BORDER_COLORS = {
  green: "border-l-green-500",
  orange: "border-l-orange-500",
  red: "border-l-red-500",
  purple: "border-l-purple-500",
  blue: "border-l-blue-500",
  emerald: "border-l-emerald-500",
  cyan: "border-l-cyan-500",
};

const ICON_BG_COLORS = {
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  cyan: "bg-cyan-100 text-cyan-600",
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  borderColor = "blue",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white border border-gray-200 rounded-xl shadow-sm p-4
        border-l-4 ${BORDER_COLORS[borderColor]}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-[#263978] truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${ICON_BG_COLORS[borderColor]}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
