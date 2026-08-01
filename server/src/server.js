import http from 'http';
import app from './app.js';
import env, { assertEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';
import logger from './utils/logger.js';

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', err);
  process.exit(1);
});

async function bootstrap() {
  assertEnv();
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    logger.info(`🍽️  API running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — closing gracefully`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if not closed within 10s
    setTimeout(() => process.exit(1), 10000).unref();
  };

  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

  process.on('unhandledRejection', (reason) => {
    logger.error('UNHANDLED REJECTION', reason);
    server.close(() => process.exit(1));
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
