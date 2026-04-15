/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  DatePicker,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  Spin,
  Empty,
  Switch,
  Tabs,
  Tooltip,
} from 'antd';
import {
  PhoneOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReloadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI, appendRoomParam } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';

interface DailyStats {
  total_calls: number;
  total_cost: number;
  total_duration_seconds: number;
  unique_executions: number;
}

interface DailyBillingRecord {
  _id: string;
  year: number;
  month: number;
  day: number;
  date: string;
  stats: DailyStats;
  created_at: string;
  updated_at: string;
}

interface MonthTotals {
  total_calls: number;
  total_cost: number;
  total_duration_seconds: number;
  days_with_data: number;
}

interface DailyBillingResponse {
  status: string;
  message?: string;
  year?: number;
  month?: number;
  month_totals?: MonthTotals;
  daily_records?: DailyBillingRecord[];
  data?: DailyBillingRecord | null;
}

interface MonthlySummary {
  month: number;
  total_calls: number;
  total_cost: number;
  total_duration: number;
  days_with_data: number;
  unique_executions: number;
  average_daily_cost: number;
}

interface YearTotals {
  total_calls: number;
  total_cost: number;
  total_duration_seconds: number;
  months_with_data: number;
}

interface BillingSummaryResponse {
  status: string;
  message?: string;
  year?: number;
  currency?: string;
  year_totals?: YearTotals;
  monthly_breakdown?: MonthlySummary[];
}

interface GenerateBillingResponse {
  status: string;
  message?: string;
  note?: string;
}

