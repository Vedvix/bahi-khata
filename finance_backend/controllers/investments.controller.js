
// WITH AUTH
// const Joi = require("joi");
// const Investments = require("../models/investments.model");

// const createSchema = Joi.object({
//   name: Joi.string().required(),
//   type: Joi.string().allow(null, ""),
//   amount: Joi.number().required(),
//   currentValue: Joi.number().default(0),
//   startDate: Joi.string().required(),
//   maturityDate: Joi.string().allow(null, ""),  // maturityDate can be null for stocks
//   returns: Joi.number().default(0)             // include returns since schema has it
// });

// const updateSchema = Joi.object({
//   name: Joi.string(),
//   type: Joi.string().allow(null, ""),
//   amount: Joi.number(),
//   currentValue: Joi.number(),
//   startDate: Joi.string(),
//   maturityDate: Joi.string().allow(null, ""),
//   returns: Joi.number()
// });

// async function getList(req, res) {
//   try {
//     const result = await Investments.getInvestmentsByUser({ userId: req.user.id, ...req.query });
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }

// async function getOne(req, res) {
//   const inv = await Investments.getInvestmentById(req.params.id);
//   if (!inv || inv.userId !== req.user.id) return res.status(404).json({ error: "Not found" });
//   res.json(inv);
// }

// async function create(req, res) {
//   console.log("Incoming request body:", req.body);
//   const { error, value } = createSchema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   // auto-calc returns if not passed
//   if (value.currentValue && value.amount) {
//     value.returns = value.currentValue - value.amount;
//   }

//   const inv = await Investments.createInvestment(req.user.id, value);
//   res.status(201).json(inv);
// }

// async function update(req, res) {
//   const { error, value } = updateSchema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   // auto-calc returns if updating currentValue/amount
//   if (value.currentValue !== undefined || value.amount !== undefined) {
//     const existing = await Investments.getInvestmentById(req.params.id);
//     if (existing) {
//       const amount = value.amount !== undefined ? value.amount : existing.amount;
//       const currentValue = value.currentValue !== undefined ? value.currentValue : existing.currentValue;
//       value.returns = currentValue - amount;
//     }
//   }

//   const inv = await Investments.updateInvestment(req.params.id, req.user.id, value);
//   if (!inv) return res.status(404).json({ error: "Not found" });
//   res.json(inv);
// }

// async function remove(req, res) {
//   const ok = await Investments.deleteInvestment(req.params.id, req.user.id);
//   if (!ok) return res.status(404).json({ error: "Not found" });
//   res.json({ success: true });
// }

// module.exports = { getList, getOne, create, update, remove };




//WITHOUT AUTH
// controllers/investments.controller.js
const Joi = require("joi");
const Investments = require("../models/investments.model");

const createSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().allow(null, ""),
  amount: Joi.number().required(),
  currentValue: Joi.number().default(0),
  startDate: Joi.string().required(),
  maturityDate: Joi.string().allow(null, ""),
  returns: Joi.number().default(0)
});

const updateSchema = Joi.object({
  name: Joi.string(),
  type: Joi.string().allow(null, ""),
  amount: Joi.number(),
  currentValue: Joi.number(),
  startDate: Joi.string(),
  maturityDate: Joi.string().allow(null, ""),
  returns: Joi.number()
});

//Helper for date as sqlite stores date in plain text frontend expects in iso format
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

// Helper: get userId safely (support no-auth dev mode)
function getUserIdFromReq(req) {
  // priority: req.user.id (from auth), query param userId (for testing), fallback to 1 (dev)
  return (req.user && req.user.id) || req.query.userId || 1;
}

async function getList(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const result = await Investments.getInvestmentsByUser({ userId, ...req.query });
    res.json(result);
  } catch (err) {
    console.error('getList error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function getOne(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const inv = await Investments.getInvestmentById(req.params.id);
    if (!inv || inv.userId !== userId) return res.status(404).json({ error: "Not found" });
    res.json(inv);
  } catch (err) {
    console.error('getOne error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function create(req, res) {
  try {
    console.log("Incoming request body:", req.body);
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    if (value.startDate) {
      value.startDate = normalizeDate(value.startDate);
    }
    if (value.maturityDate) {
      value.maturityDate = normalizeDate(value.maturityDate);
    }

    // auto-calc returns if not passed
    if (value.currentValue !== undefined && value.amount !== undefined) {
      value.returns = ((value.currentValue - value.amount) / value.amount) * 100;
    }

    const userId = getUserIdFromReq(req);
    const inv = await Investments.createInvestment(userId, value);
    res.status(201).json(inv);
  } catch (err) {
    console.error('create error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function update(req, res) {
    console.log("Incoming request body:", req.body);
    try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

     if (value.startDate) {
      value.startDate = normalizeDate(value.startDate);
    }
    if (value.maturityDate) {
      value.maturityDate = normalizeDate(value.maturityDate);
    }

    // auto-calc returns if updating currentValue/amount
    if (value.currentValue !== undefined || value.amount !== undefined) {
  const existing = await Investments.getInvestmentById(req.params.id);
      if (existing) {
        const amount = value.amount !== undefined ? value.amount : existing.amount;
        const currentValue = value.currentValue !== undefined ? value.currentValue : existing.currentValue;

        // percentage returns
        value.returns = ((currentValue - amount) / amount) * 100;

        // if you also want till-date returns, add:
        // value.returnsTillDate = calculateAnnualizedReturn(amount, currentValue, existing.startDate);
      }
    }

    const userId = getUserIdFromReq(req);
    const inv = await Investments.updateInvestment(req.params.id, userId, value);
    if (!inv) return res.status(404).json({ error: "Not found" });
    res.json(inv);
  } catch (err) {
    console.error('update error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function remove(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const ok = await Investments.deleteInvestment(req.params.id, userId);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error('remove error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = { getList, getOne, create, update, remove };
