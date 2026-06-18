const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    source: {
      type: String,
      required: [true, 'Income source is required'],
      trim: true,
      minlength: [2, 'Source must be at least 2 characters'],
      maxlength: [50, 'Source cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [255, 'Description cannot exceed 255 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
  },
  { timestamps: true }
);

incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ userId: 1, categoryId: 1 });

module.exports = mongoose.model('Income', incomeSchema);
