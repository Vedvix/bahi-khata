// src/services/lendmoney.tsx
import { db } from './sqlite';
import { useAuth } from '../AuthPage';
import { LendRecord } from '../TransactionContext';

// ---------------------- Add Lend Record ----------------------
export async function addLendRecord(lend: LendRecord): Promise<number> {
  if (!db) throw new Error('DB not initialized');

  const stmt = db.prepare(`
    INSERT INTO lend_records
      (user_id, borrowerName, amount, lendDate, dueDate, interestRate, purpose, status, paidAmount, remainingAmount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    lend.user_id,
    lend.borrowerName,
    lend.amount,
    lend.lendDate,
    lend.dueDate,
    lend.interestRate,
    lend.purpose || null,
    lend.status,
    lend.paidAmount,
    lend.remainingAmount,
  ]);

  const res = db.exec('SELECT last_insert_rowid()')[0];
  stmt.free();
  return res.values[0][0] as number;
}

// ---------------------- Update Lend Record ----------------------
export async function updateLendRecord(id: number, updates: Partial<LendRecord>) {
  if (!db) throw new Error('DB not initialized');
  const keys = Object.keys(updates);
  if (keys.length === 0) return;

  const fields = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => {
    const v = (updates as any)[k];
    return typeof v === 'boolean' ? (v ? 1 : 0) : v;
  });
  values.push(id);

  const stmt = db.prepare(`UPDATE lend_records SET ${fields} WHERE id = ?`);
  stmt.run(values);
  stmt.free();
}

// ---------------------- Prepayment Handler ----------------------
export async function prepayLendRecord(
  lend: LendRecord,
  prepaymentAmount: number
): Promise<Partial<LendRecord>> {
  const newPaidAmount = lend.paidAmount + prepaymentAmount;
  const newRemainingAmount = Math.max(lend.amount - newPaidAmount, 0);

  // Simplified monthly interest on remaining amount
  const interestAccrued = newRemainingAmount * (lend.interestRate / 100) * (1 / 12);

  const newStatus =
    newRemainingAmount <= 0 ? 'fully_paid' : 'partially_paid';

  const updatedLend: Partial<LendRecord> = {
    paidAmount: newPaidAmount,
    remainingAmount: newRemainingAmount,
    status: newStatus,
  };

  // Update in DB
  await updateLendRecord(Number(lend.id), updatedLend);

  console.log(`✅ Prepayment applied to lend record ID: ${lend.id}`, updatedLend, `Interest accrued: ${interestAccrued.toFixed(2)}`);
  return updatedLend;
}

// ---------------------- Delete Lend Record ----------------------
export async function deleteLendRecord(id: number) {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(`DELETE FROM lend_records WHERE id = ?`);
  stmt.run([id]);
  stmt.free();
}

// export const calculateRemainingWithInterest = (lend: LendRecord, prepayment: number = 0) => {
//   const principalRemaining = lend.amount - lend.paidAmount - prepayment;

//   const lendDate = new Date(lend.lendDate);
//   const dueDate = new Date(lend.dueDate);

//   // Total months for full loan period
//   const totalMonths = (dueDate.getFullYear() - lendDate.getFullYear()) * 12 
//                      + (dueDate.getMonth() - lendDate.getMonth()) + 1; // +1 to include the starting month

//   // Simple interest formula: Interest = P * R * T / 100
//   const interest = principalRemaining * (lend.interestRate / 100) * (totalMonths / 12);

//   const newRemainingAmount = principalRemaining + interest;
//   return newRemainingAmount;
// };

type Prepayment = { amount: number; date: string };

export const calculateRemainingWithInterest = (
  lend: LendRecord & { prepayments?: Prepayment[] }
) => {
  const lendDate = new Date(lend.lendDate);
  const dueDate = new Date(lend.dueDate);
  const interestRate = lend.interestRate;

  // Sort prepayments by date
  const prepayments = (lend.prepayments || []).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let remainingPrincipal = lend.amount - lend.paidAmount;
  let lastCalcDate = new Date(lend.lendDate); // start from loan start
  let totalInterest = 0;

  let sameDayPrepayment = 0;
  let lastPrepayDate: string | null = null;

  for (const prepayment of prepayments) {
    const prepayDate = new Date(prepayment.date);
    const prepayDateStr = prepayDate.toDateString();

    if (lastPrepayDate === prepayDateStr) {
      // Multiple prepayments on the same day, just subtract principal
      remainingPrincipal -= prepayment.amount;
      continue;
    }

    // Months elapsed since last calculation
    const monthsElapsed =
      (prepayDate.getFullYear() - lastCalcDate.getFullYear()) * 12 +
      (prepayDate.getMonth() - lastCalcDate.getMonth());

    if (monthsElapsed > 0) {
      const interest = remainingPrincipal * (interestRate / 100) * (monthsElapsed / 12);
      totalInterest += interest;
    }

    // Subtract prepayment
    remainingPrincipal -= prepayment.amount;

    // Update last calculation date
    lastCalcDate = prepayDate;
    lastPrepayDate = prepayDateStr;
  }

  // Interest for remaining period until due date
  const monthsRemaining =
    (dueDate.getFullYear() - lastCalcDate.getFullYear()) * 12 +
    (dueDate.getMonth() - lastCalcDate.getMonth());
  if (monthsRemaining > 0) {
    totalInterest += remainingPrincipal * (interestRate / 100) * (monthsRemaining / 12);
  }

  return remainingPrincipal + totalInterest;
};

