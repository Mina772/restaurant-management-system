/* eslint-disable no-console */
/**
 * Minimal zero-dependency structured logger.
 * Swap for pino/winston in production if desired.
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function ts() {
  return new Date().toISOString();
}

function log(level, ...args) {
  if (LEVELS[level] > LEVELS[current]) return;
  const line = `[${ts()}] ${level.toUpperCase()}`;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(line, ...args);
}

const logger = {
  error: (...a) => log('error', ...a),
  warn: (...a) => log('warn', ...a),
  info: (...a) => log('info', ...a),
  debug: (...a) => log('debug', ...a),
};

export default logger;
