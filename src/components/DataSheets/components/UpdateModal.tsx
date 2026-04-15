/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Modal, Upload, Button, Select, Typography } from 'antd';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined, EditOutlined } from '@ant-design/icons';
import type { Datasheet } from '../types';
import { ACCEPTED_FILE_TYPES, UPDATABLE_COLUMNS } from '../constants';

const { Text } = Typography;

interface UpdateModalProps {
  visible: boolean;
  loading: boolean;
  selectedDatasheet: Datasheet | null;
  updateFile: RcFile | null;
  columnsToUpdate: string[];
  onCancel: () => void;
  onUpdate: () => void;
  onFileChange: (info: UploadChangeParam<UploadFile>) => void;
  onColumnsChange: (columns: string[]) => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  loading,
  selectedDatasheet,
  updateFile,
  columnsToUpdate,
  onCancel,
  onUpdate,
  onFileChange,
  onColumnsChange
}) => {
  return (
    <Modal
      title={
        <div style={{ color: '#263878', fontSize: '18px' }}>
          <EditOutlined className="mr-2" />
          Update Datasheet: {selectedDatasheet?.filename}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Select Update File</label>
          <Upload
            beforeUpload={(file: RcFile) => {
              onFileChange({
                file: { ...file, status: 'done', originFileObj: file },
                fileList: []
              });
              return false;
            }}
            onRemove={() => onFileChange({
              file: { status: 'removed' } as any,
              fileList: []
            })}
            maxCount={1}
            accept={ACCEPTED_FILE_TYPES}
            fileList={updateFile ? [{
              uid: updateFile.uid || Date.now().toString(),
              name: updateFile.name,
              status: 'done' as const,
              originFileObj: updateFile
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
              disabled={!!updateFile}
            >
              {updateFile ? `Selected: ${updateFile.name}` : 'Choose Update File'}
            </Button>
          </Upload>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Columns to Update</label>
          <Select
            mode="multiple"
            placeholder="Select columns to update"
            value={columnsToUpdate}
            onChange={onColumnsChange}
            style={{ width: '100%' }}
            size="large"
            options={UPDATABLE_COLUMNS}
          />
          <Text type="secondary" className="text-xs mt-2 block">
            Select one or more columns to update in this datasheet.
          </Text>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button 
            size="large"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            size="large"
            onClick={onUpdate}
            loading={loading}
            disabled={!updateFile || columnsToUpdate.length === 0}
            style={{ backgroundColor: '#263878', borderColor: '#263878', color: '#fff' }}
          >
            {loading ? 'Updating...' : 'Update Datasheet'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpdateModal;