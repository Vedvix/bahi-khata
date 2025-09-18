// service/subscriptions.ts
import api from './api';

function mapServerToFrontend(row: any) {
  if (!row) return null;
  return {
    id: row.id?.toString(),
    name: row.name ?? '',
    amount: Number(row.amount ?? 0),
    frequency: row.frequency ?? 'Monthly',
    nextDueDate: row.nextBilling ?? null,
    category: row.category ?? null,
    autoPayEnabled: Boolean(row.autoRenew ?? row.auto_pay ?? 0),
    isActive: Boolean(row.isActive ?? row.active ?? 1),
    createdAt: row.created_at ?? null,
  };
}

function mapFrontendToServer(payload: any) {
  return {
    name: payload.name,
    amount: payload.amount,
    frequency: payload.frequency,
    nextBilling: payload.nextDueDate ?? null,
    category: payload.category ?? null,
    // send real booleans (Joi expects booleans)
    autoRenew: Boolean(payload.autoPayEnabled),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  };
}

function extractRowFromResponse(respData: any) {
  // Some backends return { ...row } or { subscription: { ... } } or { data: { ... } }
  if (!respData) return null;
  if (Array.isArray(respData)) return respData; // let caller decide if array ok
  // Common single-row shapes
  if (respData.id !== undefined) return respData;
  if (respData.subscription) return respData.subscription;
  if (respData.data && respData.data.subscription) return respData.data.subscription;
  if (respData.data && respData.data.id !== undefined) return respData.data;
  // fallback: try first property that looks like a row
  const keys = Object.keys(respData);
  for (const k of keys) {
    const v = respData[k];
    if (v && typeof v === 'object' && v.id !== undefined) return v;
  }
  return null;
}

export async function fetchSubscriptionsAPI({ page = 1, size = 50 } = {}) {
  const resp = await api.get('/subscriptions', { params: { page, size } });
  const payload = resp.data;
  if (Array.isArray(payload)) {
    return payload.map(mapServerToFrontend);
  }
  const rows = payload.subscriptions ?? payload.items ?? payload.data ?? [];
  const list = Array.isArray(rows) ? rows.map(mapServerToFrontend) : [];
  return {
    total: payload.total ?? list.length,
    page: payload.page ?? page,
    size: payload.size ?? size,
    subscriptions: list,
  };
}

export async function createSubscriptionAPI(frontPayload: any) {
  const serverPayload = mapFrontendToServer(frontPayload);
  const resp = await api.post('/subscriptions', serverPayload);
  const row = extractRowFromResponse(resp.data);
  if (!row) {
    console.error('createSubscriptionAPI: unexpected server response', resp.data);
    throw new Error('Unexpected server response while creating subscription');
  }
  return mapServerToFrontend(row);
}

export async function updateSubscriptionAPI(id: string, frontPayload: any) {
  const serverPayload = mapFrontendToServer(frontPayload);
  const resp = await api.put(`/subscriptions/${id}`, serverPayload);
  const row = extractRowFromResponse(resp.data);
  if (!row) {
    console.error('updateSubscriptionAPI: unexpected server response', resp.data);
    throw new Error('Unexpected server response while updating subscription');
  }
  return mapServerToFrontend(row);
}

export async function deleteSubscriptionAPI(id: string) {
  const resp = await api.delete(`/subscriptions/${id}`);
  return resp.data;
}
