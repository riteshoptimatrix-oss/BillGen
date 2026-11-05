# Bill Generator

A full-stack billing and invoice management application built with **Next.js** (Frontend) and **FastAPI** (Backend) using **MongoDB** as the database.

## Features

- **Dashboard** - Real-time KPIs, financial charts, system alerts, and recent invoices
- **Product Management** - CRUD operations with image upload and stock tracking
- **Labour Management** - Employee records with salary tracking and Aadhar image upload
- **Customer Management** - Customer database with delivery addresses
- **Bill & Invoice** - Generate and manage invoices with status tracking (Paid / Pending / Overdue)
- **Finance** - Expense tracking and net profit calculation
- **Reports** - Financial overview and analytics
- **Authentication** - Login-based access control

## Tech Stack

### Frontend

- [Next.js 16](https://nextjs.org/) - React Framework
- [React 19](https://react.dev/) - UI Library
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts & Graphs

### Backend

- [FastAPI](https://fastapi.tiangolo.com/) - Python Web Framework
- [Motor](https://motor.readthedocs.io/) - Async MongoDB Driver
- [MongoDB](https://www.mongodb.com/) - NoSQL Database
- [Pydantic](https://docs.pydantic.dev/) - Data Validation
- [Uvicorn](https://www.uvicorn.org/) - ASGI Server

## Project Structure

```
Project - Bill Generator/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # Pydantic models (Product, Labour, Invoice, etc.)
│   ├── requirements.txt     # Python dependencies
│   ├── routers/
│   │   ├── products.py      # Product CRUD + Image Upload
│   │   ├── labours.py       # Labour CRUD + Image Upload
│   │   ├── customers.py     # Customer CRUD
│   │   └── dashboard.py     # Dashboard summary API
│   └── uploads/             # Uploaded files storage
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Root redirect to dashboard
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   ├── login/page.tsx           # Login page
│   │   └── (authenticated)/
│   │       ├── layout.tsx           # Authenticated layout
│   │       ├── dashboard/page.tsx   # Dashboard with KPIs & charts
│   │       ├── products/page.tsx    # Product management
│   │       ├── labour/page.tsx      # Labour management
│   │       ├── customers/page.tsx   # Customer management
│   │       ├── bill-invoice/page.tsx # Invoice generation
│   │       ├── finance/page.tsx     # Finance tracking
│   │       ├── reports/page.tsx     # Reports & analytics
│   │       └── settings/page.tsx    # Settings
│   ├── package.json
│   ├── tsconfig.json
│   └── postcss.config.mjs
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv myenv

# Activate virtual environment
# Windows
myenv\Scripts\activate
# macOS/Linux
source myenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
touch .env
```

Add the following to `.env`:

```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=bill_generator_db
```

```bash
# Start the backend server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local
touch .env.local
```

Add the following to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Default Login Credentials

| Field    | Value                          |
| -------- | ------------------------------ |
| Email    | ritesh.work.1510@gmail.com    |
| Password | 8980614160@.com               |

## API Endpoints

### Authentication

| Method | Endpoint            | Description     |
| ------ | ------------------- | --------------- |
| POST   | `/api/auth/login`   | User login      |

### Products

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| GET    | `/api/products/`        | List all products   |
| POST   | `/api/products/`        | Create a product    |
| GET    | `/api/products/{id}`    | Get a product       |
| PUT    | `/api/products/{id}`    | Update a product    |
| DELETE | `/api/products/{id}`    | Delete a product    |
| POST   | `/api/products/upload`  | Upload product image|

### Labours

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| GET    | `/api/labours/`         | List all labours    |
| POST   | `/api/labours/`         | Create a labour     |
| GET    | `/api/labours/{id}`     | Get a labour        |
| PUT    | `/api/labours/{id}`     | Update a labour     |
| DELETE | `/api/labours/{id}`     | Delete a labour     |
| POST   | `/api/labours/upload`   | Upload labour image |

### Customers

| Method | Endpoint                  | Description        |
| ------ | ------------------------- | ------------------ |
| GET    | `/api/customers/`         | List all customers |
| POST   | `/api/customers/`         | Create a customer  |
| GET    | `/api/customers/{id}`     | Get a customer     |
| PUT    | `/api/customers/{id}`     | Update a customer  |
| DELETE | `/api/customers/{id}`     | Delete a customer  |

### Dashboard

| Method | Endpoint                  | Description           |
| ------ | ------------------------- | --------------------- |
| GET    | `/api/dashboard/summary`  | Get dashboard summary |

### Invoices

| Method | Endpoint                    | Description                     |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/api/invoices/`            | List all invoices               |
| POST   | `/api/invoices/`            | Create invoice (auto Sales sync)|
| GET    | `/api/invoices/{id}`        | Get invoice details             |
| PUT    | `/api/invoices/{id}`        | Update invoice                  |
| DELETE | `/api/invoices/{id}`        | Delete invoice                  |
| GET    | `/api/invoices/next-number` | Get next invoice number         |

### Purchases

| Method | Endpoint                 | Description                 |
| ------ | ------------------------ | --------------------------- |
| GET    | `/api/purchases/`        | List all purchase entries   |
| POST   | `/api/purchases/`        | Record new purchase entry   |
| GET    | `/api/purchases/{id}`    | Get purchase entry details  |
| PUT    | `/api/purchases/{id}`    | Update purchase entry       |
| DELETE | `/api/purchases/{id}`    | Delete purchase entry       |
| GET    | `/api/purchases/summary` | Get purchase total summary  |

### Finance

| Method | Endpoint                        | Description                              |
| ------ | ------------------------------- | ---------------------------------------- |
| GET    | `/api/finance/overview`         | Consolidated sales & purchases overview  |
| GET    | `/api/finance/sales`            | Auto-synced sales records from Invoices  |
| PATCH  | `/api/finance/sales/{id}/status`| Update sales invoice payment status      |

## License

This project is for educational and practice purposes.
