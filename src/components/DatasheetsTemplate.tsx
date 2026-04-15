/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Modal, 
  Form, 
  Select, 
  message, 
  Typography,
  Spin,
  Empty,
  Checkbox
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  EditOutlined,
  HolderOutlined
} from '@ant-design/icons';
import { API_BASE_URL } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;
const { Option } = Select;

// TypeScript interfaces
interface Template {
  _id: {
    $oid: string;
  };
  name: string;
  required_columns: string[];
  update_columns_mapping: Record<string, string>;
  attempt_columns: string[];
}

interface ApiResponse<T> {
  status: string;
  template?: T;
  keys?: string[];
  updated?: boolean;
  message?: string;
}

interface UpdateData {
  required_columns?: string[];
  update_columns_mapping?: Record<string, string>;
  attempt_columns?: string[];
}

interface FormValues {
  columnName?: string;
  customKey?: string;
  flattenKey?: string;
  attemptColumns?: string[];
}

interface GroupedKeys {
  [key: string]: string[];
}

interface DragState {
  draggedIndex: number | null;
  draggedOverIndex: number | null;
  isDragging: boolean;
}

const DatasheetsTemplate: React.FC = () => {
  const { appendRoomParam, selectedRoom } = useRoomAPI();
  const [template, setTemplate] = useState<Template | null>(null);
  const [flattenKeys, setFlattenKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>(''); // 'addColumn', 'addMapping', 'editMapping', 'attemptColumns'
  const [editingMappingKey, setEditingMappingKey] = useState<string>('');
  const [form] = Form.useForm<FormValues>();

  // Drag state for required columns
  const [columnDragState, setColumnDragState] = useState<DragState>({
    draggedIndex: null,
    draggedOverIndex: null,
    isDragging: false
  });

  // Drag state for mappings
  const [mappingDragState, setMappingDragState] = useState<DragState>({
    draggedIndex: null,
    draggedOverIndex: null,
    isDragging: false
  });

  // Group flatten keys by prefix
  const groupedKeys: GroupedKeys = React.useMemo(() => {
    const grouped: GroupedKeys = {};
    flattenKeys.forEach((key: string) => {
      if (key.includes('.')) {
        const [prefix, ...rest] = key.split('.');
        if (!grouped[prefix]) grouped[prefix] = [];
        grouped[prefix].push(rest.join('.'));
      } else {
        if (!grouped['root']) grouped['root'] = [];
        grouped['root'].push(key);
      }
    });
    return grouped;
  }, [flattenKeys]);

  // Get all available mapping keys for attempt columns
  const availableMappingKeys = React.useMemo(() => {
    return template?.update_columns_mapping ? Object.keys(template.update_columns_mapping) : [];
  }, [template?.update_columns_mapping]);

  // Convert mapping object to ordered array for consistent ordering
  const orderedMappingEntries = React.useMemo(() => {
    if (!template?.update_columns_mapping) return [];
    return Object.entries(template.update_columns_mapping);
  }, [template?.update_columns_mapping]);

  // Fetch datasheets template
  const fetchTemplate = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/datasheets-template`));
      const data: ApiResponse<Template> = response.data;
      if (data.status === 'success' && data.template) {
        setTemplate(data.template);
      } else {
        message.error('Failed to fetch template');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error('Error fetching template: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [appendRoomParam]);

  // Fetch flatten keys
  const fetchFlattenKeys = useCallback(async (): Promise<void> => {
    try {
      const response = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/flatten`));
      const data: ApiResponse<never> = response.data;
      if (data.status === 'success' && data.keys) {
        // Filter keys that start with "data." and remove the prefix
        const processedKeys = data.keys
          .filter((key: string) => key.startsWith("data."))
          .map((key: string) => key.replace("data.", ""));
        setFlattenKeys(processedKeys);
      } else {
        message.error('Failed to fetch flatten keys');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error('Error fetching flatten keys: ' + errorMessage);
    }
  }, [appendRoomParam]);

  // Update template
  const updateTemplate = async (updateData: UpdateData): Promise<void> => {
    setLoading(true);
    try {
      const response = await axiosInstance.put(appendRoomParam(`${API_BASE_URL}/datasheets-template`), { update_data: updateData });
      const data: ApiResponse<never> = response.data;
      if (data.status === 'success') {
        message.success('Template updated successfully');
        await fetchTemplate();
      } else {
        message.error('Failed to update template');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error('Error updating template: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
    fetchFlattenKeys();
  }, [fetchTemplate, fetchFlattenKeys, selectedRoom]);

  // Enhanced drag handlers for columns with smooth animations
  const handleColumnDragStart = (e: React.DragEvent, index: number): void => {
    setColumnDragState({ 
      draggedIndex: index, 
      draggedOverIndex: null,
      isDragging: true 
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // For better browser support
    
    // Add ghost image styling
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleColumnDragOver = (e: React.DragEvent, index: number): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (columnDragState.draggedIndex !== index) {
      setColumnDragState(prev => ({ 
        ...prev, 
        draggedOverIndex: index 
      }));
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent): void => {
    // Only clear if leaving the container, not child elements
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setColumnDragState(prev => ({ 
        ...prev, 
        draggedOverIndex: null 
      }));
    }
  };

  const handleColumnDragEnd = (e: React.DragEvent): void => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1'; // Restore opacity
    
    const { draggedIndex, draggedOverIndex } = columnDragState;
    
    if (draggedIndex !== null && draggedOverIndex !== null && 
        draggedIndex !== draggedOverIndex && template) {
      const newColumns = [...template.required_columns];
      const draggedItem = newColumns[draggedIndex];
      newColumns.splice(draggedIndex, 1);
      newColumns.splice(draggedOverIndex, 0, draggedItem);
      updateTemplate({ required_columns: newColumns });
    }
    
    setColumnDragState({ 
      draggedIndex: null, 
      draggedOverIndex: null,
      isDragging: false 
    });
  };

  // Enhanced drag handlers for mappings with smooth animations
  const handleMappingDragStart = (e: React.DragEvent, index: number): void => {
    setMappingDragState({ 
      draggedIndex: index, 
      draggedOverIndex: null,
      isDragging: true 
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleMappingDragOver = (e: React.DragEvent, index: number): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (mappingDragState.draggedIndex !== index) {
      setMappingDragState(prev => ({ 
        ...prev, 
        draggedOverIndex: index 
      }));
    }
  };

  const handleMappingDragLeave = (e: React.DragEvent): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setMappingDragState(prev => ({ 
        ...prev, 
        draggedOverIndex: null 
      }));
    }
  };

  const handleMappingDragEnd = (e: React.DragEvent): void => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    
    const { draggedIndex, draggedOverIndex } = mappingDragState;
    
    if (draggedIndex !== null && draggedOverIndex !== null && 
        draggedIndex !== draggedOverIndex && template) {
      const reorderedEntries = [...orderedMappingEntries];
      const draggedItem = reorderedEntries[draggedIndex];
      reorderedEntries.splice(draggedIndex, 1);
      reorderedEntries.splice(draggedOverIndex, 0, draggedItem);
      
      const newMapping: Record<string, string> = {};
      reorderedEntries.forEach(([key, value]) => {
        newMapping[key] = value;
      });
      
      updateTemplate({ update_columns_mapping: newMapping });
    }
    
    setMappingDragState({ 
      draggedIndex: null, 
      draggedOverIndex: null,
      isDragging: false 
    });
  };

  // Handle adding new required column
  const handleAddColumn = (): void => {
    setModalType('addColumn');
    setIsModalVisible(true);
    form.resetFields();
  };

  // Handle adding new mapping
  const handleAddMapping = (): void => {
    setModalType('addMapping');
    setIsModalVisible(true);
    form.resetFields();
  };

  // Handle editing mapping
  const handleEditMapping = (key: string, value: string): void => {
    setModalType('editMapping');
    setEditingMappingKey(key);
    setIsModalVisible(true);
    form.setFieldsValue({
      customKey: key,
      flattenKey: value
    });
  };

  // Handle attempt columns modal
  const handleAttemptColumns = (): void => {
    setModalType('attemptColumns');
    setIsModalVisible(true);
    form.setFieldsValue({
      attemptColumns: template?.attempt_columns || []
    });
  };

  // Handle modal submit
  const handleModalSubmit = (): void => {
    form.validateFields().then((values: FormValues) => {
      if (!template) return;

      if (modalType === 'addColumn' && values.columnName) {
        const newColumns = [...template.required_columns, values.columnName];
        updateTemplate({ required_columns: newColumns });
      } else if (modalType === 'addMapping' && values.customKey && values.flattenKey) {
        const newMapping = {
          ...template.update_columns_mapping,
          [values.customKey]: values.flattenKey
        };
        updateTemplate({ update_columns_mapping: newMapping });
      } else if (modalType === 'editMapping' && values.customKey && values.flattenKey) {
        const newMapping = { ...template.update_columns_mapping };
        if (editingMappingKey !== values.customKey) {
          delete newMapping[editingMappingKey];
        }
        newMapping[values.customKey] = values.flattenKey;
        
        // Update attempt_columns if the key was changed
        let newAttemptColumns = template.attempt_columns || [];
        if (editingMappingKey !== values.customKey) {
          newAttemptColumns = newAttemptColumns.map(col => 
            col === editingMappingKey ? values.customKey : col
          ).filter((col): col is string => typeof col === 'string');
        }
        
        updateTemplate({ 
          update_columns_mapping: newMapping,
          attempt_columns: newAttemptColumns
        });
      } else if (modalType === 'attemptColumns' && values.attemptColumns) {
        updateTemplate({ attempt_columns: values.attemptColumns });
      }
      setIsModalVisible(false);
      setEditingMappingKey('');
    }).catch((error) => {
      console.error('Validation failed:', error);
    });
  };

  // FIXED: Remove required column with proper event handling (no confirmation)
  const removeColumn = (columnToRemove: string, e?: React.MouseEvent): void => {
    // Prevent event bubbling to drag handlers
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!template) return;
    
    const newColumns = template.required_columns.filter((col: string) => col !== columnToRemove);
    updateTemplate({ required_columns: newColumns });
  };

  // FIXED: Remove mapping with proper event handling (no confirmation)
  const removeMapping = (keyToRemove: string, e?: React.MouseEvent): void => {
    // Prevent event bubbling to drag handlers
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!template) return;
    
    const newMapping = { ...template.update_columns_mapping };
    delete newMapping[keyToRemove];
    
    // Remove from attempt_columns if it exists there
    const newAttemptColumns = (template.attempt_columns || []).filter(col => col !== keyToRemove);
    
    updateTemplate({ 
      update_columns_mapping: newMapping,
      attempt_columns: newAttemptColumns
    });
  };

  // Handle refresh
  const handleRefresh = (): void => {
    fetchTemplate();
    fetchFlattenKeys();
  };

  // Render nested select for flatten keys
  const renderNestedSelect = (): React.ReactElement => (
    <Select
      placeholder="Select a flatten key"
      style={{ width: '100%' }}
      showSearch
      filterOption={(input: string, option: any) =>
        option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {Object.entries(groupedKeys).map(([prefix, keys]: [string, string[]]) => (
        <Select.OptGroup key={prefix} label={prefix === 'root' ? 'Root Keys' : prefix}>
          {keys.map((key: string) => (
            <Option 
              key={prefix === 'root' ? key : `${prefix}.${key}`} 
              value={prefix === 'root' ? key : `${prefix}.${key}`}
            >
              {key}
            </Option>
          ))}
        </Select.OptGroup>
      ))}
    </Select>
  );

  if (loading && !template) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={2} style={{ color: '#263978', margin: 0 }}>
              Datasheets Template Management
            </Title>
            <Text type="secondary">Manage required columns, column mappings, and attempt columns</Text>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            style={{ borderColor: '#263978', color: '#263978' }}
          >
            Refresh
          </Button>
        </div>

        {template ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Required Columns Card */}
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span style={{ color: '#263978' }}>Required Columns</span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddColumn}
                    style={{ backgroundColor: '#263978', borderColor: '#263978' }}
                    size="small"
                  >
                    Add Column
                  </Button>
                </div>
              }
              className="h-fit"
              headStyle={{ backgroundColor: '#f8f9ff' }}
            >
              <div className="space-y-2">
                {template.required_columns?.map((column: string, index: number) => (
                  <div 
                    key={`${column}-${index}`}
                    className={`flex justify-between items-center p-3 rounded transition-all duration-300 ease-in-out ${
                      columnDragState.draggedIndex === index 
                        ? 'bg-blue-100 border-2 border-blue-400 shadow-lg transform scale-105' 
                        : columnDragState.draggedOverIndex === index
                        ? 'bg-blue-50 border-2 border-blue-300 shadow-md transform scale-102'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    } ${columnDragState.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    draggable
                    onDragStart={(e) => handleColumnDragStart(e, index)}
                    onDragOver={(e) => handleColumnDragOver(e, index)}
                    onDragEnd={(e) => handleColumnDragEnd(e)}
                    onDragLeave={handleColumnDragLeave}
                    style={{
                      userSelect: 'none',
                      transform: columnDragState.draggedOverIndex === index && columnDragState.draggedIndex !== index 
                        ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <HolderOutlined 
                        style={{ 
                          color: '#8c8c8c', 
                          cursor: columnDragState.isDragging ? 'grabbing' : 'grab',
                          fontSize: '16px'
                        }} 
                      />
                      <Text style={{ pointerEvents: 'none' }}>{column}</Text>
                    </div>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => removeColumn(column, e)}
                      size="small"
                      danger
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
                {(!template.required_columns || template.required_columns.length === 0) && (
                  <Empty description="No required columns" />
                )}
              </div>
            </Card>

            {/* Update Columns Mapping Card */}
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span style={{ color: '#263978' }}>Column Mappings</span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddMapping}
                    style={{ backgroundColor: '#263978', borderColor: '#263978' }}
                    size="small"
                  >
                    Add Mapping
                  </Button>
                </div>
              }
              className="h-fit"
              headStyle={{ backgroundColor: '#f8f9ff' }}
            >
              <div className="space-y-2">
                {orderedMappingEntries.map(([key, value]: [string, string], index: number) => (
                  <div 
                    key={`${key}-${index}`}
                    className={`flex justify-between items-center p-3 rounded transition-all duration-300 ease-in-out ${
                      mappingDragState.draggedIndex === index 
                        ? 'bg-blue-100 border-2 border-blue-400 shadow-lg transform scale-105' 
                        : mappingDragState.draggedOverIndex === index
                        ? 'bg-blue-50 border-2 border-blue-300 shadow-md transform scale-102'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    } ${mappingDragState.isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    draggable
                    onDragStart={(e) => handleMappingDragStart(e, index)}
                    onDragOver={(e) => handleMappingDragOver(e, index)}
                    onDragEnd={(e) => handleMappingDragEnd(e)}
                    onDragLeave={handleMappingDragLeave}
                    style={{
                      userSelect: 'none',
                      transform: mappingDragState.draggedOverIndex === index && mappingDragState.draggedIndex !== index 
                        ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <HolderOutlined 
                        style={{ 
                          color: '#8c8c8c', 
                          cursor: mappingDragState.isDragging ? 'grabbing' : 'grab',
                          fontSize: '16px'
                        }} 
                      />
                      <div className="flex-1" style={{ pointerEvents: 'none' }}>
                        <div className="flex items-center gap-2">
                          <Text strong>{key}</Text>
                          {template.attempt_columns?.includes(key) && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Attempt
                            </span>
                          )}
                        </div>
                        <Text type="secondary" className="text-sm">→ {value}</Text>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditMapping(key, value);
                        }}
                        size="small"
                        style={{ color: '#263978' }}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={(e) => removeMapping(key, e)}
                        size="small"
                        danger
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
                {(!template.update_columns_mapping || Object.keys(template.update_columns_mapping).length === 0) && (
                  <Empty description="No column mappings" />
                )}
              </div>
            </Card>

            {/* Attempt Columns Card */}
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span style={{ color: '#263978' }}>Attempt Columns</span>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleAttemptColumns}
                    style={{ backgroundColor: '#263978', borderColor: '#263978' }}
                    size="small"
                    disabled={availableMappingKeys.length === 0}
                  >
                    Manage
                  </Button>
                </div>
              }
              className="h-fit"
              headStyle={{ backgroundColor: '#f8f9ff' }}
            >
              <div className="space-y-2">
                {template.attempt_columns?.map((column: string, index: number) => (
                  <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                    <Text style={{ color: '#52c41a' }}>{column}</Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      → {template.update_columns_mapping?.[column] || 'No mapping'}
                    </Text>
                  </div>
                ))}
                {(!template.attempt_columns || template.attempt_columns.length === 0) && (
                  <Empty description="No attempt columns selected" />
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Empty description="No template data available" />
        )}

        {/* Modal for adding/editing columns/mappings/attempt columns */}
        <Modal
          title={
            modalType === 'addColumn' 
              ? 'Add Required Column' 
              : modalType === 'addMapping'
              ? 'Add Column Mapping'
              : modalType === 'editMapping'
              ? 'Edit Column Mapping'
              : 'Manage Attempt Columns'
          }
          open={isModalVisible}
          onOk={handleModalSubmit}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingMappingKey('');
          }}
          okText={modalType === 'editMapping' ? 'Update' : modalType === 'attemptColumns' ? 'Save' : 'Add'}
          okButtonProps={{ 
            style: { backgroundColor: '#263978', borderColor: '#263978' },
            loading: loading
          }}
        >
          <Form form={form} layout="vertical">
            {modalType === 'addColumn' ? (
              <Form.Item
                name="columnName"
                label="Column Name"
                rules={[{ required: true, message: 'Please enter column name' }]}
              >
                <Input placeholder="Enter column name" />
              </Form.Item>
            ) : modalType === 'attemptColumns' ? (
              <Form.Item
                name="attemptColumns"
                label="Select Attempt Columns"
                extra="Choose which column mappings should be marked as attempt columns"
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <div className="space-y-2">
                    {availableMappingKeys.map((key: string) => (
                      <div key={key} className="flex items-center p-2 bg-gray-50 rounded">
                        <Checkbox value={key} style={{ marginRight: 8 }}>
                          <div>
                            <Text strong>{key}</Text>
                            <br />
                            <Text type="secondary" className="text-sm">
                              → {template?.update_columns_mapping?.[key]}
                            </Text>
                          </div>
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                </Checkbox.Group>
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  name="customKey"
                  label="Custom Key"
                  rules={[{ required: true, message: 'Please enter custom key' }]}
                >
                  <Input 
                    placeholder="Enter custom key"
                  />
                </Form.Item>
                <Form.Item
                  name="flattenKey"
                  label="Flatten Key"
                  rules={[{ required: true, message: 'Please select flatten key' }]}
                >
                  {renderNestedSelect()}
                </Form.Item>
                {modalType === 'editMapping' && (
                  <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <Text type="secondary" className="text-sm">
                    <strong>Note:</strong> {`You are editing the mapping for ${editingMappingKey}
                    Changes will update both the mapping and any attempt column references.`}
                    </Text>
                  </div>
                )}
              </>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default DatasheetsTemplate;