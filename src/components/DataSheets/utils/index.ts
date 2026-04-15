/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DatasheetRow } from '../types';
import { DATE_FIELDS } from '../constants';

// Get file icon based on filename extension
export const getFileIcon = (filename?: string): React.ReactNode => {
  if (!filename) return React.createElement(FileTextOutlined);
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return React.createElement(FileExcelOutlined, { style: { color: '#52C41A' } });
    case 'pdf':
      return React.createElement(FilePdfOutlined, { style: { color: '#FF4D4F' } });
    default:
      return React.createElement(FileTextOutlined, { style: { color: '#1890FF' } });
  }
};

// Process rows to convert date fields to human readable format
export const processRowsData = (rows: DatasheetRow[]): DatasheetRow[] => {
  return rows.map(row => {
    const newRow: Record<string, any> = { ...row };
    DATE_FIELDS.forEach(field => {
      if (
        newRow[field] &&
        typeof newRow[field] === 'object' &&
        '$date' in newRow[field] &&
        typeof newRow[field]['$date'] === 'string'
      ) {
        const dateStr = newRow[field]['$date'];
        if (!isNaN(Date.parse(dateStr))) {
          newRow[field] = new Date(dateStr).toLocaleDateString();
        }
      }
    });
    return newRow;
  });
};

// Generate columns from data
export const generateColumns = (data: DatasheetRow[]): ColumnsType<DatasheetRow> => {
  if (data.length === 0) return [];
  
  const firstRow = data[0];
  return Object.keys(firstRow).map(key => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    dataIndex: key,
    key: key,
    ellipsis: true,
    width: 150,
    render: (text: any) => text?.toString() || ''
  }));
};

// Format date for display
export const formatDate = (date: string | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// Format pagination display text
export const formatPaginationText = (
  total: number, 
  range: [number, number], 
  itemType: string = 'items'
): string => {
  return `${range[0]}-${range[1]} of ${total} ${itemType}`;
};

// Validate file type
export const isValidFileType = (filename: string, acceptedTypes: string[]): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return acceptedTypes.some(type => type.includes(ext || ''));
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Parse timestamp from API response
export const parseTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  let dateStr: string | undefined;
  if (typeof timestamp === 'string') {
    dateStr = timestamp;
  } else if (
    timestamp &&
    typeof timestamp === 'object' &&
    timestamp !== null &&
    '$date' in timestamp &&
    typeof (timestamp as { $date?: string }).$date === 'string'
  ) {
    dateStr = (timestamp as { $date: string }).$date;
  }
  
  if (dateStr && !isNaN(Date.parse(dateStr))) {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  return '';
};