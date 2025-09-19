const express = require("express");
const ctrl = require("../controllers/prepayments.controller");
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/authMiddleware'); // ensure this path matches your project

// All routes need auth
// router.use(auth);


router.get("/", ctrl.getList);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.delete("/:id", ctrl.remove);

module.exports = router;
