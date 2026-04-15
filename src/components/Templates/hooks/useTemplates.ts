// useTemplates Hook - State management for Templates
// Note: Room parameter is automatically handled by axios interceptor from URL query params

import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import {
  Template,
  TemplatesState,
  DEFAULT_PAGINATION,
  TemplateCreatePayload,
} from '../types';
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  patchTemplate,
  deleteTemplateById,
} from '../api';
import { getChangedFields, hasChanges, deepClone, normalizeTemplates, normalizeTemplate } from '../utils';

interface UseTemplatesOptions {
  autoFetch?: boolean;
}

export const useTemplates = (options: UseTemplatesOptions = {}) => {
  const { autoFetch = true } = options;

  const [state, setState] = useState<TemplatesState>({
    templates: [],
    selectedTemplate: null,
    loading: false,
    detailLoading: false,
    saving: false,
    error: null,
    pagination: DEFAULT_PAGINATION,
  });

  // Original template for tracking changes
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);

  // Edited template (working copy)
  const [editedTemplate, setEditedTemplate] = useState<Template | null>(null);

  /**
   * Fetch list of templates
   */
  const fetchTemplates = useCallback(
    async (page?: number, limit?: number) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await listTemplates({
          page: page || state.pagination.page,
          limit: limit || state.pagination.limit,
        });

        // API returns { templates: [...] } - normalize MongoDB format
        const rawTemplates = response.templates || response.data || response.results || [];
        const templates = normalizeTemplates(rawTemplates);

        // Handle pagination - API returns { skip, limit, total, returned }
        const paginationData = response.pagination;
        const currentPage = paginationData?.page ?? Math.floor((paginationData?.skip || 0) / (paginationData?.limit || 20)) + 1;
        const total = paginationData?.total ?? paginationData?.totalResults ?? templates.length;

        setState((prev) => ({
          ...prev,
          templates,
          loading: false,
          pagination: {
            page: currentPage,
            limit: paginationData?.limit || state.pagination.limit,
            total,
          },
        }));
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch templates';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        message.error(errorMessage);
      }
    },
    [state.pagination.page, state.pagination.limit]
  );

  /**
   * Select a template (open in detail view)
   */
  const selectTemplate = useCallback(async (template: Template) => {
    setState((prev) => ({ ...prev, detailLoading: true, error: null }));

    try {
      // Fetch fresh data from server
      const response = await getTemplateById(template._id!);
      const rawTemplate = response.template || response.data;

      // Normalize MongoDB format or use the already normalized template
      const freshTemplate = rawTemplate ? normalizeTemplate(rawTemplate) : template;

      setState((prev) => ({
        ...prev,
        selectedTemplate: freshTemplate,
        detailLoading: false,
      }));

      // Set both original and edited to the fresh data
      setOriginalTemplate(deepClone(freshTemplate));
      setEditedTemplate(deepClone(freshTemplate));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch template details';
      setState((prev) => ({
        ...prev,
        detailLoading: false,
        error: errorMessage,
      }));
      message.error(errorMessage);
    }
  }, []);

  /**
   * Close detail view
   */
  const closeDetail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedTemplate: null,
    }));
    setOriginalTemplate(null);
    setEditedTemplate(null);
  }, []);

  /**
   * Update edited template (local state only)
   */
  const updateEditedTemplate = useCallback((updates: Partial<Template>) => {
    setEditedTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  /**
   * Update nested field in edited template
   */
  const updateNestedField = useCallback((path: string, value: unknown) => {
    setEditedTemplate((prev) => {
      if (!prev) return prev;

      const cloned = deepClone(prev);
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
    });
  }, []);

  /**
   * Save changes (only sends changed fields via PATCH)
   */
  const saveChanges = useCallback(async () => {
    if (!originalTemplate || !editedTemplate) {
      message.warning('No template selected');
      return false;
    }

    if (!hasChanges(originalTemplate, editedTemplate)) {
      message.info('No changes to save');
      return false;
    }

    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      const changedFields = getChangedFields(originalTemplate, editedTemplate);

      console.log('Saving only changed fields:', changedFields);

      const response = await patchTemplate(editedTemplate._id!, changedFields);

      // Normalize the response to ensure proper Template type
      const rawUpdatedTemplate = response.data || response.template;
      const updatedTemplate = rawUpdatedTemplate ? normalizeTemplate(rawUpdatedTemplate) : editedTemplate;

      // Update local state
      setState((prev) => ({
        ...prev,
        selectedTemplate: updatedTemplate,
        templates: prev.templates.map((t) =>
          t._id === updatedTemplate._id ? updatedTemplate : t
        ),
        saving: false,
      }));

      // Reset tracking
      setOriginalTemplate(deepClone(updatedTemplate));
      setEditedTemplate(deepClone(updatedTemplate));

      message.success('Template saved successfully');
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save template';
      setState((prev) => ({
        ...prev,
        saving: false,
        error: errorMessage,
      }));
      message.error(errorMessage);
      return false;
    }
  }, [originalTemplate, editedTemplate]);

  /**
   * Discard changes (revert to original)
   */
  const discardChanges = useCallback(() => {
    if (originalTemplate) {
      setEditedTemplate(deepClone(originalTemplate));
      message.info('Changes discarded');
    }
  }, [originalTemplate]);

  /**
   * Create a new template
   */
  const createNewTemplate = useCallback(async (payload: TemplateCreatePayload) => {
    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      const response = await createTemplate(payload);

      // API returns { status, message, id, name } - not full template data
      // So we need to refresh the list to get the full template
      if (response.status === 'success') {
        message.success(response.message || 'Template created successfully');

        // Refresh the templates list to get the new template
        await fetchTemplates();

        setState((prev) => ({ ...prev, saving: false }));
        return { id: response.id, name: response.name };
      } else {
        throw new Error(response.message || 'Failed to create template');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create template';
      setState((prev) => ({
        ...prev,
        saving: false,
        error: errorMessage,
      }));
      message.error(errorMessage);
      return null;
    }
  }, [fetchTemplates]);

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(
    async (templateId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await deleteTemplateById(templateId);

        setState((prev) => ({
          ...prev,
          templates: prev.templates.filter((t) => t._id !== templateId),
          selectedTemplate:
            prev.selectedTemplate?._id === templateId ? null : prev.selectedTemplate,
          loading: false,
        }));

        // Clear editing state if deleted template was selected
        if (editedTemplate?._id === templateId) {
          setOriginalTemplate(null);
          setEditedTemplate(null);
        }

        message.success('Template deleted successfully');
        return true;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete template';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        message.error(errorMessage);
        return false;
      }
    },
    [editedTemplate]
  );

  /**
   * Change pagination
   */
  const setPagination = useCallback((page: number, limit?: number) => {
    setState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page,
        limit: limit || prev.pagination.limit,
      },
    }));
  }, []);

  /**
   * Refresh templates list
   */
  const refresh = useCallback(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  /**
   * Check if there are unsaved changes
   */
  const hasUnsavedChanges = useCallback(() => {
    if (!originalTemplate || !editedTemplate) return false;
    return hasChanges(originalTemplate, editedTemplate);
  }, [originalTemplate, editedTemplate]);

  /**
   * Get changed fields for preview
   */
  const getChanges = useCallback(() => {
    if (!originalTemplate || !editedTemplate) return {};
    return getChangedFields(originalTemplate, editedTemplate);
  }, [originalTemplate, editedTemplate]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchTemplates();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when pagination changes
  useEffect(() => {
    if (autoFetch) {
      fetchTemplates(state.pagination.page, state.pagination.limit);
    }
  }, [state.pagination.page, state.pagination.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    ...state,
    editedTemplate,
    originalTemplate,

    // Actions
    fetchTemplates,
    selectTemplate,
    closeDetail,
    updateEditedTemplate,
    updateNestedField,
    saveChanges,
    discardChanges,
    createNewTemplate,
    deleteTemplate,
    setPagination,
    refresh,

    // Helpers
    hasUnsavedChanges,
    getChanges,
  };
};

export default useTemplates;
