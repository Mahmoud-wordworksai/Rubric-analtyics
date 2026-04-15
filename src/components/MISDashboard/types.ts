// Types for MIS Dashboard API

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type CurrentStep =
  | 'queued'
  | 'fetching_data'
  | 'processing_data'
  | 'calculating_metrics'
  | 'generating_report'
  | 'completed'
  | 'failed';

export interface MISDashboardFilters {
  start_date: string | null;
  end_date: string | null;
  month: number | null;
  year: number | null;
  client_name: string;
}

export interface MISDashboardSummary {
  period: string;
  client_name: string;
  total_records: number;
  total_allocation: number;
  revised_allocation: number;
}

export interface GenerateMISResponse {
  status: 'accepted';
  job_id: string;
  type: 'mis_dashboard';
  message: string;
  status_link: string;
  download_link: string;
}

export interface MISJobStatusResponse {
  status: JobStatus;
  type: 'mis_dashboard';
  created_at: string;
  completed_at?: string;
  progress: number;
  total_records: number;
  processed_records: number;
  current_step: CurrentStep;
  filename: string | null;
  download_link: string | null;
  error: string | null;
  filters: MISDashboardFilters;
  summary?: MISDashboardSummary;
}

export interface MISJob {
  job_id: string;
  type: 'mis_dashboard';
  status: JobStatus;
  progress: number;
  created_at: string;
  completed_at: string | null;
  filters: MISDashboardFilters;
}

export interface ListMISJobsResponse {
  total_jobs: number;
  jobs: MISJob[];
}

export interface ErrorResponse {
  detail: string;
}

// API Parameters
export interface GenerateMISParams {
  appendRoomParam: (url: string) => string;
  // Date range mode
  start_date?: string;
  end_date?: string;
  // Month mode
  month?: number;
  year?: number;
  // Optional
  client_name?: string;
}

export interface GetMISJobStatusParams {
  job_id: string;
  appendRoomParam: (url: string) => string;
}

export interface DownloadMISReportParams {
  job_id: string;
  appendRoomParam: (url: string) => string;
}

export interface ListMISJobsParams {
  appendRoomParam: (url: string) => string;
  status?: JobStatus;
  limit?: number;
}

// Local storage job tracking
export interface StoredMISJob {
  job_id: string;
  created_at: string;
  filters: Partial<MISDashboardFilters>;
}
