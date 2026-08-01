# 🍽️ Restaurant Management System

A modern, enterprise-grade **MERN** platform for restaurant operations — website,
online ordering, reservations, and multi-role dashboards (Admin, Kitchen, Cashier/POS,
Delivery, Customer). Built with production practices: JWT auth with refresh tokens,
role-based access control, real-time updates via Socket.io, Stripe payments,
Cloudinary media, and a polished React UI with dark/light mode.

> **Stack:** React + Vite · Redux Toolkit · React Query · Node.js · Express ·
> MongoDB · Mongoose · Socket.io · Stripe · Cloudinary · JWT · Docker

---

## ✨ Features

### Platform
- Restaurant marketing website (menu, offers, reservations)
- Online ordering (delivery / pickup / dine-in) with cart & checkout
- Real-time order pipeline (Socket.io) shared across Kitchen / Cashier / Delivery
- Multi-role dashboards: **Admin**, **Kitchen**, **Cashier (POS)**, **Delivery**, **Customer**

### Authentication & Security
- Register / Login / Logout, email verification, forgot & reset password
- JWT **access + refresh** tokens, refresh-token rotation, secure httpOnly cookies
- Role-Based Access Control (`customer`, `staff`, `kitchen`, `cashier`, `delivery`, `admin`)
- 2FA-ready user schema, Helmet, CORS, rate limiting, mongo-sanitize, XSS protection

### Commerce
- Menu, categories, popular meals, offers, coupons & discounts
- Reviews & ratings, favorites/wishlist, cart, checkout, order tracking
- Stripe payments (PaymentIntents) + webhook, invoices, payment history
- Reservations & table booking

### Ops & Quality
- Centralized error handling, request validation (express-validator)
- Structured logging (morgan + custom), compression, pagination & filtering
- Docker + docker-compose, GitHub Actions CI (lint · test · build)
- Seed script with royalty-free food imagery

---

## 🗂️ Monorepo Layout

```
restaurant-management-system/
├── server/            # Express + MongoDB API
│   └── src/
│       ├── config/         # env, db, cloudinary, redis
│       ├── models/         # Mongoose schemas
│       ├── controllers/    # request handlers
│       ├── routes/         # Express routers
│       ├── middleware/     # auth, rbac, error, validate, security
│       ├── services/       # email, payment, token services
│       ├── sockets/        # Socket.io gateway
│       ├── validators/     # express-validator rule sets
│       └── utils/          # AppError, catchAsync, ApiFeatures, logger, seed
├── client/            # React + Vite SPA
│   └── src/
│       ├── app/            # Redux store
│       ├── features/       # auth, cart, theme (Redux slices)
│       ├── api/            # axios instance + query hooks
│       ├── components/     # layout + reusable UI
│       ├── pages/          # route pages
│       └── routes/         # router + guards
├── docs/              # architecture, API, deployment guides
├── .github/workflows/ # CI pipeline
└── docker-compose.yml
```

## 🚀 Quick Start

Prerequisites: **Node 18+**, **MongoDB** (local or Atlas), optional **Redis**.

```bash
# 1. Clone
git clone https://github.com/Mina772/restaurant-management-system.git
cd restaurant-management-system

# 2. Backend
cd server
cp .env.example .env         # fill in values
npm install
npm run seed                 # optional: demo data + admin user
npm run dev                  # http://localhost:5000

# 3. Frontend (new terminal)
cd ../client
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

### With Docker
```bash
docker-compose up --build
```

## 🔑 Default Seed Credentials
| Role     | Email                     | Password     |
|----------|---------------------------|--------------|
| Admin    | admin@restaurant.dev      | Admin@12345  |
| Customer | customer@restaurant.dev   | User@12345   |

## 📚 Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Environment Variables](docs/ENVIRONMENT.md)

## 🧪 Scripts
| Location | Command | Purpose |
|----------|---------|---------|
| server   | `npm run dev` | Start API with nodemon |
| server   | `npm run seed` | Seed database |
| server   | `npm test` | Run Jest tests |
| client   | `npm run dev` | Start Vite dev server |
| client   | `npm run build` | Production build |

## 📄 License
MIT © 2026 — see [LICENSE](LICENSE).
