const Joi = require("joi");
const Prepayments = require("../models/prepayments.model");

// Validation schema
const createSchema = Joi.object({
  date: Joi.string().required(),
  amount: Joi.number().required()
});

// Get all prepayments for an EMI
async function getList(req, res) {
  const emiId = parseInt(req.params.emiId, 10);
  if (isNaN(emiId)) return res.status(400).json({ error: "Invalid EMI ID" });
  
  const items = await Prepayments.getPrepaymentsByEmi(emiId);
  res.json(items);
}

// Get a single prepayment by ID
async function getOne(req, res) {
  const item = await Prepayments.getPrepaymentById(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}

// Create a new prepayment for an EMI
async function create(req, res) {
  const emiId = parseInt(req.params.emiId, 10);
  if (isNaN(emiId)) return res.status(400).json({ error: "Invalid EMI ID" });

  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const item = await Prepayments.createPrepayment(emiId, value);
  res.status(201).json(item);
}

// Delete a prepayment by ID
async function remove(req, res) {
  const ok = await Prepayments.deletePrepayment(req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
}

module.exports = { getList, getOne, create, remove };
