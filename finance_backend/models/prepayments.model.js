const { openDb } = require("../db");

async function createPrepayment(emiId, { date, amount }) {
  const db = await openDb();
  const result = await db.run(
    `INSERT INTO emi_prepayments (emi_id, date, amount) VALUES (?, ?, ?)`,
    [emiId, date, amount]
  );
  const row = await db.get("SELECT * FROM emi_prepayments WHERE id = ?", [result.lastID]);
  await db.close();
  return row;
}

async function getPrepaymentById(id) {
  const db = await openDb();
  const row = await db.get("SELECT * FROM emi_prepayments WHERE id = ?", [id]);
  await db.close();
  return row;
}

async function getPrepaymentsByEmi(emiId) {
  const db = await openDb();
  const items = await db.all("SELECT * FROM emi_prepayments WHERE emi_id = ? ORDER BY date DESC", [emiId]);
  await db.close();
  return items;
}

async function deletePrepayment(id) {
  const db = await openDb();
  const result = await db.run(`DELETE FROM emi_prepayments WHERE id = ?`, [id]);
  await db.close();
  return result.changes > 0;
}

module.exports = { createPrepayment, getPrepaymentById, getPrepaymentsByEmi, deletePrepayment };
