
import React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface CategoryChartProps {
  data: any[];
  totalExpense: number;
  tooltip: any;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, totalExpense, tooltip }) => (
  <div className="h-[300px] w-full relative">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius={75} outerRadius={105} paddingAngle={8} dataKey="value" animationBegin={0} animationDuration={1200}>
          {data.map((entry, index) => (
            <Cell key={`cell-pie-${index}`} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={tooltip} />
        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
      </PieChart>
    </ResponsiveContainer>
    <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
      <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Total Saídas</p>
      <p className="text-xl font-black text-primary leading-none">{formatCurrency(totalExpense)}</p>
    </div>
  </div>
);

export default CategoryChart;
