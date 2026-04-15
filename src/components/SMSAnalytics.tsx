/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  DatePicker,
  Select,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  Progress,
  Tag,
  Space,
  Spin,
  Empty,
  Modal,
} from 'antd';
import {
  MessageOutlined,
  BarChartOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useRoomAPI } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface PricingTier {
  tier: string;
  rate_per_unit: number;
  units: number;
}

interface SMSBreakdown {
  [key: string]: number;
}

interface DatasheetDetail {
  datasheet_id: string;
  filename: string;
  created_at: string;
  row_count: number;
  sms_sent: number;
  sms_units_consumed: number;
  sms_breakdown: SMSBreakdown;
  units_breakdown: SMSBreakdown;
}

interface DetailsData {
  status: string;
  summary: {
    total_cost: number;
    total_sms_sent: number;
    total_sms_units_consumed: number;
    datasheets_processed: number;
  };
  datasheet_details: DatasheetDetail[];
}

interface AnalyticsData {
  status: string;
  message?: string;
  total_sms_sent: number;
  total_cost: number;
  total_sms_units_consumed: number;
  datasheets_processed: number;
  pricing_tier: PricingTier;
  sms_types: SMSBreakdown;
  sms_units: SMSBreakdown;
  month?: string;
  date_range?: string;
  environment_type: string;
}

interface MessageApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
}

