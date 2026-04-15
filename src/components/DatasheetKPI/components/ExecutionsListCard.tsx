"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spin, Pagination, Empty, Tooltip } from "antd";
import {
  FiList,
  FiPhone,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiLayers,
} from "react-icons/fi";
import { ExecutionListItem, Pagination as PaginationType } from "../types";
import { getDatasheetExecutions } from "../api";
import {
  formatDateTime,
  getExecutionStatusColor,
  STATUS_COLORS,
  parsePercentage,
} from "../utils";

interface ExecutionsListCardProps {
  datasheetId: string;
  appendRoomParam: (url: string) => string;
  onExecutionClick?: (executionId: string) => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = getExecutionStatusColor(status);
  const colors = STATUS_COLORS[color];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
};

const ExecutionsListCard: React.FC<ExecutionsListCardProps> = ({
  datasheetId,
  appendRoomParam,
  onExecutionClick,
}) => {
  const [loading, setLoading] = useState(false);
  const [executions, setExecutions] = useState<ExecutionListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDatasheetExecutions({
        datasheet_id: datasheetId,
        appendRoomParam,
        page: currentPage,
        limit: pageSize,
      });
      setExecutions(response.executions);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching executions:", error);
    } finally {
      setLoading(false);
    }
  }, [datasheetId, appendRoomParam, currentPage, pageSize]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  const toggleExecution = (executionId: string) => {
    setExpandedExecution(expandedExecution === executionId ? null : executionId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-100">
            <FiList className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
            Executions
          </h3>
          {pagination && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {pagination.total.toLocaleString()} total
            </span>
          )}
        </div>
      </div>

      {/* Executions List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spin size="default" />
        </div>
      ) : executions.length === 0 ? (
        <Empty description="No executions found" />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {executions.map((execution, index) => {
              const connectionRate = parsePercentage(
                execution.kpi_summary?.connection_rate || "0%"
              );

              return (
                <motion.div
                  key={execution.execution_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border border-gray-100 rounded-lg overflow-hidden"
                >
                  {/* Execution Row */}
                  <div
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleExecution(execution.execution_id)}
                  >
                    <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                      {/* Execution Name */}
                      <div className="flex items-center gap-2">
                        <FiLayers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {execution.execution_id || "Unnamed Execution"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center">
                        <StatusBadge status={execution.status} />
                      </div>

                      {/* Sessions */}
                      <div className="flex items-center gap-2">
                        <FiPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">
                          {execution.kpi_summary?.total_sessions?.toLocaleString() || 0} sessions
                        </span>
                      </div>

                      {/* Connection Rate */}
                      <div className="hidden lg:flex items-center gap-2">
                        <span className="text-sm text-green-600 font-medium">
                          {connectionRate.toFixed(1)}% connected
                        </span>
                      </div>

                      {/* Created At */}
                      <div className="hidden lg:flex items-center gap-2">
                        <FiClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">
                          {formatDateTime(execution.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Expand/Actions */}
                    <div className="flex items-center gap-2">
                      {onExecutionClick && (
                        <Tooltip title="View Details">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExecutionClick(execution.execution_id);
                            }}
                            className="p-1.5 hover:bg-white rounded transition-colors"
                          >
                            <FiExternalLink className="w-4 h-4 text-[#263978]" />
                          </button>
                        </Tooltip>
                      )}
                      {expandedExecution === execution.execution_id ? (
                        <FiChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FiChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedExecution === execution.execution_id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-white border-t border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">
                                Total Sessions
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {execution.kpi_summary?.total_sessions?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">
                                Connected Calls
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {execution.kpi_summary?.connected_calls?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">
                                Total Amount
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {execution.kpi_summary?.total_amount || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">
                                Total Duration
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {execution.kpi_summary?.total_duration || "N/A"}
                              </p>
                            </div>
                          </div>

                          {execution.datasheet_info && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 uppercase mb-1">
                                Datasheet
                              </p>
                              <p className="text-sm text-gray-700">
                                {execution.datasheet_info.datasheet_name}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={pagination.total}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={["10", "20", "50"]}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} executions`
            }
          />
        </div>
      )}
    </motion.div>
  );
};

export default ExecutionsListCard;
