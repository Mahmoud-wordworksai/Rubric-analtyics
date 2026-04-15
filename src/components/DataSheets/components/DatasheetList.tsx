"use client";

import React, { useState } from 'react';
import { Tag, Tooltip, Button, Popconfirm, Empty, Skeleton, Badge, Modal, Progress } from 'antd';
import {
  ChevronRight,
  Eye,
  BarChart2,
  MessageSquare,
  Phone,
  Edit,
  Trash2,
  FileSpreadsheet,
  Layers,
  Calendar,
  RefreshCw,
  Building2,
  Loader2,
  MoveRight,
  FileText,
  Activity,
  Upload,
  X
} from 'lucide-react';
import type { Datasheet, DatasheetPart, PartInfo } from '../types';
import { parseTimestamp } from '../utils';
import { useRoomAPI } from '@/hooks/useRoomAPI';
import CallReportsModal from './CallReportsModal';
import SMSReportsModal from './SMSReportsModal';
import { DatasheetKPIDashboard } from '@/components/DatasheetKPI';

interface UploadJobInfo {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  progress?: number;
}

interface DatasheetListProps {
  datasheets: Datasheet[];
  loading: boolean;
  onView: (datasheet: Datasheet) => void;
  onUpdate: (datasheet: Datasheet) => void;
  onDelete: (datasheetId: string) => void;
  onMove: (datasheet: Datasheet, part: DatasheetPart) => void;
  uploadJob?: UploadJobInfo | null;
  onClearUploadJob?: () => void;
}

