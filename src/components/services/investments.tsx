import { db } from './sqlite';

// ---------------------- Investment type ----------------------
export interface Investment {
  id?: string;           // optional for new inserts
  user_id: string;
  name: string;
  type: 'mutual_fund' | 'stocks' | 'ppf' | 'fd' | 'gold' | 'crypto' | 'bonds';
  amount: number;
  currentValue: number;
  purchaseDate: string;
  maturityDate?: string;
  interestRate?: number;
  returns: number;
  status: 'active' | 'matured' | 'sold';
}

// ---------------------- Add investment ----------------------
export const addInvestmentDB = async (investment: Investment): Promise<number> => {
  try {
    db.run(
      `INSERT INTO investments
       (id, user_id, name, type, amount, currentValue, purchaseDate, maturityDate, interestRate, returns, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        investment.id,
        investment.user_id,
        investment.name,
        investment.type,
        investment.amount,
        investment.currentValue,
        investment.purchaseDate,
        investment.maturityDate || null,
        investment.interestRate || null,
        investment.returns,
        investment.status,
      ]
    );

    // Confirm insert
    const res = db.exec("SELECT last_insert_rowid() as id");
    const insertedId = res[0].values[0][0];
    console.log("✅ Investment added to DB:", investment);
    console.log("📌 last_insert_rowid:", insertedId);

    return insertedId;
  } catch (err) {
    console.error("❌ Failed to add investment:", err, investment);
    throw err;
  }
};

// ---------------------- Get investments by user ----------------------
export const getInvestmentsDB = (user_id: string): Investment[] => {
  const stmt = db.prepare("SELECT * FROM investments WHERE user_id = ?");
  stmt.bind([user_id]);

  const investments: Investment[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    investments.push({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      type: row.type,
      amount: row.amount,
      currentValue: row.currentValue,
      purchaseDate: row.purchaseDate,
      maturityDate: row.maturityDate,
      interestRate: row.interestRate,
      returns: row.returns,
      status: row.status,
    });
  }
  stmt.free();
  return investments;
};

// ---------------------- Update investment ----------------------
export const updateInvestmentDB = async (id: number, updates: Partial<Investment>) => {
  const keys = Object.keys(updates);
  if (!keys.length) return;

  const fields = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => (updates as any)[k]);
  values.push(id);

  try {
    db.run(`UPDATE investments SET ${fields} WHERE id = ?`, values);
    console.log("✅ Updated investment ID:", id, "with", updates);
  } catch (err) {
    console.error("❌ Failed to update investment ID:", id, err);
    throw err;
  }
};

// ---------------------- Delete investment ----------------------
export const deleteInvestmentDB = async (id: number) => {
  try {
    db.run("DELETE FROM investments WHERE id = ?", [id]);
    console.log("🗑️ Deleted investment ID:", id);
  } catch (err) {
    console.error("❌ Failed to delete investment ID:", id, err);
    throw err;
  }
};

// ---------------------- Debug helper ----------------------
export const debugPrintInvestments = () => {
  try {
    const res = db.exec("SELECT * FROM investments");
    if (!res.length) return console.log("No investments in DB");

    const rows = res[0].values.map((row: any[]) =>
      res[0].columns.reduce((acc: any, col: string, i: number) => {
        acc[col] = row[i];
        return acc;
      }, {})
    );

    console.table(rows);
  } catch (err) {
    console.error("Failed to print investments:", err);
  }
};
