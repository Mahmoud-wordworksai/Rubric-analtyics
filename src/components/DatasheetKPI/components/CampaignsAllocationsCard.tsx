"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiTag, FiFolder } from "react-icons/fi";

interface CampaignsAllocationsCardProps {
  campaigns: string[];
  allocations: string[];
}

const CampaignsAllocationsCard: React.FC<CampaignsAllocationsCardProps> = ({
  campaigns,
  allocations,
}) => {
  const hasCampaigns = campaigns && campaigns.length > 0;
  const hasAllocations = allocations && allocations.length > 0;

  if (!hasCampaigns && !hasAllocations) {
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
        <div className="p-2 rounded-lg bg-orange-100">
          <FiTag className="w-4 h-4 text-orange-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Campaigns & Allocations
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Campaigns */}
        {hasCampaigns && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FiTag className="w-4 h-4 text-orange-500" />
              <p className="text-sm font-medium text-gray-700">Campaigns</p>
              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                {campaigns.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {campaigns.map((campaign, index) => (
                <span
                  key={index}
                  className="inline-flex px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-lg border border-orange-200"
                >
                  {campaign}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allocations */}
        {hasAllocations && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FiFolder className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-medium text-gray-700">Allocations</p>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {allocations.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allocations.map((allocation, index) => (
                <span
                  key={index}
                  className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200"
                >
                  {allocation}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CampaignsAllocationsCard;
