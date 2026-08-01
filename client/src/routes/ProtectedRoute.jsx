import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import Loader from '../components/ui/Loader.jsx';

/**
 * Guards routes by authentication and (optionally) role.
 *   <ProtectedRoute roles={['admin']}><AdminPage/></ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, booted } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!booted) return <Loader full label="Checking session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
