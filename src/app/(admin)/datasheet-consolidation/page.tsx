'use client';

import { Suspense } from 'react';
import { Spin } from 'antd';
import DatasheetConsolidationDashboard from '@/components/DatasheetConsolidation/DatasheetConsolidationDashboard';

function DatasheetConsolidationPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      }
    >
      <DatasheetConsolidationDashboard />
    </Suspense>
  );
}

export default DatasheetConsolidationPage;
