"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Spin, message, Typography, Space, Divider } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { API_KEY } from '@/constants';
import { appendRoomParam } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';

const { Text, Title } = Typography;

type VMStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'deallocated' | 'unknown' | 'loading';

interface RoomSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  roomName: string;
  vmName: string;
  resourceGroup: string;
  onStatusChange?: (status: VMStatus) => void;
}

const VM_MANAGE_BASE_URL = 'https://api-v2.admin-wwai.com';

const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  visible,
  onClose,
  roomName,
  vmName,
  resourceGroup,
  onStatusChange
}) => {
  const [vmStatus, setVmStatus] = useState<VMStatus>('unknown');
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'start' | 'stop' | null>(null);

  // Helper to update status and notify parent
  const updateStatus = useCallback((newStatus: VMStatus) => {
    setVmStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const fetchVMStatus = useCallback(async () => {
    if (!vmName || !resourceGroup) return;

    setStatusLoading(true);
    try {
      const url = appendRoomParam(`${VM_MANAGE_BASE_URL}/vm-manage/vm/${vmName}/status?api_key=${API_KEY}&resource_group=${resourceGroup}`);
      const response = await axiosInstance.get(url);
      const data = response.data;
      // Parse status from response: "VM running", "VM deallocated", etc.
      const statusText = data.status?.toLowerCase() || '';

      if (statusText.includes('running')) {
        updateStatus('running');
      } else if (statusText.includes('deallocated') || statusText.includes('stopped')) {
        updateStatus('stopped');
      } else if (statusText.includes('starting')) {
        updateStatus('starting');
      } else if (statusText.includes('stopping')) {
        updateStatus('stopping');
      } else {
        updateStatus('unknown');
      }
    } catch (error) {
      console.error('Error fetching VM status:', error);
      message.error('Failed to fetch VM status');
      updateStatus('unknown');
    } finally {
      setStatusLoading(false);
    }
  }, [vmName, resourceGroup, updateStatus]);

  useEffect(() => {
    if (visible && vmName && resourceGroup) {
      fetchVMStatus();
    }
  }, [visible, vmName, resourceGroup, fetchVMStatus]);

  const handleStartVM = async () => {
    setActionLoading('start');
    try {
      const url = appendRoomParam(`${VM_MANAGE_BASE_URL}/vm-manage/vm/${vmName}/start?api_key=${API_KEY}&resource_group=${resourceGroup}`);
      await axiosInstance.post(url);

      message.success(`Starting ${roomName}...`);
      updateStatus('starting');

      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const statusUrl = appendRoomParam(`${VM_MANAGE_BASE_URL}/vm-manage/vm/${vmName}/status?api_key=${API_KEY}&resource_group=${resourceGroup}`);
          const statusRes = await axiosInstance.get(statusUrl);
          const statusData = statusRes.data;
          const statusText = statusData.status?.toLowerCase() || '';

          if (statusText.includes('running')) {
            updateStatus('running');
            clearInterval(pollInterval);
            setActionLoading(null);
            message.success(`${roomName} is now running`);
          }
        } catch {
          // Continue polling
        }
      }, 5000);

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setActionLoading(null);
      }, 120000);

    } catch (error) {
      console.error('Error starting VM:', error);
      message.error('Failed to start VM');
      setActionLoading(null);
    }
  };

  const handleStopVM = async () => {
    setActionLoading('stop');
    try {
      const url = appendRoomParam(`${VM_MANAGE_BASE_URL}/vm-manage/vm/${vmName}/stop?api_key=${API_KEY}&resource_group=${resourceGroup}`);
      await axiosInstance.post(url);

      message.success(`Stopping ${roomName}...`);
      updateStatus('stopping');

      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const statusUrl = appendRoomParam(`${VM_MANAGE_BASE_URL}/vm-manage/vm/${vmName}/status?api_key=${API_KEY}&resource_group=${resourceGroup}`);
          const statusRes = await axiosInstance.get(statusUrl);
          const statusData = statusRes.data;
          const statusText = statusData.status?.toLowerCase() || '';

          if (statusText.includes('deallocated') || statusText.includes('stopped')) {
            updateStatus('stopped');
            clearInterval(pollInterval);
            setActionLoading(null);
            message.success(`${roomName} has been stopped`);
          }
        } catch {
          // Continue polling
        }
      }, 5000);

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setActionLoading(null);
      }, 120000);

    } catch (error) {
      console.error('Error stopping VM:', error);
      message.error('Failed to stop VM');
      setActionLoading(null);
    }
  };

  const getStatusDisplay = () => {
    switch (vmStatus) {
      case 'running':
        return (
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <Text style={{ color: '#52c41a', fontWeight: 600 }}>Running</Text>
          </Space>
        );
      case 'stopped':
      case 'deallocated':
        return (
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>Stopped</Text>
          </Space>
        );
      case 'starting':
        return (
          <Space>
            <LoadingOutlined style={{ color: '#1890ff', fontSize: 20 }} spin />
            <Text style={{ color: '#1890ff', fontWeight: 600 }}>Starting...</Text>
          </Space>
        );
      case 'stopping':
        return (
          <Space>
            <LoadingOutlined style={{ color: '#faad14', fontSize: 20 }} spin />
            <Text style={{ color: '#faad14', fontWeight: 600 }}>Stopping...</Text>
          </Space>
        );
      default:
        return (
          <Space>
            <CloseCircleOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />
            <Text style={{ color: '#8c8c8c', fontWeight: 600 }}>Unknown</Text>
          </Space>
        );
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Room Settings</span>
          <span style={{
            fontSize: 14,
            color: '#8c8c8c',
            fontWeight: 400,
            backgroundColor: '#f5f5f5',
            padding: '2px 8px',
            borderRadius: 4
          }}>
            {roomName}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{
          backgroundColor: '#fafafa',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16
        }}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>VM Name</Text>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 14,
              backgroundColor: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              marginTop: 4
            }}>
              {vmName}
            </div>
          </div>

          {/* <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Resource Group</Text>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 14,
              backgroundColor: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              marginTop: 4
            }}>
              {resourceGroup}
            </div>
          </div> */}
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Title level={5} style={{ margin: 0 }}>VM Status</Title>
            <Button
              icon={<ReloadOutlined spin={statusLoading} />}
              onClick={fetchVMStatus}
              disabled={statusLoading || actionLoading !== null}
              size="small"
            >
              Refresh
            </Button>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            backgroundColor: '#fafafa',
            borderRadius: 8,
            minHeight: 60
          }}>
            {statusLoading ? (
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            ) : (
              getStatusDisplay()
            )}
          </div>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <div>
          <Title level={5} style={{ marginBottom: 16 }}>VM Actions</Title>
          <Space style={{ width: '100%' }} size="middle">
            <Button
              type="primary"
              icon={actionLoading === 'start' ? <LoadingOutlined spin /> : <PlayCircleOutlined />}
              onClick={handleStartVM}
              disabled={vmStatus === 'running' || vmStatus === 'starting' || actionLoading !== null}
              loading={actionLoading === 'start'}
              style={{
                flex: 1,
                backgroundColor: vmStatus === 'running' || actionLoading !== null ? undefined : '#52c41a',
                borderColor: vmStatus === 'running' || actionLoading !== null ? undefined : '#52c41a'
              }}
            >
              Start VM
            </Button>
            <Button
              danger
              icon={actionLoading === 'stop' ? <LoadingOutlined spin /> : <PauseCircleOutlined />}
              onClick={handleStopVM}
              disabled={vmStatus === 'stopped' || vmStatus === 'stopping' || actionLoading !== null}
              loading={actionLoading === 'stop'}
              style={{ flex: 1 }}
            >
              Stop VM
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default RoomSettingsModal;
