// controllers/accounts.controller.js
const Joi = require('joi');
const Accounts = require('../models/accounts.model');

const createSchema = Joi.object({
  name: Joi.string().min(1).required(),
  type: Joi.string().allow(null, '').optional(),
  balance: Joi.number().precision(2).optional(),
  bank: Joi.string().allow(null, '').optional(),
  account_number: Joi.string().allow(null, '').optional()
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  type: Joi.string().allow(null, '').optional(),
  balance: Joi.number().precision(2).optional(),
  bank: Joi.string().allow(null, '').optional(),
  account_number: Joi.string().allow(null, '').optional(),
  is_active: Joi.number().valid(0,1).optional()
});

async function getList(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, size = 20 } = req.query;
    const result = await Accounts.getAccountsByUser({ userId, page, size });
    res.json(result);
  } catch (err) {
    console.error('getList accounts error', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
}

async function getOne(req, res) {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const acc = await Accounts.getAccountById(id);
    if (!acc || acc.user_id !== userId) return res.status(404).json({ error: 'Account not found' });
    res.json(acc);
  } catch (err) {
    console.error('getOne account error', err);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
}

async function create(req, res) {
  console.log("Incoming request body:", req.body); 
  try {
    const userId = req.user.id;
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // create
    const acc = await Accounts.createAccount(userId, value);
    res.status(201).json(acc);
  } catch (err) {
    console.error('create account error', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

async function update(req, res) {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updated = await Accounts.updateAccount(id, userId, value);
    if (!updated) return res.status(404).json({ error: 'Account not found or not owned by user' });
    res.json(updated);
  } catch (err) {
    console.error('update account error', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
}

async function remove(req, res) {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    //console.log(userId==id);
    const ok = await Accounts.hardDeleteAccount(id, userId);
    if (!ok) return res.status(404).json({ error: 'Account not found or not owned by user' });
    res.json({ success: true });
  } catch (err) {
    console.error('delete account error', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
}

module.exports = { getList, getOne, create, update, remove };
