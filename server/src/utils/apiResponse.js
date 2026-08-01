/**
 * Consistent success envelope for all endpoints:
 * { success, message, data, meta }
 */
export function ok(res, { data = null, message = 'OK', meta = undefined, status = 200 } = {}) {
  return res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}

export function created(res, payload = {}) {
  return ok(res, { ...payload, status: 201, message: payload.message || 'Created' });
}

export function paginated(res, { items, page, limit, total, message = 'OK' }) {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
