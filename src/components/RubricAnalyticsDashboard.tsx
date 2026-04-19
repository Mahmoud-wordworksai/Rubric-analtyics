"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import type {
  CallEvaluation,
  DetailedCallAnalyticsItem,
  ExecutionListItemLite,
  Result,
  RubricCategoryAggregate,
  RubricAnalyticsData,
  RubricCampaignAnalytics,
  Summary,
} from '@/lib/types';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Modal,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  EyeOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import APIService from '@/APIServices';
import { getProjectFromUrl } from '@/lib/axios';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const FALLBACK_CUSTOMER_PROJECTS = [
  'agrim',
  'bajaj',
  'cipla',
  'cred',
  'dbs_mintek',
  'dubai_expats',
  'ecofy',
  'hdfc',
  'it_cart',
  'kissht',
  'micro_fi',
  'mktg_micro_fi',
  'multify',
  'opus',
  'salesbot',
  'shubham_housing',
  'smart_dial',
  'ugro',
  'voicebot',
  'wwai_test',
];

const getQualityLabel = (percent: number) => {
  if (percent >= 75) return { label: 'Excellent', color: 'green' };
  if (percent >= 50) return { label: 'Average', color: 'orange' };
  return { label: 'Poor', color: 'red' };
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatMetricLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatProjectLabel = (value: string) =>
  value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getTopMetric = (metrics?: Record<string, number>) => {
  if (!metrics || Object.keys(metrics).length === 0) return null;

  return Object.entries(metrics).sort((left, right) => right[1] - left[1])[0] || null;
};

const sortExecutionsByRecency = (items: ExecutionListItemLite[]) =>
  [...items].sort((left, right) => {
    const leftTime = new Date(left.updated_at || left.created_at || 0).getTime();
    const rightTime = new Date(right.updated_at || right.created_at || 0).getTime();
    return rightTime - leftTime;
  });

const getReportParamsByPeriod = (
  periodType: 'monthly' | 'yearly' | 'weekly',
  selectedYear: number,
  selectedMonth: number,
  selectedWeek?: number
) => {
  if (periodType === 'yearly') {
    return {
      period_type: 'yearly' as const,
      year: selectedYear,
    };
  }

  if (periodType === 'weekly') {
    return {
      period_type: 'weekly' as const,
      year: selectedYear,
      month: selectedMonth,
      week: selectedWeek ?? 1,
    };
  }

  return {
    period_type: 'monthly' as const,
    year: selectedYear,
    month: selectedMonth,
  };
};

// Get ISO week number for a date
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const CallScoreOverview = ({ summary }: { summary: Summary }) => {
  const quality = getQualityLabel(summary.percent);

  return (
    <Card title="Campaign Score Overview">
      <Row gutter={[16, 16]}>
        <Col span={24} md={8}>
          <div className="flex flex-col items-center justify-center rounded-lg border p-6 text-center">
            <div className="my-2 text-5xl font-bold text-black">
              {Math.round(summary.percent)}
              <span className="text-3xl text-black">%</span>
            </div>
            <Tag color={quality.color} className="text-lg font-semibold">
              {quality.label}
            </Tag>
          </div>
        </Col>
        <Col span={24} md={16}>
          <Row gutter={[16, 16]}>
            <Col span={12} md={8}>
              <Card className="text-center">
                <TrophyOutlined className="text-2xl text-green-500" />
                <div className="mt-2 text-sm text-black-500">Earned Weight</div>
                <div className="text-xl font-bold">{summary.earned_weight}</div>
              </Card>
            </Col>
            <Col span={12} md={8}>
              <Card className="text-center">
                <InfoCircleOutlined className="text-2xl text-blue-500" />
                <div className="mt-2 text-sm text-black-500">Achievable Weight</div>
                <div className="text-xl font-bold">{summary.achievable_weight}</div>
              </Card>
            </Col>
            <Col span={12} md={8}>
              <Card className="text-center">
                <WarningOutlined className="text-2xl text-red-500" />
                <div className="mt-2 text-sm text-black-500">Failed Weight</div>
                <div className="text-xl font-bold">{summary.failed_weight}</div>
              </Card>
            </Col>
            <Col span={12} md={6}>
              <Card className="text-center">
                <QuestionCircleOutlined className="text-2xl text-yellow-500" />
                <div className="mt-2 text-sm text-black-500">Unknown Weight</div>
                <div className="text-xl font-bold">{summary.unknown_weight}</div>
              </Card>
            </Col>
            <Col span={12} md={6}>
              <Card className="text-center">
                <MinusCircleOutlined className="text-2xl text-black-500" />
                <div className="mt-2 text-sm text-black-500">N/A Weight</div>
                <div className="text-xl font-bold">{summary.na_weight}</div>
              </Card>
            </Col>
            <Col span={12} md={12}>
              <Card className="text-center">
                <CheckCircleOutlined className="text-2xl text-purple-500" />
                <div className="mt-2 text-sm text-black-500">Total Items</div>
                <div className="text-xl font-bold">{summary.items}</div>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

const DerivedSignals = ({ derivedFacts }: { derivedFacts: Record<string, boolean> }) => {
  if (Object.keys(derivedFacts).length === 0) {
    return (
      <Card title="Derived Signals">
        <Empty description="No derived signals returned by the backend" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card title="Derived Signals">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(derivedFacts).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded border p-3">
            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
            <Tag color={value ? 'green' : 'red'}>{value ? 'Yes' : 'No'}</Tag>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ScoreDistribution = ({ results }: { results: Result[] }) => {
  const statusCounts = {
    pass: results.filter((result) => result.status === 'pass').length,
    fail: results.filter((result) => result.status === 'fail').length,
    unknown: results.filter((result) => result.status === 'unknown').length,
    na: results.filter((result) => result.status === 'na').length,
  };
  const total = results.length;

  return (
    <Card title="Score Distribution">
      <div className="space-y-3">
        {(['pass', 'fail', 'unknown', 'na'] as const).map((status) => (
          <div key={status}>
            <div className="mb-1 flex justify-between">
              <span>{status.toUpperCase()}</span>
              <span>{statusCounts[status]}/{total}</span>
            </div>
            <Progress
              percent={total > 0 ? Math.round((statusCounts[status] / total) * 100) : 0}
              status={status === 'pass' ? 'success' : status === 'fail' ? 'exception' : 'normal'}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

const MetricsBreakdownCard = ({
  title,
  metrics,
}: {
  title: string;
  metrics?: Record<string, number>;
}) => {
  const entries = Object.entries(metrics || {});
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (entries.length === 0) {
    return (
      <Card title={title}>
        <Empty description={`No ${title.toLowerCase()} returned by the backend`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card title={title}>
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between">
              <span>{formatMetricLabel(key)}</span>
              <span>{value}</span>
            </div>
            <Progress percent={total > 0 ? Math.round((value / total) * 100) : 0} status="normal" />
          </div>
        ))}
      </div>
    </Card>
  );
};

const AverageScoresCard = ({ metrics }: { metrics?: Record<string, number> }) => {
  const entries = Object.entries(metrics || {});

  if (entries.length === 0) {
    return (
      <Card title="Average Scores">
        <Empty description="No average scores returned by the backend" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card title="Average Scores">
      <Row gutter={[16, 16]}>
        {entries.map(([key, value]) => (
          <Col key={key} span={24} md={12} xl={8}>
            <Card size="small">
              <div className="text-sm text-gray-500">{formatMetricLabel(key)}</div>
              <div className="mt-2 text-2xl font-semibold">{value.toFixed(2)}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

const RubricCategorySummaryCard = ({
  categories,
}: {
  categories?: Record<string, RubricCategoryAggregate>;
}) => {
  const entries = Object.entries(categories || {});

  if (entries.length === 0) {
    return (
      <Card title="Rubric Categories">
        <Empty description="No rubric category summary returned by the backend" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card title="Rubric Categories">
      <Row gutter={[16, 16]}>
        {entries.map(([key, value]) => (
          <Col key={key} span={24} md={12}>
            <Card size="small">
              <div className="text-sm text-gray-500">{formatMetricLabel(key)}</div>
              <div className="mt-2 text-2xl font-semibold">{value.average_percentage.toFixed(1)}%</div>
              <div className="mt-2 text-xs text-gray-500">
                Score {value.total_score}/{value.max_possible_score} across {value.count} evaluation{value.count === 1 ? '' : 's'}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

const AnalyticsTable = ({
  results,
  onViewEvidence,
}: {
  results: Result[];
  onViewEvidence: (result: Result) => void;
}) => {
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Result['status']) => {
        const colorMap = {
          pass: 'green',
          fail: 'red',
          unknown: 'orange',
          na: 'default',
        };

        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    { title: 'Weight', dataIndex: 'weight', key: 'weight' },
    { title: 'Method', dataIndex: 'method', key: 'method' },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: Result['confidence']) => {
        const colorMap = {
          high: 'green',
          medium: 'orange',
          low: 'red',
        };
        return <Tag color={colorMap[confidence]}>{confidence.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: Result) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => onViewEvidence(record)}>
          View Evidence
        </Button>
      ),
    },
  ];

  return (
    <Card title="Rubric Criteria">
      <Table<Result> columns={columns} dataSource={results} rowKey="name" pagination={{ pageSize: 10 }} />
    </Card>
  );
};

const EvidenceViewer = ({
  result,
  open,
  onClose,
}: {
  result: Result | null;
  open: boolean;
  onClose: () => void;
}) => {
  if (!result) return null;

  return (
    <Modal title={result.name} open={open} onCancel={onClose} footer={null} width={800}>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Reason</h3>
          <p>{result.reason}</p>
        </div>
        <div>
          <h3 className="font-semibold">Evidence</h3>
          {result.evidence.length === 0 ? (
            <p className="text-gray-500">No evidence returned.</p>
          ) : (
            <div className="rounded bg-black-100 p-3">
              {result.evidence.map((entry, index) => (
                <div key={`${result.name}-${index}`} className="mb-2 rounded bg-white p-2 last:mb-0">
                  &quot;{entry}&quot;
                </div>
              ))}
            </div>
          )}
        </div>
        {result.notes && (
          <div>
            <h3 className="font-semibold">Notes</h3>
            <p>{result.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

const getEvaluationStatusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'processing':
      return 'blue';
    default:
      return 'default';
  }
};

const DetailedCallsTable = ({
  calls,
  loading,
  onViewEvaluation,
}: {
  calls: DetailedCallAnalyticsItem[];
  loading: boolean;
  onViewEvaluation: (evaluation: CallEvaluation) => void;
}) => {
  const columns = [
    {
      title: 'Call',
      key: 'call',
      render: (_: unknown, record: DetailedCallAnalyticsItem) => (
        <div>
          <div className="font-semibold">{record.call_id || record.session_id || '-'}</div>
          <div className="text-xs text-gray-500">{record.session_id || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Call Status',
      dataIndex: 'call_status',
      key: 'call_status',
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: 'Evaluation',
      key: 'evaluation_status',
      render: (_: unknown, record: DetailedCallAnalyticsItem) => (
        <Tag color={getEvaluationStatusColor(record.evaluation?.status)}>
          {(record.evaluation?.status || 'not_started').replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (_: unknown, record: DetailedCallAnalyticsItem) =>
        typeof record.evaluation?.score === 'number' ? `${record.evaluation.score.toFixed(1)}%` : '-',
    },
    {
      title: 'Updated',
      key: 'updated',
      render: (_: unknown, record: DetailedCallAnalyticsItem) =>
        formatDate(record.evaluation?.completed_at || record.updated_at || record.created_at),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: DetailedCallAnalyticsItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          disabled={!record.evaluation?.report && !(record.evaluation?.results && record.evaluation.results.length > 0)}
          onClick={() => record.evaluation && onViewEvaluation(record.evaluation)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <Card title="Detailed Calls">
      <Table<DetailedCallAnalyticsItem>
        columns={columns}
        dataSource={calls}
        loading={loading}
        rowKey={(record) => record.call_id || record.session_id || `${record.execution_id}-${record.created_at}`}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

const CallEvaluationDetailModal = ({
  evaluation,
  open,
  onClose,
  onViewEvidence,
}: {
  evaluation: CallEvaluation | null;
  open: boolean;
  onClose: () => void;
  onViewEvidence: (result: Result) => void;
}) => {
  if (!evaluation) return null;

  const normalized = evaluation.report
    ? evaluation.report
    : APIService.CallAnalyticsService.toRubricAnalyticsData(evaluation);

  return (
    <Modal
      title={`Call Evaluation ${evaluation.call_id}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Tag color={getEvaluationStatusColor(evaluation.status)}>{evaluation.status.toUpperCase()}</Tag>
          <Text>Score: {typeof evaluation.score === 'number' ? `${evaluation.score.toFixed(1)}%` : '-'}</Text>
          <Text type="secondary">Session: {evaluation.session_id || '-'}</Text>
        </div>

        {evaluation.error_message && (
          <Alert type="error" showIcon message="Evaluation Error" description={evaluation.error_message} />
        )}

        <CallScoreOverview summary={normalized.summary} />

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-2/3">
            <DerivedSignals derivedFacts={normalized.derived_facts} />
          </div>
          <div className="lg:w-1/3">
            <ScoreDistribution results={normalized.results} />
          </div>
        </div>

        {normalized.results.length > 0 ? (
          <AnalyticsTable results={normalized.results} onViewEvidence={onViewEvidence} />
        ) : (
          <Empty description="No rubric line items stored for this evaluation yet" />
        )}
      </div>
    </Modal>
  );
};

const CampaignDetail = ({
  campaign,
  detailedCalls,
  detailedCallsLoading,
  onViewCallEvaluation,
  onViewEvidence,
}: {
  campaign: RubricCampaignAnalytics;
  detailedCalls: DetailedCallAnalyticsItem[];
  detailedCallsLoading: boolean;
  onViewCallEvaluation: (evaluation: CallEvaluation) => void;
  onViewEvidence: (result: Result) => void;
}) => {
  const data = campaign.analytics;
  const topTrend = getTopMetric(campaign.trend_breakdown);

  return (
    <div className="space-y-6">
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24} md={10}>
            <div>
              <h2 className="text-2xl font-bold text-black">
                {campaign.execution_name || campaign.execution_id}
              </h2>
              <p className="text-gray-600">{campaign.execution_id}</p>
            </div>
          </Col>
          <Col span={12} md={4}>
            <Statistic title="Score" value={Number(data.summary.percent.toFixed(1))} suffix="%" />
          </Col>
          <Col span={12} md={4}>
            <Statistic title="Primary Trend" value={topTrend ? formatMetricLabel(topTrend[0]) : '-'} />
          </Col>
          <Col span={12} md={3}>
            <Statistic title="Calls" value={campaign.total_calls ?? data.total_calls ?? 0} />
          </Col>
          <Col span={12} md={3}>
            <Statistic title="Completed" value={campaign.completed_calls ?? 0} />
          </Col>
        </Row>
        <div className="mt-4 text-sm text-gray-500">
          Updated {formatDate(campaign.updated_at || campaign.created_at)}
        </div>
      </Card>

      <CallScoreOverview summary={data.summary} />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-2/3">
          {Object.keys(data.derived_facts).length > 0 ? (
            <DerivedSignals derivedFacts={data.derived_facts} />
          ) : (
            <RubricCategorySummaryCard categories={data.rubric_summary} />
          )}
        </div>
        <div className="lg:w-1/3">
          {data.results.length > 0 ? (
            <ScoreDistribution results={data.results} />
          ) : (
            <MetricsBreakdownCard title="Score Distribution" metrics={data.score_distribution} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MetricsBreakdownCard title="Rubric Trends" metrics={campaign.trend_breakdown} />
        <AverageScoresCard metrics={data.average_scores} />
      </div>

      {Object.keys(data.derived_facts).length > 0 && (
        <RubricCategorySummaryCard categories={data.rubric_summary} />
      )}

      {data.results.length > 0 && (
        <AnalyticsTable results={data.results} onViewEvidence={onViewEvidence} />
      )}

      <DetailedCallsTable
        calls={detailedCalls}
        loading={detailedCallsLoading}
        onViewEvaluation={onViewCallEvaluation}
      />
    </div>
  );
};

const ApiAnalyticsTab = () => {
  const [transcript, setTranscript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RubricAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  const analyzeCall = async () => {
    if (!transcript.trim()) {
      message.warning('Please enter a call transcript');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await APIService.CallAnalyticsService.evaluateCall(transcript);
      const payload = response.data ?? response;
      const normalized = APIService.CallAnalyticsService.toRubricAnalyticsData(payload);
      setAnalysisResult(normalized);
      message.success(`Call analyzed successfully. Score: ${normalized.summary.percent.toFixed(1)}%`);
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Failed to analyze call.';
      setError(nextError);
      setAnalysisResult(null);
      message.error(nextError);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-xl font-bold">Score New Call</h2>
        <p className="mb-4 text-gray-600">Submit a transcript to the backend evaluator and inspect the returned rubric output.</p>
        <div className="space-y-4">
          <textarea
            className="min-h-52 w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="Paste call transcript here..."
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button onClick={() => setTranscript('')} disabled={analyzing}>
              Clear
            </Button>
            <Button type="primary" onClick={analyzeCall} loading={analyzing} disabled={!transcript.trim()}>
              Analyze Call
            </Button>
          </div>
        </div>
      </Card>

      {error && <Alert message="Analysis Error" description={error} type="error" showIcon />}

      {analysisResult && (
        <>
          <CallScoreOverview summary={analysisResult.summary} />
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="lg:w-2/3">
              <DerivedSignals derivedFacts={analysisResult.derived_facts} />
            </div>
            <div className="lg:w-1/3">
              <ScoreDistribution results={analysisResult.results} />
            </div>
          </div>
          <AnalyticsTable results={analysisResult.results} onViewEvidence={setSelectedResult} />
          <EvidenceViewer result={selectedResult} open={!!selectedResult} onClose={() => setSelectedResult(null)} />
        </>
      )}
    </div>
  );
};

const RubricAnalyticsDashboard = () => {
  const customerOptions = useMemo(() => {
    const configured = (process.env.NEXT_PUBLIC_RUBRIC_CUSTOMERS || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const projects = configured.length > 0 ? configured : FALLBACK_CUSTOMER_PROJECTS;
    return projects.map((project) => ({
      label: formatProjectLabel(project),
      value: project,
    }));
  }, []);
  const [executions, setExecutions] = useState<ExecutionListItemLite[]>([]);
  const [campaigns, setCampaigns] = useState<RubricCampaignAnalytics[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>();
  const [selectedCampaign, setSelectedCampaign] = useState<RubricCampaignAnalytics | null>(null);
  const [detailedCalls, setDetailedCalls] = useState<DetailedCallAnalyticsItem[]>([]);
  const [selectedCallEvaluation, setSelectedCallEvaluation] = useState<CallEvaluation | null>(null);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingDetailedCalls, setLoadingDetailedCalls] = useState(false);
  const [storedReportOverview, setStoredReportOverview] = useState<{
    total_campaigns: number;
    evaluated_campaigns: number;
    scored_campaigns?: number;
    unscored_campaigns?: number;
    average_score: number;
    total_calls: number;
    completed_calls: number;
    excellent: number;
    average: number;
    poor: number;
    score_distribution?: {
      excellent?: number;
      average?: number;
      poor?: number;
      total?: number;
    };
  } | null>(null);
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(new Date()));
  const [selectedProject, setSelectedProject] = useState<string>(getProjectFromUrl());
  const [customDateRange, setCustomDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executionLookup = useMemo(
    () => Object.fromEntries(executions.map((execution) => [execution.execution_id, execution])),
    [executions]
  );

  const mergeCampaign = useCallback((campaign: RubricCampaignAnalytics) => {
    setCampaigns((current) => {
      const existingIndex = current.findIndex((item) => item.execution_id === campaign.execution_id);
      if (existingIndex === -1) {
        return [campaign, ...current];
      }

      const next = [...current];
      next[existingIndex] = campaign;
      return next;
    });
  }, []);

  const mergeExecution = useCallback((executionId: string, campaign: RubricCampaignAnalytics) => {
    setExecutions((current) => {
      if (current.some((item) => item.execution_id === executionId)) {
        return current;
      }

      return [
        {
          execution_id: executionId,
          execution_name: campaign.execution_name || executionId,
          created_at: campaign.created_at || null,
          updated_at: campaign.updated_at || null,
          status: null,
        },
        ...current,
      ];
    });
  }, []);

  const syncProjectToUrl = useCallback((project: string) => {
    if (typeof window === 'undefined') return;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('project', project);
    window.history.replaceState({}, '', nextUrl.toString());
  }, []);


  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setError(null);

    try {
      syncProjectToUrl(selectedProject);
      const params = getReportParamsByPeriod(periodType, selectedYear, selectedMonth, selectedWeek);
      const [reportResult, summaryResult] = await Promise.allSettled([
        APIService.CallAnalyticsService.getNormalizedRubricPeriodReport(params),
        APIService.CallAnalyticsService.getRubricPeriodSummary(params),
      ]);

      const reportPayload = reportResult.status === 'fulfilled' ? reportResult.value : {
        report: null,
        campaigns: [],
        overview: null,
      };
      const summaryPayload = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
      const sourceCampaigns = reportPayload?.campaigns ?? [];
      // Defensive extraction: summary endpoint may return { overview: {...} } or directly {...}
      const summaryOverview = summaryPayload?.overview ?? summaryPayload ?? null;

      // Debug logging to help diagnose API issues
      const debugScored = (summaryOverview?.score_distribution?.excellent ?? 0)
        + (summaryOverview?.score_distribution?.average ?? 0)
        + (summaryOverview?.score_distribution?.poor ?? 0);
      console.log('[RubricAnalytics] API Results:', {
        params,
        reportResult: reportResult.status === 'fulfilled' ? 'success' : 'failed',
        summaryResult: summaryResult.status === 'fulfilled' ? 'success' : 'failed',
        campaignsCount: sourceCampaigns.length,
        totalCampaigns: summaryOverview?.total_campaigns,
        scoreDistribution: summaryOverview?.score_distribution,
        calculatedScored: debugScored,
        calculatedUnscored: (summaryOverview?.total_campaigns ?? 0) - debugScored,
      });

      if (reportResult.status === 'rejected') {
        console.warn('Failed to load period rubric report.', reportResult.reason);
      }

      if (summaryResult.status === 'rejected') {
        console.warn('Failed to load period rubric summary.', summaryResult.reason);
      }

      const effectiveExecutions = sourceCampaigns.map((campaign) => ({
        execution_id: campaign.execution_id,
        execution_name: campaign.execution_name || campaign.execution_id,
        created_at: campaign.created_at || null,
        updated_at: campaign.updated_at || null,
        status: null,
      }));

      // Merge report and summary overviews - summary has score_distribution, report has computed totals
      const reportOverview = reportPayload.overview ?? {};
      type OverviewWithScoreDistribution = typeof reportOverview & {
        score_distribution?: { excellent?: number; average?: number; poor?: number; total?: number };
      };
      const mergedOverview: OverviewWithScoreDistribution = {
        ...reportOverview,
        ...(summaryOverview ?? {}),
        // Prefer score_distribution from summary if available
        score_distribution: summaryOverview?.score_distribution ?? (reportOverview as OverviewWithScoreDistribution).score_distribution,
      };
      setStoredReportOverview(mergedOverview as typeof storedReportOverview);
      setExecutions(effectiveExecutions);
      setCampaigns(sourceCampaigns);

      if (sourceCampaigns.length === 0) {
        setSelectedExecutionId(undefined);
        setSelectedCampaign(null);
        setDetailedCalls([]);
        return;
      }

      const initialExecutionId = selectedExecutionId && sourceCampaigns.some((item) => item.execution_id === selectedExecutionId)
        ? selectedExecutionId
        : sourceCampaigns[0]?.execution_id;

      setSelectedExecutionId(initialExecutionId);
      setSelectedCampaign(sourceCampaigns.find((item) => item.execution_id === initialExecutionId) || null);
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Failed to load rubric analytics.';
      setError(nextError);
      setStoredReportOverview(null);
      setExecutions([]);
      setCampaigns([]);
      setSelectedExecutionId(undefined);
      setSelectedCampaign(null);
      setDetailedCalls([]);
    } finally {
      setLoadingOverview(false);
    }
  }, [selectedExecutionId, periodType, selectedProject, selectedYear, selectedMonth, selectedWeek, syncProjectToUrl]);


  const loadCampaignDetail = useCallback(async (executionId: string) => {
    const campaign = campaigns.find((item) => item.execution_id === executionId) || null;
    setSelectedCampaign(campaign);
    setLoadingDetail(true);
    setLoadingDetailedCalls(true);

    try {
      const calls = await APIService.CallAnalyticsService.getDetailedCallsByExecution(executionId);
      setDetailedCalls(calls);
      setError(null);
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Failed to load campaign calls.';
      message.error(nextError);
      setError(nextError);
      setDetailedCalls([]);
    } finally {
      setLoadingDetail(false);
      setLoadingDetailedCalls(false);
    }
  }, [campaigns]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedExecutionId) return;
    loadCampaignDetail(selectedExecutionId);
  }, [loadCampaignDetail, selectedExecutionId]);

  const filteredCampaigns = useMemo(() => {
    if (!customDateRange?.[0] || !customDateRange?.[1]) {
      return campaigns;
    }

    const start = customDateRange[0].startOf('day').valueOf();
    const end = customDateRange[1].endOf('day').valueOf();

    return campaigns.filter((campaign) => {
      const sourceDate = campaign.updated_at || campaign.created_at;
      if (!sourceDate) return false;
      const timestamp = new Date(sourceDate).getTime();
      if (Number.isNaN(timestamp)) return false;
      return timestamp >= start && timestamp <= end;
    });
  }, [campaigns, customDateRange]);

  useEffect(() => {
    if (filteredCampaigns.length === 0) {
      setSelectedExecutionId(undefined);
      setSelectedCampaign(null);
      setDetailedCalls([]);
      return;
    }

    if (!selectedExecutionId || !filteredCampaigns.some((item) => item.execution_id === selectedExecutionId)) {
      setSelectedExecutionId(filteredCampaigns[0]?.execution_id);
      setSelectedCampaign(filteredCampaigns[0] || null);
      return;
    }

    setSelectedCampaign(filteredCampaigns.find((item) => item.execution_id === selectedExecutionId) || null);
  }, [filteredCampaigns, selectedExecutionId]);

  const overviewStats = useMemo(() => {
    const hasCustomDateRange = Boolean(customDateRange?.[0] && customDateRange?.[1]);
    const visibleCampaigns = filteredCampaigns;

    if (hasCustomDateRange) {
      const scoredCampaigns = visibleCampaigns.filter((campaign) => campaign.analytics.summary.percent > 0);
      const totalCalls = visibleCampaigns.reduce(
        (sum, campaign) => sum + (campaign.total_calls ?? campaign.analytics.total_calls ?? 0),
        0
      );
      const averageScore = visibleCampaigns.length > 0
        ? visibleCampaigns.reduce((sum, campaign) => sum + campaign.analytics.summary.percent, 0) / visibleCampaigns.length
        : 0;

      return {
        totalCampaigns: visibleCampaigns.length,
        scoredCampaigns: scoredCampaigns.length,
        calls: totalCalls,
        averageScore,
        good: visibleCampaigns.filter((campaign) => campaign.analytics.summary.percent >= 75).length,
        average: visibleCampaigns.filter((campaign) => campaign.analytics.summary.percent >= 50 && campaign.analytics.summary.percent < 75).length,
        poor: visibleCampaigns.filter((campaign) => campaign.analytics.summary.percent > 0 && campaign.analytics.summary.percent < 50).length,
        unscored: Math.max(0, visibleCampaigns.length - scoredCampaigns.length),
      };
    }

    // KPI cards always show PERIOD TOTALS for the selected month/year/week
    // Individual campaign selection only affects the drill-down view below
    const loadedCampaigns = campaigns.length > 0 ? campaigns : [];
    const totalCalls = loadedCampaigns.reduce(
      (sum, campaign) => sum + (campaign.total_calls ?? campaign.analytics.total_calls ?? 0),
      0
    );
    const averageScore = loadedCampaigns.length > 0
      ? loadedCampaigns.reduce((sum, campaign) => sum + campaign.analytics.summary.percent, 0) / loadedCampaigns.length
      : 0;

    // Extract score_distribution with defensive access - API returns score_distribution nested object
    const scoreDistribution = storedReportOverview?.score_distribution ?? {};

    // Use API-provided counts only - these are counts of CAMPAIGNS (not calls)
    const goodCount = scoreDistribution?.excellent ?? storedReportOverview?.excellent ?? 0;
    const averageCount = scoreDistribution?.average ?? storedReportOverview?.average ?? 0;
    const poorCount = scoreDistribution?.poor ?? storedReportOverview?.poor ?? 0;

    // Calculate derived counts
    const scoredCount = scoreDistribution?.total ?? storedReportOverview?.scored_campaigns ?? (goodCount + averageCount + poorCount);
    const totalCount = storedReportOverview?.total_campaigns ?? executions.length;
    const unscoredCount = storedReportOverview?.unscored_campaigns ?? Math.max(0, totalCount - scoredCount);

    return {
      totalCampaigns: totalCount,
      scoredCampaigns: scoredCount,
      calls: storedReportOverview?.total_calls ?? totalCalls,
      averageScore: storedReportOverview?.average_score ?? averageScore,
      good: goodCount,
      average: averageCount,
      poor: poorCount,
      unscored: unscoredCount > 0 ? unscoredCount : 0,
    };
  }, [campaigns, customDateRange, executions.length, filteredCampaigns, storedReportOverview]);

  const campaignColumns = [
    {
      title: 'Campaign',
      dataIndex: 'execution_name',
      key: 'execution_name',
      render: (_: unknown, record: RubricCampaignAnalytics) => (
        <div>
          <div className="font-semibold">{record.execution_name || record.execution_id}</div>
          <div className="text-xs text-gray-500">{record.execution_id}</div>
        </div>
      ),
    },
    {
      title: 'Score',
      key: 'score',
      render: (_: unknown, record: RubricCampaignAnalytics) => {
        const quality = getQualityLabel(record.analytics.summary.percent);
        return <Tag color={quality.color}>{record.analytics.summary.percent.toFixed(1)}%</Tag>;
      },
    },
    {
      title: 'Trend',
      key: 'trend',
      render: (_: unknown, record: RubricCampaignAnalytics) => {
        const topTrend = getTopMetric(record.trend_breakdown);
        return topTrend ? `${formatMetricLabel(topTrend[0])} (${topTrend[1]})` : '-';
      },
    },
    {
      title: 'Calls',
      dataIndex: 'total_calls',
      key: 'total_calls',
      render: (value: number | null | undefined) => value ?? '-',
    },
    {
      title: 'Updated',
      key: 'updated_at',
      render: (_: unknown, record: RubricCampaignAnalytics) => formatDate(record.updated_at || record.created_at),
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#263978' }}>
          WWAI Rubric Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Stored rubric analytics reports with campaign drill-down.
        </p>
      </div>

      <Card>
        <Space direction="vertical" size="middle" className="w-full">
          <Row gutter={[16, 16]}>
            <Col span={12} md={6}>
              <Statistic title="Total Campaigns" value={overviewStats.totalCampaigns} />
            </Col>
            <Col span={12} md={6}>
              <Statistic title="Scored" value={overviewStats.scoredCampaigns} />
            </Col>
            <Col span={12} md={6}>
              <Statistic title="Unscored" value={overviewStats.unscored} />
            </Col>
            <Col span={12} md={6}>
              <Statistic title="Average Score" value={Number(overviewStats.averageScore.toFixed(1))} suffix="%" />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={8} md={8}>
              <Statistic title="Excellent" value={overviewStats.good} valueStyle={{ color: '#52c41a' }} />
            </Col>
            <Col span={8} md={8}>
              <Statistic title="Average" value={overviewStats.average} valueStyle={{ color: '#faad14' }} />
            </Col>
            <Col span={8} md={8}>
              <Statistic title="Poor" value={overviewStats.poor} valueStyle={{ color: '#f5222d' }} />
            </Col>
          </Row>

          <div className="flex justify-end">
            <Button icon={<ReloadOutlined />} onClick={loadOverview} loading={loadingOverview}>
              Refresh
            </Button>
          </div>
        </Space>
      </Card>

      {error && <Alert message="Rubric analytics could not be loaded" description={error} type="error" showIcon />}

      <Card title="Campaign Overview">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-gray-600">Customer:</span>
          <Select
            value={selectedProject}
            onChange={(value) => setSelectedProject(value)}
            options={customerOptions}
            showSearch
            optionFilterProp="label"
            style={{ width: 220 }}
          />
          <span className="text-gray-600">Period:</span>
          <Select
            value={periodType}
            onChange={(value) => setPeriodType(value)}
            options={[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
              { label: 'Weekly', value: 'weekly' },
            ]}
            style={{ width: 120 }}
          />
          
          {/* Year selector - shown for all period types */}
          <Select
            value={selectedYear}
            onChange={(value) => setSelectedYear(value)}
            options={Array.from({ length: 10 }, (_, i) => {
              const year = new Date().getFullYear() - 5 + i;
              return { label: String(year), value: year };
            })}
            style={{ width: 100 }}
          />
          
          {/* Month selector - shown for monthly and weekly */}
          {periodType !== 'yearly' && (
            <Select
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              options={[
                { label: 'Jan', value: 1 },
                { label: 'Feb', value: 2 },
                { label: 'Mar', value: 3 },
                { label: 'Apr', value: 4 },
                { label: 'May', value: 5 },
                { label: 'Jun', value: 6 },
                { label: 'Jul', value: 7 },
                { label: 'Aug', value: 8 },
                { label: 'Sep', value: 9 },
                { label: 'Oct', value: 10 },
                { label: 'Nov', value: 11 },
                { label: 'Dec', value: 12 },
              ]}
              style={{ width: 90 }}
            />
          )}
          
          {/* Week selector - shown only for weekly */}
          {periodType === 'weekly' && (
            <Select
              value={selectedWeek}
              onChange={(value) => setSelectedWeek(value)}
              options={Array.from({ length: 53 }, (_, i) => ({
                label: `Week ${i + 1}`,
                value: i + 1,
              }))}
              style={{ width: 120 }}
            />
          )}

          <span className="text-gray-600">Custom Dates:</span>
          <RangePicker
            value={customDateRange}
            onChange={(value) => setCustomDateRange(value)}
            allowClear
          />
          
          <Button icon={<ReloadOutlined />} onClick={loadOverview} loading={loadingOverview} size="small">
            Apply
          </Button>
        </div>
        {loadingOverview ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : error ? (
          <Alert message="Failed to load data" description={error} type="error" showIcon />
        ) : filteredCampaigns.length === 0 ? (
          <Empty
            description={`No campaign rubric analytics found for ${formatProjectLabel(selectedProject)} in ${periodType} ${selectedYear}${periodType !== 'yearly' ? `-${selectedMonth}` : ''}`}
          />
        ) : (
          <Table<RubricCampaignAnalytics>
            columns={campaignColumns}
            dataSource={filteredCampaigns}
            rowKey="execution_id"
            pagination={{ pageSize: 8 }}
            onRow={(record) => ({
              onClick: () => setSelectedExecutionId(record.execution_id),
              className: 'cursor-pointer',
            })}
          />
        )}
      </Card>

      <Card title="Selected Campaign">
        {loadingDetail && !selectedCampaign ? (
          <div className="py-12 text-center">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : selectedCampaign ? (
          loadingDetail ? (
            <div className="space-y-6">
              <Alert message="Refreshing selected campaign with latest backend data" type="info" showIcon />
              <CampaignDetail
                campaign={selectedCampaign}
                detailedCalls={detailedCalls}
                detailedCallsLoading={loadingDetailedCalls}
                onViewCallEvaluation={setSelectedCallEvaluation}
                onViewEvidence={setSelectedResult}
              />
            </div>
          ) : (
            <CampaignDetail
              campaign={selectedCampaign}
              detailedCalls={detailedCalls}
              detailedCallsLoading={loadingDetailedCalls}
              onViewCallEvaluation={setSelectedCallEvaluation}
              onViewEvidence={setSelectedResult}
            />
          )
        ) : (
          <Empty description="Select a campaign to inspect rubric analytics" />
        )}
      </Card>
      <CallEvaluationDetailModal
        evaluation={selectedCallEvaluation}
        open={!!selectedCallEvaluation}
        onClose={() => setSelectedCallEvaluation(null)}
        onViewEvidence={setSelectedResult}
      />
      <EvidenceViewer result={selectedResult} open={!!selectedResult} onClose={() => setSelectedResult(null)} />
    </div>
  );
};

export default RubricAnalyticsDashboard;
