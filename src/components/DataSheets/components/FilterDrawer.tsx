import React from 'react';
import { Drawer, Button, Select, DatePicker, Input } from 'antd';
import type { Dayjs } from 'dayjs';
import { FilterOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

// Tag options
const TAG_OPTIONS = [
  { value: '', label: 'All Tags' },
  { value: 'test', label: 'Test' },
  { value: 'production', label: 'Production' }
];

interface FilterDrawerProps {
  visible: boolean;
  dateRange: [Dayjs | null, Dayjs | null];
  tag: string;
  projectType: string;
  filename: string;
  onClose: () => void;
  onDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onTagChange: (value: string) => void;
  onProjectTypeChange: (value: string) => void;
  onFilenameChange: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  visible,
  dateRange,
  tag,
  projectType,
  filename,
  onClose,
  onDateRangeChange,
  onTagChange,
  onProjectTypeChange,
  onFilenameChange,
  onApplyFilters,
  onClearFilters
}) => {
  return (
    <Drawer
      title={
        <div style={{ color: '#263878', fontSize: '18px' }}>
          <FilterOutlined className="mr-2" />
          Advanced Filters
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Filename</label>
          <Input
            placeholder="Search by filename..."
            value={filename}
            onChange={(e) => onFilenameChange(e.target.value)}
            size="large"
            allowClear
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Tag</label>
          <Select
            placeholder="Select tag"
            value={tag || undefined}
            onChange={onTagChange}
            style={{ width: '100%' }}
            size="large"
            allowClear
            options={TAG_OPTIONS}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Project Type</label>
          <Input
            placeholder="Filter by project type..."
            value={projectType}
            onChange={(e) => onProjectTypeChange(e.target.value)}
            size="large"
            allowClear
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Date Range</label>
          <RangePicker
            style={{ width: '100%' }}
            value={dateRange}
            onChange={onDateRangeChange}
            size="large"
          />
        </div>

        <div className="pt-4 space-y-3">
          <Button
            type="primary"
            size="large"
            block
            onClick={onApplyFilters}
            style={{ backgroundColor: '#263878', borderColor: '#263878' }}
          >
            Apply Filters
          </Button>
          <Button
            size="large"
            block
            onClick={onClearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default FilterDrawer;
