
import React, { useMemo, useState } from 'react';
import { MonthlyReport } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Icons, CATEGORY_COLORS } from '../constants';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

interface AnnualSummaryProps {
  history: MonthlyReport[];
}

const CustomAnnualTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-5 rounded-[1.5rem] shadow-2xl border border-gray-100 flex flex-col gap-3 min-w-[200px]">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2 mb-1">{label} - Fechamento</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Receitas</span>
            <span className="text-sm font-black text-primary">{formatCurrency(payload[0].value)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-red-500 uppercase">Despesas</span>
            <span className="text-sm font-black text-primary">{formatCurrency(payload[1].value)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-50">
            <span className="text-[10px] font-black text-accent uppercase">Saldo Mês</span>
            <span className={`text-sm font-black ${payload[2].value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(payload[2].value)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const AnnualSummary: React.FC<AnnualSummaryProps> = ({ history }) => {
  const years = useMemo(() => {
    const uniqueYears: string[] = Array.from(new Set(history.map(h => h.monthKey.split('-')[0])));
    return uniqueYears.sort((a, b) => b.localeCompare(a));
  }, [history]);

  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear().toString());

  const yearData = useMemo(() => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    let runningBalance = 0;

    return months.map((month, index) => {
      const monthNum = index + 1;
      const monthKey = `${selectedYear}-${monthNum}`;
      const report = history.find(h => h.monthKey === monthKey);

      const income = report ? report.totalIncome : 0;
      const expense = report ? report.totalExpense : 0;
      const balance = report ? report.balance : 0;
      
      runningBalance += balance;

      return {
        name: month,
        income,
        expense,
        balance,
        cumulative: runningBalance
      };
    });
  }, [history, selectedYear]);

  const yearTotals = useMemo(() => {
    return yearData.reduce((acc, curr) => ({
      income: acc.income + curr.income,
      expense: acc.expense + curr.expense,
      balance: acc.balance + curr.balance
    }), { income: 0, expense: 0, balance: 0 });
  }, [yearData]);

  const performanceInsights = useMemo(() => {
    if (history.length === 0) return null;
    
    const filteredHistory = history.filter(h => h.monthKey.startsWith(selectedYear));
    if (filteredHistory.length === 0) return null;

    const bestMonth = [...filteredHistory].sort((a, b) => b.balance - a.balance)[0];
    const worstMonth = [...filteredHistory].sort((a, b) => a.balance - b.balance)[0];
    
    const categoryTotals: Record<string, number> = {};
    filteredHistory.forEach(h => {
      if (h.topCategory && h.topCategory !== 'Nenhum') {
        categoryTotals[h.topCategory] = (categoryTotals[h.topCategory] || 0) + 1;
      }
    });
    const topYearCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Variadas';

    return {
      bestMonth,
      worstMonth,
      topYearCategory
    };
  }, [history, selectedYear]);

  if (history.length === 0) {
    return (
      <div className="bg-white p-16 rounded-[3rem] border border-gray-100 shadow-sm text-center">
        <div className="w-20 h-20 bg-secondary rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300">
          <Icons.Annual />
        </div>
        <h3 className="text-2xl font-black text-primary mb-2">Panorama Desativado</h3>
        <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
          Salve os fechamentos mensais no Dashboard para habilitar a inteligência visual do seu ano financeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header com Seletor de Ano */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
             <Icons.Annual />
          </div>
          <div>
            <h2 className="text-2xl font-black text-primary tracking-tight">Panorama {selectedYear}</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">Visão Consolidada de Desempenho</p>
          </div>
        </div>
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedYear === year ? 'bg-primary text-white shadow-xl scale-[1.05]' : 'text-gray-400 hover:text-primary'}`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Cartões de Totais Anuais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
            <Icons.ArrowUp />
          </div>
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Receita Bruta Anual</span>
          <div className="text-3xl font-black text-emerald-500 mt-2">{formatCurrency(yearTotals.income)}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
            <Icons.ArrowDown />
          </div>
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Custo Total Anual</span>
          <div className="text-3xl font-black text-red-500 mt-2">{formatCurrency(yearTotals.expense)}</div>
        </div>
        <div className="bg-primary p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform text-white">
             <Icons.Insights />
          </div>
          <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Resultado Final</span>
          <div className={`text-3xl font-black mt-2 ${yearTotals.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(yearTotals.balance)}
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução (Area Chart Principal) */}
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
           <div>
              <h3 className="text-2xl font-black text-primary tracking-tight">Evolução Mensal</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Comparativo de fluxo vs resultado</p>
           </div>
           <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entradas</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saídas</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo</span>
              </div>
           </div>
        </div>

        <div className="h-[450px] w-full">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip content={<CustomAnnualTooltip />} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />
                
                {/* Áreas de Gráfico */}
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorInc)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorExp)" 
                  animationDuration={1500}
                  animationBegin={300}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#0066ff" 
                  strokeWidth={4} 
                  strokeDasharray="8 5"
                  fillOpacity={1} 
                  fill="url(#colorBal)" 
                  animationDuration={1500}
                  animationBegin={600}
                />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Rodapé com Cards de Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
           <h3 className="text-xl font-black text-primary mb-8 tracking-tight">Performance Financeira</h3>
           {performanceInsights ? (
             <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/30">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white text-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                         <Icons.ArrowUp />
                      </div>
                      <div>
                         <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Pico de Performance</p>
                         <p className="font-bold text-primary">{performanceInsights.bestMonth.monthName}</p>
                      </div>
                   </div>
                   <span className="font-black text-emerald-600">{formatCurrency(performanceInsights.bestMonth.balance)}</span>
                </div>

                <div className="flex items-center justify-between p-5 bg-red-50/50 rounded-2xl border border-red-100/30">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-sm">
                         <Icons.ArrowDown />
                      </div>
                      <div>
                         <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Mês com Maior Déficit</p>
                         <p className="font-bold text-primary">{performanceInsights.worstMonth.monthName}</p>
                      </div>
                   </div>
                   <span className="font-black text-red-600">{formatCurrency(performanceInsights.worstMonth.balance)}</span>
                </div>
             </div>
           ) : (
             <div className="py-12 text-center text-gray-300">
               <p className="text-sm font-black uppercase tracking-widest">Sem dados suficientes</p>
             </div>
           )}
        </div>

        <div className="bg-primary p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-center">
           <div className="relative z-10">
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">Tendência de Saúde</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">Com base nos seus {history.filter(h => h.monthKey.startsWith(selectedYear)).length} meses registrados, você teve um aproveitamento de <strong>{((yearTotals.balance / (yearTotals.income || 1)) * 100).toFixed(1)}%</strong> da sua renda este ano.</p>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                   <div 
                    className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${yearTotals.balance >= 0 ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'bg-red-400'}`} 
                    style={{ width: `${Math.min(Math.abs((yearTotals.balance / (yearTotals.income || 1)) * 100), 100)}%` }}
                   ></div>
                </div>
                <span className="text-white font-black text-sm">{((yearTotals.balance / (yearTotals.income || 1)) * 100).toFixed(0)}%</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualSummary;
