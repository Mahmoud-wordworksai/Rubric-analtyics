"use client";

import React, { useState } from 'react';
import { Modal, Card, Row, Col, Statistic, Table, Button, Select, Typography, Dropdown, message, Space, Progress } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { EyeOutlined, HistoryOutlined, DownloadOutlined, MessageOutlined, SunOutlined, MoonOutlined, BarChartOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { Datasheet, DatasheetRow, PaginationState } from '../types';
import { formatPaginationText, parseTimestamp } from '../utils';
import { API_BASE_URL } from "@/constants";
import { useRoomAPI } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';
// import { useDatasheets } from '../hooks/useDatasheets';

const { Text } = Typography;
const { Option } = Select;

// BOD-EOD Status interfaces
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

interface ViewModalProps {
  visible: boolean;
  loading: boolean;
  selectedDatasheet: Datasheet | null;
  rows: DatasheetRow[];
  rowColumns: ColumnsType<DatasheetRow>;
  rowsPagination: PaginationState;
  onCancel: () => void;
  onTableChange: (pagination: TablePaginationConfig) => void;
  onVersionRestore: (version: number) => Promise<void>;
  onDatasheetUpdate?: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({
  visible,
  loading,
  selectedDatasheet,
  rows,
  rowColumns,
  rowsPagination,
  onCancel,
  onTableChange,
  onVersionRestore,
  onDatasheetUpdate
}) => {
  const { appendRoomParam } = useRoomAPI();
  const [exportLoading, setExportLoading] = useState(false);
  const [smsReportLoading, setSmsReportLoading] = useState(false);
  const [bodSmsLoading, setBodSmsLoading] = useState(false);
  const [eodSmsLoading, setEodSmsLoading] = useState(false);

  // BOD-EOD Status Modal state
  const [bodEodModalVisible, setBodEodModalVisible] = useState(false);
  const [bodEodStatus, setBodEodStatus] = useState<BodEodStatus | null>(null);
  const [bodEodLoading, setBodEodLoading] = useState(false);

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
      link.download = `${selectedDatasheet.filename}_v${selectedDatasheet.version}${metadataLabel}_${timestamp}.${format}`;
      
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
    try {
      const response = await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/sms/reports?datasheet_id=${selectedDatasheet._id}`), null, {
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

  const handleBodSms = async () => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected');
      return;
    }

    setBodSmsLoading(true);
    try {
      // Send BOD SMS
      const response = await axiosInstance.post('https://sms.tata-capital.ai-voice-app.com/sms/plivo/BOD/send-bulk', {
        datasheet_ids: [selectedDatasheet._id]
      });

      const result = response.data;

      // Update datasheet document to set bod_sent = true
      try {
        await axiosInstance.patch(appendRoomParam(`${API_BASE_URL}/datasheets/${selectedDatasheet._id}`), {
          update_data: { bod_sent: true }
        });
      } catch {
        console.warn('Failed to update bod_sent status in datasheet');
      }

      message.success('BOD SMS sent successfully');
      console.log('BOD SMS result:', result);

      // Refresh datasheet data
      if (onDatasheetUpdate) {
        onDatasheetUpdate();
      }
    } catch (error) {
      console.error('BOD SMS error:', error);
      message.error(`Failed to send BOD SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBodSmsLoading(false);
    }
  };

  const handleEodSms = async () => {
    if (!selectedDatasheet?._id) {
      message.error('No datasheet selected');
      return;
    }

    setEodSmsLoading(true);
    try {
      // Send EOD SMS
      const response = await axiosInstance.post('https://sms.tata-capital.ai-voice-app.com/sms/plivo/EOD/send-bulk', {
        datasheet_ids: [selectedDatasheet._id]
      });

      const result = response.data;

      // Update datasheet document to set eod_sent = true
      try {
        await axiosInstance.patch(appendRoomParam(`${API_BASE_URL}/datasheets/${selectedDatasheet._id}`), {
          update_data: { eod_sent: true }
        });
      } catch {
        console.warn('Failed to update eod_sent status in datasheet');
      }

      message.success('EOD SMS sent successfully');
      console.log('EOD SMS result:', result);

      // Refresh datasheet data
      if (onDatasheetUpdate) {
        onDatasheetUpdate();
      }
    } catch (error) {
      console.error('EOD SMS error:', error);
      message.error(`Failed to send EOD SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEodSmsLoading(false);
    }
  };

  // Check if BOD/EOD buttons should be enabled
  const isBodEnabled = selectedDatasheet?.bod_sent === false;
  const isEodEnabled = selectedDatasheet?.eod_sent === false;

  // Get db_name based on project
  const getDbName = () => {
    const subdomain = window.location.hostname.split(".")[0];
    const selectedProject = subdomain.replace(/-/g, '_');
    return selectedProject === "tata_capital" ? "tatacapital" : selectedProject;
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

  return (
    <Modal
      title={
        <div style={{ color: '#263878', fontSize: '18px' }}>
          <EyeOutlined className="mr-2" />
          Datasheet Details: {selectedDatasheet?.filename}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width="95%"
      footer={false}
      style={{ top: 20 }}
    >
      {selectedDatasheet && (
        <div>
          <Card className="mb-4" style={{ borderRadius: '8px' }}>
            <Row gutter={24}>
              <Col span={8}>
                <Statistic 
                  title="Datasheet ID" 
                  // value={selectedDatasheet._id?.slice(-12) || 'N/A'} 
                  value={selectedDatasheet._id || 'N/A'} 
                  valueStyle={{ fontFamily: 'monospace', color: '#263878' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Total Rows" 
                  value={rowsPagination.total} 
                  valueStyle={{ color: '#52C41A' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Columns" 
                  value={rowColumns.length} 
                  valueStyle={{ color: '#1890FF' }}
                />
              </Col>
            </Row>
            <Row gutter={24} className="mt-4">
              <Col span={12}>
                <label className="block text-sm font-medium mb-2">Current Version</label>
                <Card bordered={false} style={{ background: '#f6ffed', borderColor: '#b7eb8f', padding: 0 }}>
                  <Statistic
                    title={null}
                    value={selectedDatasheet?.version ?? 'N/A'}
                    valueStyle={{ color: '#52C41A', fontWeight: 600, fontSize: 22 }}
                    prefix={<HistoryOutlined />}
                    style={{ marginBottom: 0 }}
                  />
                  <Text type="secondary" className="text-xs mt-1 block">
                    Active version
                  </Text>
                </Card>
              </Col>
              <Col span={12}>
                <label className="block text-sm font-medium mb-2">Available Versions</label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select a version to restore"
                  size="large"
                  onChange={onVersionRestore}
                  allowClear
                  optionLabelProp="label"
                  dropdownMatchSelectWidth={false}
                  value={selectedDatasheet.version || undefined}
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
            {/* <Row gutter={16} className="my-4">
                <Col span={12}>
                    <label className="block text-sm font-medium mb-2">Search Rows</label>
                    <input
                        type="text"
                        className="ant-input"
                        placeholder="Search in datasheet rows..."
                        onChange={e => handleRowsSearch(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </Col>
            </Row> */}
          </Card>

          <Card
            title="Data Preview"
            style={{ borderRadius: '8px' }}
            extra={
              <Space size="small">
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
                  SMS Report
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
                    Call Export
                  </Button>
                </Dropdown>
                <Button
                  icon={<SunOutlined />}
                  loading={bodSmsLoading}
                  onClick={handleBodSms}
                  disabled={!isBodEnabled}
                  size="small"
                  type={isBodEnabled ? "primary" : "default"}
                  style={isBodEnabled ? {
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a'
                  } : {}}
                  title={!isBodEnabled ? "BOD SMS already sent or not available" : "Send BOD SMS"}
                >
                  BOD SMS
                </Button>
                <Button
                  icon={<MoonOutlined />}
                  loading={eodSmsLoading}
                  onClick={handleEodSms}
                  disabled={!isEodEnabled}
                  size="small"
                  type={isEodEnabled ? "primary" : "default"}
                  style={isEodEnabled ? {
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff'
                  } : {}}
                  title={!isEodEnabled ? "EOD SMS already sent or not available" : "Send EOD SMS"}
                >
                  EOD SMS
                </Button>
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
                    BOD-EOD Status
                  </Button>
                )}
              </Space>
            }
          >
            <Table<DatasheetRow>
              columns={rowColumns}
              dataSource={rows}
              loading={loading}
              scroll={{ x: 'max-content', y: 400 }}
              pagination={{
                current: rowsPagination.current,
                pageSize: rowsPagination.pageSize,
                total: rowsPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total: number, range: [number, number]) => 
                  formatPaginationText(total, range, 'rows')
              }}
              onChange={onTableChange}
              size="small"
            />
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
        </div>
      )}
    </Modal>
  );
};

export default ViewModal;