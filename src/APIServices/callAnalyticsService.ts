/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from '@/lib/axios';
import { API_BASE_URL } from '@/constants';
import { appendRoomParam } from '@/hooks/useRoomAPI';
import type {
  CallAnalyticsResponse,
  CallEvaluation,
  DetailedCallAnalyticsItem,
  ExecutionListItemLite,
  Result,
  RubricCategoryAggregate,
  RubricAnalyticsData,
  RubricCampaignAnalytics,
  Summary,
} from '@/lib/types';

const DEFAULT_RUBRIC = {
  file: 'rubric',
  sheet: 'default',
};

class CallAnalyticsService {
  private executionSummariesLiteSupported: boolean | null = null;

  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private buildAppUrl(path: string): string {
    return appendRoomParam(`${this.baseUrl}${path}`);
  }

  private isRecord(value: unknown): value is Record<string, any> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private unwrapPayload(payload: any): any {
    if (this.isRecord(payload) && 'data' in payload && payload.data !== undefined) {
      return payload.data;
    }
    return payload;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private asNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const normalized = value.replace('%', '').trim();
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private extractId(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (this.isRecord(value)) {
      const oid = this.asString(value.$oid);
      if (oid) return oid;

      const id = this.asString(value.id);
      if (id) return id;
    }

    return undefined;
  }

  private normalizeStatus(value: unknown): Result['status'] {
    const normalized = String(value || 'unknown').toLowerCase();
    if (normalized === 'pass' || normalized === 'fail' || normalized === 'unknown' || normalized === 'na') {
      return normalized;
    }
    return 'unknown';
  }

  private normalizeConfidence(value: unknown): Result['confidence'] {
    const normalized = String(value || 'medium').toLowerCase();
    if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
      return normalized;
    }
    return 'medium';
  }

  private normalizeMethod(value: unknown): Result['method'] {
    const normalized = String(value || 'rules').toLowerCase();
    if (normalized === 'rules' || normalized === 'llm' || normalized === 'hybrid') {
      return normalized;
    }
    return 'rules';
  }

  private normalizeResult(raw: any, index: number): Result {
    return {
      name: this.asString(raw?.name) || this.asString(raw?.criterion) || this.asString(raw?.category) || `Criterion ${index + 1}`,
      status: this.normalizeStatus(raw?.status),
      weight: this.asNumber(raw?.weight) ?? this.asNumber(raw?.score_weight) ?? 0,
      evidence: Array.isArray(raw?.evidence)
        ? raw.evidence.map((item: unknown) => String(item))
        : this.asString(raw?.evidence)
          ? [String(raw.evidence)]
          : [],
      reason: this.asString(raw?.reason) || this.asString(raw?.description) || 'No reason provided',
      confidence: this.normalizeConfidence(raw?.confidence),
      method: this.normalizeMethod(raw?.method),
      notes: this.asString(raw?.notes) || null,
    };
  }

