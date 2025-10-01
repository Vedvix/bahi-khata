import { query } from "./db";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode("your_jwt_secret"); // must be Uint8Array
const ACCESS_TOKEN_EXP = "15m";
const REFRESH_TOKEN_EXP = "7d";

async function generateToken(payload: JWTPayload, exp: string) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp)
    .sign(JWT_SECRET);
}
export async function signup(email: string, password: string, name: string) {
  const existing = await query("SELECT * FROM users WHERE email = $1", [email]);
  if (existing.length > 0) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);

  const inserted = await query(
    "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
    [email, hashed, name]
  );
  const user = inserted[0];

  const accessToken = await generateToken({ id: user.id }, ACCESS_TOKEN_EXP);
  const refreshToken = await generateToken({ id: user.id }, REFRESH_TOKEN_EXP);

  return { accessToken, refreshToken, user };
}

export async function login(email: string, password: string) {
  const users = await query("SELECT * FROM users WHERE email = $1", [email]);
  if (users.length === 0) throw new Error("User not found");

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");

  const accessToken = await generateToken({ id: user.id }, ACCESS_TOKEN_EXP);
  const refreshToken = await generateToken({ id: user.id }, REFRESH_TOKEN_EXP);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function refreshToken(oldRefreshToken: string) {
  try {
    const { payload } = await jwtVerify(oldRefreshToken, JWT_SECRET);

    const userId = (payload as any).id;
    const accessToken = await generateToken({ id: userId }, ACCESS_TOKEN_EXP);
    const newRefreshToken = await generateToken(
      { id: userId },
      REFRESH_TOKEN_EXP
    );

    return { accessToken, refreshToken: newRefreshToken };
  } catch {
    throw new Error("Invalid refresh token");
  }
}


export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    console.log('User from localStorage:', userId);

  const users = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
  if (!users.length) throw new Error('User not found');

  const user = users[0];
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new Error('Current password incorrect');

  const hashed = await bcrypt.hash(newPassword, 10);
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashed, userId]);

  return { success: true, message: 'Password updated successfully' };
}

// ---------------------- Update User Info ----------------------
export async function updateUserInfo(userId: string, updates: { name?: string; email?: string; phone?: string }) {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const key of ['name', 'email', 'phone'] as const) {
    if (updates[key]) {
      fields.push(`${key} = $${i}`);
      values.push(updates[key]);
      i++;
    }
  }

  if (!fields.length) return { user: updates, message: 'No changes made' };

  values.push(userId); // last parameter is WHERE id = $i
  const queryText = `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, name, email, phone`;
  const updatedUsers = await query(queryText, values);

  return { user: updatedUsers[0], message: 'User info updated successfully' };
}

// auth-direct.ts

export function logout() {
  // Remove user info and tokens from localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('me'); // the stored user object
  return { success: true };
}
