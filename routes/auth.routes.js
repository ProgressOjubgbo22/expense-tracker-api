const express = require('express');
const router = express.Router();
const { register, login, logout, refreshAccessToken } = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../utils/validators');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refreshAccessToken);

module.exports = router;
