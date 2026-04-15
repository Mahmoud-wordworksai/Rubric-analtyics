/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from 'react';
import { Card, Typography, Pagination } from 'antd';
import { useDatasheets } from './hooks/useDatasheets';
import { useRoomAPI } from '@/hooks/useRoomAPI';

// Components
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import SearchBar from './components/SearchBar';
import UploadModal from './components/UploadModal';
import UpdateModal from './components/UpdateModal';
import MoveDatasheetModal from './components/MoveDatasheetModal';
import DatasheetDetails from './components/DatasheetDetails';
import FilterDrawer from './components/FilterDrawer';
import DatasheetList from './components/DatasheetList';

const { Title } = Typography;

const DatasheetsCRM: React.FC = () => {
  const { selectedRoom } = useRoomAPI();

  const {
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

    // Actions
    fetchDatasheets,
    handleUpload,
    handleUpdateFromFile,
    handleDelete,
    handleView,
    restoreDatasheetVersion,
    handleOpenMoveModal,
    handleMove,

    // File handling
    handleUploadChange,
    handleUpdateChange,

    // Table handlers
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
    setValidationRules,

    // Upload job tracking
    uploadJob,
    clearUploadJob
  } = useDatasheets();

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize: number) => {
    fetchDatasheets({ current: page, pageSize });
  };

  return (
    <div className="w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="mb-6">
        <Header
          onUploadClick={() => setModalState(prev => ({ ...prev, uploadModalVisible: true }))}
          hideUploadButton={selectedRoom === 'main'}
        />

        {/* Stats Cards */}
        <StatsCards
          totalDatasheets={pagination.total}
          activeFiles={datasheets.length}
        />

        {/* Search and Filters */}
        <SearchBar
          searchTerm={filterState.searchTerm}
          loading={loading}
          onSearchChange={handleSearchChange}
          onSearch={() => fetchDatasheets({ current: 1 })}
          onShowFilters={() => setModalState(prev => ({ ...prev, filterDrawerVisible: true }))}
          onRefresh={() => fetchDatasheets()}
        />
      </div>

      {/* Inline Datasheet Details */}
      {modalState.viewModalVisible && selectedDatasheet && (
        <DatasheetDetails
          selectedDatasheet={selectedDatasheet}
          rows={rows}
          rowColumns={rowColumns}
          rowsPagination={rowsPagination}
          loading={loading}
          onClose={() => setModalState(prev => ({ ...prev, viewModalVisible: false }))}
          onTableChange={handleRowsTableChange}
          onVersionRestore={restoreDatasheetVersion}
          onDatasheetUpdate={() => handleView(selectedDatasheet)}
        />
      )}

      {/* Main Datasheet List - Hidden when viewing details */}
      {!modalState.viewModalVisible && (
        <Card
          style={{ borderRadius: '8px', width: '100%', maxWidth: '100%' }}
          styles={{ body: { padding: '24px' } }}
        >
          <div className="mb-4">
            <Title level={4} style={{ color: '#263878', marginBottom: '16px' }}>
              Datasheet Management
            </Title>
          </div>

          {/* Expandable Datasheet List */}
          <DatasheetList
            datasheets={datasheets}
            loading={loading}
            onView={handleView}
            onUpdate={(datasheet) => {
              setSelectedDatasheet(datasheet);
              setModalState(prev => ({ ...prev, updateModalVisible: true }));
            }}
            onDelete={handleDelete}
            onMove={handleOpenMoveModal}
            uploadJob={uploadJob}
            onClearUploadJob={clearUploadJob}
          />

          {/* Pagination */}
          {datasheets.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} of {pagination.total} datasheets
              </span>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                showQuickJumper
                pageSizeOptions={['10', '20', '50', '100']}
                onChange={handlePaginationChange}
                onShowSizeChange={handlePaginationChange}
              />
            </div>
          )}
        </Card>
      )}

      {/* Upload Modal */}
      <UploadModal
        visible={modalState.uploadModalVisible}
        loading={loading}
        customName={fileState.customName}
        uploadFile={fileState.uploadFile as any}
        columnMapping={columnMapping}
        validationRules={validationRules}
        onCancel={resetUploadModal}
        onUpload={handleUpload}
        onCustomNameChange={(value) => setFileState(prev => ({ ...prev, customName: value }))}
        onFileChange={handleUploadChange}
        onColumnMappingChange={setColumnMapping}
        onValidationRulesChange={setValidationRules}
      />

      {/* Update Modal */}
      <UpdateModal
        visible={modalState.updateModalVisible}
        loading={loading}
        selectedDatasheet={selectedDatasheet}
        updateFile={fileState.updateFile as any}
        columnsToUpdate={fileState.columnsToUpdate}
        onCancel={resetUpdateModal}
        onUpdate={handleUpdateFromFile}
        onFileChange={handleUpdateChange}
        onColumnsChange={(columns) => setFileState(prev => ({ ...prev, columnsToUpdate: columns }))}
      />

      {/* Filter Drawer */}
      <FilterDrawer
        visible={modalState.filterDrawerVisible}
        dateRange={filterState.dateRange}
        tag={filterState.tag}
        projectType={filterState.projectType}
        filename={filterState.filename}
        onClose={() => setModalState(prev => ({ ...prev, filterDrawerVisible: false }))}
        onDateRangeChange={handleDateRangeChange}
        onTagChange={handleTagChange}
        onProjectTypeChange={handleProjectTypeChange}
        onFilenameChange={handleFilenameChange}
        onApplyFilters={() => {
          fetchDatasheets({ current: 1 });
          setModalState(prev => ({ ...prev, filterDrawerVisible: false }));
        }}
        onClearFilters={resetFilters}
      />

      {/* Move Datasheet Modal */}
      <MoveDatasheetModal
        visible={moveModalVisible}
        loading={loading}
        datasheet={selectedDatasheet}
        part={selectedPart}
        currentRoom={selectedRoom}
        onCancel={resetMoveModal}
        onMove={handleMove}
      />
    </div>
  );
};

export default DatasheetsCRM;