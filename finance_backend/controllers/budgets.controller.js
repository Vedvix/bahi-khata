const Joi = require("joi");
const Budgets = require("../models/budgets.model");

// ✅ include color in create
const createSchema = Joi.object({
  category: Joi.string().required(),
  budgeted: Joi.number().required(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional() // hex color
});

// ✅ include color in update
const updateSchema = Joi.object({
  category: Joi.string(),
  budgeted: Joi.number(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
});

async function getList(req, res) {
  try {
    const result = await Budgets.getBudgetsByUser({ userId: req.user.id, ...req.query });
    res.json(result);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
}

async function getOne(req, res) {
  const b = await Budgets.getBudgetById(req.params.id);
  if (!b || b.user_id !== req.user.id) return res.status(404).json({ error: "Not found" });
  res.json(b);
}

async function create(req, res) {
  console.log("Incoming request body:", req.body);
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  
  try {
    const b = await Budgets.createBudget(req.user.id, value);
    res.status(201).json(b);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const b = await Budgets.updateBudget(req.params.id, req.user.id, value);
    if (!b) return res.status(404).json({ error: "Not found" });
    res.json(b);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const ok = await Budgets.deleteBudget(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getList, getOne, create, update, remove };
