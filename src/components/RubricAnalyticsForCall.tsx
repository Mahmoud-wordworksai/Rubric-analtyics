import { useState, useEffect, useCallback } from 'react';
import { Spin, Alert, Tabs, Card, Progress, Tag, Table, Empty, Modal } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, MinusCircleOutlined, EyeOutlined, TrophyOutlined, WarningOutlined, InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import APIService from '../APIServices';
import type { CallEvaluation, RubricAnalyticsData, Summary, Result } from '@/lib/types';
import { FiCheckSquare } from 'react-icons/fi';

interface RubricAnalyticsForCallProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  executionId?: string;
}

const CallScoreOverview = ({ summary }: { summary: Summary }) => {
  const getQualityLabel = (percent: number) => {
    if (percent >= 75) return { label: 'Excellent', color: 'green' };
    if (percent >= 50) return { label: 'Average', color: 'orange' };
    return { label: 'Poor', color: 'red' };
  };

  const quality = getQualityLabel(summary.percent);

  return (
    <Card title="Call Score Overview">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center bg-black-50 rounded-lg p-6 text-center border">
          <div className="text-5xl font-bold text-black my-2">{Math.round(summary.percent)}<span className="text-3xl text-black">%</span></div>
          <Tag color={quality.color} className="text-lg font-semibold">{quality.label}</Tag>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <TrophyOutlined className="text-green-500 text-2xl" />
            <div className="text-sm text-black-500 mt-2">Earned Weight</div>
            <div className="text-xl font-bold">{summary.earned_weight}</div>
          </Card>
          <Card className="text-center">
            <InfoCircleOutlined className="text-blue-500 text-2xl" />
            <div className="text-sm text-black-500 mt-2">Achievable Weight</div>
            <div className="text-xl font-bold">{summary.achievable_weight}</div>
          </Card>
          <Card className="text-center">
            <WarningOutlined className="text-red-500 text-2xl" />
            <div className="text-sm text-black-500 mt-2">Failed Weight</div>
            <div className="text-xl font-bold">{summary.failed_weight}</div>
          </Card>
          <Card className="text-center">
            <QuestionCircleOutlined className="text-yellow-500 text-2xl" />
            <div className="text-sm text-black-500 mt-2">Unknown Weight</div>
            <div className="text-xl font-bold">{summary.unknown_weight}</div>
          </Card>
        </div>
        <div className="flex flex-col justify-center">
          <Card className="text-center">
            <CheckCircleOutlined className="text-purple-500 text-2xl" />
            <div className="text-sm text-black-500 mt-2">Total Items</div>
            <div className="text-xl font-bold">{summary.items}</div>
          </Card>
          <Card className="text-center mt-3">
            <MinusCircleOutlined className="text-black-500 text-2xl" />
            <div className="text-sm text-black-500 mt-2">N/A Weight</div>
            <div className="text-xl font-bold">{summary.na_weight}</div>
          </Card>
        </div>
      </div>
    </Card>
  );
};

const DerivedSignals = ({ derivedFacts }: { derivedFacts: { [key: string]: boolean }; }) => {
  if (Object.keys(derivedFacts).length === 0) {
    return <Empty description="No derived signals available for this call" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(derivedFacts).map(([key, value], index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-black-50 rounded">
          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
          <Tag color={value ? 'green' : 'red'}>{value ? 'Yes' : 'No'}</Tag>
        </div>
      ))}
    </div>
  );
};

