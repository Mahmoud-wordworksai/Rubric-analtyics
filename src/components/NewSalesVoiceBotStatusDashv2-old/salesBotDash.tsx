/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { FiClock, FiPhone, FiCheckCircle, FiXCircle, FiThumbsUp, FiThumbsDown, FiSlash, FiDollarSign, FiArrowLeft, FiAlertCircle, FiUser, FiMessageCircle } from "react-icons/fi";
import { BsCalculator, BsClockHistory, BsHourglassSplit } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Tag, Spin, Statistic } from "antd";
import axiosInstance from "@/lib/axios";
// import { Line } from "@ant-design/charts";
import { Tabs } from "antd";
import { CallsTable } from "./aa/CallsTable";
import { FilterDropdown } from "./aa/FilterDropdown";
import { Pagination } from "./aa/Pagination";
import { OutcomesPieChart } from "./aa/OutcomesPieChart";
import { CallMetricsChart } from "./aa/CallMetricsChart";
import { useRouter } from "next/navigation";
import { API_BASE_URL, API_KEY } from "@/constants";

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
    "emi_outcomes": {
      "committed": 0,
      "partial_payment": 0,
      "refused": 0,
      "requested_extension": 0,
      "escalation_needed": 0,
      "no_response": 0
    },
    "payment_stats": {
      "payment_link_sent": 0,
      "physical_collection_required": 0,
      "partial_payment_offered": 0
    },
    "sentiment_metrics": {
      "Neutral": 0
    },
    "non_payment_reasons": {
      "Not provided": 0
    },
    "language_distribution": {
      "English": 0
    }
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
    "committed",
    "partial_payment",
    "refused",
    "requested_extension",
    "escalation_needed",
    "no_response",
    "voicemail"
  ]);

  const router = useRouter();
  // const [isOpen, setIsOpen] = useState(false);
  // // const filterOptions = [
  // //   "positive",
  // //   "negative",
  // //   "neutral",
  // //   "incomplete",
  // //   "none",
  // //   "voicemail",
  // // ];

  // const dropdownRef = useRef<any>(null);
  const [tableLoading, SetTableLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // Mock data for charts
  // const [callTrends, setCallTrends] = useState([
  //   { date: "Jan", calls: 120, answered: 80, notAnswered: 40 },
  //   { date: "Feb", calls: 150, answered: 110, notAnswered: 40 },
  //   { date: "Mar", calls: 180, answered: 140, notAnswered: 40 },
  //   { date: "Apr", calls: 200, answered: 170, notAnswered: 30 },
  //   { date: "May", calls: 220, answered: 190, notAnswered: 30 },
  //   { date: "Jun", calls: 250, answered: 215, notAnswered: 35 },
  // ]);

  // const [callOutcomes, setCallOutcomes] = useState([
  //   { type: "Positive", value: 45 },
  //   { type: "Negative", value: 15 },
  //   { type: "Neutral", value: 25 },
  //   { type: "Voicemail", value: 10 },
  //   { type: "Incomplete", value: 5 },
  // ]);

  const getOrder = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}/executions/${selectedId}?api_key=${API_KEY}`
      );
      setCurrOrder(res.data.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const getStats = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}/dashboard/call-metrics/${selectedId}?api_key=${API_KEY}`
      );
      setStats(res.data.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const getCostCallStats = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}/dashboard/call-cost-stats/${selectedId}?api_key=${API_KEY}`
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
        `${API_BASE_URL}/dashboard/${ROUTE}/${selectedId}?api_key=${API_KEY}&filter_key=${filterKey}`,
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
        `${API_BASE_URL}/sessions/${sessionId}/outcome`,
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

  // const handleFilterChange = (value: string[]) => {
  //   setFilterQuery(value);
  // };

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
  //       setIsOpen(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  const refreshCalls = () => {
    // if (pagination.page === 1) {
    getCalls(pagination);
    // }
  }

  const getRunEveryTenSeconds = async () => {
    if (selectedId && currOrder?.status === "processing") {
      getOrder();
      getStats();
      getCostCallStats();
      // if (pagination.page === 1) {
      //   getCalls(pagination);
      // }
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
  }, [selectedId, callsTab, currOrder?.status, pagination.page, filterQuery]);

  // Chart configurations
  // const callTrendConfig = {
  //   data: callTrends,
  //   xField: 'date',
  //   yField: 'calls',
  //   smooth: true,
  //   legend: false,
  //   areaStyle: {
  //     fill: 'l(270) 0:#1890ff10 0.5:#1890ff30 1:#1890ff50',
  //   },
  //   line: {
  //     color: '#1890ff',
  //   },
  //   point: {
  //     size: 5,
  //     shape: 'circle',
  //     style: {
  //       fill: 'white',
  //       stroke: '#1890ff',
  //       lineWidth: 2,
  //     },
  //   },
  // };

  // const callBreakdownConfig = {
  //   data: [
  //     { type: 'Answered', value: stats?.answered_calls || 0 },
  //     { type: 'Not Answered', value: stats?.not_answered_calls || 0 },
  //     { type: 'Busy', value: stats?.busy_calls || 0 },
  //     { type: 'Failed', value: stats?.failed_calls || 0 },
  //   ],
  //   xField: 'type',
  //   yField: 'value',
  //   color: ['#4ade80', '#f97316', '#f59e0b', '#ef4444'],
  //   legend: { position: 'right' },
  //   label: {
  //     position: 'middle',
  //     style: {
  //       fill: '#FFFFFF',
  //       opacity: 0.6,
  //     },
  //   },
  // };

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
          className="h-screen w-full flex items-center justify-center"
        >
          <Spin size="large" tip="Loading dashboard..." />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full min-h-screen p-6 bg-transparent"
          // bg-gradient-to-br from-indigo-50 to-blue-50
        >
          {/* Header and Order Info */}
          <div className="mb-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
              <FiArrowLeft
                size={28}
                className="cursor-pointer text-[#263978]"
                onClick={() => router.push("/projects")}
              />
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              </div>

              {/* <button
                className="px-3 py-1 bg-[#263978] text-white rounded-md justify-end"
                onClick={() => router.push(`/analyze?selectedId=${selectedId}`)}
              >
                Analyze
              </button> */}
              </div>
             
              <p className="text-gray-500">Monitor your campaign performance and analytics</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-6"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">Campaign Status</h2>
                  <div className="flex items-center">
                    <Badge 
                      status={currOrder?.status === "processing" ? "processing" : "success"} 
                      text={currOrder?.status?.toUpperCase()} 
                      className="text-base font-semibold"
                    />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">Country</h2>
                  <p className="text-base font-semibold">{currOrder?.country}</p>
                </div>
                
                <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">Answered Calls</h2>
                  <p className="text-base font-semibold">{currOrder?.no_of_answered_calls}</p>
                </div>
                
                {/* <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">Provider</h2>
                  <p className="text-base font-semibold">{currOrder?.provider}</p>
                </div> */}
              </div>
              
              {/* <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">STT Service</h2>
                    <Tag color="blue">{currOrder?.stt_service}</Tag>
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">TTS Service</h2>
                    <Tag color="purple">{currOrder?.tts_service}</Tag>
                  </div>
                </div>
              </div> */}

              <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">Max Attempts</h2>
                    <Tag color="orange">{currOrder?.max_attempts || '-'}</Tag>
                  </div>

                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">Time Gap (hours)</h2>
                    <Tag color="cyan">{currOrder?.time_gap || '-'}</Tag>
                  </div>

                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">Work Hours</h2>
                    <Tag color="green">{currOrder?.work_hours_min || '0'} - {currOrder?.work_hours_max || '0'}</Tag>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-1">Settings</h2>
                    <div className="flex gap-2 flex-wrap">
                      <Tag color={currOrder?.dnd_check ? "success" : "default"}>
                        DND Check: {currOrder?.dnd_check ? "On" : "Off"}
                      </Tag>
                      <Tag color={currOrder?.is_email_sent ? "success" : "default"}>
                        Email: {currOrder?.is_email_sent ? "On" : "Off"}
                      </Tag>
                      <Tag color={currOrder?.sms ? "success" : "default"}>
                        SMS: {currOrder?.sms ? "On" : "Off"}
                      </Tag>
                    </div>
                  </div>

                  {currOrder?.is_email_sent && (
                    <div>
                      <h2 className="text-sm font-medium text-gray-500 mb-1">Email Type</h2>
                      <Tag color="blue">{currOrder?.email_type || 'static'}</Tag>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
                <h2 className="text-sm font-medium text-gray-500 mb-1">System Prompt</h2>
                <p className="text-sm text-gray-700 italic bg-transparent bg-opacity-50 p-3 rounded-lg">
                  {currOrder?.system_prompt}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="glassmorphism-tabs"
          >
            <TabPane tab="Call Statistics" key="1">
              {/* Call Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="col-span-full lg:col-span-2 bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Call Trends</h3>
                  <div className="h-64">
                    <Line {...callTrendConfig} />
                  </div>
                </motion.div> */}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="col-span-full lg:col-span-1 bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Call Summary</h3>
                  <div className="flex flex-col space-y-4">
                    <Statistic 
                      title="Total Calls" 
                      value={stats.call_distribution.total_calls || 0} 
                      suffix="calls"
                      valueStyle={{ color: '#1890ff' }} 
                    />
                    <Statistic 
                      title="Answered Rate" 
                      value={stats.call_distribution.total_calls ? Math.round((stats.call_distribution.answered_calls / stats.call_distribution.total_calls) * 100) : 0} 
                      suffix="%" 
                      precision={1}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Statistic 
                      title="Average Duration" 
                      value={callstats?.average_duration || '0:00'} 
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Outcome</h3>
                  <div className="h-64">
                    {/* Insert cost per outcome chart here */}
                    <OutcomesPieChart stats={stats} />
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-10 mt-5">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Breakdown</h3>
                  <div className="h-64">
                    {/* Insert cost breakdown chart here */}
                    <CallMetricsChart stats={stats} />
                  </div>
                </motion.div>

                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl border border-white border-opacity-20 shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Outcome</h3>
                  <div className="h-64">
                    
                    <OutcomesPieChart stats={stats} />
                  </div>
                </motion.div> */}
              </div>

               {/* Call Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Call Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Ongoing Calls"
            value={stats.call_distribution.ongoing_calls}
            icon={<FiPhone size={22} />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            percentage="5.2"
            trend="up"
          />

          <StatCard
            title="Answered"
            value={stats.call_distribution.answered_calls}
            icon={<FiCheckCircle size={22} />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            percentage="7.8"
            trend="up"
          />

          <StatCard
            title="Not Answered"
            value={stats.call_distribution.not_answered_calls}
            icon={<FiXCircle size={22} />}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            percentage="2.3"
            trend="down"
          />

          <StatCard
            title="Busy"
            value={stats.call_distribution.busy_calls}
            icon={<FiClock size={22} />}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            percentage="1.5"
            trend="neutral"
          />

          <StatCard
            title="Failed"
            value={stats.call_distribution.failed_calls}
            icon={<FiXCircle size={22} />}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
            percentage="3.2"
            trend="down"
          />

          <StatCard
            title="Total"
            value={stats.call_distribution.total_calls}
            icon={<FiPhone size={22} />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            percentage="4.7"
            trend="up"
          />
        </div>
      </motion.div>

      {/* EMI Outcomes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-8"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">EMI Outcomes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Committed"
            value={stats.emi_outcomes.committed}
            icon={<FiThumbsUp size={22} />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            percentage="8.5"
            trend="up"
          />

          <StatCard
            title="Partial Payment"
            value={stats.emi_outcomes.partial_payment}
            icon={<FiDollarSign size={22} />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            percentage="2.1"
            trend="neutral"
          />

          <StatCard
            title="Refused"
            value={stats.emi_outcomes.refused}
            icon={<FiThumbsDown size={22} />}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
            percentage="1.3"
            trend="down"
          />

          <StatCard
            title="Extension Requested"
            value={stats.emi_outcomes.requested_extension}
            icon={<FiClock size={22} />}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            percentage="5.7"
            trend="neutral"
          />

          <StatCard
            title="Escalation Needed"
            value={stats.emi_outcomes.escalation_needed}
            icon={<FiAlertCircle size={22} />}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            percentage="2.8"
            trend="up"
          />

          <StatCard
            title="Voicemail"
            value={stats.call_distribution.voicemail || 0}
            icon={<FiMessageCircle size={22} />}
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
            percentage="2.1"
            trend="neutral"
          />

          <StatCard
            title="No Response"
            value={stats.emi_outcomes.no_response}
            icon={<FiSlash size={22} />}
            iconBgColor="bg-gray-100"
            iconColor="text-gray-600"
            percentage="1.5"
            trend="neutral"
          />
        </div>
      </motion.div>

      {/* Payment Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Payment Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Payment Link Sent"
            value={stats.payment_stats.payment_link_sent}
            icon={<FiDollarSign size={22} />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            percentage="6.2"
            trend="up"
          />

          <StatCard
            title="Physical Collection"
            value={stats.payment_stats.physical_collection_required}
            icon={<FiUser size={22} />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            percentage="1.8"
            trend="neutral"
          />

          <StatCard
            title="Partial Payment"
            value={stats.payment_stats.partial_payment_offered}
            icon={<FiDollarSign size={22} />}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            percentage="3.5"
            trend="up"
          />
        </div>
      </motion.div>

      {/* Additional Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
      >
        {/* Sentiment Metrics */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Sentiment Analysis</h3>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <ul className="space-y-3">
              {Object.entries(stats.sentiment_metrics).map(([sentiment, count]) => (
                <li key={sentiment} className="flex justify-between items-center">
                  <span className="text-gray-700">{sentiment}</span>
                  <span className="font-semibold text-gray-900">{count as number}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Language Distribution */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Language Distribution</h3>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <ul className="space-y-3">
              {Object.entries(stats.language_distribution).map(([language, count]) => (
                <li key={language} className="flex justify-between items-center">
                  <span className="text-gray-700">{language}</span>
                  <span className="font-semibold text-gray-900">{count as number}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Non-Payment Reasons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="mb-8"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Non-Payment Reasons</h3>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <ul className="space-y-3">
            {Object.entries(stats.non_payment_reasons).map(([reason, count]) => (
              <li key={reason} className="flex justify-between items-center">
                <span className="text-gray-700">{reason}</span>
                <span className="font-semibold text-gray-900">{count as number}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
            </TabPane>

            <TabPane tab="Financial Metrics" key="2">
              {/* Financial Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Financial Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    title="Total Calls"
                    value={callstats?.total_calls || 0}
                    icon={<FiPhone size={22} />}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                    percentage="5.2"
                    trend="up"
                  />

                  <StatCard
                    title="Total Spend"
                    value={`₹${(
                      (6 * (callstats?.total_bill_duration ? callstats.total_bill_duration / 60 : 0))
                      ).toFixed(2)}`}
                    icon={<FiDollarSign size={22} />}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                    percentage="3.7"
                    trend="up"
                  />

                  <StatCard
                    title="Avg Call Cost"
                    value={`₹6`}
                    icon={<BsCalculator size={22} />}
                    iconBgColor="bg-orange-100"
                    iconColor="text-orange-600"
                    percentage="1.2"
                    trend="down"
                  />

                  <StatCard
                    title="Total Duration (Minutes)"
                    value={formatSecondsToMMSS(callstats?.total_duration || '0:00')}
                    icon={<BsClockHistory size={22} />}
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                    percentage="6.5"
                    trend="up"
                  />

                  <StatCard
                    title="Avg Duration"
                    value={callstats?.average_duration || '0:00'}
                    icon={<BsHourglassSplit size={22} />}
                    iconBgColor="bg-red-100"
                    iconColor="text-red-600"
                    percentage="2.1"
                    trend="neutral"
                  />

                   <StatCard
                    title="Total Bill Duration (Minutes)"
                    value={formatSecondsToMMSS(callstats?.total_bill_duration || '0:00')}
                    icon={<BsClockHistory size={22} />}
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                    percentage="6.5"
                    trend="up"
                  />
                </div>
              </motion.div>

              
            </TabPane>

            <TabPane tab="Calls List" key="3">
               {/* Calls Table Section */}
                     <motion.div
                        className="backdrop-blur-md mt-5 bg-transparent border border-white/70 shadow-xl rounded-2xl overflow-hidden"
                        variants={itemVariants}
                      >
                        {/* Table Controls */}
                        <div className="p-6 border-b border-white/50 bg-transparent flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              callsTab === "answered"
                                ? "bg-[#263978] shadow-lg"
                                : "bg-white/80 hover:bg-white/90 border border-slate-300 hover:border-[#263978]"
                            }`}
                            onClick={() => setCallsTab("answered")}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`${callsTab === "answered" ? "text-[#fff]" : "text-[#263978]"}`}>Answered Calls</span>
                              <Badge count={stats.call_distribution.answered_calls || 0} color="#1890ff" />
                            </div>
                          </motion.button>
              
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-lg backdrop-blur-sm font-medium transition-all ${
                              callsTab === "not-answered"
                                ? "bg-[#263978] shadow-lg"
                                : "bg-white/80 hover:bg-white/90 border border-slate-300 hover:border-[#263978]"
                            }`}
                            onClick={() => setCallsTab("not-answered")}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`${callsTab === "not-answered" ? "text-[#fff]" : "text-[#263978]"}`}>Not Answered</span>
                              <Badge count={(stats.call_distribution.total_calls -  stats.call_distribution.answered_calls) || 0} color="#ff4d4f" />
                            </div>
                          </motion.button>
                        </div>
              
                        <div className="flex gap-3">
                            {callsTab === "answered" && (
                              <FilterDropdown
                                filterQuery={filterQuery}
                                setFilterQuery={setFilterQuery}
                              />
                            )}
                          <button
                            className="px-3 py-1 bg-[#263978] text-white rounded-md"
                            onClick={() => refreshCalls()}
                          >
                            Refresh
                          </button>
                        </div>
                        </div>
              
                        {/* Table */}
                        <div className="p-6 bg-transparent">
                          <CallsTable 
                            allOrders={allOrders}
                            tableLoading={tableLoading}
                            currOutcomeEdit={currOutcomeEdit}
                            setCurrOutcomeEdit={setCurrOutcomeEdit}
                            outcomeLoading={outcomeLoading}
                            saveOutcome={saveOutcome}
                            setOutcomeLoading={setOutcomeLoading}
                          />
                          
                          {/* Pagination */}
                          <Pagination 
                            pagination={pagination}
                            onPaginationChange={onPaginationChange}
                            allOrders={allOrders}
                          />
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