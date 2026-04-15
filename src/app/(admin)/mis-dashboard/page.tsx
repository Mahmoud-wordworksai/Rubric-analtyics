'use client';

import { Suspense } from 'react';
import { Spin } from 'antd';
import MISDashboardComponent from '@/components/MISDashboard/MISDashboardComponent';

function MISDashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Spin size="large" />
        </div>
      }
    >
      <MISDashboardComponent />
    </Suspense>
  );
}

export default MISDashboardPage;
