"use client";

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Select, Typography, Dropdown, message, Space, Modal, Progress, Tabs, Spin } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { HistoryOutlined, DownloadOutlined, CloseOutlined, CloseCircleOutlined, MessageOutlined, SunOutlined, MoonOutlined, ReloadOutlined, BarChartOutlined, CheckCircleOutlined, SendOutlined, CalendarOutlined } from '@ant-design/icons';
import type { Datasheet, DatasheetRow, PaginationState } from '../types';
import { formatPaginationText, parseTimestamp } from '../utils';
import { API_BASE_URL } from "@/constants";
import { useRoomAPI } from '@/hooks/useRoomAPI';
import axiosInstance, { getProjectFromUrl } from '@/lib/axios';

const { Text, Title } = Typography;
const { Option } = Select;

interface SmsSendingProgress {
  total_documents: number;
  total_to_process: number;
  skipped_count: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  percentage: number;
}

interface SmsSendingStatsItem {
  status: string;
  is_error: boolean;
  error_message: string | null;
  bod_type: string | null;
  progress: SmsSendingProgress;
  last_updated: string;
}

interface BodEodStatus {
  status: string;
  datasheet_id: string;
  sms_sending_stats: {
    bod?: SmsSendingStatsItem | Record<string, never>;
    eod?: SmsSendingStatsItem | Record<string, never>;
  };
}

// Helper to check if an object is empty or has valid data
const isValidStatsItem = (item: SmsSendingStatsItem | Record<string, never> | undefined): item is SmsSendingStatsItem => {
  return item !== undefined && Object.keys(item).length > 0 && 'status' in item;
};

interface DatasheetDetailsProps {
  selectedDatasheet: Datasheet | null;
  rows: DatasheetRow[];
  rowColumns: ColumnsType<DatasheetRow>;
  rowsPagination: PaginationState;
  loading: boolean;
  onClose: () => void;
  onTableChange: (pagination: TablePaginationConfig) => void;
  onVersionRestore: (version: number) => Promise<void>;
  onDatasheetUpdate?: () => void;
}

