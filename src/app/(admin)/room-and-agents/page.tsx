"use client";

import AgentDashboard from '@/components/NewSalesVoiceBotStatusDashv2/AgentDashboard';
// import { SalesBotCallData } from '@/types';
// import axios from 'axios';
import React from 'react';

function Page() {
  // const [loading, setLoading] = useState(false);
  // const [orders, setOrders] = useState<SalesBotCallData[]>([]);
  // console.log(loading)
  //  const fetchOrders = async () => {
  //     setLoading(true);
  //     try {
  //       const { data } = await axios.get(`${API_BASE_URL}/executions`, {
  //         params: { page: 1, page_size: 1000 },
  //       });
  //       if (data.status === "success") {
  //         setOrders(data.data.results);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching orders:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   useEffect(() => {
  //     fetchOrders()
  //   }, []);

  return (
    <div>
      <AgentDashboard />
    </div>
  )
}

export default Page;
