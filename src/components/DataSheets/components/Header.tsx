import React from 'react';
import { Button, Typography } from 'antd';
import { DatabaseOutlined, CloudUploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface HeaderProps {
  onUploadClick: () => void;
  hideUploadButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onUploadClick, hideUploadButton = false }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <Title level={2} style={{ color: '#263878', marginBottom: '8px' }}>
          <DatabaseOutlined className="mr-3" />
          Datasheets
        </Title>
        <Text type="secondary" className="text-lg">
          Manage your datasheets efficiently
        </Text>
      </div>
      {!hideUploadButton && (
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={onUploadClick}
          size="large"
          style={{
            backgroundColor: '#263878',
            borderColor: '#263878',
            height: '48px',
            fontSize: '16px'
          }}
        >
          Upload Datasheet
        </Button>
      )}
    </div>
  );
};

export default Header;