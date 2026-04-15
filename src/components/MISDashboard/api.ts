import axiosInstance from '@/lib/axios';
import { API_BASE_URL } from '@/constants';
import {
  GenerateMISParams,
  GenerateMISResponse,
  GetMISJobStatusParams,
  MISJobStatusResponse,
  DownloadMISReportParams,
  ListMISJobsParams,
  ListMISJobsResponse,
  StoredMISJob,
  MISDashboardFilters,
} from './types';

const BASE_URL = `${API_BASE_URL}/mis-dashboard`;

// Local Storage key for tracking MIS jobs
const MIS_JOBS_KEY = 'mis_dashboard_jobs';

// Store job in localStorage
export const storeMISJob = (job: StoredMISJob) => {
  try {
    const jobs = getStoredMISJobs();
    const exists = jobs.some((j) => j.job_id === job.job_id);
    if (!exists) {
      jobs.push(job);
      localStorage.setItem(MIS_JOBS_KEY, JSON.stringify(jobs));
    }
  } catch (error) {
    console.error('Error storing MIS job:', error);
  }
};

// Get stored MIS jobs
export const getStoredMISJobs = (): StoredMISJob[] => {
  try {
    const stored = localStorage.getItem(MIS_JOBS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading MIS jobs:', error);
    return [];
  }
};

// Remove job from localStorage
export const removeMISJob = (jobId: string) => {
  try {
    const jobs = getStoredMISJobs();
    const filtered = jobs.filter((j) => j.job_id !== jobId);
    localStorage.setItem(MIS_JOBS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing MIS job:', error);
  }
};

// Clear all stored jobs
export const clearStoredMISJobs = () => {
  try {
    localStorage.removeItem(MIS_JOBS_KEY);
  } catch (error) {
    console.error('Error clearing MIS jobs:', error);
  }
};

// Generate MIS Dashboard Report
export const generateMISDashboard = async ({
  appendRoomParam,
  start_date,
  end_date,
  month,
  year,
  client_name,
}: GenerateMISParams): Promise<GenerateMISResponse> => {
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

  // Optional client name
  if (client_name) {
    params.append('client_name', client_name);
  }

  const queryString = params.toString();
  let url = `${BASE_URL}/generate${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  const data: GenerateMISResponse = response.data;

  // Store job in localStorage for tracking
  if (data.status === 'accepted' && data.job_id) {
    const filters: Partial<MISDashboardFilters> = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (month !== undefined) filters.month = month;
    if (year !== undefined) filters.year = year;
    if (client_name) filters.client_name = client_name;

    storeMISJob({
      job_id: data.job_id,
      created_at: new Date().toISOString(),
      filters,
    });
  }

  return data;
};

// Get Job Status
export const getMISJobStatus = async ({
  job_id,
  appendRoomParam,
}: GetMISJobStatusParams): Promise<MISJobStatusResponse> => {
  let url = `${BASE_URL}/status/${job_id}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  const data: MISJobStatusResponse = response.data;

  // Remove from localStorage if completed or failed
  if (data.status === 'completed' || data.status === 'failed') {
    removeMISJob(job_id);
  }

  return data;
};

// Download Report
export const downloadMISReport = async ({
  job_id,
  appendRoomParam,
}: DownloadMISReportParams): Promise<Blob> => {
  let url = `${BASE_URL}/download/${job_id}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url, {
    responseType: 'blob'
  });

  return response.data;
};

// List All Jobs
export const listMISJobs = async ({
  appendRoomParam,
  status,
  limit,
}: ListMISJobsParams): Promise<ListMISJobsResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (limit) params.append('limit', String(limit));

  const queryString = params.toString();
  let url = `${BASE_URL}/jobs${queryString ? `?${queryString}` : ''}`;
  url = appendRoomParam(url);

  const response = await axiosInstance.get(url);
  return response.data;
};

// Helper function to trigger file download in browser
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
export const getDateRangeString = (filters: Partial<MISDashboardFilters>): string => {
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

// Format step name for display
export const formatStepName = (step: string): string => {
  return step
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
