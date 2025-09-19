const Joi = require("joi");
const Emis = require("../models/emi.model");

// Joi validation schema for creating EMI
const createSchema = Joi.object({
  name: Joi.string().required(),
  principal: Joi.number().required(),
  interest_rate: Joi.number().required(),
  tenure_months: Joi.number().required(),
  start_date: Joi.string().required(),
  paid_months: Joi.number().optional(),
  prepayment: Joi.number().optional(),
  status: Joi.string().valid("Active", "Completed").optional()
});

// Joi validation schema for updating EMI
const updateSchema = Joi.object({
  name: Joi.string(),
  principal: Joi.number(),
  interest_rate: Joi.number(),
  tenure_months: Joi.number(),
  start_date: Joi.string(),
  paid_months: Joi.number(),
  prepayment: Joi.number(),
  status: Joi.string().valid("Active", "Completed")
});

// Get list of EMIs for a user
async function getList(req, res) {
  const result = await Emis.getEmisByUser({ userId: req.user.id, ...req.query });
  res.json(result);
}

// Get single EMI by ID
async function getOne(req, res) {
  const item = await Emis.getEmiById(req.params.id);
  if (!item || item.user_id !== req.user.id) return res.status(404).json({ error: "Not found" });
  res.json(item);
}

// Create new EMI
async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const item = await Emis.createEmi(req.user.id, value);
  res.status(201).json(item);
}

// Update existing EMI
async function update(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const item = await Emis.updateEmi(req.params.id, req.user.id, value);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}

// Delete EMI
async function remove(req, res) {
  const ok = await Emis.deleteEmi(req.params.id, req.user.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
}

module.exports = { getList, getOne, create, update, remove };
