const express = require('express');
const router = express.Router();
const { createExpense, getExpenses, getExpense, updateExpense, deleteExpense } = require('../controllers/expense.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { expenseSchema, updateExpenseSchema } = require('../utils/validators');

router.use(authenticate);

router.post('/', validate(expenseSchema), createExpense);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.put('/:id', validate(updateExpenseSchema), updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
