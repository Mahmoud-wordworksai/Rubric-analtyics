// app/agentic-ai/components/AllOrdersTable.tsx
"use client";

import { useEffect, useState, Fragment, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Spin } from "antd";
import { FiArrowLeft } from "react-icons/fi";
import { SecondLoader } from "@/layout/MainLoader";
import AgentDashboard from "@/components/NewSalesVoiceBotStatusDashv2/AgentDashboard";
import SalesBotStatusDash from "@/components/NewSalesVoiceBotStatusDashv2/salesBotDash";
import { SalesBotCallData } from "@/types";
import withProtection from "@/hoc/ProtectRoute";
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";

const AllOrdersTable = () => {
  const { selectedRoom, appendRoomParam, navigateTo } = useRoomAPI();

  /* state */
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<SalesBotCallData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 1,
  });
  
  const fetchOrders = async (p = pagination) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(appendRoomParam(`${API_BASE_URL}/executions`), {
        params: { page: p.page, page_size: p.limit },
      });
      if (data.status === "success") {
        setPagination({
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          totalPages: data.data.pagination.totalPages,
          totalResults: data.data.pagination.totalResults,
        });
        setOrders(data.data.results);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // const fetchAgents = async () => {
  //   try {
  //     const { data } = await axios.get(`${API_BASE_URL}/agents?api_key=${API_KEY}`);
  //     setAgents(data.data);
  //   } catch (err) {
  //     console.error("Error fetching agents:", err);
  //   }
  // };

  /* controls */
  const stopExecution = async (id: string) => {
    setLoading(true);
    try {
      await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/stop-execution?api_key=${API_KEY}`), {
        execution_id: id,
      });
      fetchOrders();
    } catch (err) {
      console.error("Error stopping execution:", err);
    } finally {
      setLoading(false);
    }
  };

  const startExecution = async (id: string) => {
    setLoading(true);
    try {
      await axiosInstance.post(appendRoomParam(`${API_BASE_URL}/start-execution?api_key=${API_KEY}`), {
        execution_id: id,
      });
      fetchOrders();
    } catch (err) {
      console.error("Error starting execution:", err);
    } finally {
      setLoading(false);
    }
  };

  /* effects */
  useEffect(() => {
    fetchOrders();
    // fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, selectedRoom]);

  /* helpers */
  const statusClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/[0.1] text-green-600 border-green-300";
      case "RUNNING":
      case "processing":
        return "bg-yellow-500/[0.1] text-yellow-600 border-yellow-300";
      case "PAUSED":
      case "stopped":
        return "bg-orange-500/[0.1] text-orange-600 border-orange-300";
      default:
        return "bg-gray-300/[0.1] text-gray-700 border-gray-300";
    }
  };

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1
  );

  return (
    <div className="p-4 bg-white rounded-lg w-full max-w-7xl mx-auto">
      {loading && <SecondLoader />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {selectedId ? (
            <FiArrowLeft
              size={28}
              className="cursor-pointer text-[#263978]"
              onClick={() => setSelectedId(null)}
            />
          ) : (
            <div
              className="flex space-x-2 cursor-pointer"
              onClick={() => navigateTo("/create-new")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="32"
                viewBox="0 -960 960 960"
                width="32"
                fill="#263978"
              >
                <path d="M480-334.23 521.77-376l-74-74H630v-60H447.77l74-74L480-625.77 334.23-480 480-334.23Z" />
              </svg>
            </div>
          )}
          <h2 className="text-xl font-semibold text-[#263978]">
            {selectedId ? "Status Dashboard" : "Dashboard"}
          </h2>
        </div>
      </div>

      {/* CONTENT: only show AgentDashboard & orders when nothing is selected */}
      {!selectedId ? (
        <Fragment>
          {/* agent stats */}
          <AgentDashboard            // exeIds={orders
            //   .filter((o) => o?.status === "processing")
            //   .map((o) => o?._id)}
          />

          {/* orders list */}
          <div className="flex items-center justify-between my-8">
            <h3 className="text-xl font-semibold text-[#263978]">Orders</h3>
            <button
              className="px-3 py-1 bg-[#263978] text-white rounded-md"
              onClick={() => fetchOrders()}
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-4 py-2">Execution Id</th>
                  <th className="px-4 py-2">Country</th>
                  <th className="px-4 py-2">Answered Calls</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t">
                    <td className="px-4 py-3">{o._id}</td>
                    <td className="px-4 py-3">{o.country}</td>
                    <td className="px-4 py-3">{o.no_of_answered_calls}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full text-xs border px-3 py-1 font-medium ${statusClass(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="px-3 py-1 bg-[#263978] text-white rounded-md"
                        onClick={() => navigateTo("/all-order-table/view", { selectedId: o._id })}
                      >
                        View
                      </button>
                    </td>
                    {o.status === "processing" && (
                      <td className="px-4 py-3">
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded-md"
                          onClick={() => stopExecution(o._id)}
                        >
                          Stop
                        </button>
                      </td>
                    )}
                    {o.status === "stopped" && (
                      <td className="px-4 py-3">
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded-md"
                          onClick={() => startExecution(o._id)}
                        >
                          Start
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-3">
            <p className="text-sm text-gray-600">
              {`Showing ${
                (pagination.page - 1) * pagination.limit + 1
              } – ${
                (pagination.page - 1) * pagination.limit + orders.length
              } of ${pagination.totalResults}`}
            </p>

            <div className="flex flex-wrap gap-2">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setPagination({ ...pagination, page })}
                  className={`px-3 py-1 border rounded ${
                    pagination.page === page
                      ? "bg-[#263978] text-white"
                      : "bg-white text-[#263978]"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <select
              className="border border-gray-300 py-1 px-2 rounded text-gray-600"
              value={pagination.limit}
              onChange={(e) =>
                setPagination({ ...pagination, page: 1, limit: Number(e.target.value) })
              }
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </Fragment>
      ) : (
        /* when an order is selected: only show status dashboard */
        <div className="mt-8">
          {orders.find((d) => d._id === selectedId)?.status === "processing" && (
            <Spin className="mb-2" />
          )}
          <SalesBotStatusDash selectedId={selectedId} />
        </div>
      )}
    </div>
  );
};

// Wrapper with Suspense for useRoomAPI hook
const AllOrdersTableWithSuspense = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#263978]"></div>
    </div>
  }>
    <AllOrdersTable />
  </Suspense>
);

export default withProtection(AllOrdersTableWithSuspense);
