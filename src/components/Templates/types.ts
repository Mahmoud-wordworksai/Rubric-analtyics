// Template Types

export interface DynamicMapping {
  [key: string]: string;
}

export interface DynamicConfig {
  active: boolean;
  column: string;
  mapping: DynamicMapping;
}

export interface ProcessingMethod {
  method: string;
  param: string;
}

export interface FormatValuesMappingMethods {
  [key: string]: ProcessingMethod;
}

export interface Template {
  _id?: string;
  name: string;
  format_values: string[];
  format_values_mapping_methods: FormatValuesMappingMethods;
  dynamic: DynamicConfig;
  default_phone_column: string;
  sms: boolean;
  whatsapp: boolean;
  stt_services: string;
  tts_services: string;
  llm_services: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow additional fields
}

// MongoDB format types
export interface MongoId {
  $oid: string;
}

export interface MongoDate {
  $date: string;
}

// Raw template from API (MongoDB format)
export interface RawTemplate {
  _id: MongoId | string;
  name: string;
  format_values?: string[];
  format_values_mapping_methods?: FormatValuesMappingMethods;
  dynamic?: DynamicConfig;
  default_phone_column?: string;
  sms?: boolean;
  whatsapp?: boolean;
  stt_services?: string;
  tts_services?: string;
  llm_services?: string;
  created_at?: MongoDate | string;
  updated_at?: MongoDate | string;
  [key: string]: unknown;
}

export interface TemplateListResponse {
  status: string;
  templates?: RawTemplate[];
  data?: RawTemplate[];
  results?: RawTemplate[];
  pagination?: PaginationInfo;
  message?: string;
}

export interface TemplateResponse {
  status: string;
  template?: RawTemplate;
  data?: RawTemplate;
  message?: string;
  // Create API returns these fields directly
  id?: string;
  name?: string;
}

export interface PaginationInfo {
  page?: number;
  limit: number;
  totalResults?: number;
  totalPages?: number;
  // API also returns these fields
  skip?: number;
  total?: number;
  returned?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export interface TemplateCreatePayload {
  name: string;
  format_values?: string[];
  format_values_mapping_methods?: FormatValuesMappingMethods;
  dynamic?: DynamicConfig;
  default_phone_column?: string;
  sms?: boolean;
  whatsapp?: boolean;
  stt_services?: string;
  tts_services?: string;
  llm_services?: string;
  [key: string]: unknown;
}

export interface TemplateUpdatePayload {
  [key: string]: unknown;
}

export interface TemplatesState {
  templates: Template[];
  selectedTemplate: Template | null;
  loading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  pagination: PaginationState;
}

export const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
};

export const DEFAULT_TEMPLATE: Partial<Template> = {
  name: '',
  format_values: [],
  format_values_mapping_methods: {},
  dynamic: {
    active: false,
    column: '',
    mapping: {},
  },
  default_phone_column: 'MOBILE_NO',
  sms: false,
  whatsapp: false,
  stt_services: 'azure',
  tts_services: 'cartesia',
  llm_services: 'bedrock',
};
