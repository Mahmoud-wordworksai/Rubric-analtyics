/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Dayjs } from 'dayjs';

export interface PartInfo {
  _id: string;
  filename: string;
  part: number;
  row_count: number;
  version: number;
  created_at?: string | { $date: string };
  extension: string;
  room: string;
  is_moving?: boolean;
  room_display?: string;
}

export interface DatasheetPart {
  _id: string;
  filename: string;
  part: number;
  row_count: number;
  version: number;
  created_at?: string | { $date: string };
  extension: string;
  room?: string;
  is_moving?: boolean;
  room_display?: string;
}

export interface Datasheet {
  _id: string;
  group_id?: string;
  filename?: string;
  project_type?: string | null;
  tag?: string | null;
  tags?: string[] | null;
  total_rows?: number;
  parts_count?: number;
  total_parts?: number;
  created_at?: string | { $date: string };
  updated_at?: string | { $date: string };
  parts?: DatasheetPart[];
  parts_info?: PartInfo[]; // Complete cross-room tracking (all parts across all rooms)
  rooms?: string[]; // List of unique rooms where parts exist
  metadata?: Record<string, any>;
  row_count?: number;
  chunk_size?: number;
  chunk_ids?: string[]; // Array of chunk ObjectId strings
  version?: number;
  version_history?: Array<{
    version: number;
    timestamp?: string;
    action?: string;
    filename?: string;
    row_count?: number;
    chunk_ids?: string[];
  }>;
  bod_sent?: boolean;
  eod_sent?: boolean;
}

export interface DatasheetRow {
  [key: string]: any;
}

export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalResults: number;
}

export interface ApiResponse<T = any> {
  status: string;
  data?: T;
  results?: Datasheet[];
  rows?: DatasheetRow[];
  page?: number;
  total?: number;
  message?: string;
  pagination?: PaginationInfo;
  // For background job responses
  job_id?: string;
  status_url?: string;
}

export interface ApiCallOptions extends RequestInit {
  headers?: Record<string, string>;
}

export interface FilterState {
  searchTerm: string;
  dateRange: [Dayjs | null, Dayjs | null];
  tag: string;
  projectType: string;
  filename: string;
}

export interface ModalState {
  uploadModalVisible: boolean;
  updateModalVisible: boolean;
  viewModalVisible: boolean;
  filterDrawerVisible: boolean;
}

export interface FileState {
  uploadFile: File | null;
  updateFile: File | null;
  customName: string;
  columnsToUpdate: string[];
}

// Validation method types
export interface ValidationMethodParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
}

export interface ValidationMethod {
  method: string;
  description: string;
  parameters: ValidationMethodParameter[];
  example: Record<string, any>;
}

export interface ValidationMethodsResponse {
  success: boolean;
  methods: ValidationMethod[];
  total_count: number;
}

// Validation rule for a column
export interface ValidationRule {
  method: string;
  params?: Record<string, any>;
}

// Column mapping types
export interface ColumnMapping {
  [sourceColumn: string]: string; // maps source column to target field
}

export interface DatasheetTemplate {
  _id: { $oid: string };
  name: string;
  required_columns: string[];
  attempt_columns: string[];
}

export interface DatasheetTemplateResponse {
  status: string;
  template: DatasheetTemplate;
}

// Upload state for new multi-step upload flow
export interface UploadFlowState {
  currentStep: number; // 0: file upload, 1: column mapping, 2: validation rules
  fileColumns: string[]; // columns extracted from uploaded file
  columnMapping: ColumnMapping;
  validationRules: Record<string, ValidationRule[]>; // target field -> validation rules
}