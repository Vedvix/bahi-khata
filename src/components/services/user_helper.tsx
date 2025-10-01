// src/services/user.ts
import { db } from './sqlite'; // your initialized sql.js DB

export async function getOrCreateLocalUser(user: { id: string; email: string; name?: string }) {
  if (!db) throw new Error('DB not initialized');

  // Check if user already exists
  const existing = db.exec(
    `SELECT * FROM local_users WHERE id = '${user.id}'`
  );

  if (existing[0]?.values?.length) {
    return existing[0].values[0];
  }

  // Insert new user
  db.run(
    `INSERT INTO local_users (id, email, name) VALUES (?, ?, ?)`,
    [user.id, user.email, user.name || '']
  );

  return [user.id, user.email, user.name || ''];
}
