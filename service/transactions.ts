// src/services/transactions.api.ts
import api from "./api"; // adjust relative path to your api.ts
import type { AxiosResponse } from "axios";

export type ListOptions = {
  page?: number;
  size?: number;
  accountId?: number | string | null;
  type?: "Income" | "Expense" | "income" | "expense" | null;
  category?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

function normalizeTypeForServer(t?: string | null) {
  if (!t) return undefined;
  return t.toString().toLowerCase() === "expense" ? "expense" : "income";
}

export async function fetchTransactionsAPI(opts: ListOptions = {}) {
  const params: Record<string, any> = {
    page: opts.page ?? 1,
    size: opts.size ?? 20,
  };
  if (opts.accountId !== undefined && opts.accountId !== null) params.accountId = opts.accountId;
  if (opts.type) params.type = normalizeTypeForServer(opts.type);
  if (opts.category) params.category = opts.category;
  if (opts.dateFrom) params.dateFrom = opts.dateFrom;
  if (opts.dateTo) params.dateTo = opts.dateTo;

  const res: AxiosResponse = await api.get("/transactions", { params });
  return res.data; // expected shape: { total, page, size, transactions: [...] }
}

export async function createTransactionAPI(payload: {
  account?: string | null;
  account_id?: number | null;
  description?: string | null;
  amount: number;
  category?: string | null;
  date: string; // 'YYYY-MM-DD'
  type: "Income" | "Expense" | "income" | "expense";
}) {
  const body = {
    ...payload,
    type: normalizeTypeForServer(payload.type),
  };
  const res: AxiosResponse = await api.post("/transactions", body);
  return res.data;
}

export async function updateTransactionAPI(id: string | number, payload: Partial<{
  account?: string | null;
  account_id?: number | null;
  description?: string | null;
  amount?: number;
  category?: string | null;
  date?: string;
  type?: "Income" | "Expense" | "income" | "expense";
}>) {
  const body: any = { ...payload };
  if (body.type) body.type = normalizeTypeForServer(body.type);
  const res: AxiosResponse = await api.put(`/transactions/${id}`, body);
  return res.data;
}

export async function deleteTransactionAPI(id: string | number) {
  const res: AxiosResponse = await api.delete(`/transactions/${id}`);
  return res.data;
}
