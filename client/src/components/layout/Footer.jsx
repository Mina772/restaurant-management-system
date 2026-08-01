import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: 'var(--bg-elev)', borderTop: '1px solid var(--border)', marginTop: 48 }}>
      <div className="container section" style={{ paddingBottom: 32 }}>
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}
        >
          <div>
            <h3 style={{ fontSize: '1.3rem' }}>🍽️ Savoria</h3>
            <p className="text-muted" style={{ maxWidth: 260 }}>
              Chef-crafted dishes, delivered fresh. Order online, reserve a table, and taste the
              difference.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul className="stack" style={{ listStyle: 'none', padding: 0, gap: 8 }}>
              <li><Link to="/menu" className="text-muted">Menu</Link></li>
              <li><Link to="/reservations" className="text-muted">Reservations</Link></li>
              <li><Link to="/track" className="text-muted">Track Order</Link></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul className="stack" style={{ listStyle: 'none', padding: 0, gap: 8 }}>
              <li><Link to="/login" className="text-muted">Sign in</Link></li>
              <li><Link to="/register" className="text-muted">Create account</Link></li>
              <li><Link to="/account" className="text-muted">My orders</Link></li>
            </ul>
          </div>
          <div>
            <h4>Visit us</h4>
            <p className="text-muted">123 Gourmet Ave<br />Foodie City, FC 10001</p>
            <p className="text-muted">Open daily · 11am – 11pm</p>
          </div>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '32px 0 16px' }} />
        <p className="text-muted center" style={{ margin: 0 }}>
          © {year} Savoria Restaurant Management System · Built with the MERN stack.
        </p>
      </div>
    </footer>
  );
}
