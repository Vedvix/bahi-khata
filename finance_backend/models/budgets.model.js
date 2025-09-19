const { openDb } = require("../db");

// Helper: generate random hex color
function getRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

// Create new budget
async function createBudget(userId, { category, budgeted, color }) {
  const db = await openDb();

  // ✅ assign provided color or generate one
  const assignedColor = color || getRandomColor();

  const result = await db.run(
    `INSERT INTO budgets (user_id, category, budgeted, color) VALUES (?, ?, ?, ?)`,
    [userId, category, budgeted, assignedColor]
  );

  const row = await db.get("SELECT * FROM budgets WHERE id = ?", [result.lastID]);
  await db.close();
  return row;
}

// Compute spent & percentage for a single budget
async function enrichBudgetWithStats(db, budget) {
  if (!budget) return null;

  // ❌ removed period filtering
  let query = `SELECT SUM(amount) as total FROM transactions 
               WHERE user_id = ? AND category = ? AND type = 'expense'`;
  const params = [budget.user_id, budget.category];

  const row = await db.get(query, params);
  const spent = row?.total || 0;
  const percentage = budget.budgeted > 0 ? Math.round((spent / budget.budgeted) * 100) : 0;

  return { ...budget, spent, percentage };
}

async function getBudgetById(id) {
  const db = await openDb();
  const row = await db.get("SELECT * FROM budgets WHERE id = ?", [id]);
  const enriched = await enrichBudgetWithStats(db, row);
  await db.close();
  return enriched;
}

async function getBudgetsByUser({ userId, page = 1, size = 20 }) {
  const limit = Math.max(1, parseInt(size, 10));
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;

  const db = await openDb();
  const budgets = await db.all(
    `SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const enrichedBudgets = [];
  for (const b of budgets) {
    enrichedBudgets.push(await enrichBudgetWithStats(db, b));
  }

  const countRow = await db.get(`SELECT COUNT(*) as total FROM budgets WHERE user_id = ?`, [userId]);
  await db.close();

  return { total: countRow.total || 0, page: parseInt(page, 10), size: limit, budgets: enrichedBudgets };
}

async function updateBudget(id, userId, fields = {}) {
  // ✅ removed "period" from allowed updates
  const allowed = ["category", "budgeted", "color"];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (keys.length === 0) return getBudgetById(id);

  const setSql = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => fields[k]);

  const db = await openDb();
  const result = await db.run(
    `UPDATE budgets SET ${setSql} WHERE id = ? AND user_id = ?`,
    [...values, id, userId]
  );
  if (result.changes === 0) {
    await db.close();
    return null;
  }
  const row = await db.get("SELECT * FROM budgets WHERE id = ?", [id]);
  const enriched = await enrichBudgetWithStats(db, row);
  await db.close();
  return enriched;
}

async function deleteBudget(id, userId) {
  const db = await openDb();
  const result = await db.run(`DELETE FROM budgets WHERE id = ? AND user_id = ?`, [id, userId]);
  await db.close();
  return result.changes > 0;
}

module.exports = { createBudget, getBudgetById, getBudgetsByUser, updateBudget, deleteBudget };
