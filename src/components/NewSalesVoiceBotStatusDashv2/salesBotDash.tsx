/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { FiClock, FiPhone, FiCheckCircle, FiXCircle, FiThumbsUp, FiSlash, FiDollarSign, FiArrowLeft, FiAlertCircle, FiVoicemail } from "react-icons/fi";
import { BsCalculator, BsClockHistory, BsHourglassSplit } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Tag, Spin, Statistic, Card, Row, Col } from "antd";
import axiosInstance from "@/lib/axios";
// import { Line } from "@ant-design/charts";
import { Tabs } from "antd";
import { CallsTable } from "./aa/CallsTable";
import { FilterDropdown } from "./aa/FilterDropdown";
import { Pagination } from "./aa/Pagination";
import { OutcomesPieChart } from "./aa/OutcomesPieChart";
import { CallMetricsChart } from "./aa/CallMetricsChart";
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";

const { TabPane } = Tabs;

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  percentage?: string;
  trend?: 'up' | 'down' | 'neutral';
}

// Modern Glassmorphic Stat Card component
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  iconColor,
  percentage,
  trend = 'neutral'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15)" }}
      className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-4 flex items-center gap-4 overflow-hidden"
    >
      <div className={`p-3 rounded-xl ${iconBgColor} ${iconColor} flex items-center justify-center`}>
        {icon}
      </div>
      
      <div className="flex flex-col">
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <div className="flex items-end">
          <h3 className="text-xl font-bold text-gray-800">{value ?? "0"}</h3>
          {percentage && (
            <div className="ml-2 flex items-center text-xs">
              {trend === 'up' && <span className="text-green-500">↑ {percentage}%</span>}
              {trend === 'down' && <span className="text-red-500">↓ {percentage}%</span>}
              {trend === 'neutral' && <span className="text-gray-500">• {percentage}%</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SalesBotStatusDash: React.FC<any> = ({ selectedId }) => {
  const { selectedRoom, appendRoomParam, navigateTo } = useRoomAPI();
  const [currOrder, setCurrOrder] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    "call_distribution": {
      "total_calls": 0,
      "answered_calls": 0,
      "busy_calls": 0,
      "not_answered_calls": 0,
      "failed_calls": 0,
      "ongoing_calls": 0,
      "voicemail": 0
    },
    "inhaler_outcomes": {
      "inhaler_usage": 0,
      "refill_status": 0,
      "refill_timeline": 0,
      "daily_usage_frequency": 0
    },
    "refill_status": {},
    "inhaler_usage": {},
    "usage_frequency": {},
    "refill_timeline": {},
    "non_usage_reasons": {}
  });
  const [callstats, setCallstats] = useState<any>(null);
  const [callsTab, setCallsTab] = useState<any>("answered");
  const [allOrders, setAllOrders] = useState<any>([]);
  const [pagination, setPagination] = useState<any>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 1,
  });
  const [currOutcomeEdit, setCurrOutcomeEdit] = useState<any>(null);
  const [outcomeLoading, setOutcomeLoading] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState([
    "inhaler_usage",
    "refill_status",
    "refill_timeline",
    "daily_usage_frequency",
    "voicemail"
  ]);

  const [tableLoading, SetTableLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  const getOrder = async () => {
    try {
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/executions/${selectedId}?api_key=${API_KEY}`)
      );
      setCurrOrder(res.data.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const getStats = async () => {
    try {
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/dashboard/call-metrics/${selectedId}?api_key=${API_KEY}`)
      );
      setStats(res.data.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const getCostCallStats = async () => {
    try {
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/dashboard/call-cost-stats/${selectedId}?api_key=${API_KEY}`)
      );
      setCallstats(res.data.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const getCalls = async (pagination: any) => {
    try {
      SetTableLoading(true);
      const ROUTE =
        callsTab === "answered" ? "answered-calls" : "not-answered-calls";
      const filterKey = filterQuery.join("-");
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/dashboard/${ROUTE}/${selectedId}?api_key=${API_KEY}&filter_key=${filterKey}`),
        {
          params: {
            page: pagination.page,
            limit: pagination.limit,
          },
        }
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
      SetTableLoading(false);
    } catch (error) {
      console.error("Error fetching insights:", error);
      SetTableLoading(false);
    }
  };

  const onPaginationChange = (pagination: any) => {
    getCalls(pagination);
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

  const refreshCalls = () => {
    getCalls(pagination);
  }

  const getRunEveryTenSeconds = async () => {
    if (selectedId && currOrder?.status === "processing") {
      getOrder();
      getStats();
      getCostCallStats();
    }
  };

  useEffect(() => {
    const intervalId = setInterval(getRunEveryTenSeconds, 10000);
    if (selectedId) {
      getOrder();
      getStats();
      getCostCallStats();
      getCalls(pagination);
    }

    return () => clearInterval(intervalId);
  }, [selectedId, callsTab, currOrder?.status, pagination.page, filterQuery, selectedRoom]);

  /**
 * Converts seconds to MM:SS format
 * @param {number} seconds - Total seconds to convert
 * @returns {string} - Duration in MM:SS format
 */
const formatSecondsToMMSS = (seconds: any) => {
  if (!seconds || isNaN(seconds)) {
    return '0:00';
  }
  
  // Calculate minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Format remaining seconds with leading zero if needed
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  // Return in MM:SS format
  return `${minutes}:${formattedSeconds}`;
};

  return (
  <AnimatePresence>
    {!currOrder ? (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="min-h-screen w-full flex items-center justify-center px-4"
      >
        <Spin size="large" tip="Loading dashboard..." />
      </motion.div>
    ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full min-h-screen p-3 sm:p-4 lg:p-6 bg-transparent"
      >
        {/* Header and Order Info */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-3 sm:mb-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <FiArrowLeft
                  size={24}
                  className="cursor-pointer text-[#263978] sm:text-[28px]"
                  onClick={() => navigateTo("/projects")}
                />
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Dashboard</h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Monitor your campaign performance and analytics</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-4 sm:p-5 lg:p-6"
          >
            {/* Campaign Info Grid - Mobile First */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Campaign Status</h2>
                <div className="flex items-center">
                  <Badge 
                    status={currOrder?.status === "processing" ? "processing" : "success"} 
                    text={currOrder?.status?.toUpperCase()} 
                    className="text-sm sm:text-base font-semibold"
                  />
                </div>
              </div>
              
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Country</h2>
                <p className="text-sm sm:text-base font-semibold truncate">{currOrder?.country}</p>
              </div>
              
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Answered Calls</h2>
                <p className="text-sm sm:text-base font-semibold">{currOrder?.no_of_answered_calls}</p>
              </div>
            </div>

            {/* Settings Section */}
            <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Max Attempts</h2>
                  <Tag color="orange">{currOrder?.max_attempts || '-'}</Tag>
                </div>

                <div>
                  <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Time Gap (hours)</h2>
                  <Tag color="cyan">{currOrder?.time_gap || '-'}</Tag>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Work Hours</h2>
                  <Tag color="green">{currOrder?.work_hours_min || '0'} - {currOrder?.work_hours_max || '0'}</Tag>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Settings</h2>
                  <div className="flex gap-2 flex-wrap">
                    <Tag color={currOrder?.dnd_check ? "success" : "default"} className="text-xs">
                      DND: {currOrder?.dnd_check ? "On" : "Off"}
                    </Tag>
                    <Tag color={currOrder?.is_email_sent ? "success" : "default"} className="text-xs">
                      Email: {currOrder?.is_email_sent ? "On" : "Off"}
                    </Tag>
                    <Tag color={currOrder?.sms ? "success" : "default"} className="text-xs">
                      SMS: {currOrder?.sms ? "On" : "Off"}
                    </Tag>
                  </div>
                </div>

                {currOrder?.is_email_sent && (
                  <div>
                    <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Email Type</h2>
                    <Tag color="blue">{currOrder?.email_type || 'static'}</Tag>
                  </div>
                )}
              </div>
            </div>
            
            {/* System Prompt */}
            <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
              <h2 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">System Prompt</h2>
              <div className="text-xs sm:text-sm text-gray-700 italic bg-transparent bg-opacity-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                {currOrder?.system_prompt}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Tabs - Mobile Optimized */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          className="glassmorphism-tabs"
          size="small"
          tabBarGutter={8}
        >
          <TabPane tab={<span className="text-xs sm:text-sm">Call Stats</span>} key="1">
            {/* Call Stats Section - Mobile First Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-4 sm:p-6"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Call Summary</h3>
                <div className="space-y-3 sm:space-y-4">
                  <Statistic 
                    title="Total Calls" 
                    value={stats.call_distribution.total_calls || 0} 
                    suffix="calls"
                    valueStyle={{ color: '#1890ff', fontSize: window.innerWidth < 640 ? '20px' : '24px' }} 
                  />
                  <Statistic 
                    title="Answered Rate" 
                    value={stats.call_distribution.total_calls ? Math.round((stats.call_distribution.answered_calls / stats.call_distribution.total_calls) * 100) : 0} 
                    suffix="%" 
                    precision={1}
                    valueStyle={{ color: '#52c41a', fontSize: window.innerWidth < 640 ? '20px' : '24px' }}
                  />
                  <Statistic 
                    title="Average Duration" 
                    value={callstats?.average_duration || '0:00'} 
                    valueStyle={{ color: '#722ed1', fontSize: window.innerWidth < 640 ? '20px' : '24px' }}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-4 sm:p-6"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Inhaler Outcomes</h3>
                <div className="h-48 sm:h-64">
                  <OutcomesPieChart stats={stats} />
                </div>
              </motion.div>
            </div>

            {/* Call Distribution Chart */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-10 mt-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-4 sm:p-6"
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Call Distribution</h3>
                <div className="h-48 sm:h-64">
                  <CallMetricsChart stats={stats} />
                </div>
              </motion.div>
            </div>

            {/* Call Distribution Stats Cards - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Call Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  title="Ongoing Calls"
                  value={stats.call_distribution.ongoing_calls}
                  icon={<FiPhone size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                  percentage="5.2"
                  trend="up"
                />

                <StatCard
                  title="Answered"
                  value={stats.call_distribution.answered_calls}
                  icon={<FiCheckCircle size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  percentage="7.8"
                  trend="up"
                />

                <StatCard
                  title="Not Answered"
                  value={stats.call_distribution.not_answered_calls}
                  icon={<FiXCircle size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-orange-100"
                  iconColor="text-orange-600"
                  percentage="2.3"
                  trend="down"
                />

                <StatCard
                  title="Busy"
                  value={stats.call_distribution.busy_calls}
                  icon={<FiClock size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                  percentage="1.5"
                  trend="neutral"
                />

                <StatCard
                  title="Failed"
                  value={stats.call_distribution.failed_calls}
                  icon={<FiXCircle size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                  percentage="3.2"
                  trend="down"
                />

                <StatCard
                  title="Total"
                  value={stats.call_distribution.total_calls}
                  icon={<FiPhone size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                  percentage="4.7"
                  trend="up"
                />

                <StatCard
                  title="Answer Rate"
                  value={`${stats.call_distribution.total_calls ? Math.round((stats.call_distribution.answered_calls / stats.call_distribution.total_calls) * 100) : 0}%`}
                  icon={<FiCheckCircle size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-teal-100"
                  iconColor="text-teal-600"
                />
              </div>
            </motion.div>

            {/* Inhaler Outcomes Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Outcomes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  title="Answered First Question"
                  value={stats.inhaler_outcomes.inhaler_usage}
                  icon={<FiThumbsUp size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  percentage="8.5"
                  trend="up"
                />

                <StatCard
                  title="Answered Second Question"
                  value={stats.inhaler_outcomes.refill_status}
                  icon={<FiAlertCircle size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-yellow-100"
                  iconColor="text-yellow-600"
                  percentage="2.1"
                  trend="neutral"
                />

                <StatCard
                  title="Answered Final Question"
                  value={stats.inhaler_outcomes.refill_timeline}
                  icon={<FiCheckCircle size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                  percentage="1.3"
                  trend="neutral"
                />

                <StatCard
                  title="Non Usage"
                  value={stats.inhaler_outcomes.daily_usage_frequency}
                  icon={<FiSlash size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                  percentage="0.5"
                  trend="up"
                />

                {/* <StatCard
                  title="No Answer"
                  value={stats.inhaler_outcomes.no_answer}
                  icon={<FiXCircle size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-orange-100"
                  iconColor="text-orange-600"
                  percentage="0.5"
                  trend="up"
                /> */}

                <StatCard
                  title="Voicemail"
                  value={stats.call_distribution.voicemail}
                  icon={<FiVoicemail size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                  percentage="1.8"
                  trend="neutral"
                />
              </div>
            </motion.div>

            {/* Inhaler Usage Distribution - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Inhaler Usage Distribution</h3>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {Object.entries(stats.inhaler_usage).map(([usage, count]) => (
                    <div key={usage} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-700 font-medium truncate pr-2">{usage}</span>
                      <span className="font-bold text-gray-900 text-sm sm:text-lg flex-shrink-0">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Additional Metrics - Mobile Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8"
            >
              {/* Usage Frequency Distribution */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Usage Frequency</h3>
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-100">
                  <ul className="space-y-2 sm:space-y-3">
                    {Object.entries(stats.usage_frequency).length > 0 ? (
                      Object.entries(stats.usage_frequency).map(([frequency, count]) => (
                        <li key={frequency} className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-700 truncate pr-2">{frequency}</span>
                          <span className="font-semibold text-gray-900 text-sm flex-shrink-0">{count as number}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs sm:text-sm text-gray-500">No data available</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Non-Usage Reasons */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Non-Usage Reasons</h3>
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-100">
                  <ul className="space-y-2 sm:space-y-3">
                    {Object.entries(stats.non_usage_reasons).length > 0 ? (
                      Object.entries(stats.non_usage_reasons).map(([reason, count]) => (
                        <li key={reason} className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-700 truncate pr-2">{reason}</span>
                          <span className="font-semibold text-gray-900 text-sm flex-shrink-0">{count as number}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs sm:text-sm text-gray-500">No data available</li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Refill Timeline Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Refill Timeline</h3>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-100">
                <ul className="space-y-2 sm:space-y-3">
                  {Object.entries(stats.refill_timeline).length > 0 ? (
                    Object.entries(stats.refill_timeline).map(([timeline, count]) => (
                      <li key={timeline} className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-700 truncate pr-2">{timeline}</span>
                        <span className="font-semibold text-gray-900 text-sm flex-shrink-0">{count as number}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs sm:text-sm text-gray-500">No data available</li>
                  )}
                </ul>
              </div>
            </motion.div>
          </TabPane>

          <TabPane tab={<span className="text-xs sm:text-sm">Financial</span>} key="2">
            {/* Financial Stats - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Financial Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                  title="Total Calls"
                  value={callstats?.total_calls || 0}
                  icon={<FiPhone size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  percentage="5.2"
                  trend="up"
                />

                <StatCard
                  title="Total Spend"
                  value={`₹${callstats?.total_spend?.toFixed(2) || '0.00'}`}
                  icon={<FiDollarSign size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-blue-100"
                  iconColor="text-blue-600"
                  percentage="3.7"
                  trend="up"
                />

                <StatCard
                  title="Avg Call Cost"
                  value={`₹${callstats?.average_call_cost?.toFixed(2) || '0.00'}`}
                  icon={<BsCalculator size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-orange-100"
                  iconColor="text-orange-600"
                  percentage="1.2"
                  trend="down"
                />

                <StatCard
                  title="Total Duration (Minutes)"
                  value={formatSecondsToMMSS(callstats?.total_duration || 0)}
                  icon={<BsClockHistory size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                  percentage="6.5"
                  trend="up"
                />

                <StatCard
                  title="Avg Duration"
                  value={formatSecondsToMMSS(callstats?.average_duration || 0)}
                  icon={<BsHourglassSplit size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                  percentage="2.1"
                  trend="neutral"
                />

                <StatCard
                  title="Total Bill Duration (Minutes)"
                  value={formatSecondsToMMSS(callstats?.total_bill_duration || 0)}
                  icon={<BsClockHistory size={18} className="sm:w-5 sm:h-5" />}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                  percentage="6.5"
                  trend="up"
                />
              </div>
            </motion.div>

            {/* Cost Breakdown Section - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Pricing Structure</h3>
              <Card className="shadow-sm">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">0-6 seconds</p>
                      <p className="text-lg sm:text-xl font-bold text-green-600">
                        ₹{callstats?.cost_breakdown?.rate_0_to_6_seconds || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">FREE</p>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">7-10 seconds</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-600">
                        ₹{callstats?.cost_breakdown?.rate_7_to_10_seconds || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">per call</p>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">11-30 seconds</p>
                      <p className="text-lg sm:text-xl font-bold text-orange-600">
                        ₹{callstats?.cost_breakdown?.rate_11_to_30_seconds || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">per call</p>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Over 30 seconds</p>
                      <p className="text-sm sm:text-lg font-bold text-purple-600">
                        {callstats?.cost_breakdown?.rate_over_30_seconds || '0'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">per minute</p>
                    </div>
                  </Col>
                </Row>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <span className="font-medium">Calculation Method:</span>{' '}
                    {callstats?.cost_breakdown?.calculation_method || '0'}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">
                    <span className="font-medium">Total Minutes:</span>{' '}
                    {callstats?.cost_breakdown?.total_minutes || 0} minutes
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Duration Distribution Section - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-6 sm:mb-8"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Call Duration Distribution</h3>
              <Card className="shadow-sm">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">0-6 seconds</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {callstats?.duration_distribution?.calls_0_to_6_seconds || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {callstats?.total_calls
                          ? ((callstats?.duration_distribution?.calls_0_to_6_seconds / callstats?.total_calls) * 100).toFixed(1)
                          : 0}
                        % of total
                      </p>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">7-10 seconds</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {callstats?.duration_distribution?.calls_7_to_10_seconds || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {callstats?.total_calls
                          ? ((callstats?.duration_distribution?.calls_7_to_10_seconds / callstats?.total_calls) * 100).toFixed(1)
                          : 0}
                        % of total
                      </p>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">11-30 seconds</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-600">
                        {callstats?.duration_distribution?.calls_11_to_30_seconds || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {callstats?.total_calls
                          ? ((callstats?.duration_distribution?.calls_11_to_30_seconds / callstats?.total_calls) * 100).toFixed(1)
                          : 0}
                        % of total
                      </p>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Over 30 seconds</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">
                        {callstats?.duration_distribution?.calls_over_30_seconds || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {callstats?.total_calls
                          ? ((callstats?.duration_distribution?.calls_over_30_seconds / callstats?.total_calls) * 100).toFixed(1)
                          : 0}
                        % of total
                      </p>
                    </div>
                  </Col>
                </Row>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-2">
                    <span className="text-gray-600">Most calls fall into:</span>
                    <span className="font-medium text-gray-800">
                      {callstats?.duration_distribution?.calls_0_to_6_seconds > callstats?.duration_distribution?.calls_over_30_seconds
                        ? '0-6 seconds (Free calls)'
                        : 'Over 30 seconds (Premium rate)'}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabPane>

          <TabPane tab={<span className="text-xs sm:text-sm">Calls List</span>} key="3">
            {/* Calls Table Section - Mobile Optimized */}
            <motion.div
              className="backdrop-blur-md mt-3 sm:mt-5 bg-transparent border border-white/70 shadow-xl rounded-2xl overflow-hidden"
              variants={itemVariants}
            >
              {/* Table Controls - Mobile First */}
              <div className="p-4 sm:p-6 border-b border-white/50 bg-transparent">
                {/* Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-0">
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                        callsTab === "answered"
                          ? "bg-[#263978] shadow-lg"
                          : "bg-white/80 hover:bg-white/90 border border-slate-300 hover:border-[#263978]"
                      }`}
                      onClick={() => setCallsTab("answered")}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className={`${callsTab === "answered" ? "text-[#fff]" : "text-[#263978]"}`}>
                          Answered
                        </span>
                        <Badge 
                          count={stats.call_distribution.answered_calls || 0} 
                          color="#1890ff" 
                          size="small"
                        />
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 sm:px-4 py-2 rounded-lg backdrop-blur-sm font-medium transition-all text-xs sm:text-sm ${
                        callsTab === "not-answered"
                          ? "bg-[#263978] shadow-lg"
                          : "bg-white/80 hover:bg-white/90 border border-slate-300 hover:border-[#263978]"
                      }`}
                      onClick={() => setCallsTab("not-answered")}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className={`${callsTab === "not-answered" ? "text-[#fff]" : "text-[#263978]"}`}>
                          Not Answered
                        </span>
                        <Badge 
                          count={(stats.call_distribution.total_calls - stats.call_distribution.answered_calls) || 0} 
                          color="#ff4d4f" 
                          size="small"
                        />
                      </div>
                    </motion.button>
                  </div>

                  {/* Controls Row - Stack on Mobile */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:ml-auto">
                    {callsTab === "answered" && (
                      <div className="w-full sm:w-auto">
                        <FilterDropdown
                          filterQuery={filterQuery}
                          setFilterQuery={setFilterQuery}
                        />
                      </div>
                    )}
                    <button
                      className="px-3 py-2 bg-[#263978] text-white rounded-md text-xs sm:text-sm w-full sm:w-auto"
                      onClick={() => refreshCalls()}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Container with Horizontal Scroll for Mobile */}
              <div className="p-3 sm:p-6 bg-transparent">
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
                
                {/* Pagination - Mobile Optimized */}
                <div className="mt-4 sm:mt-6">
                  <Pagination 
                    pagination={pagination}
                    onPaginationChange={onPaginationChange}
                    allOrders={allOrders}
                  />
                </div>
              </div>
            </motion.div>
          </TabPane>
        </Tabs>
      </motion.div>
    )}
  </AnimatePresence>
);
};

export default SalesBotStatusDash;