/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import SalesBotStatusDash from '@/components/NewSalesVoiceBotStatusDashv2/SalesBotStatusDash';
import { SalesBotCallData } from '@/types';
import { Empty } from 'antd';
import axiosInstance from '@/lib/axios';
import React, { useEffect, useState, Suspense } from 'react';
import { API_BASE_URL } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";

function Page() {
  const { selectedRoom, appendRoomParam } = useRoomAPI();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<SalesBotCallData[]>([]);

  React.useEffect(() => {
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

   const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/executions`), {
          params: { page: 1, page_size: 1000 },
        });
        if (data.status === "success") {
          setOrders(data.data.results);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchOrders()
    }, [selectedRoom]);

    useEffect(() => {
      if (orders.length > 0) {
        if (!selectedId) {
          setSelectedId(orders[0]._id);
        }
      }
    }, [orders]);

  return (
    <div>
      {/* <div className="flex items-center gap-3 p-6 w-full">
        <select 
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#263978] focus:border-transparent"
          value={selectedId || ''}
          onChange={(e) => {
            const newId = e.target.value;
            window.history.pushState({}, '', `/analyze?selectedId=${newId}`);
            setSelectedId(newId);
          }}
        >
          <option value="">Select Campaign</option>
          {orders.map((order) => (
            <option key={order._id} value={order._id}>
             {order?.project_name || "default"} - {order.country}
            </option>
          ))}
        </select>
      </div> */}
      {orders.length === 0 ? (
        <Empty 
          description={"No campaigns found"} 
          className="py-12"
        />
      ):(
        <SalesBotStatusDash selectedId={selectedId} />
      )}
    </div>
  )
}

// Wrapper with Suspense for useRoomAPI hook
const AnalyzePageWrapper = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#263978]"></div>
    </div>
  }>
    <Page />
  </Suspense>
);

export default AnalyzePageWrapper;