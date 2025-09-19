const express = require("express");
const ctrl = require("../controllers/lent.controller");
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // ensure this path matches your project

// All routes need auth
// router.use(auth);


router.get("/", ctrl.getList);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.post("/:id/pay", ctrl.pay);
router.delete("/:id", ctrl.remove);

module.exports = router;
