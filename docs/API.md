# API Reference

Base URL: `http://localhost:5000/api`

All responses share a common envelope:
```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "total": 42 } }
```
Errors:
```json
{ "success": false, "message": "Validation failed", "details": [ ... ] }
```

Auth: send the access token as `Authorization: Bearer <access-token>`. The refresh
token is managed automatically via an httpOnly cookie.

---

## Auth — `/auth`
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/register` | – | Create account (returns access token, sets refresh cookie) |
| POST | `/login` | – | Login |
| POST | `/refresh` | cookie | Rotate refresh token, get new access token |
| POST | `/logout` | – | Revoke current refresh token |
| POST | `/verify-email` | – | Verify email with token |
| POST | `/forgot-password` | – | Request reset link |
| POST | `/reset-password` | – | Reset password with token |
| GET | `/me` | ✅ | Current user |
| POST | `/resend-verification` | ✅ | Resend verification email |
| PATCH | `/update-password` | ✅ | Change password |

## Menu — `/menu`
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/` | – | List (filter/search/sort/paginate). Query: `search, category, sort, page, limit, price[gte], price[lte]` |
| GET | `/featured` | – | Featured items |
| GET | `/popular` | – | Best sellers |
| GET | `/:slug` | – | Single item |
| POST | `/` | admin/staff | Create (multipart `image`) |
| PATCH | `/:id` | admin/staff | Update |
| DELETE | `/:id` | admin | Delete |
| GET | `/:itemId/reviews` | – | List reviews |
| POST | `/:itemId/reviews` | ✅ | Create review |

## Categories — `/categories`
`GET /`, `GET /:slug`, `POST /` (admin), `PATCH /:id` (admin), `DELETE /:id` (admin).

## Orders — `/orders`
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/` | ✅ | Place order (server prices it) |
| GET | `/mine` | ✅ | My orders |
| GET | `/track/:orderNumber` | ✅ | Tracking snapshot |
| GET | `/` | staff | All orders |
| GET | `/:id` | owner/staff | Order detail |
| PATCH | `/:id/status` | staff | Advance status (validated transitions) |
| PATCH | `/:id/assign-driver` | admin/cashier | Assign delivery driver |
| PATCH | `/:id/cancel` | owner/staff | Cancel (only while pending/confirmed) |

**Create order body**
```json
{
  "items": [{ "menuItem": "<id>", "quantity": 2, "selectedOptions": [{ "name": "Size", "choice": "Large" }] }],
  "type": "delivery",
  "paymentMethod": "card",
  "couponCode": "WELCOME10",
  "tip": 5,
  "deliveryAddress": { "street": "1 Main", "city": "Foodie", "zip": "10001" }
}
```

## Coupons — `/coupons`
`POST /validate` (auth), plus admin CRUD (`GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`).

## Reservations — `/reservations`
`POST /`, `GET /mine`, `PATCH /:id/cancel` (auth); `GET /` and `PATCH /:id/status` (staff).

## Payments — `/payments`
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/:orderId/intent` | ✅ | Create Stripe PaymentIntent → `clientSecret` |
| POST | `/:orderId/refund` | admin/cashier | Refund |
| POST | `/webhook` | Stripe sig | Payment lifecycle webhook (raw body) |

## Users — `/users`
`PATCH /me`, address book (`POST/DELETE /me/addresses`), favorites
(`GET/POST /me/favorites`). Admin: `GET /`, `PATCH /:id/role`, `PATCH /:id/active`.

## Admin — `/admin`
`GET /stats`, `GET /stats/sales?days=30`, `GET /stats/top-items`, `GET /audit-logs`.

## Health
`GET /health` → `{ success, status: "ok", uptime }`.

---

## Realtime events (Socket.io)
Connect with `{ auth: { token } }`. Emit `order:track <orderNumber>` to follow a
specific order. Server → client events: `order:new`, `order:status`, `order:assigned`.
