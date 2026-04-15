/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Radio } from 'antd';

// Bar Chart for Call Metrics
export const CallMetricsChart: React.FC<{ stats: any }> = ({ stats }) => {
  const [chartType, setChartType] = useState<'calls' | 'outcomes'>('calls');

  if (!stats) return (
    <div className="h-48 sm:h-64 flex items-center justify-center text-sm sm:text-base text-gray-500">
      No data available
    </div>
  );

  // Data for calls chart
  const callData = [
    { name: 'Answered', value: stats.call_distribution.answered_calls || 0, color: '#10B981' },
    { name: 'Not Answered', value: stats.call_distribution.not_answered_calls || 0, color: '#EF4444' },
    { name: 'Busy', value: stats.call_distribution.busy_calls || 0, color: '#F59E0B' },
    { name: 'Failed', value: stats.call_distribution.failed_calls || 0, color: '#6B7280' },
    { name: 'Ongoing', value: stats.call_distribution.ongoing_calls || 0, color: '#3B82F6' },
  ].filter(item => item.value > 0);
  
  // Data for outcomes chart using disposition_codes
  const dispositionCodes = stats.disposition_codes || {};
  const outcomeData = [
    { name: 'PTP', value: dispositionCodes?.PTP?.count || 0, color: '#34D399' },
    { name: 'RTP', value: dispositionCodes?.RTP?.count || 0, color: '#60A5FA' },
    { name: 'RTPF', value: dispositionCodes?.RTPF?.count || 0, color: '#F472B6' },
    { name: 'CLBK', value: dispositionCodes?.CLBK?.count || 0, color: '#FBBF24' },
    { name: 'PAID', value: dispositionCodes?.PAID?.count || 0, color: '#6366F1' },
    { name: 'PAYNOW', value: dispositionCodes?.PAYNOW?.count || 0, color: '#10B981' },
    { name: 'Voicemail', value: stats.call_distribution.voicemail || 0, color: '#6366F1' },
  ].filter(item => item.value > 0);

  // { name: 'Voicemail', value: stats.call_distribution.voicemail || 0, color: '#6366F1' },
  const data = chartType === 'calls' ? callData : outcomeData;

  if (data.length === 0) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center text-sm sm:text-base text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Container with proper height calculation */}
      <div className="w-full">
        
        {/* Radio button controls - responsive positioning and sizing */}
        <div className="mb-3 sm:mb-4 flex justify-center sm:justify-end">
          <Radio.Group
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            buttonStyle="solid"
            size="small"
            className="backdrop-blur-sm bg-white/60 p-1 rounded-lg shadow-sm"
          >
            <Radio.Button 
              value="calls"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Call Status</span>
              <span className="sm:hidden">Calls</span>
            </Radio.Button>
            <Radio.Button 
              value="outcomes"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Outcomes
            </Radio.Button>
          </Radio.Group>
        </div>
        
        {/* Chart container with fixed height and proper overflow handling */}
        <div className="w-full h-64 sm:h-72 md:h-80 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ 
                top: 10, 
                right: 20, 
                left: 20, 
                bottom: 80 
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(0,0,0,0.1)" 
              />
              
              {/* X-axis with proper responsive handling */}
              <XAxis 
                dataKey="name" 
                tick={{ 
                  fill: '#4B5563', 
                  fontSize: 8
                }}
                axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                tickLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={70}
                minTickGap={3}
              />
              
              {/* Y-axis with proper width */}
              <YAxis 
                tick={{ 
                  fill: '#4B5563', 
                  fontSize: 8
                }}
                axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                tickLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                width={30}
              />
              
              {/* Responsive tooltip */}
              <Tooltip 
                formatter={(value) => [`${value} calls`, 'Count']}
                contentStyle={{ 
                  borderRadius: '6px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  fontSize: '11px',
                  padding: '6px 10px',
                  maxWidth: '150px'
                }}
                labelStyle={{ 
                  color: '#374151', 
                  fontWeight: '500',
                  fontSize: '11px'
                }}
              />
              
              {/* Responsive bars with proper sizing */}
              <Bar 
                dataKey="value" 
                radius={[2, 2, 0, 0]}
                maxBarSize={50}
                minPointSize={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};