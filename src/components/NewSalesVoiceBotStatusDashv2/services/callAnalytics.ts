import axios from "axios";
import { API_BASE_URL, API_KEY } from "@/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CampaignReportResponse {
  execution_id?: string;
  overview?: {
    total_calls?: number;
    completed_calls?: number;
    failed_calls?: number;
    processing_calls?: number;
    average_score?: number;
    score_distribution?: Record<string, number>;
    trend_breakdown?: Record<string, number>;
    last_evaluated_at?: string | null;
  };
  analytics?: Record<string, any>;
  [key: string]: any;
}

export interface SingleCallEvaluationResponse {
  evaluation?: {
    percent?: number;
    summary?: Record<string, any>;
    detailed_results?: Array<Record<string, any>>;
  };
  report?: {
    summary?: {
      percent?: number;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

const withApiKey = (url: string) => `${url}${url.includes("?") ? "&" : "?"}api_key=${API_KEY}`;

const unwrapResponse = <T,>(response: { data?: any }): T => {
  return (response?.data?.data ?? response?.data) as T;
};

export const getCampaignReportSummary = async (executionId: string) => {
  const response = await axios.get(
    withApiKey(`${API_BASE_URL}/call-analytics/campaign-report/${executionId}/summary`)
  );

  return unwrapResponse<CampaignReportResponse>(response);
};

export const getCampaignReport = async (executionId: string) => {
  const response = await axios.get(
    withApiKey(`${API_BASE_URL}/call-analytics/campaign-report/${executionId}`)
  );

  return unwrapResponse<CampaignReportResponse>(response);
};

export const generateCampaignReport = async (executionId: string) => {
  const response = await axios.post(
    withApiKey(`${API_BASE_URL}/call-analytics/campaign-report/generate/${executionId}`)
  );

  return unwrapResponse<CampaignReportResponse>(response);
};

export const loadCampaignReportWithFallback = async (executionId: string) => {
  try {
    const summary = await getCampaignReportSummary(executionId);

    if (summary?.overview) {
      return {
        summary,
        fullReport: null,
        generated: false,
      };
    }
  } catch (error: any) {
    const status = error?.response?.status;

    if (status && status !== 404) {
      throw error;
    }
  }

  await generateCampaignReport(executionId);

  const fullReport = await getCampaignReport(executionId);

  return {
    summary: fullReport,
    fullReport,
    generated: true,
  };
};

const buildEvaluationPayload = (payload: Record<string, any>) => {
  const sessionId = payload?.session_id || payload?.call_info?.session_id;
  const executionId = payload?.execution_id || payload?.campaign_id || payload?.order_id;

  return {
    session_id: sessionId,
    execution_id: executionId,
    ...payload,
  };
};

export const evaluateSingleCall = async (payload: Record<string, any>) => {
  const response = await axios.post(
    withApiKey(`${API_BASE_URL}/call-analytics/evaluate`),
    buildEvaluationPayload(payload)
  );

  const data = unwrapResponse<SingleCallEvaluationResponse>(response);

  const percent =
    data?.evaluation?.percent ??
    data?.report?.summary?.percent ??
    0;

  return {
    raw: data,
    percent,
    summary: data?.evaluation?.summary ?? {},
    detailedResults: data?.evaluation?.detailed_results ?? [],
    report: data?.report ?? null,
  };
};


export interface ReportFilters {
  month?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  tags?: string[];
  execution_ids?: string[];
  datasheet_ids?: string[];
}

const buildReportQueryParams = (filters: ReportFilters = {}) => {
  const params = new URLSearchParams();
  params.append("api_key", API_KEY);

  if (filters.month) params.append("month", filters.month);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.tags && filters.tags.length > 0) params.append("tags", filters.tags.join(","));
  if (filters.execution_ids && filters.execution_ids.length > 0) params.append("execution_ids", filters.execution_ids.join(","));
  if (filters.datasheet_ids && filters.datasheet_ids.length > 0) params.append("datasheet_ids", filters.datasheet_ids.join(","));

  return params.toString();
};

export const getPeriodReportSummary = async (filters: ReportFilters = {}) => {
  const query = buildReportQueryParams(filters);
  const response = await axios.get(`${API_BASE_URL}/call-analytics/reports/summary?${query}`);
  return unwrapResponse<CampaignReportResponse>(response);
};

export const getPeriodReport = async (filters: ReportFilters = {}) => {
  const query = buildReportQueryParams(filters);
  const response = await axios.get(`${API_BASE_URL}/call-analytics/reports?${query}`);
  return unwrapResponse<CampaignReportResponse>(response);
};

export const generatePeriodReport = async (filters: ReportFilters = {}) => {
  const query = buildReportQueryParams(filters);
  const response = await axios.post(`${API_BASE_URL}/call-analytics/reports/generate?${query}`);
  return unwrapResponse<CampaignReportResponse>(response);
};

export const loadPeriodReportWithFallback = async (filters: ReportFilters = {}) => {
  try {
    const summary = await getPeriodReportSummary(filters);

    if (summary?.overview) {
      return { summary, fullReport: null, generated: false };
    }
  } catch (error: any) {
    const status = error?.response?.status;
    if (status && status !== 404) throw error;
  }

  await generatePeriodReport(filters);
  const fullReport = await getPeriodReport(filters);

  return {
    summary: fullReport,
    fullReport,
    generated: true,
  };
};
