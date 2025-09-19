// services/lent.ts
import api from './api';

export type CreateLentPayload = {
  borrowerName: string;
  principalAmount: number;
  interestRate?: number | null;
  lentDate?: string | null;
  dueDate: string;
  totalAmount?: number;
  status?: 'Active' | 'Paid' | 'Overdue';
};

export type UpdateLentPayload = Partial<CreateLentPayload>;

export async function fetchLentAPI(query?: { page?: number; size?: number }) {
  const q = query ? `?page=${query.page ?? 1}&size=${query.size ?? 20}` : '';
  const res = await api.get(`/lent${q}`);
  return res.data; // backend returns { total, page, size, lent: [...] }
}

export async function createLentAPI(payload: CreateLentPayload) {
  const res = await api.post('/lent', payload);
  return res.data;
}

export async function updateLentAPI(id: string, payload: UpdateLentPayload) {
  const res = await api.put(`/lent/${id}`, payload);
  return res.data;
}

export const payLentAPI = async (userId: number, payload: { paidAmount: number, paymentDate?: string }) => {
  const res = await api.post(`/lent/${userId}/pay`, {
    userId,
    ...payload
  });
  return res.data;
};

// normalize frontend status to backend enum
export const normalizeStatusForBackend = (s?: string | null): 'Active' | 'Paid' | 'Overdue' | undefined => {
  if (!s) return undefined;

  const st = String(s).toLowerCase();

  switch (st) {
    case 'active':
    case 'partially_paid':  // treat partially_paid as Active
      return 'Active';
    case 'fully_paid':
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    default:
      return undefined; // fallback for unexpected values
  }
};

