/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Badge, Collapse } from "antd";
import { 
  GlobalOutlined, 
  SettingOutlined, 
  CheckCircleOutlined,
  SoundOutlined,
  AudioOutlined,
  RobotOutlined,
  CodeOutlined
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Panel } = Collapse;

interface CallDetailsProps {
  currOrder: any;
}

export const CallDetails: React.FC<CallDetailsProps> = ({ currOrder }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "processing":
        return "processing";
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "paused":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="w-full">
      {/* Header Section - Mobile First */}
      <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        
        {/* Status Info - Stack on mobile, row on larger screens */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-6 lg:space-x-8">
          
          {/* Country Info */}
          <div className="flex items-center min-w-0 flex-1">
            <GlobalOutlined className="text-blue-600 mr-2 text-sm sm:text-base flex-shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold mr-2 flex-shrink-0">Country:</h2>
            <span className="font-normal text-gray-700 text-sm sm:text-base truncate">
              {currOrder?.country || "N/A"}
            </span>
          </div>
          
          {/* Status Info */}
          <div className="flex items-center min-w-0 flex-1">
            <SettingOutlined className="text-blue-600 mr-2 text-sm sm:text-base flex-shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold mr-2 flex-shrink-0">Status:</h2>
            <Badge
              status={getStatusColor(currOrder?.status)}
              text={
                <span className="text-xs sm:text-sm font-medium">
                  {currOrder?.status?.toUpperCase() || "UNKNOWN"}
                </span>
              }
            />
          </div>
        </div>
        
        {/* Toggle Button - Full width on mobile, auto on larger screens */}
        <div className="flex justify-center sm:justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setExpanded(!expanded)}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 backdrop-blur-sm bg-white/50 text-blue-600 rounded-lg border border-blue-200 text-sm font-medium hover:bg-white/70 transition-all shadow-sm"
          >
            {expanded ? "Hide Details" : "Show Details"}
          </motion.button>
        </div>
      </div>
      
      {/* Expanded Details Section */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Detail Items Grid - Mobile first responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <DetailItem 
              icon={<CheckCircleOutlined className="text-green-600" />}
              label="Answered Calls"
              value={currOrder?.no_of_answered_calls || 0}
            />
            
            <DetailItem 
              icon={<RobotOutlined className="text-purple-600" />}
              label="Provider"
              value={currOrder?.provider || "N/A"}
            />
            
            <DetailItem 
              icon={<SoundOutlined className="text-orange-600" />}
              label="STT Service"
              value={currOrder?.stt_service || "N/A"}
            />
            
            <DetailItem 
              icon={<AudioOutlined className="text-blue-600" />}
              label="TTS Service"
              value={currOrder?.tts_service || "N/A"}
            />
          </div>
          
          {/* System Prompt Section - Full width */}
          <div className="w-full">
            <Collapse 
              ghost 
              className="bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm"
              size="small"
            >
              <Panel 
                header={
                  <div className="flex items-center">
                    <CodeOutlined className="text-indigo-600 mr-2 text-sm sm:text-base" />
                    <span className="font-medium text-sm sm:text-base">System Prompt</span>
                  </div>
                } 
                key="1"
                className="text-sm sm:text-base"
              >
                <div className="p-2 sm:p-3 bg-white/70 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">
                    {currOrder?.system_prompt || "No system prompt available"}
                  </p>
                </div>
              </Panel>
            </Collapse>
          </div>
        </motion.div>
      )}
    </div>
  );
};

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center p-3 sm:p-4 backdrop-blur-sm bg-white/50 rounded-lg border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow min-w-0">
      <div className="mr-3 flex-shrink-0">
        <div className="text-base sm:text-lg">
          {icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">{label}</p>
        <p className="text-sm sm:text-base font-medium text-gray-800 break-words">
          {value}
        </p>
      </div>
    </div>
  );
};