const { z } = require('zod');

// ── Auth ──────────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100)
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens and apostrophes'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'JPY']).optional().default('NGN'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ── User ──────────────────────────────────────────────────────────────────────
const updateProfileSchema = z
  .object({
    fullname: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[a-zA-Z\s'-]+$/)
      .optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    currency: z.enum(['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'JPY']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

// ── Category ──────────────────────────────────────────────────────────────────
const categorySchema = z.object({
  name: z.string().trim().min(2).max(30),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'),
  icon: z.string().trim().max(50),
});

const updateCategorySchema = categorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

// ── Expense ───────────────────────────────────────────────────────────────────
const expenseSchema = z.object({
  categoryId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid category ID'),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).min(0.01),
  description: z.string().trim().max(255).optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'debit_card', 'credit_card', 'mobile_money', 'other']),
  date: z.coerce.date().optional(),
  receiptUrl: z.string().trim().url('Must be a valid URL').optional(),
  isRecurring: z.boolean().optional().default(false),
});

const updateExpenseSchema = expenseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

// ── Income ────────────────────────────────────────────────────────────────────
const incomeSchema = z.object({
  categoryId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid category ID'),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).min(0.01),
  source: z.string().trim().min(2).max(50),
  description: z.string().trim().max(255).optional(),
  isRecurring: z.boolean().optional().default(false),
  date: z.coerce.date().optional(),
});

const updateIncomeSchema = incomeSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  categorySchema,
  updateCategorySchema,
  expenseSchema,
  updateExpenseSchema,
  incomeSchema,
  updateIncomeSchema,
};
