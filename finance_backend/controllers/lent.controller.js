// const Joi = require("joi");
// const Lent = require("../models/lent.model");

// const createSchema = Joi.object({
//   borrowerName: Joi.string().required(),
//   principalAmount: Joi.number().required(),
//   interestRate: Joi.number().optional(),
//   lentDate: Joi.string().optional(),
//   dueDate: Joi.string().required(),
//   totalAmount: Joi.number().default(0),
//   status: Joi.string().valid("Active", "Paid", "Overdue").default("Active"),
// });

// const updateSchema = Joi.object({
//   borrowerName: Joi.string(),
//   principalAmount: Joi.number(),
//   interestRate: Joi.number(),
//   lentDate: Joi.string(),
//   dueDate: Joi.string(),
//   totalAmount: Joi.number(),
//   status: Joi.string().valid("Active", "Paid", "Overdue"),
// });

// async function getList(req, res) {
//   try {
//     const result = await Lent.getLentByUser({ userId: req.user.id, ...req.query });
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }

// async function getOne(req, res) {
//   const item = await Lent.getLentById(req.params.id);
//   if (!item || item.userId !== req.user.id) return res.status(404).json({ error: "Not found" });
//   res.json(item);
// }

// async function create(req, res) {
//   const { error, value } = createSchema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   // auto-calc totalAmount if not passed
//   if (value.principalAmount && value.interestRate && value.lentDate && value.dueDate) {
//     const durationYears =
//       (new Date(value.dueDate) - new Date(value.lentDate)) / (365 * 24 * 60 * 60 * 1000);
//     value.totalAmount = value.principalAmount * (1 + (value.interestRate / 100) * durationYears);
//   }

//   const item = await Lent.createLent(req.user.id, value);
//   res.status(201).json(item);
// }

// async function update(req, res) {
//   const { error, value } = updateSchema.validate(req.body);
//   if (error) return res.status(400).json({ error: error.details[0].message });

//   // auto-calc totalAmount if updating interest/principal/dates
//   if (value.principalAmount !== undefined ||
//       value.interestRate !== undefined ||
//       value.lentDate !== undefined ||
//       value.dueDate !== undefined) {
//     const existing = await Lent.getLentById(req.params.id);
//     if (existing) {
//       const principal = value.principalAmount ?? existing.principalAmount;
//       const rate = value.interestRate ?? existing.interestRate;
//       const lentDate = value.lentDate ?? existing.lentDate;
//       const dueDate = value.dueDate ?? existing.dueDate;
//       const durationYears = (new Date(dueDate) - new Date(lentDate)) / (365 * 24 * 60 * 60 * 1000);
//       value.totalAmount = principal * (1 + (rate / 100) * durationYears);
//     }
//   }

//   const item = await Lent.updateLent(req.params.id, req.user.id, value);
//   if (!item) return res.status(404).json({ error: "Not found" });
//   res.json(item);
// }

// async function remove(req, res) {
//   const ok = await Lent.deleteLent(req.params.id, req.user.id);
//   if (!ok) return res.status(404).json({ error: "Not found" });
//   res.json({ success: true });
// }

// module.exports = { getList, getOne, create, update, remove };



//without auth
// controllers/lent.controller.js
const Joi = require("joi");
const Lent = require("../models/lent.model");

// Validation schemas
const createSchema = Joi.object({
  borrowerName: Joi.string().required(),
  principalAmount: Joi.number().required(),
  interestRate: Joi.number().optional(),
  lentDate: Joi.string().optional(),
  dueDate: Joi.string().required(),
  totalAmount: Joi.number().optional(),
  paidAmount: Joi.number().optional(), // new optional field
  status: Joi.string().valid("Active", "Paid", "Overdue").default("Active"),
});

const updateSchema = Joi.object({
  borrowerName: Joi.string(),
  principalAmount: Joi.number(),
  interestRate: Joi.number(),
  lentDate: Joi.string(),
  dueDate: Joi.string(),
  totalAmount: Joi.number(),
  paidAmount: Joi.number().optional(),
  status: Joi.string().valid("Active", "Paid", "Overdue"),
});

// Helper: get userId safely (support no-auth dev mode)
function getUserIdFromReq(req) {
  return (req.user && req.user.id) || req.query.userId || 1;
}

