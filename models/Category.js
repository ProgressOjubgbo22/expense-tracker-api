const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [30, 'Name cannot exceed 30 characters'],
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense',
    },
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex code'],
  },
  icon: {
    type: String,
    required: [true, 'Icon is required'],
    trim: true,
    maxlength: [50, 'Icon identifier cannot exceed 50 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Each user can only have one category with the same name+type combo
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
