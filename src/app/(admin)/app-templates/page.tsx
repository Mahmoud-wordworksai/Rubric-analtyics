"use client";

import Templates from '@/components/Templates';
import React, { Suspense } from 'react';

function AppTemplatesPage() {
  return (
     <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-500">Loading templates...</span>
          </div>
        </div>
      }>
        <div style={{ height: 'calc(100vh - 64px)' }}>
          <Templates />
        </div>
      </Suspense>
  );
}

export default AppTemplatesPage;
