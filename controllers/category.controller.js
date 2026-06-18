const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { sendSuccess, sendError } = require('../utils/response');
const mongoose = require('mongoose');

// POST /categories
const createCategory = async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;

    const category = await Category.create({ userId: req.user.id, name, type, color, icon });
    return sendSuccess(res, 201, 'Category created', { category });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, 'Category with this name and type already exists');
    return sendError(res, 500, err.message);
  }
};

// GET /categories
const getCategories = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.type) filter.type = req.query.type;

    const categories = await Category.find(filter).sort({ type: 1, name: 1 });
    return sendSuccess(res, 200, 'Categories retrieved', { categories });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// PUT /categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid category ID');

    const category = await Category.findById(id);
    if (!category) return sendError(res, 404, 'Category not found');
    if (category.userId.toString() !== req.user.id) return sendError(res, 403, 'Access denied');

    // Check duplicate on name/type change
    if (req.body.name || req.body.type) {
      const newName = req.body.name || category.name;
      const newType = req.body.type || category.type;
      const duplicate = await Category.findOne({
        userId: req.user.id,
        name: newName,
        type: newType,
        _id: { $ne: id },
      });
      if (duplicate) return sendError(res, 409, 'A category with that name and type already exists');
    }

    const updated = await Category.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    return sendSuccess(res, 200, 'Category updated', { category: updated });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid category ID');

    const category = await Category.findById(id);
    if (!category) return sendError(res, 404, 'Category not found');
    if (category.userId.toString() !== req.user.id) return sendError(res, 403, 'Access denied');

    // Block deletion if category is in use
    const [expenseCount, incomeCount] = await Promise.all([
      Expense.countDocuments({ categoryId: id }),
      Income.countDocuments({ categoryId: id }),
    ]);
    if (expenseCount + incomeCount > 0) {
      return sendError(res, 409, 'Cannot delete category that is assigned to existing transactions');
    }

    await Category.findByIdAndDelete(id);
    return sendSuccess(res, 200, 'Category deleted');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };