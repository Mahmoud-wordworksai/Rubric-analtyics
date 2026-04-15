/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "antd";
import axiosInstance from "@/lib/axios";
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";

// Import components
import { LoadingSpinner } from "./LoadingComponents";
import { StatCard, StatsContainer } from "./StatCards";
import { CallsTable } from "./CallsTable";
import { Pagination } from "./Pagination";
import { FilterDropdown } from "./FilterDropdown";
import { CallMetricsChart } from "./CallMetricsChart";
import { OutcomesPieChart } from "./OutcomesPieChart";
import { CallDetails } from "./CallDetails";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

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

interface SalesBotStatusDashProps {
  selectedId: string;
}

const SalesBotStatusDash: React.FC<SalesBotStatusDashProps> = ({ selectedId }) => {
  const { selectedRoom, appendRoomParam } = useRoomAPI();
  const [currOrder, setCurrOrder] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [callstats, setCallstats] = useState<any>(null);
  const [callsTab, setCallsTab] = useState<string>("answered");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [currOutcomeEdit, setCurrOutcomeEdit] = useState<any>(null);
  const [outcomeLoading, setOutcomeLoading] = useState<boolean>(false);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 1,
  });
  
  const [filterQuery, setFilterQuery] = useState([
    "qualified",
    "notqualified",
    "incomplete",
    "callback",
    "voicemail",
  ]);
  
  const dropdownRef = useRef<any>(null);

  // Fetch current execution data
  const getOrder = async () => {
    try {
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/executions/${selectedId}?api_key=${API_KEY}`)
      );
      setCurrOrder(res.data.data);
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  // Fetch statistics
  const getStats = async () => {
    try {
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/dashboard/call-metrics/${selectedId}?api_key=${API_KEY}`)
      );
      setStats(res.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch call cost statistics
  const getCostCallStats = async () => {
    try {
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/dashboard/call-cost-stats/${selectedId}?api_key=${API_KEY}`)
      );
      setCallstats(res.data.data);
    } catch (error) {
      console.error("Error fetching call stats:", error);
    }
  };

  // Fetch calls data
  const getCalls = async (pagination: any) => {
    try {
      setTableLoading(true);
      const ROUTE = callsTab === "answered" ? "answered-calls" : "not-answered-calls";
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
      setTableLoading(false);
    } catch (error) {
      console.error("Error fetching calls:", error);
      setTableLoading(false);
    }
  };

  // Handle pagination change
  const onPaginationChange = (newPagination: any) => {
    getCalls(newPagination);
  };

  // Save outcome
  const saveOutcome = async (newData: any) => {
    try {
      if (!newData) {
        alert("No data found");
        return "ERROR";
      }
      
      const sessionId = newData?.session_id;
      const outcome = newData?.model_data?.outcome;

      await axiosInstance.put(
        appendRoomParam(`${API_BASE_URL}/sessions/${sessionId}/outcome`),
        null,
        {
          params: { outcome },
        }
      );

      setAllOrders((prev: any[]) => {
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
      return "OK";
    } catch (error) {
      setCurrOutcomeEdit(null);
      console.error("Error updating outcome:", error);
      return "ERROR";
    }
  };

  // Fetch data periodically when execution is in processing state
  const getRunEveryTenSeconds = async () => {
    if (selectedId && currOrder?.status === "processing") {
      getOrder();
      getStats();
      getCostCallStats();
      if (pagination.page === 1) {
        getCalls(pagination);
      }
    }
  };

  // Initialize data fetching
  useEffect(() => {
    setIsLoading(true);
    
    if (selectedId) {
      Promise.all([getOrder(), getStats(), getCostCallStats()])
        .then(() => {
          getCalls(pagination);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });

      const intervalId = setInterval(getRunEveryTenSeconds, 10000);
      return () => clearInterval(intervalId);
    }
  }, [selectedId, callsTab, currOrder?.status, pagination.page, filterQuery, selectedRoom]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div 
      className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Glass container */}
      <div className="w-full max-w-7xl mx-auto">
        {/* Order Details */}
        {currOrder && (
          <motion.div 
            className="backdrop-blur-md bg-white/40 border border-white/70 shadow-xl rounded-2xl p-6 mb-6"
            variants={itemVariants}
          >
            <CallDetails currOrder={currOrder} />
          </motion.div>
        )}

        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          variants={itemVariants}
        >
          {/* Call Stats */}
          <div className="backdrop-blur-md bg-white/40 border border-white/70 shadow-xl rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Call Status Overview</h2>
            <StatsContainer>
              <StatCard
                title="Ongoing Calls"
                value={stats?.ongoing_calls}
                icon="phone"
                bgColor="bg-blue-500"
                textColor="text-blue-800"
              />
              <StatCard
                title="Answered"
                value={stats?.answered_calls}
                icon="check-circle"
                bgColor="bg-green-500"
                textColor="text-green-800"
              />
              <StatCard
                title="Not Answered"
                value={stats?.not_answered_calls}
                icon="close-circle"
                bgColor="bg-red-500"
                textColor="text-red-800"
              />
              <StatCard
                title="Busy"
                value={stats?.busy_calls}
                icon="clock"
                bgColor="bg-orange-500"
                textColor="text-orange-800"
              />
              <StatCard
                title="Failed"
                value={stats?.failed_calls}
                icon="warning"
                bgColor="bg-yellow-500"
                textColor="text-yellow-800"
              />
              <StatCard
                title="Total"
                value={stats?.total_calls}
                icon="database"
                bgColor="bg-purple-500"
                textColor="text-purple-800"
              />
            </StatsContainer>
          </div>
          
          {/* Call Metrics Chart */}
          <div className="backdrop-blur-md bg-white/40 border border-white/70 shadow-xl rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Call Metrics</h2>
            <CallMetricsChart stats={stats} />
          </div>
        </motion.div>

        {/* Outcomes and Cost */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          variants={itemVariants}
        >
          {/* Outcome Stats */}
          <div className="backdrop-blur-md bg-white/40 border border-white/70 shadow-xl rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Call Outcomes</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                title="Voicemail"
                value={stats?.voicemail}
                icon="mail"
                bgColor="bg-purple-500"
                textColor="text-purple-800"
              />
              <StatCard
                title="Qualified"
                value={stats?.qualified}
                icon="like"
                bgColor="bg-green-500"
                textColor="text-green-800"
              />
              <StatCard
                title="Not Qualified"
                value={stats?.notqualified}
                icon="dislike"
                bgColor="bg-red-500"
                textColor="text-red-800"
              />
              <StatCard
                title="Callback"
                value={stats?.callback}
                icon="minus"
                bgColor="bg-blue-500"
                textColor="text-blue-800"
              />
              <StatCard
                title="Incomplete"
                value={stats?.incomplete}
                icon="stop"
                bgColor="bg-orange-500"
                textColor="text-orange-800"
              />
              {/* <StatCard
                title="None"
                value={stats?.none}
                icon="question"
                bgColor="bg-gray-500"
                textColor="text-gray-800"
              /> */}
            </div>
          </div>
          
          {/* Outcomes Chart */}
          <div className="backdrop-blur-md bg-white/40 border border-white/70 shadow-xl rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Outcome Distribution</h2>
            <OutcomesPieChart stats={stats} />
          </div>
        </motion.div>

        {/* Call Cost Stats */}
        <motion.div
          className="backdrop-blur-md bg-white/40 border border-white/70 shadow-xl rounded-2xl p-6 mb-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800">Call Cost & Duration</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Calls"
              value={callstats?.total_calls}
              icon="phone"
              bgColor="bg-green-500"
              textColor="text-green-800"
            />
            <StatCard
              title="Total Spend"
              value={callstats?.total_spend ? `$${callstats.total_spend}` : "$0"}
              icon="dollar"
              bgColor="bg-blue-500"
              textColor="text-blue-800"
            />
            <StatCard
              title="Avg Call Cost"
              value={callstats?.average_call_cost ? `$${callstats.average_call_cost}` : "$0"}
              icon="calculator"
              bgColor="bg-orange-500"
              textColor="text-orange-800"
            />
            <StatCard
              title="Total Duration"
              value={callstats?.total_duration ? `${callstats.total_duration}s` : "0s"}
              icon="hourglass"
              bgColor="bg-purple-500"
              textColor="text-purple-800"
            />
            <StatCard
              title="Avg Duration"
              value={callstats?.average_duration ? `${callstats.average_duration}s` : "0s"}
              icon="clock"
              bgColor="bg-red-500"
              textColor="text-red-800"
            />
          </div>
        </motion.div>

        {/* Calls Table Section */}
        <motion.div
          className="backdrop-blur-md bg-white/40 border border-white/70 shadow-xl rounded-2xl overflow-hidden"
          variants={itemVariants}
        >
          {/* Table Controls */}
          <div className="p-6 border-b border-white/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg backdrop-blur-sm font-medium transition-all ${
                  callsTab === "answered"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white/70 text-blue-600 hover:bg-white/90"
                }`}
                onClick={() => setCallsTab("answered")}
              >
                <Badge count={stats?.answered_calls || 0} color="#1890ff">
                  <span className="pr-2">Answered Calls</span>
                </Badge>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg backdrop-blur-sm font-medium transition-all ${
                  callsTab === "not-answered"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white/70 text-blue-600 hover:bg-white/90"
                }`}
                onClick={() => setCallsTab("not-answered")}
              >
                <Badge count={stats?.not_answered_calls || 0} color="#ff4d4f">
                  <span className="pr-2">Not Answered</span>
                </Badge>
              </motion.button>
            </div>

            {callsTab === "answered" && (
              <FilterDropdown 
                filterQuery={filterQuery} 
                setFilterQuery={setFilterQuery} 
              />
            )}
          </div>

          {/* Table */}
          <div className="p-6">
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
            
            {/* Pagination */}
            <Pagination 
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              allOrders={allOrders}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SalesBotStatusDash;