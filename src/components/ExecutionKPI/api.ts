import axiosInstance from '@/lib/axios';
import {
  ExecutionKPIResult,
  ExecutionSummary,
  ExecutionSessionsResponse,
  BackgroundJobResponse,
  JobStatus,
  GetExecutionKPIsParams,
  GetExecutionSummaryParams,
  GetExecutionSessionsParams,
  GetJobStatusParams,
  ClearExecutionCacheParams,
} from './types';

import { API_BASE_URL } from '@/constants';

const BASE_URL = `${API_BASE_URL}/kpi-analytics`;

// Local Storage key for tracking background jobs
const BACKGROUND_JOBS_KEY = 'execution_kpi_background_jobs';

// Store job in localStorage
export const storeBackgroundJob = (job: { job_id: string; execution_id: string; created_at: string }) => {
  try {
    const jobs = getStoredBackgroundJobs();
    jobs.push(job);
    localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.error('Error storing background job:', error);
  }
};

// Get stored background jobs
export const getStoredBackgroundJobs = (): Array<{ job_id: string; execution_id: string; created_at: string }> => {
  try {
    const stored = localStorage.getItem(BACKGROUND_JOBS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading background jobs:', error);
    return [];
  }
};

// Remove job from localStorage
export const removeBackgroundJob = (jobId: string) => {
  try {
    const jobs = getStoredBackgroundJobs();
    const filtered = jobs.filter(j => j.job_id !== jobId);
    localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing background job:', error);
  }
};

// Get Execution KPIs
export const getExecutionKPIs = async ({
  execution_id,
  appendRoomParam,
  refresh = false,
  run_async = true,
  include_detailed_breakdown = true,
  include_time_series = false,
}: GetExecutionKPIsParams): Promise<ExecutionKPIResult | BackgroundJobResponse> => {
  const params = new URLSearchParams();
  if (refresh) params.append('refresh', 'true');
  params.append('run_async', String(run_async));
  if (include_detailed_breakdown) params.append('include_detailed_breakdown', 'true');
  if (include_time_series) params.append('include_time_series', 'true');

  const queryString = params.toString();
  let url = `${BASE_URL}/execution/${execution_id}${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);

  // If async job, store in localStorage
  if (response.data.status === 'accepted' && response.data.job_id) {
    storeBackgroundJob({
      job_id: response.data.job_id,
      execution_id,
      created_at: new Date().toISOString(),
    });
  }

  return response.data;
};

// Get Execution Summary
export const getExecutionSummary = async ({
  execution_id,
  appendRoomParam,
  refresh = false,
  run_async = true,
}: GetExecutionSummaryParams): Promise<ExecutionSummary> => {
  const params = new URLSearchParams();
  if (refresh) params.append('refresh', 'true');
  params.append('run_async', String(run_async));

  const queryString = params.toString();
  let url = `${BASE_URL}/execution/${execution_id}/summary${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  return response.data;
};

// Get Execution Sessions (paginated)
export const getExecutionSessions = async ({
  execution_id,
  appendRoomParam,
  page = 1,
  limit = 20,
  sort_by = 'created_at',
  sort_order = -1,
  call_status,
  run_async = true,
}: GetExecutionSessionsParams): Promise<ExecutionSessionsResponse> => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sort_by', sort_by);
  params.append('sort_order', String(sort_order));
  params.append('run_async', String(run_async));
  if (call_status) params.append('call_status', call_status);

  let url = `${BASE_URL}/execution/${execution_id}/sessions?${params.toString()}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  return response.data;
};

// Get Job Status
export const getJobStatus = async ({
  jobId,
  appendRoomParam,
}: GetJobStatusParams): Promise<JobStatus> => {
  let url = `${BASE_URL}/jobs/${jobId}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);

  // Remove from localStorage if completed or failed
  if (response.data.status === 'completed' || response.data.status === 'failed') {
    removeBackgroundJob(jobId);
  }

  return response.data;
};

// Clear Execution Cache
export const clearExecutionCache = async ({
  executionId,
  appendRoomParam,
  cache_type,
}: ClearExecutionCacheParams): Promise<{ status: string; message: string }> => {
  const params = new URLSearchParams();
  if (cache_type) params.append('cache_type', cache_type);

  const queryString = params.toString();
  let url = `${BASE_URL}/execution/${executionId}/cache${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.delete(url);
  return response.data;
};

// Clear All Sessions Cache for Execution
export const clearExecutionSessionsCache = async ({
  executionId,
  appendRoomParam,
}: Omit<ClearExecutionCacheParams, 'cache_type'>): Promise<{ status: string; message: string; sessions_updated: number }> => {
  let url = `${BASE_URL}/execution/${executionId}/sessions/cache`;
  url = appendRoomParam(url);

  const response = await axiosInstance.delete(url);
  return response.data;
};
