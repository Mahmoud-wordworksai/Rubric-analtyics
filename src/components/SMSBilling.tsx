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
} from 'antd';
import {
  MessageOutlined,
  DollarOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReloadOutlined,
  SyncOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI, appendRoomParam } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';

interface SMSSummary {
  total_bod_sms: number;
  total_eod_sms: number;
  total_ptp_sms: number;
  total_paid_sms: number;
  total_paynow_sms: number;
  total_sms_count: number;
  total_sms_units: number;
}

interface DailyReport {
  _id: string;
  date_string: string;
  day: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  total_documents: number;
  total_test_documents: number;
  total_production_documents: number;
  test_datasheet_ids: any[];
  production_datasheet_ids: any[];
  summary: SMSSummary;
  total_production_cost: number;
  total_test_cost: number;
  total_cost: number;
}

interface MonthlySummary {
  year: number;
  month: number;
  total_days: number;
  total_documents: number;
  total_test_documents: number;
  total_production_documents: number;
  summary: SMSSummary;
  total_production_cost: number;
  total_test_cost: number;
  total_cost: number;
}

interface DailyBillingResponse {
  status: string;
  message?: string;
  year?: number;
  month?: number;
  daily_reports?: DailyReport[];
  monthly_summary?: MonthlySummary;
}

interface CalculateBillingResponse {
  status: string;
  message?: string;
  note?: string;
}

