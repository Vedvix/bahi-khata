import { db } from './sqlite';

export interface Prepayment {
  id?: number;
  lend_id: number;
  amount: number;
  date: string;
}

// Add prepayment
export const addPrepaymentDB = async (prepayment: Prepayment): Promise<Prepayment> => {
  try {
    const result = await db.run(
      `INSERT INTO lend_prepayments (lend_id, amount, date) VALUES (?, ?, ?)`,
      [prepayment.lend_id, prepayment.amount, prepayment.date]
    );

    return { ...prepayment, id: result.lastID };
  } catch (err) {
    console.error("❌ Failed to add prepayment:", err, prepayment);
    throw err;
  }
};

// Get prepayments for a lend
export const getPrepaymentsDB = async (lend_id: number): Promise<Prepayment[]> => {
  const stmt = db.prepare(`SELECT * FROM lend_prepayments WHERE lend_id = ? ORDER BY date ASC`);
  const prepayments: Prepayment[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    prepayments.push({
      id: row.id,
      lend_id: row.lend_id,
      amount: row.amount,
      date: row.date,
    });
  }
  stmt.free();
  return prepayments;
};

// Debug print
export const debugPrintPrepayments = () => {
  try {
    const res = db.exec("SELECT * FROM lend_prepayments");
    if (!res.length) return console.log("No prepayments in DB");

    const rows = res[0].values.map((row: any[]) =>
      res[0].columns.reduce((acc: any, col: string, i: number) => {
        acc[col] = row[i];
        return acc;
      }, {})
    );

    console.table(rows);
  } catch (err) {
    console.error("Failed to print prepayments:", err);
  }
};
