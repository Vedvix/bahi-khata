const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactions.app.controller');

router.get('/', controller.getTransactions);
router.get('/summary', controller.fetchBalanceSummary);
router.get("/recent", controller.getRecentTransactions);
router.get('/:id', controller.getTransactionById);
router.post('/', controller.createTransaction);
router.put('/:id', controller.updateTransaction);
router.delete('/:id', controller.deleteTransaction);


module.exports = router;
