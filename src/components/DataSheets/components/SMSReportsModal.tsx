"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Typography, Alert, List, Tag } from 'antd';
import { MessageSquare, Download, Loader2, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { startSMSGroupExport, getSMSExportJobStatus, downloadSMSExportFile, type ExportJobStatus } from '../services/api';
import { useRoomAPI } from '@/hooks/useRoomAPI';

const { Text, Title } = Typography;

const STORAGE_KEY = 'sms_reports_export_jobs';

// Job stored in localStorage
interface StoredJob {
  jobId: string;
  groupId: string;
  datasheetName: string;
  status: 'starting' | 'processing' | 'completed' | 'failed' | 'downloaded';
  filename?: string;
  rowCount?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface SMSReportsModalProps {
  visible: boolean;
  groupId: string | null;
  datasheetName: string;
  onClose: () => void;
}

// Helper functions for localStorage
const getStoredJobs = (): StoredJob[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveStoredJobs = (jobs: StoredJob[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.error('Failed to save jobs to localStorage:', e);
  }
};

const updateStoredJob = (jobId: string, updates: Partial<StoredJob>) => {
  const jobs = getStoredJobs();
  const index = jobs.findIndex(j => j.jobId === jobId);
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    saveStoredJobs(jobs);
  }
  return jobs;
};

const removeStoredJob = (jobId: string) => {
  const jobs = getStoredJobs().filter(j => j.jobId !== jobId);
  saveStoredJobs(jobs);
  return jobs;
};

const addStoredJob = (job: StoredJob) => {
  const jobs = getStoredJobs();
  // Remove any existing job for the same group that's not processing
  const filtered = jobs.filter(j =>
    j.groupId !== job.groupId || j.status === 'processing' || j.status === 'starting'
  );
  filtered.push(job);
  saveStoredJobs(filtered);
  return filtered;
};

const SMSReportsModal: React.FC<SMSReportsModalProps> = ({
  visible,
  groupId,
  datasheetName,
  onClose
}) => {
  const { selectedRoom } = useRoomAPI();
  const [jobs, setJobs] = useState<StoredJob[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);
  const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get jobs for current group
  const currentGroupJobs = jobs.filter(j => j.groupId === groupId);
  const allOtherJobs = jobs.filter(j => j.groupId !== groupId);
  const hasProcessingJob = currentGroupJobs.some(j => j.status === 'processing' || j.status === 'starting');

  // Poll for job status
  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const status: ExportJobStatus = await getSMSExportJobStatus(jobId, selectedRoom);

      if (status.status === 'completed') {
        const updatedJobs = updateStoredJob(jobId, {
          status: 'completed',
          filename: status.filename,
          rowCount: status.row_count,
          completedAt: new Date().toISOString()
        });
        setJobs(updatedJobs);

        // Stop polling
        const interval = pollingRefs.current.get(jobId);
        if (interval) {
          clearInterval(interval);
          pollingRefs.current.delete(jobId);
        }
      } else if (status.status === 'failed') {
        const updatedJobs = updateStoredJob(jobId, {
          status: 'failed',
          error: status.error || 'Export failed',
          completedAt: new Date().toISOString()
        });
        setJobs(updatedJobs);

        // Stop polling
        const interval = pollingRefs.current.get(jobId);
        if (interval) {
          clearInterval(interval);
          pollingRefs.current.delete(jobId);
        }
      }
    } catch (err) {
      console.error('Status poll error:', err);
    }
  }, [selectedRoom]);

  // Start polling for a job
  const startPolling = useCallback((jobId: string) => {
    if (pollingRefs.current.has(jobId)) return;

    const interval = setInterval(() => {
      pollStatus(jobId);
    }, 2000);
    pollingRefs.current.set(jobId, interval);

    // Immediate poll
    pollStatus(jobId);
  }, [pollStatus]);

  // Load jobs from localStorage and resume polling on mount
  useEffect(() => {
    const storedJobs = getStoredJobs();
    setJobs(storedJobs);

    // Resume polling for any processing jobs
    storedJobs.forEach(job => {
      if (job.status === 'processing' || job.status === 'starting') {
        startPolling(job.jobId);
      }
    });

    // Capture ref value for cleanup
    const currentPollingRefs = pollingRefs.current;

    // Cleanup on unmount
    return () => {
      currentPollingRefs.forEach((interval) => {
        clearInterval(interval);
      });
      currentPollingRefs.clear();
    };
  }, [startPolling]);

  // Start export
  const handleStartExport = async () => {
    if (!groupId) return;

    try {
      setIsStarting(true);

      const result = await startSMSGroupExport(groupId, selectedRoom);

      const newJob: StoredJob = {
        jobId: result.job_id,
        groupId,
        datasheetName,
        status: 'processing',
        createdAt: new Date().toISOString()
      };

      const updatedJobs = addStoredJob(newJob);
      setJobs(updatedJobs);

      // Start polling
      startPolling(result.job_id);
    } catch (err) {
      // Show error but don't add to jobs
      console.error('Failed to start SMS export:', err);
    } finally {
      setIsStarting(false);
    }
  };

  // Download file
  const handleDownload = async (job: StoredJob) => {
    try {
      setDownloadingJobId(job.jobId);
      await downloadSMSExportFile(job.jobId, job.filename || `sms_report_${job.datasheetName}.csv`, selectedRoom);

      const updatedJobs = updateStoredJob(job.jobId, { status: 'downloaded' });
      setJobs(updatedJobs);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingJobId(null);
    }
  };

  // Remove job from list
  const handleRemoveJob = (jobId: string) => {
    // Stop polling if active
    const interval = pollingRefs.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      pollingRefs.current.delete(jobId);
    }

    const updatedJobs = removeStoredJob(jobId);
    setJobs(updatedJobs);
  };

  const getStatusTag = (status: StoredJob['status']) => {
    switch (status) {
      case 'starting':
        return <Tag color="blue">Starting</Tag>;
      case 'processing':
        return <Tag color="processing">Processing</Tag>;
      case 'completed':
        return <Tag color="success">Ready</Tag>;
      case 'downloaded':
        return <Tag color="default">Downloaded</Tag>;
      case 'failed':
        return <Tag color="error">Failed</Tag>;
    }
  };

  const renderJobItem = (job: StoredJob) => {
    const isDownloading = downloadingJobId === job.jobId;

    return (
    <List.Item
      key={job.jobId}
      className="!px-0"
      actions={[
        job.status === 'completed' && (
          <Button
            key="download"
            type="primary"
            size="small"
            icon={isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            onClick={() => handleDownload(job)}
            disabled={isDownloading}
            style={{
              backgroundColor: '#263878',
              borderColor: '#263878',
              opacity: isDownloading ? 0.7 : 1
            }}
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        ),
        (job.status === 'completed' || job.status === 'downloaded' || job.status === 'failed') && (
          <Button
            key="remove"
            type="text"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleRemoveJob(job.jobId)}
          />
        )
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={
          job.status === 'processing' || job.status === 'starting' ? (
            <Loader2 size={20} className="text-blue-500 animate-spin" />
          ) : job.status === 'completed' || job.status === 'downloaded' ? (
            <CheckCircle size={20} className="text-green-500" />
          ) : (
            <XCircle size={20} className="text-red-500" />
          )
        }
        title={
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate max-w-[200px]">{job.datasheetName}</span>
            {getStatusTag(job.status)}
          </div>
        }
        description={
          <div className="text-xs text-gray-500">
            {job.status === 'processing' || job.status === 'starting' ? (
              <span>Export in progress...</span>
            ) : job.status === 'failed' ? (
              <span className="text-red-500">{job.error}</span>
            ) : (
              <span>{job.rowCount?.toLocaleString() || 0} rows</span>
            )}
            {job.status === 'downloaded' && (
              <span className="ml-2 text-green-600">Download started</span>
            )}
          </div>
        }
      />
    </List.Item>
    );
  };

  return (
    <Modal
      title={
        <div style={{ color: '#263878', fontSize: '18px' }} className="flex items-center gap-2">
          <MessageSquare size={20} />
          SMS Reports Export
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      maskClosable={true}
      closable={true}
    >
      <div className="space-y-6">
        {/* Current Group Section */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Title level={5} className="!mb-1">Current Datasheet</Title>
              <Text type="secondary" className="text-sm">{datasheetName}</Text>
            </div>
            <Button
              type="primary"
              onClick={handleStartExport}
              loading={isStarting}
              disabled={hasProcessingJob}
              style={{ backgroundColor: '#263878', borderColor: '#263878' }}
            >
              {hasProcessingJob ? 'Export in Progress' : 'Start Export'}
            </Button>
          </div>

          {currentGroupJobs.length > 0 && (
            <List
              size="small"
              dataSource={currentGroupJobs}
              renderItem={renderJobItem}
              className="bg-gray-50 rounded-lg px-4"
            />
          )}

          {currentGroupJobs.length === 0 && !isStarting && (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Clock size={32} className="mx-auto text-gray-400 mb-2" />
              <Text type="secondary">No exports yet. Click &quot;Start Export&quot; to begin.</Text>
            </div>
          )}
        </div>

        {/* Other Groups Section */}
        {allOtherJobs.length > 0 && (
          <div>
            <Title level={5} className="!mb-3">Other Exports</Title>
            <List
              size="small"
              dataSource={allOtherJobs}
              renderItem={renderJobItem}
              className="bg-gray-50 rounded-lg px-4 max-h-[200px] overflow-y-auto"
            />
          </div>
        )}

        {/* Info Alert */}
        <Alert
          type="info"
          message="You can close this modal and continue working. Your exports will continue in the background."
          className="!mt-4"
        />
      </div>
    </Modal>
  );
};

export default SMSReportsModal;
