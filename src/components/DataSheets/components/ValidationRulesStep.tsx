/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Select, Button, Card, Tag, Typography, Space, Form, Input, InputNumber, Switch, Divider, Popconfirm, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ValidationMethod, ValidationRule, ColumnMapping } from '../types';

const { Text, Title } = Typography;

interface ValidationRulesStepProps {
  columnMapping: ColumnMapping;
  requiredColumns: string[];
  validationMethods: ValidationMethod[];
  validationRules: Record<string, ValidationRule[]>;
  onValidationRulesChange: (rules: Record<string, ValidationRule[]>) => void;
}

const ValidationRulesStep: React.FC<ValidationRulesStepProps> = ({
  columnMapping,
  requiredColumns,
  validationMethods,
  validationRules,
  onValidationRulesChange
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [methodParams, setMethodParams] = useState<Record<string, any>>({});

  // Get only the required columns that are mapped (target columns from mapping)
  const mappedRequiredColumns = requiredColumns.filter(reqCol =>
    Object.values(columnMapping).includes(reqCol)
  );

  const handleAddRule = () => {
    if (!selectedColumn || !selectedMethod) {
      return;
    }

    const method = validationMethods.find(m => m.method === selectedMethod);
    if (!method) return;

    const newRule: ValidationRule = {
      method: selectedMethod,
      params: Object.keys(methodParams).length > 0 ? methodParams : undefined
    };

    const updatedRules = { ...validationRules };
    if (!updatedRules[selectedColumn]) {
      updatedRules[selectedColumn] = [];
    }
    updatedRules[selectedColumn] = [...updatedRules[selectedColumn], newRule];

    onValidationRulesChange(updatedRules);

    // Reset form
    setSelectedMethod(null);
    setMethodParams({});
  };

  const handleRemoveRule = (column: string, ruleIndex: number) => {
    const updatedRules = { ...validationRules };
    updatedRules[column] = updatedRules[column].filter((_, idx) => idx !== ruleIndex);

    if (updatedRules[column].length === 0) {
      delete updatedRules[column];
    }

    onValidationRulesChange(updatedRules);
  };

  const handleParamChange = (paramName: string, value: any) => {
    setMethodParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const selectedMethodDetails = validationMethods.find(m => m.method === selectedMethod);

  const getMethodDescription = (methodName: string): string => {
    const method = validationMethods.find(m => m.method === methodName);
    return method?.description || methodName;
  };

  return (
    <div className="space-y-6">
      <div>
        <Title level={5} style={{ color: '#263878', marginBottom: '8px' }}>
          Configure Validation Rules (Optional)
        </Title>
        <Text type="secondary">
          Add validation and transformation rules for each required field. Rules are applied in the order they are added.
          You can skip this step if you don&apos;t need any validation or transformation.
        </Text>
      </div>

      {mappedRequiredColumns.length === 0 && (
        <Alert
          message="No Fields Mapped"
          description="Please complete the column mapping step first before configuring validation rules."
          type="info"
          showIcon
        />
      )}

      {mappedRequiredColumns.length > 0 && (
        <>
          <Card title="Add Validation Rule" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  Select Required Field
                </Text>
                <Select
                  placeholder="Choose a required field"
                  value={selectedColumn}
                  onChange={setSelectedColumn}
                  style={{ width: '100%' }}
                  showSearch
                  options={mappedRequiredColumns.map(col => ({
                    value: col,
                    label: col
                  }))}
                />
              </div>

              {selectedColumn && (
                <>
                  <div>
                    <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                      Select Validation Method
                    </Text>
                    <Select
                      placeholder="Choose a validation method"
                      value={selectedMethod}
                      onChange={(value) => {
                        setSelectedMethod(value);
                        setMethodParams({});
                      }}
                      style={{ width: '100%' }}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={validationMethods.map(method => ({
                        value: method.method,
                        label: `${method.method} - ${method.description}`
                      }))}
                    />
                  </div>

                  {selectedMethodDetails && selectedMethodDetails.parameters.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded">
                      <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '12px' }}>
                        Method Parameters
                      </Text>
                      <Form layout="vertical" size="small">
                        {selectedMethodDetails.parameters.map(param => (
                          <Form.Item
                            key={param.name}
                            label={
                              <span>
                                {param.name}
                                {param.required && <Text type="danger"> *</Text>}
                                {param.default !== undefined && (
                                  <Text type="secondary" style={{ fontSize: '11px' }}>
                                    {' '}(default: {JSON.stringify(param.default)})
                                  </Text>
                                )}
                              </span>
                            }
                            required={param.required}
                            style={{ marginBottom: '12px' }}
                          >
                            <div>
                              <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                                {param.description}
                              </Text>
                              {param.type === 'bool' ? (
                                <Switch
                                  checked={methodParams[param.name] ?? param.default ?? false}
                                  onChange={(checked) => handleParamChange(param.name, checked)}
                                />
                              ) : param.type === 'int' ? (
                                <InputNumber
                                  value={methodParams[param.name] ?? param.default}
                                  onChange={(value) => handleParamChange(param.name, value)}
                                  style={{ width: '100%' }}
                                  placeholder={`Enter ${param.name}`}
                                />
                              ) : (
                                <Input
                                  value={methodParams[param.name] ?? param.default ?? ''}
                                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                                  placeholder={`Enter ${param.name}`}
                                />
                              )}
                            </div>
                          </Form.Item>
                        ))}
                      </Form>
                    </div>
                  )}

                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddRule}
                    disabled={!selectedMethod}
                    style={{ backgroundColor: '#263878', borderColor: '#263878', color: '#fff' }}
                  >
                    Add Rule
                  </Button>
                </>
              )}
            </Space>
          </Card>

          <Divider />

          <div>
            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>
              Applied Validation Rules
            </Text>

            <div className="space-y-3">
              {mappedRequiredColumns.map(column => (
              <Card
                key={column}
                size="small"
                title={
                  <Space>
                    <Tag color="blue">{column}</Tag>
                    {validationRules[column] && (
                      <Tag color="green">{validationRules[column].length} rule(s)</Tag>
                    )}
                  </Space>
                }
              >
                {(!validationRules[column] || validationRules[column].length === 0) ? (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    No validation rules configured for this column.
                  </Text>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {validationRules[column].map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between bg-gray-50 p-3 rounded"
                      >
                        <div className="flex-1">
                          <Text strong style={{ fontSize: '12px', display: 'block' }}>
                            {idx + 1}. {rule.method}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            {getMethodDescription(rule.method)}
                          </Text>
                          {rule.params && Object.keys(rule.params).length > 0 && (
                            <div className="mt-2">
                              <Text style={{ fontSize: '11px' }}>Parameters:</Text>
                              <div className="ml-2 mt-1">
                                {Object.entries(rule.params).map(([key, value]) => (
                                  <Text key={key} style={{ fontSize: '11px', display: 'block' }}>
                                    • {key}: <strong>{JSON.stringify(value)}</strong>
                                  </Text>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Popconfirm
                          title="Remove this rule?"
                          onConfirm={() => handleRemoveRule(column, idx)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <Divider />

      <div className="bg-gray-50 p-4 rounded">
        <Text strong style={{ fontSize: '13px' }}>Validation Summary</Text>
        <div className="mt-2 space-y-1">
          <Text style={{ fontSize: '12px', display: 'block' }}>
            Required fields: <strong>{mappedRequiredColumns.length}</strong>
          </Text>
          <Text style={{ fontSize: '12px', display: 'block' }}>
            Fields with rules: <strong>{Object.keys(validationRules).length}</strong>
          </Text>
          <Text style={{ fontSize: '12px', display: 'block' }}>
            Total rules: <strong>{Object.values(validationRules).reduce((sum, rules) => sum + rules.length, 0)}</strong>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default ValidationRulesStep;
