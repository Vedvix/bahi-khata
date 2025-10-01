import { db } from './sqlite';

// ---------------------- Transaction type ----------------------
import { Transaction } from '../TransactionContext';

// ---------------------- Add transaction ----------------------
export const addTransactionDB = async (transaction: Transaction): Promise<number> => {
  try {
    db.run(
      `INSERT INTO transactions
       (id, user_id, type, amount, category, description, date, time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.user_id,
        transaction.type,
        transaction.amount,
        transaction.category || null,
        transaction.description || null,
        transaction.date,
        transaction.time,
      ]
    );

    const res = db.exec("SELECT last_insert_rowid() as id");
    const insertedId = res[0].values[0][0];
    console.log("✅ Transaction added to DB:", transaction);
    console.log("📌 last_insert_rowid:", insertedId);

    return insertedId;
  } catch (err) {
    console.error("❌ Failed to add transaction:", err, transaction);
    throw err;
  }
};

// ---------------------- Get transactions by user ----------------------
export const getTransactionsDB = (user_id: string): Transaction[] => {
  const stmt = db.prepare("SELECT * FROM transactions WHERE user_id = ?");
  stmt.bind([user_id]);

  const transactions: Transaction[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    transactions.push({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      amount: row.amount,
      category: row.category,
      description: row.description,
      date: row.date,
      time: row.time,
    });
  }
  stmt.free();
  return transactions;
};

// ---------------------- Update transaction ----------------------
export const updateTransactionDB = async (id: number, updates: Partial<Transaction>) => {
  const keys = Object.keys(updates);
  if (!keys.length) return;

  const fields = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => (updates as any)[k]);
  values.push(id);

  try {
    db.run(`UPDATE transactions SET ${fields} WHERE id = ?`, values);
    console.log("✅ Transaction updated ID:", id, updates);
  } catch (err) {
    console.error("❌ Failed to update transaction ID:", id, err);
    throw err;
  }
};

// ---------------------- Delete transaction ----------------------
export const deleteTransactionDB = async (id: number) => {
  try {
    db.run("DELETE FROM transactions WHERE id = ?", [id]);
    console.log("🗑️ Deleted transaction ID:", id);
  } catch (err) {
    console.error("❌ Failed to delete transaction ID:", id, err);
    throw err;
  }
};

// ---------------------- Debug helper ----------------------
export const debugPrintTransactions = () => {
  try {
    const res = db.exec("SELECT * FROM transactions");
    if (!res.length) return console.log("No transactions in DB");

    const rows = res[0].values.map((row: any[]) =>
      res[0].columns.reduce((acc: any, col: string, i: number) => {
        acc[col] = row[i];
        return acc;
      }, {})
    );

    console.table(rows);
  } catch (err) {
    console.error("Failed to print transactions:", err);
  }
};
