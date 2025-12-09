import { query } from "./db";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, JWTPayload, decodeJwt, createRemoteJWKSet } from "jose";

const JWT_SECRET = new TextEncoder().encode("your_jwt_secret"); // must be Uint8Array
const ACCESS_TOKEN_EXP = "15m";
const REFRESH_TOKEN_EXP = "7d";
const GOOGLE_CLIENT_ID = "213331984531-7mt2o3qn2pc2m3o2e91b6t4dorkhiicj.apps.googleusercontent.com"; // 👈 CRITICAL: Must be set in your serverless environment!
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'; 
const GOOGLE_ISSUER = 'https://accounts.google.com';

// Pre-fetch/cache Google's public keys for verification
const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

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

export async function loginWithGoogle(credential: string) {
    let payload: any;
    
    console.log("--- Starting Google Token Processing ---");
    
    // 🛑 STEP 1: VERIFY THE GOOGLE ID TOKEN
    if (!GOOGLE_CLIENT_ID) {
        console.error("ERROR: GOOGLE_CLIENT_ID is missing from environment variables!");
        throw new Error("Server configuration error: GOOGLE_CLIENT_ID is not set.");
    }
    
    try {
        console.log("1. Attempting Google token verification (signature, aud, exp)...");
        
        const { payload: verifiedPayload } = await jwtVerify(credential, JWKS, {
            audience: GOOGLE_CLIENT_ID, 
            issuer: GOOGLE_ISSUER,     
        });
        
        payload = verifiedPayload; 
        
        if (!payload.email || !payload.name) {
             console.error("ERROR: Verified token is missing critical claims (email/name).");
             throw new Error("Verified Google token is missing email or name claims.");
        }
        
        console.log(`2. Token verified successfully. Email: ${payload.email}`);
        
    } catch (err: any) {
        console.error(`3. FAILED verification for Google token. Error: ${err.message}`);
        // Log the full token content (carefully, only in dev) if needed for deep debugging
        // console.error("Failing Token:", credential); 
        throw new Error("Google token is invalid, expired, or was not issued for this application.");
    }
    
    // -----------------------------------------------------------
    // 🚀 STEP 2: AUTO-SIGNUP/LOGIN LOGIC
    // -----------------------------------------------------------
    
    const email = payload.email;
    const name = payload.name;
    
    console.log("4. Checking for existing user in database...");
    let users = await query("SELECT * FROM users WHERE email = $1", [email]);
    let user;

    if (users.length === 0) {
        // 3. User does not exist - auto-signup 
        console.log(`5a. User not found. Executing auto-signup for: ${email}`);
        
        const tempPassword = Math.random().toString(36).slice(-8); 
        const hashed = await bcrypt.hash(tempPassword, 10); 

        const inserted = await query(
            "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
            [email, hashed, name]
        );
        user = inserted[0];
        console.log(`6a. New user created with ID: ${user.id}`);
        
    } else {
        // 4. User exists - log them in
        user = users[0];
        console.log(`5b. User found. Logging in existing user ID: ${user.id}`);
    }

    // 5. Generate your application's access and refresh tokens
    console.log("7. Generating custom Access Token (15m) and Refresh Token (7d)...");
    const accessToken = await generateToken({ id: user.id }, ACCESS_TOKEN_EXP);
    const refreshToken = await generateToken({ id: user.id }, REFRESH_TOKEN_EXP);

    // Note: Logging the full token is generally discouraged, but logging the start helps
    console.log(`8. Tokens generated. Access Token starts with: ${accessToken.substring(0, 10)}...`);

    console.log("--- Google Token Processing Complete ---");
    
    return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name },
    };
}