const CallsBillingDashboard = () => {
  const { selectedRoom } = useRoomAPI();
  const [dailyData, setDailyData] = useState<DailyBillingResponse | null>(null);
  const [summaryData, setSummaryData] = useState<BillingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingBilling, setGeneratingBilling] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [messageApi] = useState({
    success: (msg: string) => console.log('Success:', msg),
    error: (msg: string) => console.error('Error:', msg),
    info: (msg: string) => console.log('Info:', msg)
  });

  const [filters, setFilters] = useState({
    year: dayjs().year(),
    month: dayjs().month() + 1,
    day: null as number | null,
    forceRecalculate: false,
    runAsync: true,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

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

  const getMonthName = (monthNum: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1] || '';
  };

  const fetchDailyBilling = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('api_key', API_KEY);
      params.append('year', filters.year.toString());
      params.append('month', filters.month.toString());
      if (filters.day) {
        params.append('day', filters.day.toString());
      }

      if (selectedRoom && selectedRoom !== 'main') {
        params.append('room', selectedRoom);
      }

      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/billing/daily?${params}`));
      const result = response.data;

      if (result.status === 'success') {
        setDailyData(result);
        messageApi.success('Daily billing data loaded successfully');
      } else {
        messageApi.error(result.message || 'Failed to fetch daily billing data');
      }
    } catch (error) {
      messageApi.error('Error fetching daily billing data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingSummary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('api_key', API_KEY);
      params.append('year', filters.year.toString());

      if (selectedRoom && selectedRoom !== 'main') {
        params.append('room', selectedRoom);
      }

      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/billing/summary?${params}`));
      const result = response.data;

      if (result.status === 'success') {
        setSummaryData(result);
        messageApi.success('Billing summary loaded successfully');
      } else {
        messageApi.error(result.message || 'Failed to fetch billing summary');
      }
    } catch (error) {
      messageApi.error('Error fetching billing summary');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyBilling = async () => {
    setGeneratingBilling(true);
    try {
      const params = new URLSearchParams();
      params.append('api_key', API_KEY);
      params.append('year', filters.year.toString());
      params.append('month', filters.month.toString());
      params.append('force_recalculate', filters.forceRecalculate.toString());
      params.append('run_async', filters.runAsync.toString());

      if (selectedRoom && selectedRoom !== 'main') {
        params.append('room', selectedRoom);
      }

      const response = await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/billing/generate-monthly?${params}`));
      const result: GenerateBillingResponse = response.data;

      if (result.status === 'accepted' || result.status === 'success') {
        messageApi.success(result.message || 'Billing generation started');
        if (result.note) {
          messageApi.info(result.note);
        }
        // Refresh data after a short delay if running async
        if (filters.runAsync) {
          setTimeout(() => {
            fetchDailyBilling();
          }, 2000);
        } else {
          fetchDailyBilling();
        }
      } else {
        messageApi.error(result.message || 'Failed to generate billing');
      }
    } catch (error) {
      messageApi.error('Error generating billing');
      console.error('Error:', error);
    } finally {
      setGeneratingBilling(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyBilling();
    } else {
      fetchBillingSummary();
    }
  }, [selectedRoom, activeTab]);

  const handleMonthChange = (date: any) => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        year: date.year(),
        month: date.month() + 1,
        day: null
      }));
    }
  };

  const handleYearChange = (date: any) => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        year: date.year()
      }));
    }
  };

  const handleSearch = () => {
    if (activeTab === 'daily') {
      fetchDailyBilling();
    } else {
      fetchBillingSummary();
    }
  };

  const dailyColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string, record: DailyBillingRecord) => (
        <span>
          {dayjs(date).format('DD MMM YYYY')}
          <br />
          <Tag color="blue" style={{ fontSize: '10px' }}>
            Day {record.day}
          </Tag>
        </span>
      ),
    },
    {
      title: 'Total Calls',
      dataIndex: ['stats', 'total_calls'],
      key: 'total_calls',
      sorter: (a: DailyBillingRecord, b: DailyBillingRecord) =>
        a.stats.total_calls - b.stats.total_calls,
      render: (value: number) => (
        <span style={{ fontWeight: '600', color: '#263978' }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Total Cost (₹)',
      dataIndex: ['stats', 'total_cost'],
      key: 'total_cost',
      sorter: (a: DailyBillingRecord, b: DailyBillingRecord) =>
        a.stats.total_cost - b.stats.total_cost,
      render: (value: number) => (
        <span style={{ fontWeight: '600', color: '#52c41a' }}>
          ₹{value.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Duration',
      dataIndex: ['stats', 'total_duration_seconds'],
      key: 'total_duration_seconds',
      sorter: (a: DailyBillingRecord, b: DailyBillingRecord) =>
        a.stats.total_duration_seconds - b.stats.total_duration_seconds,
      render: (value: number) => formatDuration(value),
    },
    {
      title: 'Unique Executions',
      dataIndex: ['stats', 'unique_executions'],
      key: 'unique_executions',
      sorter: (a: DailyBillingRecord, b: DailyBillingRecord) =>
        a.stats.unique_executions - b.stats.unique_executions,
    },
    {
      title: 'Last Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (value: string) => dayjs(value).format('DD MMM YYYY HH:mm'),
    },
  ];

  const summaryColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month: number) => (
        <span style={{ fontWeight: '600', color: '#263978' }}>
          {getMonthName(month)}
        </span>
      ),
    },
    {
      title: 'Total Calls',
      dataIndex: 'total_calls',
      key: 'total_calls',
      sorter: (a: MonthlySummary, b: MonthlySummary) => a.total_calls - b.total_calls,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Total Cost (₹)',
      dataIndex: 'total_cost',
      key: 'total_cost',
      sorter: (a: MonthlySummary, b: MonthlySummary) => a.total_cost - b.total_cost,
      render: (value: number) => (
        <span style={{ fontWeight: '600', color: '#52c41a' }}>
          ₹{value.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Avg Daily Cost (₹)',
      dataIndex: 'average_daily_cost',
      key: 'average_daily_cost',
      sorter: (a: MonthlySummary, b: MonthlySummary) =>
        a.average_daily_cost - b.average_daily_cost,
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
    {
      title: 'Duration',
      dataIndex: 'total_duration',
      key: 'total_duration',
      sorter: (a: MonthlySummary, b: MonthlySummary) => a.total_duration - b.total_duration,
      render: (value: number) => formatDuration(value),
    },
    {
      title: 'Unique Executions',
      dataIndex: 'unique_executions',
      key: 'unique_executions',
      sorter: (a: MonthlySummary, b: MonthlySummary) => a.unique_executions - b.unique_executions,
    },
    {
      title: 'Days with Data',
      dataIndex: 'days_with_data',
      key: 'days_with_data',
      sorter: (a: MonthlySummary, b: MonthlySummary) => a.days_with_data - b.days_with_data,
    },
  ];

  const tabItems = [
    {
      key: 'daily',
      label: 'Daily Billing',
      children: (
        <>
          <Card style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                  Select Month
                </label>
                <DatePicker
                  picker="month"
                  value={dayjs(`${filters.year}-${String(filters.month).padStart(2, '0')}`)}
                  onChange={handleMonthChange}
                  style={{ width: '100%' }}
                  placeholder="Select Month"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                  Force Recalculate
                  <Tooltip title="If enabled, billing will be recalculated even if it already exists">
                    <InfoCircleOutlined style={{ marginLeft: '8px', color: '#666' }} />
                  </Tooltip>
                </label>
                <Switch
                  checked={filters.forceRecalculate}
                  onChange={(checked) => setFilters(prev => ({ ...prev, forceRecalculate: checked }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                  Run Async
                  <Tooltip title="If enabled, billing generation runs in background">
                    <InfoCircleOutlined style={{ marginLeft: '8px', color: '#666' }} />
                  </Tooltip>
                </label>
                <Switch
                  checked={filters.runAsync}
                  onChange={(checked) => setFilters(prev => ({ ...prev, runAsync: checked }))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  type="primary"
                  onClick={handleSearch}
                  loading={loading}
                  style={{ backgroundColor: '#263978', borderColor: '#263978' }}
                  icon={<SearchOutlined />}
                >
                  Search
                </Button>
                <Button
                  onClick={handleSearch}
                  loading={loading}
                  icon={<ReloadOutlined />}
                >
                  Refresh
                </Button>
                <Button
                  type="default"
                  onClick={generateMonthlyBilling}
                  loading={generatingBilling}
                  icon={<SyncOutlined />}
                  style={{ borderColor: '#52c41a', color: '#52c41a' }}
                >
                  Generate Billing
                </Button>
              </div>
            </div>
          </Card>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
              <Spin size="large" />
            </div>
          ) : dailyData && dailyData.daily_records && dailyData.daily_records.length > 0 ? (
            <>
              {dailyData.month_totals && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Total Calls"
                        value={dailyData.month_totals.total_calls}
                        prefix={<PhoneOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Total Cost"
                        value={dailyData.month_totals.total_cost}
                        prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                        suffix="₹"
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Total Duration"
                        value={formatDuration(dailyData.month_totals.total_duration_seconds)}
                        prefix={<ClockCircleOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978', fontSize: '20px' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Days with Data"
                        value={dailyData.month_totals.days_with_data}
                        prefix={<CalendarOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978' }}
                      />
                    </Card>
                  </Col>
                </Row>
              )}

              <Card
                title={
                  <span>
                    Daily Billing Records - {getMonthName(filters.month)} {filters.year}
                  </span>
                }
                style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}
              >
                <Table
                  columns={dailyColumns}
                  dataSource={dailyData.daily_records}
                  rowKey="_id"
                  scroll={{ x: 'auto' }}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    onChange: (page, pageSize) => {
                      setPagination({ current: page, pageSize: pageSize });
                    },
                  }}
                />
              </Card>
            </>
          ) : (
            <Card style={{ textAlign: 'center', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
              <Empty
                description={
                  <span>
                    No billing records found for {getMonthName(filters.month)} {filters.year}.
                    <br />
                    <small style={{ color: '#666' }}>
                      Click &quot;Generate Billing&quot; to calculate billing for this month.
                    </small>
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </>
      ),
    },
    {
      key: 'summary',
      label: 'Yearly Summary',
      children: (
        <>
          <Card style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#263978', marginBottom: '8px' }}>
                  Select Year
                </label>
                <DatePicker
                  picker="year"
                  value={dayjs(`${filters.year}`)}
                  onChange={handleYearChange}
                  style={{ width: '100%' }}
                  placeholder="Select Year"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Space>
                  <Button
                    type="primary"
                    onClick={handleSearch}
                    loading={loading}
                    style={{ backgroundColor: '#263978', borderColor: '#263978' }}
                    icon={<SearchOutlined />}
                  >
                    Search
                  </Button>
                  <Button
                    onClick={handleSearch}
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
          ) : summaryData && summaryData.monthly_breakdown && summaryData.monthly_breakdown.length > 0 ? (
            <>
              {summaryData.year_totals && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Total Calls (Year)"
                        value={summaryData.year_totals.total_calls}
                        prefix={<PhoneOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Total Cost (Year)"
                        value={summaryData.year_totals.total_cost}
                        prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                        suffix="₹"
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Total Duration (Year)"
                        value={formatDuration(summaryData.year_totals.total_duration_seconds)}
                        prefix={<ClockCircleOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978', fontSize: '20px' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                      <Statistic
                        title="Months with Data"
                        value={summaryData.year_totals.months_with_data}
                        prefix={<CheckCircleOutlined style={{ color: '#263978' }} />}
                        valueStyle={{ color: '#263978' }}
                      />
                    </Card>
                  </Col>
                </Row>
              )}

              <Card
                title={`Yearly Billing Summary - ${summaryData.year}`}
                extra={
                  <Tag color="#263978">
                    Currency: {summaryData.currency || 'INR'}
                  </Tag>
                }
                style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}
              >
                <Table
                  columns={summaryColumns}
                  dataSource={summaryData.monthly_breakdown}
                  rowKey="month"
                  scroll={{ x: 'auto' }}
                  pagination={false}
                />
              </Card>
            </>
          ) : (
            <Card style={{ textAlign: 'center', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
              <Empty
                description={`No billing summary found for ${filters.year}.`}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#263978', marginBottom: '8px' }}>
            Calls Billing Dashboard
          </h1>
          <p style={{ color: '#666' }}>
            Generate and view daily billing records for call costs
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: '24px' }}
        />
      </div>
    </div>
  );
};

export default CallsBillingDashboard;
