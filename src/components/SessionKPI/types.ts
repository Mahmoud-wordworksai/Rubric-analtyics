// Session KPI Types - Updated to match actual API response

export interface SessionIdentification {
  session_id: string;
  execution_id: string;
  phone_number: string;
  from_number?: string;
  to_number?: string;
  uuid?: string;
  provider?: string;
  agent?: string;
  is_active?: boolean;
}

export interface CampaignDetails {
  campaign_name?: string;
  campaign_flag?: string;
  allocation?: string;
  source_file?: string;
  allocation_date?: string;
}

export interface CustomerInfo {
  customer_name: string;
  mobile_number?: string;
  mobile_no?: string; // backward compatibility
  loan_account_number?: string;
  language_preference?: string;
  campaign_details?: CampaignDetails;
  // Flat fields for backward compatibility
  allocation?: string;
  campaign_name?: string;
  campaign_flag?: string;
  file_name?: string;
}

export interface CallStatus {
  status: string;
  raw_status?: string; // backward compatibility
  category: string;
  is_connected?: boolean;
  hangup_cause?: string;
  hangup_cause_name?: string;
  hangup_cause_code?: string;
  hangup_source?: string;
}

export interface Duration {
  total_seconds?: number;
  seconds?: number; // backward compatibility
  billable_seconds?: number;
  formatted_duration: string;
  formatted_billable?: string;
}

export interface CallTiming {
  start_time?: string;
  end_time?: string;
  answer_time?: string;
  session_start?: string;
}

export interface CallCost {
  total_cost?: number;
  formatted_cost?: string;
  bill_rate?: number;
  bill_rate_formatted?: string;
}

export interface CallPerformance {
  call_status: CallStatus;
  duration: Duration;
  timing?: CallTiming;
  cost?: CallCost;
  direction?: string;
  call_uuid?: string;
  hangup_cause?: string;
  hangup_cause_name?: string;
  provider?: string;
  stt_service?: string;
  tts_service?: string;
  llm_service?: string;
}

export interface BillAmount {
  value?: number;
  raw?: number | string;
  formatted: string;
}

export interface PaymentStatus {
  is_paid: boolean;
  paid_flag?: boolean | null;
  promise_reminder_flag?: boolean | null;
  promise_reminder_method?: string | null;
}

export interface PTPAmount {
  value?: number;
  formatted?: string;
}

export interface PTPDetails {
  has_ptp: boolean;
  ptp_flag?: boolean | null;
  ptp_date?: string | null;
  ptp_amt?: number;
  ptp_amount?: PTPAmount;
  ptp_days?: number | null;
}

export interface PaymentInfo {
  bill_amount: BillAmount;
  payment_status: PaymentStatus;
  ptp_details?: PTPDetails;
  due_date?: string;
  payment_link?: string;
  payment_link_available?: boolean;
}

// Attempt History Item
export interface AttemptHistoryItem {
  attempt_number: number;
  dialed_datetime?: string;
  bot_ivr_status?: string;
  disposition?: string | null;
  duration?: number;
  execution_id?: string;
}

export interface AttemptSummary {
  connected_attempts?: number;
  busy_attempts?: number;
  no_answer_attempts?: number;
  other_attempts?: number;
}

export interface AttemptAnalysis {
  total_attempts: number;
  previous_attempts_count: number;
  current_attempt_number: number;
  attempt_history?: AttemptHistoryItem[];
  attempt_summary?: AttemptSummary;
  previous_connection_rate?: number;
  is_first_attempt?: boolean;
  max_attempts_reached?: boolean;
}

// Current Attempt PTP Details
export interface CurrentAttemptPTPDetails {
  ptp_flag?: boolean;
  ptp_date?: string;
  ptp_amt?: number;
  ptp_amt_formatted?: string;
  ptp_days?: number;
  has_ptp: boolean;
}

export interface CurrentAttemptPaymentStatus {
  paid_flag?: boolean;
  is_paid: boolean;
  promise_reminder_flag?: boolean;
  promise_reminder_method?: string;
}

export interface CurrentAttemptInfo {
  attempt_number: number;
  disposition_code?: string;
  outcome?: string;
  call_summary?: string;
  call_summary_disposition?: string;
  language_detected?: string;
  conversation_stage?: string;
  conversation_strategy?: string;
  user_cooperation_level?: string;
  interruption_count?: number;
  interruption_pattern?: string;
  information_status?: string;
  customer_question_pending?: string;
  commitment_date?: string;
  status_reason_code?: string;
  complaint?: string | null;
  ptp_details?: CurrentAttemptPTPDetails;
  payment_status?: CurrentAttemptPaymentStatus;
}

