import axiosInstance from '@/lib/axios';
import { API_BASE_URL } from '@/constants';
import {
  StartConsolidationParams,
  StartConsolidationResponse,
  GetJobStatusParams,
  JobStatusResponse,
  DownloadReportParams,
  ListJobsParams,
  ListJobsResponse,
  StoredJob,
  ConsolidationType,
  ConsolidationFilters,
} from './types';

const BASE_URL = `${API_BASE_URL}/datasheets/consolidation`;

// Local Storage key for tracking consolidation jobs
const CONSOLIDATION_JOBS_KEY = 'datasheet_consolidation_jobs';

// Store job in localStorage
export const storeConsolidationJob = (job: StoredJob) => {
  try {
    const jobs = getStoredConsolidationJobs();
    // Avoid duplicates
    const exists = jobs.some((j) => j.job_id === job.job_id);
    if (!exists) {
      jobs.push(job);
      localStorage.setItem(CONSOLIDATION_JOBS_KEY, JSON.stringify(jobs));
    }
  } catch (error) {
    console.error('Error storing consolidation job:', error);
  }
};

// Get stored consolidation jobs
export const getStoredConsolidationJobs = (): StoredJob[] => {
  try {
    const stored = localStorage.getItem(CONSOLIDATION_JOBS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading consolidation jobs:', error);
    return [];
  }
};

// Remove job from localStorage
export const removeConsolidationJob = (jobId: string) => {
  try {
    const jobs = getStoredConsolidationJobs();
    const filtered = jobs.filter((j) => j.job_id !== jobId);
    localStorage.setItem(CONSOLIDATION_JOBS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing consolidation job:', error);
  }
};

// Clear all stored jobs
export const clearStoredConsolidationJobs = () => {
  try {
    localStorage.removeItem(CONSOLIDATION_JOBS_KEY);
  } catch (error) {
    console.error('Error clearing consolidation jobs:', error);
  }
};

// Start SMS or Calls Consolidation Job
export const startConsolidation = async ({
  type,
  appendRoomParam,
  start_date,
  end_date,
  month,
  year,
  datasheet_type,
}: StartConsolidationParams): Promise<StartConsolidationResponse> => {
  const params = new URLSearchParams();

  // Date range mode
  if (start_date && end_date) {
    params.append('start_date', start_date);
    params.append('end_date', end_date);
  }
  // Month mode
  else if (month !== undefined) {
    params.append('month', String(month));
    if (year !== undefined) {
      params.append('year', String(year));
    }
  }

  // Optional filters
  if (datasheet_type) {
    params.append('datasheet_type', datasheet_type);
  }

  const queryString = params.toString();
  let url = `${BASE_URL}/${type}${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  const data: StartConsolidationResponse = response.data;

  // Store job in localStorage for tracking
  if (data.status === 'accepted' && data.job_id) {
    const filters: Partial<ConsolidationFilters> = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (month !== undefined) filters.month = month;
    if (year !== undefined) filters.year = year;
    if (datasheet_type) filters.datasheet_type = datasheet_type;

    storeConsolidationJob({
      job_id: data.job_id,
      type: data.type,
      created_at: new Date().toISOString(),
      filters,
    });
  }

  return data;
};

// Get Job Status
export const getConsolidationJobStatus = async ({
  job_id,
  appendRoomParam,
}: GetJobStatusParams): Promise<JobStatusResponse> => {
  let url = `${BASE_URL}/status/${job_id}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  const data: JobStatusResponse = response.data;

  // Remove from localStorage if completed or failed
  if (data.status === 'completed' || data.status === 'failed') {
    removeConsolidationJob(job_id);
  }

  return data;
};

// Download Report
export const downloadConsolidationReport = async ({
  job_id,
  appendRoomParam,
}: DownloadReportParams): Promise<Blob> => {
  let url = `${BASE_URL}/download/${job_id}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url, {
    responseType: 'blob'
  });

  return response.data;
};

// List All Jobs
export const listConsolidationJobs = async ({
  appendRoomParam,
}: ListJobsParams): Promise<ListJobsResponse> => {
  let url = `${BASE_URL}/jobs`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  return response.data;
};

// Helper function to poll job status
export const pollJobStatus = async (
  job_id: string,
  appendRoomParam: (url: string) => string,
  onProgress?: (status: JobStatusResponse) => void,
  pollInterval: number = 5000,
  maxAttempts: number = 120 // 10 minutes max with 5s interval
): Promise<JobStatusResponse> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getConsolidationJobStatus({ job_id, appendRoomParam });

    if (onProgress) {
      onProgress(status);
    }

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error('Job polling timeout exceeded');
};

// Helper to trigger file download in browser
export const triggerDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Get formatted date range string
export const getDateRangeString = (filters: Partial<ConsolidationFilters>): string => {
  if (filters.start_date && filters.end_date) {
    return `${filters.start_date} to ${filters.end_date}`;
  }
  if (filters.month !== undefined && filters.month !== null) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[filters.month - 1] || '';
    const year = filters.year || new Date().getFullYear();
    return `${monthName} ${year}`;
  }
  return 'Unknown period';
};

// Get consolidation type label
export const getTypeLabel = (type: ConsolidationType): string => {
  return type === 'sms' ? 'SMS' : 'Calls';
};
