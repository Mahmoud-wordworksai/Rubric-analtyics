// Template API Services
// Note: Room parameter is automatically added by axios interceptor from URL query params

import axiosInstance from '@/lib/axios';
import {
  TemplateListResponse,
  TemplateResponse,
  TemplateCreatePayload,
  TemplateUpdatePayload,
} from './types';

const API_PREFIX = '/app-template';

/**
 * Create a new template
 */
export const createTemplate = async (
  payload: TemplateCreatePayload
): Promise<TemplateResponse> => {
  const response = await axiosInstance.post(`${API_PREFIX}/create`, payload);
  return response.data;
};

/**
 * Get template by ID
 */
export const getTemplateById = async (
  templateId: string
): Promise<TemplateResponse> => {
  const response = await axiosInstance.get(`${API_PREFIX}/get/${templateId}`);
  return response.data;
};

/**
 * Get template by name
 */
export const getTemplateByName = async (
  name: string
): Promise<TemplateResponse> => {
  const response = await axiosInstance.get(`${API_PREFIX}/get-by-name/${encodeURIComponent(name)}`);
  return response.data;
};

/**
 * List all templates with pagination
 */
export const listTemplates = async (
  params: { page?: number; limit?: number } = {}
): Promise<TemplateListResponse> => {
  const response = await axiosInstance.get(`${API_PREFIX}/list`, {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
  });
  return response.data;
};

/**
 * Update template by ID (full update)
 */
export const updateTemplateById = async (
  templateId: string,
  payload: TemplateUpdatePayload
): Promise<TemplateResponse> => {
  const response = await axiosInstance.put(`${API_PREFIX}/update/${templateId}`, payload);
  return response.data;
};

/**
 * Update template by name (full update)
 */
export const updateTemplateByName = async (
  name: string,
  payload: TemplateUpdatePayload
): Promise<TemplateResponse> => {
  const response = await axiosInstance.put(`${API_PREFIX}/update-by-name/${encodeURIComponent(name)}`, payload);
  return response.data;
};

/**
 * Partial update template by ID (PATCH - only changed fields)
 */
export const patchTemplate = async (
  templateId: string,
  payload: TemplateUpdatePayload
): Promise<TemplateResponse> => {
  const response = await axiosInstance.patch(`${API_PREFIX}/patch/${templateId}`, payload);
  return response.data;
};

/**
 * Delete template by ID
 */
export const deleteTemplateById = async (
  templateId: string
): Promise<TemplateResponse> => {
  const response = await axiosInstance.delete(`${API_PREFIX}/delete/${templateId}`);
  return response.data;
};

/**
 * Delete template by name
 */
export const deleteTemplateByName = async (
  name: string
): Promise<TemplateResponse> => {
  const response = await axiosInstance.delete(`${API_PREFIX}/delete-by-name/${encodeURIComponent(name)}`);
  return response.data;
};

/**
 * Health check
 */
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await axiosInstance.get(`${API_PREFIX}/health`);
  return response.data;
};
