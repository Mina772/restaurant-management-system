import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { useMenu, useCategories } from '../api/queries.js';
import MenuCard from '../components/menu/MenuCard.jsx';
import Loader from '../components/ui/Loader.jsx';

const SORTS = [
  { value: '-soldCount', label: 'Most popular' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: '-ratingAverage', label: 'Top rated' },
  { value: '-createdAt', label: 'Newest' },
];

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();

  const [search, setSearch] = useState(params.get('search') || '');
  const category = params.get('category') || '';
  const sort = params.get('sort') || '-soldCount';
  const page = parseInt(params.get('page') || '1', 10);

  const query = { page, limit: 12, sort };
  if (category) query.category = category;
  if (params.get('search')) query.search = params.get('search');

  const { data, isLoading, isError } = useMenu(query);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!('page' in patch)) next.set('page', '1');
    setParams(next);
  };

  const onSearch = (e) => {
    e.preventDefault();
    update({ search });
  };

  return (
    <div className="container section">
      <h1>Our Menu</h1>
      <p className="text-muted">Freshly prepared, crafted with love.</p>

      {/* ── Toolbar ──────────────────────────── */}
      <div className="card" style={{ padding: 16, margin: '20px 0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={onSearch} className="row" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              placeholder="Search dishes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search dishes"
            />
          </div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>

        <select className="select" style={{ width: 'auto' }} value={category} onChange={(e) => update({ category: e.target.value })} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {isLoading && <Loader />}
      {isError && <p className="error-text">Failed to load menu. Please try again.</p>}

      {data && (
        <>
          {data.items.length === 0 ? (
            <p className="text-muted center" style={{ padding: '48px 0' }}>No dishes match your filters.</p>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {data.items.map((it) => (
                <MenuCard key={it._id} item={it} />
              ))}
            </div>
          )}

          {/* ── Pagination ─────────────────────── */}
          {data.meta && data.meta.totalPages > 1 && (
            <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 32 }}>
              <button className="btn btn-ghost btn-sm" disabled={!data.meta.hasPrev} onClick={() => update({ page: String(page - 1) })}>
                Previous
              </button>
              <span className="text-muted">Page {data.meta.page} of {data.meta.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={!data.meta.hasNext} onClick={() => update({ page: String(page + 1) })}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
