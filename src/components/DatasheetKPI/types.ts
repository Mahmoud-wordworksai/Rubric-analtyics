// Datasheet KPI Types - Updated to match actual API response

export type JobStatusType = 'pending' | 'processing' | 'completed' | 'failed';

// Time Range
export interface TimeRange {
  first_call: string;
  last_call: string;
}

// Overview
export interface DatasheetOverview {
  datasheets_count?: number;
  executions_count: number;
  total_sessions: number;
  unique_customers: number;
  customers_per_session_ratio?: number;
  active_calls?: number;
  campaigns_count?: number;
  allocations_count?: number;
  time_range?: TimeRange;
  // Legacy fields for backward compatibility
  total_bill_amount?: string;
  total_bill_amount_raw?: number;
  total_duration?: string;
  total_duration_seconds?: number;
  total_cost?: string;
  total_cost_raw?: number;
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
export interface DatasheetCallPerformance {
  total_calls?: number;
  connected_calls: number;
  busy_calls?: number;
  no_answer_calls?: number;
  failed_calls?: number;
  cancelled_calls?: number;
  other_calls?: number;
  connection_rate: number | string;
  busy_rate?: number;
  no_answer_rate?: number;
  status_distribution?: StatusDistributionItem[];
  // Legacy field
  status_breakdown?: Record<string, number>;
}

// Duration Metrics
export interface DurationMetrics {
  total_duration_seconds: number;
  total_duration_formatted: string;
  total_billable_seconds?: number;
  total_billable_formatted?: string;
  average_call_duration?: number;
  average_duration_formatted?: string;
  max_call_duration?: number;
  max_duration_formatted?: string;
  min_call_duration?: number;
  min_duration_formatted?: string;
}

// Cost Metrics
export interface CostMetrics {
  total_cost: number;
  total_cost_formatted: string;
  average_cost_per_call?: number;
  cost_per_connected_call?: number;
  cost_per_minute?: number;
}

// PTP Metrics
export interface PTPMetrics {
  ptp_count: number;
  ptp_rate: number;
  total_ptp_amount: number;
  total_ptp_formatted: string;
  average_ptp_amount?: number;
}

// Paid Metrics
export interface PaidMetrics {
  paid_count: number;
  paid_rate: number;
  paid_vs_contacted?: number;
}

// Collection Efficiency
export interface CollectionEfficiency {
  contacted_amount?: number;
  ptp_coverage?: number;
}

// Collection Metrics
export interface DatasheetCollectionMetrics {
  total_amount_outstanding?: number;
  total_amount_formatted?: string;
  average_bill_amount?: number;
  max_bill_amount?: number;
  min_bill_amount?: number;
  ptp_metrics?: PTPMetrics;
  paid_metrics?: PaidMetrics;
  collection_efficiency?: CollectionEfficiency;
  // Legacy fields
  paid_count?: number;
  paid_rate?: string | number;
  ptp_count?: number;
  ptp_rate?: string | number;
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

// Disposition Distribution Item
export interface DispositionDistributionItem {
  disposition: string;
  count: number;
  total_amount: number;
}

// Campaign Distribution Item
export interface CampaignDistributionItem {
  campaign: string;
  total_calls: number;
  connected_calls: number;
  connection_rate: number;
  total_amount: number;
  total_duration: number;
}

// Attempt Distribution Item
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

// Summary Stats
export interface SummaryStats {
  total_calls: number;
  connected: number;
  connection_rate: string;
  total_amount: string;
  ptp_count: number;
  paid_count: number;
  total_duration: string;
  total_cost: string;
}

// Execution Breakdown Item
export interface ExecutionBreakdownItem {
  execution_id: string;
  execution_name: string;
  datasheet_id?: string;
  datasheet_filename?: string;
  total_sessions: number;
  unique_customers?: number;
  connected_calls: number;
  connection_rate: number | string;
  paid_count?: number;
  paid_rate?: number;
  ptp_count?: number;
  ptp_rate?: number;
  total_amount?: string;
  total_amount_raw?: number;
  total_ptp_amount?: string;
  total_duration: string;
  total_duration_seconds?: number;
  total_cost?: number;
  total_cost_formatted?: string;
  status?: string;
  created_at?: string;
}

// Datasheet Breakdown Item (for bulk response)
export interface DatasheetBreakdownItem {
  datasheet_id: string;
  filename: string;
  group_id: string;
  executions_count: number;
  total_sessions: number;
  unique_customers?: number;
  connected_calls: number;
  connection_rate: number | string;
  paid_count?: number;
  paid_rate?: number;
  ptp_count?: number;
  ptp_rate?: number;
  total_amount: string;
  total_amount_raw: number;
  total_ptp_amount?: string;
  total_ptp_amount_raw?: number;
  total_duration: string;
  total_duration_seconds: number;
  total_cost?: number;
  total_cost_formatted?: string;
}

// Datasheet Info in bulk response
export interface BulkDatasheetInfo {
  datasheet_id: string;
  filename: string;
  group_id: string;
}

// Datasheet Info in executions list
export interface DatasheetInfo {
  datasheet_id: string;
  datasheet_name: string;
}

// KPI Summary for an execution
export interface ExecutionKPISummary {
  total_sessions: number;
  connected_calls: number;
  connection_rate: string;
  total_amount: string;
  total_duration: string;
}

// Execution Item in paginated list
export interface ExecutionListItem {
  execution_id: string;
  name: string;
  status: string;
  created_at: string;
  datasheet_info: DatasheetInfo;
  kpi_summary: ExecutionKPISummary;
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

// Full Datasheet KPI Result
export interface DatasheetKPIResult {
  status: string;
  kpi_type?: string;
  datasheet_id?: string;
  group_id?: string;
  datasheets_count?: number;
  datasheet_ids?: string[];
  datasheets?: BulkDatasheetInfo[];
  overview: DatasheetOverview;
  call_performance: DatasheetCallPerformance;
  duration_metrics?: DurationMetrics;
  cost_metrics?: CostMetrics;
  collection_metrics?: DatasheetCollectionMetrics;
  reach_metrics?: ReachMetrics;
  communication_metrics?: CommunicationMetrics;
  detailed_breakdowns?: DetailedBreakdowns;
  datasheet_breakdown?: DatasheetBreakdownItem[];
  execution_breakdown?: ExecutionBreakdownItem[];
  quick_insights?: QuickInsight[];
  summary_stats?: SummaryStats;
  // Legacy fields
  campaigns?: string[];
  allocations?: string[];
  generated_at: string;
  _cached: boolean;
  _cache_note?: string;
  _generated_by_job?: string;
}

// Bulk Datasheets Background Job Response
export interface BulkBackgroundJobResponse {
  status: 'accepted';
  job_id: string;
  message: string;
  datasheets_count: number;
  group_id?: string;
  check_status_url: string;
}

// Datasheet Summary Response
export interface DatasheetSummary {
  status: string;
  datasheet_id: string;
  summary: {
    executions_count: number;
    total_calls: number;
    connected_calls: number;
    connection_rate: string;
    unique_customers: number;
    total_amount: string;
    total_duration: string;
    total_cost: string;
  };
  _cached: boolean;
}

// Datasheet Executions Response
export interface DatasheetExecutionsResponse {
  status: string;
  datasheet_id: string;
  pagination: Pagination;
  executions: ExecutionListItem[];
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
  result?: DatasheetKPIResult;
  error?: string;
  duration_seconds?: number;
  duration_formatted?: string;
}

// API Request Types
export interface GetDatasheetKPIsParams {
  datasheet_id: string;
  appendRoomParam: (url: string) => string;
  refresh?: boolean;
  run_async?: boolean;
  include_execution_breakdown?: boolean;
}

export interface GetBulkDatasheetsKPIsParams {
  group_id?: string;
  datasheet_ids?: string[];
  appendRoomParam: (url: string) => string;
  run_async?: boolean;
  include_execution_breakdown?: boolean;
  include_datasheet_breakdown?: boolean;
}

export interface GetDatasheetSummaryParams {
  datasheet_id: string;
  appendRoomParam: (url: string) => string;
  refresh?: boolean;
  run_async?: boolean;
}

export interface GetDatasheetExecutionsParams {
  datasheet_id: string;
  appendRoomParam: (url: string) => string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: -1 | 1;
  run_async?: boolean;
}

export interface GetJobStatusParams {
  jobId: string;
  appendRoomParam: (url: string) => string;
}

export interface ClearDatasheetCacheParams {
  datasheetId: string;
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
