/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Pagination as AntPagination, Select } from "antd";
import { motion } from "framer-motion";

interface PaginationProps {
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
  onPaginationChange: (pagination: any) => void;
  allOrders: any[];
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPaginationChange}) => {
  // Calculate range for "Showing X to Y of Z entries"
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.totalResults
  );

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
      <div className="text-sm text-gray-600 backdrop-blur-sm bg-white/30 px-4 py-2 rounded-lg">
        {`Showing ${startItem} to ${endItem} of ${pagination.totalResults} entries`}
      </div>
      
      <div className="flex items-center gap-4">
        <AntPagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.totalResults}
          onChange={(page) => {
            onPaginationChange({
              ...pagination,
              page,
            });
          }}
          showSizeChanger={false}
          className="backdrop-blur-sm bg-white/30 rounded-lg px-2"
        />
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="backdrop-blur-sm bg-white/30 rounded-lg"
        >
          <Select
            defaultValue={pagination.limit}
            onChange={(value) => {
              onPaginationChange({
                ...pagination,
                page: 1,
                limit: Number(value),
              });
            }}
            className="w-32"
            dropdownClassName="backdrop-blur-md bg-white/95"
          >
            <Select.Option value={10}>10 / page</Select.Option>
            <Select.Option value={20}>20 / page</Select.Option>
            <Select.Option value={50}>50 / page</Select.Option>
          </Select>
        </motion.div>
      </div>
    </div>
  );
};