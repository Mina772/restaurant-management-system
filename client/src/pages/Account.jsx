import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMyOrders } from '../api/queries.js';
import { selectUser } from '../features/auth/authSlice.js';
import { currency, dateTime, STATUS_LABELS, STATUS_BADGE } from '../utils/format.js';
import Loader from '../components/ui/Loader.jsx';

export default function Account() {
  const user = useSelector(selectUser);
  const { data: orders, isLoading } = useMyOrders();

  return (
    <div className="container section">
      <h1>My account</h1>

      <div className="card" style={{ padding: 24, marginBottom: 32 }}>
        <div className="row between wrap">
          <div>
            <h2 style={{ margin: 0 }}>{user.name}</h2>
            <p className="text-muted" style={{ margin: 0 }}>{user.email}</p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="badge">{user.role}</span>
            <span className={`badge ${user.isEmailVerified ? 'badge-ok' : 'badge-warn'}`}>
              {user.isEmailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      <h2>Order history</h2>
      {isLoading && <Loader />}
      {orders?.length === 0 && (
        <div className="card center" style={{ padding: 40 }}>
          <p className="text-muted">You haven't placed any orders yet.</p>
          <Link to="/menu" className="btn btn-primary">Browse menu</Link>
        </div>
      )}

      <div className="stack">
        {orders?.map((o) => (
          <div key={o._id} className="card row between wrap" style={{ padding: 18, gap: 12 }}>
            <div>
              <strong>{o.orderNumber}</strong>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                {dateTime(o.createdAt)} · {o.items.length} item(s) · {o.type.replace('_', '-')}
              </div>
            </div>
            <div className="row" style={{ gap: 16 }}>
              <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABELS[o.status]}</span>
              <strong>{currency(o.total)}</strong>
              <Link to={`/track/${o.orderNumber}`} className="btn btn-ghost btn-sm">Track</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
