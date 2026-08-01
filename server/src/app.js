import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import xss from 'xss-clean';

import env from './config/env.js';
import routes from './routes/index.js';
import { webhook } from './controllers/payment.controller.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/security.middleware.js';
import logger from './utils/logger.js';

const app = express();

app.set('trust proxy', 1);

/* ── Security headers ─────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.nodeEnv === 'production' ? undefined : false,
  })
);

/* ── CORS ─────────────────────────────────────────────── */
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

/* ── Stripe webhook needs the RAW body — mount before json ── */
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhook);

/* ── Body parsing ─────────────────────────────────────── */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.cookieSecret));

/* ── Sanitization & hardening ─────────────────────────── */
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['tags', 'price', 'sort', 'fields'] }));
app.use(compression());

/* ── Logging ──────────────────────────────────────────── */
if (env.nodeEnv !== 'test') {
  app.use(
    morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

/* ── Rate limiting + API routes ───────────────────────── */
app.use('/api', apiLimiter, routes);

app.get('/', (_req, res) =>
  res.json({ name: 'Restaurant Management System API', version: '1.0.0', docs: '/api/health' })
);

/* ── 404 + error handling ─────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

export default app;
