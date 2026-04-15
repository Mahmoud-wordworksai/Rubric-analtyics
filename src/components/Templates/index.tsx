// Templates Component - Main view with 80/20 split layout

'use client';

import React, { useState, useEffect } from 'react';
import { Empty, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useTemplates } from './hooks/useTemplates';
import { TemplatesList, TemplateDetail, CreateTemplateModal } from './components';

const { Text } = Typography;

// Hook to track window width for responsive behavior
const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};

// Note: Room parameter is automatically handled by axios interceptor from URL query params
const Templates: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

  const {
    templates,
    selectedTemplate,
    editedTemplate,
    originalTemplate,
    loading,
    detailLoading,
    saving,
    selectTemplate,
    closeDetail,
    updateEditedTemplate,
    updateNestedField,
    saveChanges,
    discardChanges,
    createNewTemplate,
    deleteTemplate,
    refresh,
    hasUnsavedChanges,
    getChanges,
  } = useTemplates();

  const handleCreate = async (payload: Parameters<typeof createNewTemplate>[0]) => {
    const result = await createNewTemplate(payload);
    if (result) {
      setCreateModalOpen(false);
    }
    return result;
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    closeDetail();
  };

  // Determine if detail view should be shown
  const showDetailView = selectedTemplate !== null && editedTemplate !== null;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        background: '#f5f5f5',
        gap: '1px',
      }}
    >
      {/* Templates List - 20% when detail is open, 100% otherwise, hidden on mobile when detail open */}
      <div
        style={{
          width: showDetailView ? '20%' : '100%',
          minWidth: showDetailView ? '220px' : undefined,
          maxWidth: showDetailView ? '300px' : undefined,
          background: '#fff',
          borderRight: showDetailView ? '1px solid #e8e8e8' : 'none',
          transition: 'width 0.3s ease',
          display: showDetailView && isMobile ? 'none' : 'block',
        }}
      >
        <TemplatesList
          templates={templates}
          selectedTemplate={selectedTemplate}
          loading={loading}
          hasUnsavedChanges={hasUnsavedChanges()}
          onSelect={selectTemplate}
          onDelete={deleteTemplate}
          onCreate={() => setCreateModalOpen(true)}
          onRefresh={refresh}
        />
      </div>

      {/* Template Detail - 80% when open, 100% on mobile */}
      {showDetailView ? (
        <div
          style={{
            flex: 1,
            width: isMobile ? '100%' : undefined,
            background: '#fff',
            overflow: 'hidden',
          }}
        >
          <TemplateDetail
            template={editedTemplate}
            originalTemplate={originalTemplate}
            loading={detailLoading}
            saving={saving}
            hasUnsavedChanges={hasUnsavedChanges()}
            changedFields={getChanges()}
            onUpdate={updateEditedTemplate}
            onUpdateNested={updateNestedField}
            onSave={saveChanges}
            onDiscard={discardChanges}
            onClose={handleClose}
          />
        </div>
      ) : (
        /* Placeholder when no template is selected - show only when list is at 100% width */
        !showDetailView && templates.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              display: 'none', // Hidden by default since list takes full width
            }}
          >
            <Empty
              image={
                <FileTextOutlined
                  style={{ fontSize: '64px', color: '#d9d9d9' }}
                />
              }
              description={
                <Text type="secondary">
                  Select a template from the list to view and edit
                </Text>
              }
            />
          </div>
        )
      )}

      {/* Create Template Modal */}
      <CreateTemplateModal
        open={createModalOpen}
        loading={saving}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default Templates;

// Named exports
export { Templates };
export * from './types';
export * from './api';
export * from './utils';
export { useTemplates } from './hooks/useTemplates';
