const { openDb } = require('../db'); // your SQLite helper

async function createTransaction(transaction) {
  const db = await openDb();
  const { type, amount, category, description, date, time } = transaction;
  const result = await db.run(
    `INSERT INTO transaction_app (type, amount, category, description, date, time)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [type, amount, category, description || '', date, time]
  );
  await db.close();
  return { id: result.lastID, ...transaction };
}

async function getTransactions() {
  const db = await openDb();
  const rows = await db.all(`SELECT * FROM transaction_app ORDER BY date DESC, time DESC`);
  await db.close();
  return rows;
}

async function getTransactionById(id) {
  const db = await openDb();
  const row = await db.get(`SELECT * FROM transaction_app WHERE id = ?`, [id]);
  await db.close();
  return row;
}

async function updateTransaction(id, transaction) {
  const db = await openDb();
  const { type, amount, category, description, date, time } = transaction;
  await db.run(
    `UPDATE transaction_app SET type = ?, amount = ?, category = ?, description = ?, date = ?, time = ?
     WHERE id = ?`,
    [type, amount, category, description || '', date, time, id]
  );
  const updated = await getTransactionById(id);
  await db.close();
  return updated;
}

async function deleteTransaction(id) {
  const db = await openDb();
  await db.run(`DELETE FROM transaction_app WHERE id = ?`, [id]);
  await db.close();
  return { id };
}

// Compute balance, total income & expense
async function getBalanceSummary() {
  const db = await openDb();
  const income = await db.get(`SELECT SUM(amount) as totalIncome FROM transaction_app WHERE type='income'`);
  const expense = await db.get(`SELECT SUM(amount) as totalExpense FROM transaction_app WHERE type='expense'`);
  await db.close();
  return {
    totalIncome: income.totalIncome || 0,
    totalExpense: expense.totalExpense || 0,
    balance: (income.totalIncome || 0) - (expense.totalExpense || 0),
  };
}

async function getRecentTransactions(limit = 5) {
  const db = await openDb();
  const recent = await db.all(
    "SELECT * FROM transaction_app ORDER BY time DESC LIMIT ?",
    [limit]
  );
  await db.close();
  return recent;
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getBalanceSummary,
  getRecentTransactions
};