const SMSCostAnalyticsDashboard = () => {
  const { selectedRoom } = useRoomAPI();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsData, setDetailsData] = useState<DetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [messageApi] = useState<MessageApi>({
    success: (msg: string) => console.log('Success:', msg),
    error: (msg: string) => console.error('Error:', msg)
  });
  const [filters, setFilters] = useState({
    filterType: 'monthly',
    month: dayjs().format('YYYY-MM'),
    startDate: '',
    endDate: '',
    type: 'production'
  });

  const API_BASE_URL = 'https://sms.tata-capital.ai-voice-app.com';

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '';
      const params = new URLSearchParams();
      
      if (filters.type) {
        params.append('type', filters.type);
      }

      if (selectedRoom && selectedRoom !== 'main') {
        params.append('room', selectedRoom);
      }

      if (filters.filterType === 'monthly' && filters.month) {
        params.append('month', filters.month);
        url = `${API_BASE_URL}/sms/cost/monthly?${params}`;
      } else if (filters.filterType === 'range') {
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        url = `${API_BASE_URL}/sms/cost/range?${params}`;
      }

      if (!url) {
        messageApi.error('Please select a valid filter');
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get(url);
      const result = response.data;

      if (result.status === 'success') {
        setData(result);
        if (result.message) {
          messageApi.error(result.message);
        } else {
          messageApi.success('Data loaded successfully');
        }
      } else {
        messageApi.error(result.message || 'Failed to fetch data');
      }
    } catch (error) {
      messageApi.error('Error fetching data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    setDetailsLoading(true);
    try {
      let url = '';
      const params = new URLSearchParams();

      if (filters.type) {
        params.append('type', filters.type);
      }

      if (selectedRoom && selectedRoom !== 'main') {
        params.append('room', selectedRoom);
      }

      if (filters.filterType === 'monthly' && filters.month) {
        params.append('month', filters.month);
        url = `${API_BASE_URL}/sms/cost/monthly/details?${params}`;
      } else if (filters.filterType === 'range') {
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        url = `${API_BASE_URL}/sms/cost/range/details?${params}`;
      }

      const response = await axiosInstance.get(url);
      const result = response.data;

      if (result.status === 'success') {
        setDetailsData(result);
        setDetailsModalVisible(true);
      } else {
        messageApi.error(result.message || 'Failed to fetch details');
      }
    } catch (error) {
      messageApi.error('Error fetching details');
      console.error('Error:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRoom]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0];
      const endDate = dates[1];
      setFilters(prev => ({
        ...prev,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      }));
    } else {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  const datasheetColumns = [
    {
      title: 'Datasheet ID',
      dataIndex: 'datasheet_id',
      key: 'datasheet_id',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
    },
    {
      title: 'Row Count',
      dataIndex: 'row_count',
      key: 'row_count',
      width: 100,
      sorter: (a: DatasheetDetail, b: DatasheetDetail) => a.row_count - b.row_count,
    },
    {
      title: 'SMS Sent',
      dataIndex: 'sms_sent',
      key: 'sms_sent',
      width: 100,
      sorter: (a: DatasheetDetail, b: DatasheetDetail) => a.sms_sent - b.sms_sent,
    },
    {
      title: 'Units Consumed',
      dataIndex: 'sms_units_consumed',
      key: 'sms_units_consumed',
      width: 140,
      sorter: (a: DatasheetDetail, b: DatasheetDetail) => a.sms_units_consumed - b.sms_units_consumed,
    },
  ];

  const renderSMSTypesBreakdown = (smsTypes: SMSBreakdown | undefined) => {
    if (!smsTypes) return null;

    const total = Object.values(smsTypes).reduce((sum: number, val: number) => sum + val, 0);

    return (
      <Row gutter={[16, 16]}>
        {Object.entries(smsTypes).map(([type, count]: [string, number]) => (
          <Col xs={12} sm={8} md={6} key={type}>
            <Card size="small" style={{ borderColor: '#e8e8e8' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#263978', marginBottom: '8px' }}>
                  {type}
                </div>
                <Progress
                  percent={total > 0 ? (count / total * 100) : 0}
                  strokeColor="#263978"
                  showInfo={false}
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#263978' }}>
                  {count.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {total > 0 ? ((count / total * 100).toFixed(1)) : 0}%
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderSMSUnitsBreakdown = (smsUnits: SMSBreakdown | undefined) => {
    if (!smsUnits) return null;

    const total = Object.values(smsUnits).reduce((sum: number, val: number) => sum + val, 0);

    return (
      <Row gutter={[16, 16]}>
        {Object.entries(smsUnits).map(([type, count]: [string, number]) => (
          <Col xs={12} sm={8} md={6} key={type}>
            <Card size="small" style={{ borderColor: '#e8e8e8' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: '#52c41a', marginBottom: '8px' }}>
                  {type}
                </div>
                <Progress
                  percent={total > 0 ? (count / total * 100) : 0}
                  strokeColor="#52c41a"
                  showInfo={false}
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                  {count.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {total > 0 ? ((count / total * 100).toFixed(1)) : 0}% units
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#263978', marginBottom: '8px' }}>
            SMS Cost Analytics Dashboard
          </h1>
          <p style={{ color: '#666' }}>
            Comprehensive analytics for SMS costs and usage metrics
          </p>
        </div>

        <Card style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                Filter Type
              </label>
              <Select
                value={filters.filterType}
                onChange={(value) => handleFilterChange('filterType', value)}
                style={{ width: '100%' }}
              >
                <Option value="monthly">Monthly</Option>
                <Option value="range">Date Range</Option>
              </Select>
            </div>

            {filters.filterType === 'monthly' ? (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                  Month
                </label>
                <DatePicker
                  picker="month"
                  value={filters.month ? dayjs(filters.month) : null}
                  onChange={(date) => handleFilterChange('month', date?.format('YYYY-MM') || '')}
                  style={{ width: '100%' }}
                  placeholder="Select Month"
                />
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                  Date Range
                </label>
                <RangePicker
                  value={filters.startDate && filters.endDate ? 
                    [dayjs(filters.startDate), dayjs(filters.endDate)] : null
                  }
                  onChange={handleDateRangeChange}
                  style={{ width: '100%' }}
                  placeholder={['Start Date', 'End Date']}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                Environment Type
              </label>
              <Select
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
                style={{ width: '100%' }}
              >
                <Option value="production">Production</Option>
                <Option value="test">Test</Option>
                <Option value="">Total (All)</Option>
              </Select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Space>
                <Button
                  type="primary"
                  onClick={fetchData}
                  loading={loading}
                  style={{ backgroundColor: '#263978', borderColor: '#263978' }}
                  icon={<SearchOutlined />}
                >
                  Search
                </Button>
                <Button
                  onClick={fetchData}
                  loading={loading}
                  icon={<ReloadOutlined />}
                >
                  Refresh
                </Button>
              </Space>
            </div>
          </div>
          {data && data.datasheets_processed > 0 && (
            <Button
              onClick={fetchDetails}
              loading={detailsLoading}
              icon={<EyeOutlined />}
              style={{ borderColor: '#263978', color: '#263978', marginTop: '16px' }}
            >
              View Details
            </Button>
          )}
        </Card>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
            <Spin size="large" />
          </div>
        ) : data ? (
          <>
            {data.message ? (
              <Card style={{ textAlign: 'center', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                <Empty
                  description={data.message}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </Card>
            ) : (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Total SMS Sent"
                        value={data.total_sms_sent}
                        prefix={<MessageOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Total Cost"
                        value={data.total_cost}
                        prefix="₹"
                        precision={2}
                        valueStyle={{ color: '#263978' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Units Consumed"
                        value={data.total_sms_units_consumed}
                        prefix={<BarChartOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Datasheets Processed"
                        value={data.datasheets_processed}
                        prefix={<FileTextOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="Pricing Tier Information" style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Tier</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#263978' }}>
                          {data.pricing_tier.tier}
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Rate per Unit</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                          ₹{data.pricing_tier.rate_per_unit.toFixed(2)}
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Units</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                          {data.pricing_tier.units.toLocaleString()}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>

                <Card title="SMS Types Breakdown" style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                  {renderSMSTypesBreakdown(data.sms_types)}
                </Card>

                <Card title="SMS Units Breakdown" style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                  {renderSMSUnitsBreakdown(data.sms_units)}
                </Card>

                <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                  <div style={{ textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '14px' }}>
                      {filters.filterType === 'monthly' 
                        ? `Month: ${data.month}` 
                        : `Date Range: ${data.date_range}`}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>
                      Environment Type: <Tag color="#263978">{data.environment_type || 'All'}</Tag>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </>
        ) : (
          <Card style={{ textAlign: 'center', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
            <Empty
              description="No data available. Please select filters and click Search."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}

        <Modal
          title="Datasheet Details"
          open={detailsModalVisible}
          onCancel={() => setDetailsModalVisible(false)}
          width={1200}
          footer={[
            <Button key="close" onClick={() => setDetailsModalVisible(false)}>
              Close
            </Button>
          ]}
        >
          {detailsData && (
            <>
              <Card size="small" style={{ marginBottom: '16px', background: '#f5f5f5' }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="Total Cost"
                      value={detailsData.summary.total_cost}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Total SMS Sent"
                      value={detailsData.summary.total_sms_sent}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Units Consumed"
                      value={detailsData.summary.total_sms_units_consumed}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Datasheets"
                      value={detailsData.summary.datasheets_processed}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                </Row>
              </Card>

              <Table
                columns={datasheetColumns}
                dataSource={detailsData.datasheet_details}
                rowKey="datasheet_id"
                scroll={{ x: 'auto' }}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '16px', background: '#fafafa' }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <h4 style={{ marginBottom: '12px', color: '#263978' }}>SMS Breakdown</h4>
                          {Object.entries(record.sms_breakdown).map(([type, count]) => (
                            <div key={type} style={{ marginBottom: '8px' }}>
                              <Tag color="#263978">{type}</Tag>
                              <span style={{ fontWeight: 'bold' }}>{count}</span>
                            </div>
                          ))}
                        </Col>
                        <Col span={12}>
                          <h4 style={{ marginBottom: '12px', color: '#52c41a' }}>Units Breakdown</h4>
                          {Object.entries(record.units_breakdown).map(([type, count]) => (
                            <div key={type} style={{ marginBottom: '8px' }}>
                              <Tag color="#52c41a">{type}</Tag>
                              <span style={{ fontWeight: 'bold' }}>{count}</span>
                            </div>
                          ))}
                        </Col>
                      </Row>
                    </div>
                  ),
                }}
              />
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default SMSCostAnalyticsDashboard;