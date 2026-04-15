/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from '@/lib/axios';
import { API_BASE_URL, DEFAULT_CHUNK_SIZE } from '../constants';
import { appendRoomParam } from '../../../hooks/useRoomAPI';
import type {
  ApiResponse,
  DatasheetRow,
  DatasheetTemplateResponse,
  ValidationMethodsResponse,
  ColumnMapping,
  ValidationRule
} from '../types';

// Generic API call function using axiosInstance
export const apiCall = async <T = any>(endpoint: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
} = {}, room?: string): Promise<ApiResponse<T>> => {
  try {
    const url = appendRoomParam(`${API_BASE_URL}${endpoint}`, room);
    const response = await axiosInstance.request({
      url,
      method: options.method || 'GET',
      headers: options.headers,
      data: options.body
    });
    return response.data;
  } catch (error: any) {
    console.error('API call failed:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.message || errorData.detail || errorData.error || `HTTP error! status: ${error.response.status}`;
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Fetch datasheets with filters and pagination
export const fetchDatasheets = async (
  params: {
    current?: number;
    pageSize?: number;
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
    tag?: string;
    projectType?: string;
    filename?: string;
    room?: string;
  } = {}
): Promise<ApiResponse> => {
  const searchParams: Record<string, string> = {
    page: (params.current || 1).toString(),
    page_size: (params.pageSize || 10).toString(),
    sort_by: 'created_at',
    sort_order: '-1'
  };

  if (params.searchTerm) {
    searchParams.search = params.searchTerm;
  }

  if (params.startDate && params.endDate) {
    searchParams.start_date = params.startDate;
    searchParams.end_date = params.endDate;
  }

  if (params.tag) {
    searchParams.tag = params.tag;
  }

  if (params.projectType) {
    searchParams.project_type = params.projectType;
  }

  if (params.filename) {
    searchParams.filename = params.filename;
  }

  // Add current_room to query params for cross-room parts tracking
  if (params.room) {
    searchParams.current_room = params.room;
  }

  const queryParams = new URLSearchParams(searchParams);
  return apiCall<any>(`/datasheets?${queryParams}`, {}, params.room);
};

// Fetch datasheet rows
export const fetchDatasheetRows = async (
  datasheetId: string,
  params: { page?: number; pageSize?: number; search?: string; room?: string } = {}
): Promise<ApiResponse<DatasheetRow[]>> => {
  const searchParams: Record<string, string> = {
    page: (params.page || 1).toString(),
    page_size: (params.pageSize || 100).toString()
  };

  if (params.search) {
    searchParams.search = params.search;
  }

  const queryParams = new URLSearchParams(searchParams);
  return apiCall<DatasheetRow[]>(`/datasheets/${datasheetId}/rows?${queryParams}`, {}, params.room);
};

// Fetch datasheet template
export const fetchDatasheetTemplate = async (room?: string): Promise<DatasheetTemplateResponse> => {
  const url = appendRoomParam(`${API_BASE_URL}/datasheets-template`, room);
  const response = await axiosInstance.get(url);
  return response.data;
};

// Fetch validation methods
export const fetchValidationMethods = async (room?: string): Promise<ValidationMethodsResponse> => {
  const url = appendRoomParam(`${API_BASE_URL}/column-validation-methods`, room);
  const response = await axiosInstance.get(url);
  return response.data;
};

// Extract columns from uploaded file
export const extractFileColumns = async (file: File, room?: string): Promise<string[]> => {
  const formData = new FormData();
  formData.append('file', file);

  const url = appendRoomParam(`${API_BASE_URL}/datasheets/extract-columns`, room);
  const response = await axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data.columns || [];
};

// Upload options interface
export interface UploadDatasheetOptions {
  file: File;
  columnMapping: ColumnMapping;
  validationRules: Record<string, ValidationRule[]>;
  customName?: string;
  metadata?: Record<string, any>;
  batchSize?: number;
  partSize?: number;
  projectType?: string;
  tag?: string;
  room?: string;
}

// Upload datasheet with column mapping and validation rules
export const uploadDatasheetWithMapping = async (
  options: UploadDatasheetOptions
): Promise<ApiResponse> => {
  const {
    file,
    columnMapping,
    validationRules,
    customName = 'na',
    metadata,
    batchSize = 50000,
    partSize = 25000,
    projectType = 'bucketx',
    tag = 'test',
    room
  } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('column_mapping', JSON.stringify(columnMapping));
  formData.append('validation_rules', JSON.stringify(validationRules));
  formData.append('custom_name', customName === "" ? "na" : customName);

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  formData.append('batch_size', batchSize.toString());
  formData.append('part_size', partSize.toString());
  formData.append('project_type', projectType);
  formData.append('tag', tag);
  formData.append('room', room || '');

  const url = appendRoomParam(`${API_BASE_URL}/datasheets/upload-with-mapping`, room);
  const response = await axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

// ==================== Upload Job Status API ====================

// Upload job status response
export interface UploadJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'success' | 'failed' | 'error';
  job_id: string;
  message?: string;
  progress?: number;
  result?: {
    status: string;
    message?: string;
    datasheet_id?: string;
    group_id?: string;
    total_rows?: number;
    parts_created?: number;
  };
  error?: string;
  created_at?: string;
  completed_at?: string;
}

// Check upload job status
export const getUploadJobStatus = async (jobId: string, room?: string): Promise<UploadJobStatus> => {
  const url = appendRoomParam(`${API_BASE_URL}/datasheets/upload-with-mapping/status/${jobId}`, room);
  const response = await axiosInstance.get(url);
  return response.data;
};

// Legacy upload datasheet (kept for backward compatibility)
export const uploadDatasheet = async (
  file: File,
  customName: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  room?: string
): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({}));
  formData.append('chunk_size', chunkSize.toString());
  formData.append('custom_name', customName === "" ? "na" : customName);
  formData.append('room', room || '');

  const url = appendRoomParam(`${API_BASE_URL}/datasheets/upload`, room);
  const response = await axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

// Update datasheet from file
export const updateDatasheetFromFile = async (
  datasheetId: string,
  file: File,
  columnsToUpdate: string[],
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  room?: string
): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('columns_to_update', JSON.stringify(columnsToUpdate));
  formData.append('chunk_size', chunkSize.toString());
  formData.append('room', room || '');

  const url = appendRoomParam(`${API_BASE_URL}/datasheets/${datasheetId}/upload-update`, room);
  const response = await axiosInstance.put(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

// Delete datasheet
export const deleteDatasheet = async (datasheetId: string, room?: string): Promise<ApiResponse> => {
  return apiCall(`/datasheets/${datasheetId}`, {
    method: 'DELETE'
  }, room);
};

// Restore datasheet version
export const restoreDatasheetVersion = async (
  datasheetId: string,
  version: number,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  room?: string
): Promise<ApiResponse<{ success: boolean; message?: string }>> => {
  return apiCall<{ success: boolean; message?: string }>(
    `/datasheets/${datasheetId}/restore-version`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ version, chunk_size: chunkSize })
    },
    room
  );
};

