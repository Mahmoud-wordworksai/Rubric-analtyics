/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, Tooltip, Badge, Spin, Empty, Button, Drawer } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  LoadingOutlined,
  RightOutlined,
  LeftOutlined,
  MenuOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";
import SalesMoreData from "../SalesMoreData";
import AudioPlayer from "../playAudio";
import { API_BASE_URL } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";

const { Option } = Select;

// Define call order type
interface CallOrder {
  session_id: string;
  to_number: string;
  is_email_triggered: boolean;
  is_sms_triggered?: boolean;
  recording_url?: string;
  model_data?: {
    outcome?: string;
    disposition_code?: string;
  };
  [key: string]: any;
}

interface CallsTableProps {
  allOrders: CallOrder[];
  tableLoading: boolean;
  currOutcomeEdit: CallOrder | null;
  setCurrOutcomeEdit: (order: CallOrder | null) => void;
  outcomeLoading: boolean;
  saveOutcome: (data: CallOrder) => Promise<any>;
  setOutcomeLoading: (loading: boolean) => void;
  callsTab: string;
}

export const CallsTable = ({
  allOrders,
  tableLoading,
  currOutcomeEdit,
  setCurrOutcomeEdit,
  outcomeLoading,
  saveOutcome,
  setOutcomeLoading,
}: CallsTableProps) => {
  const { appendRoomParam } = useRoomAPI();

  const truncateString = (str: string, maxLength = 10) => {
    if (!str) return "";
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  const [selectedOrder, setSelectedOrder] = useState<CallOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [orderedItems, setOrderedItems] = useState<CallOrder[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-select first item helper function
  const selectFirstItem = (items: CallOrder[]) => {
    if (items && items.length > 0) {
      const firstItem = items[0];
      setSelectedOrder(firstItem);
      setIsModalOpen(true);
      
      // Scroll to top of the list on desktop
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    } else {
      setSelectedOrder(null);
      setIsModalOpen(false);
    }
  };

  // Initialize orderedItems and auto-select first item when allOrders changes
  useEffect(() => {
    const newOrderedItems = [...allOrders];
    setOrderedItems(newOrderedItems);
    
    // Always select the first item when data changes (load, filter, search)
    selectFirstItem(newOrderedItems);
  }, [allOrders]);

  // Fallback effect to ensure first item is selected if none is selected
  useEffect(() => {
    if (orderedItems.length > 0 && !selectedOrder) {
      selectFirstItem(orderedItems);
    }
  }, [orderedItems, selectedOrder]);

  // Clear outcome edit when selected order changes
  useEffect(() => {
    if (selectedOrder && currOutcomeEdit && currOutcomeEdit.session_id !== selectedOrder.session_id) {
      setCurrOutcomeEdit(null);
    }
  }, [selectedOrder]);

  const getOutcomeColor = (outcome: string | undefined) => {
    switch (outcome) {
      case "PTP":
        return "text-green-700 bg-green-100 border-green-200";
      case "RTP":
        return "text-blue-700 bg-blue-100 border-blue-200";
      case "RTPF":
        return "text-emerald-700 bg-emerald-100 border-emerald-200";
      case "CLBK":
        return "text-amber-700 bg-amber-100 border-amber-200";
      case "PAID":
        return "text-cyan-700 bg-cyan-100 border-cyan-200";
      case "PAYNOW":
        return "text-pink-700 bg-pink-100 border-pink-200";
      case "voicemail":
        return "text-purple-700 bg-purple-100 border-purple-200";
      default:
        return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const handleCardClick = (order: CallOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
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

    const updatedItems = orderedItems.map(item => 
      item.session_id === order.session_id ? updatedOrder : item
    );
    setOrderedItems(updatedItems);

    if (selectedOrder?.session_id === order.session_id) {
      setSelectedOrder(updatedOrder);
    }

    setCurrOutcomeEdit(updatedOrder);
  };

  // Function to refresh data and auto-select first item (can be called externally)
  // const refreshAndSelectFirst = (newData?: CallOrder[]) => {
  //   const dataToUse = newData || allOrders;
  //   setOrderedItems([...dataToUse]);
  //   selectFirstItem(dataToUse);
  // };

  // Render loading state
  if (tableLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="text-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
          <p className="mt-4 text-gray-600">Loading call data...</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!orderedItems || orderedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Empty 
          description="No call data available" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
        <p className="text-gray-500 mt-4 text-center">
          There are no call records to display at this time.
        </p>
      </div>
    );
  }

  // Render call card component
  const CallCard = ({ order, isSelected = false }: { order: CallOrder; isSelected?: boolean }) => (
    <div
      className={`
        p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200' 
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={() => handleCardClick(order)}
    >
      {/* Header with ID and Email Badge */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">
          ID: {truncateString(order.session_id, isMobile ? 6 : 8)}
        </span>
        <Badge 
          status={order.is_email_triggered ? "success" : "default"} 
          text={
            <span className="text-xs">
              {order.is_email_triggered ? "Email" : "No Email"}
            </span>
          }
        />
      </div>
      
      {/* Phone Number and SMS Badge */}
      <div className="flex justify-between items-center mb-3">
        <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
          {order.to_number}
        </div>
        <Badge 
          status={order.is_sms_triggered ? "success" : "default"} 
          text={
            <span className="text-xs">
              {order.is_sms_triggered ? "SMS" : "No SMS"}
            </span>
          }
        />
      </div>
      
      {/* Outcome Section */}
      <div className="flex items-center justify-between">
        {currOutcomeEdit && currOutcomeEdit.session_id === order.session_id ? (
          <div className="flex items-center space-x-2 w-full">
            <Select
              value={currOutcomeEdit?.model_data?.disposition_code || ""}
              onChange={(value) => handleOutcomeChange(order, value)}
              className="flex-1 min-w-0"
              size="small"
              dropdownClassName="backdrop-blur-md bg-white/95"
            >
                <Option value="PTP">PTP</Option>
                <Option value="RTP">RTP</Option>
                <Option value="RTPF">RTPF</Option>
                <Option value="CLBK">CLBK</Option>
                <Option value="PAID">PAID</Option>
                <Option value="PAYNOW">PAYNOW</Option>
                <Option value="voicemail">Voicemail</Option>
            </Select>
            
            <div className="flex space-x-1 flex-shrink-0">
              <Tooltip title="Save">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setOutcomeLoading(true);
                    await saveOutcome(currOutcomeEdit);
                    setOutcomeLoading(false);
                  }}
                  className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  disabled={outcomeLoading}
                >
                  {outcomeLoading ? (
                    <LoadingOutlined className="text-xs" />
                  ) : (
                    <CheckOutlined className="text-xs" />
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
                  className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                >
                  <CloseOutlined className="text-xs" />
                </motion.button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium border
              ${getOutcomeColor(order?.model_data?.disposition_code)}
            `}>
              {order?.model_data?.disposition_code || "none"}
            </span>
            
            <Tooltip title="Edit Outcome">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrOutcomeEdit(order);
                }}
                className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              >
                <EditOutlined className="text-xs" />
              </motion.button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile sidebar content
  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          Call Records
        </h2>
        {isMobile && (
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center justify-center"
          />
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {orderedItems.map((order) => (
            <div key={order.session_id} className="relative">
              <CallCard 
                order={order} 
                isSelected={selectedOrder?.session_id === order.session_id}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Audio Player - Always at top */}
      {selectedOrder?.recording_url && (
        <motion.div
          className="w-full bg-white border-b border-gray-200 flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 py-2">
            <AudioPlayer audioUrl={appendRoomParam(`${API_BASE_URL}/recording/${selectedOrder.session_id}`)} />
          </div>
        </motion.div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <Button 
            type="text" 
            icon={<MenuOutlined />} 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center justify-center"
          />
          <h1 className="text-lg font-semibold text-gray-800">Call Management</h1>
          <div className="w-8" /> {/* Spacer for balance */}
        </div>
      )}

      {/* Tablet Horizontal Scroll */}
      {!isMobile && window.innerWidth >= 768 && window.innerWidth < 1024 && (
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Call Records
            </h2>
            <div className="flex space-x-2">
              <Button 
                onClick={handleScrollLeft}
                icon={<LeftOutlined />}
                size="small"
                className="flex items-center justify-center"
              />
              <Button 
                onClick={handleScrollRight}
                icon={<RightOutlined />}
                size="small"
                className="flex items-center justify-center"
              />
            </div>
          </div>

          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto pb-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex space-x-4 min-w-max">
              {orderedItems.map((order) => (
                <div key={order.session_id} className="w-72 flex-shrink-0 relative">
                  <CallCard 
                    order={order} 
                    isSelected={selectedOrder?.session_id === order.session_id}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && window.innerWidth >= 1024 && (
          <div className="w-80 xl:w-96 bg-white border-r border-gray-200 flex-shrink-0">
            <SidebarContent />
          </div>
        )}

        {/* Mobile Drawer */}
        <Drawer
          title={null}
          placement="left"
          onClose={() => setIsSidebarOpen(false)}
          open={isSidebarOpen}
          width={320}
          styles={{
            body: { padding: 0 },
            header: { display: 'none' },
          }}
        >
          <SidebarContent />
        </Drawer>

        {/* Detail View */}
        <div className="flex-1 bg-white overflow-hidden">
          <AnimatePresence mode="wait">
            {isModalOpen && selectedOrder ? (
              <motion.div
                key={selectedOrder.session_id}
                className="h-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Mobile back button */}
                {isMobile && (
                  <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
                    <Button 
                      type="text" 
                      icon={<ArrowLeftOutlined />} 
                      onClick={() => setIsSidebarOpen(true)}
                      className="mr-3"
                    />
                    <span className="font-medium text-gray-800">Call Details</span>
                  </div>
                )}
                
                <div className="h-full overflow-y-auto">
                  <SalesMoreData
                    order={selectedOrder}
                    orderId={selectedOrder.session_id}
                    isActive={isModalOpen}
                  />
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📞</span>
                  </div>
                  <p className="text-xl font-medium mb-2">No Call Selected</p>
                  <p className="text-gray-400">
                    {isMobile ? "Tap the menu to view call records" : "Select a call from the sidebar to view details"}
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
