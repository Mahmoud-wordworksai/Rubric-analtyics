/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_BASE_URL, API_KEY } from "@/constants";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Spin,
  Typography,
  Popconfirm,
  Tag,
  Statistic,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { appendRoomParam } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;

interface PricingBand {
  duration_range: string;
  min_seconds: number;
  max_seconds: number;
  cost_per_call: number;
}

interface PricingTemplate {
  _id?: any;
  name?: string;
  call_pricing_structure: PricingBand[];
}

interface ApiResponse {
  status: string;
  message?: string;
  template?: PricingTemplate;
  call_pricing_structure?: PricingBand[];
  updated?: any;
  added?: any;
}

const PricingManager = () => {
  const searchParams = useSearchParams();
  const selectedRoom = searchParams.get('room') || 'main';
  const [pricingBands, setPricingBands] = useState<PricingBand[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBand, setEditingBand] = useState<PricingBand | null>(null);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [calculatorSeconds, setCalculatorSeconds] = useState<number>(0);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [form] = Form.useForm();

  // Helper function to build room parameter
  const getRoomParam = useCallback(() => selectedRoom && selectedRoom !== 'main' ? `&room=${selectedRoom}` : '', [selectedRoom]);

  const fetchPricingStructure = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/pricing-structure?api_key=${API_KEY}${getRoomParam()}`)
      );
      const result: ApiResponse = response.data;

      if (result.status === 'success' && result.call_pricing_structure) {
        setPricingBands(result.call_pricing_structure);
        // message.success('Pricing structure loaded successfully');
      } else {
        // message.error(result.message || 'Failed to load pricing structure');
      }
    } catch (error) {
      // message.error('Error fetching pricing structure');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [getRoomParam]);

  // Fetch pricing structure on mount
  useEffect(() => {
    fetchPricingStructure();
  }, [fetchPricingStructure]);

  const updatePricingStructure = async (structure: PricingBand[]) => {
    setLoading(true);
    try {
      const response = await axiosInstance.put(
        appendRoomParam(`${API_BASE_URL}/pricing-structure?api_key=${API_KEY}${getRoomParam()}`),
        structure
      );
      const result: ApiResponse = response.data;

      if (result.status === 'success') {
        // message.success('Pricing structure updated successfully');
        fetchPricingStructure();
        return true;
      } else {
        // message.error(result.message || 'Failed to update pricing structure');
        return false;
      }
    } catch (error) {
      // message.error('Error updating pricing structure');
      console.error('Error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addPricingBand = async (band: PricingBand) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        appendRoomParam(`${API_BASE_URL}/pricing-bands?api_key=${API_KEY}${getRoomParam()}`),
        band
      );
      const result: ApiResponse = response.data;

      if (result.status === 'success') {
        // message.success('Pricing band added successfully');
        fetchPricingStructure();
        return true;
      } else {
        // message.error(result.message || 'Failed to add pricing band');
        return false;
      }
    } catch (error) {
      // message.error('Error adding pricing band');
      console.error('Error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = async (seconds: number) => {
    try {
      const response = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/pricing/cost?seconds=${seconds}&api_key=${API_KEY}${getRoomParam()}`)
      );
      const result: any = response.data;

      if (result.status === 'success') {
        setCalculatedCost(result.cost_per_call);
        // message.success(`Cost calculated: ₹${result.cost_per_call}`);
      } else {
        // message.error(result.message || 'Failed to calculate cost');
      }
    } catch (error) {
      // message.error('Error calculating cost');
      console.error('Error:', error);
    }
  };

  const handleAddNew = () => {
    setEditingBand(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (band: PricingBand) => {
    setEditingBand(band);
    form.setFieldsValue(band);
    setModalVisible(true);
  };

  const handleDelete = (band: PricingBand) => {
    const newStructure = pricingBands.filter(
      (b) =>
        b.min_seconds !== band.min_seconds || b.max_seconds !== band.max_seconds
    );
    updatePricingStructure(newStructure);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newBand: PricingBand = {
        duration_range: values.duration_range || `${values.min_seconds}-${values.max_seconds} Sec`,
        min_seconds: values.min_seconds,
        max_seconds: values.max_seconds,
        cost_per_call: values.cost_per_call,
      };

      if (editingBand) {
        // Update existing band
        const newStructure = pricingBands.map((b) =>
          b.min_seconds === editingBand.min_seconds &&
          b.max_seconds === editingBand.max_seconds
            ? newBand
            : b
        );
        const success = await updatePricingStructure(newStructure);
        if (success) {
          setModalVisible(false);
          form.resetFields();
        }
      } else {
        // Add new band
        const success = await addPricingBand(newBand);
        if (success) {
          setModalVisible(false);
          form.resetFields();
        }
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleCalculatorOk = () => {
    if (calculatorSeconds > 0) {
      calculateCost(calculatorSeconds);
    } else {
      message.warning('Please enter a valid number of seconds');
    }
  };

  const columns = [
    {
      title: 'Duration Range',
      dataIndex: 'duration_range',
      key: 'duration_range',
      render: (text: string) => <Tag color="#263978">{text}</Tag>,
    },
    {
      title: 'Min Seconds',
      dataIndex: 'min_seconds',
      key: 'min_seconds',
      sorter: (a: PricingBand, b: PricingBand) => a.min_seconds - b.min_seconds,
    },
    {
      title: 'Max Seconds',
      dataIndex: 'max_seconds',
      key: 'max_seconds',
      sorter: (a: PricingBand, b: PricingBand) => a.max_seconds - b.max_seconds,
    },
    {
      title: 'Cost per Call (₹)',
      dataIndex: 'cost_per_call',
      key: 'cost_per_call',
      render: (cost: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ₹{cost.toFixed(2)}
        </Text>
      ),
      sorter: (a: PricingBand, b: PricingBand) => a.cost_per_call - b.cost_per_call,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PricingBand) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this pricing band?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getStatistics = () => {
    if (pricingBands.length === 0) {
      return { total: 0, minCost: 0, maxCost: 0, avgCost: 0 };
    }

    const costs = pricingBands.map((b) => b.cost_per_call);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;

    return {
      total: pricingBands.length,
      minCost,
      maxCost,
      avgCost,
    };
  };

  const stats = getStatistics();

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#263978', marginBottom: '8px' }}>
            Pricing Management
          </Title>
          <Text type="secondary">
            Manage call pricing structure and pricing bands
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Pricing Bands"
                value={stats.total}
                prefix={<ClockCircleOutlined style={{ color: '#263978' }} />}
                valueStyle={{ color: '#263978' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Min Cost"
                value={stats.minCost}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Max Cost"
                value={stats.maxCost}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Cost"
                value={stats.avgCost}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Card style={{ marginBottom: '24px' }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              style={{ backgroundColor: '#263978', borderColor: '#263978' }}
            >
              Add New Pricing Band
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchPricingStructure}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              icon={<CalculatorOutlined />}
              onClick={() => {
                setCalculatorVisible(true);
                setCalculatedCost(null);
              }}
            >
              Cost Calculator
            </Button>
          </Space>
        </Card>

        {/* Pricing Bands Table */}
        <Card title="Pricing Bands" style={{ borderColor: 'rgba(38, 57, 120, 0.2)' }}>
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={pricingBands}
              rowKey={(record) => `${record.min_seconds}-${record.max_seconds}`}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 800 }}
            />
          </Spin>
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          title={editingBand ? 'Edit Pricing Band' : 'Add New Pricing Band'}
          open={modalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText={editingBand ? 'Update' : 'Add'}
          okButtonProps={{
            icon: <SaveOutlined />,
            style: { backgroundColor: '#263978', borderColor: '#263978' },
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="duration_range"
              label="Duration Range"
              rules={[
                { required: true, message: 'Please enter duration range' },
              ]}
            >
              <Input placeholder="e.g., 0-7 Sec" />
            </Form.Item>

            <Form.Item
              name="min_seconds"
              label="Min Seconds"
              rules={[
                { required: true, message: 'Please enter min seconds' },
                { type: 'number', min: 0, message: 'Must be >= 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter minimum seconds"
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="max_seconds"
              label="Max Seconds"
              rules={[
                { required: true, message: 'Please enter max seconds' },
                { type: 'number', min: 0, message: 'Must be >= 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter maximum seconds"
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="cost_per_call"
              label="Cost per Call (₹)"
              rules={[
                { required: true, message: 'Please enter cost per call' },
                { type: 'number', min: 0, message: 'Must be >= 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter cost per call"
                min={0}
                step={0.01}
                precision={2}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Cost Calculator Modal */}
        <Modal
          title="Cost Calculator"
          open={calculatorVisible}
          onOk={handleCalculatorOk}
          onCancel={() => {
            setCalculatorVisible(false);
            setCalculatorSeconds(0);
            setCalculatedCost(null);
          }}
          okText="Calculate"
          okButtonProps={{
            icon: <CalculatorOutlined />,
            style: { backgroundColor: '#263978', borderColor: '#263978' },
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Enter Duration (seconds):</Text>
              <InputNumber
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Enter seconds"
                min={0}
                value={calculatorSeconds}
                onChange={(value) => setCalculatorSeconds(value || 0)}
              />
            </div>

            {calculatedCost !== null && (
              <>
                <Divider />
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">Calculated Cost</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text
                      strong
                      style={{ fontSize: '32px', color: '#52c41a' }}
                    >
                      ₹{calculatedCost.toFixed(2)}
                    </Text>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary">
                      for {calculatorSeconds} seconds
                    </Text>
                  </div>
                </div>
              </>
            )}
          </Space>
        </Modal>
      </div>
    </div>
  );
};

export default PricingManager;
