/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Radio } from 'antd';

// Bar Chart for Call Metrics
export const CallMetricsChart: React.FC<{ stats: any }> = ({ stats }) => {
  const [chartType, setChartType] = useState<'calls' | 'outcomes'>('calls');

  if (!stats) return <div className="h-64 flex items-center justify-center">No data available</div>;

  // Data for calls chart
  const callData = [
    { name: 'Answered', value: stats.call_distribution.answered_calls || 0, color: '#10B981' },
    { name: 'Not Answered', value: stats.call_distribution.not_answered_calls || 0, color: '#EF4444' },
    { name: 'Busy', value: stats.call_distribution.busy_calls || 0, color: '#F59E0B' },
    { name: 'Failed', value: stats.call_distribution.failed_calls || 0, color: '#6B7280' },
    { name: 'Ongoing', value: stats.call_distribution.ongoing_calls || 0, color: '#3B82F6' },
  ].filter(item => item.value > 0);
  
  // Data for outcomes chart
  const outcomeData = [
    { name: 'Committed', value: stats.emi_outcomes.committed || 0, color: '#10B981' },
    { name: 'Partial Payment', value: stats.emi_outcomes.partial_payment || 0, color: '#3B82F6' },
    { name: 'Refused', value: stats.emi_outcomes.refused || 0, color: '#EF4444' },
    { name: 'Requested Extension', value: stats.emi_outcomes.requested_extension || 0, color: '#F59E0B' },
    { name: 'Escalation Needed', value: stats.emi_outcomes.escalation_needed || 0, color: '#8B5CF6' },
    { name: 'No Response', value: stats.emi_outcomes.no_response || 0, color: '#6B7280' },
    { name: 'Voicemail', value: stats.call_distribution.voicemail || 0, color: '#6366F1' },
  ].filter(item => item.value > 0);

  const data = chartType === 'calls' ? callData : outcomeData;

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center">No data available</div>;
  }

  return (
    <div className="h-80">
      <div className="mb-4 flex justify-end">
        <Radio.Group
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          buttonStyle="solid"
          size="small"
          className="backdrop-blur-sm bg-white/60 p-1 rounded-lg"
        >
          <Radio.Button value="calls">Call Status</Radio.Button>
          <Radio.Button value="outcomes">Outcomes</Radio.Button>
        </Radio.Group>
      </div>
      
      <ResponsiveContainer className="pb-10" width="100%" height="85%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#4B5563' }}
            axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
          />
          <YAxis 
            tick={{ fill: '#4B5563' }}
            axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
          />
          <Tooltip 
            formatter={(value) => [`${value} calls`, 'Count']}
            contentStyle={{ 
              borderRadius: '8px', 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};