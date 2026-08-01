/**
 * Operational error with an HTTP status code.
 * Distinguishes expected (operational) failures from programming bugs.
 */
export default class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details) {
    return new AppError(msg, 400, details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new AppError(msg, 401);
  }
  static forbidden(msg = 'Forbidden') {
    return new AppError(msg, 403);
  }
  static notFound(msg = 'Resource not found') {
    return new AppError(msg, 404);
  }
  static conflict(msg = 'Conflict') {
    return new AppError(msg, 409);
  }
}
