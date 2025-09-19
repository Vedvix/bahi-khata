const Joi = require("joi");
const Transaction = require("../models/transaction.app.model");

// Validation schemas
const createTransactionSchema = Joi.object({
  type: Joi.string().valid("income", "expense", "investment", "lend").required(),
  amount: Joi.number().required(),
  category: Joi.string().required(),
  description: Joi.string().allow("", null),
  date: Joi.string().isoDate().required(),      // "YYYY-MM-DD"
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required() // "HH:mm"
});

const updateTransactionSchema = Joi.object({
  type: Joi.string().valid("income", "expense", "investment", "lend"),
  amount: Joi.number(),
  category: Joi.string(),
  description: Joi.string().allow("", null),
  date: Joi.string().isoDate(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/)
});

// Controller functions
async function createTransaction(req, res) {
  try {
    const { error, value } = createTransactionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const transaction = await Transaction.createTransaction(value);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTransactions(req, res) {
  try {
    const transactions = await Transaction.getTransactions();
    const balanceSummary = await Transaction.getBalanceSummary();
    res.json({ transactions, ...balanceSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTransactionById(req, res) {
  try {
    const transaction = await Transaction.getTransactionById(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateTransaction(req, res) {
  try {
    const { error, value } = updateTransactionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const transaction = await Transaction.updateTransaction(req.params.id, value);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteTransaction(req, res) {
  try {
    await Transaction.deleteTransaction(req.params.id);
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function fetchBalanceSummary(req, res) {
  try {
    const transactions = await getTransactions();
    const summary = await getBalanceSummary();
    res.json({
      transactions,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      balance: summary.balance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getRecentTransactions(req, res) {
  try {
    const recent = await Transaction.getRecentTransactions(5);
    res.json(recent);
  } catch (err) {
    console.error("Error fetching recent transactions:", err);
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  fetchBalanceSummary,
  getRecentTransactions
};
