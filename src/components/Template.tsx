"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from '@/hooks/useRoomAPI';
import axiosInstance from '@/lib/axios';
import { 
  Card, 
  Button, 
  Input, 
  Space, 
  Typography, 
  message, 
  Spin, 
  Alert,
  Row,
  Col,
  Collapse,
  Badge,
  Switch,
  Form,
  Select,
  Divider,
  Tag,
  Tooltip
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  DatabaseOutlined,
  SettingOutlined,
  MessageOutlined,
  BranchesOutlined,
  ExperimentOutlined,
  CodeOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  FormOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Option } = Select;

interface TemplateConfig {
  _id: { $oid: string };
  name: string;
  from_number: string;
  format_values: string[];
  prompts: Record<string, string>;
  dynamic_fields: Record<string, any>;
  conversation_examples: Record<string, any>;
  response_adaptation_matrix: Record<string, any>;
  forbidden_patterns: string[];
  success_patterns: string[];
  provider: string;
  stt_service: string;
  tts_service: string;
  llm_service: string;
}

const JSONSectionEditor: React.FC = () => {
  const { appendRoomParam, selectedRoom } = useRoomAPI();
  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('app-template');
  const [editingSections, setEditingSections] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<Record<string, 'json' | 'form'>>({});
  const [form] = Form.useForm();

  const baseUrl = API_BASE_URL;

  // Initialize edit modes
  const initializeEditModes = () => {
    const modes: Record<string, 'json' | 'form'> = {};
    const sections = ['basic', 'format_values', 'prompts', 'dynamic_fields', 'conversation_examples', 'response_adaptation_matrix', 'patterns'];
    sections.forEach(section => {
      modes[section] = 'form'; // Default to form mode
    });
    setEditMode(modes);
  };

  // Toggle edit mode for a section
  const toggleEditMode = (sectionKey: string) => {
    setEditMode(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey] === 'json' ? 'form' : 'json'
    }));
  };

  // Load template data
  const loadTemplate = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(appendRoomParam(`${baseUrl}/templates/${templateName}`));
      const data = response.data;
      const template = data.template;
      setConfig(template);
      initializeEditingSections(template);
      initializeEditModes();
      populateForm(template);
      message.success('Template loaded successfully');
    } catch (error) {
      message.error('Failed to load template');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Populate form with template data
  const populateForm = (template: TemplateConfig) => {
    form.setFieldsValue({
      name: template.name,
      from_number: template.from_number,
      provider: template.provider,
      stt_service: template.stt_service,
      tts_service: template.tts_service,
      llm_service: template.llm_service,
      format_values: template.format_values,
      forbidden_patterns: template.forbidden_patterns,
      success_patterns: template.success_patterns,
      ...template.prompts,
      ...template.dynamic_fields
    });
  };

  // Initialize editing sections with current data
  const initializeEditingSections = (template: TemplateConfig) => {
    const sections: Record<string, string> = {};
    
    sections.basic = JSON.stringify({
      _id: template._id,
      name: template.name,
      from_number: template.from_number,
      provider: template.provider,
      stt_service: template.stt_service,
      tts_service: template.tts_service,
      llm_service: template.llm_service
    }, null, 2);

    sections.format_values = JSON.stringify(template.format_values, null, 2);
    sections.prompts = JSON.stringify(template.prompts, null, 2);
    sections.dynamic_fields = JSON.stringify(template.dynamic_fields, null, 2);
    sections.conversation_examples = JSON.stringify(template.conversation_examples, null, 2);
    sections.response_adaptation_matrix = JSON.stringify(template.response_adaptation_matrix, null, 2);
    
    sections.patterns = JSON.stringify({
      forbidden_patterns: template.forbidden_patterns,
      success_patterns: template.success_patterns
    }, null, 2);

    setEditingSections(sections);
  };

  // Validate JSON
  const validateJSON = (key: string, value: string): boolean => {
    try {
      JSON.parse(value);
      setErrors(prev => ({ ...prev, [key]: '' }));
      return true;
    } catch (error) {
      setErrors(prev => ({ ...prev, [key]: 'Invalid JSON syntax' }));
      return false;
    }
  };

  // Update section
  const updateSection = (key: string, value: string) => {
    setEditingSections(prev => ({ ...prev, [key]: value }));
    validateJSON(key, value);
  };

  // Render form fields for each section
  const renderFormFields = (sectionKey: string) => {
    if (!config) return null;

    switch (sectionKey) {
      case 'basic':
        return (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="from_number" label="From Number" rules={[{ required: true }]}>
                  <Input placeholder="Enter From number" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 'format_values':
        return (
          <Form.Item name="format_values" label="Format Values">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Add format values"
              tokenSeparators={[',']}
            />
          </Form.Item>
        );

      case 'prompts':
        return (
          <div className="space-y-4">
            {Object.keys(config.prompts || {}).map((promptKey) => (
              <Form.Item key={promptKey} name={promptKey} label={`${promptKey} Prompt`}>
                <TextArea rows={4} placeholder={`Enter ${promptKey} prompt`} />
              </Form.Item>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} block>
              Add New Prompt
            </Button>
          </div>
        );

      case 'patterns':
        return (
          <div className="space-y-4">
            <Form.Item name="forbidden_patterns" label="Forbidden Patterns">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add forbidden patterns"
                tokenSeparators={[',']}
              />
            </Form.Item>
            <Form.Item name="success_patterns" label="Success Patterns">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add success patterns"
                tokenSeparators={[',']}
              />
            </Form.Item>
          </div>
        );

      case 'dynamic_fields':
        return (
          <div className="space-y-4">
            {Object.keys(config.dynamic_fields || {}).map((fieldKey) => (
              <Card key={fieldKey} size="small" title={fieldKey} extra={
                <Button size="small" danger icon={<DeleteOutlined />} />
              }>
                <Form.Item name={fieldKey} label="Default Value">
                  <Input placeholder={`Enter default value for ${fieldKey}`} />
                </Form.Item>
              </Card>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} block>
              Add Dynamic Field
            </Button>
          </div>
        );

      default:
        return (
          <Alert
            message="Form editing not available"
            description="This section can only be edited in JSON mode due to its complex structure."
            type="info"
          />
        );
    }
  };

  // Save a specific section using PATCH API - only sends changed fields
  const patchSection = async (sectionKey: string, updateData: Record<string, any>): Promise<boolean> => {
    try {
      const response = await axiosInstance.patch(appendRoomParam(`${baseUrl}/templates/${templateName}`), { update_data: updateData });

      // Update local state instead of reloading
      setConfig(prev => prev ? { ...prev, ...updateData } : null);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // Save template data - only updates from_number using PATCH
  const saveTemplate = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const formValues = form.getFieldsValue();

      // Only check and update from_number
      if (formValues.from_number === config.from_number) {
        message.info('No changes detected');
        setSaving(false);
        return;
      }

      const changedFields = { from_number: formValues.from_number };

      console.log('Patching template with:', changedFields);

      const response = await axiosInstance.patch(appendRoomParam(`${baseUrl}/templates/${templateName}`), { update_data: changedFields });

      // Update local state with changed field (no full reload)
      setConfig(prev => prev ? { ...prev, ...changedFields } : null);
      message.success('Template saved successfully');
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Failed to save template: ${error.message}`);
      } else {
        message.error('Failed to save template');
      }
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, [templateName, selectedRoom]);

  const sections = [
    {
      key: 'basic',
      title: 'Basic Configuration',
      icon: <SettingOutlined />,
      description: 'Template identity, phone number, and service providers',
      color: '#1890ff',
      formSupported: true
    }
  ];

  const getSectionStats = (key: string) => {
    try {
      const data = JSON.parse(editingSections[key] || '{}');
      let count = 0;
      let hasContent = false;

      switch (key) {
        case 'basic':
          count = Object.keys(data).length;
          hasContent = data.name && data.from_number;
          break;
        case 'format_values':
          count = Array.isArray(data) ? data.length : 0;
          hasContent = count > 0;
          break;
        case 'prompts':
          count = Object.keys(data).length;
          hasContent = Object.values(data).some(v => v);
          break;
        case 'dynamic_fields':
          count = Object.keys(data).length;
          hasContent = count > 0;
          break;
        case 'conversation_examples':
          count = Object.keys(data.interruption_scenarios || {}).length;
          hasContent = count > 0;
          break;
        case 'response_adaptation_matrix':
          count = Object.keys(data).length;
          hasContent = count > 0;
          break;
        case 'patterns':
          count = (data.forbidden_patterns?.length || 0) + (data.success_patterns?.length || 0);
          hasContent = count > 0;
          break;
      }

      return { count, hasContent };
    } catch {
      return { count: 0, hasContent: false };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="mb-0" style={{ color: '#263978' }}>
              Settings
            </Title>
            <Text type="secondary">Edit templates using form interface or JSON editor</Text>
          </div>
          
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadTemplate} disabled={loading}>
              Reload
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={saveTemplate}
              loading={saving}
              style={{ backgroundColor: '#263978' }}
            >
              Save All Changes
            </Button>
          </Space>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Form form={form} layout="vertical">
          <Collapse 
            defaultActiveKey={['basic']} 
            size="large"
            expandIconPosition="end"
          >
            {sections.map(section => {
              const stats = getSectionStats(section.key);
              const hasError = errors[section.key];
              const currentMode = editMode[section.key] || 'form';
              
              return (
                <Panel
                  key={section.key}
                  header={
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center space-x-3">
                        <div style={{ color: section.color }}>
                          {section.icon}
                        </div>
                        <div>
                          <Text strong style={{ color: '#263978' }}>
                            {section.title}
                          </Text>
                          <div className="flex items-center space-x-2">
                            <Text type="secondary" className="text-sm">
                              {section.description}
                            </Text>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {stats.hasContent ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                        )}
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {/* Form Content */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      {renderFormFields(section.key)}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </Collapse>
        </Form>

        {/* Save reminder */}
        <div className="mt-6 text-center">
          <Alert
            message="Remember to save your changes"
            description="Click 'Save All Changes' to apply modifications to the template. Both form and JSON changes will be saved together."
            type="warning"
            showIcon
            action={
              <Button 
                type="primary" 
                size="small"
                onClick={saveTemplate}
                loading={saving}
                style={{ backgroundColor: '#263978' }}
              >
                Save Now
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default JSONSectionEditor;