const { openDb } = require("../db");

// Create a new EMI
async function createEmi(userId, { name, principal, interest_rate, tenure_months, start_date, paid_months = 0, prepayment = 0, status = "Active" }) {
  const db = await openDb();
  const result = await db.run(
    `INSERT INTO emis (user_id, name, principal, interest_rate, tenure_months, start_date, paid_months, prepayment, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, principal, interest_rate, tenure_months, start_date, paid_months, prepayment, status]
  );
  const row = await db.get("SELECT * FROM emis WHERE id = ?", [result.lastID]);
  await db.close();
  return row;
}

// Get EMI by ID
async function getEmiById(id) {
  const db = await openDb();
  const row = await db.get("SELECT * FROM emis WHERE id = ?", [id]);
  await db.close();
  return row;
}

// Get EMIs by user with pagination
async function getEmisByUser({ userId, page = 1, size = 20 }) {
  const limit = Math.max(1, parseInt(size, 10));
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;
  const db = await openDb();
  const items = await db.all(
    `SELECT * FROM emis WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const countRow = await db.get(`SELECT COUNT(*) as total FROM emis WHERE user_id = ?`, [userId]);
  await db.close();
  return { total: countRow.total || 0, page: parseInt(page, 10), size: limit, emis: items };
}

// Update an EMI
async function updateEmi(id, userId, fields = {}) {
  const allowed = ["name", "principal", "interest_rate", "tenure_months", "start_date", "paid_months", "prepayment", "status"];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) return getEmiById(id);

  const setSql = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => fields[k]);
  const db = await openDb();
  const result = await db.run(
    `UPDATE emis SET ${setSql} WHERE id = ? AND user_id = ?`,
    [...values, id, userId]
  );
  if (result.changes === 0) { await db.close(); return null; }

  const row = await db.get("SELECT * FROM emis WHERE id = ?", [id]);
  await db.close();
  return row;
}

// Delete an EMI
async function deleteEmi(id, userId) {
  const db = await openDb();
  const result = await db.run(`DELETE FROM emis WHERE id = ? AND user_id = ?`, [id, userId]);
  await db.close();
  return result.changes > 0;
}

module.exports = { createEmi, getEmiById, getEmisByUser, updateEmi, deleteEmi };
