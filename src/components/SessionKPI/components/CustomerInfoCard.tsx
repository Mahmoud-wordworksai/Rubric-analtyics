"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiUser, FiPhone, FiFileText, FiFolder, FiTag, FiHash, FiGlobe } from "react-icons/fi";
import { CustomerInfo, SessionIdentification } from "../types";
import { formatPhoneNumber, capitalizeWords } from "../utils";

interface CustomerInfoCardProps {
  customerInfo: CustomerInfo;
  sessionIdentification: SessionIdentification;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
    <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-800 font-medium truncate">
        {value || "N/A"}
      </p>
    </div>
  </div>
);

const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  customerInfo,
  sessionIdentification,
}) => {
  // Get campaign details from nested object or flat fields for backward compatibility
  const allocation = customerInfo.campaign_details?.allocation || customerInfo.allocation;
  const campaignName = customerInfo.campaign_details?.campaign_name || customerInfo.campaign_name;
  const sourceFile = customerInfo.campaign_details?.source_file || customerInfo.file_name;
  const allocationDate = customerInfo.campaign_details?.allocation_date;

  // Get mobile number from either field
  const mobileNumber = customerInfo.mobile_number || customerInfo.mobile_no;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-blue-100">
          <FiUser className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
          Customer Information
        </h3>
      </div>

      <div className="space-y-1">
        <InfoRow
          icon={<FiUser className="w-4 h-4" />}
          label="Customer Name"
          value={capitalizeWords(customerInfo.customer_name || "")}
        />

        <InfoRow
          icon={<FiPhone className="w-4 h-4" />}
          label="Phone Number"
          value={formatPhoneNumber(mobileNumber || sessionIdentification.phone_number)}
        />

        {customerInfo.loan_account_number && (
          <InfoRow
            icon={<FiHash className="w-4 h-4" />}
            label="Loan Account Number"
            value={customerInfo.loan_account_number}
          />
        )}

        {customerInfo.language_preference && (
          <InfoRow
            icon={<FiGlobe className="w-4 h-4" />}
            label="Language Preference"
            value={customerInfo.language_preference}
          />
        )}

        {allocation && (
          <InfoRow
            icon={<FiFolder className="w-4 h-4" />}
            label="Allocation"
            value={allocation}
          />
        )}

        {campaignName && (
          <InfoRow
            icon={<FiTag className="w-4 h-4" />}
            label="Campaign"
            value={campaignName}
          />
        )}

        {sourceFile && (
          <InfoRow
            icon={<FiFileText className="w-4 h-4" />}
            label="Source File"
            value={sourceFile}
          />
        )}

        {allocationDate && (
          <InfoRow
            icon={<FiTag className="w-4 h-4" />}
            label="Allocation Date"
            value={allocationDate}
          />
        )}
      </div>

      {/* Session IDs */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
          Session Details
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Session ID</span>
            <span className="text-gray-700 font-mono truncate max-w-[180px]">
              {sessionIdentification.session_id}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Execution ID</span>
            <span className="text-gray-700 font-mono truncate max-w-[180px]">
              {sessionIdentification.execution_id}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerInfoCard;
