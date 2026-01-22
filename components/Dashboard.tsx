
import React, { useState, useMemo, lazy, Suspense, useEffect, useRef } from 'react';
import { Transaction, BalanceSummary, FixedExpense, TransactionType } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Icons, CATEGORY_COLORS, CATEGORIES } from '../constants';

// Importação Dinâmica de Gráficos
const CashFlowChart = lazy(() => import('./charts/CashFlowChart'));
const CategoryChart = lazy(() => import('./charts/CategoryChart'));
const FixedExpensesChart = lazy(() => import('./charts/FixedExpensesChart'));

interface DashboardProps {
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  summary: BalanceSummary;
  monthlyGoal: number;
  onUpdateGoal: (goal: number) => void;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onAddDirect: (tx: Omit<Transaction, 'id'>) => void;
}

const ChartPlaceholder = ({ height = "300px" }) => (
  <div className="w-full flex items-center justify-center bg-gray-50/50 rounded-2xl animate-pulse" style={{ height }}>
    <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Processando dados...</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label || payload[0].name || payload[0].payload.description}</p>
        <p className="text-lg font-black text-primary">
          {formatCurrency(payload[0].value || payload[0].payload.amount)}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  fixedExpenses, 
  summary, 
  monthlyGoal,
  onUpdateGoal,
  onDelete, 
  onEdit, 
  onAddDirect 
}) => {
  const [quickType, setQuickType] = useState<TransactionType>('expense');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCat, setQuickCat] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(monthlyGoal.toString());
  
  // Datas para restrição de input rápido
  const today = new Date().toISOString().split('T')[0];
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  // Estado para o Alerta de Meta
  const [showGoalAlert, setShowGoalAlert] = useState(false);
  const prevExpenseTotal = useRef(summary.totalExpense);

  // Monitoramento da Meta Mensal
  useEffect(() => {
    if (monthlyGoal > 0 && summary.totalExpense > monthlyGoal && prevExpenseTotal.current <= monthlyGoal) {
      setShowGoalAlert(true);
      const timer = setTimeout(() => setShowGoalAlert(false), 6000);
      return () => clearTimeout(timer);
    }
    prevExpenseTotal.current = summary.totalExpense;
  }, [summary.totalExpense, monthlyGoal]);

  const recentTransactions = transactions.slice(0, 5);

  const handleQuickAdd = () => {
    if (!quickDesc.trim() || !quickAmount || !quickCat || !quickDate) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      onAddDirect({
        description: quickDesc.trim(),
        amount: parseFloat(quickAmount),
        type: quickType,
        category: quickCat,
        date: new Date(quickDate + 'T12:00:00').toISOString()
      });
      setQuickDesc(''); setQuickAmount(''); setQuickCat('');
      setIsSaving(false);
    }, 400);
  };

  const handleSaveGoal = () => {
    const newGoal = parseFloat(tempGoal);
    if (isNaN(newGoal) || newGoal < 0) return;
    onUpdateGoal(newGoal);
    setIsEditingGoal(false);
  };

  const totalFixedExpenses = useMemo(() => fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0), [fixedExpenses]);

  const fixedExpensesBarData = useMemo(() => {
    return fixedExpenses.map(exp => ({
      name: exp.description,
      amount: exp.amount,
      color: CATEGORY_COLORS[exp.category] || '#94a3b8'
    })).sort((a, b) => b.amount - a.amount);
  }, [fixedExpenses]);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return (Object.entries(grouped) as [string, number][])
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || '#94a3b8'
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const barData = useMemo(() => [
    { name: 'Entradas', value: summary.totalIncome, color: '#10b981' },
    { name: 'Saídas', value: summary.totalExpense, color: '#ef4444' }
  ], [summary]);

  const progressPercentage = monthlyGoal > 0 ? Math.min((summary.totalExpense / monthlyGoal) * 100, 100) : 0;
  const isOverGoal = summary.totalExpense > monthlyGoal && monthlyGoal > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative pb-20">
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-white via-white to-blue-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.15)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Saldo Total</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
               <Icons.Transactions />
            </div>
          </div>
          <div className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(summary.totalBalance)}</div>
          <div className="mt-6 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
             <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Patrimônio Líquido</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-white to-emerald-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.15)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-500 group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Entradas</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
               <Icons.ArrowUp />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(summary.totalIncome)}</div>
          <div className="mt-6">
             <span className="text-emerald-600/60 text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-lg">Rendimento Mensal</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-white to-red-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(239,68,68,0.15)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-500 group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Saídas</span>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
               <Icons.ArrowDown />
            </div>
          </div>
          <div className="text-3xl font-black text-red-600 tracking-tighter">{formatCurrency(summary.totalExpense)}</div>
          <div className="mt-6">
             <span className="text-red-600/60 text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-red-50 rounded-lg">Fluxo de Gasto</span>
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.02] group relative ${
          isOverGoal 
          ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200' 
          : 'bg-gradient-to-br from-white via-white to-indigo-50/50 border-gray-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isOverGoal ? 'text-red-700' : 'text-gray-400'}`}>Meta Mensal</span>
            <button 
              onClick={() => isEditingGoal ? handleSaveGoal() : setIsEditingGoal(true)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOverGoal ? 'bg-red-200/50 text-red-700 hover:bg-red-200' : 'bg-gray-50 text-gray-300 hover:text-accent hover:bg-indigo-50'}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
          
          <div className="flex items-center">
            {isEditingGoal ? (
              <input 
                type="number" 
                value={tempGoal} 
                onChange={e => setTempGoal(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSaveGoal()} 
                className="w-full bg-white/70 border-b-2 border-accent rounded-t-lg px-2 py-1 text-2xl font-black outline-none" 
                autoFocus 
              />
            ) : (
              <div className={`text-3xl font-black tracking-tighter ${isOverGoal ? 'text-red-800' : 'text-primary'}`}>
                {monthlyGoal > 0 ? formatCurrency(monthlyGoal) : '---'}
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2.5">
               <span className={isOverGoal ? 'text-red-600' : 'text-gray-400'}>{progressPercentage.toFixed(0)}% Utilizado</span>
               {isOverGoal ? (
                 <span className="text-red-700">Excedido!</span>
               ) : (
                 <span className="text-gray-300">Resta {formatCurrency(Math.max(0, monthlyGoal - summary.totalExpense))}</span>
               )}
            </div>
            <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverGoal ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'bg-accent shadow-[0_0_12px_rgba(0,102,255,0.4)]'}`} 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-primary tracking-tight mb-8">Fluxo de Caixa</h3>
          <Suspense fallback={<ChartPlaceholder />}>
            <CashFlowChart data={barData} tooltip={<CustomTooltip />} />
          </Suspense>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-primary tracking-tight mb-8">Gastos por Categoria</h3>
          <Suspense fallback={<ChartPlaceholder />}>
            <CategoryChart data={categoryData} totalExpense={summary.totalExpense} tooltip={<CustomTooltip />} />
          </Suspense>
        </div>
      </div>

      {/* Gastos Fixos */}
      <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-2xl font-black text-primary tracking-tight">Gastos Fixos Mensais</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Compromissos programados</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Custo Consolidado</p>
            <span className="text-2xl font-black text-primary">{formatCurrency(totalFixedExpenses)}</span>
          </div>
        </div>
        <Suspense fallback={<ChartPlaceholder height="350px" />}>
          {fixedExpensesBarData.length > 0 ? (
            <FixedExpensesChart data={fixedExpensesBarData} tooltip={<CustomTooltip />} />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-300 font-black uppercase text-xs border-2 border-dashed border-gray-50 rounded-3xl">Nenhum gasto fixo programado</div>
          )}
        </Suspense>
      </div>

      {/* Tabela de Lançamentos Rápidos */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-primary tracking-tight">Últimos Lançamentos</h3>
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Exibindo 5 recentes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Tipo / Descrição</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Valor (R$)</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr className="bg-blue-50/10 group/add">
                <td className="px-8 py-5 flex items-center gap-3">
                  <button 
                    onClick={() => setQuickType(quickType === 'income' ? 'expense' : 'income')} 
                    className={`w-9 h-9 rounded-xl font-black text-sm transition-all active:scale-90 shadow-md ${quickType === 'income' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-red-500 text-white shadow-red-200'}`}
                  >
                    {quickType === 'income' ? '+' : '-'}
                  </button>
                  <input type="text" placeholder="Lançamento rápido..." value={quickDesc} onChange={e => setQuickDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuickAdd()} className="bg-transparent border-b-2 border-gray-100 focus:border-accent outline-none text-sm font-bold w-full py-1 transition-colors" />
                </td>
                <td className="px-8 py-5">
                  <select value={quickCat} onChange={e => setQuickCat(e.target.value)} className="bg-transparent text-[11px] font-black uppercase outline-none w-full border-b-2 border-gray-100 focus:border-accent py-1">
                    <option value="">Categoria</option>
                    {CATEGORIES[quickType].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </td>
                <td className="px-8 py-5">
                  <input 
                    type="date" 
                    value={quickDate} 
                    min={yesterday}
                    max={today}
                    onChange={e => setQuickDate(e.target.value)} 
                    className="bg-transparent text-xs font-bold py-1 border-b-2 border-gray-100 focus:border-accent" 
                  />
                </td>
                <td className="px-8 py-5">
                  <input type="number" placeholder="0,00" value={quickAmount} onChange={e => setQuickAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuickAdd()} className="bg-transparent border-b-2 border-gray-100 focus:border-accent outline-none text-sm font-black w-24 py-1" />
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={handleQuickAdd} className="bg-primary text-white p-3 rounded-xl shadow-lg hover:bg-gray-800 transition-all active:scale-95">
                    <Icons.Plus />
                  </button>
                </td>
              </tr>
              {recentTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-all group">
                  <td className="px-8 py-5 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {tx.description.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-primary text-sm">{tx.description}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}15`, color: CATEGORY_COLORS[tx.category] }}>{tx.category}</span>
                  </td>
                  <td className="px-8 py-5 text-gray-400 text-xs font-medium">{formatDate(tx.date)}</td>
                  <td className={`px-8 py-5 font-black text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => onDelete(tx.id)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg"><Icons.Trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerta de Meta Excedida */}
      {showGoalAlert && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
           <div className="bg-red-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-6 border-4 border-white/20 backdrop-blur-md">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div className="flex-1">
                 <h4 className="font-black text-sm uppercase tracking-widest leading-none mb-1">Limite Excedido!</h4>
                 <p className="text-[11px] font-medium opacity-90">Suas despesas ultrapassaram a meta de {formatCurrency(monthlyGoal)}.</p>
              </div>
              <button 
                onClick={() => setShowGoalAlert(false)} 
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
