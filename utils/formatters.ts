
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
};

export const getMonthName = (dateString: string): string => {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(dateString));
};
