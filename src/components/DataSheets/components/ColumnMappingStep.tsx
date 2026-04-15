import React from 'react';
import { Select, Tag, Typography, Alert, Divider, Card, Button, Space, message } from 'antd';
import { ThunderboltOutlined, ClearOutlined } from '@ant-design/icons';
import type { ColumnMapping } from '../types';

const { Text, Title } = Typography;

// Normalize string for comparison - remove special characters, lowercase
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[_\-\s.]/g, '')
    .trim();
};

// Calculate similarity score between two strings
const calculateSimilarity = (str1: string, str2: string): number => {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);

  // Exact match after normalization
  if (norm1 === norm2) return 1;

  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;

  // Check for common substrings
  const shorter = norm1.length < norm2.length ? norm1 : norm2;
  const longer = norm1.length < norm2.length ? norm2 : norm1;

  let matchCount = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matchCount++;
  }

  return matchCount / longer.length;
};

interface ColumnMappingStepProps {
  fileColumns: string[];
  requiredColumns: string[];
  columnMapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  fileColumns,
  requiredColumns,
  columnMapping,
  onMappingChange
}) => {
  // Reverse mapping: required field -> source column
  const getSourceColumnForRequired = (requiredField: string): string | undefined => {
    return Object.keys(columnMapping).find(key => columnMapping[key] === requiredField);
  };

  const handleRequiredFieldMap = (requiredField: string, sourceColumn: string | null) => {
    const newMapping = { ...columnMapping };

    // Remove any existing mapping to this required field
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === requiredField) {
        delete newMapping[key];
      }
    });

    // Add new mapping if source column is selected
    if (sourceColumn) {
      newMapping[sourceColumn] = requiredField;
    }

    onMappingChange(newMapping);
  };

  // Auto map columns based on name similarity
  const handleAutoMap = () => {
    const newMapping: ColumnMapping = {};
    const usedFileColumns = new Set<string>();
    let mappedCount = 0;

    // For each required column, find the best matching file column
    for (const requiredCol of requiredColumns) {
      let bestMatch: string | null = null;
      let bestScore = 0;

      for (const fileCol of fileColumns) {
        // Skip already used columns
        if (usedFileColumns.has(fileCol)) continue;

        const score = calculateSimilarity(requiredCol, fileCol);

        // Only consider matches with score >= 0.6
        if (score >= 0.6 && score > bestScore) {
          bestScore = score;
          bestMatch = fileCol;
        }
      }

      if (bestMatch) {
        newMapping[bestMatch] = requiredCol;
        usedFileColumns.add(bestMatch);
        mappedCount++;
      }
    }

    if (mappedCount > 0) {
      onMappingChange(newMapping);
      message.success(`Auto-mapped ${mappedCount} of ${requiredColumns.length} columns`);
    } else {
      message.warning('No matching columns found. Please map manually.');
    }
  };

  // Clear all mappings
  const handleClearAll = () => {
    onMappingChange({});
    message.info('All mappings cleared');
  };

  // Check if all required columns are mapped
  const getMappedRequiredColumns = () => {
    return requiredColumns.filter(reqCol =>
      Object.values(columnMapping).includes(reqCol)
    );
  };

  const mappedRequiredColumns = getMappedRequiredColumns();
  const allRequiredMapped = mappedRequiredColumns.length === requiredColumns.length;

  // Get already mapped source columns
  const getMappedSourceColumns = () => {
    return new Set(Object.keys(columnMapping));
  };

  const mappedSourceColumns = getMappedSourceColumns();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Title level={5} style={{ color: '#263878', marginBottom: '8px' }}>
            Map File Columns to Required Fields
          </Title>
          <Text type="secondary">
            Select which column from your file corresponds to each required field.
            All required fields must be mapped to proceed.
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleAutoMap}
            disabled={fileColumns.length === 0}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Auto Map
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearAll}
            disabled={Object.keys(columnMapping).length === 0}
          >
            Clear All
          </Button>
        </Space>
      </div>

      {!allRequiredMapped && (
        <Alert
          message="Required Fields Mapping"
          description={`${mappedRequiredColumns.length} of ${requiredColumns.length} required fields mapped. Please map all required fields to continue.`}
          type="warning"
          showIcon
        />
      )}

      {allRequiredMapped && (
        <Alert
          message="All Required Fields Mapped"
          description="All required fields have been mapped successfully. You can proceed to the next step."
          type="success"
          showIcon
        />
      )}

      <Divider />

      <div>
        <Text strong style={{ fontSize: '14px', marginBottom: '12px', display: 'block' }}>
          Map Required Fields ({mappedRequiredColumns.length}/{requiredColumns.length})
        </Text>
        {/* <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '16px' }}>
          Available file columns: {fileColumns.join(', ')}
        </Text> */}

        <div className="space-y-3">
          {requiredColumns.map(requiredField => {
            const mappedSource = getSourceColumnForRequired(requiredField);
            const isMapped = !!mappedSource;

            return (
              <Card
                key={requiredField}
                size="small"
                style={{
                  borderColor: isMapped ? '#52c41a' : '#d9d9d9',
                  backgroundColor: isMapped ? '#f6ffed' : '#ffffff'
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Tag color={isMapped ? 'success' : 'default'}>
                        Required Field
                      </Tag>
                      <Text strong style={{ fontSize: '13px' }}>
                        {requiredField}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center justify-center" style={{ width: '40px' }}>
                    <Text type="secondary">←</Text>
                  </div>
                  <div className="flex-1">
                    <Select
                      placeholder="Select source column from file"
                      value={mappedSource || null}
                      onChange={(value) => handleRequiredFieldMap(requiredField, value)}
                      style={{ width: '100%' }}
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={fileColumns.map(col => ({
                        value: col,
                        label: col,
                        disabled: mappedSourceColumns.has(col) && mappedSource !== col
                      }))}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Divider />

      <div className="bg-gray-50 p-4 rounded">
        <Text strong style={{ fontSize: '13px' }}>Mapping Summary</Text>
        <div className="mt-2 space-y-1">
          <Text style={{ fontSize: '12px', display: 'block' }}>
            Total required fields: <strong>{requiredColumns.length}</strong>
          </Text>
          <Text style={{ fontSize: '12px', display: 'block' }}>
            Mapped fields: <strong>{mappedRequiredColumns.length}</strong>
          </Text>
          <Text style={{ fontSize: '12px', display: 'block' }}>
            Unmapped fields: <strong>{requiredColumns.length - mappedRequiredColumns.length}</strong>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default ColumnMappingStep;
