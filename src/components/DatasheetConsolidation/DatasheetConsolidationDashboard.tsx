/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  DatePicker,
  Button,
  Table,
  Row,
  Col,
  Tag,
  Space,
  Spin,
  Empty,
  Tabs,
  Progress,
  Select,
  Alert,
  Tooltip,
} from 'antd';
import {
  DownloadOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  PhoneOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRoomAPI } from '@/hooks/useRoomAPI';
import {
  startConsolidation,
  getConsolidationJobStatus,
  downloadConsolidationReport,
  listConsolidationJobs,
  triggerDownload,
  getDateRangeString,
  getTypeLabel,
  getStoredConsolidationJobs,
  removeConsolidationJob,
} from './api';
import {
  ConsolidationType,
  DatasheetType,
  JobStatusResponse,
  ConsolidationJob,
  StoredJob,
  isSMSSummary,
  isCallsSummary,
} from './types';

const { RangePicker } = DatePicker;

const DATASHEET_TYPES: DatasheetType[] = ['BUCKET X', 'CHARGES', 'PDM', 'PNPA', 'BUCKET 1&2', 'OTHER'];

const DatasheetConsolidationDashboard = () => {
  const { appendRoomParam } = useRoomAPI();

  // Form state
  const [consolidationType, setConsolidationType] = useState<ConsolidationType>('sms');
  const [dateMode, setDateMode] = useState<'month' | 'range'>('month');
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs>(dayjs());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [datasheetType, setDatasheetType] = useState<DatasheetType | undefined>(undefined);

  // Job tracking state
  const [activeJobs, setActiveJobs] = useState<Map<string, JobStatusResponse>>(new Map());
  const [allJobs, setAllJobs] = useState<ConsolidationJob[]>([]);
  const [storedJobs, setStoredJobs] = useState<StoredJob[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [startingJob, setStartingJob] = useState(false);
  const [downloadingJob, setDownloadingJob] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());

  // Message handling
  const showMessage = (type: 'success' | 'error' | 'info', msg: string) => {
    console.log(`[${type.toUpperCase()}]`, msg);
  };

  // Load stored jobs on mount
  useEffect(() => {
    setStoredJobs(getStoredConsolidationJobs());
  }, []);

  // Fetch all jobs from server
  const fetchAllJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listConsolidationJobs({ appendRoomParam });
      setAllJobs(response.jobs);
    } catch (error) {
      showMessage('error', 'Failed to fetch jobs list');
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [appendRoomParam]);

  // Poll job status
  const pollJobStatus = useCallback(
    async (jobId: string) => {
      if (pollingJobs.has(jobId)) return;

      setPollingJobs((prev) => new Set(prev).add(jobId));

      try {
        const status = await getConsolidationJobStatus({
          job_id: jobId,
          appendRoomParam,
        });

        setActiveJobs((prev) => new Map(prev).set(jobId, status));

        // Continue polling if still processing
        if (status.status === 'processing' || status.status === 'pending') {
          setTimeout(() => {
            setPollingJobs((prev) => {
              const next = new Set(prev);
              next.delete(jobId);
              return next;
            });
            pollJobStatus(jobId);
          }, 5000);
        } else {
          setPollingJobs((prev) => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
          });

          // Refresh stored jobs
          setStoredJobs(getStoredConsolidationJobs());

          if (status.status === 'completed') {
            showMessage('success', `${getTypeLabel(status.type)} consolidation completed!`);
          } else if (status.status === 'failed') {
            showMessage('error', `Job failed: ${status.error || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setPollingJobs((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      }
    },
    [appendRoomParam, pollingJobs]
  );

  // Start polling for stored jobs on mount
  useEffect(() => {
    const stored = getStoredConsolidationJobs();
    stored.forEach((job) => {
      pollJobStatus(job.job_id);
    });
  }, []);

  // Refresh jobs when tab changes to history
  useEffect(() => {
    if (activeTab === 'history') {
      fetchAllJobs();
    }
  }, [activeTab, fetchAllJobs]);

  // Start consolidation job
  const handleStartConsolidation = async () => {
    setStartingJob(true);
    try {
      const params: Parameters<typeof startConsolidation>[0] = {
        type: consolidationType,
        appendRoomParam,
      };

      if (dateMode === 'month') {
        params.month = selectedMonth.month() + 1;
        params.year = selectedMonth.year();
      } else if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      } else {
        showMessage('error', 'Please select a date range');
        return;
      }

      if (datasheetType) {
        params.datasheet_type = datasheetType;
      }

      const response = await startConsolidation(params);
      showMessage('success', response.message);

      // Start polling the new job
      setStoredJobs(getStoredConsolidationJobs());
      pollJobStatus(response.job_id);
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to start consolidation');
      console.error('Error starting consolidation:', error);
    } finally {
      setStartingJob(false);
    }
  };

  // Download report
  const handleDownload = async (jobId: string, filename?: string | null) => {
    setDownloadingJob(jobId);
    try {
      const blob = await downloadConsolidationReport({
        job_id: jobId,
        appendRoomParam,
      });

      const downloadFilename = filename || `consolidation_report_${jobId}.xlsx`;
      triggerDownload(blob, downloadFilename);
      showMessage('success', 'Report downloaded successfully');

      // Remove from active jobs after download
      setActiveJobs((prev) => {
        const next = new Map(prev);
        next.delete(jobId);
        return next;
      });
      removeConsolidationJob(jobId);
      setStoredJobs(getStoredConsolidationJobs());
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to download report');
      console.error('Error downloading report:', error);
    } finally {
      setDownloadingJob(null);
    }
  };

  // Dismiss a job from active tracking
  const handleDismissJob = (jobId: string) => {
    setActiveJobs((prev) => {
      const next = new Map(prev);
      next.delete(jobId);
      return next;
    });
    removeConsolidationJob(jobId);
    setStoredJobs(getStoredConsolidationJobs());
  };

  // Get status tag color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'processing';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined />;
      case 'processing':
        return <LoadingOutlined spin />;
      case 'pending':
        return <ClockCircleOutlined />;
      case 'failed':
        return <CloseCircleOutlined />;
      default:
        return null;
    }
  };

  // History table columns
  const historyColumns = [
    {
      title: 'Job ID',
      dataIndex: 'job_id',
      key: 'job_id',
      width: 120,
      render: (jobId: string) => (
        <Tooltip title={jobId}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {jobId.slice(0, 8)}...
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: ConsolidationType) => (
        <Tag icon={type === 'sms' ? <MessageOutlined /> : <PhoneOutlined />} color={type === 'sms' ? 'blue' : 'green'}>
          {getTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number, record: ConsolidationJob) => (
        <Progress
          percent={progress}
          size="small"
          status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
        />
      ),
    },
    {
      title: 'Period',
      dataIndex: 'filters',
      key: 'filters',
      render: (filters: ConsolidationJob['filters']) => (
        <span style={{ fontSize: '13px' }}>{getDateRangeString(filters)}</span>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => dayjs(date).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Completed',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 180,
      render: (date: string | null) => (date ? dayjs(date).format('DD MMM YYYY HH:mm') : '-'),
    },
  ];

  // Render active jobs cards
  const renderActiveJobs = () => {
    const jobs = Array.from(activeJobs.entries());

    if (jobs.length === 0 && storedJobs.length === 0) {
      return null;
    }

    return (
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, color: '#263978' }}>Active Jobs</h3>
        <Row gutter={[16, 16]}>
          {jobs.map(([jobId, status]) => (
            <Col xs={24} md={12} lg={8} key={jobId}>
              <Card
                size="small"
                title={
                  <Space>
                    <Tag icon={status.type === 'sms' ? <MessageOutlined /> : <PhoneOutlined />} color={status.type === 'sms' ? 'blue' : 'green'}>
                      {getTypeLabel(status.type)}
                    </Tag>
                    <Tag icon={getStatusIcon(status.status)} color={getStatusColor(status.status)}>
                      {status.status.toUpperCase()}
                    </Tag>
                  </Space>
                }
                extra={
                  status.status === 'failed' ? (
                    <Button type="text" icon={<DeleteOutlined />} onClick={() => handleDismissJob(jobId)} />
                  ) : null
                }
                style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}
              >
                <div style={{ marginBottom: 12 }}>
                  <Progress
                    percent={status.progress}
                    status={status.status === 'failed' ? 'exception' : status.status === 'completed' ? 'success' : 'active'}
                  />
                </div>

                <div style={{ fontSize: '13px', color: '#666', marginBottom: 8 }}>
                  <strong>Period:</strong> {getDateRangeString(status.filters)}
                </div>

                {status.current_step && status.status === 'processing' && (
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 8 }}>
                    Step: {status.current_step.replace(/_/g, ' ')}
                  </div>
                )}

                {status.total_datasheets > 0 && (
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 8 }}>
                    Processed: {status.processed_datasheets} / {status.total_datasheets} datasheets
                  </div>
                )}

                {status.status === 'failed' && status.error && (
                  <Alert type="error" message={status.error} style={{ marginBottom: 8 }} />
                )}

                {status.status === 'completed' && status.summary && (
                  <div style={{ fontSize: '12px', marginBottom: 8, background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                    <div>
                      <strong>Total Datasheets:</strong> {status.summary.total_datasheets}
                    </div>
                    {isSMSSummary(status.summary) && (
                      <>
                        <div>
                          <strong>Total SMS:</strong> {status.summary.total_sms.toLocaleString()}
                        </div>
                        <div>
                          <strong>Total Units:</strong> {status.summary.total_units.toLocaleString()}
                        </div>
                        <div>
                          <strong>Amount:</strong> ₹{status.summary.grand_total_amount.toLocaleString()}
                        </div>
                        <div>
                          <strong>Slab:</strong> {status.summary.applied_slab} (₹{status.summary.slab_rate})
                        </div>
                      </>
                    )}
                    {isCallsSummary(status.summary) && (
                      <>
                        <div>
                          <strong>Total Calls:</strong> {status.summary.total_calls.toLocaleString()}
                        </div>
                        <div>
                          <strong>Total Bill:</strong> ₹{status.summary.total_bill.toLocaleString()}
                        </div>
                        <div>
                          <strong>Max Attempts:</strong> {status.summary.max_attempts}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {status.status === 'completed' && (
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={downloadingJob === jobId}
                    onClick={() => handleDownload(jobId, status.filename)}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', width: '100%' }}
                  >
                    Download Report
                  </Button>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'generate',
      label: 'Generate Report',
      children: (
        <>
          {renderActiveJobs()}

          <Card
            title={
              <Space>
                <FileExcelOutlined style={{ color: '#263978' }} />
                <span>Generate Consolidation Report</span>
              </Space>
            }
            style={{ marginBottom: 24, borderColor: 'rgba(38, 57, 120, 0.2)' }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12} lg={6}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 500, color: '#263978' }}>Report Type</label>
                </div>
                <Select
                  value={consolidationType}
                  onChange={setConsolidationType}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'sms', label: 'SMS Billing Report' },
                    { value: 'calls', label: 'Calls Billing Report' },
                  ]}
                />
              </Col>

              <Col xs={24} md={12} lg={6}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 500, color: '#263978' }}>Date Selection Mode</label>
                </div>
                <Select
                  value={dateMode}
                  onChange={setDateMode}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'month', label: 'By Month' },
                    { value: 'range', label: 'By Date Range' },
                  ]}
                />
              </Col>

              <Col xs={24} md={12} lg={6}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 500, color: '#263978' }}>
                    {dateMode === 'month' ? 'Select Month' : 'Date Range'}
                  </label>
                </div>
                {dateMode === 'month' ? (
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={(date) => date && setSelectedMonth(date)}
                    style={{ width: '100%' }}
                  />
                ) : (
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                    style={{ width: '100%' }}
                  />
                )}
              </Col>

              <Col xs={24} md={12} lg={6}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 500, color: '#263978' }}>
                    Datasheet Type
                    <Tooltip title="Filter by specific datasheet type (optional)">
                      <InfoCircleOutlined style={{ marginLeft: 8, color: '#999' }} />
                    </Tooltip>
                  </label>
                </div>
                <Select
                  value={datasheetType}
                  onChange={setDatasheetType}
                  style={{ width: '100%' }}
                  allowClear
                  placeholder="All Types"
                  options={DATASHEET_TYPES.map((type) => ({ value: type, label: type }))}
                />
              </Col>

            </Row>

            <div style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                loading={startingJob}
                onClick={handleStartConsolidation}
                style={{ backgroundColor: '#263978', borderColor: '#263978' }}
              >
                Start {consolidationType === 'sms' ? 'SMS' : 'Calls'} Consolidation
              </Button>
            </div>
          </Card>

          <Alert
            message="How Consolidation Works"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>
                  <strong>SMS Report:</strong> Calculates billing based on SMS types (BOD, EOD, PTP, PAID, PAYNOW) with slab-based pricing. Rates vary by volume.
                </li>
                <li>
                  <strong>Calls Report:</strong> Calculates billing based on call durations using tiered pricing (incremental rates up to ₹25 for 481+ seconds).
                </li>
                <li>Reports are generated as background jobs to handle large datasets efficiently.</li>
                <li>Download the Excel file once the job completes. The file is deleted after download.</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}
          />
        </>
      ),
    },
    {
      key: 'history',
      label: 'Job History',
      children: (
        <>
          <Card
            title="All Consolidation Jobs"
            extra={
              <Button icon={<ReloadOutlined />} onClick={fetchAllJobs} loading={loading}>
                Refresh
              </Button>
            }
            style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin size="large" />
              </div>
            ) : allJobs.length > 0 ? (
              <Table
                columns={historyColumns}
                dataSource={allJobs}
                rowKey="job_id"
                scroll={{ x: 'max-content' }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs`,
                }}
              />
            ) : (
              <Empty description="No consolidation jobs found" />
            )}
          </Card>
        </>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#263978', marginBottom: 8 }}>
            Datasheet Consolidation
          </h1>
          <p style={{ color: '#666' }}>
            Generate billing overview reports from datasheets for SMS and Calls
          </p>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>
    </div>
  );
};

export default DatasheetConsolidationDashboard;
