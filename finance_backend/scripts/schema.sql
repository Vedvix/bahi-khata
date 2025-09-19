-- =====================
-- Users
-- =====================

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,          -- store hashed passwords in production
  role        TEXT DEFAULT 'customer',
  created_at  TEXT DEFAULT (datetime('now')),
  last_active TEXT
);

-- =====================
-- Accounts (belongs to user)
-- =====================
CREATE TABLE IF NOT EXISTS accounts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL,       -- Checking, Savings, Credit Card, Investment
  balance        REAL DEFAULT 0,
  bank           TEXT,
  account_number TEXT,
  is_active      INTEGER DEFAULT 1,   -- 0/1
  created_at     TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- =====================
-- Transactions (belongs to user & account/budget)
-- =====================
-- CREATE TABLE IF NOT EXISTS transactions (
--   id            INTEGER PRIMARY KEY AUTOINCREMENT,
--   user_id       INTEGER NOT NULL,
--   account_id    INTEGER,
--   account       TEXT,                        -- ✅ store account name directly
--   budget_id     INTEGER,
--   description   TEXT,
--   amount        REAL NOT NULL,
--   category      TEXT NOT NULL,
--   date          TEXT NOT NULL,
--   type          TEXT NOT NULL CHECK (type IN ('Income','Expense')),
--   created_at    TEXT DEFAULT (datetime('now')),
--   FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
--   FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL,
--   FOREIGN KEY(budget_id) REFERENCES budgets(id) ON DELETE SET NULL
-- );


CREATE TABLE IF NOT EXISTS transaction_app (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL
);




-- =====================
-- Budgets (per user, per category)
-- =====================
-- 2. Create new budgets table without "period"
CREATE TABLE IF NOT EXISTS budgets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  category    TEXT NOT NULL,
  budgeted    REAL DEFAULT 0,
  spent       REAL DEFAULT 0,
  percentage  INTEGER DEFAULT 0,
  color       TEXT DEFAULT '#3B82F6',
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);


-- =====================
-- Subscriptions
-- =====================


CREATE TABLE subscriptions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  name         TEXT NOT NULL,
  amount       REAL NOT NULL,
  frequency    TEXT NOT NULL CHECK (frequency IN ('monthly','quarterly','yearly')),
  nextBilling  TEXT NOT NULL,
  category     TEXT NOT NULL,
  isActive     BOOLEAN NOT NULL DEFAULT 1,
  autoRenew    BOOLEAN NOT NULL DEFAULT 1,
  created_at   TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);

-- =====================
-- Investments
-- =====================
CREATE TABLE IF NOT EXISTS investments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  userId       INTEGER NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT,              -- Mutual Fund, LIC, Stocks, etc.
  amount       REAL DEFAULT 0,
  currentValue REAL DEFAULT 0,
  startDate    TEXT,
  maturityDate TEXT,
  returns      REAL DEFAULT 0,    -- percentage or computed field
  createdAt    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invest_user ON investments(userId);

-- =====================
-- Lent money
-- =====================
CREATE TABLE IF NOT EXISTS lent_money (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  userId         INTEGER NOT NULL,
  borrowerName   TEXT NOT NULL,
  principalAmount REAL NOT NULL,
  interestRate   REAL,
  lentDate       TEXT,
  dueDate        TEXT NOT NULL,
  totalAmount    REAL DEFAULT 0,
  paidAmount     REAL,
  remainingAmount     REAL,
  status         TEXT NOT NULL CHECK (status IN ('Active','Paid','Overdue') ) DEFAULT 'Active',
  createdAt      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lent_user ON lent_money(userId);

-- =====================
-- EMIs
-- =====================
CREATE TABLE IF NOT EXISTS emis (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  name           TEXT NOT NULL,
  principal      REAL NOT NULL,
  interest_rate  REAL NOT NULL,
  tenure_months  INTEGER NOT NULL,
  start_date     TEXT NOT NULL,
  paid_months    INTEGER DEFAULT 0,
  prepayment     REAL DEFAULT 0,
  status         TEXT NOT NULL CHECK (status IN ('Active','Completed')) DEFAULT 'Active',
  created_at     TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_emis_user ON emis(user_id);

-- =====================
-- EMI Prepayments
-- =====================
CREATE TABLE IF NOT EXISTS emi_prepayments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  emi_id     INTEGER NOT NULL,
  date       TEXT NOT NULL,
  amount     REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(emi_id) REFERENCES emis(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_prepayments_emi ON emi_prepayments(emi_id);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lentId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  amount REAL NOT NULL,
  paymentDate TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(lentId) REFERENCES lent_money(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_lent ON payments(lentId);

