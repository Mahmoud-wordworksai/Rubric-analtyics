/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  percentage?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  iconColor,
  percentage,
  trend = 'neutral'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 8px 32px rgba(38, 57, 120, 0.15)",
        transition: { duration: 0.2 }
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg p-4 flex items-center gap-4 overflow-hidden transition-all duration-300"
    >
      <div className={`p-3 rounded-xl ${iconBgColor} ${iconColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1 truncate">{title}</p>
        <div className="flex items-end flex-wrap gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-[#263978]">{value ?? "0"}</h3>
          {/* {percentage && (
            <div className="flex items-center text-xs">
              {trend === 'up' && <span className="text-green-500 font-medium">↑ {percentage}%</span>}
              {trend === 'down' && <span className="text-red-500 font-medium">↓ {percentage}%</span>}
              {trend === 'neutral' && <span className="text-gray-500 font-medium">• {percentage}%</span>}
            </div>
          )} */}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;