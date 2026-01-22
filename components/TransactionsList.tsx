
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Icons, CATEGORY_COLORS } from '../constants';

interface TransactionsListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
}

const ROW_HEIGHT = 73;
const VISIBLE_BUFFER = 5;
const VIRTUALIZATION_THRESHOLD = 50;

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions, onDelete, onEdit }) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [obsFilter, setObsFilter] = useState<'all' | 'with' | 'without'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtro de Transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesText = t.description.toLowerCase().includes(filter.toLowerCase()) || 
                          t.category.toLowerCase().includes(filter.toLowerCase()) ||
                          (t.observations && t.observations.toLowerCase().includes(filter.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      
      const matchesObs = obsFilter === 'all' || 
                         (obsFilter === 'with' && !!t.observations && t.observations.trim().length > 0) ||
                         (obsFilter === 'without' && (!t.observations || t.observations.trim().length === 0));

      const txDate = new Date(t.date).getTime();
      const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : -Infinity;
      const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
      const matchesDate = txDate >= start && txDate <= end;
      
      const min = minAmount ? parseFloat(minAmount) : -Infinity;
      const max = maxAmount ? parseFloat(maxAmount) : Infinity;
      const matchesAmount = t.amount >= min && t.amount <= max;

      return matchesText && matchesType && matchesObs && matchesDate && matchesAmount;
    });
  }, [transactions, filter, typeFilter, obsFilter, startDate, endDate, minAmount, maxAmount]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const isVirtualizing = filteredTransactions.length > VIRTUALIZATION_THRESHOLD;
  
  const { visibleTransactions, paddingTop, paddingBottom } = useMemo(() => {
    if (!isVirtualizing) {
      return {
        visibleTransactions: filteredTransactions,
        paddingTop: 0,
        paddingBottom: 0
      };
    }

    const totalHeight = filteredTransactions.length * ROW_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - VISIBLE_BUFFER);
    const endIndex = Math.min(
      filteredTransactions.length, 
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + VISIBLE_BUFFER
    );

    return {
      visibleTransactions: filteredTransactions.slice(startIndex, endIndex),
      paddingTop: startIndex * ROW_HEIGHT,
      paddingBottom: Math.max(0, totalHeight - (endIndex * ROW_HEIGHT))
    };
  }, [filteredTransactions, scrollTop, containerHeight, isVirtualizing]);

  const clearFilters = () => {
    setFilter('');
    setTypeFilter('all');
    setObsFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setScrollTop(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Descrição', 'Valor', 'Data', 'Tipo', 'Categoria', 'Observações'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.id,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.date.split('T')[0],
        t.type,
        t.category,
        `"${(t.observations || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-gestor-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Busca e Filtros */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Buscar por descrição, categoria ou obs..." 
              value={filter} 
              onChange={(e) => { setFilter(e.target.value); setScrollTop(0); }} 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm" 
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl hover:text-accent hover:bg-accent/5 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
              title="Exportar CSV"
            >
              <Icons.Download />
              <span className="hidden lg:inline">CSV</span>
            </button>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
              <button onClick={() => { setTypeFilter('all'); setScrollTop(0); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${typeFilter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-primary'}`}>Todos</button>
              <button onClick={() => { setTypeFilter('income'); setScrollTop(0); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${typeFilter === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-primary'}`}>Entradas</button>
              <button onClick={() => { setTypeFilter('expense'); setScrollTop(0); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${typeFilter === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-primary'}`}>Saídas</button>
            </div>
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              className={`p-3 rounded-xl border transition-all shrink-0 ${showAdvanced ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
              title="Filtros Avançados"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>
          </div>
        </div>
        
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Início</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setScrollTop(0); }} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fim</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setScrollTop(0); }} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor Mín.</label>
              <input type="number" placeholder="R$ 0,00" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setScrollTop(0); }} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor Máx.</label>
              <input type="number" placeholder="R$ 999.999" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setScrollTop(0); }} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações</label>
              <select 
                value={obsFilter} 
                onChange={(e) => { setObsFilter(e.target.value as any); setScrollTop(0); }}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold appearance-none bg-no-repeat bg-[right_1rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}
              >
                <option value="all">Todas</option>
                <option value="with">Com Obs.</option>
                <option value="without">Sem Obs.</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabela Virtualizada */}
      <div 
        ref={containerRef} 
        onScroll={handleScroll} 
        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-y-auto custom-scrollbar max-h-[650px] relative"
      >
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-20 bg-gray-50 border-b border-gray-100">
            <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="px-8 py-5 w-[40%]">Descrição</th>
              <th className="px-8 py-5 w-[20%]">Categoria</th>
              <th className="px-8 py-5 w-[15%]">Data</th>
              <th className="px-8 py-5 w-[15%]">Valor</th>
              <th className="px-8 py-5 w-[10%] text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && <tr><td colSpan={5} style={{ height: `${paddingTop}px` }}></td></tr>}
            
            {visibleTransactions.map(tx => (
              <tr 
                key={tx.id} 
                style={{ height: `${ROW_HEIGHT}px` }} 
                className="hover:bg-gray-50/80 transition-all group border-b border-gray-50 last:border-0"
              >
                <td className="px-8 py-3">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {tx.description.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-primary text-sm truncate" title={tx.description}>{tx.description}</span>
                      <div className="flex items-center gap-2">
                        {tx.isAutoGenerated && (
                          <span className="text-[9px] text-accent font-black uppercase flex items-center gap-1">
                            <Icons.Recurring /> Recorrente
                          </span>
                        )}
                        {tx.observations && (
                          <span className="text-[9px] text-gray-400 font-bold italic truncate max-w-[150px]" title={tx.observations}>
                            "{tx.observations}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-3">
                  <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block truncate max-w-full" style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}15`, color: CATEGORY_COLORS[tx.category] }}>
                    {tx.category}
                  </span>
                </td>
                <td className="px-8 py-3 text-gray-400 text-xs font-semibold">{formatDate(tx.date)}</td>
                <td className={`px-8 py-3 font-black text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                </td>
                <td className="px-8 py-3 text-right">
                  <div className="flex justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(tx)} 
                      className="text-gray-300 hover:text-accent p-2.5 rounded-xl hover:bg-accent/5" 
                      title="Editar Lançamento"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={() => onDelete(tx.id)} 
                      className="text-gray-300 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50" 
                      title="Excluir Lançamento"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {paddingBottom > 0 && <tr><td colSpan={5} style={{ height: `${paddingBottom}px` }}></td></tr>}
            
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-32 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <Icons.Transactions />
                    <p className="text-gray-500 font-black text-xs uppercase tracking-widest">Nenhuma transação encontrada para estes filtros</p>
                  </div>
                  <button onClick={clearFilters} className="mt-6 text-accent font-bold text-xs uppercase hover:underline">Limpar Filtros</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info de Quantidade */}
      <div className="flex justify-between items-center px-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Exibindo {visibleTransactions.length} de {filteredTransactions.length} registros
          {isVirtualizing && <span className="ml-2 text-emerald-500">• Virtualização Ativa</span>}
        </p>
      </div>
    </div>
  );
};

export default TransactionsList;
