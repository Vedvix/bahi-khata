// const Joi = require("joi");
// const Subs = require("../models/subscriptions.model");

// // Validation schemas (camelCase)
// const createSchema = Joi.object({
//   name: Joi.string().required(),
//   amount: Joi.number().required(),
//   frequency: Joi.string().valid("monthly","quarterly","yearly").required(),
//   nextBilling: Joi.string().required(), // YYYY-MM-DD
//   category: Joi.string().allow(null, ""),
//   isActive: Joi.boolean().default(true),
//   autoRenew: Joi.boolean().default(true),
// });

// const updateSchema = Joi.object({
//   name: Joi.string(),
//   amount: Joi.number(),
//   frequency: Joi.string().valid("monthly","quarterly","yearly"),
//   nextBilling: Joi.string(),
//   category: Joi.string().allow(null,""),
//   isActive: Joi.boolean(),
//   autoRenew: Joi.boolean(),
// });

// // List subscriptions
// async function getList(req, res) {
//   try {
//     const result = await Subs.getSubscriptionsByUser({ userId: req.user.id, ...req.query });
//     res.json(result);
//   } catch (err) { 
//     res.status(500).json({ error: err.message }); 
//   }
// }

// // Get one subscription
// async function getOne(req, res) {
//   const s = await Subs.getSubscriptionById(req.params.id);
//   if (!s || s.user_id !== req.user.id) return res.status(404).json({ error: "Not found" });
//   res.json(s);
// }

// // Create subscription
// async function create(req, res) {
//   console.log("Incoming request body:", req.body);
//   const { error, value } = createSchema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });
//   const s = await Subs.createSubscription(req.user.id, value);
//   res.status(201).json(s);
// }

// // Update subscription
// async function update(req, res) {
//   const { error, value } = updateSchema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });
//   const s = await Subs.updateSubscription(req.params.id, req.user.id, value);
//   if (!s) return res.status(404).json({ error: "Not found" });
//   res.json(s);
// }

// // Delete subscription
// async function remove(req, res) {
//   const ok = await Subs.deleteSubscription(req.params.id, req.user.id);
//   if (!ok) return res.status(404).json({ error: "Not found" });
//   res.json({ success: true });
// }

// module.exports = { getList, getOne, create, update, remove };



//without auth
const Joi = require("joi");
const Subs = require("../models/subscriptions.model");

// Validation schemas (camelCase)
// frequency will be coerced to lowercase for consistency with DB/enum
const createSchema = Joi.object({
  name: Joi.string().required(),
  amount: Joi.number().required(),
  frequency: Joi.string().lowercase().valid("monthly","quarterly","yearly").required(),
  nextBilling: Joi.string().allow(null, "").optional(), // allow null/empty
  category: Joi.string().allow(null, "").optional(),
  isActive: Joi.boolean().default(true),
  autoRenew: Joi.boolean().default(true),
});

const updateSchema = Joi.object({
  name: Joi.string(),
  amount: Joi.number(),
  frequency: Joi.string().lowercase().valid("monthly","quarterly","yearly"),
  nextBilling: Joi.string().allow(null, "").optional(),
  category: Joi.string().allow(null, "").optional(),
  isActive: Joi.boolean(),
  autoRenew: Joi.boolean(),
});

// Helper: get userId safely (support no-auth dev mode)
function getUserIdFromReq(req) {
  return (req.user && req.user.id) || req.query.userId || 1;
}

// GET list of subscriptions for a user (with pagination query passthrough)
async function getList(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    console.log(`getList called for userId=${userId}`);
    const result = await Subs.getSubscriptionsByUser({ userId, ...req.query });
    res.json(result);
  } catch (err) {
    console.error('getList error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

// GET single subscription by id
async function getOne(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const s = await Subs.getSubscriptionById(req.params.id);
    // support either naming convention from model (user_id or userId)
    const ownerId = s ? (s.user_id ?? s.userId) : null;
    if (!s || ownerId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(s);
  } catch (err) {
    console.error('getOne error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

// CREATE subscription
async function create(req, res) {
  console.log("Incoming request body:", req.body);
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // ensure booleans exist (Joi default covers this, but be explicit)
    if (value.isActive === undefined) value.isActive = true;
    if (value.autoRenew === undefined) value.autoRenew = true;

    const userId = getUserIdFromReq(req);
    const s = await Subs.createSubscription(userId, value);
    res.status(201).json(s);
  } catch (err) {
    console.error('create error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

// UPDATE subscription
async function update(req, res) {
  console.log("Incoming request body for update:", req.body);
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // If frequency was sent with different casing, Joi.lowercase() already handled it.
    // Call update on model
    const userId = getUserIdFromReq(req);
    const s = await Subs.updateSubscription(req.params.id, userId, value);
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json(s);
  } catch (err) {
    console.error('update error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

// DELETE subscription
async function remove(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const ok = await Subs.deleteSubscription(req.params.id, userId);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error('remove error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = { getList, getOne, create, update, remove };
