"use client";

import { ReportsPage } from '@/components/Reports';
import React, { Suspense } from 'react';
import { Spin } from 'antd';

const ReportsWrapper: React.FC = () => {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    }>
      <ReportsPage />
    </Suspense>
  );
};

export default ReportsWrapper;
