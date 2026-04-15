/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Tabs, Spin, Modal, Button } from "antd";
import type { TabsProps } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { FiBarChart2, FiCheckSquare } from "react-icons/fi";
import { SessionKPIDashboard } from "@/components/SessionKPI";
import RubricAnalyticsForCall from "@/components/RubricAnalyticsForCall";
// import AudioPlayer from "./playAudio";
import axiosInstance from "@/lib/axios";
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";

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
  execution_id?: string;
  provider?: string;
  phone_number?: string;
  callsid?: string;
  format_values?: {
    customer_name?: string;
    CUSTOMER_NAME?: string;
  };
  model_data?: {
    outcome?: string;
    disposition_code?: string;
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.3,
      staggerChildren: 0.1 
    }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

const tabContentVariants = {
  hidden: { 
    opacity: 0, 
    x: 20,
    scale: 0.98
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: { 
      duration: 0.4,
      ease: "easeOut" as const
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    scale: 0.98,
    transition: { 
      duration: 0.2,
      ease: "easeIn" as const
    }
  }
};

const conversationVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const messageVariants = {
  hidden: { 
    opacity: 0, 
    y: 15,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

const loadingVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut" as const
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

const statusCardVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 10
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut" as const
    }
  }
};

const CallDetailsView: React.FC<CallDetailsViewProps> = ({ order, orderId, isActive }) => {
  const { appendRoomParam } = useRoomAPI();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("1");
  const [isKpiModalOpen, setIsKpiModalOpen] = useState<boolean>(false);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState<boolean>(false);

  const getOrder = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(
        appendRoomParam(`${API_BASE_URL}/sessions/${orderId}?api_key=${API_KEY}`)
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

  // Mobile-first responsive Field component with animation
  const Field: React.FC<{
    label: string;
    value: string | number | React.ReactNode;
    fullWidth?: boolean;
    delay?: number;
  }> = ({ label, value, fullWidth = false, delay = 0 }) => (
    <motion.div 
      className={`mb-3 sm:mb-4 ${fullWidth ? 'col-span-full' : ''}`}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      <motion.h3 
        className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.1 }}
      >
        {label}
      </motion.h3>
      {typeof value === "string" || typeof value === "number" ? (
        <motion.p 
          className="text-sm sm:text-base text-gray-800 bg-gray-50 sm:bg-gray-100 p-2 sm:p-3 rounded-md break-words"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.2 }}
        >
          {value || "Not available"}
        </motion.p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.2 }}
        >
          {value}
        </motion.div>
      )}
    </motion.div>
  );

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <div className="flex items-center space-x-1 sm:space-x-2 px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs sm:text-sm">Chat</span>
        </div>
      ),
      children: (
        <AnimatePresence mode="wait">
          <motion.div 
            key="chat-tab"
            className="p-2 sm:p-4 bg-white"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Conversation Section */}
            <motion.div 
              className="bg-white rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    className="flex justify-center py-8"
                    variants={loadingVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    key="loading"
                  >
                    <Spin size="large" />
                  </motion.div>
                ) : conversations && conversations.length > 0 ? (
                  <motion.div 
                    className="space-y-3 sm:space-y-4 max-h-96 sm:max-h-none overflow-y-auto"
                    variants={conversationVariants}
                    initial="hidden"
                    animate="visible"
                    key="conversation-list"
                  >
                    {conversations.map(
                      (convr: ConversationItem, index: number) => (
                        <motion.div 
                          key={index}
                          variants={messageVariants}
                          layout
                        >
                          {convr?.role === "user" && (
                            <motion.div 
                              className="flex items-start justify-end gap-2 sm:gap-3"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <motion.div 
                                className="bg-blue-100 p-2 sm:p-3 rounded-lg rounded-tr-none max-w-[85%] sm:max-w-[80%]"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                              >
                                <p className="text-sm sm:text-base">
                                  {convr?.content ? convr?.content : "No content"}
                                </p>
                              </motion.div>
                              <motion.div 
                                className="bg-blue-500 rounded-full p-1.5 sm:p-2 flex-shrink-0"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.2 }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 sm:h-4 sm:w-4"
                                  viewBox="0 -960 960 960"
                                  fill="white"
                                >
                                  <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z" />
                                </svg>
                              </motion.div>
                            </motion.div>
                          )}

                          {convr?.role === "assistant" && (
                            <motion.div 
                              className="flex items-start gap-2 sm:gap-3"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <motion.div 
                                className="bg-indigo-500 rounded-full p-1.5 sm:p-2 flex-shrink-0"
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                transition={{ duration: 0.2 }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 sm:h-4 sm:w-4"
                                  viewBox="0 -960 960 960"
                                  fill="white"
                                >
                                  <path d="m798-322-62-62q44-41 69-97t25-119q0-63-25-118t-69-96l62-64q56 53 89 125t33 153q0 81-33 153t-89 125ZM670-450l-64-64q18-17 29-38.5t11-47.5q0-26-11-47.5T606-686l64-64q32 29 50 67.5t18 82.5q0 44-18 82.5T670-450Zm-310 10q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-120v-112q0-33 17-62t47-44q51-26 115-44t141-18q77 0 141 18t115 44q30 15 47 44t17 62v112H40Zm80-80h480v-32q0-11-5.5-20T580-266q-36-18-92.5-36T360-320q-71 0-127.5 18T140-266q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-600q0-33-23.5-56.5T360-680q-33 0-56.5 23.5T280-600q0 33 23.5 56.5T360-520Zm0-80Zm0 400Z" />
                                </svg>
                              </motion.div>
                              <motion.div 
                                className="bg-gray-100 p-2 sm:p-3 rounded-lg rounded-tl-none max-w-[85%] sm:max-w-[80%]"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                              >
                                <p className="text-sm sm:text-base">
                                  {convr?.content ? convr?.content : "No content"}
                                </p>
                              </motion.div>
                            </motion.div>
                          )}
                        </motion.div>
                      )
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    className="text-center py-8 text-gray-500 text-sm sm:text-base"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key="no-data"
                  >
                    No conversation data available
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Customer Information */}
            <motion.div 
              className="bg-white rounded-lg p-3 sm:p-4 shadow-sm"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <motion.h2 
                className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Customer Information
              </motion.h2>
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <Field
                  label="Name"
                  value={(order?.format_values?.customer_name ||
order?.format_values?.CUSTOMER_NAME) || "Not provided"}
                  delay={0.1}
                />
                <Field
                  label="Phone"
                  value={order?.phone_number || "Not provided"}
                  delay={0.2}
                />
                <Field
                  label="Outcome"
                  value={order?.model_data?.disposition_code || "Not available"}
                  delay={0.3}
                />
                <Field
                  label="Attempts"
                  value={order?.contact_attempts || "Not available"}
                  delay={0.4}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ),
    },
    {
      key: "2",
      label: (
        <div className="flex items-center space-x-1 sm:space-x-2 px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <span className="text-xs sm:text-sm">Email</span>
        </div>
      ),
      children: (
        <AnimatePresence mode="wait">
          <motion.div 
            key="email-tab"
            className="p-2 sm:p-4 bg-white"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-lg p-3 sm:p-4 shadow-sm"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              {order?.email_details?.status === "failed" ? (
                <motion.div 
                  className="grid grid-cols-1 gap-3 sm:gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Field
                    label="Status"
                    value={order?.email_details?.status || "Not available"}
                    delay={0.1}
                  />
                  <Field
                    label="Error"
                    value={order?.email_details?.error || "Not available"}
                    fullWidth
                    delay={0.2}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Field
                    label="Message ID"
                    value={order?.email_details?.Message_id || "Not available"}
                    delay={0.1}
                  />
                  <Field
                    label="Date"
                    value={order?.email_details?.Date || "Not available"}
                    delay={0.2}
                  />
                  <Field
                    label="To Email"
                    value={order?.email_details?.To_email || "Not available"}
                    delay={0.3}
                  />
                  <Field
                    label="Subject"
                    value={order?.email_details?.Subject || "Not available"}
                    delay={0.4}
                  />

                  <Field
                    label="Body"
                    fullWidth
                    delay={0.5}
                    value={
                      <motion.div
                        className="p-3 sm:p-4 bg-gray-50 sm:bg-gray-100 rounded-lg max-h-48 sm:max-h-64 overflow-y-auto mt-2 text-sm sm:text-base"
                        dangerouslySetInnerHTML={{
                          __html:
                            order?.email_details?.Body || "<p>Not available</p>",
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                      />
                    }
                  />

                  <Field
                    label="Status"
                    value={order?.email_details?.status || "Not available"}
                    delay={0.6}
                  />

                  <Field
                    label="Status Counts"
                    fullWidth
                    delay={0.7}
                    value={(() => {
                      const statusCounts = order?.email_details?.status_counts || {};
                      const statusItems = Object.entries(statusCounts);

                      if (statusItems.length === 0) {
                        return (
                          <motion.div 
                            className="text-gray-500 text-center py-4 text-sm sm:text-base"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                          >
                            No status data available
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div 
                          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mt-2"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {statusItems.map(([key, value], index) => {
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
                              <motion.div
                                key={key}
                                className={`${getStatusColor(key)} rounded-lg p-2 sm:p-3 text-center`}
                                variants={statusCardVariants}
                                whileHover={{ 
                                  scale: 1.05,
                                  y: -2,
                                  transition: { duration: 0.2 }
                                }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <motion.div
                                  className="text-lg sm:text-2xl font-bold"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: 0.8 + (index * 0.1),
                                    type: "spring" as const,
                                    stiffness: 200
                                  }}
                                >
                                  {value || 0}
                                </motion.div>
                                <div className="text-xs sm:text-sm capitalize">
                                  {key.replace(/_/g, " ")}
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      );
                    })()}
                  />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ),
    },
    {
      key: "3",
      label: (
        <div className="flex items-center space-x-1 sm:space-x-2 px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span className="text-xs sm:text-sm">Call</span>
        </div>
      ),
      children: (
        <AnimatePresence mode="wait">
          <motion.div 
            key="call-tab"
            className="p-2 sm:p-4 bg-white"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-lg p-3 sm:p-4 shadow-sm"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Field
                    label="Call UUID"
                    value={order?.call_info?.CallUUID || "Not available"}
                    delay={0.1}
                  />
                  <Field
                    label="From"
                    value={order?.call_info?.From || "Not available"}
                    delay={0.2}
                  />
                  <Field
                    label="To"
                    value={order?.call_info?.To || "Not available"}
                    delay={0.3}
                  />
                  <Field
                    label="Direction"
                    value={order?.call_info?.Direction || "Not available"}
                    delay={0.4}
                  />
                  <Field
                    label="Call Status"
                    delay={0.5}
                    value={
                      <motion.span
                        className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                          order?.call_info?.CallStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : order?.call_info?.CallStatus === "no-answer"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {order?.call_info?.CallStatus || "Not available"}
                      </motion.span>
                    }
                  />
                  <Field
                    label="Duration"
                    value={`${order?.call_info?.Duration || "0"} seconds`}
                    delay={0.6}
                  />
                  <Field
                    label="Bill Duration"
                    value={`${order?.call_info?.BillDuration || "0"} seconds`}
                    delay={0.7}
                  />
                  <Field
                    label="Total Cost"
                    value={`${order?.call_info?.TotalCost || "0.00"}`}
                    delay={0.8}
                  />
                </motion.div>

                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Field
                    label="Start Time"
                    value={order?.call_info?.StartTime || "Not available"}
                    delay={0.1}
                  />
                  <Field
                    label="Answer Time"
                    value={order?.call_info?.AnswerTime || "Not available"}
                    delay={0.2}
                  />
                  <Field
                    label="End Time"
                    value={order?.call_info?.EndTime || "Not available"}
                    delay={0.3}
                  />
                  <Field
                    label="Hangup Cause"
                    value={order?.call_info?.HangupCause || "Not available"}
                    delay={0.4}
                  />
                  <Field
                    label="Hangup Source"
                    value={order?.call_info?.HangupSource || "Not available"}
                    delay={0.5}
                  />
                  <Field
                    label="Session ID"
                    value={order?.call_info?.session_id || "Not available"}
                    delay={0.6}
                  />
                  <Field
                    label="Request UUID"
                    value={order?.call_info?.RequestUUID || "Not available"}
                    delay={0.7}
                  />
                  <Field
                    label="ALeg UUID"
                    value={order?.call_info?.ALegUUID || "Not available"}
                    delay={0.8}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ),
    },
    {
      key: "4",
      label: (
        <div className="flex items-center space-x-1 sm:space-x-2 px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
          <span className="text-xs sm:text-sm">SMS</span>
        </div>
      ),
      children: (
        <AnimatePresence mode="wait">
          <motion.div 
            key="sms-tab"
            className="p-2 sm:p-4 bg-white"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-lg p-3 sm:p-4 shadow-sm"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Field
                    label="Message ID"
                    value={order?.sms_details?.message_uuid && order?.sms_details?.message_uuid.length > 0 ? order?.sms_details?.message_uuid[0] : "Not available"}
                    delay={0.1}
                  />
                  <Field
                    label="From"
                    value={order?.sms_details?.from_phone || "Not available"}
                    delay={0.2}
                  />
                  <Field
                    label="To"
                    value={order?.sms_details?.to_phone || "Not available"}
                    delay={0.3}
                  />
                  <Field
                    label="SMS Status"
                    delay={0.4}
                    value={
                      <motion.span
                        className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                          order?.sms_details?.status === "success"
                            ? "bg-green-100 text-green-800"
                            : order?.sms_details?.status !== "success"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {order?.sms_details?.status || "Not available"}
                      </motion.span>
                    }
                  />
                </motion.div>

                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Field
                    label="Message"
                    fullWidth
                    delay={0.5}
                    value={
                      <motion.textarea
                        className="w-full text-sm sm:text-base text-gray-800 border-none bg-white/50 p-2 sm:p-3 rounded-md focus:outline-none focus:ring-0 focus:border-transparent resize-none"
                        rows={4}
                        value={`${order?.sms_details?.message || "-"}`}
                        disabled
                        readOnly
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        whileFocus={{ scale: 1.02 }}
                      />
                    }
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ),
    },
  ];

  return (
    <div
      className="w-full max-w-full"
      // initial={{ opacity: 0, y: 20 }}
      // animate={{ opacity: 1, y: 0 }}
      // transition={{ duration: 0.5, ease: "easeOut" as const }}
    >
      <div
        className="rounded-lg shadow-sm bg-white max-h-[80vh] overflow-y-auto"
        // initial={{ scale: 0.95 }}
        // animate={{ scale: 1 }}
        // transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Header - Fixed on Scroll */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 flex-shrink-0"
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
            <div className="min-w-0 flex-1">
              <span className="text-lg sm:text-xl font-medium text-gray-900 truncate block">
                Call Details
              </span>
              <span className="text-xs sm:text-sm text-gray-500 block sm:hidden">
                {order?.format_values?.customer_name || "Anonymous"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* KPI Overview Button */}
            <Button
              type="primary"
              icon={<FiBarChart2 className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsKpiModalOpen(true);
              }}
              className="flex items-center gap-1.5 hover:!border-white hover:!border-2"
              style={{ backgroundColor: '#263978', borderColor: '#263978' }}
            >
              <span className="hidden sm:inline">KPI Overview</span>
              <span className="sm:hidden">KPI</span>
            </Button>
            
            {/* Rubric Analytics Button */}
            <Button
              type="primary"
              icon={<FiCheckSquare className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsRubricModalOpen(true);
              }}
              className="flex items-center gap-1.5 hover:!border-white hover:!border-2"
              style={{ backgroundColor: '#1e40af', borderColor: '#1e40af' }}
            >
              <span className="hidden sm:inline">Rubric Analytics</span>
              <span className="sm:hidden">RA</span>
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={items}
            tabBarStyle={{ 
              marginBottom: 0, 
              padding: "8px 8px 0",
              background: '#ffffff',
            }}
            size="small"
          />
        </div>

        {/* Customer info footer - hidden on mobile, shown on larger screens */}
        <motion.div 
          className="hidden sm:block p-3 sm:p-4 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <motion.div 
            className="text-gray-700 flex items-center justify-between"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <span className="text-sm opacity-80">Customer:</span>
              <motion.span 
                className="font-semibold ml-2"
                whileHover={{ color: "#4f46e5" }}
                transition={{ duration: 0.2 }}
              >
                {order?.format_values?.customer_name || "Anonymous"}
              </motion.span>
            </div>
            <div className="text-sm text-gray-500">
              {order?.phone_number && (
                <motion.span
                  whileHover={{ color: "#374151" }}
                  transition={{ duration: 0.2 }}
                >
                  Phone: {order.phone_number}
                </motion.span>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* KPI Overview Modal - Full Screen */}
      <Modal
        open={isKpiModalOpen}
        onCancel={() => setIsKpiModalOpen(false)}
        footer={null}
        width="100vw"
        style={{ maxWidth: '100vw', top: 0, margin: 0, padding: 0 }}
        styles={{
          body: { padding: 0, height: '100vh', overflow: 'hidden' },
          content: { padding: 0, borderRadius: 0 },
        }}
        closeIcon={
          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        }
        className="kpi-modal-fullscreen"
        destroyOnClose
      >
        <SessionKPIDashboard
          sessionId={orderId}
          onBack={() => setIsKpiModalOpen(false)}
        />
      </Modal>

      {/* Rubric Analytics Modal - Full Screen */}
      <Modal
        open={isRubricModalOpen}
        onCancel={() => setIsRubricModalOpen(false)}
        footer={null}
        width="100vw"
        style={{ maxWidth: '100vw', top: 0, margin: 0, padding: 0 }}
        styles={{
          body: { padding: 0, height: '100vh', overflow: 'hidden' },
          content: { padding: 0, borderRadius: 0 },
        }}
        closeIcon={
          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        }
        className="rubric-modal-fullscreen"
        destroyOnClose
      >
        <RubricAnalyticsForCall
          sessionId={orderId}
          executionId={order?.execution_id || order?.uuid}
          visible={isRubricModalOpen}
          onClose={() => setIsRubricModalOpen(false)}
        />
      </Modal>

      <style>{`
        /* KPI Modal Fullscreen Styles */
        .kpi-modal-fullscreen {
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .kpi-modal-fullscreen .ant-modal-close {
          top: 12px;
          right: 24px;
          z-index: 50;
        }

        .kpi-modal-fullscreen .ant-modal-content {
          border-radius: 0 !important;
          height: 100vh;
          overflow: hidden;
        }

        .kpi-modal-fullscreen .ant-modal-body {
          height: 100vh;
          overflow: hidden;
        }

        /* Rubric Modal Fullscreen Styles */
        .rubric-modal-fullscreen {
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .rubric-modal-fullscreen .ant-modal-close {
          top: 12px;
          right: 24px;
          z-index: 50;
        }

        .rubric-modal-fullscreen .ant-modal-content {
          border-radius: 0 !important;
          height: 100vh;
          overflow: hidden;
        }

        .rubric-modal-fullscreen .ant-modal-body {
          height: 100vh;
          overflow: hidden;
        }

        .ant-tabs-tab {
          background: #f3f4f6 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 6px 6px 0 0 !important;
          margin: 0 2px !important;
          padding: 6px 8px !important;
          font-size: 12px !important;
          min-width: auto !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        @media (min-width: 640px) {
          .ant-tabs-tab {
            padding: 8px 12px !important;
            margin: 0 4px !important;
            font-size: 14px !important;
          }
        }
        
        .ant-tabs-tab:hover {
          background: #e5e7eb !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        .ant-tabs-tab-active {
          background: #ffffff !important;
          border-bottom-color: transparent !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
        }
        
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #4f46e5 !important;
          font-weight: 600 !important;
        }
        
        .ant-tabs-ink-bar {
          display: none !important;
        }
        
        .ant-tabs-content-holder {
          background: #f9fafb;
          border-radius: 0 0 8px 8px;
          overflow: hidden;
        }
        
        .ant-tabs-tabpane {
          padding: 0 !important;
        }
        
        /* Mobile scroll optimization */
        @media (max-width: 640px) {
          .ant-tabs-nav {
            margin: 0 !important;
          }
          
          .ant-tabs-nav-wrap {
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .ant-tabs-nav-wrap::-webkit-scrollbar {
            display: none;
          }
          
          .ant-tabs-nav-list {
            display: flex;
            min-width: max-content;
          }
        }

        /* Custom scrollbar for conversation area */
        .space-y-3::-webkit-scrollbar,
        .space-y-4::-webkit-scrollbar {
          width: 6px;
        }
        
        .space-y-3::-webkit-scrollbar-track,
        .space-y-4::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .space-y-3::-webkit-scrollbar-thumb,
        .space-y-4::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .space-y-3::-webkit-scrollbar-thumb:hover,
        .space-y-4::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default CallDetailsView;