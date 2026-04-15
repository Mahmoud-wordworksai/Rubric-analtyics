// Template Utilities

import { Template, TemplateUpdatePayload, RawTemplate, MongoId, MongoDate } from './types';

/**
 * Extract string from MongoDB ObjectId format
 */
const extractMongoId = (id: MongoId | string | undefined): string | undefined => {
  if (!id) return undefined;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && '$oid' in id) return id.$oid;
  return undefined;
};

/**
 * Extract ISO string from MongoDB Date format
 */
const extractMongoDate = (date: MongoDate | string | undefined): string | undefined => {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  if (typeof date === 'object' && '$date' in date) return date.$date;
  return undefined;
};

/**
 * Transform raw API template (MongoDB format) to normalized Template
 */
export const normalizeTemplate = (raw: RawTemplate): Template => {
  return {
    ...raw,
    _id: extractMongoId(raw._id),
    created_at: extractMongoDate(raw.created_at),
    updated_at: extractMongoDate(raw.updated_at),
    // Ensure required fields have defaults
    name: raw.name || '',
    format_values: raw.format_values || [],
    format_values_mapping_methods: raw.format_values_mapping_methods || {},
    dynamic: raw.dynamic || { active: false, column: '', mapping: {} },
    default_phone_column: raw.default_phone_column || 'MOBILE_NO',
    sms: raw.sms ?? false,
    whatsapp: raw.whatsapp ?? false,
    stt_services: raw.stt_services || 'azure',
    tts_services: raw.tts_services || 'cartesia',
    llm_services: raw.llm_services || 'bedrock',
  } as Template;
};

/**
 * Transform array of raw templates to normalized templates
 */
export const normalizeTemplates = (rawTemplates: RawTemplate[]): Template[] => {
  return rawTemplates.map(normalizeTemplate);
};

/**
 * Deep comparison of two values
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
};

/**
 * Get only the changed keys between original and updated template
 * Handles nested objects correctly
 */
export const getChangedFields = (
  original: Template,
  updated: Template
): TemplateUpdatePayload => {
  const changes: TemplateUpdatePayload = {};

  // Skip internal fields
  const skipFields = ['_id', 'created_at', 'updated_at'];

  const allKeys = new Set([
    ...Object.keys(original),
    ...Object.keys(updated),
  ]);

  allKeys.forEach((key) => {
    if (skipFields.includes(key)) return;

    const originalValue = original[key];
    const updatedValue = updated[key];

    if (!deepEqual(originalValue, updatedValue)) {
      changes[key] = updatedValue;
    }
  });

  return changes;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  const cloned: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }

  return cloned as T;
};

/**
 * Update nested value in an object using dot notation path
 * Example: updateNestedValue(obj, 'dynamic.mapping.STATE', 'value')
 */
export const updateNestedValue = <T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T => {
  const cloned = deepClone(obj);
  const keys = path.split('.');
  let current: Record<string, unknown> = cloned;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return cloned;
};

/**
 * Get nested value from an object using dot notation path
 */
export const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
};

/**
 * Check if there are any changes between two templates
 */
export const hasChanges = (original: Template, updated: Template): boolean => {
  const changes = getChangedFields(original, updated);
  return Object.keys(changes).length > 0;
};

/**
 * Format date string for display
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

/**
 * Validate template name
 * Only allows: alphabets (a-z, A-Z), numbers (0-9), and underscore (_)
 */
export const validateTemplateName = (name: string): string | null => {
  if (!name || name.trim() === '') {
    return 'Template name is required';
  }

  if (name.length < 2) {
    return 'Template name must be at least 2 characters';
  }

  if (name.length > 100) {
    return 'Template name must be less than 100 characters';
  }

  // Only allow alphabets, numbers, and underscores (no spaces, no hyphens)
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return 'Template name can only contain letters, numbers, and underscores (no spaces)';
  }

  return null;
};

/**
 * Sanitize template name input - removes any invalid characters
 * Only allows: alphabets (a-z, A-Z), numbers (0-9), and underscore (_)
 */
export const sanitizeTemplateName = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9_]/g, '');
};