// Disposition Analysis
export interface DispositionAnalysis {
  previous_disposition?: string | null;
  previous_bot_ivr_status?: string;
  previous_status_reason_code?: string | null;
  current_disposition?: string;
  current_outcome?: string;
  current_conversation_stage?: string;
  current_user_cooperation_level?: string;
  language_detected?: string;
  current_conversation_strategy?: string;
  interruption_count?: number;
  commitment_date?: string;
}

// Communication Status
export interface CommunicationStatus {
  is_email_triggered?: boolean;
  is_sms_triggered?: boolean;
  notifications_sent?: boolean;
}

// Service Config
export interface ServiceConfig {
  provider?: string;
  stt_service?: string;
  tts_service?: string;
  llm_service?: string;
  stt_language_code?: string;
  tts_language_code?: string;
  tts_model_id?: string;
  tts_voice_id?: string;
  selected_flow?: string;
}

// Timestamps
export interface Timestamps {
  created_at?: { $date: string } | string;
  updated_at?: { $date: string } | string;
  created_at_formatted?: string;
  updated_at_formatted?: string;
  session_age_seconds?: number;
}

// Quick Insight
export interface QuickInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  icon: string;
  message: string;
}

// KPI Summary
export interface KPISummary {
  customer: string;
  phone_number: string;
  amount_due?: string;
  call_result?: string;
  duration?: string;
  current_attempt: number;
  previous_attempts: number;
  total_attempts?: number;
  current_disposition?: string;
  current_outcome?: string;
  has_ptp_current: boolean;
  has_ptp_previous: boolean;
  is_paid_current: boolean;
  is_paid_previous: boolean;
  call_summary?: string;
}

export interface DispositionInfo {
  disposition?: string;
  status_reason_code?: string;
  bot_ivr_status?: string;
}

// Updated Session KPI Response
export interface SessionKPIResponse {
  status: string;
  kpi_type?: string;
  generated_at?: string;
  call_summary: string; // REQUIRED field
  session_identification: SessionIdentification;
  customer_info: CustomerInfo;
  call_performance: CallPerformance;
  payment_info: PaymentInfo;
  attempt_analysis?: AttemptAnalysis;
  current_attempt_info?: CurrentAttemptInfo;
  disposition_analysis?: DispositionAnalysis;
  communication_status?: CommunicationStatus;
  service_config?: ServiceConfig;
  timestamps?: Timestamps;
  quick_insights?: QuickInsight[];
  summary?: KPISummary;
  disposition_info?: DispositionInfo;
  _cached: boolean;
}

// Updated Session Summary structure
export interface SessionSummary {
  customer_name: string;
  phone_number: string;
  call_result: string;
  duration: string;
  bill_amount: string;
  current_attempt: number;
  previous_attempts: number;
  current_disposition?: string;
  current_outcome?: string;
  has_ptp_current: boolean;
  ptp_date_current?: string;
  ptp_amt_current?: number;
  has_ptp_previous: boolean;
  is_paid_current: boolean;
  is_paid_previous: boolean;
}

export interface SessionSummaryResponse {
  status: string;
  session_id: string;
  call_summary: string; // REQUIRED field
  summary: SessionSummary;
  _cached: boolean;
}

// API Request Types - Note: Use SessionKPIApiParams from api.ts for actual API calls
export interface SessionKPIParams {
  session_id: string;
  refresh?: boolean;
  run_async?: boolean;
}

// Background Job Types
export interface BackgroundJobResponse {
  status: 'accepted';
  job_id: string;
  message: string;
  check_status_url: string;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage?: number;
  progress_message?: string;
  job_type: string;
  target_type: string;
  target_id: string;
  project: string;
  room?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  duration_formatted?: string;
  result?: SessionKPIResponse;
  error?: string;
}

// Component Props Types
export interface SessionKPIDashboardProps {
  sessionId: string;
  onBack?: () => void;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  borderColor: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export interface CallInfoItemProps {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
}

// Call Status Categories
export type CallStatusCategory =
  | 'Connected'
  | 'No Answer'
  | 'Busy'
  | 'Failed'
  | 'Voicemail'
  | 'Unknown';

// Border color mapping
export const BORDER_COLORS = {
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  orange: 'border-l-orange-500',
  red: 'border-l-red-500',
  purple: 'border-l-purple-500',
} as const;

export const BORDER_BG_COLORS = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  orange: 'bg-orange-50',
  red: 'bg-red-50',
  purple: 'bg-purple-50',
} as const;

export const ICON_COLORS = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
} as const;

export const ICON_BG_COLORS = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  orange: 'bg-orange-100',
  red: 'bg-red-100',
  purple: 'bg-purple-100',
} as const;
