import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container section center" style={{ padding: '18vh 20px' }}>
      <div style={{ fontSize: '5rem' }}>🍽️</div>
      <h1 style={{ fontSize: '2.5rem', margin: '8px 0' }}>404</h1>
      <p className="text-muted">This page went off the menu.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>Back to home</Link>
    </div>
  );
}
