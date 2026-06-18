const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { sendSuccess, sendError } = require('../utils/response');
const mongoose = require('mongoose');

// GET /reports/monthly?month=6&year=2025
const getMonthlyReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const matchBase = { userId, date: { $gte: from, $lte: to } };

    const groupByDay = {
      _id: { day: { $dayOfMonth: '$date' } },
      total: { $sum: '$amount' },
    };

    const [expenseDays, incomeDays] = await Promise.all([
      Expense.aggregate([{ $match: matchBase }, { $group: groupByDay }, { $sort: { '_id.day': 1 } }]),
      Income.aggregate([{ $match: matchBase }, { $group: groupByDay }, { $sort: { '_id.day': 1 } }]),
    ]);

    const daysInMonth = to.getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const exp = expenseDays.find((d) => d._id.day === day);
      const inc = incomeDays.find((d) => d._id.day === day);
      return { day, income: inc?.total || 0, expenses: exp?.total || 0 };
    });

    const totalIncome = days.reduce((s, d) => s + d.income, 0);
    const totalExpenses = days.reduce((s, d) => s + d.expenses, 0);

    return sendSuccess(res, 200, 'Monthly report retrieved', {
      month,
      year,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      days,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /reports/yearly?year=2025
const getYearlyReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);

    const matchBase = { userId, date: { $gte: from, $lte: to } };

    const groupByMonth = {
      _id: { month: { $month: '$date' } },
      total: { $sum: '$amount' },
    };

    const [expenseMonths, incomeMonths] = await Promise.all([
      Expense.aggregate([{ $match: matchBase }, { $group: groupByMonth }, { $sort: { '_id.month': 1 } }]),
      Income.aggregate([{ $match: matchBase }, { $group: groupByMonth }, { $sort: { '_id.month': 1 } }]),
    ]);

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const exp = expenseMonths.find((m) => m._id.month === month);
      const inc = incomeMonths.find((m) => m._id.month === month);
      return { month, name: MONTH_NAMES[i], income: inc?.total || 0, expenses: exp?.total || 0 };
    });

    const totalIncome = months.reduce((s, m) => s + m.income, 0);
    const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);

    return sendSuccess(res, 200, 'Yearly report retrieved', {
      year,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      months,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /reports/category?type=expense&from=2025-01-01&to=2025-12-31
const getCategoryReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { type = 'expense', from, to } = req.query;

    if (!['income', 'expense'].includes(type)) {
      return sendError(res, 400, 'Type must be income or expense');
    }

    const Model = type === 'expense' ? Expense : Income;
    const match = { userId };

    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }

    const results = await Model.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: '$category.name',
          color: '$category.color',
          icon: '$category.icon',
          total: 1,
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = results.reduce((s, r) => s + r.total, 0);
    const withPercentage = results.map((r) => ({
      ...r,
      percentage: grandTotal > 0 ? parseFloat(((r.total / grandTotal) * 100).toFixed(2)) : 0,
    }));

    return sendSuccess(res, 200, 'Category report retrieved', {
      type,
      grandTotal,
      categories: withPercentage,
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { getMonthlyReport, getYearlyReport, getCategoryReport };
