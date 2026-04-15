/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Pie Chart for Outcomes
export const OutcomesPieChart: React.FC<{ stats: any }> = ({ stats }) => {
  if (!stats) return <div className="h-64 flex items-center justify-center">No data available</div>;

  // Data for outcomes chart using disposition_codes
  const dispositionCodes = stats.disposition_codes || {};
  console.log('Disposition Codes:', dispositionCodes);
  const data = [
    { name: 'PTP', value: dispositionCodes?.PTP?.count || 0, color: '#34D399' },
    { name: 'RTP', value: dispositionCodes?.RTP?.count || 0, color: '#60A5FA' },
    { name: 'RTPF', value: dispositionCodes?.RTPF?.count || 0, color: '#F472B6' },
    { name: 'CLBK', value: dispositionCodes?.CLBK?.count || 0, color: '#FBBF24' },
    { name: 'PAID', value: dispositionCodes?.PAID?.count || 0, color: '#6366F1' },
    { name: 'PAYNOW', value: dispositionCodes?.PAYNOW?.count || 0, color: '#10B981' },
    { name: 'Voicemail', value: stats.call_distribution.voicemail || 0, color: '#6366F1' },
  ].filter(item => item.value > 0);


  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center">No outcomes data available</div>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={50}
            paddingAngle={4}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
