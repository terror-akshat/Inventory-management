# StockFlow - Inventory Stock Management System

StockFlow is a full-stack MERN application for managing inventory, stock movement, suppliers, customers, and business transactions in one place.

It is designed as a beginner-friendly but portfolio-ready project. The app includes authentication, role-based access control, inventory tracking, dashboard analytics, and reporting tools for day-to-day stock management.

## What This Project Does

This project helps a business manage its inventory digitally instead of tracking everything manually.

With this system, users can:

- log in securely with JWT authentication
- manage products and their stock levels
- manage suppliers linked to products
- manage customers and track their purchase activity
- record purchase transactions to increase stock
- record sales transactions to reduce stock
- view low-stock alerts
- monitor business activity from a dashboard
- generate sales, stock, and low-stock reports

In simple words:

"This project is an Inventory Stock Management System where admins and staff can manage products, suppliers, customers, and transactions. Whenever a purchase or sale is recorded, the product quantity is automatically updated. The system also shows low-stock alerts, recent activity, and reports to help monitor inventory."

## Main Flow of the Application

1. A user registers or logs in.
2. The system authenticates the user using JWT.
3. Products, suppliers, and customers are stored in MongoDB.
4. When a sale is recorded, product stock decreases.
5. When a purchase is recorded, product stock increases.
6. Each transaction is saved as a log for tracking stock movement.
7. The dashboard shows summary stats and charts.
8. Reports allow users to review sales, stock, and low-stock data.

## Roles in the Project

The project supports two user roles:

- `admin`
  - full access
  - can manage products, suppliers, customers, and transactions
  - can view reports and user list
- `staff`
  - limited access
  - can view data
  - can create customers and transactions
  - cannot create, edit, or delete products and suppliers

## Features Implemented

### Authentication and Security

- JWT-based authentication
- password hashing with `bcryptjs`
- protected API routes
- role-based authorization
- rate limiting
- `helmet` security headers
- MongoDB query sanitization
- request validation using `express-validator`

### Product Management

- add product
- update product
- soft delete product
- view all products
- search products
- filter by category
- filter low-stock items
- sort and paginate product list
- optional expiry date
- supplier linking

### Stock Management

- real-time stock update through transactions
- low-stock threshold per product
- low-stock report
- transaction-based stock history

### Supplier Management

- add supplier
- update supplier
- delete supplier
- view linked products for a supplier

### Customer Management

- add customer
- update customer
- delete customer
- track total purchases
- track total amount spent
- view recent customer transactions

### Transaction Management

- record `purchase` transactions
- record `sale` transactions
- support multiple items in a single transaction
- automatically calculate totals
- automatically update stock quantity
- save transaction logs with date, items, amount, and creator

### Dashboard

- total products
- total suppliers
- total customers
- monthly revenue
- monthly sales count
- low-stock item count
- stock value
- recent transactions
- top-selling products
- charts using `Recharts`

### Reports

- sales report
- stock report
- low-stock report
- purchase report API
- CSV export from frontend reports page

## Tech Stack

### Frontend

- React 18
- React Router v6
- Axios
- Recharts
- React Hot Toast
- custom CSS UI

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- express-validator

## Project Structure

