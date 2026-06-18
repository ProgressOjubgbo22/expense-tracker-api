# Expense Tracker API

A full-featured REST API for personal finance tracking built with Express.js, MongoDB, and JWT authentication.

## Stack

- **Express.js** – HTTP server & routing
- **Mongoose** – MongoDB ODM with schema validation
- **JWT** – Access token (15m) + Refresh token (7d) via HTTP-only cookie
- **bcryptjs** – Password hashing (salt rounds: 12)
- **Zod** – Request body validation
- **cookie-parser**, **cors**, **morgan**, **dotenv**, **nodemon**

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# 3. Start in development mode
npm run dev

# 4. Start in production
npm start
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | — |
| `JWT_ACCESS_SECRET` | Secret for access tokens | — |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

---

## API Endpoints

All protected routes require `Authorization: Bearer <accessToken>` header.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login, returns access token + sets refresh cookie |
| POST | `/logout` | No | Clears refresh token |
| POST | `/refresh` | Cookie | Get new access token via refresh token cookie |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | Yes | Get current user profile |
| PUT | `/profile` | Yes | Update name, email, or currency |
| DELETE | `/profile` | Yes | Delete account + all associated data |

### Categories — `/api/categories`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes | Create category |
| GET | `/?type=expense` | Yes | List all categories (optional type filter) |
| PUT | `/:id` | Yes | Update category |
| DELETE | `/:id` | Yes | Delete category (blocked if in use) |

### Expenses — `/api/expenses`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes | Add expense |
| GET | `/` | Yes | List expenses (filterable, paginated) |
| GET | `/:id` | Yes | Get single expense |
| PUT | `/:id` | Yes | Update expense |
| DELETE | `/:id` | Yes | Delete expense |

**GET /expenses query params:**

| Param | Type | Description |
|---|---|---|
| `from` | ISO date | Start of date range |
| `to` | ISO date | End of date range |
| `categoryId` | ObjectId | Filter by category |
| `paymentMethod` | string | cash, debit_card, etc. |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |

### Income — `/api/income`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes | Add income |
| GET | `/` | Yes | List income (filterable, paginated) |
| GET | `/:id` | Yes | Get single income |
| PUT | `/:id` | Yes | Update income |
| DELETE | `/:id` | Yes | Delete income |

**GET /income query params:** same as expenses except `paymentMethod`.

### Dashboard — `/api/dashboard`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/summary` | Yes | Total income, expenses, balance, recent transactions |

**GET /dashboard/summary query params:** `from`, `to` (date range filter)

### Reports — `/api/reports`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/monthly` | Yes | Day-by-day breakdown for a month |
| GET | `/yearly` | Yes | Month-by-month breakdown for a year |
| GET | `/category` | Yes | Spending by category with % breakdown |

**Report query params:**

| Endpoint | Params |
|---|---|
| `/monthly` | `month` (1-12), `year` |
| `/yearly` | `year` |
| `/category` | `type` (income/expense), `from`, `to` |

---

## Response Format

**Success:**
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```

**Error:**
```json
{
  "success": false,
  "message": "...",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## Folder Structure

```
expense-tracker/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── category.controller.js
│   ├── expense.controller.js
│   ├── income.controller.js
│   ├── dashboard.controller.js
│   └── report.controller.js
├── middlewares/
│   ├── auth.middleware.js   # JWT authentication
│   ├── validate.middleware.js # Zod validation
│   └── error.middleware.js  # Global error handler
├── models/
│   ├── User.js
│   ├── Category.js
│   ├── Expense.js
│   ├── Income.js
│   └── RefreshToken.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── category.routes.js
│   ├── expense.routes.js
│   ├── income.routes.js
│   ├── dashboard.routes.js
│   └── report.routes.js
├── utils/
│   ├── jwt.js              # Token generation/verification
│   ├── validators.js       # Zod schemas
│   ├── response.js         # Standardised response helpers
│   └── pagination.js       # Pagination helper
├── app.js                  # Express app
├── server.js               # Entry point
├── .env.example
└── package.json
```

---

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- Refresh tokens stored in HTTP-only cookies (not accessible via JS)
- Refresh tokens persisted in DB — revocable on logout
- Expired refresh tokens auto-deleted by MongoDB TTL index
- All data queries are scoped to `userId` — users can only see their own data
- Ownership checks on every mutating operation
