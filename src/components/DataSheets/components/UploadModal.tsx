"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Upload, Button, Input, Typography, Steps, message, Select } from 'antd';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { ACCEPTED_FILE_TYPES } from '../constants';
import type {
  ColumnMapping,
  ValidationRule,
  ValidationMethod
} from '../types';
import {
  fetchDatasheetTemplate,
  fetchValidationMethods
} from '../services/api';
import { extractColumnsFromFile } from '../utils/fileUtils';
import ColumnMappingStep from './ColumnMappingStep';
import ValidationRulesStep from './ValidationRulesStep';
import { useRoomAPI } from '@/hooks/useRoomAPI';

const { Text } = Typography;

// Tag options
const TAG_OPTIONS = [
  { value: 'test', label: 'Test' },
  { value: 'production', label: 'Production' }
];

interface UploadOptions {
  file: RcFile;
  customName: string;
  mapping: ColumnMapping;
  rules: Record<string, ValidationRule[]>;
  projectType?: string;
  tag?: string;
}

interface UploadModalProps {
  visible: boolean;
  loading: boolean;
  customName: string;
  uploadFile: RcFile | null;
  columnMapping: ColumnMapping;
  validationRules: Record<string, ValidationRule[]>;
  onCancel: () => void;
  onUpload: (options: UploadOptions) => void;
  onCustomNameChange: (value: string) => void;
  onFileChange: (info: UploadChangeParam<UploadFile>) => void;
  onColumnMappingChange: (mapping: ColumnMapping) => void;
  onValidationRulesChange: (rules: Record<string, ValidationRule[]>) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  visible,
  loading,
  customName,
  uploadFile,
  columnMapping,
  validationRules,
  onCancel,
  onUpload,
  onCustomNameChange,
  onFileChange,
  onColumnMappingChange,
  onValidationRulesChange
}) => {
  const { selectedRoom } = useRoomAPI();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [requiredColumns, setRequiredColumns] = useState<string[]>([]);
  const [validationMethods, setValidationMethods] = useState<ValidationMethod[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [projectType, setProjectType] = useState<string>('bucketx');
  const [tag, setTag] = useState<string>('test');

  const loadTemplateAndMethods = useCallback(async () => {
    try {
      const [templateRes, methodsRes] = await Promise.all([
        fetchDatasheetTemplate(selectedRoom),
        fetchValidationMethods(selectedRoom)
      ]);

      if (templateRes.status === 'success' && templateRes.template) {
        setRequiredColumns(templateRes.template.required_columns);
      }

      if (methodsRes.success && methodsRes.methods) {
        setValidationMethods(methodsRes.methods);
      }
    } catch (error) {
      console.error('Failed to load template and methods:', error);
      message.error('Failed to load configuration. Please try again.');
    }
  }, [selectedRoom]);

  // Load template and validation methods when modal opens
  useEffect(() => {
    if (visible) {
      loadTemplateAndMethods();
    }
  }, [visible, loadTemplateAndMethods]);

  // Extract columns when file is uploaded
  useEffect(() => {
    if (uploadFile && currentStep === 0) {
      extractColumns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadFile]);

  const extractColumns = async () => {
    if (!uploadFile) return;

    setExtracting(true);
    try {
      const columns = await extractColumnsFromFile(uploadFile, selectedRoom);
      setFileColumns(columns);
      if (columns.length === 0) {
        message.warning('No columns found in file. Please ensure the file has a header row.');
      }
    } catch (error) {
      console.error('Failed to extract columns:', error);
      message.error('Failed to read file columns. Please ensure the file is valid.');
    } finally {
      setExtracting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && !uploadFile) {
      message.warning('Please select a file first');
      return;
    }

    if (currentStep === 1) {
      // Check if all required columns are mapped
      const mappedTargetColumns = new Set(Object.values(columnMapping));
      const allRequiredMapped = requiredColumns.every(col => mappedTargetColumns.has(col));

      if (!allRequiredMapped) {
        message.warning('Please map all required columns before proceeding');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFinish = () => {
    if (!uploadFile) {
      message.error('No file selected');
      return;
    }

    onUpload({
      file: uploadFile,
      customName,
      mapping: columnMapping,
      rules: validationRules,
      projectType,
      tag: tag || 'test'
    });
  };

  const handleModalCancel = () => {
    setCurrentStep(0);
    setFileColumns([]);
    setProjectType('bucketx');
    setTag('test');
    onCancel();
  };

  const steps = [
    {
      title: 'Upload File',
      description: 'Select file and enter details'
    },
    {
      title: 'Map Columns',
      description: 'Map file columns to template'
    },
    {
      title: 'Validation Rules',
      description: 'Configure validation rules'
    }
  ];

  return (
    <Modal
      title={
        <div style={{ color: '#263878', fontSize: '18px' }}>
          <CloudUploadOutlined className="mr-2" />
          Upload New Datasheet
        </div>
      }
      open={visible}
      onCancel={handleModalCancel}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div className="space-y-6">
        <Steps current={currentStep} items={steps} size="small" />

        <div style={{ minHeight: '400px', maxHeight: '500px', overflowY: 'auto', padding: '16px 0' }}>
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Select File</label>
                <Upload
                  beforeUpload={(file: RcFile) => {
                    onFileChange({
                      file: { ...file, status: 'done', originFileObj: file },
                      fileList: []
                    });
                    return false;
                  }}
                  onRemove={() => {
                    onFileChange({
                      file: { status: 'removed' } as any,
                      fileList: []
                    });
                    setFileColumns([]);
                  }}
                  maxCount={1}
                  accept={ACCEPTED_FILE_TYPES}
                  fileList={uploadFile ? [{
                    uid: uploadFile.uid || Date.now().toString(),
                    name: uploadFile.name,
                    status: 'done' as const,
                    originFileObj: uploadFile
                  }] : []}
                  showUploadList={{
                    showRemoveIcon: true,
                    showPreviewIcon: false
                  }}
                >
                  <Button
                    icon={<UploadOutlined />}
                    size="large"
                    style={{ width: '100%', height: '60px' }}
                    disabled={!!uploadFile}
                    loading={extracting}
                  >
                    {extracting
                      ? 'Extracting columns...'
                      : uploadFile
                      ? `Selected: ${uploadFile.name}`
                      : 'Choose CSV File'}
                  </Button>
                </Upload>
                <Text type="warning" className="text-xs mt-2 block" style={{ color: '#faad14' }}>
                  Note: Only CSV files are supported for upload.
                </Text>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Custom Name</label>
                <Input
                  placeholder="Enter a custom name for this datasheet"
                  value={customName}
                  onChange={e => onCustomNameChange(e.target.value)}
                  size="large"
                  maxLength={100}
                  style={{ width: '100%' }}
                />
                <Text type="secondary" className="text-xs mt-2 block">
                  Optional: Give this datasheet a custom name for easier identification.
                </Text>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Project Type</label>
                <Input
                  placeholder="Enter project type (e.g., bucketx, collection)"
                  value={projectType}
                  onChange={e => setProjectType(e.target.value)}
                  size="large"
                  maxLength={50}
                  style={{ width: '100%' }}
                />
                <Text type="secondary" className="text-xs mt-2 block">
                  Enter the project type for this datasheet.
                </Text>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Tag</label>
                <Select
                  value={tag}
                  onChange={setTag}
                  size="large"
                  style={{ width: '100%' }}
                  options={TAG_OPTIONS}
                />
                <Text type="secondary" className="text-xs mt-2 block">
                  Select a tag for categorization.
                </Text>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <ColumnMappingStep
              fileColumns={fileColumns}
              requiredColumns={requiredColumns}
              columnMapping={columnMapping}
              onMappingChange={onColumnMappingChange}
            />
          )}

          {currentStep === 2 && (
            <ValidationRulesStep
              columnMapping={columnMapping}
              requiredColumns={requiredColumns}
              validationMethods={validationMethods}
              validationRules={validationRules}
              onValidationRulesChange={onValidationRulesChange}
            />
          )}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button size="large" onClick={handleModalCancel}>
            Cancel
          </Button>

          <div className="space-x-3">
            {currentStep > 0 && (
              <Button size="large" onClick={handlePrevious}>
                Previous
              </Button>
            )}

            {currentStep < steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                onClick={handleNext}
                disabled={!uploadFile || extracting}
                style={{
                  backgroundColor: '#263878',
                  borderColor: '#263878'
                }}
              >
                Next
              </Button>
            )}

            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                onClick={handleFinish}
                loading={loading}
                style={{
                  backgroundColor: '#263878',
                  borderColor: '#263878'
                }}
              >
                {loading ? 'Uploading...' : 'Upload Datasheet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;