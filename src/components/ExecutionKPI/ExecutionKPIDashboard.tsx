"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spin, Alert, Button, Tooltip, message, Progress } from "antd";
import {
  FiRefreshCw,
  FiArrowLeft,
  FiPhone,
  FiCheckCircle,
  FiCalendar,
} from "react-icons/fi";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import {
  ExecutionKPIResult,
  BackgroundJobResponse,
  JobStatus,
} from "./types";
import { getExecutionKPIs, getJobStatus, clearExecutionCache } from "./api";
import {
  StatCard,
  OverviewCard,
  CallPerformanceCard,
  CollectionMetricsCard,
  DurationMetricsCard,
  BreakdownCard,
  QuickInsightsCard,
  SessionsListCard,
} from "./components";

interface ExecutionKPIDashboardProps {
  executionId: string;
  onBack?: () => void;
  onSessionClick?: (sessionId: string) => void;
}

const ExecutionKPIDashboard: React.FC<ExecutionKPIDashboardProps> = ({
  executionId,
  onBack,
  onSessionClick,
}) => {
  const { appendRoomParam } = useRoomAPI();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<ExecutionKPIResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Poll job status for async operations
  const pollJobStatus = useCallback(
    async (id: string) => {
      try {
        const status = await getJobStatus({
          jobId: id,
          appendRoomParam,
        });
        setJobStatus(status);

        if (status.status === "completed") {
          if (status.result) {
            setKpiData(status.result);
            message.success("KPI data loaded successfully!");
          } else {
            // Job completed but no result in response, refetch the data
            console.log("Job completed but no result, refetching data...");
            message.info("Job completed, loading data...");
            setJobId(null);
            setJobStatus(null);
            // Refetch without async to get the cached result
            const response = await getExecutionKPIs({
              execution_id: executionId,
              appendRoomParam,
              run_async: false, // Get cached result directly
            });
            if (response && !("job_id" in response)) {
              setKpiData(response as ExecutionKPIResult);
              message.success("KPI data loaded successfully!");
            }
            return;
          }
          setJobId(null);
          setJobStatus(null);
        } else if (status.status === "failed") {
          setError(status.error || "Background job failed");
          setJobId(null);
          setJobStatus(null);
        } else if (status.status === "pending" || status.status === "processing") {
          // Continue polling
          setTimeout(() => pollJobStatus(id), 2000);
        }
      } catch (err) {
        console.error("Error polling job status:", err);
        setJobId(null);
        setJobStatus(null);
      }
    },
    [appendRoomParam, executionId]
  );

  // Fetch KPI data
  const fetchKPIData = useCallback(
    async (refresh = false) => {
      if (!executionId) return;

      try {
        setError(null);
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getExecutionKPIs({
          execution_id: executionId,
          appendRoomParam,
          refresh,
        });

        // Check if it's an async job response
        if ("job_id" in response && response.status === "accepted") {
          const jobResponse = response as BackgroundJobResponse;
          setJobId(jobResponse.job_id);
          message.info("Processing KPIs in background...");
          pollJobStatus(jobResponse.job_id);
        } else {
          setKpiData(response as ExecutionKPIResult);
        }
      } catch (err) {
        console.error("Error fetching execution KPIs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch execution KPIs"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [executionId, appendRoomParam, pollJobStatus]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await clearExecutionCache({
      executionId,
      appendRoomParam,
    });
    await fetchKPIData(true);
    message.success("Data refreshed successfully!");
  }, [executionId, appendRoomParam, fetchKPIData]);

  // Initial fetch
  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Loading execution KPIs...</p>
        </div>
      </div>
    );
  }

  // Render job processing state
  if (jobId && jobStatus) {
    const progressPercent = jobStatus.progress_percentage ?? 0;
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-6">
          <Progress
            type="circle"
            percent={progressPercent}
            status="active"
            strokeColor="#263978"
          />
          <h3 className="mt-4 text-lg font-semibold text-[#263978]">
            Processing KPIs...
          </h3>
          {jobStatus.progress_message && (
            <p className="mt-2 text-gray-600">{jobStatus.progress_message}</p>
          )}
          <p className="mt-2 text-gray-500 text-sm">
            Status: <span className="font-medium capitalize">{jobStatus.status}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Job ID: {jobId}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
        <Alert
          type="error"
          message="Error Loading KPIs"
          description={error}
          showIcon
          action={
            <Button size="small" onClick={() => fetchKPIData()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  // No data state
  if (!kpiData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
        <Alert
          type="warning"
          message="No Data Found"
          description="No KPI data available for this execution."
          showIcon
        />
      </div>
    );
  }

  // Get PTP and Paid from disposition distribution (case-insensitive)
  const ptpData = kpiData.detailed_breakdowns?.disposition_distribution?.find(
    (item) => item.disposition?.toLowerCase() === "ptp"
  );
  const ptpCount = ptpData?.count || 0;

  const paidData = kpiData.detailed_breakdowns?.disposition_distribution?.find(
    (item) => item.disposition?.toLowerCase() === "paid"
  );
  const paidCount = paidData?.count || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-screen bg-white flex flex-col"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  type="text"
                  icon={<FiArrowLeft className="w-5 h-5" />}
                  onClick={onBack}
                  className="flex items-center justify-center"
                />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#263978]">
                  Execution KPIs
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[300px]">
                  Execution: {executionId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {kpiData._cached && (
                <Tooltip title="Data retrieved from cache">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    Cached
                  </span>
                </Tooltip>
              )}
              <Button
                icon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
                onClick={handleRefresh}
                loading={refreshing}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Quick Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <StatCard
              title="Total Sessions"
              value={kpiData.overview.total_sessions.toLocaleString()}
              icon={<FiPhone className="w-5 h-5" />}
              borderColor="blue"
            />
            <StatCard
              title="Connected Calls"
              value={kpiData.call_performance.connected_calls.toLocaleString()}
              subtitle={`${kpiData.call_performance.connection_rate.toFixed(1)}% rate`}
              icon={<FiPhone className="w-5 h-5" />}
              borderColor="green"
            />
            <StatCard
              title="Paid"
              value={paidCount.toLocaleString()}
              subtitle={kpiData.call_performance.connected_calls > 0
                ? `${((paidCount / kpiData.call_performance.connected_calls) * 100).toFixed(1)}% of connected`
                : "0%"}
              icon={<FiCheckCircle className="w-5 h-5" />}
              borderColor="green"
            />
            <StatCard
              title="PTP"
              value={ptpCount.toLocaleString()}
              subtitle={kpiData.call_performance.connected_calls > 0
                ? `${((ptpCount / kpiData.call_performance.connected_calls) * 100).toFixed(1)}% of connected`
                : "0%"}
              icon={<FiCalendar className="w-5 h-5" />}
              borderColor="blue"
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Overview */}
              <OverviewCard overview={kpiData.overview} />

              {/* Call Performance */}
              <CallPerformanceCard callPerformance={kpiData.call_performance} />

              {/* Duration Metrics */}
              {kpiData.duration_metrics && (
                <DurationMetricsCard durationMetrics={kpiData.duration_metrics} />
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Collection Metrics */}
              <CollectionMetricsCard
                collectionMetrics={kpiData.collection_metrics}
                dispositionDistribution={kpiData.detailed_breakdowns?.disposition_distribution}
                connectedCalls={kpiData.call_performance.connected_calls}
              />

              {/* Detailed Breakdowns */}
              {kpiData.detailed_breakdowns && (
                <BreakdownCard breakdowns={kpiData.detailed_breakdowns} />
              )}

              {/* Quick Insights */}
              <QuickInsightsCard
                insights={kpiData.quick_insights || []}
                dispositionDistribution={kpiData.detailed_breakdowns?.disposition_distribution}
                connectedCalls={kpiData.call_performance.connected_calls}
              />
            </div>
          </div>

          {/* Sessions List - Full Width */}
          <SessionsListCard
            executionId={executionId}
            appendRoomParam={appendRoomParam}
            onSessionClick={onSessionClick}
          />

          {/* Footer - Cache Info */}
          {kpiData.generated_at && (
            <div className="mt-6 pb-4 text-center text-xs text-gray-400">
              Generated at: {new Date(kpiData.generated_at).toLocaleString()}
            </div>
          )}
        </div>
        {/* End of Scrollable Content */}
      </motion.div>
    </AnimatePresence>
  );
};

export default ExecutionKPIDashboard;
