const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const mongoose = require('mongoose');

// POST /expenses
const createExpense = async (req, res) => {
  try {
    const { categoryId } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return sendError(res, 404, 'Category not found');
    if (category.userId.toString() !== req.user.id) return sendError(res, 403, 'Category does not belong to you');
    if (category.type !== 'expense') return sendError(res, 400, 'Category must be of type expense');

    const expense = await Expense.create({ ...req.body, userId: req.user.id });
    const populated = await expense.populate('categoryId', 'name color icon');
    return sendSuccess(res, 201, 'Expense created', { expense: populated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /expenses
const getExpenses = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { userId: req.user.id };

    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('categoryId', 'name color icon')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(filter),
    ]);

    return sendPaginated(res, expenses, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /expenses/:id
const getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid expense ID');

    const expense = await Expense.findById(id).populate('categoryId', 'name color icon');
    if (!expense) return sendError(res, 404, 'Expense not found');
    if (expense.userId.toString() !== req.user.id) return sendError(res, 403, 'Access denied');

    return sendSuccess(res, 200, 'Expense retrieved', { expense });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid expense ID');

    const expense = await Expense.findById(id);
    if (!expense) return sendError(res, 404, 'Expense not found');
    if (expense.userId.toString() !== req.user.id) return sendError(res, 403, 'Access denied');

    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category) return sendError(res, 404, 'Category not found');
      if (category.userId.toString() !== req.user.id) return sendError(res, 403, 'Category does not belong to you');
      if (category.type !== 'expense') return sendError(res, 400, 'Category must be of type expense');
    }

    const updated = await Expense.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('categoryId', 'name color icon');

    return sendSuccess(res, 200, 'Expense updated', { expense: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid expense ID');

    const expense = await Expense.findById(id);
    if (!expense) return sendError(res, 404, 'Expense not found');
    if (expense.userId.toString() !== req.user.id) return sendError(res, 403, 'Access denied');

    await Expense.findByIdAndDelete(id);
    return sendSuccess(res, 200, 'Expense deleted');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { createExpense, getExpenses, getExpense, updateExpense, deleteExpense };