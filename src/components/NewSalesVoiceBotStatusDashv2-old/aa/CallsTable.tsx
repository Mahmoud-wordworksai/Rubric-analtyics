/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, Tooltip, Badge, Spin, Empty, Button } from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined, LoadingOutlined, RightOutlined } from "@ant-design/icons";
import SalesMoreData from "../SalesMoreData";
import AudioPlayer from "../playAudio";

const { Option } = Select;

// Define call order type
interface CallOrder {
  session_id: string;
  to_number: string;
  is_email_triggered: boolean;
  model_data?: {
    outcome?: string;
  };
  [key: string]: any; // For other properties
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100
    }
  },
  hover: {
    y: -5,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20
    }
  },
  selected: {
    scale: 1.02,
    y: -5,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const detailsVariants = {
  enter: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.3
    }
  },
  center: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3
    }
  }
};

interface CallsTableProps {
  allOrders: CallOrder[];
  tableLoading: boolean;
  currOutcomeEdit: CallOrder | null;
  setCurrOutcomeEdit: (order: CallOrder | null) => void;
  outcomeLoading: boolean;
  saveOutcome: (data: CallOrder) => Promise<any>;
  setOutcomeLoading: (loading: boolean) => void;
}

export const CallsTable = ({
  allOrders,
  tableLoading,
  currOutcomeEdit,
  setCurrOutcomeEdit,
  outcomeLoading,
  saveOutcome,
  setOutcomeLoading
}: CallsTableProps) => {
  const truncateString = (str: string, maxLength = 10) => {
    if (!str) return "";
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  const [selectedOrder, setSelectedOrder] = useState<CallOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [orderedItems, setOrderedItems] = useState<CallOrder[]>([]);

  // Initialize orderedItems when allOrders changes
  useEffect(() => {
    setOrderedItems([...allOrders]);
  }, [allOrders]);

  // Select first item by default when component mounts or allOrders changes
  useEffect(() => {
    if (orderedItems && orderedItems.length > 0 && !selectedOrder) {
      setSelectedOrder(orderedItems[0]);
      setIsModalOpen(true);
    } else if (orderedItems.length === 0) {
      setSelectedOrder(null);
      setIsModalOpen(false);
    }
  }, [orderedItems]);

  const getOutcomeColor = (outcome: string | undefined) => {
    switch (outcome) {
      case "positive":
        return "text-green-700 bg-green-100";
      case "negative":
        return "text-red-700 bg-red-100";
      case "neutral":
        return "text-blue-700 bg-blue-100";
      case "incomplete":
        return "text-amber-700 bg-amber-100";
      case "voicemail":
        return "text-purple-700 bg-purple-100";
      case "none":
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const handleCardClick = (order: CallOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleOutcomeChange = async (order: CallOrder, newOutcome: string) => {
    const updatedOrder = {
      ...order,
      model_data: {
        ...order.model_data,
        outcome: newOutcome,
      },
    };

    // Find and update the order in orderedItems
    const updatedItems = orderedItems.map(item => 
      item.session_id === order.session_id ? updatedOrder : item
    );
    setOrderedItems(updatedItems);

    // Update selected order if it was changed
    if (selectedOrder?.session_id === order.session_id) {
      setSelectedOrder(updatedOrder);
    }

    setCurrOutcomeEdit(updatedOrder);
  };

  if (tableLoading) {
    return (
      <div className="flex justify-center items-center p-12 h-screen">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} tip="Loading data..." />
      </div>
    );
  }

  if (!orderedItems || orderedItems.length === 0) {
    return (
      <div className="p-12 h-screen flex flex-col items-center justify-center">
        <Empty 
          description="No call data available" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
        <p className="text-gray-500 mt-4">There are no call records to display at this time.</p>
      </div>
    );
  }

  return (
    <>
    {/* Recording Audio Player */}
    {selectedOrder?.recording_url && (
      <motion.div 
        className="w-full bg-white pb-1 border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AudioPlayer audioUrl={selectedOrder?.recording_url} />
      </motion.div>
    )}


    <div className="flex w-full h-screen overflow-hidden max-[1024px]:flex-col max-[1024px]:gap-4">

      {/* Left Sidebar - Call List (30% width) */}
      <motion.div 
        className="w-1/3 bg-gray-50 p-4 max-[1024px]:overflow-y-hidden max-[1024px]:h-full max-[1024px]:min-h-fit overflow-y-auto border-r border-gray-200 max-[1024px]:w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800 max-[1024px]:hidden">Call Records</h2>
        <div className="hidden items-center justify-between mb-4 px-4 max-[1024px]:flex">
          <h2 className="text-lg font-semibold text-gray-800">Call Records</h2>
          <div className="flex space-x-2">
            <Button 
              onClick={handleScrollLeft}
              icon={<RightOutlined rotate={180} />}
              className="flex items-center justify-center"
            />
            <Button 
              onClick={handleScrollRight}
              icon={<RightOutlined />}
              className="flex items-center justify-center"
            />
          </div>
        </div>

        {/* ---- for multi screen */}

        <div className="space-y-3 max-[1024px]:hidden">
          <AnimatePresence mode="wait">
            {orderedItems.map((order) => (
              <motion.div
                key={order.session_id}
                className={`p-4 rounded-lg shadow-sm cursor-pointer max-[1024px]:w-[220px] max-[1024px]:m-4 ${
                  selectedOrder?.session_id === order.session_id 
                    ? "bg-blue-50 border-l-4 border-blue-500" 
                    : "bg-white hover:bg-gray-100"
                }`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                exit="exit"
                onClick={() => handleCardClick(order)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    ID: {truncateString(order.session_id)}
                  </span>
                  <Badge 
                    status={order.is_email_triggered ? "success" : "default"} 
                    text={order.is_email_triggered ? "Email Sent" : "No Email"} 
                  />
                </div>
                
                <div className="flex justify-between items-start mb-3">
                  <div className="font-medium">{order.to_number}</div>
                  <Badge 
                    status={order.is_sms_triggered ? "success" : "default"} 
                    text={order.is_sms_triggered ? "SMS Sent" : "No SMS"} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  {currOutcomeEdit && currOutcomeEdit.session_id === order.session_id ? (
                    <div className="flex items-center space-x-2">
                      <Select
                        value={currOutcomeEdit?.model_data?.outcome || ""}
                        onChange={(value) => handleOutcomeChange(order, value)}
                        className="w-24"
                        dropdownClassName="backdrop-blur-md bg-white/95"
                      >
                        <Option value="qualified">qualified</Option>
                        <Option value="notqualified">not qualified</Option>
                        <Option value="incomplete">incomplete</Option>
                        <Option value="callback">callback</Option>
                        <Option value="voicemail">voicemail</Option>
                      </Select>
                      
                      <div className="flex space-x-1">
                        <Tooltip title="Save Outcome">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setOutcomeLoading(true);
                              await saveOutcome(currOutcomeEdit);
                              setOutcomeLoading(false);
                            }}
                            className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                            disabled={outcomeLoading}
                          >
                            {outcomeLoading ? (
                              <LoadingOutlined />
                            ) : (
                              <CheckOutlined />
                            )}
                          </motion.button>
                        </Tooltip>
                        
                        <Tooltip title="Cancel">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrOutcomeEdit(null);
                            }}
                            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            <CloseOutlined />
                          </motion.button>
                        </Tooltip>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(order?.model_data?.outcome)}`}>
                        {order?.model_data?.outcome || "none"}
                      </span>
                      
                      <Tooltip title="Edit Outcome">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrOutcomeEdit(order);
                          }}
                          className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                        >
                          <EditOutlined />
                        </motion.button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

         {/* ---  for multi screen */}

        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 px-2 hide-scrollbar hidden max-[1024px]:flex" 
          style={{ scrollBehavior: 'smooth' }}
        >
          <motion.div 
            className="flex space-x-4 px-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="wait">
              {orderedItems.map((order) => (
                <motion.div
                  key={order.session_id}
                  className={`
                    flex-shrink-0 w-72 p-4 rounded-lg border cursor-pointer
                    backdrop-blur-sm transition-all duration-300
                    ${selectedOrder?.session_id === order.session_id 
                      ? 'bg-blue-50 border-blue-500 shadow-lg' 
                      : 'bg-white/30 border-gray-200 hover:bg-white/60'
                    }
                  `}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => handleCardClick(order)}
                  layout
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-medium text-gray-800 truncate">
                      ID: {truncateString(order.session_id, 8)}
                    </div>
                    <Badge 
                      status={order.is_email_triggered ? "success" : "default"} 
                      text={order.is_email_triggered ? "Email Sent" : "No Email"} 
                    />
                  </div>
                   
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-medium">{order.to_number}</div>
                    <Badge 
                      status={order.is_sms_triggered ? "success" : "default"} 
                      text={order.is_sms_triggered ? "SMS Sent" : "No SMS"} 
                    />
                  </div>
                  
                  <div className="mb-4">
                    {currOutcomeEdit && currOutcomeEdit.session_id === order.session_id ? (
                      <div className="flex items-center space-x-2">
                       <Select
                          value={currOutcomeEdit?.model_data?.outcome || ""}
                          onChange={(value) => handleOutcomeChange(order, value)}
                          className="w-full"
                          dropdownClassName="backdrop-blur-md bg-white/95"
                        >
                          <Option value="committed">Committed</Option>
                          <Option value="partial_payment">Partial Payment</Option>
                          <Option value="refused">Refused</Option>
                          <Option value="requested_extension">Requested Extension</Option>
                          <Option value="escalation_needed">Escalation Needed</Option>
                          <Option value="no_response">No Response</Option>
                          <Option value="voicemail">Voicemail</Option>
                        </Select>

                        <div className="flex space-x-1">
                          <Tooltip title="Save Outcome">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setOutcomeLoading(true);
                                await saveOutcome(currOutcomeEdit);
                                setOutcomeLoading(false);
                              }}
                              className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                              disabled={outcomeLoading}
                            >
                              {outcomeLoading ? (
                                <LoadingOutlined />
                              ) : (
                                <CheckOutlined />
                              )}
                            </motion.button>
                          </Tooltip>
                          
                          <Tooltip title="Cancel">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrOutcomeEdit(null);
                              }}
                              className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                            >
                              <CloseOutlined />
                            </motion.button>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${getOutcomeColor(order?.model_data?.outcome)}`}>
                          {order?.model_data?.outcome || "none"}
                        </span>
                        
                        <Tooltip title="Edit Outcome">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrOutcomeEdit(order);
                            }}
                            className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                          >
                            <EditOutlined />
                          </motion.button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

       {/* ---  for multi screen */}

      </motion.div>

      {/* Right Content Area - Details (70% width) */}
      <div className="w-full h-full bg-white overflow-y-auto">
        <AnimatePresence mode="wait">
          {isModalOpen && selectedOrder ? (
            <motion.div
              key={selectedOrder.session_id}
              variants={detailsVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <SalesMoreData
                order={selectedOrder}
                orderId={selectedOrder.session_id}
                isActive={isModalOpen}
              />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-xl">No data</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
};
