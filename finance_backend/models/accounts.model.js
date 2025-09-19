// models/accounts.model.js
const { openDb } = require('../db');

async function createAccount(userId, { name, type = null, balance = 0, bank = null, account_number = null }) {
  const db = await openDb();
  const sql = `
    INSERT INTO accounts (user_id, name, type, balance, bank, account_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await db.run(sql, [userId, name, type, balance, bank, account_number]);
  const id = result.lastID;
  const row = await db.get('SELECT * FROM accounts WHERE id = ?', [id]);
  await db.close();
  return row;
}

async function getAccountById(id) {
  const db = await openDb();
  const row = await db.get('SELECT * FROM accounts WHERE id = ?', [id]);
  await db.close();
  return row;
}

async function getAccountsByUser({ userId, page = 1, size = 20 }) {
  const limit = Math.max(1, parseInt(size, 10));
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;
  const db = await openDb();
  const accounts = await db.all(
    `SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const countRow = await db.get(`SELECT COUNT(1) as total FROM accounts WHERE user_id = ?`, [userId]);
  await db.close();
  return { total: countRow.total || 0, page: parseInt(page, 10), size: limit, accounts };
}

async function updateAccount(id, userId, fields = {}) {
  const allowed = ['name', 'type', 'balance', 'bank', 'account_number', 'is_active'];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) {
    return getAccountById(id);
  }
  const setSql = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => fields[k]);
  const db = await openDb();
  const result = await db.run(
    `UPDATE accounts SET ${setSql} WHERE id = ? AND user_id = ?`,
    [...values, id, userId]
  );
  if (result.changes === 0) {
    await db.close();
    return null;
  }
  const row = await db.get('SELECT * FROM accounts WHERE id = ?', [id]);
  await db.close();
  return row;
}

// async function softDeleteAccount(id, userId) {
//   const db = await openDb();
//   const result = await db.run(`UPDATE accounts SET is_active = 0 WHERE id = ? AND user_id = ?`, [id, userId]);
//   await db.close();
//   return result.changes > 0;
// }
async function hardDeleteAccount(id, userId) {
  const db = await openDb();
  const result = await db.run(`DELETE FROM accounts WHERE id = ? AND user_id = ?`, [id, userId]);
  await db.close();
  return result.changes > 0;
}


module.exports = {
  createAccount,
  getAccountById,
  getAccountsByUser,
  updateAccount,
  // softDeleteAccount,
  hardDeleteAccount
};
