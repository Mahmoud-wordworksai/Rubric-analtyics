"use client";

import React, { useState } from "react";
import Card from "@/layout/Card";
import AudioPlayer from "@/components/NewSalesVoiceBotStatusDashv2/playAudio";
import axiosInstance from "@/lib/axios";


interface CallData {
  session?: {
    session_id?: string;
    created_at?: string;
    updated_at?: string;
    completed_at?: string;
    active?: boolean;
    contact_attempts?: number;
    from_number?: string;
    to_number?: string;
    phone_number?: string;
    recording_url?: string;
    model_data?: {
      outcome?: string;
      disposition_code?: string;
      language_detected?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
    call_info?: {
      Duration?: string;
      BillDuration?: string;
      TotalCost?: string;
      BillRate?: string;
      CallStatus?: string;
      Direction?: string;
      StartTime?: string;
      EndTime?: string;
      From?: string;
      To?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
    user_info?: {
      format_values?: {
        CUSTOMER_NAME?: string;
        MOBILE_NO?: string;
        ACCOUNT_NO?: string;
        PRODUCT?: string;
        BRANCH_CITY?: string;
        FINAL_EMI_AMT?: string;
        EMI_Date?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      };
      row?: {
        CUSTOMER_NAME?: string;
        MOBILE_NO?: string;
        ACCOUNT_NO?: string;
        PRODUCT?: string;
        BRANCH_CITY?: string;
        FINAL_EMI_AMT?: string;
        EMI_Date?: string;
        [key: string]: unknown;
      };
      phone_number?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
    conversation?: Array<{
      role: string;
      content: string;
      timestamp?: string | Date;
    }>;
  };
  session_id?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  active?: boolean;
  contact_attempts?: number;
  from_number?: string;
  to_number?: string;
  phone_number?: string;
  recording_url?: string;
  metadata?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  result?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  outcome?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  conversation?: Array<{
    role: string;
    content: string;
    timestamp?: string | Date;
  }>;
  model_data?: {
    outcome?: string;
    disposition_code?: string;
    language_detected?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  call_info?: {
    Duration?: string;
    BillDuration?: string;
    TotalCost?: string;
    BillRate?: string;
    CallStatus?: string;
    Direction?: string;
    StartTime?: string;
    EndTime?: string;
    From?: string;
    To?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  user_info?: {
    format_values?: {
      CUSTOMER_NAME?: string;
      MOBILE_NO?: string;
      ACCOUNT_NO?: string;
      PRODUCT?: string;
      BRANCH_CITY?: string;
      FINAL_EMI_AMT?: string;
      EMI_Date?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
    row?: {
      CUSTOMER_NAME?: string;
      MOBILE_NO?: string;
      ACCOUNT_NO?: string;
      PRODUCT?: string;
      BRANCH_CITY?: string;
      FINAL_EMI_AMT?: string;
      EMI_Date?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
    phone_number?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

const CallReportPage = () => {
  const [sessionId, setSessionId] = useState("");
  const [reportData, setReportData] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString?: string | { $date?: string }): string => {
    if (!dateString) return "N/A";
    
    if (typeof dateString === 'object' && dateString !== null) {
      if (dateString && typeof dateString === 'object' && '$date' in dateString) {
        dateString = (dateString as { $date?: string }).$date;
      } else if (dateString && typeof dateString === 'object' && '_date' in dateString) {
        dateString = (dateString as { _date?: string })._date;
      }
    }
    
    if (typeof dateString === 'object' && dateString !== null) {
      dateString = String(dateString);
    }
    
    try {
      if (dateString) {
        const date = new Date(dateString as string);
        if (isNaN(date.getTime())) return String(dateString);
        return date.toLocaleString();
      }
      return String(dateString);
    } catch {
      return String(dateString);
    }
  };

// Mini bar chart (inline, no deps)
const MiniBar: React.FC<{ data: number[]; barColor?: string }>
  = ({ data, barColor = '#16a34a' }) => {
  if (!data || data.length === 0) return null;
  const width = 140;
  const height = 40;
  const max = Math.max(...data, 1);
  const barWidth = Math.max(2, Math.floor(width / (data.length * 1.5)));
  const gap = Math.max(2, Math.floor((width - barWidth * data.length) / (data.length - 1 || 1)));
  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((v, i) => {
        const h = Math.max(2, Math.round((v / max) * (height - 4)));
        const x = i * (barWidth + gap);
        const y = height - h;
        return <rect key={i} x={x} y={y} width={barWidth} height={h} fill={barColor} rx={2} />;
      })}
    </svg>
  );
};

// Donut chart (inline SVG)
const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[]; size?: number }>
  = ({ segments, size = 120 }) => {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2} ${size / 2})`}>
        <circle r={radius} fill="none" stroke="#f1f5f9" strokeWidth={12} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circumference;
          const circle = (
            <circle
              key={i}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={12}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90)"
              strokeLinecap="round"
            />
          );
          offset += len;
          return circle;
        })}
      </g>
    </svg>
  );
};

  // Helpers to mask sensitive values for snapshot cards
  const maskPhone = (n?: string): string => {
    if (!n) return '-';
    const digits = n.replace(/\D/g, '');
    if (digits.length < 4) return n;
    return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  };

  const maskAccount = (acc?: string): string => {
    if (!acc) return '-';
    const digits = acc.replace(/\D/g, '');
    if (digits.length <= 6) return acc;
    return `${digits.slice(0, 2)}${'*'.repeat(digits.length - 6)}${digits.slice(-4)}`;
  };

// Small status KPI with colored pill
const BadgeKpi: React.FC<{
  title: string;
  value?: string | number;
  color?: 'green' | 'red' | 'gray' | 'blue' | 'amber';
}> = ({ title, value = '-', color = 'gray' }) => {
  const map: Record<string, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</div>
      <div className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[color]}`}>{String(value)}</div>
    </div>
  );
};

// Simple sparkline using inline SVG (no external deps)
const Sparkline: React.FC<{ data: number[]; color?: string; width?: number; height?: number; strokeWidth?: number }>
  = ({ data, color = '#2563eb', width = 120, height = 36, strokeWidth = 1.75 }) => {
  if (!data || data.length === 0) return null;
  const padX = 6;
  const padY = 6;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const usableW = Math.max(1, width - padX * 2);
  const usableH = Math.max(1, height - padY * 2);
  const step = usableW / Math.max(1, (data.length - 1));
  const points = data.map((v, i) => {
    const x = padX + i * step;
    const y = padY + (usableH - ((v - min) / range) * usableH);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <polyline fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

// KPI card similar to dashboard tiles
const KpiCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number[];
  color?: string;
}> = ({ title, value, subtitle, trend, color = '#2563eb' }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center justify-between">
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </div>
      {trend && trend.length > 1 && (
        <div className="ml-4">
          <Sparkline data={trend} color={color} />
        </div>
      )}
    </div>
  );
};





  const TranscriptView: React.FC<{ data: CallData | null }> = ({ data }) => {
  if (!data) return null;

  // Extract conversation from the specific API response structure
  const extractConversation = (data: Record<string, unknown> | Array<Record<string, unknown>> | string | null | undefined): Array<{speaker: string, text: string, time?: string}> => {
    const messages: Array<{speaker: string, text: string, time?: string}> = [];
    
    // Handle the specific API response structure with conversation array
    if (data && typeof data === 'object' && 'conversation' in data && Array.isArray((data as Record<string, unknown>).conversation)) {
      const conversationData = (data as Record<string, unknown>).conversation as Array<Record<string, unknown>>;
      conversationData.forEach((item: { role?: string; content?: string; timestamp?: string | { $date?: string }; $date?: string }) => {
        if (item && typeof item === 'object' && item.role && item.content) {
          const speaker = item.role === 'assistant' ? 'Agent' : item.role === 'user' ? 'Customer' : 'System';
          const text = item.content;
          const time = (typeof item.timestamp === 'string' ? item.timestamp : (item.$date || undefined));
          messages.push({ speaker, text, time: time });
        }
      });
      return messages;
    }
    
    // Handle array of messages (generic)
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const typedItem = item as Record<string, unknown>;
          const speaker = (typeof typedItem.speaker === 'string' ? typedItem.speaker : (typeof typedItem.role === 'string' ? typedItem.role : (typeof typedItem.sender === 'string' ? typedItem.sender : (typeof typedItem.from === 'string' ? typedItem.from : 'Unknown'))));
          const textValue = (typeof typedItem.text === 'string' ? typedItem.text : (typeof typedItem.content === 'string' ? typedItem.content : (typeof typedItem.message === 'string' ? typedItem.message : (typeof typedItem.speech === 'string' ? typedItem.speech : ''))));
          const time = (typeof typedItem.timestamp === 'string' ? typedItem.timestamp : (typeof typedItem.time === 'string' ? typedItem.time : (typeof typedItem.created_at === 'string' ? typedItem.created_at : (typeof typedItem.$date === 'string' ? typedItem.$date : undefined))));
          messages.push({ speaker, text: textValue, time });
        } else if (typeof item === 'string') {
          messages.push({ speaker: 'System', text: item });
        }
      });
      return messages;
    }
    
