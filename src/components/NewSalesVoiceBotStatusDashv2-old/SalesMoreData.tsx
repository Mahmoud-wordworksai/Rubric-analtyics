/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Tabs, Spin } from "antd";
import type { TabsProps } from "antd";
// import AudioPlayer from "./playAudio";
import axiosInstance from "@/lib/axios";
import { API_BASE_URL, API_KEY } from "@/constants";

interface ConversationItem {
  role: string;
  content: string;
}

interface EmailDetails {
  Message_id?: string;
  Date?: string;
  To_email?: string;
  Subject?: string;
  Body?: string;
  status?: string;
  status_counts?: {
    open?: number;
    delivered?: number;
    processed?: number;
  };
  error?: string;
}

interface CallInfo {
  ALegRequestUUID?: string;
  ALegUUID?: string;
  AnswerTime?: string;
  BillDuration?: string;
  BillRate?: string;
  CallStatus?: string;
  CallUUID?: string;
  Direction?: string;
  Duration?: string;
  EndTime?: string;
  Event?: string;
  From?: string;
  HangupCause?: string;
  HangupCauseCode?: string;
  HangupCauseName?: string;
  HangupSource?: string;
  ParentAuthID?: string;
  RequestUUID?: string;
  STIRAttestation?: string;
  STIRVerification?: string;
  SessionStart?: string;
  StartTime?: string;
  To?: string;
  TotalCost?: string;
  session_id?: string;
}

interface SMSDetails {
  status: string;
  message_uuid: string[];
  to_phone: string;
  from_phone: string;
  message: string;
}

interface OrderData {
  uuid?: string;
  provider?: string;
  phone_number?: string;
  callsid?: string;
  format_values?: {
    customer_name?: string;
  };
  model_data?: {
    outcome?: string;
  };
  email_details?: EmailDetails;
  call_info?: CallInfo;
  sms_details?: SMSDetails;
  recording_url?: string;
  contact_attempts?: string;
}

interface CallDetailsViewProps {
  order: OrderData;
  orderId: string;
  isActive: boolean;
}

