// scripts/migrate.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { openDb } = require('../db');

async function migrate() {
  const db = await openDb();

  const schema = fs.readFileSync(path.join(__dirname, './schema.sql'), 'utf8');
  
  console.log(schema)
  try {
    await db.exec(schema);
    console.log('✅ Migration complete');
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    await db.close();
  }
}

migrate();
