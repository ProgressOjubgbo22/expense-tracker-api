const express = require('express');
const router = express.Router();
const { createIncome, getIncomes, getIncome, updateIncome, deleteIncome } = require('../controllers/income.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { incomeSchema, updateIncomeSchema } = require('../utils/validators');

router.use(authenticate);

router.post('/', validate(incomeSchema), createIncome);
router.get('/', getIncomes);
router.get('/:id', getIncome);
router.put('/:id', validate(updateIncomeSchema), updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
