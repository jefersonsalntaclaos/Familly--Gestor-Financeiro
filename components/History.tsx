
import React, { useState, useMemo, useEffect } from 'react';
import { MonthlyReport, FixedExpense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Icons, CATEGORY_COLORS } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HistoryProps {
  history: MonthlyReport[];
  fixedExpenses: FixedExpense[];
  onDeleteReport: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

const History: React.FC<HistoryProps> = ({ history, fixedExpenses, onDeleteReport }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const availableYears = useMemo(() => {
    const years: string[] = Array.from(new Set(history.map(h => h.monthKey.split('-')[0])));
    if (years.length === 0) return [new Date().getFullYear().toString()];
    return years.sort((a, b) => b.localeCompare(a));
  }, [history]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(history.map(h => h.topCategory).filter(c => c && c !== 'Nenhum')));
    return categories.sort();
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchesYear = h.monthKey.startsWith(selectedYear);
      const matchesCategory = selectedCategory === 'all' || h.topCategory === selectedCategory;
      return matchesYear && matchesCategory;
    });
  }, [history, selectedYear, selectedCategory]);

  const yearTotals = useMemo(() => {
    return history
      .filter(h => h.monthKey.startsWith(selectedYear))
      .reduce((acc, curr) => ({
        income: acc.income + curr.totalIncome,
        expense: acc.expense + curr.totalExpense,
        balance: acc.balance + curr.balance
      }), { income: 0, expense: 0, balance: 0 });
  }, [history, selectedYear]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedCategory]);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const fixedSummary = useMemo(() => {
    const total = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const categoriesMap = fixedExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      distribution: (Object.entries(categoriesMap) as [string, number][])
        .map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: CATEGORY_COLORS[name] || '#94a3b8'
        }))
        .sort((a, b) => b.value - a.value)
    };
  }, [fixedExpenses]);

  const upcomingTimeline = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return fixedExpenses
      .map(exp => {
        let dueDate = new Date(currentYear, currentMonth, exp.dayOfMonth);
        if (exp.dayOfMonth < now.getDate()) {
          dueDate = new Date(currentYear, currentMonth + 1, exp.dayOfMonth);
        }
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        let status: 'critical' | 'warning' | 'normal' = 'normal';
        if (diffDays <= 3) status = 'critical';
        else if (diffDays <= 7) status = 'warning';
        return { ...exp, projectedDate: dueDate, diffDays, status };
      })
      .sort((a, b) => a.projectedDate.getTime() - b.projectedDate.getTime())
      .slice(0, 5);
  }, [fixedExpenses]);

  const handleExportPDF = () => {
    if (filteredHistory.length === 0) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleString('pt-BR');
      doc.setFontSize(22);
      doc.setTextColor(21, 29, 42);
      doc.text('Family Gestor', 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Relatório Consolidado - Ano ${selectedYear}`, 14, 28);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Gerado em: ${now}`, 14, 34);

      const tableData = filteredHistory.map(report => [
        report.monthName,
        formatCurrency(report.totalIncome),
        formatCurrency(report.totalExpense),
        formatCurrency(report.balance),
        report.topCategory || 'Nenhum'
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Mês de Referência', 'Entradas', 'Saídas', 'Saldo Mensal', 'Principal Gasto']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [21, 29, 42], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        margin: { top: 40 },
      });

      doc.save(`relatorio-financeiro-family-${selectedYear}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      
      {/* SEÇÃO: Gastos Fixos Iminentes */}
      <section className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-10 border-b border-gray-50 bg-gray-50/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <Icons.Recurring />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-primary tracking-tight">Custos Fixos Ativos</h3>
                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Visão geral do comprometimento mensal</p>
              </div>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Custo Consolidado</p>
              <p className="text-2xl md:text-3xl font-black text-primary">{formatCurrency(fixedSummary.total)}</p>
            </div>
          </div>

          <div className="mt-8 md:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {fixedSummary.distribution.map(cat => (
              <div key={cat.name} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter truncate pr-2" style={{ color: cat.color }}>{cat.name}</span>
                  <span className="text-[9px] md:text-[10px] font-bold text-gray-400">{cat.percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}></div>
                </div>
                <p className="mt-2 text-xs md:text-sm font-black text-primary">{formatCurrency(cat.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <h4 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest">Saídas Iminentes</h4>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>
          <div className="space-y-4">
            {upcomingTimeline.map(exp => (
              <div key={exp.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 rounded-2xl border border-gray-100/50 hover:border-accent/20 transition-all group bg-white shadow-sm">
                <div className="flex items-center gap-5 md:gap-6 flex-1">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                    exp.status === 'critical' ? 'bg-red-50 text-red-500 border-red-100' : 
                    exp.status === 'warning' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-blue-50 text-blue-500 border-blue-100'
                  }`}>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] md:text-[9px] font-black uppercase leading-none mb-1 opacity-70">{exp.projectedDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                      <span className="text-lg md:text-xl font-black leading-none">{exp.dayOfMonth}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-primary text-sm md:text-base truncate">{exp.description}</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                        exp.status === 'critical' ? 'bg-red-500 text-white' : 
                        exp.status === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {exp.diffDays === 0 ? 'Hoje' : exp.diffDays === 1 ? 'Amanhã' : `Restam ${exp.diffDays} d`}
                      </span>
                    </div>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{exp.category}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right pl-16 sm:pl-0">
                  <p className="text-lg md:text-xl font-black text-red-500">{formatCurrency(exp.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO: Histórico de Fechamentos */}
      <section className="space-y-8">
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-2xl font-black text-primary tracking-tight">Histórico de Fechamentos</h3>
              <p className="text-gray-500 text-sm mt-1">Selecione o ano para filtrar os registros arquivados.</p>
            </div>
            {history.length > 0 && (
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 text-[11px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-95"
              >
                {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Icons.Download /><span>Exportar {selectedYear}</span></>}
              </button>
            )}
          </div>

          {/* Filtros de Ano e Categoria */}
          <div className="flex flex-col lg:flex-row gap-8 items-stretch lg:items-end border-t border-gray-50 pt-10">
            <div className="space-y-4 flex-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Anos com registros</label>
              <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar snap-x">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`shrink-0 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 snap-center ${
                      selectedYear === year 
                      ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200 hover:text-primary'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 w-full lg:w-80 shrink-0">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrar Categoria</label>
                {selectedCategory !== 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="text-[9px] font-black text-accent uppercase hover:underline"
                  >
                    Limpar Filtro
                  </button>
                )}
              </div>
              <div className="relative group">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full pl-5 pr-12 py-4 bg-gray-50 border-2 rounded-2xl text-[11px] font-black uppercase tracking-widest text-primary outline-none transition-all appearance-none cursor-pointer ${selectedCategory === 'all' ? 'border-gray-100 focus:border-accent' : 'border-accent/40 bg-accent/5 focus:border-accent'}`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230066ff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center' }}
                >
                  <option value="all">Todas as Categorias</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Totais Rápidos do Ano Selecionado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50 flex flex-col items-center sm:items-start text-center sm:text-left">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Entradas em {selectedYear}</p>
                <p className="text-xl font-black text-emerald-700">{formatCurrency(yearTotals.income)}</p>
             </div>
             <div className="bg-red-50/30 p-5 rounded-2xl border border-red-100/50 flex flex-col items-center sm:items-start text-center sm:text-left">
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Saídas em {selectedYear}</p>
                <p className="text-xl font-black text-red-700">{formatCurrency(yearTotals.expense)}</p>
             </div>
             <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50 flex flex-col items-center sm:items-start text-center sm:text-left">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Saldo em {selectedYear}</p>
                <p className={`text-xl font-black ${yearTotals.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(yearTotals.balance)}</p>
             </div>
          </div>
        </div>

        {/* Cards do Histórico */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedHistory.map(report => (
            <div key={report.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 duration-300 group h-full">
              <div className="bg-primary p-6 text-white flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-black tracking-tight">{report.monthName}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-60">Arquivado em {new Date(report.saveDate).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => onDeleteReport(report.id)} 
                  className="text-gray-500 hover:text-red-400 p-2 rounded-xl hover:bg-white/10 transition-colors"
                  title="Excluir Registro"
                >
                  <Icons.Trash />
                </button>
              </div>
              <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Resultado Líquido</span>
                    <span className={`font-black text-base ${report.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(report.balance)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Entradas</span>
                    <span className="font-bold text-primary text-sm">{formatCurrency(report.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Saídas</span>
                    <span className="font-bold text-red-500 text-sm">{formatCurrency(report.totalExpense)}</span>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-50">
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3">Principal Foco de Gasto</p>
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2.5 bg-gray-50 rounded-xl inline-block border border-gray-100 shadow-sm" style={{ color: CATEGORY_COLORS[report.topCategory] || '#94a3b8' }}>
                    {report.topCategory}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem] p-12 md:p-20 text-center text-gray-400 animate-in fade-in duration-500">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30 shadow-inner">
                <Icons.History />
              </div>
              <p className="text-lg md:text-xl font-black text-primary tracking-tight">Filtro sem resultados</p>
              <p className="text-xs md:text-sm mt-2 max-w-xs mx-auto leading-relaxed">Não encontramos registros para a categoria <strong className="text-accent">{selectedCategory}</strong> em <strong className="text-primary">{selectedYear}</strong>.</p>
              <button 
                onClick={() => { setSelectedCategory('all'); setSelectedYear(availableYears[0]); }}
                className="mt-8 text-accent font-black text-[10px] uppercase tracking-widest hover:underline px-6 py-3 bg-accent/5 rounded-full border border-accent/10"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          )}
        </div>

        {/* CONTROLES DE PAGINAÇÃO */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mt-8">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Página <span className="text-primary">{currentPage}</span> de <span className="text-primary">{totalPages}</span>
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition-all active:scale-95"
              >
                Anterior
              </button>
              <button 
                onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === totalPages}
                className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition-all active:scale-95"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default History;
