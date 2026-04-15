export interface RubricAnalyticsData {
  rubric: Rubric;
  derived_facts: { [key: string]: boolean };
  summary: Summary;
  results: Result[];
  total_calls?: number | null;
  average_scores?: Record<string, number>;
  score_distribution?: Record<string, number>;
  trends?: Record<string, number>;
  rubric_summary?: Record<string, RubricCategoryAggregate>;
}

export interface Rubric {
  file: string;
  sheet: string;
}

export interface Summary {
  items: number;
  achievable_weight: number;
  earned_weight: number;
  failed_weight: number;
  unknown_weight: number;
  na_weight: number;
  percent: number;
}

export type ResultStatus = "pass" | "fail" | "unknown" | "na";
export type Confidence = "high" | "low" | "medium";
export type Method = "rules" | "llm" | "hybrid";

export interface Result {
  name: string;
  status: ResultStatus;
  weight: number;
  evidence: string[];
  reason: string;
  confidence: Confidence;
  method: Method;
  notes: string | null;
}

// Call Analytics Types
export interface CallEvaluation {
  evaluation_id?: string;
  call_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  score?: number;
  report?: RubricAnalyticsData;
  results?: Result[];
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  session_id?: string;
  execution_id?: string;
  error_message?: string;
}

export interface CallAnalyticsResponse {
  status: string;
  data?: CallEvaluation | CallEvaluation[];
  message?: string;
}

export interface RubricCategoryAggregate {
  total_score: number;
  max_possible_score: number;
  count: number;
  average_percentage: number;
}

export interface ExecutionListItemLite {
  execution_id: string;
  execution_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
}

export interface RubricCampaignAnalytics {
  execution_id: string;
  execution_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  total_calls?: number | null;
  completed_calls?: number | null;
  trend?: number | null;
  trend_breakdown?: Record<string, number>;
  analytics: RubricAnalyticsData;
}

export interface DetailedCallAnalyticsItem {
  session_id?: string | null;
  call_id?: string | null;
  execution_id: string;
  call_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  evaluation?: CallEvaluation | null;
}
