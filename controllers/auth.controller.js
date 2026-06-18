const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /auth/register
const register = async (req, res) => {
  try {
    const { fullname, email, password, currency } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 409, 'Email already in use');

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({ fullname, email, password_hash, currency });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return sendSuccess(res, 201, 'Account created successfully', {
      accessToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password_hash');
    if (!user) return sendError(res, 401, 'Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return sendError(res, 401, 'Invalid email or password');

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return sendSuccess(res, 200, 'Login successful', {
      accessToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /auth/logout
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await RefreshToken.deleteOne({ token });
    }
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// POST /auth/refresh
const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return sendError(res, 401, 'Refresh token missing');

    const stored = await RefreshToken.findOne({ token });
    if (!stored) return sendError(res, 401, 'Invalid refresh token');

    const decoded = verifyRefreshToken(token);
    const accessToken = generateAccessToken(decoded.id);

    return sendSuccess(res, 200, 'Token refreshed', { accessToken });
  } catch (err) {
    return sendError(res, 401, 'Invalid or expired refresh token');
  }
};

module.exports = { register, login, logout, refreshAccessToken };
