/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, Fragment, useMemo, useCallback, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Badge, Skeleton, Tooltip, Empty, message, DatePicker, Select, Tag } from "antd";
import { ChevronRight, Eye, Play, Square, Plus, RefreshCcw, Search, Calendar, FilterIcon, X } from "lucide-react";
import { SecondLoader } from "@/layout/MainLoader";
import SalesBotStatusDash from '@/components/NewSalesVoiceBotStatusDashv2/SalesBotStatusDash';;
import { SalesBotCallData } from "@/types";
import withProtection from "@/hoc/ProtectRoute";
import debounce from 'lodash/debounce';
import { Pagination } from "@/components/NewSalesVoiceBotStatusDashv2/aa/Pagination";
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import { useAppSelector } from "@/redux/store";

const { RangePicker } = DatePicker;
const { Option } = Select;

// Status options for filter
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "orange" },
  { value: "processing", label: "Processing", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "stopped", label: "Stopped", color: "yellow" }
];

const TAG_OPTIONS = [
  { value: "test", label: "Test", color: "orange" },
  { value: "production", label: "Production", color: "blue" },
];

const TAG_OPTIONS_1 = [
  { value: "production", label: "Production", color: "blue" },
];

const AllOrdersTable = () => {
  const { appendRoomParam } = useRoomAPI();
  const { user } = useAppSelector((state) => state.auth);

  // Get room directly from URL for reliable access
  const [currentRoom, setCurrentRoom] = useState<string>('main');

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get('room') || 'main';
    setCurrentRoom(room);
  }, []);

  // Filter categories based on user email domain
  const isWordWorksUser = user?.username?.includes('@wordworksai.com');

  /* state */
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [datasheets, setDatasheets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [datasheetExecutions, setDatasheetExecutions] = useState<Record<string, any[]>>({});
  const [loadingExecutions, setLoadingExecutions] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>(["production"]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 1,
  });

  // Fetch orders with backend search, date filter and status filter support
  const fetchOrders = useCallback(async (
    p = pagination, 
    search = searchTerm, 
    dates = dateRange,
    statuses = statusFilter,
    tags = tagFilter,
  ) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { 
        page: p.page, 
        page_size: p.limit,
        sort_by: "created_at",
        sort_order: -1
      };
      
      // Add search param if not empty
      if (search) {
        params.search = search;
      }
      
      // Add date range params if available
      if (dates && dates[0] && dates[1]) {
        params.start_date = dates[0];
        params.end_date = dates[1];
      }
      
      // Add status filter if available
      if (statuses && statuses.length > 0) {
        if (!params?.filter) {
          params.filter = {};
        }
        params.filter = { ...params.filter, status: statuses[0] };
      }

      // Add tag filter if available
      if (tags && tags.length > 0) {
        if (!params?.filter) {
          params.filter = {};
        }
        params.filter = { ...params.filter, tag: tags[0] };
      }

      if (params?.filter) {
        params.filter = JSON.stringify(params.filter);
      }
      
      const { data } = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/executions`), { params });

      if (data.status === "success") {
        setPagination({
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          totalPages: data.data.pagination.totalPages,
          totalResults: data.data.pagination.totalResults,
        });
        setDatasheets(data.data.results);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      message.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [pagination, searchTerm, dateRange, statusFilter, tagFilter, appendRoomParam]);

  // Fetch executions for a specific datasheet
  const fetchExecutionsForDatasheet = async (datasheetId: string) => {
    // Don't fetch if already loading or already fetched
    if (loadingExecutions[datasheetId] || datasheetExecutions[datasheetId]) {
      return;
    }

    setLoadingExecutions(prev => ({ ...prev, [datasheetId]: true }));
    try {
      const params: Record<string, any> = {
        page: 1,
        page_size: 100,
        sort_by: "created_at",
        sort_order: -1
      };

      const { data } = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/executions/datasheet/${datasheetId}`),
        { params }
      );

      if (data.status === "success") {
        setDatasheetExecutions(prev => ({
          ...prev,
          [datasheetId]: data.data.results
        }));
      }
    } catch (err) {
      console.error("Error fetching executions:", err);
      message.error("Failed to load executions");
    } finally {
      setLoadingExecutions(prev => ({ ...prev, [datasheetId]: false }));
    }
  };

  /* controls */
  const stopExecution = async (id: string) => {
    setActionLoading(id);
    try {
      await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/stop-execution?api_key=${API_KEY}`), {
        execution_id: id,
      });
      message.success("Execution stopped successfully");
      fetchOrders();
    } catch (err) {
      console.error("Error stopping execution:", err);
      message.error("Failed to stop execution");
    } finally {
      setActionLoading(null);
    }
  };

  const startExecution = async (id: string) => {
    setActionLoading(id);
    try {
      await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/start-execution?api_key=${API_KEY}`), {
        execution_id: id,
      });
      message.success("Execution started successfully");
      fetchOrders();
    } catch (err) {
      console.error("Error starting execution:", err);
      message.error("Failed to start execution");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      // Convert to ISO strings for API
      const startDate = dates[0].toISOString();
      const endDate = dates[1].toISOString();
      setDateRange([startDate, endDate]);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
      fetchOrders({ ...pagination, page: 1 }, searchTerm, [startDate, endDate], statusFilter);
    } else {
      setDateRange(null);
      fetchOrders({ ...pagination, page: 1 }, searchTerm, null, statusFilter);
    }
  };

  // Handle status filter change
  const handleStatusChange = (values: string[]) => {
    setStatusFilter(values);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    fetchOrders({ ...pagination, page: 1 }, searchTerm, dateRange, values);
  };

  // Handle tag filter change
  const handleTagChange = (values: string[]) => {
    setTagFilter(values);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    fetchOrders({ ...pagination, page: 1 }, searchTerm, dateRange, statusFilter, values);
  };

  // Toggle expanded state for project groups
  const toggleProjectGroup = (datasheetId: string) => {
    const isCurrentlyExpanded = expandedGroups.includes(datasheetId);

    if (!isCurrentlyExpanded) {
      // Expanding - fetch executions if not already fetched
      fetchExecutionsForDatasheet(datasheetId);
      setExpandedGroups(prev => [...prev, datasheetId]);
    } else {
      // Collapsing
      setExpandedGroups(prev => prev.filter(id => id !== datasheetId));
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setDateRange(null);
    setStatusFilter([]);
    setTagFilter([]);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders({ ...pagination, page: 1 }, "", null, []);
    
    // Reset the search input field
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) searchInput.value = "";
  };

  /* effects */
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, currentRoom]);

  // Handle search with debounce and API call
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setSearchTerm(term);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
      fetchOrders({ ...pagination, page: 1 }, term, dateRange, statusFilter);
    }, 500), // Increased debounce time to reduce API calls
    [fetchOrders, pagination, dateRange, statusFilter]
  );


  /* UI Helpers */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge status="success" text="Completed" className="font-medium" />;
      case "running":
      case "processing":
        return <span className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-[#263978] mr-2"></span>
          <span className="font-medium text-[#263978]">Processing</span>
        </span>;
      case "pending":
        return <Badge status="warning" text="Pending" className="font-medium" />;
      case "stopped":
        return <Badge status="default" text="Stopped" className="font-medium text-orange-600" />;
      default:
        return <Badge status="default" text={status} className="font-medium" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-50 text-green-700 border-green-200";
      case "running":
      case "processing": return "bg-[#263978]/10 text-[#263978] border-[#263978]/30";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "stopped": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-white text-gray-700 border-gray-200";
    }
  };

  // Format a date for display
  const formatDate = (dateString: string) => {
    // Add 'Z' to treat the input as UTC if no timezone info is present
    const utcDateString = dateString.includes('Z') || dateString.includes('+') || dateString.includes('-', 19) 
      ? dateString 
      : dateString + 'Z';
    
    const date = new Date(utcDateString);
    
    const dateStr = date.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
    const timeStr = date.toLocaleTimeString("en-GB", { 
      timeZone: "Asia/Kolkata", 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr} - ${timeStr} IST`;
  };

  // Sync selectedId with the URL query param (?id=...) using Next.js router
  useEffect(() => {
    // Function to extract id from URL
    const getIdFromUrl = () => {
      if (typeof window === "undefined") return null;
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("id");
    };

    let frameId: number | null = null;
    const syncSelectedId = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        setSelectedId((previous) => {
          const next = getIdFromUrl();
          return previous === next ? previous : next;
        });
        frameId = null;
      });
    };

    // Set selectedId on mount and when URL changes
    const handleRouteChange = () => {
      syncSelectedId();
    };

    // Initial set
    handleRouteChange();

    // Listen for Next.js router navigation events
    window.addEventListener("popstate", handleRouteChange);

    // Listen for pushState/replaceState (for SPA navigation)
    const origPushState = window.history.pushState;
    const origReplaceState = window.history.replaceState;
    window.history.pushState = function (...args) {
      origPushState.apply(this, args);
      handleRouteChange();
    };
    window.history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      handleRouteChange();
    };

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("popstate", handleRouteChange);
      window.history.pushState = origPushState;
      window.history.replaceState = origReplaceState;
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 w-full max-w-7xl mx-auto">
      {/* Header section with actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#263978]">Projects</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

          {isWordWorksUser ? (
             <div className="relative flex-grow sm:flex-grow-0 sm:min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#263978]/30 transition-all"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
          ): null}
         
          
          <div className="flex gap-2">
            {isWordWorksUser && currentRoom !== 'main' && (
              <button
                className="px-4 py-2 bg-[#263978] hover:bg-[#1e2d5f] text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                onClick={() => {
                  const room = new URLSearchParams(window.location.search).get('room');
                  const url = room ? `/create-new?room=${room}` : '/create-new';
                  window.location.href = url;
                }}
              >
                <Plus size={18} />
                <span>New Project</span>
              </button>
            )}

            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              onClick={() => fetchOrders()}
              disabled={loading}
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter section - Enhanced with status filter and better date range */}
      <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-5">
          {/* Date Range Filter */}
          <div className="flex flex-col gap-2 flex-grow">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#263978]" />
              <span className="text-sm font-medium text-gray-700">Date Range</span>
            </div>
            <RangePicker 
              onChange={handleDateRangeChange}
              className="w-full rounded-lg border-gray-200 shadow-sm"
              allowClear
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
              style={{ height: '40px' }}
            />
          </div>
          
{/* Status Filter */}
<div className="flex flex-col gap-2 flex-grow">
  <div className="flex items-center gap-2">
    <FilterIcon size={18} className="text-[#263978]" />
    <span className="text-sm font-medium text-gray-700">Status</span>
  </div>
  <Select
    placeholder="Filter by status"
    value={statusFilter.length === 1 ? statusFilter[0] : ""}
    onChange={(value) => handleStatusChange(value ? [value] : [])}
    className="w-full"
    style={{ height: '40px' }}
  >
    <Option value="">All</Option>
    {STATUS_OPTIONS.map(option => (
      <Option key={option.value} value={option.value}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full bg-${option.color}-500`}></span>
          <span>{option.label}</span>
        </div>
      </Option>
    ))}
  </Select>
