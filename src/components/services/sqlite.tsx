import initSqlJs from 'sql.js';

export let db: any = null;

export async function initDB() {
  const SQL = await initSqlJs({ locateFile: file => `/sql-wasm.wasm` });
  db = new SQL.Database();

  // Run all table creation SQL at once
  db.run(`
    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      type TEXT CHECK(type IN ('income', 'expense', 'investment', 'lend')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense', 'investment', 'lend', 'subscription')) NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES local_users(id)
    );

    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('mutual_fund', 'stocks', 'ppf', 'fd', 'gold', 'crypto', 'bonds')) NOT NULL,
      amount REAL NOT NULL,
      currentValue REAL NOT NULL,
      purchaseDate TEXT NOT NULL,
      maturityDate TEXT,
      interestRate REAL,
      returns REAL,
      status TEXT CHECK(status IN ('active', 'matured', 'sold')) NOT NULL,
      FOREIGN KEY(user_id) REFERENCES local_users(id)
    );

    CREATE TABLE IF NOT EXISTS lend_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      borrowerName TEXT NOT NULL,
      amount REAL NOT NULL,
      lendDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      interestRate REAL NOT NULL,
      purpose TEXT,
      status TEXT CHECK(status IN ('active', 'partially_paid', 'fully_paid', 'overdue')) NOT NULL,
      paidAmount REAL DEFAULT 0,
      remainingAmount REAL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES local_users(id)
    );

      CREATE TABLE IF NOT EXISTS lend_prepayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lend_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY(lend_id) REFERENCES lend_records(id) ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS emis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      name TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      monthlyEMI REAL NOT NULL,
      interestRate REAL NOT NULL,
      tenure INTEGER NOT NULL,
      remainingMonths INTEGER NOT NULL,
      nextDueDate TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES local_users(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT CHECK(frequency IN ('monthly', 'quarterly', 'yearly')) NOT NULL,
      nextDueDate TEXT NOT NULL,
      category TEXT,
      autoPayEnabled INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES local_users(id)
    );
  `);

  console.log("SQLite DB initialized with all tables");
}
