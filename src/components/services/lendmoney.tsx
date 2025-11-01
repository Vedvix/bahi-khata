// src/services/lendmoney.tsx
import { db } from './sqlite';
// import { useAuth } from '../AuthPage';
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

// ---------------------- Prepayment Handler (Monthly Simple Interest) ----------------------
export async function prepayLendRecord(
  lend: LendRecord,
  prepaymentAmount: number,
  prepaymentDate: string = new Date().toISOString().split('T')[0]
): Promise<Partial<LendRecord>> {
  
  if (prepaymentAmount <= 0) return {};

  // 1. Determine Interest Calculation Start Date
  const lendId = Number(lend.id);
  const lastPrepayDateStr = await getLastPrepaymentDate(lendId);
  
  // Interest accrues from the last payment date, or the original lend date if none.
  const startDateStr = lastPrepayDateStr || lend.lendDate;
  
  // Use dates stripped of time for accurate day counting
  const startDate = new Date(startDateStr.split('T')[0]);
  const payDate = new Date(prepaymentDate.split('T')[0]);
  
  // Calculate DAYS Outstanding
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  // This calculates days since the last principal-affecting event.
  const daysOutstanding = Math.round((payDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  
  // If prepayment is on the exact same day as the last one, daysOutstanding will be 0.
  // We should still allow a payment, but interest will be 0.

  // 2. Setup Financial Parameters
  // Principal that is still owed and accruing interest (after all prior payments)
  const principalAccruing = parseFloat((lend.amount - lend.paidAmount).toFixed(2));
  const rate = parseFloat(lend.interestRate.toString()) / 100;
  
  if (principalAccruing <= 0) return { status: 'fully_paid', paidAmount: lend.amount };

  // 3. Calculate Interest Accrued: P * R * (T / 365)
  // Interest is only for the period *since* the last payment.
  const interestAccrued = principalAccruing * rate * (daysOutstanding / 365);
  const interestToPay = parseFloat(interestAccrued.toFixed(2));
  
  // 4. Allocate Payment
  let paymentRemaining = prepaymentAmount; 
  let principalPaid = 0;
  
  // a) Payment covers accrued interest first
  if (paymentRemaining >= interestToPay) {
    paymentRemaining -= interestToPay;
    principalPaid = Math.min(principalAccruing, paymentRemaining);
  } else {
    // Payment only partially covers interest. The remainder of the interest 
    // is left to accrue, and no principal is paid.
    principalPaid = 0; 
  }
  
  // 5. Add the Prepayment Record (log the event)
  const stmt = db.prepare(`
    INSERT INTO lend_prepayments (lend_id, amount, date)
    VALUES (?, ?, ?)
  `);
  stmt.run([lendId, prepaymentAmount, prepaymentDate]);
  stmt.free();

  // 6. Update Lend Record State
  const newPaidAmount = lend.paidAmount + principalPaid;
  const newRemainingAmount = Math.max(0, lend.amount - newPaidAmount);
  
  const newStatus = newRemainingAmount <= 0 ? 'fully_paid' : 'partially_paid';

  const updatedLend: Partial<LendRecord> = {
    paidAmount: parseFloat(newPaidAmount.toFixed(2)),
    remainingAmount: parseFloat(newRemainingAmount.toFixed(2)),
    status: newStatus,
  };

  await updateLendRecord(lendId, updatedLend); // Use your existing updateLendRecord function

  console.log(`--- DEBUG LOG for Repayment on ${prepaymentDate} ---`);
  console.log(`- Start Date for Interest: ${startDateStr}`);
  console.log(`- Days Outstanding: ${daysOutstanding}`);
  console.log(`- Interest Accrued: ${interestToPay.toFixed(2)}`);
  console.log(`- Principal Paid: ${principalPaid.toFixed(2)}`);
  console.log(`- New Remaining Amount: ${updatedLend.remainingAmount.toFixed(2)}`);
  console.log('------------------------------');
  
  return updatedLend;
}

export async function deleteLendRecord(id: number) {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(`DELETE FROM lend_records WHERE id = ?`);
  stmt.run([id]);
  stmt.free();
}

export const calculateRemainingWithInterest = (lend: LendRecord, prepayment: number = 0) => {
  const principalRemaining = lend.amount - lend.paidAmount - prepayment;

  const lendDate = new Date(lend.lendDate);
  const dueDate = new Date(lend.dueDate);

  // Total months for full loan period
  const totalMonths = (dueDate.getFullYear() - lendDate.getFullYear()) * 12 
                     + (dueDate.getMonth() - lendDate.getMonth()) + 1; // +1 to include the starting month

  // Simple interest formula: Interest = P * R * T / 100
  const interest = principalRemaining * (lend.interestRate / 100) * (totalMonths / 12);

  const newRemainingAmount = principalRemaining + interest;
  return newRemainingAmount;
};

export async function getLastPrepaymentDate(lendId: number): Promise<string | null> {
  if (!db) throw new Error('DB not initialized');
  
  // Select the date of the most recent prepayment for this loan
  const res = db.exec(`
    SELECT date FROM lend_prepayments 
    WHERE lend_id = ${lendId} 
    ORDER BY date DESC, id DESC 
    LIMIT 1
  `);

  if (res.length > 0 && res[0].values.length > 0) {
    return res[0].values[0][0] as string;
  }
  return null;
}