const DatasheetList: React.FC<DatasheetListProps> = ({
  datasheets,
  loading,
  onView,
  onUpdate,
  onDelete,
  onMove,
  uploadJob,
  onClearUploadJob
}) => {
  const { navigateTo } = useRoomAPI();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [callReportsModal, setCallReportsModal] = useState<{
    visible: boolean;
    groupId: string | null;
    datasheetName: string;
  }>({
    visible: false,
    groupId: null,
    datasheetName: ''
  });

  const handleOpenCallReports = (e: React.MouseEvent, datasheet: Datasheet) => {
    e.stopPropagation(); // Prevent expanding/collapsing the group
    setCallReportsModal({
      visible: true,
      groupId: datasheet.group_id || datasheet._id,
      datasheetName: datasheet.filename || 'Untitled'
    });
  };

  const handleCloseCallReports = () => {
    setCallReportsModal({
      visible: false,
      groupId: null,
      datasheetName: ''
    });
  };

  // SMS Reports Modal State
  const [smsReportsModal, setSmsReportsModal] = useState<{
    visible: boolean;
    groupId: string | null;
    datasheetName: string;
  }>({
    visible: false,
    groupId: null,
    datasheetName: ''
  });

  const handleOpenSmsReports = (e: React.MouseEvent, datasheet: Datasheet) => {
    e.stopPropagation(); // Prevent expanding/collapsing the group
    setSmsReportsModal({
      visible: true,
      groupId: datasheet.group_id || datasheet._id,
      datasheetName: datasheet.filename || 'Untitled'
    });
  };

  const handleCloseSmsReports = () => {
    setSmsReportsModal({
      visible: false,
      groupId: null,
      datasheetName: ''
    });
  };

  // KPI Modal State
  const [kpiModal, setKpiModal] = useState<{
    visible: boolean;
    groupId: string | null;
    datasheetName: string;
  }>({
    visible: false,
    groupId: null,
    datasheetName: ''
  });

  const handleOpenKpiModal = (e: React.MouseEvent, datasheet: Datasheet) => {
    e.stopPropagation();
    setKpiModal({
      visible: true,
      groupId: datasheet.group_id || datasheet._id,
      datasheetName: datasheet.filename || 'Untitled'
    });
  };

  const handleCloseKpiModal = () => {
    setKpiModal({
      visible: false,
      groupId: null,
      datasheetName: ''
    });
  };

  const toggleExpand = (datasheetId: string) => {
    setExpandedGroups(prev =>
      prev.includes(datasheetId)
        ? prev.filter(id => id !== datasheetId)
        : [...prev, datasheetId]
    );
  };

  const getTagColor = (tag: string | null | undefined): string => {
    if (!tag) return 'default';
    switch (tag.toLowerCase()) {
      case 'production':
      case 'prod':
        return 'green';
      case 'test':
        return 'orange';
      case 'development':
      case 'dev':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getProjectTypeColor = (type: string | null | undefined): string => {
    if (!type) return 'default';
    switch (type.toLowerCase()) {
      case 'bucketx':
        return 'purple';
      case 'collection':
        return 'cyan';
      case 'sales':
        return 'magenta';
      default:
        return 'default';
    }
  };

  // Upload Job Progress Box Component
  const UploadJobBox = () => uploadJob ? (
    <div className={`border rounded-lg p-4 shadow-sm mb-4 ${
      uploadJob.status === 'completed' ? 'border-green-200 bg-green-50' :
      uploadJob.status === 'failed' ? 'border-red-200 bg-red-50' :
      'border-blue-200 bg-blue-50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Upload size={20} className={
            uploadJob.status === 'completed' ? 'text-green-600' :
            uploadJob.status === 'failed' ? 'text-red-600' :
            'text-blue-600'
          } />
          <span className={`font-semibold ${
            uploadJob.status === 'completed' ? 'text-green-800' :
            uploadJob.status === 'failed' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {uploadJob.status === 'completed' ? 'Upload Complete' :
             uploadJob.status === 'failed' ? 'Upload Failed' :
             'Upload in Progress'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            uploadJob.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            uploadJob.status === 'processing' ? 'bg-blue-100 text-blue-700' :
            uploadJob.status === 'completed' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {uploadJob.status.charAt(0).toUpperCase() + uploadJob.status.slice(1)}
          </span>
        </div>
        {onClearUploadJob && (uploadJob.status === 'completed' || uploadJob.status === 'failed') && (
          <Button
            type="default"
            size="small"
            icon={<X size={14} />}
            onClick={onClearUploadJob}
            className="text-gray-600 hover:text-gray-800 border-gray-300"
          >
            Dismiss
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Progress
            percent={uploadJob.status === 'completed' ? 100 : (uploadJob.progress || (uploadJob.status === 'processing' ? 50 : uploadJob.status === 'pending' ? 10 : 0))}
            status={
              uploadJob.status === 'failed' ? 'exception' :
              uploadJob.status === 'completed' ? 'success' :
              'active'
            }
            strokeColor={uploadJob.status === 'failed' ? '#ff4d4f' : '#263878'}
            size="small"
          />
        </div>
        {(uploadJob.status === 'pending' || uploadJob.status === 'processing') && (
          <Loader2 size={18} className="text-blue-600 animate-spin flex-shrink-0" />
        )}
      </div>

      {uploadJob.message && (
        <p className={`text-sm mt-2 ${
          uploadJob.status === 'completed' ? 'text-green-700' :
          uploadJob.status === 'failed' ? 'text-red-700' :
          'text-blue-700'
        }`}>{uploadJob.message}</p>
      )}

      <p className="text-xs text-gray-500 mt-1">Job ID: {uploadJob.jobId}</p>
    </div>
  ) : null;

  if (loading && datasheets.length === 0) {
    return (
      <div className="space-y-4">
        <UploadJobBox />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 bg-white">
            <Skeleton active paragraph={{ rows: 1 }} />
          </div>
        ))}
      </div>
    );
  }

  if (datasheets.length === 0) {
    return (
      <div>
        <UploadJobBox />
        <Empty
          description="No datasheets found"
          className="py-12"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Job Progress Box */}
      <UploadJobBox />

      {datasheets.map((datasheet) => {
        const datasheetId = datasheet._id;
        const isExpanded = expandedGroups.includes(datasheetId);
        // Step 1: Get all parts from 'parts' array
        const normalParts = (datasheet.parts || []) as PartInfo[];
        const existingFilenames = new Set(normalParts.map(p => p.filename));

        // Step 2: Filter parts_info to get parts whose filename does NOT exist in 'parts'
        const additionalParts = (datasheet.parts_info || [])
          .filter(p => !existingFilenames.has(p.filename)) as PartInfo[];

        // Step 3: Combine parts + additional parts from parts_info
        const parts = [...normalParts, ...additionalParts];

        return (
          <div
            key={datasheetId}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Datasheet Header */}
            <div
              className="bg-white px-4 py-3 cursor-pointer"
              onClick={() => toggleExpand(datasheetId)}
            >
              {/* Desktop Layout */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {/* Left section: chevron, title, and badges */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <ChevronRight
                      size={20}
                      className={`text-[#263878] transition-transform flex-shrink-0 ${isExpanded ? 'transform rotate-90' : ''}`}
                    />
                    <FileSpreadsheet size={20} className="text-[#263878] flex-shrink-0" />
                    <h3 className="font-semibold text-[#263878] break-words">
                      {datasheet.filename || 'Untitled'}
                    </h3>
                  </div>

                  {/* Info badges */}
                  <div className="flex flex-wrap gap-2">
                    <Tooltip title="Total rows across all parts">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#263878]/10 text-[#263878] text-xs font-medium flex items-center gap-1">
                        <Layers size={12} />
                        {(datasheet.total_rows || 0).toLocaleString()} rows
                      </span>
                    </Tooltip>

                    <Tooltip title={`${datasheet.parts_count || 0} of ${datasheet.total_parts || 0} parts`}>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        {datasheet.parts_count || 0}/{datasheet.total_parts || 0} parts
                      </span>
                    </Tooltip>

                    {datasheet.project_type && (
                      <Tag color={getProjectTypeColor(datasheet.project_type)} className="m-0">
                        {datasheet.project_type}
                      </Tag>
                    )}

                    {datasheet.tag && (
                      <Tag color={getTagColor(datasheet.tag)} className="m-0">
                        {datasheet.tag}
                      </Tag>
                    )}
                  </div>
                </div>

                {/* Right section: dates, call reports, and status */}
                <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
                  <Tooltip title="Created at">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {parseTimestamp(datasheet.created_at) || 'N/A'}
                    </span>
                  </Tooltip>

                  <Tooltip title="Export Call Reports">
                    <Button
                      type="default"
                      size="small"
                      icon={<FileText size={14} />}
                      onClick={(e) => handleOpenCallReports(e, datasheet)}
                      className="flex items-center gap-1 text-[#263878] border-[#263878] hover:bg-[#263878]/10"
                    >
                      Call Reports
                    </Button>
                  </Tooltip>

                  <Tooltip title="Export SMS Reports">
                    <Button
                      type="default"
                      size="small"
                      icon={<MessageSquare size={14} />}
                      onClick={(e) => handleOpenSmsReports(e, datasheet)}
                      className="flex items-center gap-1 text-purple-600 border-purple-600 hover:bg-purple-50"
                    >
                      SMS Reports
                    </Button>
                  </Tooltip>

                  <Tooltip title="KPI Analytics">
                    <Button
                      type="default"
                      size="small"
                      icon={<Activity size={14} />}
                      onClick={(e) => handleOpenKpiModal(e, datasheet)}
                      className="flex items-center gap-1 text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                    >
                      KPIs
                    </Button>
                  </Tooltip>

                  <Badge status="success" text="Active" />
                </div>
              </div>
            </div>

            {/* Expanded Parts Section */}
            {isExpanded && (
              <div className="p-4 bg-slate-50 border-t border-gray-200">
                {parts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No parts found for this datasheet
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263878] uppercase tracking-wider">
                            Part
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263878] uppercase tracking-wider">
                            Filename
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263878] uppercase tracking-wider">
                            Room
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263878] uppercase tracking-wider">
                            Rows
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263878] uppercase tracking-wider">
                            Extension
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#263878] uppercase tracking-wider">
                            Created At
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#263878] uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parts.map((part: PartInfo) => (
                          <tr key={part._id} className={`hover:bg-slate-50 ${part.is_moving || part.room_display !== 'current' ? 'opacity-60' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                              <div className="flex items-center gap-2">
                                <Tag color="blue">Part {part.part}</Tag>
                                {part.is_moving && (
                                  <Tooltip title="This part is being moved to current room">
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                      <Loader2 size={12} className="animate-spin" />
                                      Moving
                                    </span>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <Tooltip title={part.filename}>
                                <span className="max-w-xs truncate block">
                                  {part.filename}
                                </span>
                              </Tooltip>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {part.room_display ? (
                                <Tooltip title={`Located in: ${part.room || part.room_display}`}>
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                                    <Building2 size={12} />
                                    {part.room_display}
                                  </span>
                                </Tooltip>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                                {(part.row_count || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <Tag color="default">{part.extension?.toUpperCase() || 'N/A'}</Tag>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parseTimestamp(part.created_at) || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {part.is_moving ? (
                                <Tooltip title="Actions disabled while part is being moved">
                                  <span className="text-xs text-gray-400 italic">Unavailable</span>
                                </Tooltip>
                              ) : part.room_display !== 'current' ? (
                                <Tooltip title={`Part is in ${part.room || 'another room'}`}>
                                  <span className="text-xs text-gray-400 italic">In other room</span>
                                </Tooltip>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <Tooltip title="View Details">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<Eye size={16} />}
                                      onClick={() => onView({ ...datasheet, _id: part._id })}
                                      className="text-[#263878] hover:bg-[#263878]/10"
                                    />
                                  </Tooltip>
                                  <Tooltip title="Analytics">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<BarChart2 size={16} />}
                                      onClick={() => navigateTo("/dashboard", { datasheet_id: part._id })}
                                      className="text-blue-500 hover:bg-blue-50"
                                    />
                                  </Tooltip>
                                  <Tooltip title="SMS Cost">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<MessageSquare size={16} />}
                                      onClick={() => navigateTo("/sms-billing", { datasheet_id: part._id })}
                                      className="text-purple-500 hover:bg-purple-50"
                                    />
                                  </Tooltip>
                                  <Tooltip title="Call Cost">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<Phone size={16} />}
                                      onClick={() => navigateTo("/call-cost", { datasheet_id: part._id })}
                                      className="text-cyan-500 hover:bg-cyan-50"
                                    />
                                  </Tooltip>
                                  <Tooltip title="Update from File">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<Edit size={16} />}
                                      onClick={() => onUpdate({ ...datasheet, _id: part._id })}
                                      className="text-green-500 hover:bg-green-50"
                                    />
                                  </Tooltip>
                                  <Tooltip title="Move to Room">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<MoveRight size={16} />}
                                      onClick={() => onMove(datasheet, part as DatasheetPart)}
                                      className="text-orange-500 hover:bg-orange-50"
                                    />
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <Popconfirm
                                      title="Are you sure you want to delete this part?"
                                      onConfirm={() => onDelete(part._id)}
                                      okText="Yes"
                                      cancelText="No"
                                    >
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<Trash2 size={16} />}
                                        className="text-red-500 hover:bg-red-50"
                                      />
                                    </Popconfirm>
                                  </Tooltip>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Summary footer */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Layers size={14} />
                    Total: <strong>{(datasheet.total_rows || 0).toLocaleString()}</strong> rows
                  </span>
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet size={14} />
                    Parts: <strong>{parts.length}</strong> of <strong>{datasheet.total_parts || 0}</strong>
                  </span>
                  {datasheet.updated_at && (
                    <span className="flex items-center gap-1">
                      <RefreshCw size={14} />
                      Last updated: <strong>{parseTimestamp(datasheet.updated_at)}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Call Reports Modal */}
      <CallReportsModal
        visible={callReportsModal.visible}
        groupId={callReportsModal.groupId}
        datasheetName={callReportsModal.datasheetName}
        onClose={handleCloseCallReports}
      />

      {/* SMS Reports Modal */}
      <SMSReportsModal
        visible={smsReportsModal.visible}
        groupId={smsReportsModal.groupId}
        datasheetName={smsReportsModal.datasheetName}
        onClose={handleCloseSmsReports}
      />

      {/* KPI Analytics Modal */}
      <Modal
        open={kpiModal.visible}
        onCancel={handleCloseKpiModal}
        footer={null}
        width="100vw"
        style={{ top: 0, margin: 0, padding: 0, maxWidth: '100vw' }}
        styles={{
          body: { padding: 0, height: 'calc(100vh - 55px)', overflow: 'hidden' },
          content: { borderRadius: 0 }
        }}
        title={
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" />
            <span>KPI Analytics - {kpiModal.datasheetName}</span>
          </div>
        }
        destroyOnClose
        className="!m-0 !p-0 full-screen-modal"
        wrapClassName="!p-0"
      >
        {kpiModal.groupId && (
          <DatasheetKPIDashboard
            groupId={kpiModal.groupId}
            onBack={handleCloseKpiModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default DatasheetList;
