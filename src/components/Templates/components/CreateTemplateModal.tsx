// CreateTemplateModal Component

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Row,
  Col,
  message,
} from 'antd';
import { TemplateCreatePayload, DEFAULT_TEMPLATE } from '../types';
import { validateTemplateName, sanitizeTemplateName } from '../utils';

interface CreateTemplateModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreate: (payload: TemplateCreatePayload) => Promise<unknown>;
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

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  open,
  loading,
  onClose,
  onCreate,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate template name
      const nameError = validateTemplateName(values.name);
      if (nameError) {
        message.error(nameError);
        return;
      }

      setSubmitting(true);

      const payload: TemplateCreatePayload = {
        name: values.name.trim(),
        default_phone_column: values.default_phone_column || 'MOBILE_NO',
        sms: values.sms || false,
        whatsapp: values.whatsapp || false,
        stt_services: values.stt_services || 'azure',
        tts_services: values.tts_services || 'cartesia',
        llm_services: values.llm_services || 'bedrock',
        format_values: [],
        format_values_mapping_methods: {},
        dynamic: {
          active: false,
          column: '',
          mapping: {},
        },
      };

      const result = await onCreate(payload);

      if (result) {
        form.resetFields();
        onClose();
      }
    } catch (error) {
      // Form validation failed
      console.error('Form validation failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Create New Template"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting || loading}
      okText="Create"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          default_phone_column: DEFAULT_TEMPLATE.default_phone_column,
          sms: DEFAULT_TEMPLATE.sms,
          whatsapp: DEFAULT_TEMPLATE.whatsapp,
          stt_services: DEFAULT_TEMPLATE.stt_services,
          tts_services: DEFAULT_TEMPLATE.tts_services,
          llm_services: DEFAULT_TEMPLATE.llm_services,
        }}
      >
        <Form.Item
          name="name"
          label="Template Name"
          rules={[
            { required: true, message: 'Please enter a template name' },
            { min: 2, message: 'Name must be at least 2 characters' },
            {
              pattern: /^[a-zA-Z0-9_]+$/,
              message: 'Only letters, numbers, and underscores allowed',
            },
          ]}
          extra="Only letters, numbers, and underscores allowed (no spaces)"
        >
          <Input
            placeholder="Enter template name (e.g., default, campaign_v1)"
            onChange={(e) => {
              const sanitized = sanitizeTemplateName(e.target.value);
              form.setFieldValue('name', sanitized);
            }}
          />
        </Form.Item>

        <Form.Item
          name="default_phone_column"
          label="Default Phone Column"
        >
          <Input placeholder="e.g., MOBILE_NO" />
        </Form.Item>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="sms" label="SMS Enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="whatsapp"
              label="WhatsApp Enabled"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item name="stt_services" label="STT Service">
              <Select options={STT_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="tts_services" label="TTS Service">
              <Select options={TTS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="llm_services" label="LLM Service">
              <Select options={LLM_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateTemplateModal;
