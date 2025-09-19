// service/transactions.ts
import api from './api';

export type TransactionPayload = {
  id?: number;
  type: 'income' | 'expense' | 'investment' | 'lend';
  amount: number;
  category: string;
  description?: string;
  date: string;
  time: string;
};

export type TransactionSummary = {
  transactions: TransactionPayload[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

export const fetchTransactionsAPI = async (): Promise<TransactionPayload[]> => {
  const res = await api.get('/transactionApp');
  return res.data;
};

export const fetchTransactionSummaryAPI = async (): Promise<TransactionSummary> => {
  const res = await api.get('/transactionApp/summary');
  return res.data;
};

export const createTransactionAPI = async (payload: TransactionPayload) => {
  const res = await api.post('/transactionApp', payload);
  return res.data;
};

export const updateTransactionAPI = async (id: string, payload: Partial<TransactionPayload>) => {
  const res = await api.put(`/transactionApp/${id}`, payload);
  return res.data;
};

export const deleteTransactionAPI = async (id: string) => {
  await api.delete(`/transactionApp/${id}`);
  return true;
};

export async function fetchRecentTransactionsAPI(): Promise<TransactionPayload[]> {
  const response = await api.get("/transactionApp/recent");
  return response.data;
}