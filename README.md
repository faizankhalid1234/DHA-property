# DHA Housing Scheme Management System

Enterprise-level housing scheme management platform with separate **Customer Website**, **Admin Panel**, and **Backend API**.

## Project Structure

```
dha-housing-scheme/
├── backend/     # Node.js + Express + MongoDB API
├── frontend/    # Customer website (React + Vite + Tailwind)
└── admin/       # Admin dashboard (React + Vite + Recharts)
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Redux Toolkit, Framer Motion, Axios |
| Admin | React, Vite, Tailwind CSS, React Query, Recharts |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, Cloudinary |

## Features

- **Super Admin Dashboard** — Analytics, charts, property/customer stats
- **Property Management** — Plots, houses, commercial properties
- **Block Management** — Unlimited blocks with stats
- **Customer Management** — CRUD, property assignment, verification
- **Property Verification** — Instant CNIC + property number lookup
- **Ownership History** — Permanent timeline (never deleted)
- **Property Transfers** — Full transfer records
- **Case Management** — Legal disputes and resolution
- **Document Management** — Upload/view registry, NOC, certificates
- **Notifications** — In-app + email support
- **Reports** — Export PDF & Excel
- **QR Code Verification** — Per-property QR codes
- **Role-Based Access** — Super Admin, Admin, Customer

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run seed    # Seed database with sample data
npm run dev     # Starts on http://localhost:5000
```

### 2. Customer Frontend

```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:5173
```

### 3. Admin Panel

```bash
cd admin
npm install
npm run dev     # Starts on http://localhost:5174
```

## Default Login Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@dha.com | Admin@123 |
| Admin | dhaadmin@dha.com | Admin@123 |
| Customer | ahmed@example.com | Customer@123 |
| Customer | fatima@example.com | Customer@123 |

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dha-housing
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/customer-register | Customer registration |
| GET | /api/properties | List properties |
| POST | /api/properties/verify | Verify ownership |
| GET | /api/dashboard/stats | Admin dashboard stats |
| GET | /api/reports/properties | Export property report |

## Property Status System

| Status | Meaning |
|--------|---------|
| 🟢 ACTIVE | Valid ownership |
| 🟡 PENDING | Verification pending |
| 🔴 INACTIVE | Sold/transferred/cancelled |
| ⚖️ CASE | Legal dispute |

## Design Theme

- **Colors:** Royal Blue, Navy, Gold, White
- **Style:** Luxury real estate, glassmorphism, premium cards
- **Animations:** Framer Motion (frontend)

## License

Proprietary — DHA Housing Scheme Management System
