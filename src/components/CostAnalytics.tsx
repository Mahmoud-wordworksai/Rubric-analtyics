/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from 'antd';
import {
  GlobalOutlined,
  PhoneOutlined,
  DollarOutlined,
  BarChartOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface MonthWiseBreakdown {
  month: string;
  total_calls: number;
  total_cost: number;
  average_cost_per_call: number;
  unique_executions_count: number;
  total_duration: number;
}

interface CallDurationDistribution {
  duration_range: string;
  call_count: number;
  percentage_of_total: number;
  calculated_total_cost: number;
}

interface GlobalOverview {
  total_calls: number;
  total_calculated_spend: number;
  average_call_cost: number;
  unique_executions: number;
}

interface KeyInsights {
  total_unique_executions: number;
  cost_trend: string;
  free_calls_percentage: number;
}

interface ApiResponse {
  status: string;
  message?: string;
  data: {
    global_overview: GlobalOverview;
    key_insights: KeyInsights;
    call_duration_distribution: CallDurationDistribution[];
    month_wise_breakdown: MonthWiseBreakdown[];
    currency: string;
    calculation_note: string;
  };
}

const CallCostAnalyticsDashboard = () => {
  const { selectedRoom } = useRoomAPI();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableTags] = useState(['production', 'test']);
  const [messageApi] = useState({
    success: (msg: string) => console.log('Success:', msg),
    error: (msg: string) => console.error('Error:', msg)
  });
  const [filters, setFilters] = useState({
    filterType: 'monthly',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: '',
    month: dayjs().format('YYYY-MM'),
    tags: [] as string[],
    datasheetIds: [] as string[],
    executionIds: ''
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize datasheet_id from URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const datasheetId = urlParams.get('datasheet_id');
      if (datasheetId) {
        console.log('Found datasheet_id in URL:', datasheetId);
        setFilters(prev => ({
          ...prev,
          datasheetIds: [datasheetId]
        }));
      }
      setIsInitialized(true);
    }
  }, []);

  const fetchData = async () => {
    if (!API_KEY) {
      messageApi.error('API key is required');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('api_key', API_KEY);

      if (filters.filterType === 'range') {
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
      } else if (filters.filterType === 'monthly') {
        if (filters.month) params.append('month', filters.month);
      }

      if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      if (filters.datasheetIds && filters.datasheetIds.length > 0) params.append('datasheet_ids', filters.datasheetIds.join(','));
      if (filters.executionIds) params.append('execution_ids', filters.executionIds);
      if (selectedRoom && selectedRoom !== 'main') params.append('room', selectedRoom);

      const response = await axiosInstance.get(`${API_BASE_URL}/dashboard/all-executions-call-cost-stats?${params}`);
      const result = response.data;

      if (result.status === 'success') {
        setData(result);
        messageApi.success('Data loaded successfully');
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

  useEffect(() => {
    if (isInitialized) {
      fetchData();
    }
  }, [isInitialized, selectedRoom]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      }));
    } else {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  const handleMonthChange = (value: any) => {
    if (value) {
      setFilters(prev => ({
        ...prev,
        month: value.format('YYYY-MM')
      }));
    } else {
      setFilters(prev => ({ ...prev, month: '' }));
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'Increasing': return '#ff4d4f';
      case 'Decreasing': return '#52c41a';
      case 'Stable': return '#1890ff';
      default: return '#8c8c8c';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const monthWiseColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Calls',
      dataIndex: 'total_calls',
      key: 'total_calls',
      sorter: (a: MonthWiseBreakdown, b: MonthWiseBreakdown) => a.total_calls - b.total_calls,
    },
    {
      title: 'Cost (₹)',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (value: number) => `₹${value.toFixed(2)}`,
      sorter: (a: MonthWiseBreakdown, b: MonthWiseBreakdown) => a.total_cost - b.total_cost,
    },
    {
      title: 'Avg Cost (₹)',
      dataIndex: 'average_cost_per_call',
      key: 'average_cost_per_call',
      render: (value: number) => `₹${value.toFixed(2)}`,
      sorter: (a: MonthWiseBreakdown, b: MonthWiseBreakdown) => a.average_cost_per_call - b.average_cost_per_call,
    },
    {
      title: 'Executions',
      dataIndex: 'unique_executions_count',
      key: 'unique_executions_count',
      sorter: (a: MonthWiseBreakdown, b: MonthWiseBreakdown) => a.unique_executions_count - b.unique_executions_count,
    },
    {
      title: 'Total Duration',
      dataIndex: 'total_duration',
      key: 'total_duration',
      render: (value: number) => formatDuration(value),
      sorter: (a: MonthWiseBreakdown, b: MonthWiseBreakdown) => a.total_duration - b.total_duration,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#263978', marginBottom: '8px' }}>
            Call Cost Analytics Dashboard
          </h1>
          <p style={{ color: '#666' }}>
            Comprehensive analytics for call costs and execution metrics
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
                  onChange={handleMonthChange}
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
                Tags
              </label>
              <Select
                mode="multiple"
                value={filters.tags}
                onChange={(value) => handleFilterChange('tags', value)}
                placeholder="Select tags"
                style={{ width: '100%' }}
                maxTagCount="responsive"
              >
                {availableTags.map(tag => (
                  <Option key={tag} value={tag}>
                    <Tag color="#263978">{tag}</Tag>
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                Datasheet IDs
              </label>
              <Select
                mode="tags"
                value={filters.datasheetIds}
                onChange={(value) => handleFilterChange('datasheetIds', value)}
                placeholder="Enter datasheet IDs"
                style={{ width: '100%' }}
                maxTagCount="responsive"
                tokenSeparators={[',']}
              />
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
        </Card>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
            <Spin size="large" />
          </div>
        ) : data ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                  <Statistic
                    title="Total Calls"
                    value={data.data.global_overview.total_calls}
                    prefix={<PhoneOutlined style={{ color: '#263978' }} />}
                    valueStyle={{ color: '#263978' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                  <Statistic
                    title="Total Spend"
                    value={data.data.global_overview.total_calculated_spend}
                    prefix={<DollarOutlined style={{ color: '#263978' }} />}
                    suffix="₹"
                    precision={2}
                    valueStyle={{ color: '#263978' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                  <Statistic
                    title="Avg Cost/Call"
                    value={data.data.global_overview.average_call_cost}
                    prefix={<BarChartOutlined style={{ color: '#263978' }} />}
                    suffix="₹"
                    precision={2}
                    valueStyle={{ color: '#263978' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                  <Statistic
                    title="Unique Executions"
                    value={data.data.global_overview.unique_executions}
                    prefix={<GlobalOutlined style={{ color: '#263978' }} />}
                    valueStyle={{ color: '#263978' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="Key Insights" style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#263978' }}>
                      {data.data.key_insights.total_unique_executions}
                    </div>
                    <div style={{ color: '#666' }}>Total Unique Executions</div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color={getTrendColor(data.data.key_insights.cost_trend)} style={{ fontSize: '16px', padding: '8px 16px' }}>
                      {data.data.key_insights.cost_trend} Trend
                    </Tag>
                    <div style={{ color: '#666', marginTop: '8px' }}>Cost Trend</div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                      {data.data.key_insights.free_calls_percentage.toFixed(1)}%
                    </div>
                    <div style={{ color: '#666' }}>Free Calls</div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="Call Duration Distribution" style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
              <Row gutter={[16, 16]}>
                {data.data.call_duration_distribution.map((item: CallDurationDistribution, index: number) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                    <Card size="small" style={{ borderColor: '#e8e8e8' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '600', color: '#263978' }}>
                          {item.duration_range}
                        </div>
                        <Progress
                          percent={item.percentage_of_total}
                          strokeColor="#263978"
                          showInfo={false}
                          style={{ marginBottom: '8px' }}
                        />
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {item.call_count} calls ({item.percentage_of_total.toFixed(1)}%)
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#52c41a' }}>
                          ₹{item.calculated_total_cost.toFixed(2)}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

            <Card title="Month-wise Breakdown" style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
              <Table
                columns={monthWiseColumns}
                dataSource={data.data.month_wise_breakdown}
                rowKey="month"
                scroll={{ x: 'auto' }}
                pagination={{ pageSize: 10, showSizeChanger: true }}
              />
            </Card>

            <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Currency:</strong> {data.data.currency}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {data.data.calculation_note}
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card style={{ textAlign: 'center', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
            <Empty
              description="No data available. Please adjust your filters and try again."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default CallCostAnalyticsDashboard;