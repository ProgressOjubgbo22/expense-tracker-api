const express = require('express');
const router = express.Router();
const { getMonthlyReport, getYearlyReport, getCategoryReport } = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);
router.get('/category', getCategoryReport);

module.exports = router;
