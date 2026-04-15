/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { Input, Card, Button, message } from 'antd';
import { PhoneOutlined, UserOutlined, PlusOutlined, DeleteOutlined, HistoryOutlined, BarChartOutlined } from '@ant-design/icons';
import SessionKPIDashboard from './SessionKPI/SessionKPIDashboard';
import axiosInstance from '@/lib/axios';
import { API_BASE_URL } from "@/constants";
import { appendRoomParam } from '@/hooks/useRoomAPI';
import { useSearchParams } from 'next/navigation';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface CallHistoryItem {
  id: string;
  timestamp: string;
  toNumber: string;
  response: any;
}

const STORAGE_KEY = 'test_call_history';
const FORM_STORAGE_KEY = 'test_call_form_data';

const SingleCall: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toNumber, setToNumber] = useState('');

  const searchParams = useSearchParams();
  const selectedRoomFromRedux = searchParams.get('room') || 'main';

  // // Get subdomain from current URL
  // const getSubdomain = () => {
  //   if (typeof window === 'undefined') return 'wwai-test';
  //   const hostname = window.location.hostname;
  //   const parts = hostname.split('.');
  //   // If localhost or IP, return default
  //   if (parts.length < 2 || hostname === 'localhost') return 'wwai-test';
  //   return parts[0];
  // };

  const [fromNumber, setFromNumber] = useState('+918031274432');
  const [Template, setTemplate] = useState('hindi');
  const [executionId, setExecutionId] = useState('692523e3d63b1b49a42b368f');
  const [customerDetails, setCustomerDetails] = useState<KeyValuePair[]>([
    { id: crypto.randomUUID(), key: '', value: '' }
  ]);
  const [callResponse, setCallResponse] = useState<any>(null);
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Load form data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedForm = localStorage.getItem(FORM_STORAGE_KEY);
      if (storedForm) {
        try {
          const formData = JSON.parse(storedForm);
          if (formData.toNumber) setToNumber(formData.toNumber);
          if (formData.fromNumber) setFromNumber(formData.fromNumber);
          if (formData.Template) setTemplate(formData.Template);
          if (formData.executionId) setExecutionId(formData.executionId);
          if (formData.customerDetails && formData.customerDetails.length > 0) {
            setCustomerDetails(formData.customerDetails);
          }
        } catch (e) {
          console.error('Failed to parse form data:', e);
        }
      }
      setIsFormLoaded(true);
    }
  }, []);

  // Save form data to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (typeof window !== 'undefined' && isFormLoaded) {
      const formData = {
        toNumber,
        fromNumber,
        Template,
        executionId,
        customerDetails
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [toNumber, fromNumber, Template, executionId, customerDetails, isFormLoaded]);

  // Load call history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setCallHistory(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse call history:', e);
        }
      }
    }
  }, []);

  // Save call history to localStorage
  const saveToHistory = (response: any, phoneNumber: string) => {
    const newEntry: CallHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      toNumber: phoneNumber,
      response: response
    };

    const updatedHistory = [newEntry, ...callHistory];
    setCallHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  // Delete a call history entry
  const deleteHistoryEntry = (id: string) => {
    const updatedHistory = callHistory.filter(item => item.id !== id);
    setCallHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    message.success('History entry deleted');
  };

  // Clear all history
  const clearAllHistory = () => {
    setCallHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    message.success('All history cleared');
  };

  const handleAddField = () => {
    setCustomerDetails(prev => [
      ...prev,
      { id: crypto.randomUUID(), key: '', value: '' }
    ]);
  };

  const handleRemoveField = (id: string) => {
    if (customerDetails.length === 1) {
      message.warning('At least one field is required');
      return;
    }
    setCustomerDetails(prev => prev.filter(item => item.id !== id));
  };

  const handleFieldChange = (id: string, field: 'key' | 'value', value: string) => {
    setCustomerDetails(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const validateForm = () => {
    if (!toNumber) {
      message.error('Please enter phone number');
      return false;
    }
    if (!Template) {
      message.error('Please select a Template');
      return false;
    }

    // Filter out completely empty rows, but check for partial entries
    const filledDetails = customerDetails.filter(item => item.key.trim() || item.value.trim());
    const hasPartialFields = filledDetails.some(item => !item.key.trim() || !item.value.trim());
    if (hasPartialFields) {
      message.error('Please fill in both key and value for all fields');
      return false;
    }

    const keys = filledDetails.map(item => item.key.trim().toUpperCase());
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      message.error('Duplicate keys are not allowed');
      return false;
    }

    return true;
  };

  const handleMakeCall = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setCallResponse(null);

    // Build format_values from dynamic key-value pairs (only filled ones)
    const formatValues: Record<string, string> = {};
    customerDetails
      .filter(item => item.key.trim() && item.value.trim())
      .forEach(item => {
        formatValues[item.key.trim().toUpperCase()] = item.value.trim();
      });

    const payload = {
      from_number: fromNumber,
      selected: Template,
      execution_id: executionId,
      to_number: toNumber,
      format_values: formatValues,
      call_room: selectedRoomFromRedux
    };

    try {
      const apiUrl = appendRoomParam(`${API_BASE_URL}/call-single`, selectedRoomFromRedux);

      const response = await axiosInstance.post(apiUrl, payload);

      if (response.data) {
        setCallResponse(response.data);
        saveToHistory(response.data, toNumber);
        message.success('Call initiated successfully!');
      }
    } catch (error: any) {
      console.error('Error making call:', error);
      const errorResponse = error.response?.data || { error: error.message };
      setCallResponse(errorResponse);
      saveToHistory(errorResponse, toNumber);
      message.error(error.response?.data?.message || 'Failed to initiate call');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setToNumber('');
    setFromNumber('+918031274432');
    setTemplate('hindi');
    setExecutionId('692523e3d63b1b49a42b368f');
    setCustomerDetails([{ id: crypto.randomUUID(), key: '', value: '' }]);
    setCallResponse(null);
    // Clear stored form data
    localStorage.removeItem(FORM_STORAGE_KEY);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  // If a session is selected, show the KPI dashboard
  if (selectedSessionId) {
    return (
      <div className="bg-white rounded-lg shadow-sm max-w-6xl mx-auto">
        <SessionKPIDashboard
          sessionId={selectedSessionId}
          onBack={() => setSelectedSessionId(null)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263978] mb-2">Test Call</h2>
        <p className="text-gray-600">Initiate a single voice call to a customer</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Call Configuration Section */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <PhoneOutlined className="text-[#263978]" />
              <span>Call Configuration</span>
            </div>
          }
          className="shadow-sm"
        >
          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                size="large"
                placeholder="Enter phone number (e.g., +919876543210)"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                prefix={<PhoneOutlined className="text-gray-400" />}
              />
            </div>

            {/* Configuration fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template <span className="text-red-500">*</span>
              </label>
              <Input
                size="large"
                placeholder="Enter Template (e.g., hindi)"
                value={Template}
                onChange={(e) => setTemplate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Customer Details Section */}
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <UserOutlined className="text-[#263978]" />
                <span>Customer Details</span>
              </div>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddField}
                size="small"
              >
                Add Field
              </Button>
            </div>
          }
          className="shadow-sm"
        >
          <div className="space-y-3">
            {customerDetails.map((item, index) => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Key {index + 1}
                  </label>
                  <Input
                    size="large"
                    placeholder="e.g., CUSTOMER_NAME"
                    value={item.key}
                    onChange={(e) => handleFieldChange(item.id, 'key', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Value {index + 1}
                  </label>
                  <Input
                    size="large"
                    placeholder="e.g., John Doe"
                    value={item.value}
                    onChange={(e) => handleFieldChange(item.id, 'value', e.target.value)}
                  />
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveField(item.id)}
                  className="mt-6"
                  disabled={customerDetails.length === 1}
                />
              </div>
            ))}

            <p className="text-xs text-gray-400 mt-2">
              Keys will be converted to UPPERCASE automatically (e.g., customer_name → CUSTOMER_NAME)
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            size="large"
            onClick={handleReset}
            disabled={loading}
            className="px-6"
          >
            Reset
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleMakeCall}
            loading={loading}
            className="px-6 bg-[#263978] hover:bg-[#1e2d5f]"
            icon={<PhoneOutlined />}
          >
            {loading ? 'Initiating Call...' : 'Make Call'}
          </Button>
        </div>

        {/* Call Response JSON Display */}
        {callResponse && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <PhoneOutlined className="text-green-600" />
                <span>API Response</span>
              </div>
            }
            className="shadow-sm border-green-200"
          >
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {JSON.stringify(callResponse, null, 2)}
            </pre>
          </Card>
        )}

        {/* Call History Section */}
        {callHistory.length > 0 && (
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <HistoryOutlined className="text-[#263978]" />
                  <span>Call History ({callHistory.length})</span>
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={clearAllHistory}
                >
                  Clear All
                </Button>
              </div>
            }
            className="shadow-sm"
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {callHistory.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">
                        {item.toNumber}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.response?.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.response?.status || 'error'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatDateTime(item.timestamp)}
                      </span>
                      {item.response?.session_id && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<BarChartOutlined />}
                          onClick={() => setSelectedSessionId(item.response.session_id)}
                          className="bg-[#263978] hover:bg-[#1e2d5f]"
                        >
                          View KPI
                        </Button>
                      )}
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteHistoryEntry(item.id)}
                      />
                    </div>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                    {JSON.stringify(item.response, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SingleCall;
