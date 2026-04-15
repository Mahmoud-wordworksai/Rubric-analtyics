"use client";

import SalesBotStatusDash from '@/components/NewSalesVoiceBotStatusDashv2/salesBotDash';
import React, { useEffect, useState } from 'react';

function Page() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('selectedId');
    setSelectedId(id);

    // Listen for URL changes
    const handleUrlChange = () => {
      const newParams = new URLSearchParams(window.location.search); 
      const newId = newParams.get('selectedId');
      setSelectedId(newId);
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // React.useEffect(() => {
  //   if (!selectedId) {
  //     window.history.back();
  //   }
  // }, [selectedId]);

  return (
    <div>
      <SalesBotStatusDash selectedId={selectedId} />
    </div>
  )
}

export default Page;