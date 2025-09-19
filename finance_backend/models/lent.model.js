//website ready
// const { openDb } = require("../db");

// // Create new lent record
// async function createLent(userId, { borrowerName, principalAmount, interestRate = null, lentDate = null, dueDate, totalAmount = 0, status = "Active" }) {
//   const db = await openDb();
//   const result = await db.run(
//     `INSERT INTO lent_money (userId, borrowerName, principalAmount, interestRate, lentDate, dueDate, totalAmount, status)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//     [userId, borrowerName, principalAmount, interestRate, lentDate, dueDate, totalAmount, status]
//   );
//   const row = await db.get("SELECT * FROM lent_money WHERE id = ?", [result.lastID]);
//   await db.close();
//   return row;
// }

// async function getLentById(id) {
//   const db = await openDb();
//   const row = await db.get("SELECT * FROM lent_money WHERE id = ?", [id]);
//   await db.close();
//   return row;
// }

// async function getLentByUser({ userId, page = 1, size = 20 }) {
//   const limit = Math.max(1, parseInt(size, 10));
//   const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;
//   const db = await openDb();
//   const items = await db.all(
//     `SELECT * FROM lent_money WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
//     [userId, limit, offset]
//   );
//   const countRow = await db.get(`SELECT COUNT(*) as total FROM lent_money WHERE userId = ?`, [userId]);
//   await db.close();
//   return { total: countRow.total || 0, page: parseInt(page, 10), size: limit, lent: items };
// }

// async function updateLent(id, userId, fields = {}) {
//   const allowed = ["borrowerName", "principalAmount", "interestRate", "lentDate", "dueDate", "totalAmount", "status"];
//   const keys = Object.keys(fields).filter(k => allowed.includes(k));
//   if (keys.length === 0) return getLentById(id);

//   const setSql = keys.map(k => `${k} = ?`).join(", ");
//   const values = keys.map(k => fields[k]);
//   const db = await openDb();
//   const result = await db.run(
//     `UPDATE lent_money SET ${setSql} WHERE id = ? AND userId = ?`,
//     [...values, id, userId]
//   );
//   if (result.changes === 0) { await db.close(); return null; }
//   const row = await db.get("SELECT * FROM lent_money WHERE id = ?", [id]);
//   await db.close();
//   return row;
// }

// async function deleteLent(id, userId) {
//   const db = await openDb();
//   const result = await db.run(`DELETE FROM lent_money WHERE id = ? AND userId = ?`, [id, userId]);
//   await db.close();
//   return result.changes > 0;
// }

// module.exports = { createLent, getLentById, getLentByUser, updateLent, deleteLent };



//for app
// models/lent.model.js
const { openDb } = require("../db");


function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}


function calculateTotalAmount(principal, rate, lendDate, dueDate) {
  principal = toNum(principal, 0);
  rate = toNum(rate, 0);
  if (!principal || !rate || !lendDate || !dueDate) return principal;

  const durationYears = (new Date(dueDate) - new Date(lendDate)) / (365 * 24 * 60 * 60 * 1000);
  const dur = Number.isFinite(durationYears) ? durationYears : 0;
  return principal + (principal * (rate / 100) * dur);
}


