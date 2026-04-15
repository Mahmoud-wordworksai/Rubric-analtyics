"use client";

import React from 'react';
import { Space, Button, Tag, Badge, Tooltip, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BarChartOutlined,
  MessageOutlined,
  PhoneOutlined,
  FileOutlined,
} from '@ant-design/icons';
import type { Datasheet } from '../types';
import { getFileIcon, parseTimestamp } from '../utils';
import { useRoomAPI } from '@/hooks/useRoomAPI';

interface TableColumnsProps {
  onView: (datasheet: Datasheet) => void;
  onUpdate: (datasheet: Datasheet) => void;
  onDelete: (datasheetId: string) => void;
}

export const createDatasheetColumns = ({
  onView,
  onUpdate,
  onDelete
}: TableColumnsProps): ColumnsType<Datasheet> => {
  // Create a functional component to use hooks
  const ActionsCell: React.FC<{ record: Datasheet }> = ({ record }) => {
    const { navigateTo } = useRoomAPI();

    return (
      <Space wrap size="small">
        <Tooltip title="View Details">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
            style={{ color: '#263878' }}
          />
        </Tooltip>
        <Tooltip title="Analytics">
          <Button
            type="text"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => navigateTo("/dashboard", { datasheet_id: record._id })}
            style={{ color: '#1890FF' }}
          />
        </Tooltip>
        <Tooltip title="SMS Cost">
          <Button
            type="text"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => navigateTo("/sms-billing", { datasheet_id: record._id })}
            style={{ color: '#722ED1' }}
          />
        </Tooltip>
        <Tooltip title="Call Cost">
          <Button
            type="text"
            size="small"
            icon={<PhoneOutlined />}
            onClick={() => navigateTo("/call-cost", { datasheet_id: record._id })}
            style={{ color: '#13C2C2' }}
          />
        </Tooltip>
        <Tooltip title="Update from File">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onUpdate(record)}
            style={{ color: '#52C41A' }}
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Popconfirm
            title="Are you sure you want to delete this datasheet?"
            onConfirm={() => onDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              style={{ color: '#FF4D4F' }}
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    );
  };

  return [
    {
      title: 'File',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename: string) => (
        <Space>
          {getFileIcon(filename)}
          <Tooltip title={filename}>
            <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
              {filename || 'N/A'}
            </span>
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'Total Rows',
      dataIndex: 'total_rows',
      key: 'total_rows',
      align: 'right' as const,
      render: (rows: number) => (
        <Tag color="blue">
          {rows?.toLocaleString() || '0'}
        </Tag>
      )
    },
    {
      title: 'Parts',
      key: 'parts',
      align: 'center' as const,
      render: (_: unknown, record: Datasheet) => (
        <Tooltip title={`${record.parts_count || 0} of ${record.total_parts || 0} parts`}>
          <Tag color="purple" icon={<FileOutlined />}>
            {record.parts_count || 0}/{record.total_parts || 0}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'Version',
      key: 'version',
      align: 'center' as const,
      render: (_: unknown, record: Datasheet) => {
        const latestVersion = record.parts?.[0]?.version || record.version || 1;
        return (
          <Tag color="green">v{latestVersion}</Tag>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center' as const,
      render: () => (
        <Badge status="success" text="Active" />
      )
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string | { $date: string }) => (
        <span style={{ fontSize: '12px', color: '#666' }}>
          {parseTimestamp(date) || 'N/A'}
        </span>
      )
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string | { $date: string }) => (
        <span style={{ fontSize: '12px', color: '#666' }}>
          {parseTimestamp(date) || 'N/A'}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_: unknown, record: Datasheet) => <ActionsCell record={record} />
    }
  ];
};