    // Handle object with conversation data
    if (typeof data === 'object') {
      // Look for common conversation structures
      if (data) {
        const possibleFields = ['transcript', 'messages', 'conversation', 'dialogue', 'chat'];
        for (const field of possibleFields) {
          if (data && typeof data === 'object' && field in data && Array.isArray((data as Record<string, unknown>)[field])) {
            return extractConversation((data as Record<string, unknown>)[field] as Record<string, unknown> | Array<Record<string, unknown>> | string | null | undefined);
          }
        }
      }
      
      // If no conversation found, try to create from object
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'string' && value.length > 10) {
            messages.push({ speaker: key.replace(/_/g, ' '), text: value as string });
          }
        });
      }
    }
    
    // Handle string
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return extractConversation(parsed);
      } catch {
        messages.push({ speaker: 'System', text: data });
      }
    }
    
    return messages.length > 0 ? messages : [{ speaker: 'System', text: 'No conversation data found' }];
  };

  const conversation = extractConversation(data as Record<string, unknown> | Array<Record<string, unknown>> | string | null | undefined);
  const formatTime = (time: string | { $date?: string } | null | undefined): string => {
    if (!time) return '';
    
    // Handle object with $date property
    if (typeof time === 'object' && time !== null && '$date' in time) {
      const dateStr = (time as { $date?: string }).$date;
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '';
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } catch {
          return '';
        }
      }
      return '';
    }
    
    // Handle string
    if (typeof time === 'string') {
      try {
        const date = new Date(time);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    }
    
    return '';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Call Conversation
        </h4>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {conversation.map((msg, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  msg.speaker.toLowerCase().includes('agent') || msg.speaker.toLowerCase().includes('assistant') || msg.speaker.toLowerCase().includes('system')
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {msg.speaker.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{msg.speaker}</span>
                    {msg.time && <span className="text-xs text-gray-500">{formatTime(msg.time)}</span>}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



const AnalyticsCard: React.FC<{ data: Record<string, unknown>; title: string; type: 'metrics' | 'info' | 'status' }> = ({ data, title, type }) => {
  if (!data) return null;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'object' && value !== null) {
      // Mongo-style timestamp
      if ('$date' in (value as object) && (value as { $date?: string }).$date) {
        try {
          return new Date(((value as { $date?: string }).$date || '')).toLocaleString();
        } catch {
          return String(((value as { $date?: string }).$date || ''));
        }
      }
      // Mongo-style ObjectId
      if ('$oid' in (value as object) && (value as { $oid?: string }).$oid) {
        return String(((value as { $oid?: string }).$oid || ''));
      }
      // Generic object: provide a concise summary instead of [object Object]
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return '{}';
      if (entries.length <= 3) {
        return entries
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? '[Object]' : String(v)}`)
          .join(', ');
      }
      return `[${entries.length} fields]`;
    }
    return String(value);
  };

  const getStatusColor = (value: string): string => {
    const status = value.toLowerCase();
    if (status.includes('success') || status.includes('completed') || status.includes('ptp')) return 'bg-green-100 text-green-800 border-green-200';
    if (status.includes('pending') || status.includes('processing')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status.includes('failed') || status.includes('error')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (type === 'metrics') {
    const entries = Object.entries(data).slice(0, 6);
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map(([key, value]) => (
              <div key={key} className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-6xl font-black text-blue-600 mb-4">{formatValue(value)}</div>
                <div className="text-base font-semibold text-gray-700">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'status') {
    const entries = Object.entries(data).slice(0, 8);
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                <span className={`px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(String(value))}`}>
                  {formatValue(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default info card
  const entries = Object.entries(data).slice(0, 10);
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">
        <div className="space-y-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm font-medium text-gray-600">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span className="text-sm font-semibold text-gray-900">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Session Details Visualization Component
const SessionDetailsCard: React.FC<{ data: Record<string, unknown>; title: string }> = ({ data, title }) => {
  if (!data) return null;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'object' && value !== null) {
      // Mongo-style timestamp
      if ('$date' in (value as object) && (value as { $date?: string }).$date) {
        try {
          return new Date(((value as { $date?: string }).$date || '')).toLocaleString();
        } catch {
          return String(((value as { $date?: string }).$date || ''));
        }
      }
      // Mongo-style ObjectId
      if ('$oid' in (value as object) && (value as { $oid?: string }).$oid) {
        return String(((value as { $oid?: string }).$oid || ''));
      }
      // Generic object: provide a concise summary instead of [object Object]
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return '{}';
      if (entries.length <= 3) {
        return entries
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? '[Object]' : String(v)}`)
          .join(', ');
      }
      return `[${entries.length} fields]`;
    }
    return String(value);
  };

  // Session-specific properties that we want to highlight
  const sessionProperties = [
    'session_id', 'created_at', 'updated_at', 'completed_at', 'active', 
    'contact_attempts', 'from_number', 'to_number', 'phone_number'
  ];

  // Filter and format the data
  const sessionData = Object.entries(data)
    .filter(([key]) => sessionProperties.includes(key))
    .map(([key, value]) => ({
      key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: formatValue(value),
      type: typeof value
    }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {title}
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessionData.map(({ key, value, type }, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{key}</div>
              <div className="text-sm font-semibold text-gray-900 break-words">
                {type === 'boolean' ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {value}
                  </span>
                ) : (
                  <span className="text-gray-900">{value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SmartDisplay: React.FC<{ data: Record<string, unknown>; title: string }> = ({ data, title }) => {
  if (!data) return null;

  // Determine the best display type for call report data
  const getDisplayType = (data: Record<string, unknown>): 'transcript' | 'session' | 'analytics' => {
    // Check if it's session data specifically
    if (title.includes('Session Details') || title.includes('Session Information')) {
      const sessionProps = ['session_id', 'created_at', 'updated_at', 'completed_at', 'active', 'contact_attempts'];
      const hasSessionProps = sessionProps.some(prop => prop in data);
      if (hasSessionProps) return 'session';
    }
    
    // Check if it's the main call report object with conversation
    if (data.conversation && Array.isArray(data.conversation)) {
      return 'transcript';
    }
    
    // Check if it looks like conversation data
    if (Array.isArray(data)) {
      const hasConversationFields = data.some(item => 
        typeof item === 'object' && (
          item.speaker || item.role || item.sender || 
          item.text || item.content || item.message
        )
      );
      if (hasConversationFields) return 'transcript';
    }
    
    // For all other data types, use analytics view
    return 'analytics';
  };

  const getAnalyticsType = (title: string): 'metrics' | 'info' | 'status' => {
    if (title.includes('Call Analysis') || title.includes('Model Data')) return 'metrics';
    if (title.includes('Call Information') || title.includes('Call Info')) return 'status';
    return 'info';
  };

  const displayType = getDisplayType(data);

  switch (displayType) {
    case 'transcript':
      return <TranscriptView data={data} />;
    case 'session':
      return <SessionDetailsCard data={data} title={title} />;
    case 'analytics':
      return <AnalyticsCard data={data} title={title} type={getAnalyticsType(title)} />;
    default:
      return <AnalyticsCard data={data} title={title} type="info" />;
  }
};



  const fetchReport = async (): Promise<void> => {
    if (!sessionId.trim()) {
      setError("Please enter a session ID");
      return;
    }

    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const apiUrl = `https://api-v2.admin-wwai.com/sessions/${encodeURIComponent(sessionId)}?api_key=dsfiuhdiufnf78y78hnuhf87eryiwe&project=tata-capital`;

      const response = await axiosInstance.get(apiUrl);
      const data: CallData = response.data;
      setReportData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching the report";
      setError(errorMessage);
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      fetchReport();
    }
  };

  const handleClear = (): void => {
    setSessionId("");
    setReportData(null);
    setError(null);
  };

  // const getSessionId = (): string => {
  //   return reportData?.session?.session_id || reportData?.session_id || "N/A";
  // };

  const getCreatedAt = (): string => {
    return formatDate(reportData?.session?.created_at || reportData?.created_at);
  };

  const getActiveStatus = (): boolean | undefined => {
    return reportData?.session?.active ?? reportData?.active;
  };

  const getContactAttempts = (): number | undefined => {
    return reportData?.session?.contact_attempts ?? reportData?.contact_attempts;
  };

  const getFromNumber = (): string => {
    return reportData?.session?.from_number || reportData?.from_number || "N/A";
  };

  const getToNumber = (): string => {
    return reportData?.session?.to_number || reportData?.to_number || "N/A";
  };

  const getPhoneNumber = (): string => {
    return reportData?.session?.phone_number || reportData?.phone_number || "N/A";
  };

  const getUpdatedAt = (): string => {
    return formatDate(reportData?.session?.updated_at || reportData?.updated_at);
  };

  const getCompletedAt = (): string => {
    return formatDate(reportData?.session?.completed_at || reportData?.completed_at);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 w-full max-w-7xl mx-auto">
      <Card>
        <div className="p-10 max-[768px]:p-3 max-[768px]:mt-3 mt-5 mb-10 border-t-4 border-[#04ccfb] bg-white h-max rounded-md shadow w-full">
          <h3 className="text-2xl font-bold text-[#263978] mb-6">Call Report</h3>
          <div className="space-y-6">
            <div>
              <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-2">
                Session ID
              </label>
              <div className="flex gap-3 w-full">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    id="sessionId"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter session ID"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#263978]/30 transition-all"
                    disabled={loading}
                  />
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                </div>
                <button
                  onClick={fetchReport}
                  disabled={loading || !sessionId.trim()}
                  className="px-4 py-2 bg-[#263978] hover:bg-[#1e2d5f] text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    "Get Report"
                  )}
                </button>
                <button
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  onClick={handleClear}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}
            </div>

            {reportData && (
              <div className="mt-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h3>
                {reportData?.recording_url && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor" />
                          </svg>
                          Call Recording
                        </h3>
                      </div>
                      <div className="p-5">
                        <AudioPlayer audioUrl={reportData.recording_url} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {reportData?.session && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                          title="Contact Attempts"
                          value={getContactAttempts() ?? '0'}
                          trend={[2,3,2,4,3,5,4]}
                          color="#2563eb"
                        />
                        <KpiCard
                          title="Active Status"
                          value={getActiveStatus() ? 'Active' : 'Inactive'}
                          trend={[1,1,1,0,0,1,0]}
                          color="#10b981"
                        />
                        <KpiCard
                          title="From Number"
                          value={getFromNumber() || '-'}
                          subtitle="Caller"
                          trend={[5,4,6,5,7,6,8]}
                          color="#7c3aed"
                        />
                        <KpiCard
                          title="To Number"
                          value={getToNumber() || '-'}
                          subtitle="Callee"
                          trend={[3,5,4,6,4,5,6]}
                          color="#f59e0b"
                        />
                      </div>

                      <AnalyticsCard 
                        data={reportData.session} 
                        title="Session Information" 
                        type="info"
                      />
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  {reportData?.session && (
                    <AnalyticsCard 
                      data={{
                        'From Number': getFromNumber(),
                        'To Number': getToNumber(),
                        'Phone Number': getPhoneNumber()
                      }} 
                      title="Call Parties" 
                      type="status"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  {reportData?.session && (
                    <AnalyticsCard 
                      data={{
                        'Created': getCreatedAt(),
                        'Updated': getUpdatedAt(),
                        'Completed': getCompletedAt()
                      }} 
                      title="Call Timeline" 
                      type="info"
                    />
                  )}
                </div>

                {/* Model Data KPIs */}
                {reportData?.model_data && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <BadgeKpi 
                        title="Outcome"
                        value={String(reportData.model_data.outcome || '-')}
                        color={String(reportData.model_data.outcome || '').toUpperCase() === 'PTP' ? 'green' : (String(reportData.model_data.outcome || '') ? 'blue' : 'gray')}
                      />
                      <BadgeKpi 
                        title="Disposition"
                        value={String(reportData.model_data.disposition_code || '-')}
                        color={String(reportData.model_data.disposition_code || '').toUpperCase() === 'PTP' ? 'green' : 'amber'}
                      />
                      <BadgeKpi 
                        title="Language"
                        value={String(reportData.model_data.language_detected || '-')}
                        color={'blue'}
                      />
                    </div>
                    <AnalyticsCard 
                      data={reportData.model_data}
                      title="Call Analysis"
                      type="metrics"
                    />
                  </div>
                )}

                {/* Call Health */}
                {reportData?.call_info && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <KpiCard
                        title="Duration (s)"
                        value={String(reportData.call_info.Duration || reportData.call_info.BillDuration || '-')}
                        trend={[10, 15, 12, 18, 14, 20, 16]}
                        color="#2563eb"
                      />
                      <KpiCard
                        title="Total Cost"
                        value={String(reportData.call_info.TotalCost || '0')}
                        subtitle={String(reportData.call_info.BillRate ? `Rate ${reportData.call_info.BillRate}` : '')}
                        trend={[1, 2, 1, 3, 2, 4, 3]}
                        color="#10b981"
                      />
                      <KpiCard
                        title="Status"
                        value={String(reportData.call_info.CallStatus || '-')}
                        trend={[1,1,0,1,1,1,1]}
                        color="#f59e0b"
                      />
                    </div>
                    <AnalyticsCard 
                      data={{
                        'Direction': reportData.call_info.Direction,
                        'Start Time': reportData.call_info.StartTime,
                        'End Time': reportData.call_info.EndTime,
                        'From': reportData.call_info.From,
                        'To': reportData.call_info.To,
                      }}
                      title="Call Health"
                      type="info"
                    />

                    {/* Visualizations: Users per minute and Visitor donut */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Users per minute */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                        {(() => {
                          // Derive synthetic users-per-minute array based on duration
                          const rawDur = Number(reportData.call_info?.Duration || reportData.call_info?.BillDuration || 0);
                          const points = Math.min(12, Math.max(6, Math.round((rawDur || 0) / 5) || 8));
                          const arr: number[] = Array.from({ length: points }, (_, i) => {
                            // simple deterministic wave-based values 5..20
                            const base = 12 + Math.round(7 * Math.sin(i * 0.9));
                            return Math.max(3, base);
                          });
                          const total = arr.reduce((s, x) => s + x, 0);
                          return (
                            <>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Users per minute</div>
                                <div className="mt-1 text-2xl font-bold text-gray-900">{total}</div>
                                <div className="text-xs text-gray-500 mt-1">last {points} mins (synthetic)</div>
                              </div>
                              <div className="ml-4"><MiniBar data={arr} barColor="#16a34a" /></div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Visitor donut */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visitor</div>
                          <div className="mt-1 text-2xl font-bold text-gray-900">8,693</div>
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="inline-flex items-center mr-3"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>New ~55%</span>
                            <span className="inline-flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-400 mr-1"></span>Returning ~45%</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <DonutChart
                            segments={[
                              { label: 'New', value: 55, color: '#3b82f6' },
                              { label: 'Returning', value: 45, color: '#818cf8' },
                            ]}
                            size={110}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Snapshot */}
                {reportData?.user_info && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <KpiCard
                        title="Customer"
                        value={String(reportData.user_info?.format_values?.CUSTOMER_NAME || reportData.user_info?.row?.CUSTOMER_NAME || '-')}
                        subtitle="Name"
                        trend={[3,4,5,4,6,5,7]}
                        color="#7c3aed"
                      />
                      <KpiCard
                        title="Phone"
                        value={maskPhone(String(reportData.user_info?.format_values?.MOBILE_NO || reportData.user_info?.phone_number || ''))}
                        subtitle="Masked"
                        trend={[1,2,3,2,3,4,3]}
                        color="#2563eb"
                      />
                      <KpiCard
                        title="Account"
                        value={maskAccount(String(reportData.user_info?.format_values?.ACCOUNT_NO || reportData.user_info?.row?.ACCOUNT_NO || ''))}
                        subtitle="Masked"
                        trend={[2,2,2,3,3,3,4]}
                        color="#10b981"
                      />
                    </div>
                    <AnalyticsCard 
                      data={{
                        'Product': reportData.user_info?.format_values?.PRODUCT || reportData.user_info?.row?.PRODUCT,
                        'Branch City': reportData.user_info?.format_values?.BRANCH_CITY || reportData.user_info?.row?.BRANCH_CITY,
                        'EMI Amount': reportData.user_info?.format_values?.FINAL_EMI_AMT || reportData.user_info?.row?.FINAL_EMI_AMT,
                        'EMI Date': reportData.user_info?.format_values?.EMI_Date || reportData.user_info?.row?.EMI_Date,
                      }}
                      title="Customer Snapshot"
                      type="info"
                    />
                  </div>
                )}

                {(reportData?.metadata || reportData?.result || reportData?.outcome || reportData?.conversation) && (
                  <div className="space-y-4">
                    {reportData?.conversation && (
                      <SmartDisplay 
                        data={reportData.conversation as unknown as Record<string, unknown>} 
                        title="Call Conversation" 
                      />
                    )}
                    
                    {reportData?.session && (
                      <SmartDisplay 
                        data={reportData.session} 
                        title="Session Details" 
                      />
                    )}
                    
                    {reportData?.model_data && (
                      <SmartDisplay 
                        data={reportData.model_data} 
                        title="Call Analysis" 
                      />
                    )}
                    
                    {reportData?.call_info && (
                      <SmartDisplay 
                        data={reportData.call_info} 
                        title="Call Information" 
                      />
                    )}
                    
                    {reportData?.user_info && (
                      <SmartDisplay 
                        data={reportData.user_info} 
                        title="Customer Information" 
                      />
                    )}
                    
                    {reportData?.metadata && (
                      <SmartDisplay 
                        data={reportData.metadata} 
                        title="Additional Details" 
                      />
                    )}
                    
                    {reportData?.outcome !== undefined && (
                      <SmartDisplay 
                        data={reportData.outcome} 
                        title="Call Outcome" 
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CallReportPage;
