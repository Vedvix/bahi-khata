// const Joi = require("joi");
// const Transactions = require("../models/transactions.model");
// const { openDb } = require("../db");

// // ================== VALIDATION SCHEMAS ==================
// const createSchema = Joi.object({
//   account_id: Joi.number().optional().allow(null),
//   account: Joi.string().optional(),
//   description: Joi.string().allow(null, "").optional(),
//   amount: Joi.number().required(),
//   category: Joi.string().allow(null, "").optional(),
//   date: Joi.string().required(), // 'YYYY-MM-DD'
//   type: Joi.string().valid("income", "expense").required(),
// });

// const updateSchema = Joi.object({
//   account_id: Joi.number().optional().allow(null),
//   account: Joi.string().optional(),
//   description: Joi.string().allow(null, "").optional(),
//   amount: Joi.number().optional(),
//   category: Joi.string().allow(null, "").optional(),
//   date: Joi.string().optional(),
//   type: Joi.string().valid("income", "expense").optional(),
// });

// // ================== HELPERS ==================
// async function resolveAccountId(userId, accountName) {
//   if (!accountName) return null;
//   const db = await openDb();
//   const row = await db.get(
//     `SELECT id, name FROM accounts WHERE user_id = ? AND name = ? LIMIT 1`,
//     [userId, accountName]
//   );
//   await db.close();
//   if (!row) throw new Error(`Account "${accountName}" not found`);
//   return row.id;
// }

// async function attachAccountName(txn) {
//   if (!txn || !txn.account_id) return txn;
//   const db = await openDb();
//   const row = await db.get(`SELECT name FROM accounts WHERE id = ?`, [txn.account_id]);
//   await db.close();
//   return { ...txn, account: row ? row.name : null };
// }

// function normalizeType(type) {
//   if (!type) return null;
//   return type.toLowerCase() === "expense" ? "Expense" : "Income";
// }

// // ================== CONTROLLERS ==================
// async function getList(req, res) {
//   try {
//     const userId = req.user.id;
//     const { page = 1, size = 20, accountId, type, category, dateFrom, dateTo } = req.query;

//     const result = await Transactions.getTransactionsByUser({
//       userId,
//       filters: { account_id: accountId, type: normalizeType(type), category, dateFrom, dateTo },
//       page,
//       size,
//     });

//     // Attach account names for frontend
//     const withAccounts = await Promise.all(result.transactions.map(attachAccountName));
//     res.json({ ...result, transactions: withAccounts });
//   } catch (err) {
//     console.error("getList transactions error", err);
//     res.status(500).json({ error: "Failed to fetch transactions" });
//   }
// }

// async function getOne(req, res) {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const txn = await Transactions.getTransactionById(id);
//     if (!txn || txn.user_id !== req.user.id) {
//       return res.status(404).json({ error: "Transaction not found" });
//     }
//     res.json(await attachAccountName(txn));
//   } catch (err) {
//     console.error("getOne transaction error", err);
//     res.status(500).json({ error: "Failed to fetch transaction" });
//   }
// }

// async function create(req, res) {
//   console.log("Incoming request body:",req.body);
//   try {
//     const userId = req.user.id;
//     const { error, value } = createSchema.validate(req.body);
//     if (error) return res.status(400).json({ error: error.details[0].message });

//     // Resolve account
//     if (req.body.account) {
//       try {
//         value.account_id = await resolveAccountId(userId, req.body.account);
//       } catch (err) {
//         return res.status(400).json({ error: err.message });
//       }
//     }

//     // Normalize type
//     value.type = normalizeType(value.type);

//     const txn = await Transactions.createTransaction(userId, value);
//     res.status(201).json(await attachAccountName(txn));
//   } catch (err) {
//     console.error("create transaction error", err);
//     res.status(500).json({ error: "Failed to create transaction" });
//   }
// }

// async function update(req, res) {
//   try {
//     const userId = req.user.id;
//     const id = parseInt(req.params.id, 10);
//     const { error, value } = updateSchema.validate(req.body);
//     if (error) return res.status(400).json({ error: error.details[0].message });

//     // Resolve account
//     if (req.body.account) {
//       try {
//         value.account_id = await resolveAccountId(userId, req.body.account);
//       } catch (err) {
//         return res.status(400).json({ error: err.message });
//       }
//     }

//     // Normalize type
//     if (value.type) value.type = normalizeType(value.type);

//     const txn = await Transactions.updateTransaction(id, userId, value);
//     if (!txn) return res.status(404).json({ error: "Transaction not found or not owned by user" });

//     res.json(await attachAccountName(txn));
//   } catch (err) {
//     console.error("update transaction error", err);
//     res.status(500).json({ error: "Failed to update transaction" });
//   }
// }

// async function remove(req, res) {
//   try {
//     const userId = req.user.id;
//     const id = parseInt(req.params.id, 10);
//     const ok = await Transactions.deleteTransaction(id, userId);
//     if (!ok) return res.status(404).json({ error: "Transaction not found or not owned by user" });
//     res.json({ success: true });
//   } catch (err) {
//     console.error("delete transaction error", err);
//     res.status(500).json({ error: "Failed to delete transaction" });
//   }
// }