// GET all lent records for a user
async function getList(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    console.log(`getList called for userId=${userId}`);
    const result = await Lent.getLentByUser({ userId, ...req.query });
    res.json(result);
  } catch (err) {
    console.error('getList error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

// GET single lent record by ID
async function getOne(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const item = await Lent.getLentById(req.params.id);
    if (!item || item.userId !== userId) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    console.error('getOne error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

// CREATE new lent record
async function create(req, res) {
  console.log("Incoming request body:", req.body);
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // auto-calc totalAmount if not passed
    if (!value.totalAmount && value.principalAmount && value.interestRate && value.lendDate && value.dueDate) {
      const durationYears = (new Date(value.dueDate) - new Date(value.lendDate)) / (365 * 24 * 60 * 60 * 1000);
      value.totalAmount = value.principalAmount * (1 + (value.interestRate / 100) * durationYears);
    }

    if (value.paidAmount === undefined) value.paidAmount = 0;

    const userId = getUserIdFromReq(req);
    const item = await Lent.createLent(userId, value);
    res.status(201).json(item);
  } catch (err) {
    console.error('create error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function update(req, res) {
  console.log("called");
  console.log("Incoming request body:", req.body);
  try {
    // Validate incoming fields first
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const userId = getUserIdFromReq(req);

    // Fetch existing record and check ownership
    const existing = await Lent.getLentById(req.params.id);
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Not found" });
    }

    // Allowed keys to update (same as model expected)
    const allowed = ["borrowerName", "principalAmount", "interestRate", "lentDate", "dueDate", "totalAmount", "paidAmount", "status"];

    // Build mergedFields by taking existing values and overwriting with validated incoming ones (only allowed keys)
    const mergedFields = {};

    allowed.forEach((k) => {
      if (value[k] !== undefined) {
        mergedFields[k] = value[k];
      } else {
        // keep existing value for keys not provided by client
        // do NOT copy DB metadata like id/userId/createdAt
        mergedFields[k] = existing[k];
      }
    });

    // Coerce numeric fields to numbers (defensive)
    if (mergedFields.principalAmount !== undefined) mergedFields.principalAmount = Number(mergedFields.principalAmount) || 0;
    if (mergedFields.interestRate !== undefined) mergedFields.interestRate = Number(mergedFields.interestRate) || 0;
    if (mergedFields.totalAmount !== undefined) mergedFields.totalAmount = Number(mergedFields.totalAmount) || 0;
    if (mergedFields.paidAmount !== undefined) mergedFields.paidAmount = Number(mergedFields.paidAmount) || 0;

    // If principal/rate/lentDate/dueDate changed (or were missing), (re)compute totalAmount
    // Use merged values so we have a complete picture
    const shouldRecomputeTotal =
      (value.principalAmount !== undefined) ||
      (value.interestRate !== undefined) ||
      (value.lentDate !== undefined) ||
      (value.dueDate !== undefined);

    if (shouldRecomputeTotal) {
      const principal = mergedFields.principalAmount ?? 0;
      const rate = mergedFields.interestRate ?? 0;
      const ld = mergedFields.lentDate ?? existing.lentDate;
      const dd = mergedFields.dueDate ?? existing.dueDate;

      // Only compute if dates are valid
      if (ld && dd) {
        const durationYears = (new Date(dd) - new Date(ld)) / (365 * 24 * 60 * 60 * 1000);
        // protect against NaN
        const dur = Number.isFinite(durationYears) ? durationYears : 0;
        mergedFields.totalAmount = principal * (1 + (rate / 100) * dur);
      } else {
        // fallback: keep whatever totalAmount we already have
        mergedFields.totalAmount = mergedFields.totalAmount ?? principal;
      }
    }

    // Ensure paidAmount is a number (and not undefined)
    if (mergedFields.paidAmount === undefined || mergedFields.paidAmount === null) {
      mergedFields.paidAmount = existing.paidAmount ?? 0;
    }

    // Normalize status to your DB allowed values (incoming might be lowercase or different)
    if (mergedFields.status !== undefined && mergedFields.status !== null) {
      const s = String(mergedFields.status).toLowerCase();
      if (s === 'active') mergedFields.status = 'Active';
      else if (s === 'paid' || s === 'fully_paid' || s === 'fully-paid') mergedFields.status = 'Paid';
      else if (s === 'overdue') mergedFields.status = 'Overdue';
      else if (s === 'partially_paid' || s === 'partially-paid') mergedFields.status = 'Active'; // keep as Active if you prefer
      else mergedFields.status = existing.status ?? 'Active';
    } else {
      mergedFields.status = existing.status ?? 'Active';
    }

    // At this point mergedFields contains a full safe set of fields to update.
    // But Lent.updateLent expects only keys to set that exist in DB; pass only allowed keys
    const toUpdate = {};
    allowed.forEach(k => {
      // only set keys that actually map to DB columns (and are not undefined)
      if (mergedFields[k] !== undefined) toUpdate[k] = mergedFields[k];
    });

    // Call model update (it will run UPDATE ... SET ... WHERE id = ? AND userId = ?)
    const item = await Lent.updateLent(req.params.id, userId, toUpdate);
    if (!item) return res.status(404).json({ error: "Not found" });

    // Return the canonical item (model should return the fresh row)
    res.json(item);
  } catch (err) {
    console.error('update error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
  
// POST /lent/:id/pay
async function pay(req, res) {
  console.log("Incoming", req.body)
  try {
    const userId = getUserIdFromReq(req);
    const { paidAmount, paymentDate } = req.body;

    if (paidAmount === undefined || paidAmount <= 0) {
      return res.status(400).json({ error: "Invalid paidAmount" });
    }

    const updated = await Lent.payLent(req.params.id, userId, { paidAmount, paymentDate });
    if (!updated) return res.status(404).json({ error: "Loan record not found" });

    res.json(updated);
  } catch (err) {
    console.error('pay error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

// DELETE lent record
async function remove(req, res) {
  try {
    const userId = getUserIdFromReq(req);
    const ok = await Lent.deleteLent(req.params.id, userId);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error('remove error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = { getList, getOne, create, update, remove, pay };


