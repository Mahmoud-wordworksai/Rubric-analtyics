"use client";

import React, { useState } from 'react';
import { Modal, Button, Select, Radio, Typography, Alert } from 'antd';
import { MoveRight } from 'lucide-react';
import type { Datasheet, DatasheetPart } from '../types';

const { Text } = Typography;

// Available rooms - can be fetched from API if needed
const AVAILABLE_ROOMS = [
  { label: 'Main', value: 'main' },
  { label: 'Room 1', value: 'room-1' },
  { label: 'Room 2', value: 'room-2' },
  { label: 'Room 3', value: 'room-3' },
  { label: 'Room 4', value: 'room-4' }
];

interface MoveDatasheetModalProps {
  visible: boolean;
  loading: boolean;
  datasheet: Datasheet | null;
  part: DatasheetPart | null;
  currentRoom: string;
  onCancel: () => void;
  onMove: (params: {
    groupId: string;
    datasheetId?: string;
    toRoom: string;
    moveType: 'single' | 'all';
  }) => void;
}

const MoveDatasheetModal: React.FC<MoveDatasheetModalProps> = ({
  visible,
  loading,
  datasheet,
  part,
  currentRoom,
  onCancel,
  onMove
}) => {
  const [toRoom, setToRoom] = useState<string>('');
  const [moveType, setMoveType] = useState<'single' | 'all'>('single');

  const handleMove = () => {
    if (!datasheet || !toRoom) return;

    onMove({
      groupId: datasheet.group_id || datasheet._id,
      datasheetId: moveType === 'single' ? part?._id : undefined,
      toRoom,
      moveType
    });
  };

  const handleCancel = () => {
    setToRoom('');
    setMoveType('single');
    onCancel();
  };

  // Filter out current room from available rooms
  const availableRooms = AVAILABLE_ROOMS.filter(room => room.value !== currentRoom);

  const partCount = datasheet?.parts?.length || datasheet?.total_parts || 1;

  return (
    <Modal
      title={
        <div style={{ color: '#263878', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MoveRight size={20} />
          Move Datasheet
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <div className="space-y-6 py-4">
        {/* Current Info */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <Text strong className="block mb-2">Datasheet:</Text>
          <Text>{datasheet?.filename}</Text>
          {part && (
            <Text className="block text-sm text-gray-500 mt-1">
              Part {part.part} - {(part.row_count || 0).toLocaleString()} rows
            </Text>
          )}
          <div className="mt-2 pt-2 border-t border-slate-200">
            <Text className="text-sm">
              Current Room: <span className="font-medium text-indigo-600">{currentRoom}</span>
            </Text>
          </div>
        </div>

        {/* Move Type Selection */}
        {partCount > 1 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              What do you want to move?
            </label>
            <Radio.Group
              value={moveType}
              onChange={(e) => setMoveType(e.target.value)}
              className="w-full"
            >
              <div className="space-y-2">
                <Radio value="single" className="block">
                  <span className="font-medium">This part only</span>
                  <Text className="block text-xs text-gray-500 ml-6">
                    Move only Part {part?.part || 1}
                  </Text>
                </Radio>
                <Radio value="all" className="block">
                  <span className="font-medium">All parts ({partCount} parts)</span>
                  <Text className="block text-xs text-gray-500 ml-6">
                    Move all parts of this datasheet
                  </Text>
                </Radio>
              </div>
            </Radio.Group>
          </div>
        )}

        {/* Target Room Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Move to Room
          </label>
          <Select
            placeholder="Select target room"
            value={toRoom || undefined}
            onChange={setToRoom}
            style={{ width: '100%' }}
            size="large"
            options={availableRooms}
          />
        </div>

        {/* Warning */}
        {toRoom && (
          <Alert
            type="warning"
            showIcon
            message={
              moveType === 'all'
                ? `All ${partCount} parts will be moved to "${toRoom}"`
                : `Part ${part?.part || 1} will be moved to "${toRoom}"`
            }
            description="The datasheet will be temporarily unavailable during the move operation."
          />
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button size="large" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleMove}
            loading={loading}
            disabled={!toRoom}
            style={{ backgroundColor: '#263878', borderColor: '#263878', color: '#fff' }}
          >
            {loading ? 'Moving...' : 'Start Move'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MoveDatasheetModal;