const CallDetailsView: React.FC<CallDetailsViewProps> = ({ order, orderId, isActive }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("1");

  const getOrder = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}/sessions/${orderId}?api_key=${API_KEY}`
      );
      setConversations(res.data.conversation || []);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      getOrder();
    }
  }, [orderId, order?.callsid, isActive]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Field component for consistent styling
  const Field: React.FC<{
    label: string;
    value: string | number | React.ReactNode;
  }> = ({ label, value }) => (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{label}</h3>
      {typeof value === "string" || typeof value === "number" ? (
        <p className="text-gray-800 bg-gray-100 p-2 rounded-md">
          {value || "Not available"}
        </p>
      ) : (
        value
      )}
    </div>
  );

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <div className="flex items-center space-x-2 px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"
            />
          </svg>
          <span>Conversations</span>
        </div>
      ),
      children: (
        <div className="p-4">
          <div className="bg-white rounded-lg p-4 mb-4 shadow-md">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spin size="large" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="space-y-4">
                {conversations.map(
                  (convr: ConversationItem, index: number) => (
                    <div key={index}>
                      {convr?.role === "user" && (
                        <div className="flex items-start justify-end gap-3">
                          <div className="bg-blue-100 p-3 rounded-lg rounded-tr-none max-w-[80%]">
                            {convr?.content ? convr?.content : "No content"}
                          </div>
                          <div className="bg-blue-500 rounded-full p-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="white"
                            >
                              <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {convr?.role === "assistant" && (
                        <div className="flex items-start gap-3">
                          <div className="bg-indigo-500 rounded-full p-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="white"
                            >
                              <path d="m798-322-62-62q44-41 69-97t25-119q0-63-25-118t-69-96l62-64q56 53 89 125t33 153q0 81-33 153t-89 125ZM670-450l-64-64q18-17 29-38.5t11-47.5q0-26-11-47.5T606-686l64-64q32 29 50 67.5t18 82.5q0 44-18 82.5T670-450Zm-310 10q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-120v-112q0-33 17-62t47-44q51-26 115-44t141-18q77 0 141 18t115 44q30 15 47 44t17 62v112H40Zm80-80h480v-32q0-11-5.5-20T580-266q-36-18-92.5-36T360-320q-71 0-127.5 18T140-266q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-600q0-33-23.5-56.5T360-680q-33 0-56.5 23.5T280-600q0 33 23.5 56.5T360-520Zm0-80Zm0 400Z" />
                            </svg>
                          </div>
                          <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
                            {convr?.content ? convr?.content : "No content"}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No conversation data available
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Customer Information
            </h2>
            <Field
              label="Name"
              value={order?.format_values?.customer_name || "Not provided"}
            />
            <Field
              label="Phone"
              value={order?.phone_number || "Not provided"}
            />
            <Field
              label="Outcome"
              value={order?.model_data?.outcome || "Not available"}
            />
            <Field
              label="Attempts"
              value={order?.contact_attempts || "Not available"}
            />
            {/* <Field
              label="Recordings"
              value={
                <div className="mt-2">
                  <AudioPlayer
                    audioUrl={useMemo(() => order?.recording_url, [order?.recording_url])}
                  />
                </div>
              }
            /> */}
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div className="flex items-center space-x-2 px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <span>Email Details</span>
        </div>
      ),
      children: (
        <div className="p-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            {/* <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Email Information
            </h2> */}

            {order?.email_details?.status === "failed" ? (
              <>
                <Field
                  label="Status"
                  value={order?.email_details?.status || "Not available"}
                />
                <Field
                  label="Error"
                  value={order?.email_details?.error || "Not available"}
                />
              </>
            ) : (
              <>
                <Field
                  label="Message ID"
                  value={order?.email_details?.Message_id || "Not available"}
                />
                <Field
                  label="Date"
                  value={order?.email_details?.Date || "Not available"}
                />
                <Field
                  label="To Email"
                  value={order?.email_details?.To_email || "Not available"}
                />
                <Field
                  label="Subject"
                  value={order?.email_details?.Subject || "Not available"}
                />

                <Field
                  label="Body"
                  value={
                    <div
                      className="p-4 bg-gray-100 rounded-lg max-h-64 overflow-y-auto mt-2"
                      dangerouslySetInnerHTML={{
                        __html:
                          order?.email_details?.Body || "<p>Not available</p>",
                      }}
                    ></div>
                  }
                />

                <Field
                  label="Status"
                  value={order?.email_details?.status || "Not available"}
                />

                <Field
                  label="Status Counts"
                  value={(() => {
                    const statusCounts = order?.email_details?.status_counts || {};
                    const statusItems = Object.entries(statusCounts);

                    if (statusItems.length === 0) {
                      return (
                        <div className="text-gray-500 text-center py-4">
                          No status data available
                        </div>
                      );
                    }

                    const gridCols =
                      statusItems.length <= 2
                        ? "grid-cols-2"
                        : statusItems.length <= 4
                        ? "grid-cols-3"
                        : "grid-cols-4";

                    return (
                      <div className={`grid ${gridCols} gap-4 mt-2`}>
                        {statusItems.map(([key, value]) => {
                          const getStatusColor = (status: string) => {
                            switch (status.toLowerCase()) {
                              case 'open': return 'bg-green-100 text-green-800';
                              case 'delivered': return 'bg-blue-100 text-blue-800';
                              case 'processed': return 'bg-purple-100 text-purple-800';
                              case 'clicked': return 'bg-amber-100 text-amber-800';
                              case 'bounced': return 'bg-red-100 text-red-800';
                              case 'failed': return 'bg-rose-100 text-rose-800';
                              default: return 'bg-gray-100 text-gray-800';
                            }
                          };

                          return (
                            <div
                              key={key}
                              className={`${getStatusColor(key)} rounded-lg p-3 text-center`}
                            >
                              <div className="text-2xl font-bold">
                                {value || 0}
                              </div>
                              <div className="text-sm capitalize">
                                {key.replace(/_/g, " ")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                />
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <div className="flex items-center space-x-2 px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span>Call Info</span>
        </div>
      ),
      children: (
        <div className="p-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            {/* <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Call Details
            </h2> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Field
                  label="Call UUID"
                  value={order?.call_info?.CallUUID || "Not available"}
                />
                <Field
                  label="From"
                  value={order?.call_info?.From || "Not available"}
                />
                <Field
                  label="To"
                  value={order?.call_info?.To || "Not available"}
                />
                <Field
                  label="Direction"
                  value={order?.call_info?.Direction || "Not available"}
                />
                <Field
                  label="Call Status"
                  value={
                    <span
                      className={`inline-block px-3 py-1 rounded-full ${
                        order?.call_info?.CallStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : order?.call_info?.CallStatus === "no-answer"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order?.call_info?.CallStatus || "Not available"}
                    </span>
                  }
                />
                <Field
                  label="Duration"
                  value={`${order?.call_info?.Duration || "0"} seconds`}
                />
                <Field
                  label="Bill Duration"
                  value={`${order?.call_info?.BillDuration || "0"} seconds`}
                />
                <Field
                  label="Total Cost"
                  value={`$${order?.call_info?.TotalCost || "0.00"}`}
                />
              </div>

              <div className="space-y-4">
                <Field
                  label="Start Time"
                  value={order?.call_info?.StartTime || "Not available"}
                />
                <Field
                  label="Answer Time"
                  value={order?.call_info?.AnswerTime || "Not available"}
                />
                <Field
                  label="End Time"
                  value={order?.call_info?.EndTime || "Not available"}
                />
                <Field
                  label="Hangup Cause"
                  value={order?.call_info?.HangupCause || "Not available"}
                />
                <Field
                  label="Hangup Source"
                  value={order?.call_info?.HangupSource || "Not available"}
                />
                <Field
                  label="Session ID"
                  value={order?.call_info?.session_id || "Not available"}
                />
                <Field
                  label="Request UUID"
                  value={order?.call_info?.RequestUUID || "Not available"}
                />
                <Field
                  label="ALeg UUID"
                  value={order?.call_info?.ALegUUID || "Not available"}
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "4",
      label: (
        <div className="flex items-center space-x-2 px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
          <span>SMS Details</span>
        </div>
      ),
      children: (
        <div className="p-4">
          <div className="bg-white rounded-lg p-4 shadow-md">
            {/* <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Call Details
            </h2> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
              <Field
                  label="Message ID"
                  value={order?.sms_details?.message_uuid && order?.sms_details?.message_uuid.length > 0 ? order?.sms_details?.message_uuid[0] : "Not available"}
                />
                <Field
                  label="From"
                  value={order?.sms_details?.from_phone || "Not available"}
                />
                <Field
                  label="To"
                  value={order?.sms_details?.to_phone || "Not available"}
                />
                <Field
                  label="SMS Status"
                  value={
                    <span
                      className={`inline-block px-3 py-1 rounded-full ${
                        order?.sms_details?.status === "success"
                          ? "bg-green-100 text-green-800"
                          : order?.sms_details?.status !== "success"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order?.sms_details?.status || "Not available"}
                    </span>
                  }
                />

                <Field
                  label="Message"
                  value={
                    <textarea
                      className="w-full text-gray-800 border-none bg-white/50 p-2 rounded-md focus:outline-none focus:ring-0 focus:border-transparent"
                      rows={4}
                      value={`${order?.sms_details?.message || "-"}`}
                      disabled
                      readOnly
                    />
                  }
                />
              </div>

            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-lg p-1 shadow-sm">
      <div className="flex items-center space-x-3 p-4 bg-white border-b">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="text-xl font-medium">Call Details</span>
      </div>
      
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={items}
        tabBarStyle={{ marginBottom: 0, padding: "10px 10px 0" }}
      />
{/* 
      <div className="p-4 bg-white border-t mt-4">
        <div className="text-gray-700">
          <span className="text-sm opacity-80">Customer:</span>
          <span className="font-semibold ml-2">
            {order?.format_values?.customer_name || "Anonymous"}
          </span>
        </div>
      </div> */}

      <style>{`
        .ant-tabs-tab {
          background: #f3f4f6 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px 8px 0 0 !important;
          margin: 0 4px !important;
          padding: 8px 16px !important;
        }
        
        .ant-tabs-tab:hover {
          background: #e5e7eb !important;
        }
        
        .ant-tabs-tab-active {
          background: #ffffff !important;
          border-bottom-color: transparent !important;
        }
        
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #4f46e5 !important;
          font-weight: 600 !important;
        }
        
        .ant-tabs-ink-bar {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default CallDetailsView;