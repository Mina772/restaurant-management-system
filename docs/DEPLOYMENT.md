# Deployment Guide

## 0. Prerequisites
- MongoDB (MongoDB Atlas recommended for production)
- Optional: Cloudinary, Stripe, and an SMTP provider
- Node 18+ (or Docker)

## 1. Local (Docker Compose)
```bash
cp server/.env.example server/.env      # fill secrets
docker-compose up --build
# API   → http://localhost:5000
# Web   → http://localhost:5173
# Mongo → localhost:27017 · Redis → localhost:6379
```

## 2. Backend — Render / Railway / DigitalOcean
1. Create a **Web Service** from the repo, root directory `server/`.
2. Build command: `npm install` · Start command: `npm start`.
3. Set environment variables from [ENVIRONMENT.md](ENVIRONMENT.md)
   (`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, …).
4. Point `MONGO_URI` at your **MongoDB Atlas** cluster.
5. Add the Stripe webhook endpoint in the Stripe dashboard:
   `https://<api-host>/api/payments/webhook` and copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.

### Dockerized backend
```bash
docker build -t rms-server ./server
docker run -p 5000:5000 --env-file server/.env rms-server
```

## 3. Frontend — Vercel / Netlify
1. Import the repo, set the **root directory** to `client/`.
2. Build command: `npm run build` · Output directory: `dist`.
3. Environment: `VITE_API_URL=https://<api-host>/api`,
   `VITE_SOCKET_URL=https://<api-host>`.
4. Add an SPA rewrite so client-side routing works:
   - **Vercel** `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
   - **Netlify** `_redirects`: `/*  /index.html  200`

## 4. Database (MongoDB Atlas)
1. Create a free M0 cluster, a database user, and allow your host's IP.
2. Copy the SRV connection string into `MONGO_URI`.
3. Seed baseline data (optional):
   ```bash
   cd server && MONGO_URI="<atlas-uri>" npm run seed
   ```

## 5. Post-deploy checklist
- [ ] `GET /api/health` returns `200`
- [ ] `CLIENT_URL` matches the deployed frontend origin (CORS + cookies)
- [ ] Cookies work cross-site (`NODE_ENV=production` sets `SameSite=None; Secure`)
- [ ] Stripe webhook shows successful deliveries
- [ ] Rotate all secrets away from the `.env.example` placeholders

## 6. CI/CD
`.github/workflows/ci.yml` lints & tests the server, lints & builds the client,
and builds both Docker images on every push/PR to `main` / `develop`. Add a
deploy job (or connect Vercel/Render Git integration) to ship on green.
