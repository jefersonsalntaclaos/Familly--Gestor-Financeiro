
import React, { useState } from 'react';
import { Transaction } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { Icons } from '../constants';

interface InsightsProps {
  transactions: Transaction[];
}

const Insights: React.FC<InsightsProps> = ({ transactions }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetInsight = async () => {
    setLoading(true);
    try {
      const result = await getFinancialInsights(transactions);
      setInsight(result);
    } catch (e) {
      setInsight("Ocorreu um erro ao carregar os insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-primary p-8 text-center text-white">
           <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
              <Icons.Insights />
           </div>
           <h2 className="text-2xl font-bold mb-2">Consultor Financeiro AI</h2>
           <p className="text-gray-400 max-w-lg mx-auto">
             Utilizamos Inteligência Artificial para analisar seus gastos e ganhos, fornecendo recomendações personalizadas para o seu sucesso financeiro.
           </p>
        </div>

        <div className="p-8">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Analisando suas transações...</p>
             </div>
           ) : insight ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-secondary p-6 rounded-2xl border border-blue-100 whitespace-pre-line leading-relaxed text-gray-700 italic relative">
                  <div className="absolute -top-3 left-6 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                    Recomendação
                  </div>
                  {insight}
               </div>
               <button 
                onClick={handleGetInsight}
                className="mt-6 text-accent font-semibold hover:underline flex items-center gap-2 mx-auto"
               >
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                 Atualizar análise
               </button>
             </div>
           ) : (
             <div className="text-center py-12">
               <p className="text-gray-500 mb-8">Clique no botão abaixo para gerar uma análise baseada em seus dados atuais.</p>
               <button 
                onClick={handleGetInsight}
                className="bg-accent text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200 active:scale-95"
               >
                 Gerar Insights Agora
               </button>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="font-bold text-primary mb-2">Privacidade</h4>
          <p className="text-sm text-gray-500">Seus dados são processados de forma anônima para a geração de insights e não são compartilhados com terceiros.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="font-bold text-primary mb-2">Tecnologia</h4>
          <p className="text-sm text-gray-500">Utilizamos o modelo Gemini da Google para oferecer o que há de mais moderno em processamento de linguagem natural financeiro.</p>
        </div>
      </div>
    </div>
  );
};

export default Insights;
