// TemplatesList Component - 30% sidebar view

import React, { useState } from 'react';
import {
  List,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
  Spin,
  Empty,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Template } from '../types';
import { formatDate } from '../utils';

const { Text, Title } = Typography;

interface TemplatesListProps {
  templates: Template[];
  selectedTemplate: Template | null;
  loading: boolean;
  hasUnsavedChanges: boolean;
  onSelect: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
}

const TemplatesList: React.FC<TemplatesListProps> = ({
  templates,
  selectedTemplate,
  loading,
  hasUnsavedChanges,
  onSelect,
  onDelete,
  onCreate,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectTemplate = (template: Template) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to switch templates?'
      );
      if (!confirmed) return;
    }
    onSelect(template);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Templates
          </Title>
          <Space>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={onRefresh}
                loading={loading}
              />
            </Tooltip>
            <Tooltip title="Create Template">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={onCreate}
              >
                New
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* Search */}
        <Input
          placeholder="Search templates..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          size="small"
        />
      </div>

      {/* Templates List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {loading && templates.length === 0 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}
          >
            <Spin tip="Loading templates..." />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchTerm ? 'No templates match your search' : 'No templates found'
            }
          />
        ) : (
          <List
            dataSource={filteredTemplates}
            renderItem={(template) => {
              const isSelected = selectedTemplate?._id === template._id;

              return (
                <List.Item
                  key={template._id}
                  onClick={() => handleSelectTemplate(template)}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? '#e6f7ff' : 'transparent',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    padding: '12px',
                    border: isSelected ? '1px solid #1890ff' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="Delete Template"
                      description="Are you sure you want to delete this template?"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        onDelete(template._id!);
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge
                        dot={isSelected && hasUnsavedChanges}
                        offset={[-2, 2]}
                        color="orange"
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            background: isSelected ? '#1890ff' : '#f0f0f0',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FileTextOutlined
                            style={{
                              fontSize: '18px',
                              color: isSelected ? '#fff' : '#666',
                            }}
                          />
                        </div>
                      </Badge>
                    }
                    title={
                      <Space size={4}>
                        <Text
                          strong
                          style={{
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'inline-block',
                          }}
                        >
                          {template.name}
                        </Text>
                        {isSelected && (
                          <CheckCircleOutlined
                            style={{ color: '#1890ff', fontSize: '12px' }}
                          />
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space size={4} wrap>
                          {template.sms && (
                            <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>
                              SMS
                            </Tag>
                          )}
                          {template.whatsapp && (
                            <Tag color="green" style={{ fontSize: '10px', margin: 0 }}>
                              WhatsApp
                            </Tag>
                          )}
                          {template.dynamic?.active && (
                            <Tag color="purple" style={{ fontSize: '10px', margin: 0 }}>
                              Dynamic
                            </Tag>
                          )}
                        </Space>
                        <Text
                          type="secondary"
                          style={{ fontSize: '11px' }}
                        >
                          {formatDate(template.updated_at || template.created_at)}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>

      {/* Footer Stats */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
        }}
      >
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {filteredTemplates.length} of {templates.length} templates
        </Text>
      </div>
    </div>
  );
};

export default TemplatesList;
