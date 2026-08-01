import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api, apiError } from '../../api/client.js';
import useSocket from '../../hooks/useSocket.js';
import { currency, dateTime, STATUS_LABELS, STATUS_BADGE } from '../../utils/format.js';
import Loader from '../ui/Loader.jsx';

// Which "next status" button each role can trigger, keyed by current status
const NEXT_ACTION = {
  kitchen: { confirmed: 'preparing', preparing: 'ready' },
  cashier: { pending: 'confirmed', ready: 'completed' },
  delivery: { ready: 'out_for_delivery', out_for_delivery: 'delivered' },
  admin: { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'out_for_delivery', out_for_delivery: 'delivered' },
  staff: { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready' },
};

const ACTIVE = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];

export default function OrdersBoard({ role }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/orders', { params: { limit: 50, sort: '-createdAt' } });
      setOrders(data.data);
    } catch (err) {
      toast.error(apiError(err, 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live: new orders + status changes
  useSocket({
    'order:new': () => load(),
    'order:status': (payload) =>
      setOrders((prev) => prev.map((o) => (o._id === payload.id ? { ...o, status: payload.status } : o))),
  });

  const advance = async (order) => {
    const next = NEXT_ACTION[role]?.[order.status];
    if (!next) return;
    try {
      await api.patch(`/orders/${order._id}/status`, { status: next });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: next } : o)));
      toast.success(`${order.orderNumber} → ${STATUS_LABELS[next]}`);
    } catch (err) {
      toast.error(apiError(err, 'Update failed'));
    }
  };

  if (loading) return <Loader />;

  const visible = orders.filter((o) => (role === 'admin' || role === 'cashier' ? true : ACTIVE.includes(o.status)));

  if (visible.length === 0) {
    return <p className="text-muted card" style={{ padding: 32, textAlign: 'center' }}>No orders right now. New orders appear here in real time. 🍳</p>;
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginTop: 16 }}>
      <AnimatePresence>
        {visible.map((o) => {
          const next = NEXT_ACTION[role]?.[o.status];
          return (
            <motion.div
              key={o._id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card"
              style={{ padding: 16 }}
            >
              <div className="row between">
                <strong>{o.orderNumber}</strong>
                <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABELS[o.status]}</span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem', margin: '4px 0 10px' }}>
                {dateTime(o.createdAt)} · {o.type.replace('_', '-')}
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.9rem' }}>
                {o.items.map((it, i) => (
                  <li key={i}>{it.quantity} × {it.name}</li>
                ))}
              </ul>
              <div className="row between" style={{ marginTop: 12 }}>
                <strong>{currency(o.total)}</strong>
                {next && (
                  <button className="btn btn-primary btn-sm" onClick={() => advance(o)}>
                    Mark {STATUS_LABELS[next]}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
