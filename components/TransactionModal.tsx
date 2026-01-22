
import React, { useState, useEffect } from 'react';
import { TransactionType, Transaction } from '../types';
import { CATEGORIES } from '../constants';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: any) => void;
  editingTransaction?: Transaction | null;
}

interface FormErrors {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
  observations?: string;
}

const MAX_DESC_LENGTH = 50;
const MAX_OBS_LENGTH = 200;
const MAX_AMOUNT = 99999999.99;

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onAdd, editingTransaction }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [observations, setObservations] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  // Datas para restrição de input
  const today = new Date().toISOString().split('T')[0];
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setShake(false);
      
      if (editingTransaction) {
        setType(editingTransaction.type);
        setDescription(editingTransaction.description);
        setAmount(editingTransaction.amount.toString());
        setCategory(editingTransaction.category);
        setObservations(editingTransaction.observations || '');
        setDate(editingTransaction.date.split('T')[0]);
      } else {
        setDescription('');
        setAmount('');
        setCategory('');
        setObservations('');
        setDate(new Date().toISOString().split('T')[0]);
        setType('expense');
      }
    }
  }, [isOpen, editingTransaction]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedDesc = description.trim();
    
    if (trimmedDesc.length < 3) {
      newErrors.description = 'A descrição deve ter pelo menos 3 caracteres.';
    } else if (trimmedDesc.length > MAX_DESC_LENGTH) {
      newErrors.description = `Máximo de ${MAX_DESC_LENGTH} caracteres permitidos.`;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Informe um valor válido maior que zero.';
    } else if (numAmount > MAX_AMOUNT) {
      newErrors.amount = 'O valor excede o limite máximo permitido.';
    }

    if (!category) {
      newErrors.category = 'Selecione uma categoria para organizar seus dados.';
    }

    if (!date) {
      newErrors.date = 'A data é obrigatória para o registro.';
    } else {
      const selectedDate = new Date(date + 'T00:00:00');
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      if (selectedDate > todayDate) {
        newErrors.date = 'A data do lançamento não pode ser no futuro.';
      }
    }

    if (observations.length > MAX_OBS_LENGTH) {
      newErrors.observations = `O comentário excede o limite de ${MAX_OBS_LENGTH} caracteres.`;
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      onAdd({
        id: editingTransaction?.id,
        description: description.trim(),
        amount: parseFloat(amount),
        date: new Date(date + 'T12:00:00').toISOString(),
        type,
        category,
        observations: observations.trim() || undefined
      });
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all duration-300">
      <div className={`bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 ${shake ? 'animate-shake' : ''}`}>
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-primary text-white">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestão de Fluxo Profissional</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-lg scale-[1.02]' : 'text-gray-400 hover:text-primary'}`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-lg scale-[1.02]' : 'text-gray-400 hover:text-primary'}`}
            >
              Despesa
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">O que é?</label>
                <span className={`text-[9px] font-bold ${description.length > MAX_DESC_LENGTH ? 'text-red-500' : 'text-gray-300'}`}>
                  {description.length}/{MAX_DESC_LENGTH}
                </span>
              </div>
              <input 
                type="text" 
                value={description}
                onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors({...errors, description: undefined}); }}
                placeholder="Ex: Supermercado mensal"
                className={`w-full px-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-semibold ${errors.description ? 'border-red-100 bg-red-50 text-red-900 focus:border-red-300' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
              />
              {errors.description && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); if (errors.amount) setErrors({...errors, amount: undefined}); }}
                  placeholder="0,00"
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-black ${errors.amount ? 'border-red-100 bg-red-50 text-red-900 focus:border-red-300' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
                />
                {errors.amount && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.amount}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data</label>
                <input 
                  type="date" 
                  value={date}
                  min={yesterday}
                  max={today}
                  onChange={(e) => { setDate(e.target.value); if (errors.date) setErrors({...errors, date: undefined}); }}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold ${errors.date ? 'border-red-100 bg-red-50 focus:border-red-300' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
                />
                {errors.date && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.date}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
              <select 
                value={category}
                onChange={(e) => { setCategory(e.target.value); if (errors.category) setErrors({...errors, category: undefined}); }}
                className={`w-full px-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-bold appearance-none bg-no-repeat bg-[right_1.5rem_center] ${errors.category ? 'border-red-100 bg-red-50 focus:border-red-300' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}
              >
                <option value="" disabled>Selecione uma categoria</option>
                {CATEGORIES[type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.category}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anotações extras</label>
                <span className={`text-[9px] font-bold ${observations.length > MAX_OBS_LENGTH ? 'text-red-500' : 'text-gray-300'}`}>
                  {observations.length}/{MAX_OBS_LENGTH}
                </span>
              </div>
              <textarea 
                value={observations}
                onChange={(e) => { setObservations(e.target.value); if (errors.observations) setErrors({...errors, observations: undefined}); }}
                placeholder="Ex: Detalhes do pagamento..."
                rows={2}
                className={`w-full px-6 py-4 rounded-2xl border-2 transition-all outline-none text-sm font-medium resize-none ${errors.observations ? 'border-red-100 bg-red-50 text-red-900 focus:border-red-300' : 'border-gray-50 bg-gray-50 focus:bg-white focus:border-accent'}`}
              ></textarea>
              {errors.observations && <p className="text-red-500 text-[10px] mt-1.5 font-black uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {errors.observations}</p>}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.25em] text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'}`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'
            )}
          </button>
        </form>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            15% { transform: translateX(-10px); }
            30% { transform: translateX(10px); }
            45% { transform: translateX(-10px); }
            60% { transform: translateX(10px); }
            75% { transform: translateX(-10px); }
          }
          .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TransactionModal;
