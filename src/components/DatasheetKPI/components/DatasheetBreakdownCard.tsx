"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Table, Input, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiDatabase, FiSearch, FiChevronDown, FiChevronRight, FiPlay } from "react-icons/fi";
import { DatasheetBreakdownItem, ExecutionBreakdownItem } from "../types";

interface DatasheetBreakdownCardProps {
  datasheets: DatasheetBreakdownItem[];
  executions?: ExecutionBreakdownItem[];
  onDatasheetClick?: (datasheetId: string) => void;
  onExecutionClick?: (executionId: string) => void;
}

// Helper to format connection rate
const formatRate = (rate: number | string): string => {
  if (typeof rate === "string") return rate;
  return `${rate.toFixed(2)}%`;
};

// Helper to get rate color
const getRateColor = (rate: number | string): string => {
  const numRate = typeof rate === "string" ? parseFloat(rate) : rate;
  if (numRate >= 50) return "green";
  if (numRate >= 30) return "orange";
  return "red";
};

const DatasheetBreakdownCard: React.FC<DatasheetBreakdownCardProps> = ({
  datasheets,
  executions = [],
  onDatasheetClick,
  onExecutionClick,
}) => {
  const [searchText, setSearchText] = useState("");
  const [expandedDatasheets, setExpandedDatasheets] = useState<string[]>([]);

  // Group executions by datasheet_id
  const executionsByDatasheet = useMemo(() => {
    const map: Record<string, ExecutionBreakdownItem[]> = {};
    executions.forEach((exec) => {
      if (exec.datasheet_id) {
        if (!map[exec.datasheet_id]) {
          map[exec.datasheet_id] = [];
        }
        map[exec.datasheet_id].push(exec);
      }
    });
    return map;
  }, [executions]);

  const filteredDatasheets = datasheets.filter(
    (ds) =>
      ds.filename.toLowerCase().includes(searchText.toLowerCase()) ||
      ds.datasheet_id.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleExpand = (datasheetId: string) => {
    setExpandedDatasheets((prev) =>
      prev.includes(datasheetId)
        ? prev.filter((id) => id !== datasheetId)
        : [...prev, datasheetId]
    );
  };

  const executionColumns: ColumnsType<ExecutionBreakdownItem> = [
    {
      title: "Execution",
      key: "execution",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <FiPlay className="text-blue-500 w-3 h-3" />
          <span
            className={onExecutionClick ? "text-blue-600 cursor-pointer hover:underline text-xs" : "text-xs"}
            onClick={() => onExecutionClick?.(record.execution_id)}
          >
            {record.execution_name || (record.execution_id ? `${record.execution_id.slice(0, 8)}...` : "-")}
          </span>
        </div>
      ),
    },
    {
      title: "Sessions",
      dataIndex: "total_sessions",
      key: "total_sessions",
      width: 80,
      align: "center" as const,
      render: (value: number) => <span className="text-xs">{(value ?? 0).toLocaleString()}</span>,
    },
    {
      title: "Connected",
      dataIndex: "connected_calls",
      key: "connected_calls",
      width: 80,
      align: "center" as const,
      render: (value: number) => <span className="text-xs">{(value ?? 0).toLocaleString()}</span>,
    },
    {
      title: "Rate",
      dataIndex: "connection_rate",
      key: "connection_rate",
      width: 70,
      align: "center" as const,
      render: (value: number | string) => (
        <Tag color={getRateColor(value ?? 0)} className="text-xs">
          {formatRate(value ?? 0)}
        </Tag>
      ),
    },
    {
      title: "Duration",
      dataIndex: "total_duration",
      key: "total_duration",
      width: 80,
      align: "center" as const,
      render: (value: string) => <span className="text-xs">{value || "-"}</span>,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <FiDatabase className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#263978]">
              Datasheet Breakdown
            </h3>
            <p className="text-xs text-gray-500">
              {datasheets.length} datasheets • {executions.length} executions
            </p>
          </div>
        </div>

        <Input
          placeholder="Search datasheets..."
          prefix={<FiSearch className="text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-64"
          allowClear
        />
      </div>

      {/* Datasheets with nested executions */}
      <div className="space-y-3">
        {filteredDatasheets.map((datasheet) => {
          const isExpanded = expandedDatasheets.includes(datasheet.datasheet_id);
          const relatedExecutions = executionsByDatasheet[datasheet.datasheet_id] || [];
          const hasExecutions = relatedExecutions.length > 0;

          return (
            <div
              key={datasheet.datasheet_id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Datasheet Header */}
              <div
                className={`bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                  hasExecutions ? "" : "cursor-default"
                }`}
                onClick={() => hasExecutions && toggleExpand(datasheet.datasheet_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {hasExecutions ? (
                      isExpanded ? (
                        <FiChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <FiChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                    <FiDatabase className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span
                      className={`font-medium text-sm truncate ${
                        onDatasheetClick ? "text-blue-600 hover:underline" : "text-gray-800"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDatasheetClick?.(datasheet.datasheet_id);
                      }}
                    >
                      {datasheet.filename}
                    </span>
                    {hasExecutions && (
                      <Tag color="blue" className="text-xs">
                        {relatedExecutions.length} execution{relatedExecutions.length > 1 ? "s" : ""}
                      </Tag>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-gray-500">Sessions</p>
                      <p className="font-semibold text-gray-800">
                        {(datasheet.total_sessions ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="text-gray-500">Connected</p>
                      <p className="font-semibold text-gray-800">
                        {(datasheet.connected_calls ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Rate</p>
                      <Tag color={getRateColor(datasheet.connection_rate ?? 0)} className="m-0">
                        {formatRate(datasheet.connection_rate ?? 0)}
                      </Tag>
                    </div>
                    <div className="text-center hidden lg:block">
                      <p className="text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-800">{datasheet.total_duration || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nested Executions */}
              {isExpanded && hasExecutions && (
                <div className="bg-white border-t border-gray-200">
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
                      <FiPlay className="w-3 h-3" />
                      Executions for this datasheet
                    </p>
                  </div>
                  <Table
                    columns={executionColumns}
                    dataSource={relatedExecutions}
                    rowKey="execution_id"
                    pagination={false}
                    size="small"
                    className="nested-execution-table"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredDatasheets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No datasheets found matching your search.
        </div>
      )}
    </motion.div>
  );
};

export default DatasheetBreakdownCard;
