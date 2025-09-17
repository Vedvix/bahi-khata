// services/investments.ts
import api from './api';

export type CreateInvestmentPayload = {
  name: string;
  type?: string | null;
  amount: number;
  currentValue?: number;
  startDate: string;
  maturityDate?: string | null;
  returns?: number;
};

export type UpdateInvestmentPayload = Partial<CreateInvestmentPayload>;

export async function fetchInvestmentsAPI(query?: { page?: number; size?: number }) {
  const q = query ? `?page=${query.page ?? 1}&size=${query.size ?? 20}` : '';
  const res = await api.get(`/investments${q}`);
  return res.data; // backend returns { total, page, size, investments } per your controller
}

export async function createInvestmentAPI(payload: CreateInvestmentPayload) {
  const res = await api.post('/investments', payload);
  return res.data;
}

export async function updateInvestmentAPI(id: string, payload: UpdateInvestmentPayload) {
  const res = await api.put(`/investments/${id}`, payload);
  return res.data;
}

