"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spin, Alert, Button, Tooltip, message, Progress } from "antd";
import {
  FiRefreshCw,
  FiArrowLeft,
  FiPhone,
  FiClock,
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiHash,
} from "react-icons/fi";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import {
  SessionKPIResponse,
  BackgroundJobResponse,
  JobStatus,
  CallStatusCategory,
} from "./types";
import { getSessionKPIs, getJobStatus, clearSessionCache } from "./api";
import {
  formatDuration,
  getCallStatusCategory,
  getCallStatusColor,
  getPaymentStatusText,
  getPaymentStatusColor,
} from "./utils";
import {
  StatCard,
  CustomerInfoCard,
  CallPerformanceCard,
  PaymentInfoCard,
  AttemptHistoryCard,
  CallSummaryCard,
  CurrentAttemptInfoCard,
} from "./components";

interface SessionKPIDashboardProps {
  sessionId: string;
  onBack?: () => void;
}

const SessionKPIDashboard: React.FC<SessionKPIDashboardProps> = ({
  sessionId,
  onBack,
}) => {
  const { appendRoomParam } = useRoomAPI();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<SessionKPIResponse | null>(null);
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
            const response = await getSessionKPIs({
              session_id: sessionId,
              appendRoomParam,
              run_async: false, // Get cached result directly
            });
            if (response && !("job_id" in response)) {
              setKpiData(response as SessionKPIResponse);
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
    [appendRoomParam, sessionId]
  );

  // Fetch KPI data
  const fetchKPIData = useCallback(
    async (refresh = false) => {
      if (!sessionId) return;

      try {
        setError(null);
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getSessionKPIs({
          session_id: sessionId,
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
          setKpiData(response as SessionKPIResponse);
        }
      } catch (err) {
        console.error("Error fetching session KPIs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch session KPIs"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sessionId, appendRoomParam, pollJobStatus]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await clearSessionCache({
      sessionId,
      appendRoomParam,
    });
    await fetchKPIData(true);
    message.success("Data refreshed successfully!");
  }, [sessionId, appendRoomParam, fetchKPIData]);

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
          <p className="mt-4 text-gray-600">Loading session KPIs...</p>
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
          description="No KPI data available for this session."
          showIcon
        />
      </div>
    );
  }

  // Get derived data for stat cards
  const statusCategory = kpiData.call_performance?.call_status?.category ||
    getCallStatusCategory(
      kpiData.call_performance?.call_status?.status ||
      kpiData.call_performance?.call_status?.raw_status || ""
    );
  const statusColor = getCallStatusColor(statusCategory as CallStatusCategory);
  const isPaid = kpiData.payment_info?.payment_status?.is_paid || false;
  const hasPtp = kpiData.payment_info?.ptp_details?.has_ptp || false;
  const paymentStatusText = getPaymentStatusText(isPaid, hasPtp);
  const paymentStatusColor = getPaymentStatusColor(isPaid, hasPtp);

  // Get summary data for current/previous comparison
  const currentAttempt = kpiData.summary?.current_attempt || kpiData.attempt_analysis?.current_attempt_number || 1;
  const previousAttempts = kpiData.summary?.previous_attempts || kpiData.attempt_analysis?.previous_attempts_count || 0;
  const hasPtpPrevious = kpiData.summary?.has_ptp_previous;
  const isPaidPrevious = kpiData.summary?.is_paid_previous;

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
                  Session KPIs
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Session: {sessionId}
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

        {/* Call Summary - Prominent Display (REQUIRED field) */}
        {kpiData.call_summary && (
          <div className="mb-6">
            <CallSummaryCard
              callSummary={kpiData.call_summary}
              disposition={kpiData.current_attempt_info?.disposition_code || kpiData.summary?.current_disposition}
              outcome={kpiData.current_attempt_info?.outcome || kpiData.summary?.current_outcome}
            />
          </div>
        )}

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <StatCard
            title="Call Status"
            value={statusCategory}
            icon={<FiPhone className="w-5 h-5" />}
            borderColor={statusColor}
          />
          <StatCard
            title="Duration"
            value={
              kpiData.call_performance?.duration?.formatted_duration ||
              formatDuration(kpiData.call_performance?.duration?.total_seconds || kpiData.call_performance?.duration?.seconds || 0)
            }
            icon={<FiClock className="w-5 h-5" />}
            borderColor="blue"
          />
          <StatCard
            title="Payment Status"
            value={paymentStatusText}
            subtitle={
              hasPtp && kpiData.payment_info?.ptp_details?.ptp_date
                ? `PTP: ${kpiData.payment_info.ptp_details.ptp_date}`
                : undefined
            }
            icon={
              isPaid ? (
                <FiCheckCircle className="w-5 h-5" />
              ) : hasPtp ? (
                <FiCalendar className="w-5 h-5" />
              ) : (
                <FiUsers className="w-5 h-5" />
              )
            }
            borderColor={paymentStatusColor}
          />
          <StatCard
            title="Attempt"
            value={`${currentAttempt} / ${kpiData.attempt_analysis?.total_attempts || currentAttempt}`}
            subtitle={previousAttempts > 0 ? `${previousAttempts} previous` : "First attempt"}
            icon={<FiHash className="w-5 h-5" />}
            borderColor="purple"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <CustomerInfoCard
              customerInfo={kpiData.customer_info}
              sessionIdentification={kpiData.session_identification}
            />

            {/* Call Performance */}
            <CallPerformanceCard callPerformance={kpiData.call_performance} />

            {/* Current Attempt Info */}
            {kpiData.current_attempt_info && (
              <CurrentAttemptInfoCard
                currentAttemptInfo={kpiData.current_attempt_info}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Payment Information */}
            <PaymentInfoCard
              paymentInfo={kpiData.payment_info}
              hasPtpPrevious={hasPtpPrevious}
              isPaidPrevious={isPaidPrevious}
            />

            {/* Attempt History */}
            {kpiData.attempt_analysis && (
              <AttemptHistoryCard attemptAnalysis={kpiData.attempt_analysis} />
            )}
          </div>
        </div>

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

export default SessionKPIDashboard;
