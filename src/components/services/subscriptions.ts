// src/services/subscriptions.ts
import { db, initDB } from './sqlite';

let dbReady: Promise<void> | null = null;

// Ensure DB is initialized before using
async function ensureDB() {
  if (!dbReady) {
    dbReady = initDB();
  }
  await dbReady;
  if (!db) throw new Error('DB not initialized');
}

// ---------------------- Subscription type ----------------------
export interface Subscription {
  id?: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: string;
  category?: string;
  autoPayEnabled: boolean;
}

// ---------------------- Add subscription ----------------------
export async function addSubscription(sub: Subscription): Promise<number> {
  await ensureDB();

  const stmt = db!.prepare(`
    INSERT INTO subscriptions
      (user_id, name, amount, frequency, nextDueDate, category, autoPayEnabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    sub.user_id,
    sub.name,
    sub.amount,
    sub.frequency,
    sub.nextDueDate,
    sub.category || null,
    sub.autoPayEnabled ? 1 : 0,
  ]);

  // Get last inserted ID
  const res = db!.exec('SELECT last_insert_rowid()')[0];
  stmt.free();
  return res.values[0][0] as number;
}

// ---------------------- Get subscriptions for a user ----------------------
export async function getSubscriptions(user_id: string): Promise<Subscription[]> {
  await ensureDB();

  const stmt = db!.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ?
  `);
  stmt.bind([user_id]);

  const subscriptions: Subscription[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    subscriptions.push({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      amount: row.amount,
      frequency: row.frequency,
      nextDueDate: row.nextDueDate,
      category: row.category,
      autoPayEnabled: row.autoPayEnabled === 1,
    });
  }
  stmt.free();
  return subscriptions;
}

// ---------------------- Update subscription ----------------------
export async function updateSubscription(id: number, updates: Partial<Subscription>) {
  await ensureDB();

  const keys = Object.keys(updates);
  if (keys.length === 0) return;

  const fields = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => {
    const v = (updates as any)[k];
    return typeof v === 'boolean' ? (v ? 1 : 0) : v;
  });
  values.push(id); // for WHERE clause

  const stmt = db!.prepare(`
    UPDATE subscriptions SET ${fields} WHERE id = ?
  `);
  stmt.run(values);
  stmt.free();
}

// ---------------------- Delete subscription ----------------------
export async function deleteSubscription(id: number) {
  await ensureDB();
  const stmt = db!.prepare(`
    DELETE FROM subscriptions WHERE id = ?
  `);
  stmt.run([id]);
  stmt.free();
}
