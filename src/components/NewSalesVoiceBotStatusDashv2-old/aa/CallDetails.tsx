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
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6">
          <div className="flex items-center">
            <GlobalOutlined className="text-blue-600 mr-2" />
            <h2 className="text-base font-semibold mr-2">Country:</h2>
            <span className="font-normal text-gray-700">{currOrder?.country}</span>
          </div>
          
          <div className="flex items-center">
            <SettingOutlined className="text-blue-600 mr-2" />
            <h2 className="text-base font-semibold mr-2">Status:</h2>
            <Badge
              status={getStatusColor(currOrder?.status)}
              text={currOrder?.status?.toUpperCase()}
            />
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setExpanded(!expanded)}
          className="mt-2 md:mt-0 px-4 py-1.5 backdrop-blur-sm bg-white/50 text-blue-600 rounded-lg border border-blue-200 text-sm font-medium hover:bg-white/70 transition-all"
        >
          {expanded ? "Hide Details" : "Show Details"}
        </motion.button>
      </div>
      
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
        >
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
          
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Collapse 
              ghost 
              className="bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/50"
            >
              <Panel 
                header={
                  <div className="flex items-center">
                    <CodeOutlined className="text-indigo-600 mr-2" />
                    <span className="font-medium">System Prompt</span>
                  </div>
                } 
                key="1"
              >
                <p className="text-gray-700 whitespace-pre-wrap p-2 bg-white/70 rounded-lg">
                  {currOrder?.system_prompt || "No system prompt available"}
                </p>
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
    <div className="flex items-center p-3 backdrop-blur-sm bg-white/50 rounded-lg border border-gray-200/50">
      <div className="mr-3">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
};