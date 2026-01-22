
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]) => {
  if (transactions.length === 0) return "Adicione algumas transações para que eu possa analisar sua saúde financeira!";

  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const transactionsSummary = transactions.map(t => 
    `${t.date}: ${t.description} (${t.type === 'income' ? 'Receita' : 'Despesa'}) - R$ ${t.amount.toFixed(2)} [Cat: ${t.category}]`
  ).join('\n');

  const prompt = `
    Como um consultor financeiro especialista, analise as seguintes transações recentes de um usuário e forneça 3 dicas práticas e curtas para melhorar a saúde financeira dele.
    
    Transações:
    ${transactionsSummary}
    
    Formate sua resposta como um pequeno relatório motivador em Português do Brasil. Use bullet points.
  `;

  try {
    // Generate content using the recommended Gemini 3 model for general text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Property access .text directly as per guidelines
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Ocorreu um erro ao consultar a inteligência artificial. Tente novamente mais tarde.";
  }
};
