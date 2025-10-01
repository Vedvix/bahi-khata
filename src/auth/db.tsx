// db.ts
import { neon } from "@neondatabase/serverless";

// connection string
const sql = neon("postgresql://neondb_owner:npg_ADE0GYdsS6Ij@ep-gentle-leaf-adgmla02-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

export async function query(text: string, params?: any[]) {
  // with params
  if (params && params.length > 0) {
    return await sql(text, params);
  }
  // no params
  return await sql(text);
}