// Reset datasheet - keep only required columns
export const resetDatasheet = async (
  datasheetId: string,
  room?: string
): Promise<ApiResponse<{ success: boolean; message?: string }>> => {
  return apiCall<{ success: boolean; message?: string }>(
    `/datasheets/${datasheetId}/reset`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    room
  );
};

// ==================== Call Reports Export API ====================

// Export job status response
export interface ExportJobStatus {
  status: 'processing' | 'completed' | 'failed';
  job_id: string;
  group_id: string;
  created_at: string;
  completed_at?: string;
  filename?: string;
  download_link?: string;
  row_count?: number;
  error?: string;
}

// Start export job for a datasheet group
export const startGroupExport = async (groupId: string, room?: string, mis?: boolean): Promise<{ job_id: string }> => {
  let baseUrl = `${API_BASE_URL}/datasheets/group/${groupId}/export`;
  if (mis) {
    baseUrl += '?mis=true';
  }
  const url = appendRoomParam(baseUrl, room);
  const response = await axiosInstance.get(url);
  return response.data;
};

// Check export job status
export const getExportJobStatus = async (jobId: string, room?: string): Promise<ExportJobStatus> => {
  const url = appendRoomParam(`${API_BASE_URL}/datasheets/group/export/status/${jobId}`, room);
  const response = await axiosInstance.get(url);
  return response.data;
};

// Download export file (triggers file download and cleanup on server)
export const downloadExportFile = async (jobId: string, filename: string, room?: string): Promise<void> => {
  const url = appendRoomParam(`${API_BASE_URL}/datasheets/group/export/download/${jobId}`, room);
  const response = await axiosInstance.get(url, {
    responseType: 'blob'
  });

  // Create blob and trigger download
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || `call_report_${jobId}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

// ==================== SMS Reports Export API ====================

// Start SMS export job for a datasheet group (POST method)
export const startSMSGroupExport = async (groupId: string, room?: string): Promise<{ job_id: string }> => {
  const url = appendRoomParam(`${API_BASE_URL}/sms/reports/group/${groupId}`, room);
  const response = await axiosInstance.post(url);
  return response.data;
};

// Check SMS export job status
export const getSMSExportJobStatus = async (jobId: string, room?: string): Promise<ExportJobStatus> => {
  const url = appendRoomParam(`${API_BASE_URL}/sms/reports/group/status/${jobId}`, room);
  const response = await axiosInstance.get(url);
  return response.data;
};

// Download SMS export file (triggers file download and cleanup on server)
export const downloadSMSExportFile = async (jobId: string, filename: string, room?: string): Promise<void> => {
  const url = appendRoomParam(`${API_BASE_URL}/sms/reports/group/download/${jobId}`, room);
  const response = await axiosInstance.get(url, {
    responseType: 'blob'
  });

  // Create blob and trigger download
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || `sms_report_${jobId}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

// ==================== Move Datasheet API ====================

// Move datasheet parts between rooms
export interface MoveDatasheetParams {
  group_id: string;
  action: 'start' | 'complete';
  from_room: string;
  to_room: string;
  move_type?: 'single' | 'all';
  datasheet_id?: string; // Required only when move_type="single"
}

export const moveDatasheetParts = async (
  params: MoveDatasheetParams,
  room?: string
): Promise<ApiResponse<{ success: boolean; message?: string }>> => {
  const formData = new FormData();
  formData.append('group_id', params.group_id);
  formData.append('action', params.action);
  formData.append('from_room', params.from_room);
  formData.append('to_room', params.to_room);
  formData.append('move_type', params.move_type || 'single');

  const subdomain = window.location.hostname.split(".")[0];
  const selectedProject = subdomain.replace(/-/g, '_');
  formData.append('db_name', selectedProject === "tata_capital" ? "tatacapital" : selectedProject);

  if (params.move_type === 'single' && params.datasheet_id) {
    formData.append('datasheet_id', params.datasheet_id);
  }

  const url = appendRoomParam(`${API_BASE_URL}/datasheets/parts/move`, room);
  const response = await axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
