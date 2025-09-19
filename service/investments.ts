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

  const { total, page, size, investments } = res.data;

  // map backend → frontend
  const mapped = investments.map((inv: any) => ({
    id: inv.id.toString(),
    name: inv.name,
    type: inv.type,
    amount: inv.amount,
    currentValue: inv.currentValue,
    purchaseDate: inv.startDate,              // ✅ map here
    maturityDate: inv.maturityDate ?? undefined,
    interestRate: inv.interestRate ?? undefined,
    returns: inv.returns,
    status: inv.status?.toLowerCase?.() ?? 'active',
  }));

  return { total, page, size, investments: mapped };
}


export async function createInvestmentAPI(payload: CreateInvestmentPayload) {
  const res = await api.post('/investments', payload);
  return res.data;
}

export async function updateInvestmentAPI(id: string, payload: UpdateInvestmentPayload) {
  const res = await api.put(`/investments/${id}`, payload);
  return res.data;
}

export const normalizeDate = (date?: string): string => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]; // YYYY-MM-DD
};


