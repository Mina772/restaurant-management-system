import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiClock, FiTruck, FiAward } from 'react-icons/fi';
import { useFeatured, usePopular, useCategories } from '../api/queries.js';
import MenuCard from '../components/menu/MenuCard.jsx';

const HERO = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80';

function Grid({ items }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
      {items?.map((it) => (
        <MenuCard key={it._id} item={it} />
      ))}
    </div>
  );
}

export default function Home() {
  const { data: featured } = useFeatured();
  const { data: popular } = usePopular();
  const { data: categories } = useCategories();

  return (
    <>
      {/* ── Hero ───────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={HERO}
          alt=""
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.42)' }}
        />
        <div className="container" style={{ position: 'relative', padding: '120px 20px', color: '#fff' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ maxWidth: 640 }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
              🔥 Chef-crafted · Delivered fresh
            </span>
            <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', margin: '16px 0', color: '#fff' }}>
              Exceptional food, <br /> delivered to your door.
            </h1>
            <p style={{ fontSize: '1.15rem', opacity: 0.9, maxWidth: 520 }}>
              Explore a menu of hand-crafted dishes made from the finest ingredients. Order online
              for delivery, pickup, or reserve your table.
            </p>
            <div className="row wrap" style={{ gap: 12, marginTop: 28 }}>
              <Link to="/menu" className="btn btn-primary">
                Order Now <FiArrowRight />
              </Link>
              <Link to="/reservations" className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>
                Reserve a Table
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Value props ────────────────────────── */}
      <section className="container" style={{ padding: '48px 20px' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            [FiTruck, 'Fast Delivery', 'Hot & fresh in 30 minutes or less.'],
            [FiClock, 'Open Daily', '11am – 11pm, every single day.'],
            [FiAward, 'Award-winning', 'Rated #1 by local food critics.'],
          ].map(([Icon, title, text]) => (
            <div key={title} className="card" style={{ padding: 24 }}>
              <Icon size={26} style={{ color: 'var(--brand)' }} />
              <h3 style={{ margin: '12px 0 4px' }}>{title}</h3>
              <p className="text-muted" style={{ margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────── */}
      <section className="container section" style={{ paddingTop: 24 }}>
        <h2>Browse by category</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginTop: 20 }}>
          {categories?.map((c) => (
            <Link key={c._id} to={`/menu?category=${c._id}`} className="card" style={{ textAlign: 'center' }}>
              <img src={c.image} alt={c.name} loading="lazy" style={{ height: 110, width: '100%', objectFit: 'cover' }} />
              <div style={{ padding: '12px 8px', fontWeight: 700 }}>{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Popular ──────────────────────────── */}
      <section className="container section" style={{ paddingTop: 0 }}>
        <div className="row between" style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Most popular 🔥</h2>
          <Link to="/menu" className="btn btn-ghost btn-sm">View all <FiArrowRight /></Link>
        </div>
        <Grid items={popular} />
      </section>

      {/* ── Featured / offers ─────────────────── */}
      {featured?.length > 0 && (
        <section className="container section" style={{ paddingTop: 0 }}>
          <h2>Chef's featured picks</h2>
          <div style={{ marginTop: 20 }}>
            <Grid items={featured} />
          </div>
        </section>
      )}
    </>
  );
}
