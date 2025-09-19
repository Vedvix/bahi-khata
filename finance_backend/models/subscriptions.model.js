const { openDb } = require("../db");

// Create a new subscription
async function createSubscription(userId, {
  name,
  amount,
  frequency,
  nextBilling,
  category,
  isActive = true,
  autoRenew = true,
}) {
  const db = await openDb();
  const result = await db.run(
    `INSERT INTO subscriptions 
     (user_id, name, amount, frequency, nextBilling, category, isActive, autoRenew)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, amount, frequency, nextBilling, category, isActive ? 1 : 0, autoRenew ? 1 : 0]
  );
  const row = await db.get("SELECT * FROM subscriptions WHERE id = ?", [result.lastID]);

  // Convert integers back to booleans for frontend
  row.isActive = Boolean(row.isActive);
  row.autoRenew = Boolean(row.autoRenew);

  await db.close();
  return row;
}

// Get a subscription by ID
async function getSubscriptionById(id) {
  const db = await openDb();
  const row = await db.get("SELECT * FROM subscriptions WHERE id = ?", [id]);
  if (row) {
    row.isActive = Boolean(row.isActive);
    row.autoRenew = Boolean(row.autoRenew);
  }
  await db.close();
  return row;
}

// Get all subscriptions for a user with pagination
async function getSubscriptionsByUser({ userId, page = 1, size = 20 }) {
  const limit = Math.max(1, parseInt(size, 10));
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;
  const db = await openDb();
  const subs = await db.all(
    `SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const countRow = await db.get(`SELECT COUNT(*) as total FROM subscriptions WHERE user_id = ?`, [userId]);
  await db.close();

  // Convert boolean fields
  subs.forEach(s => {
    s.isActive = Boolean(s.isActive);
    s.autoRenew = Boolean(s.autoRenew);
  });

  return { total: countRow.total || 0, page: parseInt(page, 10), size: limit, subscriptions: subs };
}

// Update a subscription
async function updateSubscription(id, userId, fields = {}) {
  const allowed = ["name", "amount", "frequency", "nextBilling", "category", "isActive", "autoRenew"];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) return getSubscriptionById(id);

  const setSql = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => (k === "isActive" || k === "autoRenew") ? (fields[k] ? 1 : 0) : fields[k]);

  const db = await openDb();
  const result = await db.run(
    `UPDATE subscriptions SET ${setSql} WHERE id = ? AND user_id = ?`,
    [...values, id, userId]
  );

  if (result.changes === 0) { await db.close(); return null; }

  const row = await db.get("SELECT * FROM subscriptions WHERE id = ?", [id]);
  if (row) {
    row.isActive = Boolean(row.isActive);
    row.autoRenew = Boolean(row.autoRenew);
  }

  await db.close();
  return row;
}

// Delete a subscription
async function deleteSubscription(id, userId) {
  const db = await openDb();
  const result = await db.run(`DELETE FROM subscriptions WHERE id = ? AND user_id = ?`, [id, userId]);
  await db.close();
  return result.changes > 0;
}

module.exports = { createSubscription, getSubscriptionById, getSubscriptionsByUser, updateSubscription, deleteSubscription };
