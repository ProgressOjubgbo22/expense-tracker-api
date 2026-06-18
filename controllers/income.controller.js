const Income = require('../models/Income');
const Category = require('../models/Category');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const mongoose = require('mongoose');

// POST /income
const createIncome = async (req, res) => {
  try {
    const { categoryId } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return sendError(res, 404, 'Category not found');
    if (category.userId.toString() !== req.user.id) return sendError(res, 403, 'Category does not belong to you');
    if (category.type !== 'income') return sendError(res, 400, 'Category must be of type income');

    const income = await Income.create({ ...req.body, userId: req.user.id });
    const populated = await income.populate('categoryId', 'name color icon');
    return sendSuccess(res, 201, 'Income created', { income: populated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /income
const getIncomes = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { userId: req.user.id };

    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;

    const [incomes, total] = await Promise.all([
      Income.find(filter)
        .populate('categoryId', 'name color icon')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Income.countDocuments(filter),
    ]);

    return sendPaginated(res, incomes, total, page, limit);
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /income/:id
const getIncome = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid income ID');

    const income = await Income.findById(id).populate('categoryId', 'name color icon');
    if (!income) return sendError(res, 404, 'Income not found');
    if (income.userId.toString() !== req.user.id) return sendError(res, 403, 'Access denied');

    return sendSuccess(res, 200, 'Income retrieved', { income });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /income/:id
const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid income ID');

    const income = await Income.findById(id);
    if (!income) return sendError(res, 404, 'Income not found');
    if (income.userId.toString() !== req.user.id) return sendError(res, 403, 'Access denied');

    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category) return sendError(res, 404, 'Category not found');
      if (category.userId.toString() !== req.user.id) return sendError(res, 403, 'Category does not belong to you');
      if (category.type !== 'income') return sendError(res, 400, 'Category must be of type income');
    }

    const updated = await Income.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('categoryId', 'name color icon');

    return sendSuccess(res, 200, 'Income updated', { income: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /income/:id
const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid income ID');

    const income = await Income.findById(id);
    if (!income) return sendError(res, 404, 'Income not found');
    if (income.userId.toString() !== req.user.id) return sendError(res, 403, 'Access denied');

    await Income.findByIdAndDelete(id);
    return sendSuccess(res, 200, 'Income deleted');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { createIncome, getIncomes, getIncome, updateIncome, deleteIncome };