/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  Input,
  Spin,
  message,
  Button
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fetchDatasheets as apiFetchDatasheets,
} from './DataSheets/services/api'; // Adjust the import path as needed
import { useRoomAPI } from '@/hooks/useRoomAPI';

const { Option } = Select;

interface DatasheetPart {
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

interface Datasheet {
  _id: string;
  group_id?: string;
  filename: string;
  project_type?: string | null;
  tag?: string | null;
  total_rows: number;
  parts_count: number;
  total_parts: number;
  parts: DatasheetPart[];
  part_number?: number;
  part_filename?: string;
  extension?: string;
  created_at: string;
  updated_at?: string | null;
  is_moving?: boolean;
  room_display?: string;
  room?: string;
}

interface FilterState {
  searchTerm: string;
}

interface DatasheetDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  mode?: 'single' | 'multiple';
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

const DatasheetDropdown: React.FC<DatasheetDropdownProps> = ({
  value,
  onChange,
  placeholder = "Choose a datasheet",
  mode = 'single',
  className = '',
  disabled = false,
  allowClear = true
}) => {
  const { selectedRoom } = useRoomAPI();
  const [datasheets, setDatasheets] = useState<Datasheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: ''
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Debounced search function
  const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Fetch datasheets function
  const fetchDatasheets = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = {
        current: 1,
        pageSize: 100, // Fetch more items for dropdown
        searchTerm: filterState.searchTerm,
        room: selectedRoom
      };

      const response = await apiFetchDatasheets(searchParams);

      // Flatten parts into individual datasheet entries
      const flattenedDatasheets: Datasheet[] = [];

      (response.results || []).forEach((item: any) => {
        const parts = item.parts || [];
        const totalParts = parts.length;

        parts.forEach((part: any) => {
          flattenedDatasheets.push({
            _id: part._id,
            group_id: item.group_id,
            filename: item.filename,
            project_type: item.project_type,
            tag: item.tag,
            total_rows: part.row_count,
            parts_count: totalParts,
            total_parts: item.total_parts || totalParts,
            parts: [part],
            part_number: part.part,
            part_filename: part.filename,
            extension: part.extension,
            created_at: part.created_at?.$date || part.created_at || item.created_at?.$date || item.created_at,
            updated_at: item.updated_at?.$date || item.updated_at || null,
            is_moving: part.is_moving || false,
            room_display: part.room_display,
            room: part.room
          });
        });
      });

      setDatasheets(flattenedDatasheets);
    } catch (error) {
      message.error('Failed to fetch datasheets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterState, selectedRoom]);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce(fetchDatasheets, 300),
    [fetchDatasheets]
  );

  // Effect to fetch data when filters change
  useEffect(() => {
    if (dropdownOpen) {
      debouncedFetch();
    }
  }, [filterState, debouncedFetch, dropdownOpen]);

  // Initial fetch when dropdown opens
  useEffect(() => {
    if (dropdownOpen && datasheets.length === 0) {
      fetchDatasheets();
    }
  }, [dropdownOpen, datasheets.length, fetchDatasheets]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterState(prev => ({
      ...prev,
      searchTerm: e.target.value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterState({
      searchTerm: ''
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filterState.searchTerm;

  // Custom dropdown render
  const dropdownRender = (menu: React.ReactElement) => (
    <div>
      {/* Search Bar */}
      <div style={{ 
        borderBottom: '1px solid #d9d9d9', 
        padding: '8px 12px', 
        backgroundColor: '#fafafa' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '8px' 
        }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>
            Datasheets ({datasheets.length})
          </span>
          {hasActiveFilters && (
            <Button 
              size="small" 
              onClick={clearFilters}
              icon={<ClearOutlined />}
              type="text"
            >
              Clear
            </Button>
          )}
        </div>
        
        {/* Search input */}
        <Input
          placeholder="Search datasheets..."
          value={filterState.searchTerm}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          size="small"
          allowClear
        />
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <Spin size="small" />
        </div>
      )}

      {/* Menu items - Always render the menu */}
      {!loading && (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {menu}
        </div>
      )}

      {/* No results */}
      {!loading && datasheets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#666' }}>
          <div>No datasheets found</div>
          {hasActiveFilters && (
            <Button 
              type="link" 
              size="small" 
              onClick={clearFilters}
              style={{ marginTop: '4px' }}
            >
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Select
      className={className}
      style={{
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '0'
      }}
      placeholder={<span style={{ color: '#9ca3af' }}>{placeholder}</span>}
      value={value || undefined}
      onChange={onChange}
      mode={mode === 'multiple' ? 'multiple' : undefined}
      disabled={disabled}
      allowClear={allowClear}
      loading={loading}
      size="large"
      variant="borderless"
      open={dropdownOpen}
      onDropdownVisibleChange={(open) => {
        setDropdownOpen(open);
      }}
      dropdownRender={dropdownRender}
      showSearch={false}
      filterOption={false}
      notFoundContent={loading ? <Spin size="small" /> : null}
      dropdownStyle={{
        padding: 0
      }}
      optionLabelProp="label"
    >
      {datasheets.map((datasheet) => {
        const displayName = datasheet.parts_count > 1
          ? `${datasheet.filename} (Part ${datasheet.part_number})`
          : datasheet.filename;

        const isDisabled = datasheet.is_moving || datasheet.room_display !== 'current';

        return (
          <Option
            key={datasheet._id}
            value={datasheet._id}
            label={displayName} // Use filename with part as label for selected display
            disabled={isDisabled}
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #f0f0f0',
              opacity: isDisabled ? 0.6 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              color: '#000'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 500,
                  color: '#000',
                  fontSize: '14px',
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{datasheet.filename}</span>
                  {datasheet.parts_count > 1 && (
                    <span style={{
                      backgroundColor: '#1890ff20',
                      color: '#1890ff',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      Part {datasheet.part_number}
                    </span>
                  )}
                  {datasheet.is_moving && (
                    <span style={{
                      backgroundColor: '#faad1420',
                      color: '#faad14',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      Moving
                    </span>
                  )}
                  {!datasheet.is_moving && datasheet.room_display !== 'current' && (
                    <span style={{
                      backgroundColor: '#722ed120',
                      color: '#722ed1',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {datasheet.room || 'Other room'}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span>{(datasheet.total_rows || 0).toLocaleString()} rows</span>
                  {datasheet.extension && (
                    <>
                      <span>•</span>
                      <span>{datasheet.extension.toUpperCase()}</span>
                    </>
                  )}
                  {datasheet.tag && (
                    <>
                      <span>•</span>
                      <span style={{
                        backgroundColor: datasheet.tag === 'production' ? '#52c41a20' : '#faad1420',
                        color: datasheet.tag === 'production' ? '#52c41a' : '#faad14',
                        padding: '0 4px',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}>
                        {datasheet.tag}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: '12px',
                color: '#666',
                marginLeft: '8px',
                textAlign: 'right'
              }}>
                {dayjs(datasheet.created_at).format('MMM DD, YYYY')}
              </span>
            </div>
          </Option>
        );
      })}
    </Select>
  );
};

export default DatasheetDropdown;