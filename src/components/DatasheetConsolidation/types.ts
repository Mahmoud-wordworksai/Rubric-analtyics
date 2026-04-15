// Types for Datasheet Consolidation API

export type ConsolidationType = 'sms' | 'calls';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type CurrentStep =
  | 'queued'
  | 'initializing'
  | 'loading_pricing'
  | 'fetching_datasheets'
  | 'processing_datasheets'
  | 'generating_report'
  | 'completed'
  | 'failed';

export type DatasheetType = 'BUCKET X' | 'CHARGES' | 'PDM' | 'PNPA' | 'BUCKET 1&2' | 'OTHER';

export interface ConsolidationFilters {
  start_date: string | null;
  end_date: string | null;
  month: number | null;
  year: number | null;
  datasheet_type: DatasheetType | null;
}

// SMS Summary
export interface SMSConsolidationSummary {
  total_datasheets: number;
  total_sms: number;
  total_units: number;
  grand_total_amount: number;
  applied_slab: string;
  slab_rate: number;
  date_range: string;
}

// Calls Summary
export interface CallsConsolidationSummary {
  total_datasheets: number;
  total_calls: number;
  total_bill: number;
  max_attempts: number;
  date_range: string;
}

export type ConsolidationJobSummary = SMSConsolidationSummary | CallsConsolidationSummary;

export interface StartConsolidationResponse {
  status: 'accepted';
  job_id: string;
  type: ConsolidationType;
  message: string;
  status_link: string;
  download_link: string;
}

export interface JobStatusResponse {
  status: JobStatus;
  type: ConsolidationType;
  created_at: string;
  completed_at?: string;
  progress: number;
  total_datasheets: number;
  processed_datasheets: number;
  current_step: CurrentStep;
  filename: string | null;
  download_link: string | null;
  error: string | null;
  filters: ConsolidationFilters;
  summary?: ConsolidationJobSummary;
}

export interface ConsolidationJob {
  job_id: string;
  type: ConsolidationType;
  status: JobStatus;
  progress: number;
  created_at: string;
  completed_at: string | null;
  filters: ConsolidationFilters;
}

export interface ListJobsResponse {
  total_jobs: number;
  jobs: ConsolidationJob[];
}

export interface ErrorResponse {
  detail: string;
}

// Type guards for summary types
export const isSMSSummary = (summary: ConsolidationJobSummary): summary is SMSConsolidationSummary => {
  return 'total_sms' in summary && 'applied_slab' in summary;
};

export const isCallsSummary = (summary: ConsolidationJobSummary): summary is CallsConsolidationSummary => {
  return 'total_calls' in summary && 'total_bill' in summary;
};

// API Parameters
export interface StartConsolidationParams {
  type: ConsolidationType;
  appendRoomParam: (url: string) => string;
  // Date range mode
  start_date?: string;
  end_date?: string;
  // Month mode
  month?: number;
  year?: number;
  // Optional filters
  datasheet_type?: DatasheetType;
}

export interface GetJobStatusParams {
  job_id: string;
  appendRoomParam: (url: string) => string;
}

export interface DownloadReportParams {
  job_id: string;
  appendRoomParam: (url: string) => string;
}

export interface ListJobsParams {
  appendRoomParam: (url: string) => string;
}

// Local storage job tracking
export interface StoredJob {
  job_id: string;
  type: ConsolidationType;
  created_at: string;
  filters: Partial<ConsolidationFilters>;
}
