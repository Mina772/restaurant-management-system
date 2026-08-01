import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice.js';
import AdminOverview from '../components/dashboard/AdminOverview.jsx';
import OrdersBoard from '../components/dashboard/OrdersBoard.jsx';

/**
 * Single entry point that renders the appropriate dashboard for the
 * signed-in staff member's role.
 */
export default function Dashboard() {
  const user = useSelector(selectUser);

  return (
    <div className="container section">
      <div className="row between wrap" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>
            {user.role === 'admin' ? 'Admin Dashboard' : `${cap(user.role)} Dashboard`}
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>Signed in as {user.name}</p>
        </div>
        <span className="badge">{user.role}</span>
      </div>

      {user.role === 'admin' && <AdminOverview />}

      {['admin', 'kitchen', 'cashier', 'delivery', 'staff'].includes(user.role) && (
        <div style={{ marginTop: user.role === 'admin' ? 48 : 0 }}>
          <h2>Live orders</h2>
          <OrdersBoard role={user.role} />
        </div>
      )}
    </div>
  );
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
