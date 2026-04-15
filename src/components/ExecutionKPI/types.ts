// Execution KPI Types

export type JobStatusType = 'pending' | 'processing' | 'completed' | 'failed';

// Overview
export interface TimeRange {
  first_call: string;
  last_call: string;
}

export interface ExecutionOverview {
  total_sessions: number;
  unique_customers: number;
  customers_per_session_ratio: number;
  active_calls: number;
  campaigns_count: number;
  allocations_count: number;
  time_range: TimeRange;
}

// Status Distribution Item
export interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
  total_duration: number;
  total_duration_formatted: string;
  total_cost: number;
}

// Call Performance
export interface CallPerformance {
  total_calls: number;
  connected_calls: number;
  busy_calls: number;
  no_answer_calls: number;
  failed_calls: number;
  cancelled_calls: number;
  other_calls: number;
  connection_rate: number;
  busy_rate: number;
  no_answer_rate: number;
  status_distribution: StatusDistributionItem[];
}

// Duration Metrics
export interface DurationMetrics {
  total_duration_seconds: number;
  total_duration_formatted: string;
  total_billable_seconds: number;
  total_billable_formatted: string;
  average_call_duration: number;
  average_duration_formatted: string;
  max_call_duration: number;
  max_duration_formatted: string;
  min_call_duration: number;
  min_duration_formatted: string;
}

// Cost Metrics
export interface CostMetrics {
  total_cost: number;
  total_cost_formatted: string;
  average_cost_per_call: number;
  cost_per_connected_call: number;
  cost_per_minute: number;
}

// PTP Metrics
export interface PTPMetrics {
  ptp_count: number;
  ptp_rate: number;
  total_ptp_amount: number;
  total_ptp_formatted: string;
  average_ptp_amount: number;
}

// Paid Metrics
export interface PaidMetrics {
  paid_count: number;
  paid_rate: number;
  paid_vs_contacted: number;
}

// Collection Efficiency
export interface CollectionEfficiency {
  contacted_amount: number;
  ptp_coverage: number;
}

// Collection Metrics
export interface CollectionMetrics {
  total_amount_outstanding: number;
  total_amount_formatted: string;
  average_bill_amount: number;
  max_bill_amount: number;
  min_bill_amount: number;
  ptp_metrics: PTPMetrics;
  paid_metrics: PaidMetrics;
  collection_efficiency: CollectionEfficiency;
}

// Reach Metrics
export interface ReachMetrics {
  total_attempts: number;
  average_attempts_per_customer: number;
  max_attempts: number;
  customers_contacted: number;
  contact_rate: number;
  multi_attempt_customers: number;
}

// Communication Metrics
export interface CommunicationMetrics {
  email_triggered: number;
  email_rate: number;
  sms_triggered: number;
  sms_rate: number;
  total_notifications: number;
}

// Disposition Distribution
export interface DispositionDistributionItem {
  disposition: string;
  count: number;
  total_amount: number;
}

// Campaign Distribution
export interface CampaignDistributionItem {
  campaign: string;
  total_calls: number;
  connected_calls: number;
  connection_rate: number;
  total_amount: number;
  total_duration: number;
}

// Attempt Distribution
export interface AttemptDistributionItem {
  attempt_number: number;
  total_calls: number;
  connected_calls: number;
  connection_rate: number;
}

// Detailed Breakdowns
export interface DetailedBreakdowns {
  disposition_distribution: DispositionDistributionItem[];
  campaign_distribution: CampaignDistributionItem[];
  attempt_distribution: AttemptDistributionItem[];
  campaigns_list: string[];
  allocations_list: string[];
}

// Quick Insight
export interface QuickInsight {
  type: 'warning' | 'info' | 'success' | 'error';
  icon: string;
  category: string;
  message: string;
  recommendation: string | null;
}

// Summary
export interface ExecutionSummary {
  total_calls: number;
  connected: number;
  connection_rate: string;
  total_duration: string;
  total_cost: string;
  amount_outstanding: string;
  ptp_collected: string;
  paid: string;
  unique_customers: number;
}

// Filters Applied
export interface FiltersApplied {
  start_date: string | null;
  end_date: string | null;
  campaign_name: string | null;
  allocation: string | null;
  call_status: string | null;
}

// Full Execution KPI Result (inside job response)
export interface ExecutionKPIResult {
  status: string;
  kpi_type: string;
  execution_id: string;
  generated_at: string;
  filters_applied: FiltersApplied;
  overview: ExecutionOverview;
  call_performance: CallPerformance;
  duration_metrics: DurationMetrics;
  cost_metrics: CostMetrics;
  collection_metrics: CollectionMetrics;
  reach_metrics: ReachMetrics;
  communication_metrics: CommunicationMetrics;
  detailed_breakdowns: DetailedBreakdowns;
  time_series: unknown | null;
  quick_insights: QuickInsight[];
  summary: ExecutionSummary;
  _cached: boolean;
  _generated_by_job?: string;
}

// Background Job Response
export interface BackgroundJobResponse {
  status: 'accepted';
  job_id: string;
  message: string;
  check_status_url: string;
}

// Job Status Response
export interface JobStatus {
  job_id: string;
  status: JobStatusType;
  progress_percentage?: number;
  progress_message?: string;
  job_type?: string;
  target_type?: string;
  target_id?: string;
  project?: string;
  room?: string | null;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  result?: ExecutionKPIResult;
  error?: string;
  duration_seconds?: number;
  duration_formatted?: string;
}

// Session in list
export interface SessionListItem {
  session_id: string;
  customer_name: string;
  phone_number: string;
  call_result: string;
  duration: string;
  bill_amount: string;
  call_summary?: string;
  current_attempt: number;
  previous_attempts: number;
  current_disposition?: string;
  has_ptp_current: boolean;
  has_ptp_previous: boolean;
  is_paid_current: boolean;
  is_paid_previous: boolean;
  created_at: string;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Sessions List Response
export interface ExecutionSessionsResponse {
  status: string;
  execution_id: string;
  pagination: Pagination;
  sessions: SessionListItem[];
}

// API Request Types
export interface GetExecutionKPIsParams {
  execution_id: string;
  appendRoomParam: (url: string) => string;
  refresh?: boolean;
  run_async?: boolean;
  include_detailed_breakdown?: boolean;
  include_time_series?: boolean;
}

export interface GetExecutionSummaryParams {
  execution_id: string;
  appendRoomParam: (url: string) => string;
  refresh?: boolean;
  run_async?: boolean;
}

export interface GetExecutionSessionsParams {
  execution_id: string;
  appendRoomParam: (url: string) => string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: -1 | 1;
  call_status?: string;
  run_async?: boolean;
}

export interface GetJobStatusParams {
  jobId: string;
  appendRoomParam: (url: string) => string;
}

export interface ClearExecutionCacheParams {
  executionId: string;
  appendRoomParam: (url: string) => string;
  cache_type?: 'full' | 'summary';
}

// Call Status Category
export type CallStatusCategory =
  | 'Connected'
  | 'No Answer'
  | 'Busy'
  | 'Voicemail'
  | 'Failed'
  | 'Unknown';
