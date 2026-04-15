// TemplateDetail Component - 80% main view

import React, { useState } from 'react';
import {
  Form,
  Input,
  Switch,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Tabs,
  Tag,
  Spin,
  Alert,
  Badge,
  Tooltip,
  Table,
  Card,
  Row,
  Col,
  Modal,
} from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  CloseOutlined,
  SettingOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  FileTextOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  EditOutlined,
} from '@ant-design/icons';

const { Option } = Select;
import { Template, DynamicMapping } from '../types';
import { formatDate, sanitizeTemplateName } from '../utils';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FieldWrapperProps {
  name: string;
  children: React.ReactNode;
  label: string;
  tooltip?: string;
  changedFields: Record<string, unknown>;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  name,
  children,
  label,
  tooltip,
  changedFields,
}) => {
  const isChanged = name in changedFields;
  return (
    <Form.Item
      label={
        <Space>
          {label}
          {tooltip && (
            <Tooltip title={tooltip}>
              <InfoCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          )}
          {isChanged && (
            <Badge status="warning" text="Modified" style={{ fontSize: '11px' }} />
          )}
        </Space>
      }
    >
      {children}
    </Form.Item>
  );
};

interface TemplateDetailProps {
  template: Template;
  originalTemplate: Template | null;
  loading: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  changedFields: Record<string, unknown>;
  onUpdate: (updates: Partial<Template>) => void;
  onUpdateNested: (path: string, value: unknown) => void;
  onSave: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

const STT_OPTIONS = [
  { value: 'azure', label: 'Azure' },
  { value: 'google', label: 'Google' },
  { value: 'aws', label: 'AWS' },
  { value: 'deepgram', label: 'Deepgram' },
];

const TTS_OPTIONS = [
  { value: 'cartesia', label: 'Cartesia' },
  { value: 'azure', label: 'Azure' },
  { value: 'google', label: 'Google' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
];

const LLM_OPTIONS = [
  { value: 'bedrock', label: 'AWS Bedrock' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure', label: 'Azure OpenAI' },
];

/**
 * Format field key to readable label
 * e.g., "tts_model_id" -> "TTS Model Id"
 */
const formatFieldLabel = (key: string): string => {
  // Special abbreviations to keep uppercase
  const abbreviations = ['tts', 'stt', 'llm', 'id', 'sms', 'url', 'api'];

  return key
    .split('_')
    .map((word) => {
      const lower = word.toLowerCase();
      if (abbreviations.includes(lower)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Available processing methods for format values
const PROCESSING_METHODS: Record<string, string[]> = {
  'expand_product_abbreviation': [''],
  'format_amount_to_english_words': ['english', 'hindi', 'kannada', 'telugu', 'tamil', 'marathi', 'odia', 'malayalam', 'gujarati'],
  'format_date_to_words': ['english', 'hindi', 'kannada', 'telugu', 'tamil', 'marathi', 'odia', 'malayalam', 'gujarati'],
  'get_last_four_digits_as_words': ['english', 'hindi', 'kannada', 'telugu', 'tamil', 'marathi', 'odia', 'malayalam', 'gujarati'],
  'convert_digits_to_words': ['english', 'hindi', 'kannada', 'telugu', 'tamil', 'marathi', 'odia', 'malayalam', 'gujarati'],
  'to_lowercase': ['']
};

const TemplateDetail: React.FC<TemplateDetailProps> = ({
  template,
  originalTemplate,
  loading,
  saving,
  hasUnsavedChanges,
  changedFields,
  onUpdate,
  onUpdateNested,
  onSave,
  onDiscard,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('general');

  // Format Values Modal States
  const [isAddFormatValueModalVisible, setIsAddFormatValueModalVisible] = useState(false);
  const [newFormatValue, setNewFormatValue] = useState('');

  // Processing Method Modal States
  const [isProcessingMethodModalVisible, setIsProcessingMethodModalVisible] = useState(false);
  const [selectedFormatValue, setSelectedFormatValue] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedMethodParam, setSelectedMethodParam] = useState('');

  // Format Values Management
  const handleAddFormatValue = () => {
    if (!newFormatValue.trim()) return;
    const newValues = [...(template.format_values || []), newFormatValue.trim()];
    onUpdate({ format_values: newValues });
    setNewFormatValue('');
    setIsAddFormatValueModalVisible(false);
  };

  const handleRemoveFormatValue = (value: string) => {
    const newValues = (template.format_values || []).filter(v => v !== value);
    // Also remove any associated processing method
    const newMappingMethods = { ...template.format_values_mapping_methods };
    delete newMappingMethods[value];
    onUpdate({
      format_values: newValues,
      format_values_mapping_methods: newMappingMethods
    });
  };

  // Processing Method Management
  const openProcessingMethodModal = (formatValue: string) => {
    setSelectedFormatValue(formatValue);
    const existingMethod = template.format_values_mapping_methods?.[formatValue];
    if (existingMethod && typeof existingMethod === 'object') {
      setSelectedMethod((existingMethod as { method: string; param: string }).method || '');
      setSelectedMethodParam((existingMethod as { method: string; param: string }).param || '');
    } else {
      setSelectedMethod('');
      setSelectedMethodParam('');
    }
    setIsProcessingMethodModalVisible(true);
  };

  const handleSaveProcessingMethod = () => {
    if (!selectedMethod) return;
    const newMappingMethods = {
      ...template.format_values_mapping_methods,
      [selectedFormatValue]: {
        method: selectedMethod,
        param: selectedMethodParam
      }
    };
    onUpdate({ format_values_mapping_methods: newMappingMethods });
    setIsProcessingMethodModalVisible(false);
    setSelectedFormatValue('');
    setSelectedMethod('');
    setSelectedMethodParam('');
  };

  const handleRemoveProcessingMethod = (formatValue: string) => {
    const newMappingMethods = { ...template.format_values_mapping_methods };
    delete newMappingMethods[formatValue];
    onUpdate({ format_values_mapping_methods: newMappingMethods });
  };

  // Dynamic Mapping Management - Track local edits before save
  const [dynamicMappingEdits, setDynamicMappingEdits] = useState<Record<string, string>>({});

  const handleAddDynamicMapping = () => {
    const newMapping: DynamicMapping = {
      ...(template.dynamic?.mapping || {}),
      '': '',
    };
    onUpdateNested('dynamic.mapping', newMapping);
  };

  const handleRemoveDynamicMapping = (key: string) => {
    const newMapping = { ...template.dynamic?.mapping };
    delete newMapping[key];
    // Clean up local edits
    const newEdits = { ...dynamicMappingEdits };
    delete newEdits[key];
    setDynamicMappingEdits(newEdits);
    onUpdateNested('dynamic.mapping', newMapping);
  };

  const handleUpdateDynamicMapping = (key: string, value: string) => {
    setDynamicMappingEdits(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveDynamicMapping = (key: string) => {
    const newMapping = {
      ...template.dynamic?.mapping,
      [key]: dynamicMappingEdits[key] ?? template.dynamic?.mapping?.[key],
    };
    // Clear local edit
    const newEdits = { ...dynamicMappingEdits };
    delete newEdits[key];
    setDynamicMappingEdits(newEdits);
    onUpdateNested('dynamic.mapping', newMapping);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Spin size="large" tip="Loading template..." />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined />
          General
        </span>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <FieldWrapper
            name="name"
            label="Template Name"
            changedFields={changedFields}
            tooltip="Only letters, numbers, and underscores allowed (no spaces)"
          >
            <Input
              value={template.name}
              onChange={(e) => {
                const sanitized = sanitizeTemplateName(e.target.value);
                onUpdate({ name: sanitized });
              }}
              placeholder="Enter template name (e.g., default, campaign_v1)"
            />
          </FieldWrapper>

          <FieldWrapper
            name="default_phone_column"
            label="Default Phone Column"
            tooltip="Column name for phone numbers in data"
            changedFields={changedFields}
          >
            <Input
              value={template.default_phone_column}
              onChange={(e) =>
                onUpdate({ default_phone_column: e.target.value })
              }
              placeholder="e.g., MOBILE_NO"
            />
          </FieldWrapper>

          <FieldWrapper name="sms" label="SMS Enabled" changedFields={changedFields}>
            <Switch
              checked={template.sms}
              onChange={(checked) => onUpdate({ sms: checked })}
            />
          </FieldWrapper>

          <FieldWrapper name="whatsapp" label="WhatsApp Enabled" changedFields={changedFields}>
            <Switch
              checked={template.whatsapp}
              onChange={(checked) => onUpdate({ whatsapp: checked })}
            />
          </FieldWrapper>
        </div>
      ),
    },
    {
      key: 'format_values',
      label: (
        <span>
          <DatabaseOutlined />
          Format Values
        </span>
      ),
      children: (() => {
        const formatValues = template.format_values || [];
        const mappingMethods = template.format_values_mapping_methods || {};

        const columns = [
          {
            title: 'Format Value',
            dataIndex: 'value',
            key: 'value',
            width: '30%',
            render: (text: string) => <Tag color="blue">{text}</Tag>
          },
          {
            title: 'Processing Method',
            key: 'method',
            width: '40%',
            render: (_: unknown, record: { value: string }) => {
              const method = mappingMethods[record.value];
              if (method && typeof method === 'object') {
                const methodObj = method as { method: string; param: string };
                return (
                  <Space>
                    <Tag color="green">{methodObj.method}</Tag>
                    {methodObj.param && <Tag color="orange">{methodObj.param}</Tag>}
                  </Space>
                );
              }
              return <Text type="secondary">No method configured</Text>;
            }
          },
          {
            title: 'Actions',
            key: 'actions',
            width: '30%',
            render: (_: unknown, record: { value: string }) => {
              const hasMethod = mappingMethods[record.value] && typeof mappingMethods[record.value] === 'object';
              return (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openProcessingMethodModal(record.value)}
                  >
                    {hasMethod ? 'Edit Method' : 'Add Method'}
                  </Button>
                  {hasMethod && (
                    <Button
                      size="small"
                      danger
                      onClick={() => handleRemoveProcessingMethod(record.value)}
                    >
                      Remove Method
                    </Button>
                  )}
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFormatValue(record.value)}
                  >
                    Delete
                  </Button>
                </Space>
              );
            }
          }
        ];

        const dataSource = formatValues.map(value => ({ key: value, value }));

        return (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>Format Values Configuration</Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddFormatValueModalVisible(true)}
              >
                Add Format Value
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              size="small"
              bordered
              locale={{ emptyText: 'No format values configured' }}
            />
            {(hasUnsavedChanges && ('format_values' in changedFields || 'format_values_mapping_methods' in changedFields)) && (
              <Alert
                type="info"
                showIcon
                style={{ marginTop: 16 }}
                message="Format values have been modified. Click 'Save Changes' to persist."
              />
            )}
          </div>
        );
      })(),
    },
    {
      key: 'services',
      label: (
        <span>
          <ApiOutlined />
          Services
        </span>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          {/* STT Group */}
          <Divider orientation="left">STT (Speech-to-Text)</Divider>

          <FieldWrapper
            name="stt_services"
            label="STT Service"
            tooltip="Speech-to-Text service provider"
            changedFields={changedFields}
          >
            <Select
              value={template.stt_services}
              onChange={(value) => onUpdate({ stt_services: value })}
              options={STT_OPTIONS}
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </FieldWrapper>

          <FieldWrapper
            name="stt_lan_code"
            label="STT Language Code"
            tooltip="Language code for speech recognition"
            changedFields={changedFields}
          >
            <Input
              value={String((template as Record<string, unknown>).stt_lan_code ?? '')}
              onChange={(e) => onUpdate({ stt_lan_code: e.target.value })}
              placeholder="e.g., en-US"
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </FieldWrapper>

          {/* TTS Group */}
          <Divider orientation="left">TTS (Text-to-Speech)</Divider>

          <FieldWrapper
            name="tts_services"
            label="TTS Service"
            tooltip="Text-to-Speech service provider"
            changedFields={changedFields}
          >
            <Select
              value={template.tts_services}
              onChange={(value) => onUpdate({ tts_services: value })}
              options={TTS_OPTIONS}
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </FieldWrapper>

          <FieldWrapper
            name="tts_lan_code"
            label="TTS Language Code"
            tooltip="Language code for speech synthesis"
            changedFields={changedFields}
          >
            <Input
              value={String((template as Record<string, unknown>).tts_lan_code ?? '')}
              onChange={(e) => onUpdate({ tts_lan_code: e.target.value })}
              placeholder="e.g., en-US"
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </FieldWrapper>

          <FieldWrapper
            name="tts_model_id"
            label="TTS Model ID"
            tooltip="Model identifier for TTS service"
            changedFields={changedFields}
          >
            <Input
              value={String((template as Record<string, unknown>).tts_model_id ?? '')}
              onChange={(e) => onUpdate({ tts_model_id: e.target.value })}
              placeholder="Enter TTS model ID"
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </FieldWrapper>

          <FieldWrapper
            name="tts_voice_id"
            label="TTS Voice ID"
            tooltip="Voice identifier for TTS service"
            changedFields={changedFields}
          >
            <Input
              value={String((template as Record<string, unknown>).tts_voice_id ?? '')}
              onChange={(e) => onUpdate({ tts_voice_id: e.target.value })}
              placeholder="Enter TTS voice ID"
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </FieldWrapper>

          {/* LLM Group */}
          <Divider orientation="left">LLM (Large Language Model)</Divider>

          <FieldWrapper
            name="llm_services"
            label="LLM Service"
            tooltip="Large Language Model provider"
            changedFields={changedFields}
          >
            <Select
              value={template.llm_services}
              onChange={(value) => onUpdate({ llm_services: value })}
              options={LLM_OPTIONS}
              style={{ width: '100%', maxWidth: '400px' }}
            />
          </FieldWrapper>

          <FieldWrapper
            name="analysis_llm_service"
            label="Analysis LLM Service"
            tooltip="LLM service used for call analysis"
            changedFields={changedFields}
          >
            <Select
              value={String((template as Record<string, unknown>).analysis_llm_service ?? '')}
              onChange={(value) => onUpdate({ analysis_llm_service: value })}
              options={LLM_OPTIONS}
              style={{ width: '100%', maxWidth: '400px' }}
              allowClear
              placeholder="Select analysis LLM service"
            />
          </FieldWrapper>
        </div>
      ),
    },
    {
      key: 'dynamic',
      label: (
        <span>
          <ThunderboltOutlined />
          Dynamic Config
        </span>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col span={6}>
                <Space>
                  <Text strong>Dynamic Mode Active</Text>
                  {('dynamic.active' in changedFields) && (
                    <Badge status="warning" text="Modified" style={{ fontSize: '11px' }} />
                  )}
                </Space>
              </Col>
              <Col span={18}>
                <Switch
                  checked={template.dynamic?.active}
                  onChange={(checked) =>
                    onUpdateNested('dynamic.active', checked)
                  }
                />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={[16, 16]} align="middle">
              <Col span={6}>
                <Space>
                  <Text strong>Dynamic Column</Text>
                  <Tooltip title="Column used for dynamic routing">
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                  {('dynamic.column' in changedFields) && (
                    <Badge status="warning" text="Modified" style={{ fontSize: '11px' }} />
                  )}
                </Space>
              </Col>
              <Col span={18}>
                <Input
                  value={template.dynamic?.column}
                  onChange={(e) =>
                    onUpdateNested('dynamic.column', e.target.value)
                  }
                  placeholder="e.g., STATE"
                  disabled={!template.dynamic?.active}
                  style={{ maxWidth: '400px' }}
                />
              </Col>
            </Row>
          </Card>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Title level={5} style={{ margin: 0 }}>Dynamic Mapping</Title>
              {('dynamic.mapping' in changedFields) && (
                <Badge status="warning" text="Modified" style={{ fontSize: '11px' }} />
              )}
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddDynamicMapping}
              disabled={!template.dynamic?.active}
            >
              Add Mapping
            </Button>
          </div>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {Object.entries(template.dynamic?.mapping || {}).map(
              ([key, value]) => (
                <Card key={key} size="small" type="inner">
                  <Row gutter={[16, 16]} align="middle">
                    <Col span={4}>
                      <Tag color="green">{key || '(empty key)'}</Tag>
                    </Col>
                    <Col span={14}>
                      <Input
                        value={dynamicMappingEdits[key] ?? (value as string)}
                        onChange={(e) => handleUpdateDynamicMapping(key, e.target.value)}
                        placeholder="Enter mapping value"
                        disabled={!template.dynamic?.active}
                      />
                    </Col>
                    <Col span={6}>
                      <Space>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={() => handleSaveDynamicMapping(key)}
                          disabled={!template.dynamic?.active || dynamicMappingEdits[key] === undefined}
                        >
                          Save
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveDynamicMapping(key)}
                          disabled={!template.dynamic?.active}
                        >
                          Delete
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              )
            )}
            {Object.keys(template.dynamic?.mapping || {}).length === 0 && (
              <Text type="secondary" style={{ fontStyle: 'italic' }}>
                No dynamic mappings configured
              </Text>
            )}
          </Space>
          {hasUnsavedChanges && 'dynamic.mapping' in changedFields && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message="Dynamic mappings have been modified. Click 'Save Changes' to persist."
            />
          )}
        </div>
      ),
    },
    {
      key: 'prompts',
      label: (
        <span>
          <MessageOutlined />
          Prompts
        </span>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <FieldWrapper
            name="greeting"
            label="Greeting"
            tooltip="Initial greeting message for the call"
            changedFields={changedFields}
          >
            <TextArea
              value={String((template as Record<string, unknown>).greeting ?? '')}
              onChange={(e) => onUpdate({ greeting: e.target.value })}
              rows={4}
              placeholder="Enter greeting message..."
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
          </FieldWrapper>

          <Divider />

          <FieldWrapper
            name="prompt"
            label="Prompt"
            tooltip="Main system prompt for the AI"
            changedFields={changedFields}
          >
            <TextArea
              value={String((template as Record<string, unknown>).prompt ?? '')}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              rows={12}
              placeholder="Enter system prompt..."
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
          </FieldWrapper>
        </div>
      ),
    },
    {
      key: 'analysis',
      label: (
        <span>
          <FileTextOutlined />
          Analysis Prompt
        </span>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <FieldWrapper
            name="analysis_prompt"
            label="Analysis Prompt"
            tooltip="Prompt used for call analysis"
            changedFields={changedFields}
          >
            <TextArea
              value={String((template as Record<string, unknown>).analysis_prompt ?? '')}
              onChange={(e) => onUpdate({ analysis_prompt: e.target.value })}
              rows={16}
              placeholder="Enter analysis prompt..."
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
          </FieldWrapper>
        </div>
      ),
    },
    {
      key: 'others',
      label: (
        <span>
          <SettingOutlined />
          Others
        </span>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          {/* Additional fields from API - keys are read-only labels, values are editable */}
          {(() => {
            // Fields handled in other tabs or internal fields
            const handledFields = [
              '_id',
              'name',
              'format_values',
              'format_values_mapping_methods',
              'dynamic',
              'default_phone_column',
              'sms',
              'whatsapp',
              'created_at',
              'updated_at',
              // Fields handled in Services tab
              'stt_services',
              'stt_lan_code',
              'tts_services',
              'tts_lan_code',
              'tts_model_id',
              'tts_voice_id',
              'llm_services',
              'analysis_llm_service',
              // Fields handled in Prompts tab
              'greeting',
              'prompt',
              // Fields handled in Analysis Prompt tab
              'analysis_prompt',
            ];

            // Get all additional fields not handled elsewhere
            const additionalFields = Object.entries(template).filter(
              ([key]) => !handledFields.includes(key)
            );

            if (additionalFields.length === 0) {
              return (
                <Text type="secondary" style={{ fontStyle: 'italic' }}>
                  No additional fields
                </Text>
              );
            }

            return (
              <div>
                {additionalFields.map(([key, value]) => {
                  // Get original value for proper type handling
                  const originalValue = originalTemplate ? (originalTemplate as Record<string, unknown>)[key] : value;

                  // Handler that preserves original type when value is cleared
                  const handleStringChange = (newValue: string) => {
                    // If empty and original was null/undefined, restore original
                    if (newValue === '' && (originalValue === null || originalValue === undefined)) {
                      onUpdate({ [key]: originalValue });
                    } else {
                      onUpdate({ [key]: newValue });
                    }
                  };

                  // Handler for number fields
                  const handleNumberChange = (newValue: string) => {
                    if (newValue === '') {
                      // If original was null/undefined/0, restore it
                      if (originalValue === null || originalValue === undefined) {
                        onUpdate({ [key]: originalValue });
                      } else {
                        onUpdate({ [key]: 0 });
                      }
                    } else {
                      onUpdate({ [key]: Number(newValue) || 0 });
                    }
                  };

                  return (
                    <FieldWrapper key={key} name={key} label={formatFieldLabel(key)} changedFields={changedFields}>
                      {typeof value === 'boolean' ? (
                        <Switch
                          checked={value}
                          onChange={(checked) => onUpdate({ [key]: checked })}
                        />
                      ) : typeof value === 'number' || typeof originalValue === 'number' ? (
                        <Input
                          type="number"
                          value={value as number ?? ''}
                          onChange={(e) => handleNumberChange(e.target.value)}
                          style={{ width: '100%', maxWidth: '400px' }}
                        />
                      ) : typeof value === 'object' && value !== null ? (
                        <TextArea
                          value={JSON.stringify(value, null, 2)}
                          onChange={(e) => {
                            try {
                              onUpdate({ [key]: JSON.parse(e.target.value) });
                            } catch {
                              // Invalid JSON, keep as string for now
                            }
                          }}
                          rows={4}
                          style={{ fontFamily: 'monospace', fontSize: '12px' }}
                        />
                      ) : (
                        <TextArea
                          value={String(value ?? '')}
                          onChange={(e) => handleStringChange(e.target.value)}
                          rows={typeof value === 'string' && value.length > 100 ? 4 : 1}
                          autoSize={{ minRows: 1, maxRows: 6 }}
                        />
                      )}
                    </FieldWrapper>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {template.name || 'Untitled Template'}
            </Title>
            {hasUnsavedChanges && (
              <Tag color="orange">Unsaved Changes</Tag>
            )}
          </Space>
          <Space>
            <Button
              icon={<UndoOutlined />}
              onClick={onDiscard}
              disabled={!hasUnsavedChanges || saving}
            >
              Discard
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={onSave}
              loading={saving}
              disabled={!hasUnsavedChanges}
            >
              Save Changes
            </Button>
            <Tooltip title="Close">
              <Button icon={<CloseOutlined />} onClick={onClose} />
            </Tooltip>
          </Space>
        </div>

        {/* Meta info */}
        <Space
          style={{ marginTop: '8px' }}
          split={<Divider type="vertical" />}
        >
          {template._id && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {template._id}
            </Text>
          )}
          {template.created_at && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Created: {formatDate(template.created_at)}
            </Text>
          )}
          {template.updated_at && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Updated: {formatDate(template.updated_at)}
            </Text>
          )}
        </Space>
      </div>

      {/* Changed Fields Alert */}
      {hasUnsavedChanges && Object.keys(changedFields).length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ margin: '16px 24px 0' }}
          message={
            <Space>
              <Text>Modified fields:</Text>
              {Object.keys(changedFields).map((field) => (
                <Tag key={field} color="blue">
                  {field}
                </Tag>
              ))}
            </Space>
          }
        />
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </div>

      {/* Add Format Value Modal */}
      <Modal
        title="Add Format Value"
        open={isAddFormatValueModalVisible}
        onOk={handleAddFormatValue}
        onCancel={() => {
          setIsAddFormatValueModalVisible(false);
          setNewFormatValue('');
        }}
        okText="Add"
        okButtonProps={{ disabled: !newFormatValue.trim() }}
      >
        <Form layout="vertical">
          <Form.Item label="Format Value Name" required>
            <Input
              value={newFormatValue}
              onChange={(e) => setNewFormatValue(e.target.value)}
              placeholder="e.g., ACCOUNT_NO, CUSTOMER_NAME"
            />
          </Form.Item>
          <Alert
            message="Format Value Info"
            description="This value represents a column name from your data that will be used for formatting in prompts and greetings."
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Processing Method Modal */}
      <Modal
        title={`Configure Processing Method for ${selectedFormatValue}`}
        open={isProcessingMethodModalVisible}
        onOk={handleSaveProcessingMethod}
        onCancel={() => {
          setIsProcessingMethodModalVisible(false);
          setSelectedFormatValue('');
          setSelectedMethod('');
          setSelectedMethodParam('');
        }}
        okText="Save"
        okButtonProps={{ disabled: !selectedMethod }}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Method" required>
            <Select
              value={selectedMethod}
              onChange={(value) => {
                setSelectedMethod(value);
                setSelectedMethodParam('');
              }}
              placeholder="Select processing method"
            >
              {Object.keys(PROCESSING_METHODS).map(method => (
                <Option key={method} value={method}>
                  {method}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedMethod && PROCESSING_METHODS[selectedMethod]?.length > 0 && PROCESSING_METHODS[selectedMethod][0] !== '' && (
            <Form.Item label="Parameter">
              <Select
                value={selectedMethodParam}
                onChange={setSelectedMethodParam}
                placeholder="Select parameter"
              >
                {PROCESSING_METHODS[selectedMethod].map(param => (
                  <Option key={param} value={param}>
                    {param}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Alert
            message="Processing Method Info"
            description={`This method will be applied to the ${selectedFormatValue} value before using it in prompts and greetings.`}
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateDetail;
