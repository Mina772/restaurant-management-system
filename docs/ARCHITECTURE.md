# Architecture

## Overview
A classic **MERN** three-tier system split into two deployables:

```
┌────────────┐     HTTPS / WSS     ┌──────────────┐     TCP      ┌──────────┐
│  React SPA │  ───────────────▶   │  Express API │  ─────────▶  │ MongoDB  │
│  (Vite)    │  ◀───────────────   │  + Socket.io │  ◀─────────  │          │
└────────────┘   REST + realtime   └──────────────┘              └──────────┘
                                          │
                                          ├── Stripe (payments + webhook)
                                          ├── Cloudinary (media)
                                          └── SMTP (transactional email)
```

## Backend layering (Clean-ish architecture)
```
routes/         HTTP surface — path → middleware → controller
  └─ middleware/  auth (JWT), RBAC, validation, security, uploads, errors
      └─ controllers/  orchestration, HTTP concerns (req/res)
          └─ services/   business logic & integrations (token, email, payment, pricing)
              └─ models/  Mongoose schemas + domain methods
```

**Rules of thumb**
- Controllers never talk to external SDKs directly — they call `services/`.
- Pricing is **server-authoritative** (`services/pricing.service.js`): the client
  never dictates prices; the server re-resolves every item and coupon from the DB.
- All async handlers are wrapped by `catchAsync`, and every thrown `AppError`
  is normalized by the central error middleware into a consistent JSON envelope.

## Authentication & sessions
- **Access token** — short-lived JWT (default 15m), sent as `Authorization: Bearer`.
- **Refresh token** — long-lived JWT (default 7d) in an `httpOnly` cookie, and its
  **hash** is stored on the user (`refreshTokens[]`). On refresh, the old hash is
  removed and a new pair issued (**rotation**). Reuse of a revoked token wipes all
  sessions (theft detection). Password changes invalidate outstanding access tokens
  via `passwordChangedAt`.

## Real-time (Socket.io)
Rooms: `user:<id>`, `order:<orderNumber>`, and `role:<role>`. Order lifecycle
events (`order:new`, `order:status`, `order:assigned`) fan out to the customer,
anyone tracking that order number, and the relevant staff dashboards.

## Order state machine
`pending → confirmed → preparing → ready → out_for_delivery → delivered → completed`
(plus `cancelled` / `refunded`). Forward transitions are validated in
`order.controller.js#TRANSITIONS` to keep the pipeline consistent across the
Kitchen, Cashier, and Delivery dashboards.

## Frontend architecture
- **Redux Toolkit** for cross-cutting client state: `auth`, `cart`, `theme`
  (cart & theme persist to `localStorage`).
- **React Query** for all server state (menu, orders, analytics) — caching,
  background refetch, pagination.
- **Axios** instance with a request interceptor (token injection) and a response
  interceptor that transparently refreshes on `401` and replays the request.
- Route-level **code splitting** via `React.lazy` + manual vendor chunks in Vite.
- Theming through CSS custom properties toggled on `<html data-theme>`.

## Data model (high level)
`User 1─* Order *─1 Coupon` · `Order *─* MenuItem` (snapshotted line items) ·
`MenuItem *─1 Category` · `MenuItem 1─* Review` (aggregates denormalized onto the
item) · `Reservation *─1 Table` · `AuditLog` records privileged actions.

## Cross-cutting concerns
- **Security:** Helmet, CORS allow-list, per-route rate limiting, `mongo-sanitize`,
  `xss-clean`, `hpp`, bcrypt (cost 12), signed httpOnly cookies.
- **Performance:** compression, lean pagination (`ApiFeatures`), denormalized
  rating aggregates, Mongo indexes on hot query paths, lazy image loading.
- **Observability:** morgan HTTP logs piped through a leveled logger; audit log
  collection for privileged mutations.
