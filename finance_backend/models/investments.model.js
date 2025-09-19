const { openDb } = require("../db");

// Create new investment
async function createInvestment(userId, { 
  name, 
  type, 
  amount, 
  currentValue = 0, 
  startDate, 
  maturityDate, 
  returns = 0 
}) {
  const db = await openDb();
  const result = await db.run(
    `INSERT INTO investments 
      (userId, name, type, amount, currentValue, startDate, maturityDate, returns)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, type, amount, currentValue, startDate, maturityDate, returns]
  );
  const row = await db.get("SELECT * FROM investments WHERE id = ?", [result.lastID]);
  await db.close();
  return row;
}

// Get one by ID
async function getInvestmentById(id) {
  const db = await openDb();
  const row = await db.get("SELECT * FROM investments WHERE id = ?", [id]);
  await db.close();
  return row;
}

// Get all by user with pagination
async function getInvestmentsByUser({ userId, page = 1, size = 20 }) {
  const limit = Math.max(1, parseInt(size, 10));
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;
  const db = await openDb();
  const items = await db.all(
    `SELECT * FROM investments WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const countRow = await db.get(
    `SELECT COUNT(*) as total FROM investments WHERE userId = ?`,
    [userId]
  );
  await db.close();
  return { 
    total: countRow.total || 0, 
    page: parseInt(page, 10), 
    size: limit, 
    investments: items 
  };
}

// Update
async function updateInvestment(id, userId, fields = {}) {
  const allowed = ["name", "type", "amount", "currentValue", "startDate", "maturityDate", "returns"];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) return getInvestmentById(id);

  const setSql = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => fields[k]);

  const db = await openDb();
  const result = await db.run(
    `UPDATE investments SET ${setSql} WHERE id = ? AND userId = ?`,
    [...values, id, userId]
  );
  if (result.changes === 0) { 
    await db.close(); 
    return null; 
  }
  const row = await db.get("SELECT * FROM investments WHERE id = ?", [id]);
  await db.close();
  return row;
}

// Delete
async function deleteInvestment(id, userId) {
  const db = await openDb();
  const result = await db.run(
    `DELETE FROM investments WHERE id = ? AND userId = ?`, 
    [id, userId]
  );
  await db.close();
  return result.changes > 0;
}

module.exports = { 
  createInvestment, 
  getInvestmentById, 
  getInvestmentsByUser, 
  updateInvestment, 
  deleteInvestment 
};
