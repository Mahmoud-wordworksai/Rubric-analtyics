"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Input,
  Button,
  Card,
  Switch,
  Typography,
  Space,
  Alert,
  Spin,
  Progress,
  Select,
  Tag,
  Divider,
  Table
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ClearOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '@/lib/axios';
import { API_BASE_URL } from '@/constants';
import { appendRoomParam } from '@/hooks/useRoomAPI';
import { useSearchParams } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

interface JobProgress {
  current_step: string;
  total_executions: number;
  processed_executions: number;
  rows_updated: number;
  rows_skipped_cached: number;
  rows_skipped_filtered: number;
  errors: number;
}

interface JobResult {
  filename: string;
  file_size: number;
  row_count: number;
}

interface ReportJob {
  _id: string;
  datasheet_id: string;
  group_id: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  parameters: {
    is_vertical: boolean;
    cache: boolean;
    attempts: string[] | null;
  };
  progress: JobProgress;
  result: JobResult;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}


export const ReportsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const selectedRoom = searchParams?.get('room') || 'main';

  // Form state
  const [datasheetId, setDatasheetId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [isVertical, setIsVertical] = useState<boolean>(false);
  const [useCache, setUseCache] = useState<boolean>(false);
  const [storeAttempts, setStoreAttempts] = useState<boolean>(false);
  const [selectedAttempts, setSelectedAttempts] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Clear attempts state
  const [clearingAttempts, setClearingAttempts] = useState<boolean>(false);

  // Job state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<ReportJob | null>(null);
  const [polling, setPolling] = useState<boolean>(false);

  // Jobs list state
  const [jobs, setJobs] = useState<ReportJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);

  // UI state
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const url = appendRoomParam(`${API_BASE_URL}/reports-jobs/${jobId}`, selectedRoom);
      const response = await axiosInstance.get(url);
      const job = response.data;
      setCurrentJob(job);

      if (job.status === 'completed' || job.status === 'failed') {
        setPolling(false);
        if (job.status === 'completed') {
          setSuccess(`Export completed! ${job.result?.row_count || 0} rows processed.`);
        } else {
          setError(job.error_message || 'Export job failed');
        }
      }

      return job;
    } catch (err) {
      console.error('Error polling job status:', err);
      setPolling(false);
      return null;
    }
  }, [selectedRoom]);

  // Polling effect
  useEffect(() => {
    if (!polling || !currentJobId) return;

    const interval = setInterval(() => {
      pollJobStatus(currentJobId);
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, currentJobId, pollJobStatus]);

  // Fetch jobs list
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const url = appendRoomParam(`${API_BASE_URL}/reports-jobs?limit=10`, selectedRoom);
      const response = await axiosInstance.get(url);
      setJobs(response.data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [selectedRoom]);

  // Start export job
  const handleStartExport = async () => {
    // At least one of datasheet_id or group_id must be provided
    if (!datasheetId.trim() && !groupId.trim()) {
      setError('Please enter a Datasheet ID or Group ID');
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);
    setCurrentJob(null);

    try {
      const params = new URLSearchParams({
        is_vertical: isVertical.toString(),
        cache: useCache.toString(),
        store_attempts: storeAttempts.toString()
      });

      // Add identifiers (at least one required)
      if (datasheetId.trim()) {
        params.append('datasheet_id', datasheetId.trim());
      }
      if (groupId.trim()) {
        params.append('group_id', groupId.trim());
      }

      if (selectedAttempts.length > 0) {
        params.append('attempts', selectedAttempts.join(','));
      }

      if (selectedColumns.length > 0) {
        params.append('columns', selectedColumns.join(','));
      }

      // Use new endpoint
      const baseUrl = `${API_BASE_URL}/datasheets/custom-export?${params}`;
      const url = appendRoomParam(baseUrl, selectedRoom);

      console.log('Creating export job:', url);

      const response = await axiosInstance.get(url);
      const { job_id } = response.data;

      console.log('Job created:', job_id);

      setCurrentJobId(job_id);
      setPolling(true);

      // Initial poll
      await pollJobStatus(job_id);

      // Refresh jobs list
      fetchJobs();

    } catch (err) {
      console.error('Export failed:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setError(error.response?.data?.detail || error.message || 'Failed to create export job');
    } finally {
      setExporting(false);
    }
  };

  // Download completed job
  const handleDownload = async (jobId: string) => {
    try {
      const url = appendRoomParam(`${API_BASE_URL}/reports-jobs/${jobId}/download`, selectedRoom);
      const response = await axiosInstance.get(url, { responseType: 'blob' });

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error('Download failed:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setError(error.response?.data?.detail || 'Download failed');
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId: string) => {
    try {
      const url = appendRoomParam(`${API_BASE_URL}/reports-jobs/${jobId}`, selectedRoom);
      await axiosInstance.delete(url);
      fetchJobs();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Clear attempt reports
  const handleClearAttemptReports = async () => {
    if (!datasheetId.trim() && !groupId.trim()) {
      setError('Please enter a Datasheet ID or Group ID to clear attempt reports');
      return;
    }

    setClearingAttempts(true);
    setError(null);
    setSuccess(null);

    try {
      const params = new URLSearchParams();

      if (datasheetId.trim()) {
        params.append('datasheet_id', datasheetId.trim());
      }
      if (groupId.trim()) {
        params.append('group_id', groupId.trim());
      }
      if (selectedAttempts.length > 0) {
        params.append('attempts', selectedAttempts.join(','));
      }

      const baseUrl = `${API_BASE_URL}/datasheets/clear-attempt-reports?${params}`;
      const url = appendRoomParam(baseUrl, selectedRoom);

      const response = await axiosInstance.delete(url);
      const { stats } = response.data;

      setSuccess(`Cleared attempt reports from ${stats?.datasheets_processed || 0} datasheets (${stats?.chunks_modified || 0} chunks modified)`);
    } catch (err) {
      console.error('Clear attempt reports failed:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setError(error.response?.data?.detail || error.message || 'Failed to clear attempt reports');
    } finally {
      setClearingAttempts(false);
    }
  };

  // Handle attempts selection change
  const handleAttemptsChange = (values: string[]) => {
    // Filter and sort numeric values
    const validAttempts = values
      .map(v => v.trim())
      .filter(v => /^\d+$/.test(v) && parseInt(v) > 0)
      .sort((a, b) => parseInt(a) - parseInt(b));
    setSelectedAttempts(validAttempts);
  };

  // Get status tag
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
      case 'processing':
        return <Tag icon={<LoadingOutlined spin />} color="processing">Processing</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="default">Pending</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Jobs table columns
  const jobColumns = [
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('MMM DD, HH:mm'),
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      width: 120
    },
    {
      title: 'Rows',
      key: 'rows',
      render: (_: unknown, record: ReportJob) => record.result?.row_count || record.progress?.rows_updated || '-',
      width: 80
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ReportJob) => (
        <Space>
          {record.status === 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record._id)}
            >
              Download
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteJob(record._id)}
          />
        </Space>
      ),
      width: 150
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>Reports</Title>
        <Paragraph style={{ color: '#666' }}>
          Generate and download custom call reports for your datasheets.
        </Paragraph>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ marginBottom: '24px' }}>Custom Export</Title>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Datasheet ID Input */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Datasheet ID</Text>
            <Input
              size="large"
              placeholder="Enter datasheet ID"
              value={datasheetId}
              onChange={(e) => {
                setDatasheetId(e.target.value);
                setError(null);
              }}
              prefix={<FileExcelOutlined style={{ color: '#999' }} />}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              Export a specific datasheet
            </div>
          </div>

          {/* Group ID Input */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Group ID <Text type="secondary" style={{ fontWeight: 'normal' }}>(Optional)</Text></Text>
            <Input
              size="large"
              placeholder="Enter group ID to export all datasheets in group"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setError(null);
              }}
              prefix={<FileExcelOutlined style={{ color: '#999' }} />}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              Export all datasheets in a group (sorted by created_at)
            </div>
          </div>

          {/* Export Options */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: '8px', padding: '16px' }}>
            <Text strong style={{ display: 'block', marginBottom: '16px' }}>Export Options</Text>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Vertical Format */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text>Vertical Format</Text>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Each attempt as a separate row
                  </div>
                </div>
                <Switch checked={isVertical} onChange={setIsVertical} />
              </div>

              {/* Store Attempts */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text>Store Attempt Data</Text>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Save attempt data in datasheet chunks for caching
                  </div>
                </div>
                <Switch checked={storeAttempts} onChange={setStoreAttempts} />
              </div>

              {/* Cache */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text>Use Cached Data</Text>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Skip already processed data (requires stored attempts)
                  </div>
                </div>
                <Switch checked={useCache} onChange={setUseCache} disabled={!storeAttempts} />
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* Attempts Selection */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  Process Attempts
                </Text>
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="Type attempt numbers (e.g., 1, 2, 3)"
                  value={selectedAttempts}
                  onChange={handleAttemptsChange}
                  tokenSeparators={[',', ' ']}
                  allowClear
                  notFoundContent={null}
                  open={false}
                />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Leave empty to process all attempts. Type attempt numbers separated by comma or space.
                </div>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              {/* Columns Selection */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  Filter Columns <Text type="secondary" style={{ fontWeight: 'normal' }}>(Optional)</Text>
                </Text>
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="Type column names (e.g., DISPOSITION, DURATION)"
                  value={selectedColumns}
                  onChange={(values) => setSelectedColumns(values)}
                  tokenSeparators={[',']}
                  allowClear
                  notFoundContent={null}
                  open={false}
                />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Leave empty to include all columns. Type column names separated by comma.
                </div>
              </div>
            </Space>
          </div>

          {/* Current Job Progress */}
          {currentJob && (polling || currentJob.status === 'processing') && (
            <div style={{ border: '1px solid #1890ff', borderRadius: '8px', padding: '16px', backgroundColor: '#e6f7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <LoadingOutlined spin />
                <Text strong>Processing Export...</Text>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text type="secondary">Step: {currentJob.progress?.current_step || 'Starting...'}</Text>
              </div>
              {currentJob.progress?.total_executions > 0 && (
                <Progress
                  percent={Math.round((currentJob.progress.processed_executions / currentJob.progress.total_executions) * 100)}
                  size="small"
                  status="active"
                />
              )}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Rows updated: {currentJob.progress?.rows_updated || 0} |
                Skipped (cached): {currentJob.progress?.rows_skipped_cached || 0}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          {/* Success Alert */}
          {success && (
            <Alert
              message="Success"
              description={
                <div>
                  {success}
                  {currentJobId && (
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(currentJobId)}
                      style={{ padding: '0 8px' }}
                    >
                      Download File
                    </Button>
                  )}
                </div>
              }
              type="success"
              showIcon
              closable
              onClose={() => setSuccess(null)}
            />
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              type="primary"
              size="large"
              icon={exporting || polling ? <Spin size="small" /> : <DownloadOutlined />}
              onClick={handleStartExport}
              loading={exporting}
              disabled={(!datasheetId.trim() && !groupId.trim()) || polling || clearingAttempts}
              style={{ flex: 1 }}
            >
              {polling ? 'Processing...' : exporting ? 'Creating Job...' : 'Start Export'}
            </Button>

            <Button
              size="large"
              icon={<ClearOutlined />}
              onClick={handleClearAttemptReports}
              loading={clearingAttempts}
              disabled={(!datasheetId.trim() && !groupId.trim()) || polling || exporting}
              danger
            >
              Clear Cached Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent Jobs */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Recent Export Jobs</span>
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={fetchJobs}
              loading={loadingJobs}
            >
              Refresh
            </Button>
          </div>
        }
      >
        <Table
          dataSource={jobs}
          columns={jobColumns}
          rowKey="_id"
          size="small"
          pagination={false}
          loading={loadingJobs}
          locale={{ emptyText: 'No export jobs found' }}
        />
      </Card>

      {/* Format Info */}
      <Card style={{ marginTop: '24px', backgroundColor: '#fafafa' }}>
        <Title level={5} style={{ marginBottom: '12px' }}>Export Options</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <Text strong>Horizontal Format (Default)</Text>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Each row = one record. Attempts as columns: DISPOSITION_1_ATTEMPT, DISPOSITION_2_ATTEMPT, etc.
            </div>
          </div>
          <div>
            <Text strong>Vertical Format</Text>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Each attempt = separate row. Includes ATTEMPT_NUMBER and TOTAL_ATTEMPTS columns.
            </div>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong>Export Modes</Text>
            <div style={{ fontSize: '13px', color: '#666' }}>
              <strong>Single Datasheet:</strong> Provide datasheet ID only. <br />
              <strong>Group Export:</strong> Provide group ID to export all datasheets in the group (sorted by creation date).
            </div>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong>Caching</Text>
            <div style={{ fontSize: '13px', color: '#666' }}>
              <strong>Store Attempt Data:</strong> Save processed attempt data in database for faster future exports. <br />
              <strong>Use Cached Data:</strong> Skip reprocessing if data already exists (only works with stored attempts). <br />
              <strong>Clear Cached Data:</strong> Remove stored attempt data to force fresh processing.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
