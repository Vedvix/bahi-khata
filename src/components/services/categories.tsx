// import { db } from './sqlite';

// import { Category } from '../TransactionContext';

// export const addCategoryDB = async (category: Category): Promise<void> => {
//   try {
//     db.run(
//       `INSERT INTO categories (id, user_id, name, icon, color, type)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [
//         category.id,
//         category.user_id,
//         category.name,
//         category.icon || null,
//         category.color || null,
//         category.type,
//       ]
//     );
//   } catch (err) {
//     console.error("❌ Failed to add category:", err, category);
//     throw err;
//   }
// };

// export const getCategoriesDB = (user_id: string): Category[] => {
//   const stmt = db.prepare("SELECT * FROM categories WHERE user_id = ?");
//   stmt.bind([user_id]);

//   const categories: Category[] = [];
//   while (stmt.step()) {
//     const row = stmt.getAsObject();
//     categories.push({
//       id: row.id.toString(),
//       user_id: row.user_id,
//       name: row.name,
//       icon: row.icon,
//       color: row.color,
//       type: row.type,
//     });
//   }
//   stmt.free();
//   return categories;
// };





// export const updateCategoryDB = async (id: string, updates: Partial<Category>) => {
//   const keys = Object.keys(updates);
//   if (!keys.length) return;

//   const fields = keys.map(k => `${k} = ?`).join(', ');
//   const values = keys.map(k => (updates as any)[k]);
//   values.push(id);

//   try {
//     db.run(`UPDATE categories SET ${fields} WHERE id = ?`, values);
//     console.log("✅ Category updated ID:", id, updates);
//   } catch (err) {
//     console.error("❌ Failed to update category ID:", id, err);
//     throw err;
//   }
// };

// export const deleteCategoryDB = async (id: string) => {
//   try {
//     db.run("DELETE FROM categories WHERE id = ?", [id]);
//     console.log("🗑️ Deleted category ID:", id);
//   } catch (err) {
//     console.error("❌ Failed to delete category ID:", id, err);
//     throw err;
//   }
// };

// export const debugPrintCategories = () => {
//   try {
//     const res = db.exec("SELECT * FROM categories");
//     if (!res.length) return console.log("No categories in DB");

//     const rows = res[0].values.map((row: any[]) =>
//       res[0].columns.reduce((acc: any, col: string, i: number) => {
//         acc[col] = row[i];
//         return acc;
//       }, {})
//     );

//     console.table(rows);
//   } catch (err) {
//     console.error("Failed to print categories:", err);
//   }
// };

// services/categories.tsx
import { db } from './sqlite';
import { Category } from '../TransactionContext';

/**
 * Normalize a raw DB row into the Category shape expected by the app.
 * Converts numeric ids to strings so React state can use string IDs.
 */
const normalizeRowToCategory = (row: any): Category => ({
  id: row.id !== undefined ? String(row.id) : Date.now().toString(),
  user_id: row.user_id !== undefined ? String(row.user_id) : '',
  name: row.name ?? 'Untitled',
  icon: row.icon ?? '',
  color: row.color ?? '#3B82F6',
  type: (row.type as Category['type']) ?? 'expense',
});

/**
 * Get all categories for a given user_id.
 * Uses sql.js prepare()/step()/getAsObject() API only.
 */
export const getCategoriesDB = async (user_id: string): Promise<Category[]> => {
  try {
    if (!db) {
      console.warn('getCategoriesDB: DB not initialized');
      return [];
    }

    const stmt = db.prepare(
      `SELECT id, user_id, name, icon, color, type FROM categories WHERE user_id = ?`
    );
    stmt.bind([user_id]);

    const rows: Category[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push(normalizeRowToCategory(row));
    }

    try { stmt.free(); } catch (e) { /* ignore */ }

    return rows;
  } catch (err) {
    console.error('❌ Failed to fetch categories:', err);
    return [];
  }
};

/**
 * Add a category for a user.
 * Does NOT accept `id` — the DB autoincrements and we return that id as string.
 */
export const addCategoryDB = async (category: {
  user_id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type: Category['type'];
}): Promise<string> => {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');

  try {
    const stmt = db.prepare(
      `INSERT INTO categories (user_id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)`
    );

    stmt.bind([
      category.user_id,
      category.name,
      category.icon ?? null,
      category.color ?? null,
      category.type,
    ]);
    stmt.step();
    try { stmt.free(); } catch (e) { /* ignore */ }

    const res = db.exec(`SELECT last_insert_rowid() AS id`);
    if (Array.isArray(res) && res.length > 0 && Array.isArray(res[0].values) && res[0].values.length > 0) {
      return String(res[0].values[0][0]);
    }

    return Date.now().toString();
  } catch (err) {
    console.error('❌ Failed to add category:', err, category);
    throw err;
  }
};

/**
 * Update a category by id. `id` can be string (we convert internally if needed).
 * Partial updates are supported.
 */
export const updateCategoryDB = async (id: string, updates: Partial<Category>): Promise<void> => {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');
  try {
    const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'user_id');
    if (!keys.length) return;

    const fields = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => (updates as any)[k]);

    // sql.js prepare + step
    const sql = `UPDATE categories SET ${fields} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.bind([...values, id]);
    stmt.step();
    try { stmt.free(); } catch (e) { /* ignore */ }
  } catch (err) {
    console.error('❌ Failed to update category ID:', id, err);
    throw err;
  }
};

/**
 * Delete a category by id.
 */
export const deleteCategoryDB = async (id: string): Promise<void> => {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');
  try {
    const stmt = db.prepare(`DELETE FROM categories WHERE id = ?`);
    stmt.bind([id]);
    stmt.step();
    try { stmt.free(); } catch (e) { /* ignore */ }
  } catch (err) {
    console.error('❌ Failed to delete category ID:', id, err);
    throw err;
  }
};

/**
 * Debug helper — prints all categories from the DB to console.table
 */
export const debugPrintCategories = (): void => {
  try {
    if (!db) {
      console.warn('debugPrintCategories: DB not initialized');
      return;
    }

    const res = db.exec("SELECT * FROM categories");
    if (!Array.isArray(res) || res.length === 0) {
      console.log('No categories in DB');
      return;
    }

    const rows = res[0].values.map((row: any[]) =>
      res[0].columns.reduce((acc: any, col: string, i: number) => {
        acc[col] = row[i];
        return acc;
      }, {})
    );

    console.table(rows);
  } catch (err) {
    console.error('Failed to print categories:', err);
  }
};
