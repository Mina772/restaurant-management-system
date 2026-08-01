import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let io = null;

/**
 * Socket.io gateway. Rooms:
 *   user:<id>     — personalized order updates for a customer
 *   role:kitchen  — all kitchen staff
 *   role:cashier  — all cashiers
 *   role:delivery — all drivers
 *   role:admin    — admins
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // Optional auth handshake — token in auth payload
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow anonymous (public order tracking by number)
    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret);
      socket.user = { id: decoded.sub, role: decoded.role };
    } catch {
      /* ignore bad token; stays anonymous */
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      socket.join(`role:${socket.user.role}`);
      logger.debug(`Socket connected: ${socket.user.id} (${socket.user.role})`);
    }

    socket.on('order:track', (orderNumber) => {
      if (orderNumber) socket.join(`order:${orderNumber}`);
    });

    socket.on('disconnect', () => {
      if (socket.user) logger.debug(`Socket disconnected: ${socket.user.id}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/** Broadcast an order event to the relevant rooms. */
export function emitOrderEvent(event, order) {
  if (!io) return;
  const payload = {
    id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    type: order.type,
    total: order.total,
    updatedAt: order.updatedAt,
  };
  io.to(`user:${order.customer}`).emit(event, payload);
  io.to(`order:${order.orderNumber}`).emit(event, payload);
  io.to('role:kitchen').to('role:cashier').to('role:admin').emit(event, payload);
  if (order.type === 'delivery') io.to('role:delivery').emit(event, payload);
}
