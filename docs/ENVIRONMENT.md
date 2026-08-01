# Environment Variables

Copy `server/.env.example` → `server/.env` and `client/.env.example` → `client/.env`.

## Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `NODE_ENV` | – | `development` | `development` \| `production` \| `test` |
| `PORT` | – | `5000` | HTTP port for the API |
| `CLIENT_URL` | – | `http://localhost:5173` | Allowed CORS origin & email link base |
| `MONGO_URI` | ✅ | – | MongoDB connection string |
| `REDIS_URL` | – | – | Redis URL (optional caching) |
| `JWT_ACCESS_SECRET` | ✅ | – | Secret for short-lived access tokens |
| `JWT_REFRESH_SECRET` | ✅ | – | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRES` | – | `15m` | Access-token lifetime |
| `JWT_REFRESH_EXPIRES` | – | `7d` | Refresh-token lifetime |
| `COOKIE_SECRET` | – | – | Cookie signing secret |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | – | – | Email delivery (Nodemailer). If absent, emails are logged. |
| `EMAIL_FROM` | – | – | From address for outbound email |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | – | – | Image uploads. If absent, uploads use memory storage. |
| `STRIPE_SECRET_KEY` | – | – | Stripe secret key. If absent, payment endpoints return a clear error. |
| `STRIPE_WEBHOOK_SECRET` | – | – | Verifies incoming Stripe webhooks |
| `STRIPE_CURRENCY` | – | `usd` | Currency for PaymentIntents |

> In `production` the server **fails to boot** if `MONGO_URI`, `JWT_ACCESS_SECRET`,
> or `JWT_REFRESH_SECRET` are missing (see `src/config/env.js`).

## Client (`client/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | *(empty → `/api` via dev proxy)* | Base URL of the API |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Socket.io server URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | – | Stripe publishable key (for Elements) |

## Graceful degradation
The platform is designed to run locally with **only** MongoDB + the two JWT
secrets configured. Cloudinary, Stripe, and SMTP are all optional and degrade
gracefully so you can develop the full ordering flow without external accounts.
