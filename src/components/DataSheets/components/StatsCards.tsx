import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { DatabaseOutlined, FileTextOutlined } from '@ant-design/icons';

interface StatsCardsProps {
  totalDatasheets: number;
  activeFiles: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  totalDatasheets,
  activeFiles
}) => {
  return (
    <Row gutter={16} className="mb-6">
      <Col span={8}>
        <Card className="text-center" style={{ borderColor: '#263878' }}>
          <Statistic 
            title="Total Datasheets" 
            value={totalDatasheets} 
            valueStyle={{ color: '#263878', fontSize: '28px' }}
            prefix={<DatabaseOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card className="text-center" style={{ borderColor: '#52C41A' }}>
          <Statistic 
            title="Active Files" 
            value={activeFiles} 
            valueStyle={{ color: '#52C41A', fontSize: '28px' }}
            prefix={<FileTextOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards;