
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function openDb() {
  const dbFile = process.env.DB_FILE || path.join(__dirname, 'db', 'database.sqlite');
  console.log('[DB] using file:', dbFile);
  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });
  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

module.exports = { openDb };


// Accounts

// GET /api/accounts
// Query: ?userId=&page=&size=
// Response: [{ id, user_id, name, type, balance, bank, account_number, is_active, created_at }]

// GET /api/accounts/:id
// Response: { id, user_id, name, type, balance, bank, account_number, is_active, created_at }

// POST /api/accounts
// Body: { user_id, name, type, balance?, bank?, account_number? }
// Response: created account (same fields)

// PUT /api/accounts/:id
// Body: { name?, type?, is_active?, bank?, account_number? }
// Response: updated account

// DELETE /api/accounts/:id
// Response: { success: true } (frontend can remove or mark inactive)

// Transactions

// (Frontend lists, filters, creates, edits, deletes transactions and expects account balances to update.)

// GET /api/transactions
// Query: ?userId=&accountId=&type=&category=&dateFrom=&dateTo=&page=&size=&sort=
// Response: { total, page, size, transactions: [{ id, user_id, account_id, description, amount, category, date, type, created_at }] }

// GET /api/transactions/:id
// Response: { id, user_id, account_id, description, amount, category, date, type, created_at }

// POST /api/transactions
// Body:

// {
//   user_id,
//   account_id?,        // optional
//   description?,
//   amount,             // positive number; frontend uses type to indicate sign
//   category?,
//   date,               // 'YYYY-MM-DD'
//   type                // 'income' or 'expense'
// }


// Response: created transaction plus resulting account balance:

// {
//   id, user_id, account_id, description, amount, category, date, type, created_at,
//   account_balance     // updated balance for account_id (null if no account)
// }


// PUT /api/transactions/:id
// Body: same fields allowed as POST (any subset)
// Response: updated transaction + account_balance (balance after reconciliation)

// DELETE /api/transactions/:id
// Response: { success: true, account_balance } (balance after deletion)

// Implementation note (required by frontend): when a txn references an account_id, the backend must atomically update accounts.balance when creating/updating/deleting the transaction so front-end balance displays stay correct.

// Budgets

// GET /api/budgets?userId=
// Response: [{ id, user_id, category, budgeted, spent, percentage, color, created_at }]

// POST /api/budgets
// Body: { user_id, category, budgeted, color? }
// Response: created budget

// PUT /api/budgets/:id
// Body: { category?, budgeted?, color? }
// Response: updated budget

// DELETE /api/budgets/:id
// Response: { success: true }

// Note: frontend shows spent and percentage. You may compute spent on read (SUM of transactions) or maintain spent on transaction changes — frontend doesn't care which as long as GET returns correct values.

// Subscriptions

// GET /api/subscriptions?userId=
// Response: [{ id, user_id, name, amount, frequency, next_billing, category, is_active, auto_renew, created_at }]

// POST /api/subscriptions
// Body: { user_id, name, amount, frequency, next_billing?, category?, is_active?, auto_renew? }
// Response: created subscription

// PUT /api/subscriptions/:id
// Body: { name?, amount?, frequency?, next_billing?, category?, is_active?, auto_renew? }
// Response: updated subscription

// DELETE /api/subscriptions/:id
// Response: { success: true }

// (Frontend only needs list/create/edit/delete and next_billing displayed — recurring job behavior is backend internal.)

// Investments

// GET /api/investments?userId=
// Response: [{ id, user_id, name, type, amount, current_value, start_date, maturity_date, returns, created_at }]

// POST /api/investments
// Body: { user_id, name, type, amount?, current_value?, start_date?, maturity_date?, returns? }
// Response: created investment

// PUT /api/investments/:id
// Body: fields to update
// Response: updated investment

// DELETE /api/investments/:id
// Response: { success: true }

// Lent money

// GET /api/lentmoney?userId=
// Response: [{ id, user_id, borrower_name, principal, interest_rate, lent_date, due_date, total_amount, status, created_at }]

// POST /api/lentmoney
// Body: { user_id, borrower_name, principal, interest_rate?, lent_date?, due_date?, total_amount?, status? }
// Response: created record

// PUT /api/lentmoney/:id
// Body: fields to update
// Response: updated record

// DELETE /api/lentmoney/:id
// Response: { success: true }

// POST /api/lentmoney/:id/record-payment
// Body: { amount, date, account_id? }
// Response: { success: true, lent_money: <updated record>, created_transaction_id? }
// (Frontend has UI to mark repayments — this endpoint records payment and can optionally create a transaction tied to an account.)

// EMIs

// GET /api/emis?userId=
// Response: [{ id, user_id, name, loan_amount, interest_rate, tenure_months, start_date, emi_amount, remaining_amount, remaining_tenure, next_due_date, created_at }]

// POST /api/emis
// Body: { user_id, name, loan_amount, interest_rate, tenure_months, start_date, emi_amount?, remaining_amount?, remaining_tenure?, next_due_date? }
// Response: created emi

// PUT /api/emis/:id
// Body: fields to update
// Response: updated emi

// DELETE /api/emis/:id
// Response: { success: true }

// EMI Prepayments

// GET /api/emis/:id/prepayments
// Response: [{ id, emi_id, date, amount, created_at }]

// POST /api/emis/:id/prepayments
// Body: { date, amount }
// Response: created prepayment + updated emi (remaining_amount, remaining_tenure)