import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { FiDollarSign, FiShoppingBag, FiUsers, FiActivity } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { useAdminStats, useSalesSeries } from '../../api/queries.js';
import { api } from '../../api/client.js';
import { currency } from '../../utils/format.js';
import Loader from '../ui/Loader.jsx';

function Kpi({ icon: Icon, label, value, tint }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between">
        <span className="text-muted">{label}</span>
        <span style={{ background: tint, color: '#fff', borderRadius: 10, padding: 8, display: 'grid', placeItems: 'center' }}>
          <Icon />
        </span>
      </div>
      <strong style={{ fontSize: '1.8rem', display: 'block', marginTop: 8 }}>{value}</strong>
    </div>
  );
}

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: sales } = useSalesSeries(30);
  const { data: topItems } = useQuery({
    queryKey: ['admin', 'top-items'],
    queryFn: async () => (await api.get('/admin/stats/top-items')).data.data,
  });

  if (isLoading) return <Loader />;

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Kpi icon={FiDollarSign} label="Total revenue" value={currency(stats?.revenue)} tint="#16a34a" />
        <Kpi icon={FiDollarSign} label="Revenue today" value={currency(stats?.revenueToday)} tint="#e11d48" />
        <Kpi icon={FiShoppingBag} label="Orders today" value={stats?.ordersToday ?? 0} tint="#2563eb" />
        <Kpi icon={FiActivity} label="Active orders" value={stats?.activeOrders ?? 0} tint="#d97706" />
        <Kpi icon={FiUsers} label="Customers" value={stats?.customers ?? 0} tint="#7c3aed" />
      </div>

      <div className="grid dash-charts" style={{ gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3>Revenue — last 30 days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sales || []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip formatter={(v) => currency(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3>Top sellers</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={(topItems || []).slice(0, 6)} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }} />
              <Bar dataKey="qty" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`@media (max-width: 860px){ .dash-charts{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
