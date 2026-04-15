import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md bg-white/40 p-12 rounded-2xl shadow-xl border border-white/50 text-center"
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 text-gray-700 font-medium"
        >
          Loading Dashboard Data...
        </motion.p>
      </motion.div>
    </div>
  );
};

export const TableLoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
      <p className="ml-2 text-gray-600">Loading data...</p>
    </div>
  );
};