const DatasheetDetails: React.FC<DatasheetDetailsProps> = ({
  selectedDatasheet,
  rows,
  rowColumns,
  rowsPagination,
  loading,
  onClose,
  onTableChange,
  onVersionRestore,
  onDatasheetUpdate
}) => {
  const { appendRoomParam, selectedRoom } = useRoomAPI();
  const [exportLoading, setExportLoading] = useState(false);
  const [smsReportLoading, setSmsReportLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [bodEodModalVisible, setBodEodModalVisible] = useState(false);
  const [bodEodStatus, setBodEodStatus] = useState<BodEodStatus | null>(null);
  const [bodEodLoading, setBodEodLoading] = useState(false);

  // BOD SMS Modal state
  const [bodSmsModalVisible, setBodSmsModalVisible] = useState(false);
  const [bodSmsTab, setBodSmsTab] = useState<'plivo' | 'bash'>('plivo');
  const [bodSmsType, setBodSmsType] = useState<string>('bkt_x');
  const [bodSmsSending, setBodSmsSending] = useState(false);

  // EOD SMS Modal state
  const [eodSmsModalVisible, setEodSmsModalVisible] = useState(false);
  const [eodSmsTab, setEodSmsTab] = useState<'plivo' | 'bash'>('plivo');
  const [eodSmsSending, setEodSmsSending] = useState(false);

  // Update Due Dates Modal state
  const [updateDueDatesLoading, setUpdateDueDatesLoading] = useState(false);
  const [updateDueDatesModalVisible, setUpdateDueDatesModalVisible] = useState(false);
  const [updateDueDatesResponse, setUpdateDueDatesResponse] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleExport = async (format: 'csv' | 'xlsx', includeMetadata: boolean = false) => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected for export');
      return;
    }

    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        format,
        include_metadata: includeMetadata.toString()
      });

      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/datasheets/${selectedDatasheet._id}/export?${params}`), {
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        responseType: 'blob'
      });

      // Create blob and download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const metadataLabel = includeMetadata ? '_with_metadata' : '';
      const version = selectedDatasheet?.parts?.[0]?.version || selectedDatasheet.version || 1;
      link.download = `${selectedDatasheet.filename}_v${version}${metadataLabel}_${timestamp}.${format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Datasheet exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      message.error(`Failed to export datasheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleSmsReportExport = async () => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected for SMS report export');
      return;
    }

    setSmsReportLoading(true);

    const formData = new FormData();
    formData.append('datasheet_id', selectedDatasheet._id);

    try {
      const response = await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/sms/reports`), formData, {
        headers: {
          'Accept': 'text/csv'
        },
        responseType: 'blob'
      });

      // Create blob and download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `${selectedDatasheet.filename}_sms_report_${timestamp}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('SMS Report exported successfully');
    } catch (error) {
      console.error('SMS Report export error:', error);
      message.error(`Failed to export SMS report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSmsReportLoading(false);
    }
  };

  // Open BOD SMS Modal
  const handleOpenBodSmsModal = () => {
    setBodSmsModalVisible(true);
    setBodSmsTab('plivo');
    setBodSmsType('bkt_x');
  };

  // Close BOD SMS Modal
  const handleCloseBodSmsModal = () => {
    setBodSmsModalVisible(false);
    setBodSmsType('bkt_x');
    setBodSmsSending(false);
  };

  // Get db_name based on project
  const getDbName = () => {
    const selectedProject = getProjectFromUrl();
    // Convert project name to db_name format (replace hyphens with underscores)
    const dbName = selectedProject.replace(/-/g, '_');
    // Special case for tata-capital -> tatacapital
    return dbName === "tata_capital" ? "tatacapital" : dbName;
  };

  // Send BOD SMS via modal
  const handleSendBodSms = async () => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected');
      return;
    }

    setBodSmsSending(true);
    try {
      // Determine API URL based on selected tab
      const apiUrl = bodSmsTab === 'plivo'
        ? 'https://plivo-bulk-sms-room-3.admin-wwai.com/sms/bod'
        : 'https://bash-sms.admin-wwai.com/sms/bod';

      const response = await axiosInstance.post(apiUrl, {
        mongodb_uri: selectedRoom || 'main',
        db_name: getDbName(),
        datasheet_id: selectedDatasheet._id,
        type: bodSmsType
      });

      const result = response.data;

      if (result.status === 'success') {
        message.success(result.message || 'BOD SMS campaign started successfully');
        console.log('BOD SMS result:', result);

        // Update datasheet document to set bod_sent = true
        try {
          await axiosInstance.patch(appendRoomParam(`${API_BASE_URL}/datasheets/${selectedDatasheet._id}`), {
            update_data: { bod_sent: true }
          });
        } catch {
          console.warn('Failed to update bod_sent status in datasheet');
        }

        // Close modal and refresh data
        handleCloseBodSmsModal();
        if (onDatasheetUpdate) {
          onDatasheetUpdate();
        }
      } else {
        throw new Error(result.message || 'BOD SMS failed');
      }
    } catch (error) {
      console.error('BOD SMS error:', error);
      message.error(`Failed to send BOD SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBodSmsSending(false);
    }
  };

  // Open EOD SMS Modal
  const handleOpenEodSmsModal = () => {
    setEodSmsModalVisible(true);
    setEodSmsTab('plivo');
  };

  // Close EOD SMS Modal
  const handleCloseEodSmsModal = () => {
    setEodSmsModalVisible(false);
    setEodSmsSending(false);
  };

  // Send EOD SMS via modal
  const handleSendEodSms = async () => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected');
      return;
    }

    setEodSmsSending(true);
    try {
      // Determine API URL based on selected tab
      const apiUrl = eodSmsTab === 'plivo'
        ? 'https://plivo-bulk-sms-room-3.admin-wwai.com/sms/eod'
        : 'https://bash-sms.admin-wwai.com/sms/eod';

      const response = await axiosInstance.post(apiUrl, {
        mongodb_uri: selectedRoom || 'main',
        db_name: getDbName(),
        datasheet_id: selectedDatasheet._id
      });

      const result = response.data;

      if (result.status === 'success') {
        message.success(result.message || 'EOD SMS campaign started successfully');
        console.log('EOD SMS result:', result);

        // Update datasheet document to set eod_sent = true
        try {
          await axiosInstance.patch(appendRoomParam(`${API_BASE_URL}/datasheets/${selectedDatasheet._id}`), {
            update_data: { eod_sent: true }
          });
        } catch {
          console.warn('Failed to update eod_sent status in datasheet');
        }

        // Close modal and refresh data
        handleCloseEodSmsModal();
        if (onDatasheetUpdate) {
          onDatasheetUpdate();
        }
      } else {
        throw new Error(result.message || 'EOD SMS failed');
      }
    } catch (error) {
      console.error('EOD SMS error:', error);
      message.error(`Failed to send EOD SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEodSmsSending(false);
    }
  };

  // Handle reset datasheet - remove non-required columns
  const handleResetDatasheet = async () => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected');
      return;
    }

    setResetLoading(true);
    try {
      const response = await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/datasheets/${selectedDatasheet._id}/reset`));

      const result = response.data;

      if (result.status === 'success') {
        message.success('Datasheet reset successfully. Only required columns are kept.');
        // Refresh datasheet data
        if (onDatasheetUpdate) {
          onDatasheetUpdate();
        }
      } else {
        throw new Error(result.message || 'Reset failed');
      }
    } catch (error) {
      console.error('Reset error:', error);
      message.error(`Failed to reset datasheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setResetLoading(false);
    }
  };

  // Handle Update Due Dates
  const handleUpdateDueDates = async () => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected');
      return;
    }

    setUpdateDueDatesLoading(true);
    try {
      const response = await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/datasheets-update-due-dates`), {
        datasheet_id: selectedDatasheet._id
      });

      const result = response.data;

      // Show response message in modal
      setUpdateDueDatesResponse(result.message || JSON.stringify(result));
      setUpdateDueDatesModalVisible(true);

      if (result.status === 'success') {
        message.success('Due dates updated successfully');
        if (onDatasheetUpdate) {
          onDatasheetUpdate();
        }
      }
    } catch (error) {
      console.error('Update due dates error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUpdateDueDatesResponse(`Error: ${errorMessage}`);
      setUpdateDueDatesModalVisible(true);
    } finally {
      setUpdateDueDatesLoading(false);
    }
  };

  // Close Update Due Dates Modal
  const handleCloseUpdateDueDatesModal = () => {
    setUpdateDueDatesModalVisible(false);
    setUpdateDueDatesResponse(null);
  };

  // Check if Update Due Dates button should be shown (only for micro-fi and room-1)
  const getSubdomain = () => {
    return getProjectFromUrl();
  };

  const shouldShowUpdateDueDates = () => {
    const subdomain = getSubdomain();
    return subdomain === 'micro-fi' && selectedRoom === 'room-1';
  };

  // Fetch BOD-EOD Status
  const fetchBodEodStatus = async () => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected');
      return;
    }

    setBodEodLoading(true);
    setBodEodModalVisible(true);
    try {
      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/bod-eod-status?datasheet_id=${selectedDatasheet._id}`));

      const result: BodEodStatus = response.data;

      if (result.status === 'success') {
        setBodEodStatus(result);
      } else {
        throw new Error('Failed to fetch BOD-EOD status');
      }
    } catch (error) {
      console.error('BOD-EOD status error:', error);
      message.error(`Failed to fetch BOD-EOD status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setBodEodModalVisible(false);
    } finally {
      setBodEodLoading(false);
    }
  };

  const handleBodEodModalClose = () => {
    setBodEodModalVisible(false);
    setBodEodStatus(null);
  };

  // Check if Reset button should be shown (only for test datasheets)
  const isTestDatasheet = selectedDatasheet?.tag === 'test';

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'csv',
      label: 'Export as CSV',
      icon: <DownloadOutlined />,
      onClick: () => handleExport('csv')
    }
    // {
    //   key: 'csv-metadata',
    //   label: 'Export as CSV (with metadata)',
    //   icon: <DownloadOutlined />,
    //   onClick: () => handleExport('csv', true)
    // },
    // {
    //   type: 'divider'
    // },
    // {
    //   key: 'xlsx',
    //   label: 'Export as Excel',
    //   icon: <DownloadOutlined />,
    //   onClick: () => handleExport('xlsx')
    // },
    // {
    //   key: 'xlsx-metadata',
    //   label: 'Export as Excel (with metadata)',
    //   icon: <DownloadOutlined />,
    //   onClick: () => handleExport('xlsx', true)
    // }
  ];

  if (!selectedDatasheet) {
    return null;
  }

  // Get version from parts array or root level
  const currentVersion = selectedDatasheet?.parts?.[0]?.version || selectedDatasheet?.version || 1;

  return (
    <div className="mb-6 animate-fadeIn" style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header with close button */}
      <Card
        className="mb-4"
        style={{
          borderRadius: '8px',
          borderLeft: '4px solid #263878',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <Title level={4} style={{ color: '#263878', margin: 0, fontSize: 'clamp(16px, 4vw, 20px)' }}>
            Datasheet Details: {selectedDatasheet.filename}
          </Title>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{ color: '#8c8c8c' }}
          >
            Close
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Datasheet ID"
              // value={selectedDatasheet._id?.slice(-12) || 'N/A'}
              value={selectedDatasheet._id || 'N/A'}
              valueStyle={{ fontFamily: 'monospace', color: '#263878', fontSize: 'clamp(14px, 3vw, 16px)' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Total Rows"
              value={rowsPagination.total}
              valueStyle={{ color: '#52C41A', fontSize: 'clamp(18px, 4vw, 24px)' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Columns"
              value={rowColumns.length}
              valueStyle={{ color: '#1890FF', fontSize: 'clamp(18px, 4vw, 24px)' }}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mt-4 md:mt-6">
          <Col xs={24} md={12}>
            <label className="block text-sm font-medium mb-2" style={{ color: '#595959' }}>
              Current Version
            </label>
            <Card
              variant="borderless"
              style={{
                background: '#f6ffed',
                borderColor: '#b7eb8f',
                padding: '12px 16px',
                borderRadius: '6px'
              }}
            >
              <Statistic
                title={null}
                value={currentVersion}
                valueStyle={{ color: '#52C41A', fontWeight: 600, fontSize: 'clamp(18px, 4vw, 22px)' }}
                prefix={<HistoryOutlined />}
                style={{ marginBottom: 0 }}
              />
              <Text type="secondary" className="text-xs mt-1 block">
                Active version
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <label className="block text-sm font-medium mb-2" style={{ color: '#595959' }}>
              Available Versions
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select a version to restore"
              size="large"
              onChange={onVersionRestore}
              allowClear
              optionLabelProp="label"
              popupMatchSelectWidth={false}
              value={currentVersion || undefined}
            >
              {(selectedDatasheet?.version_history || []).map((ver) => (
                <Option key={ver.version} value={ver.version} label={`Version ${ver.version}`}>
                  Version {ver.version}
                  {parseTimestamp(ver.timestamp) && ` - ${parseTimestamp(ver.timestamp)}`}
                  {ver.action ? ` (${ver.action})` : ''}
                  {ver.row_count !== undefined ? ` - Rows: ${ver.row_count}` : ''}
                </Option>
              ))}
            </Select>
            <Text type="secondary" className="text-xs mt-2 block">
              Select a version to restore this datasheet to a previous state.
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Data Preview */}
      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0, color: '#263878', fontSize: 'clamp(14px, 3vw, 16px)' }}>
              Data Preview
            </Title>
          </Space>
        }
        style={{ borderRadius: '8px', width: '100%', maxWidth: '100%' }}
        styles={{ body: { padding: 0 } }}
        extra={
          <Space size="small" wrap>
            <Button
              icon={<MessageOutlined />}
              loading={smsReportLoading}
              onClick={handleSmsReportExport}
              disabled={!selectedDatasheet}
              size="small"
              style={{
                backgroundColor: '#263978',
                borderColor: '#263978',
                color: 'white'
              }}
            >
              <span className="hidden sm:inline">SMS Report</span>
            </Button>
            <Dropdown
              menu={{ items: exportMenuItems }}
              placement="bottomRight"
              disabled={!selectedDatasheet}
            >
              <Button
                icon={<DownloadOutlined />}
                loading={exportLoading}
                size="small"
              >
                <span className="hidden sm:inline">Call Report</span>
                <span className="sm:hidden">Call Report</span>
              </Button>
            </Dropdown>
            {selectedRoom && selectedRoom !== 'main' && getDbName() === 'tatacapital' && (
              <Button
                icon={<SunOutlined />}
                onClick={handleOpenBodSmsModal}
                size="small"
                type="primary"
                style={{
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a'
                }}
                title="Send BOD SMS"
              >
                <span className="hidden sm:inline">BOD SMS</span>
                <span className="sm:hidden">BOD</span>
              </Button>
            )}
            {selectedRoom && selectedRoom !== 'main' && getDbName() === 'tatacapital' && (
              <Button
                icon={<MoonOutlined />}
                onClick={handleOpenEodSmsModal}
                size="small"
                type="primary"
                style={{
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff'
                }}
                title="Send EOD SMS"
              >
                <span className="hidden sm:inline">EOD SMS</span>
                <span className="sm:hidden">EOD</span>
              </Button>
            )}
            {getDbName() === 'tatacapital' && (
              <Button
                icon={<BarChartOutlined />}
                loading={bodEodLoading}
                onClick={fetchBodEodStatus}
                size="small"
                style={{
                  backgroundColor: '#722ed1',
                  borderColor: '#722ed1',
                  color: 'white'
                }}
                title="View BOD-EOD Status"
              >
                <span className="hidden sm:inline">BOD-EOD Status</span>
                <span className="sm:hidden">Status</span>
              </Button>
            )}
            {isTestDatasheet && (
              <Button
                icon={<ReloadOutlined />}
                loading={resetLoading}
                onClick={handleResetDatasheet}
                size="small"
                danger
                title="Reset datasheet - keep only required columns"
              >
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
            {shouldShowUpdateDueDates() && (
              <Button
                icon={<CalendarOutlined />}
                loading={updateDueDatesLoading}
                onClick={handleUpdateDueDates}
                size="small"
                style={{
                  backgroundColor: '#fa8c16',
                  borderColor: '#fa8c16',
                  color: 'white'
                }}
                title="Update Due Dates"
              >
                <span className="hidden sm:inline">Update Due Dates</span>
                <span className="sm:hidden">Due Dates</span>
              </Button>
            )}
          </Space>
        }
      >
        <div style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'visible',
          padding: '24px',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{ minWidth: '100%' }}>
            <Table<DatasheetRow>
              columns={rowColumns}
              dataSource={rows}
              loading={loading}
              scroll={{ x: 'max-content', y: 400 }}
              pagination={{
                current: rowsPagination.current,
                pageSize: rowsPagination.pageSize,
                total: rowsPagination.total,
                showSizeChanger: !isMobile,
                showQuickJumper: !isMobile,
                showTotal: (total: number, range: [number, number]) =>
                  formatPaginationText(total, range, 'rows'),
                pageSizeOptions: ['10', '20', '50', '100'],
                responsive: true,
                simple: isMobile
              }}
              onChange={onTableChange}
              size="small"
              className="rounded-lg"
            />
          </div>
        </div>
      </Card>

      {/* BOD-EOD Status Modal */}
      <Modal
        title={
          <Space>
            <BarChartOutlined style={{ color: '#722ed1' }} />
            <span>BOD-EOD Status</span>
          </Space>
        }
        open={bodEodModalVisible}
        onCancel={handleBodEodModalClose}
        footer={[
          <Button key="close" onClick={handleBodEodModalClose}>
            Close
          </Button>
        ]}
        width={600}
        destroyOnClose
        getContainer={false}
      >
        {bodEodLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Progress type="circle" percent={0} status="active" />
            <p style={{ marginTop: '16px', color: '#666' }}>Loading status...</p>
          </div>
        ) : bodEodStatus ? (
          <div>
            {/* Check if we have any valid stats */}
            {(!bodEodStatus.sms_sending_stats ||
              (!isValidStatsItem(bodEodStatus.sms_sending_stats.bod) &&
               !isValidStatsItem(bodEodStatus.sms_sending_stats.eod))) ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <Text type="secondary">No SMS sending stats available for this datasheet</Text>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {/* BOD Status */}
                {isValidStatsItem(bodEodStatus.sms_sending_stats.bod) && (
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <SunOutlined style={{ color: '#52c41a' }} />
                          <span>BOD Status</span>
                        </Space>
                      }
                      style={{ height: '100%' }}
                      extra={
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor:
                              bodEodStatus.sms_sending_stats.bod.status === 'completed' ? '#f6ffed' :
                              bodEodStatus.sms_sending_stats.bod.status === 'processing' ? '#e6f7ff' :
                              bodEodStatus.sms_sending_stats.bod.status === 'failed' ? '#fff2f0' : '#fafafa',
                            color:
                              bodEodStatus.sms_sending_stats.bod.status === 'completed' ? '#52c41a' :
                              bodEodStatus.sms_sending_stats.bod.status === 'processing' ? '#1890ff' :
                              bodEodStatus.sms_sending_stats.bod.status === 'failed' ? '#ff4d4f' : '#8c8c8c',
                            textTransform: 'capitalize'
                          }}
                        >
                          {bodEodStatus.sms_sending_stats.bod.status}
                        </span>
                      }
                    >
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <Progress
                          type="circle"
                          percent={bodEodStatus.sms_sending_stats.bod.progress?.percentage || 0}
                          strokeColor={bodEodStatus.sms_sending_stats.bod.is_error ? '#ff4d4f' : '#52c41a'}
                          status={bodEodStatus.sms_sending_stats.bod.is_error ? 'exception' : undefined}
                          format={(percent) => `${percent?.toFixed(1)}%`}
                        />
                      </div>

                      {bodEodStatus.sms_sending_stats.bod.bod_type && (
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>Type: </Text>
                          <Text strong style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                            {bodEodStatus.sms_sending_stats.bod.bod_type}
                          </Text>
                        </div>
                      )}

                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Statistic
                            title={<Space size="small"><CheckCircleOutlined style={{ color: '#52c41a' }} /><span>Success</span></Space>}
                            value={bodEodStatus.sms_sending_stats.bod.progress?.success_count || 0}
                            valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title={<Space size="small"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /><span>Failed</span></Space>}
                            value={bodEodStatus.sms_sending_stats.bod.progress?.failed_count || 0}
                            valueStyle={{ color: '#ff4d4f', fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Total"
                            value={bodEodStatus.sms_sending_stats.bod.progress?.total_documents || 0}
                            valueStyle={{ fontSize: '14px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Processed"
                            value={bodEodStatus.sms_sending_stats.bod.progress?.processed_count || 0}
                            valueStyle={{ fontSize: '14px' }}
                          />
                        </Col>
                      </Row>

                      {bodEodStatus.sms_sending_stats.bod.is_error && bodEodStatus.sms_sending_stats.bod.error_message && (
                        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff2f0', borderRadius: '4px' }}>
                          <Text type="danger" style={{ fontSize: '12px' }}>
                            {bodEodStatus.sms_sending_stats.bod.error_message}
                          </Text>
                        </div>
                      )}

                      {bodEodStatus.sms_sending_stats.bod.last_updated && (
                        <div style={{ marginTop: '12px', textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Last Updated: {bodEodStatus.sms_sending_stats.bod.last_updated}
                          </Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                )}

                {/* EOD Status */}
                {isValidStatsItem(bodEodStatus.sms_sending_stats.eod) && (
                  <Col xs={24} md={12}>
                    <Card
                      title={
                        <Space>
                          <MoonOutlined style={{ color: '#1890ff' }} />
                          <span>EOD Status</span>
                        </Space>
                      }
                      style={{ height: '100%' }}
                      extra={
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor:
                              bodEodStatus.sms_sending_stats.eod.status === 'completed' ? '#f6ffed' :
                              bodEodStatus.sms_sending_stats.eod.status === 'processing' ? '#e6f7ff' :
                              bodEodStatus.sms_sending_stats.eod.status === 'failed' ? '#fff2f0' : '#fafafa',
                            color:
                              bodEodStatus.sms_sending_stats.eod.status === 'completed' ? '#52c41a' :
                              bodEodStatus.sms_sending_stats.eod.status === 'processing' ? '#1890ff' :
                              bodEodStatus.sms_sending_stats.eod.status === 'failed' ? '#ff4d4f' : '#8c8c8c',
                            textTransform: 'capitalize'
                          }}
                        >
                          {bodEodStatus.sms_sending_stats.eod.status}
                        </span>
                      }
                    >
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <Progress
                          type="circle"
                          percent={bodEodStatus.sms_sending_stats.eod.progress?.percentage || 0}
                          strokeColor={bodEodStatus.sms_sending_stats.eod.is_error ? '#ff4d4f' : '#1890ff'}
                          status={bodEodStatus.sms_sending_stats.eod.is_error ? 'exception' : undefined}
                          format={(percent) => `${percent?.toFixed(1)}%`}
                        />
                      </div>

                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Statistic
                            title={<Space size="small"><CheckCircleOutlined style={{ color: '#52c41a' }} /><span>Success</span></Space>}
                            value={bodEodStatus.sms_sending_stats.eod.progress?.success_count || 0}
                            valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title={<Space size="small"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /><span>Failed</span></Space>}
                            value={bodEodStatus.sms_sending_stats.eod.progress?.failed_count || 0}
                            valueStyle={{ color: '#ff4d4f', fontSize: '16px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Total"
                            value={bodEodStatus.sms_sending_stats.eod.progress?.total_documents || 0}
                            valueStyle={{ fontSize: '14px' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Processed"
                            value={bodEodStatus.sms_sending_stats.eod.progress?.processed_count || 0}
                            valueStyle={{ fontSize: '14px' }}
                          />
                        </Col>
                      </Row>

                      {bodEodStatus.sms_sending_stats.eod.is_error && bodEodStatus.sms_sending_stats.eod.error_message && (
                        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff2f0', borderRadius: '4px' }}>
                          <Text type="danger" style={{ fontSize: '12px' }}>
                            {bodEodStatus.sms_sending_stats.eod.error_message}
                          </Text>
                        </div>
                      )}

                      {bodEodStatus.sms_sending_stats.eod.last_updated && (
                        <div style={{ marginTop: '12px', textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Last Updated: {bodEodStatus.sms_sending_stats.eod.last_updated}
                          </Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                )}
              </Row>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            No data available
          </div>
        )}
      </Modal>

      {/* BOD SMS Modal */}
      <Modal
        title={
          <Space>
            <SunOutlined style={{ color: '#52c41a' }} />
            <span>Send BOD SMS</span>
          </Space>
        }
        open={bodSmsModalVisible}
        onCancel={handleCloseBodSmsModal}
        footer={[
          <Button key="cancel" onClick={handleCloseBodSmsModal}>
            Cancel
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<SendOutlined />}
            loading={bodSmsSending}
            onClick={handleSendBodSms}
            disabled={selectedDatasheet?.bod_sent === true}
            style={selectedDatasheet?.bod_sent !== true ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
          >
            {selectedDatasheet?.bod_sent === true ? 'BOD SMS Already Sent' : 'Send BOD SMS'}
          </Button>
        ]}
        width={500}
        destroyOnClose
        getContainer={false}
      >
        <Tabs
          activeKey={bodSmsTab}
          onChange={(key) => setBodSmsTab(key as 'plivo' | 'bash')}
          items={[
            {
              key: 'plivo',
              label: 'Plivo SMS',
              children: (
                <div style={{ padding: '0' }}>
                  {/* <Card style={{ marginBottom: '16px', background: '#f6f8fa' }}>
                    <Row gutter={[16, 8]}>
                      <Col span={24}>
                        <Text type="secondary">API Endpoint:</Text>
                        <br />
                        <Text code style={{ fontSize: '12px' }}>
                          plivo-bulk-sms-room-3.admin-wwai.com/sms/bod
                        </Text>
                      </Col>
                    </Row>
                  </Card> */}
                </div>
              )
            },
            {
              key: 'bash',
              label: 'Bash SMS',
              children: (
                <div style={{ padding: '0' }}>
                  {/* <Card style={{ marginBottom: '16px', background: '#f6f8fa' }}>
                    <Row gutter={[16, 8]}>
                      <Col span={24}>
                        <Text type="secondary">API Endpoint:</Text>
                        <br />
                        <Text code style={{ fontSize: '12px' }}>
                          bash-sms.admin-wwai.com/sms/bod
                        </Text>
                      </Col>
                    </Row>
                  </Card> */}
                </div>
              )
            }
          ]}
        />

        {/* Common Fields */}
        <Card style={{ marginTop: '16px' }}>
          <Row gutter={[16, 16]}>
            {/* <Col span={24}>
              <Text strong>MongoDB URI (Room):</Text>
              <br />
              <Text code>{selectedRoom || 'main'}</Text>
            </Col>
            <Col span={24}>
              <Text strong>Database Name:</Text>
              <br />
              <Text code>{getDbName()}</Text>
            </Col> */}
            <Col span={24}>
              <Text strong>Datasheet ID:</Text>
              <br />
              <Text code style={{ fontSize: '12px' }}>{selectedDatasheet?._id || 'N/A'}</Text>
            </Col>
            <Col span={24}>
              <Text strong>BOD Type:</Text>
              <Select
                value={bodSmsType}
                onChange={setBodSmsType}
                style={{ width: '100%', marginTop: '8px' }}
                options={[
                  { value: 'bkt_x', label: 'BOD Bucket X' },
                  { value: 'bkt_x_charges', label: 'BOD Bucket X Charges' },
                  { value: 'bkt_1', label: 'BOD Bucket 1' },
                  { value: 'pnpa', label: 'BOD PNPA' }
                ]}
              />
            </Col>
          </Row>
        </Card>

        {bodSmsSending && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Spin />
            <Text style={{ marginLeft: '8px' }}>Sending BOD SMS...</Text>
          </div>
        )}
      </Modal>

      {/* EOD SMS Modal */}
      <Modal
        title={
          <Space>
            <MoonOutlined style={{ color: '#1890ff' }} />
            <span>Send EOD SMS</span>
          </Space>
        }
        open={eodSmsModalVisible}
        onCancel={handleCloseEodSmsModal}
        footer={[
          <Button key="cancel" onClick={handleCloseEodSmsModal}>
            Cancel
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<SendOutlined />}
            loading={eodSmsSending}
            onClick={handleSendEodSms}
            disabled={selectedDatasheet?.eod_sent === true}
            style={selectedDatasheet?.eod_sent !== true ? { backgroundColor: '#1890ff', borderColor: '#1890ff' } : {}}
          >
            {selectedDatasheet?.eod_sent === true ? 'EOD SMS Already Sent' : 'Send EOD SMS'}
          </Button>
        ]}
        destroyOnClose
        getContainer={false}
        width={500}
      >
        <Tabs
          activeKey={eodSmsTab}
          onChange={(key) => setEodSmsTab(key as 'plivo' | 'bash')}
          items={[
            {
              key: 'plivo',
              label: 'Plivo SMS',
              children: (
                <div style={{ padding: '0' }}>
                  {/* <Card style={{ marginBottom: '16px', background: '#f6f8fa' }}>
                    <Row gutter={[16, 8]}>
                      <Col span={24}>
                        <Text type="secondary">Plivo SMS</Text>
                        <br />
                        <Text code style={{ fontSize: '12px' }}>
                          plivo-bulk-sms-room-3.admin-wwai.com/sms/eod
                        </Text>
                      </Col>
                    </Row>
                  </Card> */}
                </div>
              )
            },
            {
              key: 'bash',
              label: 'Bash SMS',
              children: (
                <div style={{ padding: '0' }}>
                  {/* <Card style={{ marginBottom: '16px', background: '#f6f8fa' }}>
                    <Row gutter={[16, 8]}>
                      <Col span={24}>
                        <Text type="secondary">Bash SMS</Text>
                        <br />
                        <Text code style={{ fontSize: '12px' }}>
                          bash-sms.admin-wwai.com/sms/eod
                        </Text>
                      </Col>
                    </Row>
                  </Card> */}
                </div>
              )
            }
          ]}
        />

        {/* Common Fields */}
        <Card style={{ marginTop: '16px' }}>
          <Row gutter={[16, 16]}>
            {/* <Col span={24}>
              <Text strong>MongoDB URI (Room):</Text>
              <br />
              <Text code>{selectedRoom || 'main'}</Text>
            </Col>
            <Col span={24}>
              <Text strong>Database Name:</Text>
              <br />
              <Text code>{getDbName()}</Text>
            </Col> */}
            <Col span={24}>
              <Text strong>Datasheet ID:</Text>
              <br />
              <Text code style={{ fontSize: '12px' }}>{selectedDatasheet?._id || 'N/A'}</Text>
            </Col>
          </Row>
        </Card>

        {eodSmsSending && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Spin />
            <Text style={{ marginLeft: '8px' }}>Sending EOD SMS...</Text>
          </div>
        )}
      </Modal>

      {/* Update Due Dates Response Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#fa8c16' }} />
            <span>Update Due Dates Response</span>
          </Space>
        }
        open={updateDueDatesModalVisible}
        onCancel={handleCloseUpdateDueDatesModal}
        footer={[
          <Button key="close" onClick={handleCloseUpdateDueDatesModal}>
            Close
          </Button>
        ]}
        width={500}
        destroyOnClose
        getContainer={false}
      >
        <div style={{ padding: '16px 0' }}>
          <Card style={{ background: '#f6f8fa' }}>
            <Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {updateDueDatesResponse || 'No response received'}
            </Text>
          </Card>
        </div>
      </Modal>
    </div>
  );
};

export default DatasheetDetails;
