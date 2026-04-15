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
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import {
  DatasheetKPIResult,
  BackgroundJobResponse,
  BulkBackgroundJobResponse,
  JobStatus,
} from "./types";
import { getDatasheetKPIs, getBulkDatasheetsKPIs, getJobStatus, clearDatasheetCache } from "./api";
import {
  StatCard,
  OverviewCard,
  CallPerformanceCard,
  CollectionMetricsCard,
  ExecutionBreakdownCard,
  CampaignsAllocationsCard,
  DatasheetBreakdownCard,
  DispositionDistributionCard,
  DurationMetricsCard,
  CommunicationMetricsCard,
} from "./components";

interface DatasheetKPIDashboardProps {
  datasheetId?: string;
  groupId?: string;
  onBack?: () => void;
  onExecutionClick?: (executionId: string) => void;
}

const DatasheetKPIDashboard: React.FC<DatasheetKPIDashboardProps> = ({
  datasheetId,
  groupId,
  onBack,
  onExecutionClick,
}) => {
  const isBulkMode = !!groupId;
  const { appendRoomParam } = useRoomAPI();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<DatasheetKPIResult | null>(null);
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
            // Clear job state first, then refetch
            setJobId(null);
            setJobStatus(null);
            // Refetch without async to get the cached result
            if (isBulkMode && groupId) {
              const response = await getBulkDatasheetsKPIs({
                group_id: groupId,
                appendRoomParam,
                run_async: false, // Get cached result directly
              });
              if (response && !("job_id" in response)) {
                setKpiData(response as DatasheetKPIResult);
                message.success("KPI data loaded successfully!");
              }
            } else if (datasheetId) {
              const response = await getDatasheetKPIs({
                datasheet_id: datasheetId,
                appendRoomParam,
                run_async: false, // Get cached result directly
              });
              if (response && !("job_id" in response)) {
                setKpiData(response as DatasheetKPIResult);
                message.success("KPI data loaded successfully!");
              }
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
    [appendRoomParam, isBulkMode, groupId, datasheetId]
  );

  // Fetch KPI data
  const fetchKPIData = useCallback(
    async (refresh = false) => {
      if (!datasheetId && !groupId) return;

      try {
        setError(null);
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        let response;

        if (isBulkMode && groupId) {
          // Use bulk API for group
          response = await getBulkDatasheetsKPIs({
            group_id: groupId,
            appendRoomParam,
          });
        } else if (datasheetId) {
          // Use single datasheet API
          response = await getDatasheetKPIs({
            datasheet_id: datasheetId,
            appendRoomParam,
            refresh,
          });
        }

        if (!response) return;

        // Check if it's an async job response
        if ("job_id" in response && response.status === "accepted") {
          const jobResponse = response as BackgroundJobResponse | BulkBackgroundJobResponse;
          setJobId(jobResponse.job_id);
          message.info("Processing KPIs in background...");
          pollJobStatus(jobResponse.job_id);
        } else {
          setKpiData(response as DatasheetKPIResult);
        }
      } catch (err) {
        console.error("Error fetching datasheet KPIs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch datasheet KPIs"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [datasheetId, groupId, isBulkMode, appendRoomParam, pollJobStatus]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    // Only clear cache for single datasheet mode
    if (!isBulkMode && datasheetId) {
      await clearDatasheetCache({
        datasheetId,
        appendRoomParam,
      });
    }
    await fetchKPIData(true);
    message.success("Data refreshed successfully!");
  }, [datasheetId, isBulkMode, appendRoomParam, fetchKPIData]);

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
          <p className="mt-4 text-gray-600">Loading datasheet KPIs...</p>
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
          description="No KPI data available for this datasheet."
          showIcon
        />
      </div>
    );
  }

  // Use summary_stats for quick stats cards
  const summaryStats = kpiData.summary_stats;

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
                  {isBulkMode ? "Bulk Datasheets KPIs" : "Datasheet KPIs"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[300px]">
                  {isBulkMode
                    ? `Group: ${groupId}${kpiData?.datasheets_count ? ` (${kpiData.datasheets_count} datasheets)` : ""}`
                    : `Datasheet: ${datasheetId}`}
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
          {/* Quick Stats Row - Using summary_stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
          >
            <StatCard
              title="Total Calls"
              value={(summaryStats?.total_calls ?? 0).toLocaleString()}
              icon={<FiPhone className="w-5 h-5" />}
              borderColor="blue"
            />
            <StatCard
              title="Connected"
              value={(summaryStats?.connected ?? 0).toLocaleString()}
              subtitle={summaryStats?.connection_rate || "0%"}
              icon={<FiCheckCircle className="w-5 h-5" />}
              borderColor="green"
            />
            <StatCard
              title="Paid"
              value={(summaryStats?.paid_count ?? 0).toLocaleString()}
              icon={<FiCheckCircle className="w-5 h-5" />}
              borderColor="emerald"
            />
            <StatCard
              title="PTP"
              value={(summaryStats?.ptp_count ?? 0).toLocaleString()}
              icon={<FiCalendar className="w-5 h-5" />}
              borderColor="orange"
            />
            <StatCard
              title="Total Amount"
              value={summaryStats?.total_amount || "₹0"}
              icon={<FiDollarSign className="w-5 h-5" />}
              borderColor="purple"
            />
            <StatCard
              title="Total Duration"
              value={summaryStats?.total_duration || "0s"}
              icon={<FiClock className="w-5 h-5" />}
              borderColor="cyan"
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Overview */}
              {kpiData.overview && (
                <OverviewCard
                  overview={kpiData.overview}
                  totalDuration={kpiData.duration_metrics?.total_duration_formatted}
                  totalAmount={kpiData.collection_metrics?.total_amount_formatted}
                />
              )}

              {/* Call Performance */}
              {kpiData.call_performance && (
                <CallPerformanceCard
                  callPerformance={kpiData.call_performance}
                  totalSessions={kpiData.overview?.total_sessions ?? 0}
                />
              )}

              {/* Duration Metrics */}
              {kpiData.duration_metrics && (
                <DurationMetricsCard
                  durationMetrics={kpiData.duration_metrics}
                />
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Collection Metrics */}
              {kpiData.collection_metrics && (
                <CollectionMetricsCard
                  collectionMetrics={kpiData.collection_metrics}
                />
              )}

              {/* Campaigns & Allocations */}
              <CampaignsAllocationsCard
                campaigns={kpiData.campaigns || []}
                allocations={kpiData.allocations || []}
              />

              {/* Disposition Distribution */}
              {kpiData.detailed_breakdowns?.disposition_distribution &&
               kpiData.detailed_breakdowns.disposition_distribution.length > 0 && (
                <DispositionDistributionCard
                  dispositions={kpiData.detailed_breakdowns.disposition_distribution}
                  totalSessions={kpiData.overview?.total_sessions}
                />
              )}

              {/* Communication Metrics */}
              {kpiData.communication_metrics && (
                <CommunicationMetricsCard
                  communicationMetrics={kpiData.communication_metrics}
                />
              )}
            </div>
          </div>

          {/* Datasheet Breakdown with Nested Executions - Full Width (Bulk Mode Only) */}
          {isBulkMode && kpiData.datasheet_breakdown && kpiData.datasheet_breakdown.length > 0 && (
            <div className="mb-6">
              <DatasheetBreakdownCard
                datasheets={kpiData.datasheet_breakdown}
                executions={kpiData.execution_breakdown}
                onExecutionClick={onExecutionClick}
              />
            </div>
          )}

          {/* Execution Breakdown - Full Width (Single Datasheet Mode Only) */}
          {!isBulkMode && kpiData.execution_breakdown && kpiData.execution_breakdown.length > 0 && (
            <div className="mb-6">
              <ExecutionBreakdownCard
                executions={kpiData.execution_breakdown}
                onExecutionClick={onExecutionClick}
              />
            </div>
          )}

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

export default DatasheetKPIDashboard;
