const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/summary', getSummary);

module.exports = router;
