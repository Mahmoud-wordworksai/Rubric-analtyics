import axiosInstance from '@/lib/axios';
import {
  DatasheetKPIResult,
  DatasheetSummary,
  DatasheetExecutionsResponse,
  BackgroundJobResponse,
  BulkBackgroundJobResponse,
  JobStatus,
  GetDatasheetKPIsParams,
  GetBulkDatasheetsKPIsParams,
  GetDatasheetSummaryParams,
  GetDatasheetExecutionsParams,
  GetJobStatusParams,
  ClearDatasheetCacheParams,
} from './types';

import { API_BASE_URL } from '@/constants';

const BASE_URL = `${API_BASE_URL}/kpi-analytics`;

// Local Storage key for tracking background jobs
const BACKGROUND_JOBS_KEY = 'datasheet_kpi_background_jobs';

// Store job in localStorage
export const storeBackgroundJob = (job: { job_id: string; datasheet_id: string; created_at: string }) => {
  try {
    const jobs = getStoredBackgroundJobs();
    jobs.push(job);
    localStorage.setItem(BACKGROUND_JOBS_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.error('Error storing background job:', error);
  }
};

// Get stored background jobs
export const getStoredBackgroundJobs = (): Array<{ job_id: string; datasheet_id: string; created_at: string }> => {
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

// Get Datasheet KPIs
export const getDatasheetKPIs = async ({
  datasheet_id,
  appendRoomParam,
  refresh = false,
  run_async = true,
  include_execution_breakdown = true,
}: GetDatasheetKPIsParams): Promise<DatasheetKPIResult | BackgroundJobResponse> => {
  const params = new URLSearchParams();
  if (refresh) params.append('refresh', 'true');
  params.append('run_async', String(run_async));
  if (include_execution_breakdown) params.append('include_execution_breakdown', 'true');

  const queryString = params.toString();
  let url = `${BASE_URL}/datasheet/${datasheet_id}${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);

  // If async job, store in localStorage
  if (response.data.status === 'accepted' && response.data.job_id) {
    storeBackgroundJob({
      job_id: response.data.job_id,
      datasheet_id,
      created_at: new Date().toISOString(),
    });
  }

  return response.data;
};

// Get Datasheet Summary
export const getDatasheetSummary = async ({
  datasheet_id,
  appendRoomParam,
  refresh = false,
  run_async = true,
}: GetDatasheetSummaryParams): Promise<DatasheetSummary> => {
  const params = new URLSearchParams();
  if (refresh) params.append('refresh', 'true');
  params.append('run_async', String(run_async));

  const queryString = params.toString();
  let url = `${BASE_URL}/datasheet/${datasheet_id}/summary${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  return response.data;
};

// Get Datasheet Executions (paginated)
export const getDatasheetExecutions = async ({
  datasheet_id,
  appendRoomParam,
  page = 1,
  limit = 20,
  sort_by = 'created_at',
  sort_order = -1,
  run_async = true,
}: GetDatasheetExecutionsParams): Promise<DatasheetExecutionsResponse> => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sort_by', sort_by);
  params.append('sort_order', String(sort_order));
  params.append('run_async', String(run_async));

  let url = `${BASE_URL}/datasheet/${datasheet_id}/executions?${params.toString()}`;
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

// Clear Datasheet Cache
export const clearDatasheetCache = async ({
  datasheetId,
  appendRoomParam,
  cache_type,
}: ClearDatasheetCacheParams): Promise<{ status: string; message: string }> => {
  const params = new URLSearchParams();
  if (cache_type) params.append('cache_type', cache_type);

  const queryString = params.toString();
  let url = `${BASE_URL}/datasheet/${datasheetId}/cache${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.delete(url);
  return response.data;
};

// Get Bulk Datasheets KPIs
export const getBulkDatasheetsKPIs = async ({
  group_id,
  datasheet_ids,
  appendRoomParam,
  run_async = true,
  include_execution_breakdown = true,
  include_datasheet_breakdown = true,
}: GetBulkDatasheetsKPIsParams): Promise<DatasheetKPIResult | BulkBackgroundJobResponse> => {
  const params = new URLSearchParams();

  if (group_id) params.append('group_id', group_id);
  if (datasheet_ids && datasheet_ids.length > 0) {
    params.append('datasheet_ids', datasheet_ids.join(','));
  }
  params.append('run_async', String(run_async));
  if (include_execution_breakdown) params.append('include_execution_breakdown', 'true');
  if (include_datasheet_breakdown) params.append('include_datasheet_breakdown', 'true');

  const queryString = params.toString();
  let url = `${BASE_URL}/datasheets/bulk${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);

  // If async job, store in localStorage with group_id
  if (response.data.status === 'accepted' && response.data.job_id) {
    storeBackgroundJob({
      job_id: response.data.job_id,
      datasheet_id: group_id || 'bulk',
      created_at: new Date().toISOString(),
    });
  }

  return response.data;
};
