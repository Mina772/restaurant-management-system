import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingBag, FiMenu, FiX, FiUser, FiLogOut, FiGrid } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { selectCartCount } from '../../features/cart/cartSlice.js';
import { logout, selectUser } from '../../features/auth/authSlice.js';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/reservations', label: 'Reserve' },
  { to: '/track', label: 'Track Order' },
];

const STAFF = ['admin', 'staff', 'kitchen', 'cashier', 'delivery'];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const count = useSelector(selectCartCount);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = async () => {
    await dispatch(logout());
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 'var(--header-h)',
        background: 'color-mix(in srgb, var(--bg-elev) 88%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container row between" style={{ height: '100%' }}>
        <Link to="/" className="row" style={{ fontWeight: 800, fontSize: '1.25rem', gap: 8 }}>
          <span aria-hidden>🍽️</span> Savoria
        </Link>

        <nav className="row" style={{ gap: 4 }} aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className="btn btn-ghost btn-sm nav-desktop"
              style={({ isActive }) =>
                isActive ? { color: 'var(--brand)', background: 'var(--brand-50)' } : undefined
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="row" style={{ gap: 8 }}>
          <ThemeToggle />

          <Link to="/cart" className="btn btn-ghost btn-sm" style={{ position: 'relative' }} aria-label="Cart">
            <FiShoppingBag />
            {count > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: 'var(--brand)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  display: 'grid',
                  placeItems: 'center',
                  padding: '0 4px',
                }}
              >
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="row nav-desktop" style={{ gap: 6 }}>
              {STAFF.includes(user.role) && (
                <Link to="/dashboard" className="btn btn-ghost btn-sm" title="Dashboard">
                  <FiGrid />
                </Link>
              )}
              <Link to="/account" className="btn btn-ghost btn-sm" title="Account">
                <FiUser />
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={onLogout} title="Sign out">
                <FiLogOut />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm nav-desktop">
              Sign in
            </Link>
          )}

          <button
            className="btn btn-ghost btn-sm nav-mobile"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="nav-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', background: 'var(--bg-elev)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="container stack" style={{ padding: '16px 20px' }}>
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className="btn btn-ghost">
                  {l.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  {STAFF.includes(user.role) && (
                    <Link to="/dashboard" className="btn btn-ghost" onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>
                  )}
                  <Link to="/account" className="btn btn-ghost" onClick={() => setOpen(false)}>
                    My Account
                  </Link>
                  <button className="btn btn-ghost" onClick={onLogout}>
                    Sign out
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <style>{`
        .nav-mobile { display: none; }
        @media (max-width: 860px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: inline-flex; }
        }
      `}</style>
    </header>
  );
}