</div>

{/* Status Filter */}
<div className="flex flex-col gap-2 flex-grow">
  <div className="flex items-center gap-2">
    <FilterIcon size={18} className="text-[#263978]" />
    <span className="text-sm font-medium text-gray-700">Tag</span>
  </div>
  <Select
    placeholder="Filter by tag"
    value={tagFilter.length === 1 ? tagFilter[0] : ""}
    onChange={(value) => handleTagChange(value ? [value] : [])}
    className="w-full"
    style={{ height: '40px' }}
  >
    {isWordWorksUser ? <Option value="">All</Option> : null}
    {[...isWordWorksUser ? TAG_OPTIONS : TAG_OPTIONS_1].map(option => (
      <Option key={option.value} value={option.value}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full bg-${option.color}-500`}></span>
          <span>{option.label}</span>
        </div>
      </Option>
    ))}
  </Select>
</div>
          
          {/* Reset Filter Button */}
          <div className="flex items-end pb-1">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-white rounded-lg transition-colors flex items-center gap-2 shadow-sm h-10"
            >
              <RefreshCcw size={16} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
        
        {/* Active filters display */}
        {(searchTerm || dateRange || statusFilter.length > 0 || tagFilter.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-500">Active filters:</span>
            
            {searchTerm && (
              <div className="flex items-center gap-1 px-3 py-1 bg-[#263978]/10 text-[#263978] rounded-full text-xs font-medium">
                <Search size={12} />
                <span>{searchTerm}</span>
              </div>
            )}
            
            {dateRange && (
              <div className="flex items-center gap-1 px-3 py-1 bg-[#263978]/10 text-[#263978] rounded-full text-xs font-medium">
                <Calendar size={12} />
                <span>{new Date(dateRange[0]).toLocaleDateString("en-GB")} - {new Date(dateRange[1]).toLocaleDateString()}</span>
              </div>
            )}
            
            {statusFilter.map(status => {
              const statusOption = STATUS_OPTIONS.find(option => option.value === status);
              return (
                <div 
                  key={status}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                >
                  {statusOption?.label || status}
                </div>
              );
            })}

            {tagFilter.map(tag => {
              const tagOption = [...isWordWorksUser ? TAG_OPTIONS : TAG_OPTIONS_1].find(option => option.value === tag);
              return (
                <div 
                  key={tag}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tag)}`}
                >
                  {tagOption?.label || tag}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main content */}
      {true ? (
        <div className="space-y-5">
          {loading && datasheets.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <Skeleton active paragraph={{ rows: 1 }} />
                </div>
              ))}
            </div>
          ) : datasheets.length === 0 ? (
            <Empty
              description={
                searchTerm || dateRange || statusFilter.length > 0
                  ? "No projects match your filters"
                  : "No projects found"
              }
              className="py-12"
            />
          ) : (
            <div className="flex gap-4">
            <div className={selectedId ? "space-y-4 w-0 hidden" : "space-y-4 w-full"}>
              {datasheets.map((datasheet) => {
                const datasheetId = datasheet.datasheet_id;
                const datasheetName = datasheet.datasheet_info?.filename || 'Uncategorized';
                const isExpanded = expandedGroups.includes(datasheetId);
                const projectExecutions = datasheetExecutions[datasheetId] || [];
                const isLoadingExecutions = loadingExecutions[datasheetId] || false;

                console.log("Datasheet:", datasheetName, "Executions:", projectExecutions);

                // Use status_counts from API response
                const statusSummary = datasheet.status_counts || {};
                
                return (
                  <div key={datasheetId} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    {/* Project header */}
                    <div
  className="bg-white px-4 py-3 cursor-pointer"
  onClick={() => toggleProjectGroup(datasheetId)}
>
  {/* Mobile Layout (default) */}
  <div className="flex flex-col space-y-3 sm:hidden">
    {/* Top row: chevron and title */}
    <div className="flex items-center space-x-3">
      <ChevronRight
        size={20}
        className={`text-[#263978] transition-transform flex-shrink-0 ${isExpanded ? 'transform rotate-90' : ''}`}
      />
      <h3 className="font-semibold text-[#263978] flex-1 break-words">{datasheetName}</h3>
    </div>

    {/* All badges wrap in mobile */}
    <div className="flex flex-wrap gap-2 ml-8">
      <span className="px-2 py-0.5 rounded-full bg-[#263978]/10 text-[#263978] text-xs font-medium">
        {datasheet.execution_count} {datasheet.execution_count === 1 ? 'execution' : 'executions'}
      </span>

      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-medium">
        {datasheet.datasheet_info?.row_count || 0} rows
      </span>
      
      {Object.entries(statusSummary).map(([status, count]: any) => (
        <span 
          key={status}
          className={`rounded-full text-xs border px-2 py-0.5 ${getStatusColor(status)}`}
        >
          {status}: {count}
        </span>
      ))}
    </div>
  </div>

  {/* Tablet Layout (sm to lg) */}
  <div className="hidden sm:flex lg:hidden flex-col space-y-3">
    {/* First row: chevron, title that can wrap */}
    <div className="flex items-start space-x-3">
      <ChevronRight
        size={20}
        className={`text-[#263978] transition-transform flex-shrink-0 mt-0.5 ${isExpanded ? 'transform rotate-90' : ''}`}
      />
      <h3 className="font-semibold text-[#263978] flex-1 break-words leading-tight">{datasheetName}</h3>
    </div>

    {/* All badges with wrapping */}
    <div className="flex flex-wrap gap-2 ml-8">
      <span className="px-2.5 py-0.5 rounded-full bg-[#263978]/10 text-[#263978] text-xs font-medium">
        {datasheet.execution_count} {datasheet.execution_count === 1 ? 'execution' : 'executions'}
      </span>

      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-medium">
        {datasheet.datasheet_info?.row_count || 0} rows
      </span>

      {Object.entries(statusSummary).map(([status, count]: any) => (
        <span 
          key={status}
          className={`rounded-full text-xs border px-2.5 py-1 ${getStatusColor(status)}`}
        >
          {status}: {count}
        </span>
      ))}
    </div>
  </div>

  {/* Desktop Layout (lg and up) - With proper wrapping */}
  <div className="hidden lg:block">
    {/* Main container with wrapping capability */}
    <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
      {/* Left section: chevron, title, and info badges */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <ChevronRight
            size={20}
            className={`text-[#263978] transition-transform flex-shrink-0 ${isExpanded ? 'transform rotate-90' : ''}`}
          />
          <h3 className="font-semibold text-[#263978] break-words">{datasheetName}</h3>
        </div>

        {/* Info badges that can wrap */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#263978]/10 text-[#263978] text-xs font-medium">
            {datasheet.execution_count} {datasheet.execution_count === 1 ? 'execution' : 'executions'}
          </span>

          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-medium">
            {datasheet.datasheet_info?.row_count || 0} rows
          </span>
        </div>
      </div>
      
      {/* Right section: status badges that can wrap */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {Object.entries(statusSummary).map(([status, count]: any) => (
          <span 
            key={status}
            className={`rounded-full text-xs border px-2.5 py-1 ${getStatusColor(status)}`}
          >
            {status}: {count}
          </span>
        ))}
      </div>
    </div>
  </div>
</div>
                    
                    {/* Executions table - only visible when expanded */}
                    {isExpanded && (
                      <div className="p-4">
                        {isLoadingExecutions ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#263978] border-r-transparent"></div>
                              <p className="mt-2 text-sm text-gray-600">Loading executions...</p>
                            </div>
                          </div>
                        ) : projectExecutions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No executions found for this datasheet
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#263978] uppercase tracking-wider">Actions</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263978] uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263978] uppercase tracking-wider">Country</th>
                                {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263978] uppercase tracking-wider">Attempt</th> */}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263978] uppercase tracking-wider">Calls</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263978] uppercase tracking-wider">Created At</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263978] uppercase tracking-wider">Status</th>
                                {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263978] uppercase tracking-wider">Tag</th> */}
                                {/* <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#263978] uppercase tracking-wider">Actions</th> */}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {projectExecutions.map((execution: any, index: number) => (
                                <tr key={execution._id} className={selectedId === execution._id ? "bg-slate-100" : "hover:bg-white"}>
                                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                      <Tooltip title="View details">
                                        <button
                                          onClick={() => {
                                            {
                                              const room = new URLSearchParams(window.location.search).get('room');
                                              const url = room ? `/projects?room=${room}&id=${execution._id}` : `/projects?id=${execution._id}`;
                                              window.location.href = url;
                                            }
                                            // setSelectedId(execution._id);
                                          }}
                                          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                                        >
                                          <Eye size={16} />
                                        </button>
                                      </Tooltip>
                                      
                                      {isWordWorksUser && execution.status === "processing" && (
                                        <Tooltip title="Stop execution">
                                          <button
                                            onClick={() => stopExecution(execution._id)}
                                            disabled={actionLoading === execution._id}
                                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors disabled:opacity-50"
                                          >
                                            <Square size={16} className={actionLoading === execution._id ? "animate-pulse" : ""} />
                                          </button>
                                        </Tooltip>
                                      )}
                                      
                                      {isWordWorksUser && execution.status === "stopped" && (
                                        <Tooltip title="Start execution">
                                          <button
                                            onClick={() => startExecution(execution._id)}
                                            disabled={actionLoading === execution._id}
                                            className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-md transition-colors disabled:opacity-50"
                                          >
                                            <Play size={16} className={actionLoading === execution._id ? "animate-pulse" : ""} />
                                          </button>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                    {/* <span className="font-mono">{`T-${execution._id.slice(-4)}`} </span> */}
                                    <span className="font-mono">{`RUN-${projectExecutions.length - index}`} </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {execution.country || "N/A"}
                                  </td>
                                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {execution.attempt || 0}
                                  </td> */}
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {execution.no_of_answered_calls || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {formatDate(execution.created_at)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(execution.status)}
                                  </td>
                                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {execution.tag ? execution.tag.charAt(0).toUpperCase() + execution.tag.slice(1) : "N/A"}
                                  </td> */}
                                 
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
               <Pagination
                  pagination={pagination}
                  onPaginationChange={setPagination}
                  allOrders={datasheets}
                />
            </div>
           
            {selectedId && (
              <div className="bg-white rounded-lg border border-[#263978]/20 p-4 shadow-sm w-full">
                <X style={{ marginLeft: "auto", cursor: "pointer" }} onClick={() => {
                  const room = new URLSearchParams(window.location.search).get('room');
                  window.location.href = room ? `/projects?room=${room}` : '/projects';
                }} />
                <SalesBotStatusDash selectedId={selectedId} />
              </div>
            )}
            </div>
          )}

          {/* pagination */}
          {/* <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-3">
            <p className="text-sm text-gray-600">
              {`Showing ${
                (pagination.page - 1) * pagination.limit + 1
              } – ${
                (pagination.page - 1) * pagination.limit + orders.length
              } of ${pagination.totalResults}`}
            </p>

            <div className="flex flex-wrap gap-2">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setPagination({ ...pagination, page })}
                  className={`px-3 py-1 border rounded ${
                    pagination.page === page
                      ? "bg-[#263978] text-white"
                      : "bg-white text-[#263978]"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <select
              className="border border-gray-300 py-1 px-2 rounded text-gray-600"
              value={pagination.limit}
              onChange={(e) =>
                setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
              }
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div> */}

          {/* Pagination */}
          {/* <Pagination 
            pagination={pagination}
            onPaginationChange={setPagination}
            allOrders={orders}
          /> */}

        </div>
      ) : (
        /* Status dashboard for selected execution */
        <div className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#263978] rounded-lg transition-colors flex items-center gap-2"
              onClick={() => {
                const room = new URLSearchParams(window.location.search).get('room');
                window.location.href = room ? `/projects?room=${room}` : '/projects';
              }}
            >
              <ChevronRight className="rotate-180" size={18} />
              <span>Back to Projects</span>
            </button>
            
            {/* Status indicator can be added here if needed */}
          </div>
          
          <div className="bg-white rounded-lg border border-[#263978]/20 p-4 shadow-sm fixed top-14">
            <SalesBotStatusDash selectedId={selectedId} />
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with Suspense for useSearchParams in useRoomAPI hook
const AllOrdersTableWithSuspense = () => (
  <Suspense fallback={
    <div className="bg-white rounded-lg shadow-sm p-5 w-full max-w-7xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  }>
    <AllOrdersTable />
  </Suspense>
);

export default withProtection(AllOrdersTableWithSuspense);