// module.exports = { getList, getOne, create, update, remove };



// controllers/transactions.controller.js
const Joi = require("joi");
const Transactions = require("../models/transactions.model");
const { openDb } = require("../db");

// ================== VALIDATION SCHEMAS ==================
const createSchema = Joi.object({
  account_id: Joi.number().optional().allow(null),
  account: Joi.string().optional(),
  description: Joi.string().allow(null, "").optional(),
  amount: Joi.number().required(),
  category: Joi.string().allow(null, "").optional(),
  date: Joi.string().required(), // 'YYYY-MM-DD'
  type: Joi.string().valid("income", "expense").required(),
});

const updateSchema = Joi.object({
  account_id: Joi.number().optional().allow(null),
  account: Joi.string().optional(),
  description: Joi.string().allow(null, "").optional(),
  amount: Joi.number().optional(),
  category: Joi.string().allow(null, "").optional(),
  date: Joi.string().optional(),
  type: Joi.string().valid("income", "expense").optional(),
});

// Helper: get userId safely (support no-auth dev mode)
function getUserIdFromReq(req) {
  return (req.user && req.user.id) || req.query.userId || 1;
}

// ================== HELPERS ==================
async function resolveAccountId(userId, accountName) {
  if (!accountName) return null;
  const db = await openDb();
  const row = await db.get(
    `SELECT id, name FROM accounts WHERE user_id = ? AND name = ? LIMIT 1`,
    [userId, accountName]
  );
  await db.close();
  if (!row) throw new Error(`Account "${accountName}" not found`);
  return row.id;
}

async function attachAccountName(txn) {
  if (!txn || !txn.account_id) return txn;
  const db = await openDb();
  const row = await db.get(`SELECT name FROM accounts WHERE id = ?`, [txn.account_id]);
  await db.close();
  return { ...txn, account: row ? row.name : null };
}

function normalizeType(type) {
  if (!type) return null;
  return type.toString().toLowerCase() === "expense" ? "Expense" : "Income";
}

// ================== CONTROLLERS ==================
async function getList(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const {
      page = 1,
      size = 20,
      accountId,
      type,
      category,
      dateFrom,
      dateTo,
    } = req.query;

    const result = await Transactions.getTransactionsByUser({
      userId,
      filters: {
        account_id: accountId,
        type: normalizeType(type),
        category,
        dateFrom,
        dateTo,
      },
      page,
      size,
    });

    // Attach account names for frontend
    const withAccounts = await Promise.all(result.transactions.map(attachAccountName));
    res.json({ ...result, transactions: withAccounts });
  } catch (err) {
    console.error("getList transactions error", err);
    res.status(500).json({ error: err.message || "Failed to fetch transactions" });
  }
}

async function getOne(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const id = parseInt(req.params.id, 10);
    const txn = await Transactions.getTransactionById(id);
    if (!txn || txn.user_id !== Number(userId)) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(await attachAccountName(txn));
  } catch (err) {
    console.error("getOne transaction error", err);
    res.status(500).json({ error: err.message || "Failed to fetch transaction" });
  }
}

async function create(req, res) {
  console.log("Incoming request body:", req.body);
  try {
    const userId = getUserIdFromReq(req);
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Resolve account name to id if account provided
    if (req.body.account) {
      try {
        value.account_id = await resolveAccountId(userId, req.body.account);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // Normalize type to server format
    value.type = normalizeType(value.type);

    const txn = await Transactions.createTransaction(userId, value);
    res.status(201).json(await attachAccountName(txn));
  } catch (err) {
    console.error("create transaction error", err);
    res.status(500).json({ error: err.message || "Failed to create transaction" });
  }
}

async function update(req, res) {
  console.log("Incoming request body (update):", req.body);
  try {
    const userId = getUserIdFromReq(req);
    const id = parseInt(req.params.id, 10);
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Resolve account name -> id when account provided
    if (req.body.account) {
      try {
        value.account_id = await resolveAccountId(userId, req.body.account);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // Normalize type if provided
    if (value.type) value.type = normalizeType(value.type);

    const txn = await Transactions.updateTransaction(id, userId, value);
    if (!txn) return res.status(404).json({ error: "Transaction not found or not owned by user" });

    res.json(await attachAccountName(txn));
  } catch (err) {
    console.error("update transaction error", err);
    res.status(500).json({ error: err.message || "Failed to update transaction" });
  }
}

async function remove(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const id = parseInt(req.params.id, 10);
    const ok = await Transactions.deleteTransaction(id, userId);
    if (!ok) return res.status(404).json({ error: "Transaction not found or not owned by user" });
    res.json({ success: true });
  } catch (err) {
    console.error("delete transaction error", err);
    res.status(500).json({ error: err.message || "Failed to delete transaction" });
  }
}

module.exports = { getList, getOne, create, update, remove };
