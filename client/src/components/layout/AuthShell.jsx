import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="container section" style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - var(--header-h))' }}>
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ padding: 32, width: '100%', maxWidth: 420 }}
      >
        <Link to="/" className="row" style={{ fontWeight: 800, fontSize: '1.3rem', gap: 8, justifyContent: 'center' }}>
          🍽️ Savoria
        </Link>
        <h1 style={{ textAlign: 'center', fontSize: '1.5rem', marginTop: 16 }}>{title}</h1>
        {subtitle && <p className="text-muted center" style={{ marginBottom: 24 }}>{subtitle}</p>}
        {children}
      </motion.div>
    </div>
  );
}
