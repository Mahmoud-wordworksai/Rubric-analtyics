/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { motion } from "framer-motion";
import { Badge, Tag } from "antd";

interface CampaignInfoCardProps {
  currOrder: any;
}

const CampaignInfoCard: React.FC<CampaignInfoCardProps> = ({ currOrder }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-shadow duration-300"
    >
      {/* Campaign Info Grid - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Campaign Status</h2>
          <div className="flex items-center">
            <Badge 
              status={currOrder?.status === "processing" ? "processing" : "success"} 
              text={currOrder?.status?.toUpperCase()} 
              className="text-sm sm:text-base font-semibold"
            />
          </div>
        </div>
        
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Country</h2>
          <p className="text-sm sm:text-base font-semibold text-[#263978] truncate">{currOrder?.country}</p>
        </div>
        
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Calls</h2>
          <p className="text-sm sm:text-base font-semibold text-[#263978]">{currOrder?.no_of_answered_calls}</p>
        </div>
      </div>

      {/* Settings Section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Max Attempts</h2>
            <Tag color="orange">{currOrder?.max_attempts || '-'}</Tag>
          </div>

          <div>
            <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Time Gap (hours)</h2>
            <Tag color="cyan">{currOrder?.time_gap || '-'}</Tag>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Work Hours</h2>
            <Tag color="green">{currOrder?.work_hours_min || '0'} - {currOrder?.work_hours_max || '0'}</Tag>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Settings</h2>
            <div className="flex gap-2 flex-wrap">
              <Tag color={currOrder?.dnd_check ? "success" : "default"} className="text-xs">
                DND: {currOrder?.dnd_check ? "On" : "Off"}
              </Tag>
              <Tag color={currOrder?.is_email_sent ? "success" : "default"} className="text-xs">
                Email: {currOrder?.is_email_sent ? "On" : "Off"}
              </Tag>
              <Tag color={currOrder?.sms ? "success" : "default"} className="text-xs">
                SMS: {currOrder?.sms ? "On" : "Off"}
              </Tag>
            </div>
          </div>

          {currOrder?.is_email_sent && (
            <div>
              <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Email Type</h2>
              <Tag color="blue">{currOrder?.email_type || 'static'}</Tag>
            </div>
          )}
        </div>
      </div>
      
      {/* System Prompt */}
      {/* <div className="mt-4 pt-4 border-t border-gray-200">
        <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">System Prompt</h2>
        <div className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-lg max-h-80 overflow-y-auto">
          {currOrder?.system_prompt}
        </div>
      </div> */}
    </motion.div>
  );
};

export default CampaignInfoCard;