async function createLent(userId, {
  borrowerName,
  principalAmount,
  interestRate = null,
  lentDate = null,
  dueDate,
  totalAmount = null,
  paidAmount = 0,
  remainingAmount = null,
  status = "Active",
}) {
  const principal = toNum(principalAmount, 0);
  const rate = toNum(interestRate, 0);

  // compute totalAmount fallback
  if (totalAmount === null || totalAmount === undefined) {
    totalAmount = calculateTotalAmount(principal, rate, lentDate, dueDate);
  }
  totalAmount = toNum(totalAmount, principal);

  // coerce paidAmount
  paidAmount = toNum(paidAmount, 0);

  // compute remainingAmount if not passed
  if (remainingAmount === null || remainingAmount === undefined) {
    remainingAmount = totalAmount - paidAmount;
  } else {
    remainingAmount = toNum(remainingAmount, totalAmount - paidAmount);
    if (!totalAmount || totalAmount === 0) {
      totalAmount = paidAmount + remainingAmount;
    }
  }

  const db = await openDb();
  const result = await db.run(
    `INSERT INTO lent_money
     (userId, borrowerName, principalAmount, interestRate, lentDate, dueDate, totalAmount, paidAmount, remainingAmount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, borrowerName, principal, rate || null, lentDate, dueDate, totalAmount, paidAmount, remainingAmount, status]
  );
  const row = await db.get("SELECT * FROM lent_money WHERE id = ?", [result.lastID]);
  await db.close();
  return row;
}

async function getLentById(id) {
  const db = await openDb();
  const row = await db.get("SELECT * FROM lent_money WHERE id = ?", [id]);
  await db.close();
  return row;
}

async function getLentByUser({ userId, page = 1, size = 20 }) {
  const limit = Math.max(1, parseInt(size, 10));
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;
  const db = await openDb();
  const items = await db.all(
    `SELECT * FROM lent_money WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const countRow = await db.get(`SELECT COUNT(*) as total FROM lent_money WHERE userId = ?`, [userId]);
  await db.close();
  return { total: countRow.total || 0, page: parseInt(page, 10), size: limit, lent: items };
}


async function updateLent(id, userId, fields = {}) {
  const allowed = [
    "borrowerName",
    "principalAmount",
    "interestRate",
    "lentDate",
    "dueDate",
    "totalAmount",
    "paidAmount",
    "remainingAmount",
    "status"
  ];

  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) return getLentById(id);

  const existing = await getLentById(id);
  if (!existing) return null;

  const merged = {
    borrowerName: existing.borrowerName,
    principalAmount: toNum(existing.principalAmount, 0),
    interestRate: toNum(existing.interestRate, 0),
    lentDate: existing.lentDate,
    dueDate: existing.dueDate,
    totalAmount: toNum(existing.totalAmount, 0),
    paidAmount: toNum(existing.paidAmount, 0),
    remainingAmount: toNum(existing.remainingAmount, 0),
    status: existing.status
  };

  // apply incoming fields
  keys.forEach(k => {
    if (fields[k] === null || fields[k] === undefined) return;
    if (["principalAmount", "interestRate", "totalAmount", "paidAmount", "remainingAmount"].includes(k)) {
      merged[k] = toNum(fields[k], merged[k]);
    } else {
      merged[k] = fields[k];
    }
  });

  // recompute total if principal/rate/dates changed
  const shouldRecomputeTotal =
    (fields.principalAmount !== undefined) ||
    (fields.interestRate !== undefined) ||
    (fields.lentDate !== undefined) ||
    (fields.dueDate !== undefined);

  if (shouldRecomputeTotal) {
    merged.totalAmount = calculateTotalAmount(
      merged.principalAmount,
      merged.interestRate,
      merged.lentDate,
      merged.dueDate
    );
  }

  if (fields.remainingAmount !== undefined && fields.totalAmount === undefined) {
    merged.remainingAmount = toNum(fields.remainingAmount, merged.remainingAmount);
    merged.totalAmount = toNum(merged.paidAmount + merged.remainingAmount, merged.totalAmount);
  }

  if (fields.paidAmount !== undefined && fields.remainingAmount === undefined) {
    merged.paidAmount = toNum(fields.paidAmount, merged.paidAmount);
    merged.remainingAmount = toNum(merged.totalAmount - merged.paidAmount, 0);
  }

  if (fields.totalAmount !== undefined && fields.remainingAmount === undefined) {
    merged.totalAmount = toNum(fields.totalAmount, merged.totalAmount);
    merged.remainingAmount = toNum(merged.totalAmount - merged.paidAmount, 0);
  }

  merged.totalAmount = Math.max(0, toNum(merged.totalAmount, 0));
  merged.paidAmount = Math.max(0, toNum(merged.paidAmount, 0));
  merged.remainingAmount = Math.max(0, toNum(merged.remainingAmount, 0));

  const toSetKeys = Object.keys(merged).filter(k => allowed.includes(k) && fields[k] !== undefined);
  ['principalAmount','interestRate','lentDate','dueDate','totalAmount','paidAmount','remainingAmount','status','borrowerName'].forEach(k=>{
    if (allowed.includes(k) && !toSetKeys.includes(k)) {
      toSetKeys.push(k);
    }
  });

  const setSql = toSetKeys.map(k => `${k} = ?`).join(", ");
  const values = toSetKeys.map(k => merged[k]);

  const db = await openDb();
  const result = await db.run(
    `UPDATE lent_money SET ${setSql} WHERE id = ? AND userId = ?`,
    [...values, id, userId]
  );
  if (result.changes === 0) { await db.close(); return null; }

  const row = await db.get("SELECT * FROM lent_money WHERE id = ?", [id]);
  await db.close();
  return row;
}

