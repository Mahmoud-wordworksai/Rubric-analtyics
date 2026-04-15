"use client";

import SalesBotStatusDash from '@/components/NewSalesVoiceBotStatusDashv2/salesBotDash';
import React, { useEffect } from 'react';

function Page() {
  const params = new URLSearchParams(window.location.search);
  const selectedId = params.get('selectedId');

  useEffect(() => {
    if (!selectedId) {
      window.history.back();
    }
  }, [selectedId]);

  return (
    <SalesBotStatusDash selectedId={selectedId} />
  )
}

export default Page;