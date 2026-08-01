import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheck, FiSearch } from 'react-icons/fi';
import { api, apiError } from '../api/client.js';
import useSocket from '../hooks/useSocket.js';
import { STATUS_LABELS, currency, dateTime } from '../utils/format.js';

const PIPELINE = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export default function TrackOrder() {
  const { orderNumber: paramNumber } = useParams();
  const [number, setNumber] = useState(paramNumber || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOrder = async (num) => {
    if (!num) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/orders/track/${num}`);
      setOrder(data.data);
    } catch (err) {
      setError(apiError(err, 'Order not found'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramNumber) fetchOrder(paramNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramNumber]);

  // Live updates for the tracked order
  useSocket(
    { 'order:status': (payload) => setOrder((o) => (o && o.orderNumber === payload.orderNumber ? { ...o, status: payload.status } : o)) },
    { track: order?.orderNumber }
  );

  const currentIdx = order ? PIPELINE.indexOf(order.status) : -1;
  const cancelled = order?.status === 'cancelled';

  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1>Track your order</h1>
      <form
        className="row"
        style={{ gap: 8, margin: '16px 0 32px' }}
        onSubmit={(e) => { e.preventDefault(); fetchOrder(number); }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 38 }} placeholder="e.g. RMS-260801-1234" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>Track</button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {order && (
        <div className="card" style={{ padding: 24 }}>
          <div className="row between wrap">
            <div>
              <h2 style={{ margin: 0 }}>{order.orderNumber}</h2>
              <p className="text-muted" style={{ margin: 0 }}>Placed {dateTime(order.createdAt)} · {currency(order.total)}</p>
            </div>
            <span className={`badge ${cancelled ? '' : 'badge-info'}`}>{STATUS_LABELS[order.status]}</span>
          </div>

          {cancelled ? (
            <p className="error-text" style={{ marginTop: 24 }}>This order was cancelled.</p>
          ) : (
            <ol style={{ listStyle: 'none', padding: 0, marginTop: 32 }}>
              {PIPELINE.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <li key={step} className="row" style={{ gap: 14, paddingBottom: 24, position: 'relative' }}>
                    <span
                      style={{
                        width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, zIndex: 1,
                        background: done ? 'var(--brand)' : 'var(--surface)',
                        color: done ? '#fff' : 'var(--text-muted)',
                        border: `2px solid ${done ? 'var(--brand)' : 'var(--border)'}`,
                      }}
                    >
                      {done ? <FiCheck /> : i + 1}
                    </span>
                    {i < PIPELINE.length - 1 && (
                      <span style={{ position: 'absolute', left: 16, top: 34, bottom: 0, width: 2, background: i < currentIdx ? 'var(--brand)' : 'var(--border)' }} />
                    )}
                    <div>
                      <strong style={{ color: active ? 'var(--brand)' : 'inherit' }}>{STATUS_LABELS[step]}</strong>
                      {active && <div className="text-muted" style={{ fontSize: '0.85rem' }}>In progress…</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {order.estimatedReadyAt && !cancelled && currentIdx < 4 && (
            <p className="text-muted">Estimated ready: {dateTime(order.estimatedReadyAt)}</p>
          )}
        </div>
      )}
    </div>
  );
}
