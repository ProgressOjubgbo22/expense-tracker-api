const User = require('../models/User');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Category = require('../models/Category');
const RefreshToken = require('../models/RefreshToken');
const { sendSuccess, sendError } = require('../utils/response');

// GET /users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'Profile retrieved', { user });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /users/profile
const updateProfile = async (req, res) => {
  try {
    const { email, ...rest } = req.body;

    if (email) {
      const taken = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (taken) return sendError(res, 409, 'Email already in use by another account');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(email ? { email } : {}), ...rest },
      { new: true, runValidators: true }
    );

    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'Profile updated', { user });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /users/profile
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return sendError(res, 404, 'User not found');

    // Delete all user data in parallel
    await Promise.all([
      Expense.deleteMany({ userId }),
      Income.deleteMany({ userId }),
      Category.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
    ]);

    await User.findByIdAndDelete(userId);

    res.clearCookie('refreshToken', { httpOnly: true });
    return sendSuccess(res, 200, 'Account deleted successfully');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { getProfile, updateProfile, deleteAccount };
