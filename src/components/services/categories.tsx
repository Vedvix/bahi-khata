import { db } from './sqlite';

import { Category } from '../TransactionContext';

export const addCategoryDB = async (category: Category): Promise<void> => {
  try {
    db.run(
      `INSERT INTO categories (id, user_id, name, icon, color, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        category.id,
        category.user_id,
        category.name,
        category.icon || null,
        category.color || null,
        category.type,
      ]
    );
  } catch (err) {
    console.error("❌ Failed to add category:", err, category);
    throw err;
  }
};

export const getCategoriesDB = (user_id: string): Category[] => {
  const stmt = db.prepare("SELECT * FROM categories WHERE user_id = ?");
  stmt.bind([user_id]);

  const categories: Category[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    categories.push({
      id: row.id.toString(),
      user_id: row.user_id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
    });
  }
  stmt.free();
  return categories;
};





export const updateCategoryDB = async (id: string, updates: Partial<Category>) => {
  const keys = Object.keys(updates);
  if (!keys.length) return;

  const fields = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => (updates as any)[k]);
  values.push(id);

  try {
    db.run(`UPDATE categories SET ${fields} WHERE id = ?`, values);
    console.log("✅ Category updated ID:", id, updates);
  } catch (err) {
    console.error("❌ Failed to update category ID:", id, err);
    throw err;
  }
};

export const deleteCategoryDB = async (id: string) => {
  try {
    db.run("DELETE FROM categories WHERE id = ?", [id]);
    console.log("🗑️ Deleted category ID:", id);
  } catch (err) {
    console.error("❌ Failed to delete category ID:", id, err);
    throw err;
  }
};

export const debugPrintCategories = () => {
  try {
    const res = db.exec("SELECT * FROM categories");
    if (!res.length) return console.log("No categories in DB");

    const rows = res[0].values.map((row: any[]) =>
      res[0].columns.reduce((acc: any, col: string, i: number) => {
        acc[col] = row[i];
        return acc;
      }, {})
    );

    console.table(rows);
  } catch (err) {
    console.error("Failed to print categories:", err);
  }
};
