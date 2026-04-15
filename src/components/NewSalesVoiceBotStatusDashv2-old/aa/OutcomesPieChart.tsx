/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Pie Chart for Outcomes
export const OutcomesPieChart: React.FC<{ stats: any }> = ({ stats }) => {
  if (!stats) return <div className="h-64 flex items-center justify-center">No data available</div>;
 
  const data = [
  { name: 'Committed', value: stats.emi_outcomes.committed || 0, color: '#10B981' },
  { name: 'Partial Payment', value: stats.emi_outcomes.partial_payment || 0, color: '#3B82F6' },
  { name: 'Refused', value: stats.emi_outcomes.refused || 0, color: '#EF4444' },
  { name: 'Requested Extension', value: stats.emi_outcomes.requested_extension || 0, color: '#F59E0B' },
  { name: 'Escalation Needed', value: stats.emi_outcomes.escalation_needed || 0, color: '#8B5CF6' },
  { name: 'No Response', value: stats.emi_outcomes.no_response || 0, color: '#6B7280' },
  { name: 'Voicemail', value: stats.call_distribution.voicemail || 0, color: '#6366F1' },
].filter(item => item.value > 0); // Only show outcomes with values


  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center">No outcome data available</div>;
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
