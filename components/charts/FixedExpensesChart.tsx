
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FixedExpensesChartProps {
  data: any[];
  tooltip: any;
}

const FixedExpensesChart: React.FC<FixedExpensesChartProps> = ({ data, tooltip }) => (
  <div className="h-[350px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} interval={0} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Tooltip content={tooltip} cursor={{ fill: 'rgba(0, 102, 255, 0.03)', radius: 16 }} />
        <Bar dataKey="amount" radius={[16, 16, 16, 16]} barSize={40}>
          {data.map((entry, index) => (
            <Cell key={`cell-fixed-bar-${index}`} fill={entry.color} fillOpacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default FixedExpensesChart;
