/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge, Select, Input, Button, Tag, Tooltip, Collapse } from "antd";
import { FiPlus, FiFilter } from "react-icons/fi";
import axiosInstance from "@/lib/axios";
import { CallsTable } from "../aa/CallsTable";
import { FilterDropdown } from "../aa/FilterDropdown";
import { Pagination } from "../aa/Pagination";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import { useAppSelector } from "@/redux/store";

interface CustomFilter {
  key: string;
  value: string;
}

interface CallsListTabProps {
  selectedId: string;
  stats: any;
  API_BASE_URL: string;
  API_KEY: string;
}

const CallsListTab: React.FC<CallsListTabProps> = ({
  selectedId,
  stats,
  API_BASE_URL,
  API_KEY
}) => {
  const { selectedRoom, appendRoomParam } = useRoomAPI();
  const [callsTab, setCallsTab] = useState<string>("answered");
  const [allOrders, setAllOrders] = useState<any>([]);
  const [pagination, setPagination] = useState<any>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 1,
  });
  const [currOutcomeEdit, setCurrOutcomeEdit] = useState<any>(null);
  const [outcomeLoading, setOutcomeLoading] = useState<boolean>(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [filterQuery, setFilterQuery] = useState<string[]>([]);

  const [searchPhone, setSearchPhone] = useState<string>("");

  // Custom filter states
  const [availableFilterKeys, setAvailableFilterKeys] = useState<string[]>([]);
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [pendingFilterKey, setPendingFilterKey] = useState<string>("");
  const [pendingFilterValue, setPendingFilterValue] = useState<string>("");
  const [showCustomFilters, setShowCustomFilters] = useState(false);
  const [filterKeysLoading, setFilterKeysLoading] = useState(false);

  const { user } = useAppSelector((state) => state.auth);

  // Filter categories based on user email domain
  const isWordWorksUser = user?.username?.includes('@wordworksai.com');

  // Fetch available filter keys from /flatten API
  useEffect(() => {
    const fetchFilterKeys = async () => {
      setFilterKeysLoading(true);
      try {
        const res = await axiosInstance.get(
          appendRoomParam(`${API_BASE_URL}/flatten?api_key=${API_KEY}`)
        );

        if (res.data.status === "success" && res.data.keys) {
          // Filter keys to only include user_info and model_data, remove "data." prefix
          const processedKeys = res.data.keys
            .filter((key: string) => key.startsWith("data."))
            .map((key: string) => key.replace("data.", ""))
            .filter((key: string) => key.startsWith("user_info.") || key.startsWith("model_data."));

          setAvailableFilterKeys(processedKeys);
        }
      } catch (error) {
        console.error("Error fetching filter keys:", error);
      } finally {
        setFilterKeysLoading(false);
      }
    };

    fetchFilterKeys();
  }, [selectedRoom]);

  // Add a custom filter
  const addCustomFilter = () => {
    if (pendingFilterKey && pendingFilterValue.trim()) {
      setCustomFilters([...customFilters, { key: pendingFilterKey, value: pendingFilterValue.trim() }]);
      setPendingFilterKey("");
      setPendingFilterValue("");
    }
  };

  // Remove a custom filter
  const removeCustomFilter = (index: number) => {
    setCustomFilters(customFilters.filter((_, i) => i !== index));
  };

  // Clear all custom filters
  const clearAllCustomFilters = () => {
    setCustomFilters([]);
  };

  // Build custom_filter JSON string for API
  const buildCustomFilterParam = (): string | undefined => {
    if (customFilters.length === 0) return undefined;

    const filterObj: Record<string, string> = {};
    customFilters.forEach(filter => {
      filterObj[filter.key] = filter.value;
    });

    return JSON.stringify(filterObj);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      getCalls({ ...pagination, page: 1 });
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchPhone]);

  // Updated getCalls function to use the unified API endpoint
  const getCalls = async (paginationParams: any) => {
    try {
      setTableLoading(true);

      // Map the callsTab to the API's call_type parameter
      const callType = callsTab === "answered" ? "answered" :
                      callsTab === "not-answered" ? "not_answered" : "all";

      // Prepare filter key - use "all" if no filters selected or if it's not-answered/all tab
      const filterKey = callsTab === "answered" && filterQuery.length > 0
        ? filterQuery.join("-")
        : "all";

      // Build query parameters
      const params: any = {
        api_key: API_KEY,
        call_type: callType,
        filter_key: filterKey,
        page: paginationParams.page,
        limit: paginationParams.limit,
      };

      // Add search parameter if phone number is provided
      if (searchPhone.trim()) {
        params.search = searchPhone.trim();
      }

      // Add custom_filter parameter if custom filters are set
      const customFilterParam = buildCustomFilterParam();
      if (customFilterParam) {
        params.custom_filter = customFilterParam;
      }

      // Make the API call to the unified endpoint
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/dashboard/calls/${selectedId}`),
        { params }
      );

      const response = res.data;
      if (response.status === "success") {
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          totalPages: response.data.pagination.totalPages,
          totalResults: response.data.pagination.totalResults,
        });
        setAllOrders(response.data.results);
      }
      setTableLoading(false);
    } catch (error) {
      console.error("Error fetching calls:", error);
      setTableLoading(false);
    }
  };

  const saveOutcome = async (newData: any) => {
    try {
      if (!newData) {
        alert("No data found");
        return;
      }
      setOutcomeLoading(true);
      const sessionId = newData?.session_id;
      const outcome = newData?.model_data?.outcome;
      await axiosInstance.put(
        appendRoomParam(`${API_BASE_URL}/sessions/${sessionId}/outcome`),
        null,
        {
          params: { outcome },
        }
      );

      setAllOrders((prev: any) => {
        return prev.map((order: any) => {
          if (order.session_id === sessionId) {
            return {
              ...order,
              model_data: {
                ...order.model_data,
                outcome: outcome,
              },
            };
          }
          return order;
        });
      });
      
      setCurrOutcomeEdit(null);
      setOutcomeLoading(false);
      return "OK";
    } catch {
      setCurrOutcomeEdit(null);
      setOutcomeLoading(false);
      return "ERROR";
    }
  };

  const exportData = async (format: 'csv' | 'xlsx') => {
    try {
      setExportLoading(true);
      setShowExportDropdown(false);

      // Map the callsTab to the API's call_type parameter
      const callType = callsTab === "answered" ? "answered" :
                      callsTab === "not-answered" ? "not_answered" : "all";

      // Prepare filter key - use "all" if no filters selected or if it's not-answered/all tab
      const filterKey = callsTab === "answered" && filterQuery.length > 0
        ? filterQuery.join("-")
        : "all";

      // Build query parameters for export
      const params: any = {
        execution_id: selectedId,
        api_key: API_KEY,
        call_type: callType,
        filter_key: filterKey,
        format: format,
        sort_by: "created_at",
        sort_order: -1,
        recording_api: "vb-cipla.wordworksai.me"
      };

      // Add search parameter if phone number is provided
      if (searchPhone.trim()) {
        params.search = searchPhone.trim();
      }

      // Add custom_filter parameter if custom filters are set
      const customFilterParam = buildCustomFilterParam();
      if (customFilterParam) {
        params.custom_filter = customFilterParam;
      }

      // Make the export API call
      const response = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/export/sessions`),
        {
          params,
          responseType: 'blob'
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with current date and filters
      const date = new Date().toISOString().split('T')[0];
      const filterSuffix = callsTab !== 'all' ? `_${callsTab}` : '';
      const searchSuffix = searchPhone ? `_${searchPhone}` : '';
      link.download = `calls_export_${date}${filterSuffix}${searchSuffix}.${format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportLoading(false);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error exporting data. Please try again.");
      setExportLoading(false);
    }
  };

  const onPaginationChange = (paginationParams: any) => {
    getCalls(paginationParams);
  };

  const refreshCalls = () => {
    getCalls(pagination);
  };

  useEffect(() => {
    if (selectedId) {
      getCalls({ ...pagination, page: 1 });
    }
  }, [selectedId, callsTab, filterQuery, selectedRoom, customFilters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportDropdown]);

  return (
    <div className="space-y-4">
      {/* Calls Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden"
      >
        {/* Table Controls */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          {/* Tab Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-0">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm shadow-sm ${
                  callsTab === "all"
                    ? "bg-[#263978] text-white shadow-md"
                    : "bg-white hover:bg-gray-50 border border-gray-300 hover:border-[#263978] text-[#263978]"
                }`}
                onClick={() => setCallsTab("all")}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <span>All</span>
                  <Badge 
                    count={stats.call_distribution.total_calls || 0} 
                    color={callsTab === "all" ? "#ffffff" : "#52c41a"}
                    size="small"
                    overflowCount={9999999}
                    style={{ 
                      backgroundColor: callsTab === "all" ? "rgba(255,255,255,0.2)" : "#52c41a",
                      color: callsTab === "all" ? "#263978" : "#ffffff"
                    }}
                  />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm shadow-sm ${
                  callsTab === "answered"
                    ? "bg-[#263978] text-white shadow-md"
                    : "bg-white hover:bg-gray-50 border border-gray-300 hover:border-[#263978] text-[#263978]"
                }`}
                onClick={() => setCallsTab("answered")}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <span>Answered</span>
                  <Badge 
                  count={stats.call_distribution.answered_calls || 0} 
                  color={callsTab === "answered" ? "#ffffff" : "#1890ff"}
                  size="small"
                  overflowCount={9999999}
                  style={{ 
                    backgroundColor: callsTab === "answered" ? "rgba(255,255,255,0.2)" : "#1890ff",
                    color: callsTab === "answered" ? "#263978" : "#ffffff"
                  }}
                  />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm shadow-sm ${
                  callsTab === "not-answered"
                    ? "bg-[#263978] text-white shadow-md"
                    : "bg-white hover:bg-gray-50 border border-gray-300 hover:border-[#263978] text-[#263978]"
                }`}
                onClick={() => setCallsTab("not-answered")}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <span>Not Answered</span>
                  <Badge 
                    count={(stats.call_distribution.total_calls - stats.call_distribution.answered_calls) || 0} 
                    color={callsTab === "not-answered" ? "#ffffff" : "#ff4d4f"}
                    size="small"
                    overflowCount={9999999}
                    style={{ 
                      backgroundColor: callsTab === "not-answered" ? "rgba(255,255,255,0.2)" : "#ff4d4f",
                      color: callsTab === "not-answered" ? "#263978" : "#ffffff"
                    }}
                  />
                </div>
              </motion.button>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:ml-auto">
              
              {callsTab === "answered" && (
                <div className="w-full sm:w-auto">
                  <FilterDropdown
                    filterQuery={filterQuery}
                    setFilterQuery={setFilterQuery}
                  />
                </div>
              )}

              {/* Export Dropdown */}
              {isWordWorksUser && (
                <div className="relative export-dropdown-container">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm w-full sm:w-auto transition-colors shadow-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Export</span>
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`}>
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </motion.button>

                {isWordWorksUser && showExportDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => exportData('csv')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        Export as CSV
                      </button>
                      <button
                        onClick={() => exportData('xlsx')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 000 2h1a1 1 0 100-2H7zM7 7a1 1 0 000 2h6a1 1 0 100-2H7zm6 6a1 1 0 100-2h-1a1 1 0 100 2h1z" clipRule="evenodd" />
                        </svg>
                        Export as Excel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-2 bg-[#263978] hover:bg-[#1e2a5a] text-white rounded-lg text-xs sm:text-sm w-full sm:w-auto transition-colors shadow-sm font-medium"
                onClick={refreshCalls}
              >
                Refresh
              </motion.button>
            </div>
          </div>
        </div>

        {/* Search by phone number */}
        {isWordWorksUser && (
          <div className="w-full sm:w-auto flex-1 p-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by phone number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-shadow shadow-sm bg-white placeholder-gray-400"
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              maxLength={15}
              inputMode="tel"
              autoComplete="tel"
            />
            {searchPhone && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#263978] focus:outline-none"
                onClick={() => setSearchPhone("")}
                aria-label="Clear search"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l8 8M14 6l-8 8"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        )}

        {/* Custom Filters Section */}
        {isWordWorksUser && (
          <div className="px-4 pb-4 border-b border-gray-200">
            <Collapse
              ghost
              activeKey={showCustomFilters ? ['1'] : []}
              onChange={() => setShowCustomFilters(!showCustomFilters)}
              items={[
                {
                  key: '1',
                  label: (
                    <div className="flex items-center gap-2 text-sm font-medium text-[#263978]">
                      <FiFilter size={16} />
                      <span>Custom Filters</span>
                      {customFilters.length > 0 && (
                        <Badge count={customFilters.length} size="small" style={{ backgroundColor: '#263978' }} />
                      )}
                    </div>
                  ),
                  children: (
                    <div className="space-y-4">
                      {/* Add Filter Row */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Filter Key</label>
                          <Select
                            showSearch
                            placeholder="Select a filter key"
                            value={pendingFilterKey || undefined}
                            onChange={setPendingFilterKey}
                            loading={filterKeysLoading}
                            className="w-full"
                            size="middle"
                            optionFilterProp="label"
                            filterOption={(input, option) =>
                              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                            options={availableFilterKeys.map(key => ({
                              value: key,
                              label: key,
                            }))}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                          <Input
                            placeholder="Enter filter value"
                            value={pendingFilterValue}
                            onChange={e => setPendingFilterValue(e.target.value)}
                            onPressEnter={addCustomFilter}
                            size="middle"
                          />
                        </div>
                        <Button
                          type="primary"
                          icon={<FiPlus size={16} />}
                          onClick={addCustomFilter}
                          disabled={!pendingFilterKey || !pendingFilterValue.trim()}
                          style={{ backgroundColor: '#263978' }}
                          className="flex items-center gap-1"
                        >
                          Add
                        </Button>
                      </div>

                      {/* Active Filters */}
                      {customFilters.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">Active Filters:</span>
                            <Button
                              type="link"
                              size="small"
                              danger
                              onClick={clearAllCustomFilters}
                              className="text-xs p-0 h-auto"
                            >
                              Clear All
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {customFilters.map((filter, index) => (
                              <Tooltip
                                key={index}
                                title={`${filter.key}: ${filter.value}`}
                              >
                                <Tag
                                  closable
                                  onClose={() => removeCustomFilter(index)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs"
                                  style={{ backgroundColor: '#f0f5ff', borderColor: '#263978', color: '#263978' }}
                                >
                                  <span className="font-medium max-w-[100px] truncate">{filter.key.split('.').pop()}</span>
                                  <span className="text-gray-400">=</span>
                                  <span className="max-w-[80px] truncate">{filter.value}</span>
                                </Tag>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Helper Text */}
                      <div className="text-xs text-gray-500">
                        <p>Examples: <code className="bg-gray-100 px-1 rounded">model_data.language_detected</code> = <code className="bg-gray-100 px-1 rounded">Hindi</code></p>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* Table Container */}
        <div className="p-3 sm:p-6 bg-white">
          <div className="overflow-x-auto">
            <CallsTable 
              allOrders={allOrders}
              tableLoading={tableLoading}
              currOutcomeEdit={currOutcomeEdit}
              setCurrOutcomeEdit={setCurrOutcomeEdit}
              outcomeLoading={outcomeLoading}
              saveOutcome={saveOutcome}
              setOutcomeLoading={setOutcomeLoading}
              callsTab={callsTab}
            />
          </div>
          
          {/* Pagination */}
          <div className="mt-4 sm:mt-6">
            <Pagination 
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              allOrders={allOrders}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CallsListTab;