async function deleteLent(id, userId) {
  const db = await openDb();
  const result = await db.run(`DELETE FROM lent_money WHERE id = ? AND userId = ?`, [id, userId]);
  await db.close();
  return result.changes > 0;
}

function monthDiff(d1, d2) {
  return (d2.getFullYear() - d1.getFullYear()) * 12 +
         (d2.getMonth() - d1.getMonth());
}

async function payLent(id, userId, { paidAmount, paymentDate = null }) {
  paidAmount = Number(paidAmount) || 0;
  if (paidAmount <= 0) return null;

  const db = await openDb();
  const record = await db.get(
    "SELECT * FROM lent_money WHERE id = ? AND userId = ?",
    [id, userId]
  );
  if (!record) { await db.close(); return null; }

  const rate = toNum(record.interestRate, 0) / 100;
  const principalOriginal = toNum(record.principalAmount, 0);
  const lentDate = record.lentDate ? new Date(record.lentDate) : null;
  if (!lentDate) { await db.close(); throw new Error("Missing lentDate"); }

  const payDate = paymentDate ? new Date(paymentDate) : new Date();

  function monthDiff(d1, d2) {
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  }

  const priorPayments = await db.all(
    "SELECT amount, paymentDate FROM payments WHERE lentId = ? ORDER BY datetime(paymentDate) ASC",
    [id]
  );

  let remainingPrincipal = principalOriginal;
  let lastInterestCalcDate = lentDate;

  // loop through prior payments
  for (const p of priorPayments) {
    const pDate = new Date(p.paymentDate);

    // if same month as last interest calculation, skip
    if (pDate.getFullYear() === lastInterestCalcDate.getFullYear() &&
        pDate.getMonth() === lastInterestCalcDate.getMonth()) {
      remainingPrincipal -= toNum(p.amount, 0); // only reduce principal
      continue;
    }

    const months = monthDiff(lastInterestCalcDate, pDate);
    const interest = remainingPrincipal * rate * (months / 12);
    const paid = toNum(p.amount, 0);
    const interestPaid = Math.min(paid, interest);
    const principalPaidNow = Math.max(0, paid - interestPaid);

    remainingPrincipal = Math.max(0, remainingPrincipal - principalPaidNow);
    lastInterestCalcDate = pDate;
  }

  // check if current payment is in same month as lastInterestCalcDate
  if (payDate.getFullYear() === lastInterestCalcDate.getFullYear() &&
      payDate.getMonth() === lastInterestCalcDate.getMonth()) {
    // same month: only reduce principal
    remainingPrincipal = Math.max(0, remainingPrincipal - paidAmount);
  } else {
    const months = monthDiff(lastInterestCalcDate, payDate);
    const interestToNew = remainingPrincipal * rate * (months / 12);
    if (paidAmount >= interestToNew) {
      remainingPrincipal = Math.max(0, remainingPrincipal - (paidAmount - interestToNew));
    } else {
      // payment less than interest: principal unchanged
    }
  }

  await db.run(
    `INSERT INTO payments (lentId, userId, amount, paymentDate) VALUES (?, ?, ?, ?)`,
    [id, userId, paidAmount, payDate.toISOString().split('T')[0]]
  );

  const totalPaidRow = await db.get(
    "SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE lentId = ?",
    [id]
  );
  const totalPaid = toNum(totalPaidRow.s, 0);

  const status = remainingPrincipal <= 0 ? 'Paid' : 'Active';

  await db.run(
    `UPDATE lent_money
     SET paidAmount = ?, remainingAmount = ?, status = ?, lastPaymentDate = ?
     WHERE id = ? AND userId = ?`,
    [
      totalPaid,
      remainingPrincipal,
      status,
      payDate.toISOString().split('T')[0],
      id,
      userId
    ]
  );

  const updated = await db.get("SELECT * FROM lent_money WHERE id = ?", [id]);
  await db.close();
  return updated;
}


module.exports = { createLent, getLentById, getLentByUser, updateLent, deleteLent, payLent };