const SMSBillingDashboard = () => {
  const { selectedRoom } = useRoomAPI();
  const [dailyData, setDailyData] = useState<DailyBillingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatingBilling, setCalculatingBilling] = useState(false);
  const [messageApi] = useState({
    success: (msg: string) => console.log('Success:', msg),
    error: (msg: string) => console.error('Error:', msg),
    info: (msg: string) => console.log('Info:', msg)
  });

  const [filters, setFilters] = useState({
    year: dayjs().year(),
    month: dayjs().month() + 1,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

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

      if (selectedRoom && selectedRoom !== 'main') {
        params.append('room', selectedRoom);
      }

      const url = appendRoomParam(`${API_BASE_URL}/sms-billing/daily?${params}`);
      const response = await axiosInstance.get(url);
      const result = response.data;

      if (result.status === 'success') {
        setDailyData(result);
        messageApi.success('Daily SMS billing data loaded successfully');
      } else {
        messageApi.error(result.message || 'Failed to fetch daily SMS billing data');
      }
    } catch (error) {
      messageApi.error('Error fetching daily SMS billing data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyBilling = async () => {
    setCalculatingBilling(true);
    try {
      const params = new URLSearchParams();
      params.append('api_key', API_KEY);
      params.append('year', filters.year.toString());
      params.append('month', filters.month.toString());

      if (selectedRoom && selectedRoom !== 'main') {
        params.append('room', selectedRoom);
      }

      const url = appendRoomParam(`${API_BASE_URL}/sms-billing/calculate?${params}`);
      const response = await axiosInstance.post(url);
      const result: CalculateBillingResponse = response.data;

      if (result.status === 'accepted' || result.status === 'success') {
        messageApi.success(result.message || 'SMS billing calculation started');
        if (result.note) {
          messageApi.info(result.note);
        }
        // Refresh data after a short delay
        setTimeout(() => {
          fetchDailyBilling();
        }, 2000);
      } else {
        messageApi.error(result.message || 'Failed to Generate SMS billing');
      }
    } catch (error) {
      messageApi.error('Error generating SMS billing');
      console.error('Error:', error);
    } finally {
      setCalculatingBilling(false);
    }
  };

  useEffect(() => {
    fetchDailyBilling();
  }, [selectedRoom]);

  const handleMonthChange = (date: any) => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        year: date.year(),
        month: date.month() + 1,
      }));
    }
  };

  const handleSearch = () => {
    fetchDailyBilling();
  };

  const dailyColumns = [
    {
      title: 'Date',
      dataIndex: 'date_string',
      key: 'date_string',
      render: (date: string, record: DailyReport) => (
        <span>
          {date}
          <br />
          <Tag color="blue" style={{ fontSize: '10px' }}>
            Day {record.day}
          </Tag>
        </span>
      ),
    },
    {
      title: 'Documents',
      key: 'documents',
      render: (_: any, record: DailyReport) => (
        <div>
          <span style={{ fontWeight: '600', color: '#263978' }}>
            {record.total_documents.toLocaleString()}
          </span>
          <br />
          <small style={{ color: '#52c41a' }}>Prod: {record.total_production_documents.toLocaleString()}</small>
          {record.total_test_documents > 0 && (
            <>
              <br />
              <small style={{ color: '#faad14' }}>Test: {record.total_test_documents.toLocaleString()}</small>
            </>
          )}
        </div>
      ),
      sorter: (a: DailyReport, b: DailyReport) => a.total_documents - b.total_documents,
    },
    {
      title: 'Total SMS',
      dataIndex: ['summary', 'total_sms_count'],
      key: 'total_sms_count',
      sorter: (a: DailyReport, b: DailyReport) =>
        a.summary.total_sms_count - b.summary.total_sms_count,
      render: (value: number) => (
        <span style={{ fontWeight: '600', color: '#263978' }}>
          {value.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'SMS Units',
      dataIndex: ['summary', 'total_sms_units'],
      key: 'total_sms_units',
      sorter: (a: DailyReport, b: DailyReport) =>
        a.summary.total_sms_units - b.summary.total_sms_units,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'SMS Breakdown',
      key: 'sms_breakdown',
      render: (_: any, record: DailyReport) => (
        <Space size="small" wrap>
          {record.summary.total_bod_sms > 0 && <Tag color="blue">BOD: {record.summary.total_bod_sms}</Tag>}
          {record.summary.total_eod_sms > 0 && <Tag color="purple">EOD: {record.summary.total_eod_sms}</Tag>}
          {record.summary.total_ptp_sms > 0 && <Tag color="orange">PTP: {record.summary.total_ptp_sms}</Tag>}
          {record.summary.total_paid_sms > 0 && <Tag color="green">PAID: {record.summary.total_paid_sms}</Tag>}
          {record.summary.total_paynow_sms > 0 && <Tag color="cyan">PAYNOW: {record.summary.total_paynow_sms}</Tag>}
          {record.summary.total_sms_count === 0 && <Tag color="default">No SMS</Tag>}
        </Space>
      ),
    },
    {
      title: 'Cost (₹)',
      key: 'cost',
      render: (_: any, record: DailyReport) => (
        <div>
          <span style={{ fontWeight: '600', color: '#52c41a' }}>
            ₹{record.total_cost.toFixed(2)}
          </span>
          {record.total_production_cost > 0 && (
            <>
              <br />
              <small style={{ color: '#666' }}>Prod: ₹{record.total_production_cost.toFixed(2)}</small>
            </>
          )}
          {record.total_test_cost > 0 && (
            <>
              <br />
              <small style={{ color: '#faad14' }}>Test: ₹{record.total_test_cost.toFixed(2)}</small>
            </>
          )}
        </div>
      ),
      sorter: (a: DailyReport, b: DailyReport) => a.total_cost - b.total_cost,
    },
    {
      title: 'Datasheets',
      key: 'datasheets',
      render: (_: any, record: DailyReport) => (
        <span>
          {record.production_datasheet_ids.length + record.test_datasheet_ids.length}
        </span>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (value: string) => dayjs(value).format('DD MMM YYYY HH:mm'),
    },
  ];

  const monthlySummary = dailyData?.monthly_summary;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#263978', marginBottom: '8px' }}>
            SMS Billing Dashboard
          </h1>
          <p style={{ color: '#666' }}>
            Generate and view daily billing records for SMS costs
          </p>
        </div>

        {/* Filters */}
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
                onClick={calculateMonthlyBilling}
                loading={calculatingBilling}
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
        ) : dailyData && dailyData.daily_reports && dailyData.daily_reports.length > 0 ? (
          <>
            {/* Monthly Summary Stats */}
            {monthlySummary && (
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                    <Statistic
                      title="Total Documents"
                      value={monthlySummary.total_documents}
                      prefix={<FileTextOutlined style={{ color: '#263978' }} />}
                      valueStyle={{ color: '#263978' }}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      Prod: {monthlySummary.total_production_documents.toLocaleString()} | Test: {monthlySummary.total_test_documents.toLocaleString()}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                    <Statistic
                      title="Total SMS"
                      value={monthlySummary.summary.total_sms_count}
                      prefix={<MessageOutlined style={{ color: '#263978' }} />}
                      valueStyle={{ color: '#263978' }}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      Units: {monthlySummary.summary.total_sms_units.toLocaleString()}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                    <Statistic
                      title="Total Cost"
                      value={monthlySummary.total_cost}
                      prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                      suffix="₹"
                      precision={2}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      Prod: ₹{monthlySummary.total_production_cost.toFixed(2)} | Test: ₹{monthlySummary.total_test_cost.toFixed(2)}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                    <Statistic
                      title="Days in Month"
                      value={monthlySummary.total_days}
                      prefix={<CalendarOutlined style={{ color: '#263978' }} />}
                      valueStyle={{ color: '#263978' }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* SMS Breakdown Summary */}
            {monthlySummary && (
              <Card style={{ marginBottom: '24px', borderColor: 'rgba(38, 57, 120, 0.2)' }}>
                <h3 style={{ marginBottom: '16px', color: '#263978' }}>SMS Breakdown - {getMonthName(filters.month)} {filters.year}</h3>
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="BOD SMS"
                      value={monthlySummary.summary.total_bod_sms}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="EOD SMS"
                      value={monthlySummary.summary.total_eod_sms}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="PTP SMS"
                      value={monthlySummary.summary.total_ptp_sms}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="PAID SMS"
                      value={monthlySummary.summary.total_paid_sms}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="PAYNOW SMS"
                      value={monthlySummary.summary.total_paynow_sms}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            {/* Daily Records Table */}
            <Card
              title={
                <span>
                  Daily SMS Billing Records - {getMonthName(filters.month)} {filters.year}
                </span>
              }
              style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}
            >
              <Table
                columns={dailyColumns}
                dataSource={dailyData.daily_reports}
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
                  No SMS billing records found for {getMonthName(filters.month)} {filters.year}.
                  <br />
                  <small style={{ color: '#666' }}>
                    Click &quot;Generate Billing&quot; to Generate SMS billing for this month.
                  </small>
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default SMSBillingDashboard;
