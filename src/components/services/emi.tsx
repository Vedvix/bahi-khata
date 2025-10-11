// src/services/emis.ts
import { db, initDB } from './sqlite';
import { EMI } from '../TransactionContext';

let dbReady: Promise<void> | null = null;

async function ensureDB() {
  if (!dbReady) dbReady = initDB();
  await dbReady;
  if (!db) throw new Error('DB not initialized');
}

// Add EMI
export async function addEMI(emi: EMI): Promise<number> {
  await ensureDB();
  const stmt = db!.prepare(`
    INSERT INTO emis
      (user_id, name, totalAmount, monthlyEMI, interestRate, tenure, remainingMonths, nextDueDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    emi.user_id,
    emi.name,
    emi.totalAmount,
    emi.monthlyEMI,
    emi.interestRate,
    emi.tenure,
    emi.remainingMonths,
    emi.nextDueDate,
  ]);

  const res = db!.exec('SELECT last_insert_rowid()')[0];
  stmt.free();
  return res.values[0][0] as number;
}

// Get EMIs for a user
export async function getEMIs(user_id: string): Promise<EMI[]> {
  await ensureDB();
  const stmt = db!.prepare(`SELECT * FROM emis WHERE user_id = ?`);
  stmt.bind([user_id]);

  const emis: EMI[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    emis.push({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      totalAmount: row.totalAmount,
      monthlyEMI: row.monthlyEMI,
      interestRate: row.interestRate,
      tenure: row.tenure,
      remainingMonths: row.remainingMonths,
      nextDueDate: row.nextDueDate,
    });
  }
  stmt.free();
  return emis;
}

// Update EMI
export async function updateEMI(id: number, updates: Partial<EMI>) {
  await ensureDB();
  const keys = Object.keys(updates);
  if (!keys.length) return;

  const fields = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => (updates as any)[k]);
  values.push(id);

  const stmt = db!.prepare(`UPDATE emis SET ${fields} WHERE id = ?`);
  stmt.run(values);
  stmt.free();
}

// Delete EMI
export async function deleteEMI(id: number) {
  await ensureDB();
  const stmt = db!.prepare(`DELETE FROM emis WHERE id = ?`);
  stmt.run([id]);
  stmt.free();
}
