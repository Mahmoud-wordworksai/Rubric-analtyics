import React from 'react';
import { Card, Row, Col, Input, Button } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';

const { Search } = Input;

interface SearchBarProps {
  searchTerm: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onShowFilters: () => void;
  onRefresh: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  loading,
  onSearchChange,
  onSearch,
  onShowFilters,
  onRefresh
}) => {
  return (
    <Card className="mb-6" style={{ borderRadius: '8px' }}>
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <Search
            placeholder="Search datasheets by filename, ID, or metadata..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onSearch={onSearch}
            style={{ borderRadius: '6px' }}
          />
        </Col>
        <Col>
          <Button 
            icon={<FilterOutlined />}
            onClick={onShowFilters}
            size="large"
            style={{ borderRadius: '6px' }}
          >
            Filters
          </Button>
        </Col>
        <Col>
          <Button 
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            size="large"
            style={{ borderRadius: '6px' }}
            loading={loading}
          >
            Refresh
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default SearchBar;