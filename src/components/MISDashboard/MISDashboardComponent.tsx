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
  Input,
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
  DashboardOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRoomAPI } from '@/hooks/useRoomAPI';
import {
  generateMISDashboard,
  getMISJobStatus,
  downloadMISReport,
  listMISJobs,
  triggerDownload,
  getDateRangeString,
  formatStepName,
  getStoredMISJobs,
  removeMISJob,
} from './api';
import {
  MISJobStatusResponse,
  MISJob,
  StoredMISJob,
} from './types';

const { RangePicker } = DatePicker;

const MISDashboardComponent = () => {
  const { appendRoomParam } = useRoomAPI();

  // Form state
  const [dateMode, setDateMode] = useState<'month' | 'range'>('month');
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs>(dayjs());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [clientName, setClientName] = useState<string>('');

  // Set default client name from subdomain on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const subdomain = window.location.hostname.split('.')[0];
      const formatted = subdomain
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setClientName(formatted);
    }
  }, []);

  // Job tracking state
  const [activeJobs, setActiveJobs] = useState<Map<string, MISJobStatusResponse>>(new Map());
  const [allJobs, setAllJobs] = useState<MISJob[]>([]);
  const [storedJobs, setStoredJobs] = useState<StoredMISJob[]>([]);

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
    setStoredJobs(getStoredMISJobs());
  }, []);

  // Fetch all jobs from server
  const fetchAllJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listMISJobs({ appendRoomParam });
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
        const status = await getMISJobStatus({
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
          setStoredJobs(getStoredMISJobs());

          if (status.status === 'completed') {
            showMessage('success', 'MIS Dashboard report completed!');
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
    const stored = getStoredMISJobs();
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

  // Start MIS Dashboard generation
  const handleStartGeneration = async () => {
    setStartingJob(true);
    try {
      const params: Parameters<typeof generateMISDashboard>[0] = {
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

      if (clientName) {
        params.client_name = clientName;
      }

      const response = await generateMISDashboard(params);
      showMessage('success', response.message);

      // Start polling the new job
      setStoredJobs(getStoredMISJobs());
      pollJobStatus(response.job_id);
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to start MIS Dashboard generation');
      console.error('Error starting MIS Dashboard:', error);
    } finally {
      setStartingJob(false);
    }
  };

  // Download report
  const handleDownload = async (jobId: string, filename?: string | null) => {
    setDownloadingJob(jobId);
    try {
      const blob = await downloadMISReport({
        job_id: jobId,
        appendRoomParam,
      });

      const downloadFilename = filename || `mis_dashboard_${jobId}.xlsx`;
      triggerDownload(blob, downloadFilename);
      showMessage('success', 'Report downloaded successfully');

      // Remove from active jobs after download
      setActiveJobs((prev) => {
        const next = new Map(prev);
        next.delete(jobId);
        return next;
      });
      removeMISJob(jobId);
      setStoredJobs(getStoredMISJobs());
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
    removeMISJob(jobId);
    setStoredJobs(getStoredMISJobs());
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
      render: (progress: number, record: MISJob) => (
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
      render: (filters: MISJob['filters']) => (
        <span style={{ fontSize: '13px' }}>{getDateRangeString(filters)}</span>
      ),
    },
    {
      title: 'Client',
      dataIndex: ['filters', 'client_name'],
      key: 'client_name',
      width: 120,
      render: (name: string) => name || '-',
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
                    <Tag icon={<DashboardOutlined />} color="purple">
                      MIS Dashboard
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

                <div style={{ fontSize: '13px', color: '#666', marginBottom: 8 }}>
                  <strong>Client:</strong> {status.filters.client_name || '-'}
                </div>

                {status.current_step && status.status === 'processing' && (
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 8 }}>
                    Step: {formatStepName(status.current_step)}
                  </div>
                )}

                {status.total_records > 0 && (
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 8 }}>
                    Processed: {status.processed_records.toLocaleString()} / {status.total_records.toLocaleString()} records
                  </div>
                )}

                {status.status === 'failed' && status.error && (
                  <Alert type="error" message={status.error} style={{ marginBottom: 8 }} />
                )}

                {status.status === 'completed' && status.summary && (
                  <div style={{ fontSize: '12px', marginBottom: 8, background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                    <div>
                      <strong>Period:</strong> {status.summary.period}
                    </div>
                    <div>
                      <strong>Total Records:</strong> {status.summary.total_records.toLocaleString()}
                    </div>
                    <div>
                      <strong>Total Allocation:</strong> {status.summary.total_allocation.toLocaleString()}
                    </div>
                    <div>
                      <strong>Revised Allocation:</strong> {status.summary.revised_allocation.toLocaleString()}
                    </div>
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
                <span>Generate MIS Dashboard Report</span>
              </Space>
            }
            style={{ marginBottom: 24, borderColor: 'rgba(38, 57, 120, 0.2)' }}
          >
            <Row gutter={[24, 24]}>
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
                    Client Name
                    <Tooltip title="Client name for report header">
                      <InfoCircleOutlined style={{ marginLeft: 8, color: '#999' }} />
                    </Tooltip>
                  </label>
                </div>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                loading={startingJob}
                onClick={handleStartGeneration}
                style={{ backgroundColor: '#263978', borderColor: '#263978' }}
              >
                Generate MIS Dashboard
              </Button>
            </div>
          </Card>

          <Alert
            message="About MIS Dashboard Report"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>
                  <strong>Comprehensive Analysis:</strong> Aggregates data across allocation status, charges bands, verticals, paid status, and regional analysis.
                </li>
                <li>
                  <strong>Multiple Sections:</strong> Includes Preview, Contactability, Digital Channels, Calling Disposition, and more.
                </li>
                <li>
                  <strong>Output Matrix:</strong> Detailed analysis tables for each segment with metrics like ROR%, AI, Contactable%, etc.
                </li>
                <li>Reports are generated as background jobs. Download the Excel file once completed.</li>
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
            title="All MIS Dashboard Jobs"
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
              <Empty description="No MIS Dashboard jobs found" />
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
            MIS Dashboard
          </h1>
          <p style={{ color: '#666' }}>
            Generate comprehensive Management Information System dashboard reports
          </p>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>
    </div>
  );
};

export default MISDashboardComponent;
