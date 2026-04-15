"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spin, Pagination, Select, Empty, Tooltip } from "antd";
import {
  FiList,
  FiPhone,
  FiClock,
  FiUser,
  FiCheckCircle,
  FiCalendar,
  FiHash,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
} from "react-icons/fi";
import { SessionListItem, Pagination as PaginationType } from "../types";
import { getExecutionSessions } from "../api";
import {
  formatPhoneNumber,
  getCallStatusColor,
  STATUS_COLORS,
  capitalizeWords,
} from "../utils";

interface SessionsListCardProps {
  executionId: string;
  appendRoomParam: (url: string) => string;
  onSessionClick?: (sessionId: string) => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = getCallStatusColor(status);
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

const SessionsListCard: React.FC<SessionsListCardProps> = ({
  executionId,
  appendRoomParam,
  onSessionClick,
}) => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getExecutionSessions({
        execution_id: executionId,
        appendRoomParam,
        page: currentPage,
        limit: pageSize,
        call_status: statusFilter,
      });
      setSessions(response.sessions);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [executionId, appendRoomParam, currentPage, pageSize, statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value || undefined);
    setCurrentPage(1);
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
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
          <div className="p-2 rounded-lg bg-blue-100">
            <FiList className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
            Sessions
          </h3>
          {pagination && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {pagination.total.toLocaleString()} total
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select
            placeholder="Filter by status"
            allowClear
            onChange={handleStatusFilterChange}
            style={{ width: 150 }}
            options={[
              { value: "connected", label: "Connected" },
              { value: "no_answer", label: "No Answer" },
              { value: "busy", label: "Busy" },
              { value: "failed", label: "Failed" },
            ]}
          />
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spin size="default" />
        </div>
      ) : sessions.length === 0 ? (
        <Empty description="No sessions found" />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.div
                key={session.session_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border border-gray-100 rounded-lg overflow-hidden"
              >
                {/* Session Row */}
                <div
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => toggleSession(session.session_id)}
                >
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                    {/* Customer Name */}
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {capitalizeWords(session.customer_name) || "N/A"}
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <FiPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate">
                        {formatPhoneNumber(session.phone_number)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <StatusBadge status={session.call_result} />
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {session.duration}
                      </span>
                    </div>

                    {/* Attempt */}
                    <div className="hidden lg:flex items-center gap-2">
                      <FiHash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        Attempt {session.current_attempt}
                      </span>
                    </div>

                    {/* Payment Status */}
                    <div className="hidden lg:flex items-center gap-2">
                      {session.is_paid_current ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          <FiCheckCircle className="w-3 h-3" />
                          Paid
                        </span>
                      ) : session.has_ptp_current ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <FiCalendar className="w-3 h-3" />
                          PTP
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>

                  {/* Expand/Actions */}
                  <div className="flex items-center gap-2">
                    {onSessionClick && (
                      <Tooltip title="View Details">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionClick(session.session_id);
                          }}
                          className="p-1.5 hover:bg-white rounded transition-colors"
                        >
                          <FiExternalLink className="w-4 h-4 text-[#263978]" />
                        </button>
                      </Tooltip>
                    )}
                    {expandedSession === session.session_id ? (
                      <FiChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <FiChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedSession === session.session_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-white border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">
                              Bill Amount
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {session.bill_amount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">
                              Disposition
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {session.current_disposition || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">
                              Previous Attempts
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {session.previous_attempts}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">
                              Created At
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {session.created_at}
                            </p>
                          </div>
                        </div>

                        {session.call_summary && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 uppercase mb-1">
                              Call Summary
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {session.call_summary}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
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
              `${range[0]}-${range[1]} of ${total} sessions`
            }
          />
        </div>
      )}
    </motion.div>
  );
};

export default SessionsListCard;
