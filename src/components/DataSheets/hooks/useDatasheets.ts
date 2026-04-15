/* eslint-disable react-hooks/exhaustive-deps */
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { message } from 'antd';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import type { TablePaginationConfig } from 'antd/es/table';
import type { ColumnsType } from 'antd/es/table';
import {
  Datasheet,
  DatasheetPart,
  DatasheetRow,
  PaginationState,
  ModalState,
  FileState,
  FilterState,
  ColumnMapping,
  ValidationRule
} from '../types';
import {
  fetchDatasheets as apiFetchDatasheets,
  fetchDatasheetRows as apiFetchDatasheetRows,
  uploadDatasheetWithMapping,
  updateDatasheetFromFile,
  deleteDatasheet,
  restoreDatasheetVersion as apiRestoreDatasheetVersion,
  moveDatasheetParts,
  getUploadJobStatus
} from '../services/api';
import { processRowsData, generateColumns } from '../utils';
import { DEFAULT_PAGINATION, DEFAULT_ROWS_PAGINATION } from '../constants';
import { useRoomAPI } from '@/hooks/useRoomAPI';

export const useDatasheets = () => {
  const { selectedRoom } = useRoomAPI();
  // State management
  const [datasheets, setDatasheets] = useState<Datasheet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDatasheet, setSelectedDatasheet] = useState<Datasheet | null>(null);
  const [rows, setRows] = useState<DatasheetRow[]>([]);
  const [rowColumns, setRowColumns] = useState<ColumnsType<DatasheetRow>>([]);
  
  // Pagination
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
  const [rowsPagination, setRowsPagination] = useState<PaginationState>(DEFAULT_ROWS_PAGINATION);
  
  // Filters
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    dateRange: [null, null],
    tag: '',
    projectType: '',
    filename: ''
  });
  
  // Modals
  const [modalState, setModalState] = useState<ModalState>({
    uploadModalVisible: false,
    updateModalVisible: false,
    viewModalVisible: false,
    filterDrawerVisible: false
  });
  
  // File handling
  const [fileState, setFileState] = useState<FileState>({
    uploadFile: null,
    updateFile: null,
    customName: '',
    columnsToUpdate: []
  });

  // Upload flow state
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationRules, setValidationRules] = useState<Record<string, ValidationRule[]>>({});

  // Move datasheet state
  const [moveModalVisible, setMoveModalVisible] = useState<boolean>(false);
  const [selectedPart, setSelectedPart] = useState<DatasheetPart | null>(null);

  // Upload job tracking (normalize status to: pending, processing, completed, failed)
  const [uploadJob, setUploadJob] = useState<{
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message?: string;
    progress?: number;
  } | null>(null);

  // Fetch datasheets
  const fetchDatasheets = async (params: Partial<PaginationState> = {}) => {
    setLoading(true);
    try {
      const searchParams = {
        current: params.current || pagination.current,
        pageSize: params.pageSize || pagination.pageSize,
        searchTerm: filterState.searchTerm,
        startDate: filterState.dateRange[0]?.toISOString(),
        endDate: filterState.dateRange[1]?.toISOString(),
        tag: filterState.tag,
        projectType: filterState.projectType,
        filename: filterState.filename,
        room: selectedRoom
      };

      const response = await apiFetchDatasheets(searchParams);

      // Map results to Datasheet[] - use group_id as _id for table rowKey
      const datasheets = (response.results || []).map((item: any) => ({
        ...item,
        _id: item.group_id || item._id,
      }));

      setDatasheets(datasheets);
      setPagination(prev => ({
        ...prev,
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || prev.pageSize,
        total: response.pagination?.totalResults || 0
      }));
    } catch (error) {
      message.error('Failed to fetch datasheets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch datasheet rows
  const fetchDatasheetRows = async (
    datasheetId: string,
    params: { page?: number; pageSize?: number; search?: string } = {}
  ) => {
    setLoading(true);
    try {
      const response = await apiFetchDatasheetRows(datasheetId, { ...params, room: selectedRoom });
      const rowsData = response.results || [];
      
      // Process date fields
      const processedRows = processRowsData(rowsData);
      setRows(processedRows);
      
      // Generate columns from first row
      if (rowsData.length > 0) {
        const columns = generateColumns(rowsData);
        setRowColumns(columns);
      }
      
      setRowsPagination(prev => ({
        ...prev,
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || prev.pageSize,
        total: response.pagination?.totalResults || response.total || 0
      }));
    } catch (error) {
      message.error('Failed to fetch datasheet rows');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Upload options interface for the hook
  interface UploadOptions {
    file: RcFile;
    customName: string;
    mapping: ColumnMapping;
    rules: Record<string, ValidationRule[]>;
    projectType?: string;
    tag?: string;
  }

  // Poll upload job status
  const pollUploadJobStatus = async (jobId: string): Promise<void> => {
    try {
      const apiStatus = await getUploadJobStatus(jobId, selectedRoom);

      // Normalize status values (API might return 'success' or 'completed', 'error' or 'failed')
      const isCompleted = apiStatus.status === 'completed' || apiStatus.status === 'success';
      const isFailed = apiStatus.status === 'failed' || apiStatus.status === 'error';
      const normalizedStatus = isCompleted ? 'completed' : isFailed ? 'failed' : apiStatus.status as 'pending' | 'processing';

      setUploadJob({
        jobId,
        status: normalizedStatus,
        message: apiStatus.message || apiStatus.result?.message,
        progress: apiStatus.progress
      });

      if (isCompleted) {
        message.success(apiStatus.result?.message || apiStatus.message || 'Datasheet uploaded successfully!');
        // Keep the job box visible so user can manually close it
        // Refresh datasheets to show the new upload
        await fetchDatasheets();
      } else if (isFailed) {
        message.error(apiStatus.error || apiStatus.message || 'Upload failed');
        // Keep the job box visible so user can see the error and manually close it
      } else if (apiStatus.status === 'pending' || apiStatus.status === 'processing') {
        // Continue polling every 10 seconds
        setTimeout(() => pollUploadJobStatus(jobId), 10000);
      }
    } catch (error) {
      console.error('Error polling upload job status:', error);
      setUploadJob(prev => prev ? { ...prev, status: 'failed', message: 'Failed to check upload status' } : null);
      message.error('Failed to check upload status');
    }
  };

  // Clear upload job
  const clearUploadJob = (): void => {
    setUploadJob(null);
  };

  // Upload datasheet with mapping and validation
  const handleUpload = async (options: UploadOptions): Promise<void> => {
    const { file, customName, mapping, rules, projectType, tag } = options;

    if (!file) {
      message.error('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const result = await uploadDatasheetWithMapping({
        file,
        columnMapping: mapping,
        validationRules: rules,
        customName,
        batchSize: 50000,
        partSize: 25000,
        projectType: projectType || 'bucketx',
        tag: tag || 'test',
        room: selectedRoom
      });

      if (result.status === 'success') {
        message.success('Datasheet uploaded successfully');
        resetUploadModal();
        fetchDatasheets();
      } else if (result.status === 'accepted' && result.job_id) {
        // Background job started - close modal and start polling
        message.info('Upload started in background. Tracking progress...');
        resetUploadModal();
        setUploadJob({
          jobId: result.job_id,
          status: 'pending',
          message: result.message || 'Upload job started'
        });
        pollUploadJobStatus(result.job_id);
      } else {
        message.error(result.message || 'Upload failed');
      }
    } catch (error) {
      message.error('Failed to upload datasheet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Update datasheet from file
  const handleUpdateFromFile = async (): Promise<void> => {
    if (!fileState.updateFile || !selectedDatasheet) {
      message.error('Please select a file and columns to update');
      return;
    }

    try {
      setLoading(true);
      const result = await updateDatasheetFromFile(
        selectedDatasheet._id,
        fileState.updateFile,
        fileState.columnsToUpdate,
        undefined,
        selectedRoom
      );
      
      if (result.status === 'success') {
        message.success('Datasheet updated successfully');
        resetUpdateModal();
        fetchDatasheets();
      } else {
        message.error(result.message || 'Update failed');
      }
    } catch (error) {
      message.error('Failed to update datasheet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete datasheet
  const handleDelete = async (datasheetId: string): Promise<void> => {
    try {
      await deleteDatasheet(datasheetId, selectedRoom);
      message.success('Datasheet deleted successfully');
      fetchDatasheets();
    } catch (error) {
      message.error('Failed to delete datasheet');
      console.error(error);
    }
  };

  // View datasheet details
  const handleView = async (datasheet: Datasheet): Promise<void> => {
    setSelectedDatasheet(datasheet);
    setModalState(prev => ({ ...prev, viewModalVisible: true }));
    await fetchDatasheetRows(datasheet._id);
  };

  // Restore datasheet version
  const restoreDatasheetVersion = async (version: number): Promise<void> => {
    if (!selectedDatasheet) return;

    try {
      setLoading(true);
      const response = await apiRestoreDatasheetVersion(selectedDatasheet._id, version, undefined, selectedRoom);

      if (response.status === 'success' && response.data?.success) {
        message.success(`Restored to version ${version} successfully`);
        fetchDatasheets();
        if (selectedDatasheet) {
          await fetchDatasheetRows(selectedDatasheet._id);
        }
      } else {
        message.error(response.message || 'Failed to restore version');
      }
    } catch (error) {
      message.error('Error restoring datasheet version');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Open move modal
  const handleOpenMoveModal = (datasheet: Datasheet, part: DatasheetPart): void => {
    setSelectedDatasheet(datasheet);
    setSelectedPart(part);
    setMoveModalVisible(true);
  };

  // Close move modal
  const resetMoveModal = (): void => {
    setMoveModalVisible(false);
    setSelectedPart(null);
  };

  // Handle move datasheet
  const handleMove = async (params: {
    groupId: string;
    datasheetId?: string;
    toRoom: string;
    moveType: 'single' | 'all';
  }): Promise<void> => {
    try {
      setLoading(true);

      // Start the move
      const result = await moveDatasheetParts({
        group_id: params.groupId,
        action: 'start',
        from_room: selectedRoom,
        to_room: params.toRoom,
        move_type: params.moveType,
        datasheet_id: params.datasheetId
      }, selectedRoom);

      if (result.status === 'success') {
        message.success('Move started successfully. The datasheet will be moved shortly.');
        resetMoveModal();
        fetchDatasheets();
      } else {
        message.error(result.message || 'Failed to start move');
      }
    } catch (error) {
      message.error('Failed to move datasheet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // File handling
  const handleUploadChange = (info: UploadChangeParam<UploadFile>): void => {
    if (info.file.status === 'removed') {
      setFileState(prev => ({ ...prev, uploadFile: null }));
    } else if (info.file.originFileObj) {
      setFileState(prev => ({ ...prev, uploadFile: info.file.originFileObj as RcFile }));
    }
  };

  const handleUpdateChange = (info: UploadChangeParam<UploadFile>): void => {
    if (info.file.status === 'removed') {
      setFileState(prev => ({ ...prev, updateFile: null }));
    } else if (info.file.originFileObj) {
      setFileState(prev => ({ ...prev, updateFile: info.file.originFileObj as RcFile }));
    }
  };

  // Table pagination
  const handleTableChange = (pagination: TablePaginationConfig): void => {
    fetchDatasheets({ 
      current: pagination.current || 1, 
      pageSize: pagination.pageSize || 10 
    });
  };

  const handleRowsTableChange = (pagination: TablePaginationConfig): void => {
    if (selectedDatasheet) {
      fetchDatasheetRows(selectedDatasheet._id, { 
        page: pagination.current || 1, 
        pageSize: pagination.pageSize || 100 
      });
    }
  };

  // Filter handling
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null): void => {
    setFilterState(prev => ({ ...prev, dateRange: dates || [null, null] }));
  };

  const handleSearchChange = (value: string): void => {
    setFilterState(prev => ({ ...prev, searchTerm: value }));
  };

  const handleTagChange = (value: string): void => {
    setFilterState(prev => ({ ...prev, tag: value || '' }));
  };

  const handleProjectTypeChange = (value: string): void => {
    setFilterState(prev => ({ ...prev, projectType: value }));
  };

  const handleFilenameChange = (value: string): void => {
    setFilterState(prev => ({ ...prev, filename: value }));
  };

  // Modal reset functions
  const resetUploadModal = (): void => {
    setModalState(prev => ({ ...prev, uploadModalVisible: false }));
    setFileState(prev => ({ ...prev, uploadFile: null, customName: '' }));
    setColumnMapping({});
    setValidationRules({});
  };

  const resetUpdateModal = (): void => {
    setModalState(prev => ({ ...prev, updateModalVisible: false }));
    setFileState(prev => ({ ...prev, updateFile: null, columnsToUpdate: [] }));
  };

  const resetFilters = (): void => {
    setFilterState({
      searchTerm: '',
      dateRange: [null, null],
      tag: '',
      projectType: '',
      filename: ''
    });
    fetchDatasheets({ current: 1 });
    setModalState(prev => ({ ...prev, filterDrawerVisible: false }));
  };

  // Load initial data
  useEffect(() => {
    fetchDatasheets();
  }, [selectedRoom]);

  return {
    // State
    datasheets,
    loading,
    selectedDatasheet,
    selectedPart,
    rows,
    rowColumns,
    pagination,
    rowsPagination,
    filterState,
    modalState,
    fileState,
    columnMapping,
    validationRules,
    moveModalVisible,
    uploadJob,

    // Actions
    fetchDatasheets,
    fetchDatasheetRows,
    handleUpload,
    handleUpdateFromFile,
    handleDelete,
    handleView,
    restoreDatasheetVersion,
    handleOpenMoveModal,
    handleMove,
    clearUploadJob,

    // File handling
    handleUploadChange,
    handleUpdateChange,

    // Table handlers
    handleTableChange,
    handleRowsTableChange,

    // Filter handlers
    handleDateRangeChange,
    handleSearchChange,
    handleTagChange,
    handleProjectTypeChange,
    handleFilenameChange,
    resetFilters,

    // Modal handlers
    setModalState,
    setFileState,
    setSelectedDatasheet,
    resetUploadModal,
    resetUpdateModal,
    resetMoveModal,

    // Upload flow handlers
    setColumnMapping,
    setValidationRules
  };
};