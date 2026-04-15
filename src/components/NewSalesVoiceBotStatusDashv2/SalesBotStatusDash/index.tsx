/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { FiBarChart2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Spin, Tabs, Button, Modal } from "antd";
import axiosInstance from "@/lib/axios";
import { ExecutionKPIDashboard } from "@/components/ExecutionKPI";
// import { useRouter } from "next/navigation";
import CallStatsTab from "./CallStatsTab";
import FinancialTab from "./FinancialTab";
import CallsListTab from "./CallsListTab";
import CampaignInfoCard from "./CampaignInfoCard";
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import { useAppSelector } from "@/redux/store";

const SalesBotStatusDash: React.FC<any> = ({ selectedId }) => {
  const { selectedRoom, appendRoomParam } = useRoomAPI();
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
        "disposition_codes": {
            "PAYNOW": {
                "count": 0,
                "amount": 0.0
            },
            "RTP": {
                "count": 0,
                "amount": 0.0
            },
            "CLBK": {
                "count": 0,
                "amount": 0.0
            },
            "RTPF": {
                "count": 0,
                "amount": 0.0
            },
            "None": {
                "count": 0,
                "amount": 0.0
            },
            "PAID": {
                "count": 0,
                "amount": 0.0
            },
            "PTP": {
                "count": 0,
                "amount": 0.0
            }
        },
        "conversation_stages": {},
        "user_cooperation_levels": {},
        "information_status": {},
        "language_distribution": {},
        "interruption_patterns": {},
        "conversation_strategies": {},
        "interruption_statistics": {
            "avg_interruptions": 0,
            "max_interruptions": 0,
            "min_interruptions": 0
        },
        "commitment_statistics": {
            "commitment_date_set": 0,
            "no_commitment_date": 0
        }
    });
  const [callstats, setCallstats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const isWordWorksUser = user?.username?.includes('@wordworksai.com');

  // const router = useRouter();

  const getOrder = async () => {
    try {
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/executions/${selectedId}?api_key=${API_KEY}`)
      );
      const orderData = res.data.data;
      setCurrOrder(orderData);

      // If call_metrics exists in the response, use it instead of calling getStats
      if (orderData?.call_metrics) {
        setStats(orderData.call_metrics);
      }

      // If call_cost_stats exists in the response, use it instead of calling getCostCallStats
      if (orderData?.call_cost_stats) {
        setCallstats(orderData.call_cost_stats);
      }
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

  const getRunEveryTenSeconds = async () => {
    if (selectedId && currOrder?.status === "processing") {
      getOrder();

      // Only call getStats if call_metrics doesn't exist in currOrder
      if (!currOrder?.call_metrics) {
        getStats();
      }

      // Only call getCostCallStats if call_cost_stats doesn't exist in currOrder
      if (!currOrder?.call_cost_stats) {
        getCostCallStats();
      }
    }
  };

  useEffect(() => {
    const intervalId = setInterval(getRunEveryTenSeconds, 10000);
    if (selectedId) {
      // Always fetch order first (it may contain call_metrics and call_cost_stats)
      getOrder();
    }

    return () => clearInterval(intervalId);
  }, [selectedId, selectedRoom]);

  // Fetch missing data after currOrder is loaded
  useEffect(() => {
    if (currOrder && selectedId) {
      // Only call getStats if call_metrics doesn't exist in currOrder
      if (!currOrder?.call_metrics) {
        getStats();
      }

      // Only call getCostCallStats if call_cost_stats doesn't exist in currOrder
      if (!currOrder?.call_cost_stats) {
        getCostCallStats();
      }
    }
  }, [currOrder]);

  const tabItems = [
    {
      key: "1",
      label: <span className="text-xs sm:text-sm font-medium">Info</span>,
      children: <CampaignInfoCard currOrder={currOrder} />,
    },
    {
      key: "2",
      label: <span className="text-xs sm:text-sm font-medium">Call Stats</span>,
      children: <CallStatsTab executionId={selectedId} />,
    },
    ...(isWordWorksUser
      ? [{
          key: "3",
          label: <span className="text-xs sm:text-sm font-medium">Financial</span>,
          children: <FinancialTab callstats={callstats} />,
        }]
      : []),
    {
      key: "4",
      label: <span className="text-xs sm:text-sm font-medium">Calls List</span>,
      children: (
        <CallsListTab
          selectedId={selectedId}
          stats={stats}
          API_BASE_URL={API_BASE_URL}
          API_KEY={API_KEY}
        />
      ),
    },
  ];

  return (
    <AnimatePresence>
      {!currOrder ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="min-h-screen w-full flex items-center justify-center px-4 bg-white"
        >
          <div className="flex flex-col items-center gap-3">
            <Spin size="large" />
            <span className="text-sm text-gray-500">Loading dashboard...</span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full min-h-screen bg-white"
        >
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-3 sm:mb-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* <FiArrowLeft
                    size={24}
                    className="cursor-pointer text-[#263978] hover:text-[#1e2a5a] transition-colors sm:text-[28px]"
                    onClick={() => router.push("/projects")}
                  /> */}
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#263978]">Dashboard</h1>
                  <Button
                    type="primary"
                    icon={<FiBarChart2 />}
                    onClick={() => setKpiModalOpen(true)}
                    className="flex items-center gap-1"
                    style={{ backgroundColor: "#263978" }}
                  >
                    KPI Overview
                  </Button>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor your campaign performance and analytics</p>
            </motion.div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="dashboard-tabs"
            size="small"
            tabBarGutter={8}
            items={tabItems}
          />

          {/* KPI Overview Modal */}
          <Modal
            open={kpiModalOpen}
            onCancel={() => setKpiModalOpen(false)}
            footer={null}
            width="100vw"
            style={{ maxWidth: "100vw", top: 0, margin: 0, padding: 0 }}
            styles={{
              body: { padding: 0, height: "100vh", overflow: "hidden" },
              content: { padding: 0, borderRadius: 0 },
            }}
            destroyOnClose
            className="kpi-modal-fullscreen"
          >
            <ExecutionKPIDashboard
              executionId={selectedId}
              onBack={() => setKpiModalOpen(false)}
            />
          </Modal>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalesBotStatusDash;
