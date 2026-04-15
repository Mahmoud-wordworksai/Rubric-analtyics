import axiosInstance from '@/lib/axios';
import { API_BASE_URL, API_KEY } from '@/constants';
import {
  SessionKPIResponse,
  SessionSummaryResponse,
  BackgroundJobResponse,
  JobStatus,
} from './types';

// Local Storage Keys
const BACKGROUND_JOBS_KEY = 'kpi_background_jobs';

// Types for API params
export interface SessionKPIApiParams {
  session_id: string;
  appendRoomParam: (url: string) => string;
  refresh?: boolean;
  run_async?: boolean;
}

export interface ClearCacheParams {
  sessionId: string;
  appendRoomParam: (url: string) => string;
  cacheType?: 'full' | 'summary';
}

export interface JobStatusParams {
  jobId: string;
  appendRoomParam: (url: string) => string;
}

/**
 * Get full KPIs for a single session
 */
export const getSessionKPIs = async (
  params: SessionKPIApiParams
): Promise<SessionKPIResponse | BackgroundJobResponse> => {
  const { session_id, appendRoomParam, refresh = false, run_async = true } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('api_key', API_KEY);
  if (refresh) queryParams.append('refresh', 'true');
  queryParams.append('run_async', String(run_async));

  const url = appendRoomParam(
    `${API_BASE_URL}/kpi-analytics/session/${session_id}?${queryParams.toString()}`
  );

  const response = await axiosInstance.get(url);

  // If async job started, store job ID
  if (response.data.status === 'accepted' && response.data.job_id) {
    storeBackgroundJob(response.data);
  }

  return response.data;
};

/**
 * Get session summary (lightweight)
 */
export const getSessionSummary = async (
  params: SessionKPIApiParams
): Promise<SessionSummaryResponse | BackgroundJobResponse> => {
  const { session_id, appendRoomParam, refresh = false, run_async = true } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('api_key', API_KEY);
  if (refresh) queryParams.append('refresh', 'true');
  queryParams.append('run_async', String(run_async));

  const url = appendRoomParam(
    `${API_BASE_URL}/kpi-analytics/session/${session_id}/summary?${queryParams.toString()}`
  );

  const response = await axiosInstance.get(url);

  if (response.data.status === 'accepted' && response.data.job_id) {
    storeBackgroundJob(response.data);
  }

  return response.data;
};

/**
 * Get background job status
 */
export const getJobStatus = async (params: JobStatusParams): Promise<JobStatus> => {
  const { jobId, appendRoomParam } = params;

  const url = appendRoomParam(
    `${API_BASE_URL}/kpi-analytics/jobs/${jobId}?api_key=${API_KEY}`
  );

  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Clear session cache
 */
export const clearSessionCache = async (
  params: ClearCacheParams
): Promise<{ status: string; message: string }> => {
  const { sessionId, appendRoomParam, cacheType } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('api_key', API_KEY);
  if (cacheType) queryParams.append('cache_type', cacheType);

  const url = appendRoomParam(
    `${API_BASE_URL}/kpi-analytics/session/${sessionId}/cache?${queryParams.toString()}`
  );

  const response = await axiosInstance.delete(url);
  return response.data;
};

// ==================== Background Jobs Local Storage ====================

interface StoredJob {
  job_id: string;
  target_type: 'session' | 'execution' | 'datasheet';
  target_id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  check_status_url: string;
}

/**
 * Store background job in local storage
 */
export const storeBackgroundJob = (jobResponse: BackgroundJobResponse): void => {
  try {
    const existingJobs = getStoredBackgroundJobs();

    const newJob: StoredJob = {
      job_id: jobResponse.job_id,
      target_type: 'session',
      target_id: '',
      created_at: new Date().toISOString(),
      status: 'pending',
      check_status_url: jobResponse.check_status_url,
    };

    // Add new job, keep only last 50 jobs
    const updatedJobs = [newJob, ...existingJobs].slice(0, 50);

    localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(updatedJobs));
  } catch (error) {
    console.error('Failed to store background job:', error);
  }
};

/**
 * Get stored background jobs from local storage
 */
export const getStoredBackgroundJobs = (): StoredJob[] => {
  try {
    const stored = localStorage.getItem(BACKGROUND_JOBS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get stored background jobs:', error);
    return [];
  }
};

/**
 * Update job status in local storage
 */
export const updateStoredJobStatus = (
  jobId: string,
  status: StoredJob['status']
): void => {
  try {
    const jobs = getStoredBackgroundJobs();
    const updatedJobs = jobs.map((job) =>
      job.job_id === jobId ? { ...job, status } : job
    );
    localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(updatedJobs));
  } catch (error) {
    console.error('Failed to update job status:', error);
  }
};

/**
 * Remove completed/failed jobs older than specified hours
 */
export const cleanupOldJobs = (olderThanHours: number = 24): void => {
  try {
    const jobs = getStoredBackgroundJobs();
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    const filteredJobs = jobs.filter((job) => {
      const jobTime = new Date(job.created_at);
      // Keep pending/processing jobs regardless of age
      if (job.status === 'pending' || job.status === 'processing') {
        return true;
      }
      // Keep completed/failed jobs that are newer than cutoff
      return jobTime > cutoffTime;
    });

    localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(filteredJobs));
  } catch (error) {
    console.error('Failed to cleanup old jobs:', error);
  }
};

/**
 * Remove a specific job from local storage
 */
export const removeStoredJob = (jobId: string): void => {
  try {
    const jobs = getStoredBackgroundJobs();
    const filteredJobs = jobs.filter((job) => job.job_id !== jobId);
    localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(filteredJobs));
  } catch (error) {
    console.error('Failed to remove job:', error);
  }
};