const ScoreDistribution = ({ results }: { results: Result[]; }) => {
  const statusCounts = {
    pass: results.filter(r => r.status === 'pass').length,
    fail: results.filter(r => r.status === 'fail').length,
    unknown: results.filter(r => r.status === 'unknown').length,
    na: results.filter(r => r.status === 'na').length,
  };

  const total = results.length;

  return (
    <Card title="Score Distribution">
      <div className="space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span>Pass</span>
            <span>{statusCounts.pass}/{total}</span>
          </div>
          <Progress
            percent={total > 0 ? Math.round((statusCounts.pass / total) * 100) : 0}
            status="success"
          />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span>Fail</span>
            <span>{statusCounts.fail}/{total}</span>
          </div>
          <Progress
            percent={total > 0 ? Math.round((statusCounts.fail / total) * 100) : 0}
            status="exception"
          />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span>Unknown</span>
            <span>{statusCounts.unknown}/{total}</span>
          </div>
          <Progress
            percent={total > 0 ? Math.round((statusCounts.unknown / total) * 100) : 0}
            status="normal"
          />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span>N/A</span>
            <span>{statusCounts.na}/{total}</span>
          </div>
          <Progress
            percent={total > 0 ? Math.round((statusCounts.na / total) * 100) : 0}
            status="normal"
          />
        </div>
      </div>
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
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'pass') color = 'green';
        if (status === 'fail') color = 'red';
        if (status === 'unknown') color = 'orange';
        if (status === 'na') color = 'black';
        
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: string) => {
        let color = 'default';
        if (confidence === 'high') color = 'green';
        if (confidence === 'medium') color = 'orange';
        if (confidence === 'low') color = 'red';
        
        return <Tag color={color}>{confidence.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: Result) => (
        <div className="flex space-x-2">
          <EyeOutlined 
            title="View Evidence"
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => onViewEvidence(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={results.map((r, index) => ({ ...r, key: index }))}
      pagination={{ pageSize: 10 }}
      scroll={{ x: true }}
    />
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
    <Modal
      title={result.name}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Reason</h3>
          <p>{result.reason}</p>
        </div>
        <div>
          <h3 className="font-semibold">Evidence</h3>
          {result.evidence.length > 0 ? (
            <div className="space-y-2">
              {result.evidence.map((evidence, index) => (
                <div key={`${result.name}-${index}`} className="rounded border p-3 text-sm">
                  {evidence}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No evidence available.</p>
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

const RubricAnalyticsForCall: React.FC<RubricAnalyticsForCallProps> = ({ visible, sessionId, executionId }) => {
  const [evaluationData, setEvaluationData] = useState<CallEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<'idle' | 'checking' | 'evaluating' | 'polling' | 'completed'>('idle');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);


  const extractEvaluation = (response: unknown): CallEvaluation | null => {
    if (!response || Array.isArray(response) || typeof response !== 'object') {
      return null;
    }

    const maybeWrapped = response as { data?: unknown };
    const candidate = maybeWrapped.data && !Array.isArray(maybeWrapped.data) && typeof maybeWrapped.data === 'object'
      ? maybeWrapped.data
      : response;

    if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object') {
      return null;
    }

    const evaluation = candidate as Partial<CallEvaluation>;
    const hasEvaluationShape = Boolean(
      evaluation.call_id
      || evaluation.evaluation_id
      || evaluation.status
      || evaluation.report
      || evaluation.results
      || evaluation.session_id
      || evaluation.score !== undefined
    );

    return hasEvaluationShape ? (evaluation as CallEvaluation) : null;
  };

  const convertToRubricFormat = (evaluation: CallEvaluation): RubricAnalyticsData => {
    return APIService.CallAnalyticsService.toRubricAnalyticsData(evaluation.report || evaluation);
  };

  useEffect(() => {
    if (!visible || !sessionId) {
      setEvaluationStatus('idle');
      return;
    }

    let cancelled = false;

    const loadEvaluation = async () => {
      try {
        setLoading(true);
        setError(null);
        setEvaluationStatus('evaluating');

        const response = await APIService.CallAnalyticsService.evaluateCallBySession({
          session_id: sessionId,
          execution_id: executionId,
          call_id: sessionId,
        });

        if (cancelled) return;

        const evaluation = extractEvaluation(response);
        if (!evaluation) {
          setEvaluationData(null);
          setError('No evaluation data available');
          setEvaluationStatus('idle');
          return;
        }

        setEvaluationData(evaluation);
        setEvaluationStatus('completed');
      } catch (err: unknown) {
        if (cancelled) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to load rubric analytics';
        setError(errorMessage);
        setEvaluationData(null);
        setEvaluationStatus('idle');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEvaluation();

    return () => {
      cancelled = true;
    };
  }, [visible, sessionId, executionId]);

  const handleTabChange = (key: string) => {
    console.log('Tab changed to:', key);
  };

  const renderContent = () => {
    if (evaluationStatus === 'evaluating' || evaluationStatus === 'polling' || loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Spin size="large" className="mb-4" />
          <p className="text-lg">
            {evaluationStatus === 'evaluating' 
              ? 'Evaluating call...' 
              : evaluationStatus === 'polling'
              ? 'Processing evaluation...'
              : 'Loading...'}
          </p>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="Error Loading Analytics"
          description={error}
          type="error"
          showIcon
        />
      );
    }

    if (evaluationData && (evaluationData.report || evaluationData.results || typeof evaluationData.score === 'number')) {
      const rubricData = convertToRubricFormat(evaluationData);
      const hasDerivedSignals = Object.keys(rubricData.derived_facts).length > 0;
      
      return (
        <Tabs 
          defaultActiveKey="overview" 
          onChange={handleTabChange}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <div className="space-y-6">
                  <CallScoreOverview summary={rubricData.summary} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Detailed Results">
                      <AnalyticsTable results={rubricData.results} onViewEvidence={setSelectedResult} />
                    </Card>
                    <ScoreDistribution results={rubricData.results} />
                  </div>
                </div>
              )
            },
            ...(hasDerivedSignals
              ? [{
                  key: 'details',
                  label: 'Derived Signals',
                  children: (
                    <Card title="Derived Signals">
                      <DerivedSignals derivedFacts={rubricData.derived_facts} />
                    </Card>
                  )
                }]
              : [])
          ]}
        />
      );
    }

    return (
      <div className="text-center py-12">
        <ExclamationCircleOutlined className="text-4xl text-gray-400 mb-4" />
        <p className="text-lg text-gray-600">
          {evaluationData?.status === 'pending' || evaluationData?.status === 'processing'
            ? 'Evaluation is still being processed'
            : 'No evaluation data available'}
        </p>
        <p className="text-gray-500">
          {evaluationData?.status === 'pending' || evaluationData?.status === 'processing'
            ? 'The backend has accepted this call and is still preparing the rubric result.'
            : 'No saved rubric output was returned for this call yet.'}
        </p>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-auto bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 p-4 bg-white border-b border-gray-200 shadow-sm">
        <FiCheckSquare className="w-5 h-5 text-blue-600" />
        <span className="text-xl font-semibold">Rubric Analytics</span>
      </div>
      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>
      <EvidenceViewer result={selectedResult} open={!!selectedResult} onClose={() => setSelectedResult(null)} />
    </div>
  );
};

export default RubricAnalyticsForCall;