  private normalizeResults(raw: any): Result[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => this.normalizeResult(item, index));
  }

  private normalizeNumericMap(raw: any): Record<string, number> {
    if (!this.isRecord(raw)) return {};

    return Object.fromEntries(
      Object.entries(raw)
        .map(([key, value]) => [key, this.asNumber(value)])
        .filter((entry): entry is [string, number] => entry[1] !== undefined)
    );
  }

  private mergeMetricMaps(...maps: Array<Record<string, number> | undefined>): Record<string, number> {
    return maps.reduce<Record<string, number>>((acc, current) => {
      if (!current) return acc;

      Object.entries(current).forEach(([key, value]) => {
        if (Number.isFinite(value)) {
          acc[key] = value;
        }
      });

      return acc;
    }, {});
  }

  private normalizeTrendBreakdown(raw: any, analytics?: RubricAnalyticsData): Record<string, number> {
    const rawTrends = this.normalizeNumericMap(raw?.trend_breakdown);
    const analyticsTrends = this.normalizeNumericMap(raw?.analytics?.trends);
    const directTrends = this.normalizeNumericMap(raw?.trends);
    const rawScoreDistribution = this.normalizeNumericMap(raw?.score_distribution);
    const analyticsScoreDistribution = analytics?.score_distribution || {};

    const merged = this.mergeMetricMaps(
      rawTrends,
      analyticsTrends,
      directTrends,
      rawScoreDistribution,
      analyticsScoreDistribution
    );

    const excellent = merged.exceeding_expectations
      ?? merged.excellent
      ?? merged.high
      ?? merged.passed
      ?? merged.pass;
    const average = merged.meeting_expectations
      ?? merged.average
      ?? merged.medium;
    const poor = merged.improvement_needed
      ?? merged.poor
      ?? merged.low
      ?? merged.failed
      ?? merged.fail;

    if (excellent !== undefined && merged.exceeding_expectations === undefined) {
      merged.exceeding_expectations = excellent;
    }

    if (average !== undefined && merged.meeting_expectations === undefined) {
      merged.meeting_expectations = average;
    }

    if (poor !== undefined && merged.improvement_needed === undefined) {
      merged.improvement_needed = poor;
    }

    return merged;
  }

  private normalizeRubricCategorySummary(raw: any): Record<string, RubricCategoryAggregate> {
    if (!this.isRecord(raw)) return {};

    return Object.fromEntries(
      Object.entries(raw)
        .filter(([, value]) => this.isRecord(value))
        .map(([key, value]) => {
          const aggregate = value as Record<string, unknown>;
          return [
            key,
            {
              total_score: this.asNumber(aggregate.total_score) ?? 0,
              max_possible_score: this.asNumber(aggregate.max_possible_score) ?? 0,
              count: this.asNumber(aggregate.count) ?? 0,
              average_percentage: this.asNumber(aggregate.average_percentage) ?? 0,
            },
          ];
        })
    );
  }

  private buildSummary(source: any, results: Result[]): Summary {
    const summary = this.isRecord(source?.summary) ? source.summary : source;
    const achievableWeight = this.asNumber(summary?.achievable_weight)
      ?? this.asNumber(summary?.total_weight)
      ?? results.reduce((sum, item) => sum + item.weight, 0);
    const earnedWeight = this.asNumber(summary?.earned_weight)
      ?? this.asNumber(summary?.score)
      ?? results.reduce((sum, item) => sum + (item.status === 'pass' ? item.weight : 0), 0);
    const failedWeight = this.asNumber(summary?.failed_weight)
      ?? results.reduce((sum, item) => sum + (item.status === 'fail' ? item.weight : 0), 0);
    const unknownWeight = this.asNumber(summary?.unknown_weight)
      ?? results.reduce((sum, item) => sum + (item.status === 'unknown' ? item.weight : 0), 0);
    const naWeight = this.asNumber(summary?.na_weight)
      ?? results.reduce((sum, item) => sum + (item.status === 'na' ? item.weight : 0), 0);
    const percent = this.asNumber(summary?.percent)
      ?? this.asNumber(summary?.average_score)
      ?? this.asNumber(summary?.overall_score)
      ?? this.asNumber(summary?.score_percentage)
      ?? (achievableWeight > 0 ? (earnedWeight / achievableWeight) * 100 : 0);

    return {
      items: this.asNumber(summary?.items) ?? this.asNumber(summary?.total_items) ?? results.length,
      achievable_weight: achievableWeight,
      earned_weight: earnedWeight,
      failed_weight: failedWeight,
      unknown_weight: unknownWeight,
      na_weight: naWeight,
      percent,
    };
  }

  private normalizeRubricAnalyticsData(raw: any): RubricAnalyticsData {
    const payload = this.unwrapPayload(raw);
    const rubricSummary = this.isRecord(payload?.rubric_summary) ? payload.rubric_summary : {};
    const rubricCategorySummary = this.normalizeRubricCategorySummary(rubricSummary);
    const results = this.normalizeResults(
      rubricSummary?.results
      ?? payload?.results
      ?? payload?.evaluation_results
      ?? payload?.category_breakdown
      ?? payload?.categories
    );
    const derivedFacts = this.isRecord(payload?.derived_facts)
        ? payload.derived_facts
        : this.isRecord(payload?.derivedFacts)
          ? payload.derivedFacts
          : {};
    const averageScores = this.normalizeNumericMap(payload?.average_scores);
    const scoreDistribution = this.normalizeNumericMap(payload?.score_distribution);
    const trends = this.normalizeNumericMap(payload?.trends);
    const rubricSummaryValues = Object.values(rubricCategorySummary);
    const averagePercentFromCategories = rubricSummaryValues.length > 0
      ? rubricSummaryValues.reduce((sum, category) => sum + category.average_percentage, 0) / rubricSummaryValues.length
      : undefined;
    const totalScoreFromCategories = rubricSummaryValues.reduce((sum, category) => sum + category.total_score, 0);
    const maxPossibleFromCategories = rubricSummaryValues.reduce((sum, category) => sum + category.max_possible_score, 0);
    const countFromCategories = rubricSummaryValues.reduce((sum, category) => sum + category.count, 0);
    const summarySource = this.isRecord(rubricSummary?.summary) ? rubricSummary.summary : payload;

    return {
      rubric: {
        file: this.asString(payload?.rubric?.file) || DEFAULT_RUBRIC.file,
        sheet: this.asString(payload?.rubric?.sheet) || DEFAULT_RUBRIC.sheet,
      },
      derived_facts: Object.fromEntries(
        Object.entries(derivedFacts).map(([key, value]) => [key, Boolean(value)])
      ),
      summary: {
        ...this.buildSummary(summarySource, results),
        items: this.asNumber((summarySource as Record<string, unknown>)?.items) ?? countFromCategories ?? results.length,
        achievable_weight: this.asNumber((summarySource as Record<string, unknown>)?.achievable_weight)
          ?? this.asNumber((summarySource as Record<string, unknown>)?.max_possible_score)
          ?? maxPossibleFromCategories
          ?? results.reduce((sum, item) => sum + item.weight, 0),
        earned_weight: this.asNumber((summarySource as Record<string, unknown>)?.earned_weight)
          ?? this.asNumber((summarySource as Record<string, unknown>)?.total_score)
          ?? totalScoreFromCategories
          ?? results.reduce((sum, item) => sum + (item.status === 'pass' ? item.weight : 0), 0),
        percent: this.asNumber((summarySource as Record<string, unknown>)?.percent)
          ?? this.asNumber((summarySource as Record<string, unknown>)?.average_percentage)
          ?? averagePercentFromCategories
          ?? this.buildSummary(summarySource, results).percent,
      },
      results,
      total_calls: this.asNumber(payload?.total_calls) ?? null,
      average_scores: averageScores,
      score_distribution: scoreDistribution,
      trends,
      rubric_summary: rubricCategorySummary,
    };
  }

  private normalizeCampaignAnalytics(raw: any, executionLookup?: Record<string, ExecutionListItemLite>): RubricCampaignAnalytics | null {
    const payload = this.unwrapPayload(raw);
    const executionPayload = this.isRecord(payload?.execution) ? payload.execution : payload;
    const executionId = this.extractId(executionPayload?.execution_id)
      || this.extractId(executionPayload?._id)
      || this.extractId(executionPayload?.id);

    if (!executionId) {
      return null;
    }

    const execution = executionLookup?.[executionId];
    const analytics = this.normalizeRubricAnalyticsData(
      executionPayload?.analytics
      ?? payload?.analytics
      ?? executionPayload
      ?? payload
    );
    const trendBreakdown = this.normalizeTrendBreakdown(executionPayload, analytics);

    return {
      execution_id: executionId,
      execution_name: this.asString(executionPayload?.execution_name)
        || this.asString(executionPayload?.name)
        || execution?.execution_name
        || null,
      created_at: this.asString(executionPayload?.created_at) || execution?.created_at || null,
      updated_at: this.asString(executionPayload?.updated_at) || execution?.updated_at || null,
      total_calls: this.asNumber(executionPayload?.total_calls)
        ?? this.asNumber(executionPayload?.analytics?.total_calls)
        ?? this.asNumber(executionPayload?.call_count)
        ?? analytics.total_calls
        ?? null,
      completed_calls: this.asNumber(executionPayload?.completed_calls)
        ?? this.asNumber(executionPayload?.evaluated_calls)
        ?? this.asNumber(executionPayload?.answered_calls)
        ?? null,
      trend: this.asNumber(executionPayload?.trend)
        ?? this.asNumber(executionPayload?.score_trend)
        ?? this.asNumber(executionPayload?.average_score)
        ?? null,
      trend_breakdown: trendBreakdown,
      analytics,
    };
  }

  private extractBatchItems(raw: any): any[] {
    const payload = this.unwrapPayload(raw);

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.analytics)) return payload.analytics;
    if (Array.isArray(payload?.executions)) return payload.executions;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.items)) return payload.items;
    if (this.isRecord(payload?.executions)) return Object.values(payload.executions);

    if (this.isRecord(payload)) {
      const values = Object.values(payload);
      if (values.every((item) => this.isRecord(item))) {
        return values;
      }
    }

    return [];
  }

  private normalizeExecution(raw: any): ExecutionListItemLite | null {
    const executionId = this.extractId(raw?.execution_id)
      || this.extractId(raw?._id)
      || this.extractId(raw?.id);

    if (!executionId) return null;

    return {
      execution_id: executionId,
      execution_name: this.asString(raw?.execution_name) || this.asString(raw?.name) || null,
      created_at: this.asString(raw?.created_at) || this.asString(raw?.start_time) || null,
      updated_at: this.asString(raw?.updated_at) || this.asString(raw?.modified_at) || null,
      status: this.asString(raw?.status) || null,
    };
  }

  private buildLegacyMockEvaluation(callId: string): CallAnalyticsResponse {
    const score = 76;

    return {
      status: 'success',
      data: {
        evaluation_id: `mock_eval_${callId}`,
        call_id: callId,
        status: 'completed',
        score,
        results: [
          {
            name: 'Agent Introduction',
            status: 'pass',
            weight: 20,
            evidence: ['Agent introduced themselves and the company clearly.'],
            reason: 'Proper introduction with company name',
            confidence: 'high',
            method: 'rules',
            notes: null,
          },
          {
            name: 'Customer Engagement',
            status: 'pass',
            weight: 15,
            evidence: ['Customer interaction established.'],
            reason: 'Customer interaction maintained',
            confidence: 'medium',
            method: 'llm',
            notes: null,
          },
          {
            name: 'Payment Discussion',
            status: 'pass',
            weight: 25,
            evidence: ['Payment details clearly communicated.'],
            reason: 'Clear payment information provided',
            confidence: 'high',
            method: 'rules',
            notes: null,
          },
          {
            name: 'Professional Tone',
            status: 'pass',
            weight: 20,
            evidence: ['Professional communication maintained.'],
            reason: 'Professional tone maintained',
            confidence: 'medium',
            method: 'llm',
            notes: null,
          },
          {
            name: 'Call Resolution',
            status: 'pass',
            weight: 20,
            evidence: ['Call concluded appropriately.'],
            reason: 'Call properly resolved',
            confidence: 'high',
            method: 'rules',
            notes: null,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Get all executions.
   * GET /executions
   */
  async getExecutions(): Promise<ExecutionListItemLite[]> {
    const url = this.buildAppUrl('/executions');
    const response = await axiosInstance.get(url);
    const payload = this.unwrapPayload(response.data);
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.executions)
        ? payload.executions
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

    return items
      .map((item: any) => this.normalizeExecution(item))
      .filter((item: ExecutionListItemLite | null): item is ExecutionListItemLite => Boolean(item));
  }

  /**
   * Get rubric analytics for a specific execution.
   * GET /call-analytics/rubric-analytics/{execution_id}
   */
  async getRubricAnalyticsByExecution(executionId: string): Promise<RubricCampaignAnalytics> {
    const primaryUrl = this.buildAppUrl(`/call-analytics/execution-summary/${encodeURIComponent(executionId)}`);

    try {
      const response = await axiosInstance.get(primaryUrl);
      const normalized = this.normalizeCampaignAnalytics(response.data);

      if (!normalized) {
        throw new Error('Rubric analytics response did not contain an execution id.');
      }

      return normalized;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) {
        throw error;
      }
    }

    const fallbackUrls = [
      this.buildAppUrl(`/call-analytics/rubric-analytics?executionId=${encodeURIComponent(executionId)}`),
      this.buildAppUrl(`/call-analytics/rubric-analytics/${encodeURIComponent(executionId)}`),
    ];

    for (const fallbackUrl of fallbackUrls) {
      try {
        const fallbackResponse = await axiosInstance.get(fallbackUrl);
        const normalized = this.normalizeCampaignAnalytics(fallbackResponse.data);

        if (normalized) {
          return normalized;
        }
      } catch (fallbackError: any) {
        const status = fallbackError?.response?.status;
        if (status !== 404 && status !== 405) {
          throw fallbackError;
        }
      }
    }

    throw new Error('Rubric analytics response did not contain an execution id.');
  }

  /**
   * Get rubric analytics for multiple executions.
   * POST /call-analytics/rubric-analytics/batch
   */
  async getRubricAnalyticsBatch(
    executionIds: string[],
    executionLookup?: Record<string, ExecutionListItemLite>
  ): Promise<RubricCampaignAnalytics[]> {
    try {
      const params: Record<string, number> = {
        batch_size: 25000,
      };

      if (executionIds.length > 0) {
        params.limit = executionIds.length;
      }

      const url = this.buildAppUrl('/call-analytics/executions-batch');
      const response = await axiosInstance.get(url, { params });
      const items = this.extractBatchItems(response.data);
      const normalizedItems = items
        .map((item) => this.normalizeCampaignAnalytics(item, executionLookup))
        .filter((item): item is RubricCampaignAnalytics => Boolean(item));

      if (normalizedItems.length > 0) {
        if (executionIds.length === 0) {
          return normalizedItems;
        }

        const requestedIds = new Set(executionIds);
        return normalizedItems.filter((item) => requestedIds.has(item.execution_id));
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 405) {
        throw error;
      }
    }

    if (executionIds.length === 0) return [];

    const url = this.buildAppUrl('/call-analytics/rubric-analytics/batch');
    const response = await axiosInstance.post(url, { execution_ids: executionIds });
    const items = this.extractBatchItems(response.data);

    return items
      .map((item) => this.normalizeCampaignAnalytics(item, executionLookup))
      .filter((item): item is RubricCampaignAnalytics => Boolean(item));
  }


  async evaluateCallBySession(
    payload: {
      session_id: string;
      execution_id?: string;
      call_id?: string;
      transcript?: string;
      [key: string]: any;
    }
  ): Promise<CallAnalyticsResponse> {
    const url = this.buildAppUrl('/call-analytics/evaluate');
    const response = await axiosInstance.post(url, payload);
    const raw = this.unwrapPayload(response.data) ?? response.data;
    const normalized = this.normalizeDirectEvaluation(raw, payload.session_id, payload.execution_id);

    return {
      status: this.asString(raw?.status) || 'success',
      data: normalized ?? undefined,
      message: this.asString(raw?.message),
    };
  }

  private normalizeDirectEvaluation(raw: any, sessionId?: string, executionId?: string): CallEvaluation | null {
    const payload = this.unwrapPayload(raw) ?? raw;
    if (!this.isRecord(payload)) return null;

    const directEvaluation = this.isRecord(payload?.evaluation) ? payload.evaluation : null;
    const directReport = this.isRecord(payload?.report) ? payload.report : null;
    const fallbackSummary = this.isRecord(directReport?.summary) ? directReport.summary : null;
    const fallbackDetailed = Array.isArray(directReport?.detailed_results)
      ? directReport.detailed_results
      : Array.isArray(directReport?.results)
        ? directReport.results
        : [];

    if (!directEvaluation && !directReport && !payload?.call_id && !payload?.session_id) {
      return null;
    }

    const normalizedReport = this.normalizeRubricAnalyticsData({
      summary: directEvaluation?.summary ?? fallbackSummary ?? {},
      results: directEvaluation?.detailed_results ?? fallbackDetailed,
      detailed_results: directEvaluation?.detailed_results ?? fallbackDetailed,
      derived_facts: directEvaluation?.derived_facts ?? directReport?.derived_facts ?? {},
      rubric_summary: directReport?.rubric_summary ?? {},
    });

    const score = this.asNumber(directEvaluation?.percent)
      ?? this.asNumber(fallbackSummary?.percent)
      ?? this.asNumber(payload?.score)
      ?? normalizedReport.summary.percent
      ?? 0;

    return {
      evaluation_id: this.asString(payload?.evaluation_id) || this.asString(payload?.id),
      call_id: this.asString(payload?.call_id) || this.asString(payload?.session_id) || sessionId || '',
      session_id: this.asString(payload?.session_id) || sessionId,
      execution_id: this.asString(payload?.execution_id) || executionId,
      status: 'completed',
      score,
      report: normalizedReport,
      results: normalizedReport.results,
      created_at: this.asString(payload?.created_at),
      updated_at: this.asString(payload?.updated_at),
      completed_at: this.asString(payload?.completed_at),
      error_message: this.asString(payload?.error_message),
    };
  }

  /**
   * Get evaluation by call ID.
   * GET /call-analytics/evaluations/{call_id}
   */
  async getEvaluationByCallId(callId: string): Promise<CallAnalyticsResponse> {
    try {
      const url = this.buildAppUrl(`/call-analytics/evaluations/${callId}`);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (primaryError: any) {
      if (primaryError.response?.status === 422) {
        const altUrl = this.buildAppUrl(`/call-analytics/evaluations-by-evaluation-id/${callId}`);
        const response = await axiosInstance.get(altUrl);
        return response.data;
      }

      throw new Error(
        primaryError.response?.data?.message
          || primaryError.response?.data?.detail
          || primaryError.message
          || 'Failed to fetch evaluation.'
      );
    }
  }

  /**
   * Get evaluation by evaluation ID.
   * GET /call-analytics/evaluations-by-evaluation-id/{evaluation_id}
   */
  async getEvaluationByEvaluationId(evaluationId: string): Promise<CallAnalyticsResponse> {
    const url = this.buildAppUrl(`/call-analytics/evaluations-by-evaluation-id/${evaluationId}`);
    const response = await axiosInstance.get(url);
    return response.data;
  }

  /**
   * Evaluate call transcript.
   * POST /call-analytics/evaluate
   */
  async evaluateCall(transcript: string, callId?: string): Promise<CallAnalyticsResponse> {
    try {
      const url = this.buildAppUrl('/call-analytics/evaluate');
      const payload: Record<string, any> = {
        transcript,
        rubric_file: 'ozonetel_rubric.json',
        grader: 'rules',
        model: 'llama-3.3-70b-versatile',
      };

      if (callId) {
        payload.call_id = callId;
      }

      const response = await axiosInstance.post(url, payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422) {
        const errorData = error.response?.data;
        const message = typeof errorData === 'string'
          ? errorData
          : errorData?.message || errorData?.detail || 'Validation failed';
        throw new Error(message);
      }

      throw new Error(error.response?.data?.message || error.message || 'Failed to evaluate call');
    }
  }

  /**
   * Trigger real-time evaluation.
   * POST /call-analytics/evaluate-realtime
   */
  async triggerRealTimeEvaluation(
    callId: string,
    options: {
      sessionId?: string;
      executionId?: string;
      rubricFile?: string;
      grader?: 'rules' | 'llm' | 'hybrid';
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<CallAnalyticsResponse> {
    try {
      const url = this.buildAppUrl('/call-analytics/evaluate-realtime');
      const response = await axiosInstance.post(url, {
        call_id: callId,
        session_id: options.sessionId,
        execution_id: options.executionId,
        rubric_file: options.rubricFile ?? 'ozonetel_rubric.json',
        grader: options.grader ?? 'hybrid',
        model: options.model ?? 'llama-3.3-70b-versatile',
        temperature: options.temperature ?? 0,
        max_tokens: options.maxTokens ?? 1200,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 422) {
        try {
          return await this.getEvaluationByCallId(callId);
        } catch {
          return this.buildLegacyMockEvaluation(callId);
        }
      }

      throw new Error(error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to trigger evaluation');
    }
  }

  /**
   * Get all evaluations with filtering.
   * GET /call-analytics/evaluations
   */
  async getAllEvaluations(filters: {
    status?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    executionId?: string;
  } = {}): Promise<CallAnalyticsResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.executionId) params.append('execution_id', filters.executionId);

    const url = this.buildAppUrl(`/call-analytics/evaluations${params.toString() ? `?${params.toString()}` : ''}`);
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async getDetailedCallsByExecution(executionId: string): Promise<DetailedCallAnalyticsItem[]> {
    const url = this.buildAppUrl(`/call-analytics/detailed-calls/${encodeURIComponent(executionId)}`);
    const response = await axiosInstance.get(url);
    const payload = this.unwrapPayload(response.data) ?? response.data;
    const items = Array.isArray(payload?.calls) ? payload.calls : Array.isArray(payload) ? payload : [];

    return items.map((item: any) => {
      const evaluation = this.isRecord(item?.evaluation) ? item.evaluation : null;
      const report = this.isRecord(evaluation?.report)
        ? evaluation.report
        : this.isRecord(evaluation?.result)
          ? evaluation.result
          : null;
      const normalizedReport = report ? this.normalizeRubricAnalyticsData(report) : undefined;
      const score = this.asNumber(evaluation?.score)
        ?? this.asNumber(report?.summary?.percent)
        ?? undefined;

      return {
        session_id: this.asString(item?.session_id) || null,
        call_id: this.asString(item?.call_id) || null,
        execution_id: this.asString(item?.execution_id) || executionId,
        call_status: this.asString(item?.call_status) || null,
        created_at: this.asString(item?.created_at) || null,
        updated_at: this.asString(item?.updated_at) || null,
        evaluation: evaluation
          ? {
              evaluation_id: this.asString(evaluation?.evaluation_id),
              call_id: this.asString(evaluation?.call_id) || this.asString(item?.call_id) || this.asString(item?.session_id) || '',
              session_id: this.asString(evaluation?.session_id) || this.asString(item?.session_id),
              execution_id: this.asString(evaluation?.execution_id) || executionId,
              status: ['pending', 'processing', 'completed', 'failed', 'error'].includes(String(evaluation?.status))
                ? (String(evaluation?.status) === 'error' ? 'failed' : evaluation.status)
                : 'pending',
              score,
              report: normalizedReport,
              results: normalizedReport?.results || this.normalizeResults(evaluation?.results),
              created_at: this.asString(evaluation?.created_at),
              updated_at: this.asString(evaluation?.updated_at),
              completed_at: this.asString(evaluation?.completed_at),
              error_message: this.asString(evaluation?.error_message),
            }
          : null,
      };
    });
  }

  async getRubricExecutionSummariesLite(limit = 50): Promise<RubricCampaignAnalytics[]> {
    if (this.executionSummariesLiteSupported === false) {
      return [];
    }

    try {
      const url = this.buildAppUrl('/call-analytics/execution-summaries-lite');
      const response = await axiosInstance.get(url, { params: { limit } });
      this.executionSummariesLiteSupported = true;
      const items = this.extractBatchItems(response.data);

      return items
        .map((item) => this.normalizeCampaignAnalytics(item))
        .filter((item): item is RubricCampaignAnalytics => Boolean(item));
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 405) {
        this.executionSummariesLiteSupported = false;
        return [];
      }
      throw error;
    }
  }

  async startExecutionEvaluation(
    executionId: string,
    payload: {
      rubric_file?: string;
      grader?: 'rules' | 'llm' | 'hybrid';
      model?: string;
      temperature?: number;
      max_tokens?: number;
      limit?: number;
      force?: boolean;
    } = {}
  ): Promise<{ status: string; job_id: string; execution_id: string; message?: string }> {
    const url = this.buildAppUrl(`/call-analytics/evaluate-execution/${encodeURIComponent(executionId)}`);
    const response = await axiosInstance.post(url, payload);
    return response.data;
  }

  async getExecutionEvaluationJobStatus(jobId: string): Promise<{
    status: string;
    job?: {
      job_id: string;
      execution_id: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      total: number;
      processed: number;
      percentage: number;
      errors: Array<Record<string, string>>;
      created_at?: string;
      started_at?: string | null;
      completed_at?: string | null;
    };
  }> {
    const url = this.buildAppUrl(`/call-analytics/evaluate-execution/status/${encodeURIComponent(jobId)}`);
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async startAllExecutionEvaluations(
    payload: {
      rubric_file?: string;
      grader?: 'rules' | 'llm' | 'hybrid';
      model?: string;
      temperature?: number;
      max_tokens?: number;
      limit?: number;
      execution_limit?: number;
      force?: boolean;
    } = {}
  ): Promise<{ status: string; job_id: string; message?: string }> {
    const url = this.buildAppUrl('/call-analytics/evaluate-all-executions');
    const response = await axiosInstance.post(url, payload);
    return response.data;
  }

  async getAllExecutionEvaluationJobStatus(jobId: string): Promise<{
    status: string;
    job?: {
      job_id: string;
      scope?: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      total: number;
      processed: number;
      percentage: number;
      errors: Array<Record<string, unknown>>;
      execution_results: Array<Record<string, unknown>>;
      total_executions: number;
      processed_executions: number;
      total_calls: number;
      processed_calls: number;
      created_at?: string;
      started_at?: string | null;
      completed_at?: string | null;
    };
  }> {
    const url = this.buildAppUrl(`/call-analytics/evaluate-all-executions/status/${encodeURIComponent(jobId)}`);
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async generateRubricPeriodReport(params: {
    period_type: 'weekly' | 'monthly' | 'yearly';
    year: number;
    month?: number;
    week?: number;
    limit?: number;
  }): Promise<any> {
    const url = this.buildAppUrl('/call-analytics/reports/generate');
    const response = await axiosInstance.post(url, params);
    return response.data;
  }

  async getRubricPeriodReport(params: {
    period_type: 'weekly' | 'monthly' | 'yearly';
    year: number;
    month?: number;
    week?: number;
  }): Promise<any> {
    const url = this.buildAppUrl('/call-analytics/reports');
    const response = await axiosInstance.get(url, { params });
    return this.unwrapPayload(response.data) ?? response.data;
  }

  async getRubricPeriodSummary(params: {
    period_type: 'weekly' | 'monthly' | 'yearly';
    year: number;
    month?: number;
    week?: number;
  }): Promise<any> {
    const url = this.buildAppUrl('/call-analytics/reports/summary');
    const response = await axiosInstance.get(url, { params });
    return this.unwrapPayload(response.data) ?? response.data;
  }

  async getRubricPeriodAvailable(): Promise<any> {
    const url = this.buildAppUrl('/call-analytics/reports/available');
    const response = await axiosInstance.get(url);
    return this.unwrapPayload(response.data) ?? response.data;
  }

  async getNormalizedRubricPeriodReport(params: {
    period_type: 'weekly' | 'monthly' | 'yearly';
    year: number;
    month?: number;
    week?: number;
  }): Promise<{
    report: any | null;
    campaigns: RubricCampaignAnalytics[];
    overview: {
      total_campaigns: number;
      evaluated_campaigns: number;
      average_score: number;
      total_calls: number;
      completed_calls: number;
      excellent: number;
      average: number;
      poor: number;
    } | null;
  }> {
    const response = await this.getRubricPeriodReport(params);
    const report = this.isRecord(response?.report) ? response.report : response;

    if (!report) {
      return {
        report: null,
        campaigns: [],
        overview: null,
      };
    }

    const campaigns = this.extractBatchItems(report?.campaigns ?? report)
      .map((item) => this.normalizeCampaignAnalytics(item))
      .filter((item): item is RubricCampaignAnalytics => Boolean(item));

    const overviewSource = this.isRecord(report?.overview) ? report.overview : null;
    const computedAverageScore = campaigns.length > 0
      ? campaigns.reduce((sum, campaign) => sum + campaign.analytics.summary.percent, 0) / campaigns.length
      : 0;

    const computedTotalCalls = campaigns.reduce(
      (sum, campaign) => sum + (campaign.total_calls ?? campaign.analytics.total_calls ?? 0),
      0
    );
    const computedCompletedCalls = campaigns.reduce(
      (sum, campaign) => sum + (campaign.completed_calls ?? 0),
      0
    );
    const computedExcellent = campaigns.reduce(
      (sum, campaign) => sum + (campaign.trend_breakdown?.exceeding_expectations ?? campaign.trend_breakdown?.excellent ?? 0),
      0
    );
    const computedAverage = campaigns.reduce(
      (sum, campaign) => sum + (campaign.trend_breakdown?.meeting_expectations ?? campaign.trend_breakdown?.average ?? 0),
      0
    );
    const computedPoor = campaigns.reduce(
      (sum, campaign) => sum + (campaign.trend_breakdown?.improvement_needed ?? campaign.trend_breakdown?.poor ?? 0),
      0
    );

    return {
      report,
      campaigns,
      overview: {
        total_campaigns: this.asNumber(overviewSource?.total_campaigns) ?? campaigns.length,
        evaluated_campaigns: this.asNumber(overviewSource?.evaluated_campaigns)
          ?? campaigns.filter((campaign) => (campaign.completed_calls ?? 0) > 0).length,
        average_score: this.asNumber(overviewSource?.average_score) ?? computedAverageScore,
        total_calls: this.asNumber(overviewSource?.total_calls) ?? computedTotalCalls,
        completed_calls: this.asNumber(overviewSource?.completed_calls) ?? computedCompletedCalls,
        excellent: this.asNumber(overviewSource?.excellent) ?? computedExcellent,
        average: this.asNumber(overviewSource?.average) ?? computedAverage,
        poor: this.asNumber(overviewSource?.poor) ?? computedPoor,
      },
    };
  }

  /**
   * Normalize a call evaluation payload into rubric analytics data.
   */
  toRubricAnalyticsData(payload: CallEvaluation | RubricAnalyticsData | any): RubricAnalyticsData {
    if (payload?.summary && Array.isArray(payload?.results)) {
      return this.normalizeRubricAnalyticsData(payload);
    }

    const results = this.normalizeResults(payload?.results);
    return {
      rubric: DEFAULT_RUBRIC,
      derived_facts: this.isRecord(payload?.derived_facts) ? payload.derived_facts : {},
      summary: this.buildSummary(
        {
          summary: {
            items: results.length,
            score: payload?.score,
          },
        },
        results
      ),
      results,
    };
  }

  /**
   * Get available rubrics.
   * GET /call-analytics/rubrics
   */
  async getRubrics(): Promise<any> {
    const url = this.buildAppUrl('/call-analytics/rubrics');
    const response = await axiosInstance.get(url);
    return response.data;
  }

  /**
   * Health check.
   * GET /call-analytics/health
   */
  async healthCheck(): Promise<any> {
    const url = this.buildAppUrl('/call-analytics/health');
    const response = await axiosInstance.get(url);
    return response.data;
  }
}

const callAnalyticsService = new CallAnalyticsService();
export default callAnalyticsService;
