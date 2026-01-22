
import React, { useState } from 'react';
import { FixedExpense } from '../types';
import { CATEGORIES, CATEGORY_COLORS, Icons } from '../constants';
import { formatCurrency } from '../utils/formatters';

interface FixedExpensesManagerProps {
  fixedExpenses: FixedExpense[];
  onAdd: (expense: Omit<FixedExpense, 'id'>) => void;
  onDelete: (id: string) => void;
}

interface FormErrors {
  description?: string;
  amount?: string;
  category?: string;
  day?: string;
}

const MAX_DESC_LENGTH = 40;

const FixedExpensesManager: React.FC<FixedExpensesManagerProps> = ({ fixedExpenses, onAdd, onDelete }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [day, setDay] = useState('1');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedDesc = description.trim();
    
    if (trimmedDesc.length < 3) {
      newErrors.description = 'Mínimo de 3 caracteres.';
    } else if (trimmedDesc.length > MAX_DESC_LENGTH) {
      newErrors.description = `Máximo de ${MAX_DESC_LENGTH} caracteres.`;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Valor deve ser positivo.';
    }

    if (!category) {
      newErrors.category = 'Selecione uma categoria.';
    }

    const numDay = parseInt(day);
    if (isNaN(numDay) || numDay < 1 || numDay > 31) {
      newErrors.day = 'Informe um dia entre 1 e 31.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    // Pequeno delay para feedback visual de confirmação
    setTimeout(() => {
      onAdd({
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        dayOfMonth: parseInt(day)
      });

      // Reset total dos campos e erros
      setDescription('');
      setAmount('');
      setCategory('');
      setDay('1');
      setErrors({});
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulário de Cadastro de Fixo */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center">
             <Icons.Recurring />
          </div>
          <div>
            <h3 className="text-xl font-black text-primary tracking-tight">Programar Fixo</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Lançamento Mensal Automático</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</label>
              <span className="text-[9px] font-bold text-gray-300">{description.length}/{MAX_DESC_LENGTH}</span>
            </div>
            <input 
              type="text" 
              value={description}
              maxLength={MAX_DESC_LENGTH + 5}
              aria-invalid={!!errors.description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({...errors, description: undefined});
              }}
              placeholder="Ex: Academia ou Aluguel"
              className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-semibold ${errors.description ? 'border-red-100 bg-red-50 text-red-900' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
            />
            {errors.description && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Valor (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={amount}
                aria-invalid={!!errors.amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors({...errors, amount: undefined});
                }}
                placeholder="0,00"
                className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-black ${errors.amount ? 'border-red-100 bg-red-50 text-red-900' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
              />
              {errors.amount && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.amount}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Vence Dia</label>
              <input 
                type="number" 
                min="1" 
                max="31"
                value={day}
                aria-invalid={!!errors.day}
                onChange={(e) => {
                  setDay(e.target.value);
                  if (errors.day) setErrors({...errors, day: undefined});
                }}
                className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-black ${errors.day ? 'border-red-100 bg-red-50 text-red-900' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
              />
              {errors.day && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.day}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
            <select 
              value={category}
              aria-invalid={!!errors.category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors({...errors, category: undefined});
              }}
              className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold appearance-none bg-no-repeat bg-[right_1.25rem_center] ${errors.category ? 'border-red-100 bg-red-50' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}
            >
              <option value="" disabled>Selecione</option>
              {CATEGORIES.expense.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.category}</p>}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-5 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Ativar Recorrência'}
          </button>
        </form>
      </div>

      {/* Lista de Gastos Fixos Ativos */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between px-4">
           <h3 className="text-xl font-black text-primary tracking-tight">Compromissos Ativos</h3>
           <span className="text-[10px] font-black text-accent bg-accent/5 px-4 py-2 rounded-full uppercase tracking-widest border border-accent/10">
             {fixedExpenses.length} Total
           </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fixedExpenses.map(exp => (
            <div key={exp.id} className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between group transition-all hover:shadow-xl hover:border-gray-200 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start mb-5">
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-primary text-base leading-tight truncate pr-4" title={exp.description}>{exp.description}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider mt-2 inline-block w-fit px-3 py-1 rounded-lg" style={{ backgroundColor: `${CATEGORY_COLORS[exp.category]}15`, color: CATEGORY_COLORS[exp.category] }}>
                    {exp.category}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    if(confirm(`Desativar "${exp.description}"? Os lançamentos automáticos pararão no próximo mês.`)) {
                      onDelete(exp.id);
                    }
                  }}
                  className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shrink-0"
                  title="Remover recorrência"
                >
                  <Icons.Trash />
                </button>
              </div>
              <div className="flex justify-between items-end mt-2 pt-5 border-t border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Custo Mensal</span>
                  <div className="text-xl font-black text-red-500">{formatCurrency(exp.amount)}</div>
                </div>
                <div className="bg-gray-50 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                  Dia {exp.dayOfMonth}
                </div>
              </div>
            </div>
          ))}
          
          {fixedExpenses.length === 0 && (
            <div className="col-span-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem] p-20 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                <Icons.Recurring />
              </div>
              <p className="font-black text-primary text-lg tracking-tight">Vazio por aqui...</p>
              <p className="text-xs mt-2 max-w-[250px] mx-auto leading-relaxed">Programe seus gastos recorrentes no formulário ao lado para automação inteligente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedExpensesManager;
