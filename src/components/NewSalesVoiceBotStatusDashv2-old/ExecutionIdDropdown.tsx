import React, { useState } from 'react';
import { Select, message, Tooltip } from 'antd';
import { EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axiosInstance from '@/lib/axios';
import { API_BASE_URL, API_KEY } from "@/constants";

// Define TypeScript interface for props
interface ExecutionIdDropdownProps {
  agent: {
    _id: {
      $oid: string;
    };
    execution_id: string | null;
  };
  onUpdate: () => void;
  exeIds: string[];
  disabled?: boolean;
}

// Predefined execution IDs for demonstration
// In a real application, these might come from an API
// const PREDEFINED_EXECUTION_IDS = [
//   'exec_123456789',
//   'exec_987654321',
//   'exec_abcdef123',
//   'exec_xyz789456',
//   'exec_dev456789'
// ];

const ExecutionIdDropdown: React.FC<ExecutionIdDropdownProps> = ({ agent, onUpdate, exeIds, disabled = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<string | null>(agent.execution_id);

  // Handle updating the execution ID
  const handleUpdateExecutionId = async (newExecutionId: string | null) => {
    setLoading(true);
    try {
      // Send update to API
      const payload = { execution_id: newExecutionId };
      await axiosInstance.put(
        `${API_BASE_URL}/agents/${agent._id.$oid}/execution-id?api_key=${API_KEY}`,
        payload
      );
      
      message.success('Execution ID updated successfully');
      setValue(newExecutionId);
      onUpdate(); // Refresh parent component
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating execution ID:', error);
      message.error('Failed to update execution ID');
    } finally {
      setLoading(false);
    }
  };

  // Options for the select dropdown
  const selectOptions = [
    { value: null, label: 'None (Not Working)' },
    ...exeIds.map(id => ({ value: id, label: id })),
  ];

  if (isEditing) {
    return (
        <Select
            style={{ width: '100%' }}
            placeholder="Select or search execution ID"
            value={value}
            onChange={handleUpdateExecutionId}
            loading={loading}
            allowClear
            showSearch
            onSearch={(value) => value}
            filterOption={(input, option) => 
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={selectOptions}
            optionFilterProp="label"
            onBlur={() => setIsEditing(false)}
            autoFocus
            disabled={disabled}
        />
    );
  }

  return (
    <div className="flex items-center">
      <Tooltip title={value ? value : 'No execution ID (Not Working)'}>
        <div 
          className="truncate flex-1 cursor-pointer hover:text-blue-500"
          onClick={() => setIsEditing(true)}
        >
          {value ? (
            <span className="flex items-center">
              <CheckCircleOutlined className="mr-1 text-green-500" /> 
              {value}
            </span>
          ) : (
            'None (Not Working)'
          )}
        </div>
      </Tooltip>
      <Tooltip title="Edit execution ID">
        <EditOutlined 
          className="ml-2 text-gray-400 hover:text-blue-500 cursor-pointer" 
          onClick={() => setIsEditing(true)}
          style={{ visibility: disabled ? 'hidden' : 'visible' }}
        />
      </Tooltip>
    </div>
  );
};

export default ExecutionIdDropdown;