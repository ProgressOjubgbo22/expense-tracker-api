const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { sendSuccess, sendError } = require('../utils/response');
const mongoose = require('mongoose');

// GET /dashboard/summary
const getSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const dateFilter = {};
    if (req.query.from) dateFilter.$gte = new Date(req.query.from);
    if (req.query.to) dateFilter.$lte = new Date(req.query.to);

    const expenseMatch = { userId };
    const incomeMatch = { userId };
    if (Object.keys(dateFilter).length) {
      expenseMatch.date = dateFilter;
      incomeMatch.date = dateFilter;
    }

    const [incomeAgg, expenseAgg, recentExpenses, recentIncomes] = await Promise.all([
      Income.aggregate([{ $match: incomeMatch }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: expenseMatch }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.find({ userId })
        .populate('categoryId', 'name color icon')
        .sort({ date: -1 })
        .limit(5),
      Income.find({ userId })
        .populate('categoryId', 'name color icon')
        .sort({ date: -1 })
        .limit(5),
    ]);

    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const balance = totalIncome - totalExpenses;

    // Merge and sort recent transactions
    const recent = [
      ...recentExpenses.map((e) => ({ ...e.toObject(), transactionType: 'expense' })),
      ...recentIncomes.map((i) => ({ ...i.toObject(), transactionType: 'income' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    return sendSuccess(res, 200, 'Dashboard summary retrieved', {
      totalIncome,
      totalExpenses,
      balance,
      recentTransactions: recent,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { getSummary };