```text
inventory-management/
|-- backend/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- utils/
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- public/
|   `-- src/
|       |-- components/
|       |-- context/
|       |-- pages/
|       |-- services/
|       |-- App.js
|       `-- index.css
`-- README.md
```

## Backend API Modules

The backend is organized using an MVC-style structure:

- `models/` defines MongoDB schemas
- `controllers/` contains business logic
- `routes/` exposes REST APIs
- `middleware/` handles auth, errors, and pagination

Main API groups:

- `/api/auth`
- `/api/products`
- `/api/suppliers`
- `/api/customers`
- `/api/transactions`
- `/api/dashboard`
- `/api/reports`

## Database Collections

This project uses the following MongoDB collections:

- `users`
- `products`
- `suppliers`
- `customers`
- `transactions`

Relationships:

- a product can belong to one supplier
- a transaction can include multiple products
- a sale transaction can belong to one customer
- a purchase transaction can belong to one supplier
- a transaction stores the user who created it

Indexes are used in models for faster searching and filtering, especially for:

- products
- suppliers
- customers
- transactions

## Important Project Files

- `backend/server.js` starts the Express server and connects MongoDB
- `backend/models/` contains schemas for all main collections
- `backend/controllers/transactionController.js` handles stock-in and stock-out logic
- `backend/middleware/auth.js` protects routes and enforces roles
- `frontend/src/context/AuthContext.js` manages login state in React
- `frontend/src/pages/` contains UI pages for all modules

## How To Run This Project

Your current project directory is:

```powershell
C:\Users\Akshat Agarwal\Downloads\inventory-management\inventory-management
```

### 1. Backend Setup

Open a terminal and run:

```powershell
cd "C:\Users\Akshat Agarwal\Downloads\inventory-management\inventory-management\backend"
copy .env.example .env
cmd /c npm install
```

Then open `backend/.env` and make sure at least these values are correct:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventory_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

If you want to use MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

### 2. Frontend Setup

Open another terminal and run:

```powershell
cd "C:\Users\Akshat Agarwal\Downloads\inventory-management\inventory-management\frontend"
cmd /c npm install
```

### 3. Seed the Database

To insert demo data:

```powershell
cd "C:\Users\Akshat Agarwal\Downloads\inventory-management\inventory-management\backend"
cmd /c npm run seed
```

This creates:

- admin user
- staff user
- sample suppliers
- sample products
- sample customers
- sample transactions

Demo accounts:

- Admin: `admin@inventory.com` / `admin123`
- Staff: `staff@inventory.com` / `staff123`

### 4. Start the App

Run backend:

```powershell
cd "C:\Users\Akshat Agarwal\Downloads\inventory-management\inventory-management\backend"
cmd /c npm run dev
```

Run frontend:

```powershell
cd "C:\Users\Akshat Agarwal\Downloads\inventory-management\inventory-management\frontend"
cmd /c npm start
```

Open in browser:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:5000/api/health`

## How To Use the Project

### Login

- open the login page
- sign in using the seeded admin or staff credentials

### Dashboard

- see total products, customers, suppliers, revenue, and low-stock alerts
- view recent transactions and charts

### Products

- add a new product as admin
- edit quantity, category, supplier, threshold, and pricing
- search and filter products
- check low-stock items

### Suppliers

- add supplier details
- update supplier contact information
- connect suppliers to products

### Customers

- add customer records
- track how much they have spent
- view customer-related transaction history

### Transactions

- create a `sale` to reduce stock
- create a `purchase` to increase stock
- add one or more products in a single transaction
- automatically update inventory totals

### Reports

- view sales report
- view stock report
- view low-stock report
- export visible report data as CSV

## Example Use Case

Suppose a shop buys 20 keyboards from a supplier:

- create a `purchase` transaction
- choose the supplier
- select the keyboard product
- enter quantity `20`
- save the transaction
- product stock increases automatically

If the shop later sells 3 keyboards:

- create a `sale` transaction
- choose the customer
- select the same keyboard product
- enter quantity `3`
- save the transaction
- product stock decreases automatically

This is the main inventory logic of the system.

## Example API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/products` | Get products with pagination/filtering |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/suppliers` | Get suppliers |
| POST | `/api/suppliers` | Create supplier |
| GET | `/api/customers` | Get customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/transactions` | Get transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/dashboard` | Get dashboard stats |
| GET | `/api/reports/sales` | Get sales report |
| GET | `/api/reports/stock` | Get stock report |
| GET | `/api/reports/low-stock` | Get low-stock report |

All routes except login and register require:

```http
Authorization: Bearer <token>
```

## Sample API Request

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@inventory.com",
  "password": "admin123"
}
```

### Create Transaction

```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "sale",
  "customer": "CUSTOMER_ID",
  "items": [
    {
      "product": "PRODUCT_ID",
      "quantity": 2,
      "unitPrice": 299.99
    }
  ],
  "notes": "Sample sale transaction"
}
```

## How To Explain This Project in an Interview or Demo

You can say:

"This is a MERN-based Inventory Stock Management System built for managing products, suppliers, customers, and stock transactions. It supports role-based authentication for admin and staff users. The main business logic is in the transaction module, where purchase transactions increase stock and sales transactions decrease stock automatically. The system also provides a dashboard, low-stock alerts, and reports for monitoring inventory and sales activity."

Short version:

"I built a full-stack inventory management app where businesses can track stock in real time, manage products and suppliers, record purchases and sales, and monitor everything from a dashboard."

## Current Scope Notes

This README reflects the current codebase.

Implemented now:

- CSV export in reports
- dashboard analytics
- role-based access
- transaction-based stock updates

Not fully implemented yet:

- PDF export
- Excel export
- screenshots inside the repository

## Deployment Notes

### Backend

- deploy on Render or Railway
- set environment variables from `backend/.env`
- start command: `node server.js`

### Frontend

- build command: `npm run build`
- deploy on Vercel or Netlify
- if deploying separately, set:

```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

## License

This project is for learning, practice, and portfolio use.