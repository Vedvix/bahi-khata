// models/transactions.model.js
const { openDb } = require("../db");

// Adjust balance (+delta for Income, -delta for Expense)
async function adjustAccountBalance(db, accountId, type, amount, revert = false) {
  if (!accountId) return;

  let delta = amount; // already signed correctly from frontend
  if (revert) delta = -delta;

  await db.run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [
    delta,
    accountId,
  ]);
}

// Resolve account name → id
async function resolveAccountId(db, userId, accountName) {
  if (!accountName) return null;
  const row = await db.get(
    "SELECT id FROM accounts WHERE user_id = ? AND name = ?",
    [userId, accountName]
  );
  return row ? row.id : null;
}

// CREATE
async function createTransaction(userId, { account, description, amount, category, date, type }) {
  const db = await openDb();
  try {
    await db.exec("BEGIN");

    // resolve account name to id
    const account_id = await resolveAccountId(db, userId, account);

    const stmt = `
      INSERT INTO transactions (user_id, account_id, account, description, amount, category, date, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.run(stmt, [
      userId,
      account_id,
      account,
      description,
      amount,
      category,
      date,
      type,
    ]);
    const id = result.lastID;

    const newTxn = await db.get("SELECT * FROM transactions WHERE id = ?", [id]);

    // adjust balance
    if (account_id) {
      await adjustAccountBalance(db, account_id, newTxn.type, newTxn.amount);
    }

    await db.exec("COMMIT");
    await db.close();
    return newTxn;
  } catch (err) {
    try {
      await db.exec("ROLLBACK");
    } catch (_) {}
    await db.close();
    throw err;
  }
}

// GET by ID
async function getTransactionById(id) {
  const db = await openDb();
  const row = await db.get("SELECT * FROM transactions WHERE id = ?", [id]);
  await db.close();
  return row;
}

// GET by User
async function getTransactionsByUser({ userId, filters = {}, page = 1, size = 20 }) {
  const limit = Math.max(1, parseInt(size, 10));
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;

  const conditions = ["user_id = ?"];
  const params = [userId];

  if (filters.account) {
    conditions.push("account = ?");
    params.push(filters.account);
  }
  if (filters.type) {
    conditions.push("type = ?");
    params.push(filters.type);
  }
  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }
  if (filters.dateFrom) {
    conditions.push("date >= ?");
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push("date <= ?");
    params.push(filters.dateTo);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const db = await openDb();
  const transactions = await db.all(
    `SELECT * FROM transactions ${where} ORDER BY date DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const countRow = await db.get(
    `SELECT COUNT(*) as total FROM transactions ${where}`,
    params
  );
  await db.close();

  return {
    total: countRow.total || 0,
    page,
    size: limit,
    transactions,
  };
}

// UPDATE
async function updateTransaction(id, userId, fields = {}) {
  const db = await openDb();
  try {
    await db.exec("BEGIN");

    // get old txn
    const oldTxn = await db.get("SELECT * FROM transactions WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);
    if (!oldTxn) {
      await db.close();
      return null;
    }

    // revert old balance effect
    if (oldTxn.account_id) {
      await adjustAccountBalance(db, oldTxn.account_id, oldTxn.type, oldTxn.amount, true);
    }

    // handle account name → id if updated
    let account_id = oldTxn.account_id;
    if (fields.account) {
      account_id = await resolveAccountId(db, userId, fields.account);
      fields.account_id = account_id;
    }

    // prepare update
    const allowed = ["account_id", "account", "description", "amount", "category", "date", "type"];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length) {
      const setSql = keys.map((k) => `${k} = ?`).join(", ");
      const values = keys.map((k) => fields[k]);
      await db.run(`UPDATE transactions SET ${setSql} WHERE id = ? AND user_id = ?`, [
        ...values,
        id,
        userId,
      ]);
    }

    // apply new balance effect
    const newTxn = await db.get("SELECT * FROM transactions WHERE id = ?", [id]);
    if (newTxn.account_id) {
      await adjustAccountBalance(db, newTxn.account_id, newTxn.type, newTxn.amount);
    }

    await db.exec("COMMIT");
    await db.close();
    return newTxn;
  } catch (err) {
    try {
      await db.exec("ROLLBACK");
    } catch (_) {}
    await db.close();
    throw err;
  }
}

// DELETE
async function deleteTransaction(id, userId) {
  const db = await openDb();
  try {
    await db.exec("BEGIN");

    const txn = await db.get("SELECT * FROM transactions WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);
    if (!txn) {
      await db.close();
      return false;
    }

    // revert effect
    if (txn.account_id) {
      await adjustAccountBalance(db, txn.account_id, txn.type, txn.amount, true);
    }

    await db.run("DELETE FROM transactions WHERE id = ? AND user_id = ?", [id, userId]);
    await db.exec("COMMIT");
    await db.close();
    return true;
  } catch (err) {
    try {
      await db.exec("ROLLBACK");
    } catch (_) {}
    await db.close();
    throw err;
  }
}

module.exports = {
  createTransaction,
  getTransactionById,
  getTransactionsByUser,
  updateTransaction,
  deleteTransaction,
};
