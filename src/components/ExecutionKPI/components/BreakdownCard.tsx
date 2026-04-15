"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTag, FiFolder, FiChevronDown, FiChevronUp, FiList } from "react-icons/fi";
import { DetailedBreakdowns } from "../types";
import { formatDuration } from "../utils";

interface BreakdownCardProps {
  breakdowns: DetailedBreakdowns;
}

const BreakdownCard: React.FC<BreakdownCardProps> = ({ breakdowns }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("campaign");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const campaignData = breakdowns.campaign_distribution || [];
  const dispositionData = breakdowns.disposition_distribution || [];

  if (campaignData.length === 0 && dispositionData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-indigo-100">
          <FiList className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Detailed Breakdowns
        </h3>
      </div>

      {/* Campaign Distribution */}
      {campaignData.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection("campaign")}
            className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FiTag className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">
                Campaign Distribution
              </span>
              <span className="px-2 py-0.5 bg-purple-200 text-purple-700 text-xs rounded-full">
                {campaignData.length}
              </span>
            </div>
            {expandedSection === "campaign" ? (
              <FiChevronUp className="w-4 h-4 text-purple-600" />
            ) : (
              <FiChevronDown className="w-4 h-4 text-purple-600" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === "campaign" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                        <th className="pb-2 pr-4 font-medium">Campaign</th>
                        <th className="pb-2 px-2 font-medium text-center">Calls</th>
                        <th className="pb-2 px-2 font-medium text-center">Connected</th>
                        <th className="pb-2 px-2 font-medium text-center">Rate</th>
                        <th className="pb-2 pl-2 font-medium text-center">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignData.map((item) => (
                        <tr
                          key={item.campaign}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="py-2 pr-4">
                            <span className="font-medium text-gray-800 truncate block max-w-[150px]">
                              {item.campaign || "N/A"}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center text-gray-700">
                            {item.total_calls.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center text-green-600 font-medium">
                            {item.connected_calls.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {item.connection_rate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 pl-2 text-center text-gray-600">
                            {formatDuration(item.total_duration)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Disposition Distribution */}
      {dispositionData.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection("disposition")}
            className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FiFolder className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">
                Disposition Distribution
              </span>
              <span className="px-2 py-0.5 bg-orange-200 text-orange-700 text-xs rounded-full">
                {dispositionData.length}
              </span>
            </div>
            {expandedSection === "disposition" ? (
              <FiChevronUp className="w-4 h-4 text-orange-600" />
            ) : (
              <FiChevronDown className="w-4 h-4 text-orange-600" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === "disposition" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                        <th className="pb-2 pr-4 font-medium">Disposition</th>
                        <th className="pb-2 px-2 font-medium text-center">Count</th>
                        <th className="pb-2 pl-2 font-medium text-center">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispositionData.map((item) => (
                        <tr
                          key={item.disposition}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="py-2 pr-4">
                            <span className="font-medium text-gray-800">
                              {item.disposition || "None"}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center text-gray-700 font-medium">
                            {item.count.toLocaleString()}
                          </td>
                          <td className="py-2 pl-2 text-center text-gray-600">
                            {item.total_amount > 0
                              ? `₹${item.total_amount.toLocaleString("en-IN")}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default BreakdownCard;
