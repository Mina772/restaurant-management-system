import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiStar, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useMenuItem } from '../api/queries.js';
import { addItem } from '../features/cart/cartSlice.js';
import { currency } from '../utils/format.js';
import Loader from '../components/ui/Loader.jsx';

export default function ItemDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { data: item, isLoading, isError } = useMenuItem(slug);
  const [qty, setQty] = useState(1);
  const [options, setOptions] = useState({});

  if (isLoading) return <Loader full />;
  if (isError || !item)
    return (
      <div className="container section center">
        <p className="text-muted">Dish not found.</p>
        <Link to="/menu" className="btn btn-primary">Back to menu</Link>
      </div>
    );

  const selectedOptions = Object.entries(options).map(([name, choice]) => {
    const def = item.options?.find((o) => o.name === name);
    const c = def?.choices.find((ch) => ch.label === choice);
    return { name, choice, priceDelta: c?.priceDelta || 0 };
  });
  const unitPrice = item.price + selectedOptions.reduce((s, o) => s + o.priceDelta, 0);

  const add = () => {
    dispatch(addItem({ menuItem: item._id, name: item.name, image: item.image, price: item.price, quantity: qty, selectedOptions }));
    toast.success(`${qty} × ${item.name} added to cart`);
  };

  return (
    <div className="container section">
      <Link to="/menu" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
        <FiArrowLeft /> Back to menu
      </Link>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
        <img src={item.image} alt={item.name} className="card" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />

        <div>
          <div className="row wrap" style={{ gap: 8 }}>
            <span className="badge">{item.category?.name}</span>
            {item.isVegetarian && <span className="badge badge-ok">Vegetarian</span>}
            {item.isVegan && <span className="badge badge-ok">Vegan</span>}
            {item.isGlutenFree && <span className="badge badge-info">Gluten-free</span>}
          </div>

          <h1 style={{ marginTop: 12 }}>{item.name}</h1>
          <div className="row" style={{ gap: 8, color: 'var(--accent)', fontWeight: 700 }}>
            <FiStar fill="currentColor" /> {item.ratingAverage?.toFixed(1) ?? '—'}
            <span className="text-muted" style={{ fontWeight: 400 }}>· {item.ratingCount || 0} reviews · {item.prepTimeMinutes} min</span>
          </div>

          <p style={{ marginTop: 16 }}>{item.description}</p>

          {item.ingredients?.length > 0 && (
            <p className="text-muted"><strong>Ingredients:</strong> {item.ingredients.join(', ')}</p>
          )}
          {item.allergens?.length > 0 && (
            <p className="text-muted"><strong>Allergens:</strong> {item.allergens.join(', ')}</p>
          )}

          {/* ── Options ────────────────────────── */}
          {item.options?.map((opt) => (
            <div key={opt.name} className="field">
              <label>{opt.name}{opt.required && ' *'}</label>
              <select
                className="select"
                value={options[opt.name] || ''}
                onChange={(e) => setOptions((o) => ({ ...o, [opt.name]: e.target.value }))}
              >
                <option value="">Choose {opt.name.toLowerCase()}</option>
                {opt.choices.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}{c.priceDelta ? ` (+${currency(c.priceDelta)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* ── Add to cart ────────────────────── */}
          <div className="row between" style={{ marginTop: 24, gap: 16, flexWrap: 'wrap' }}>
            <div className="row card" style={{ padding: 6, gap: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><FiMinus /></button>
              <strong style={{ minWidth: 20, textAlign: 'center' }}>{qty}</strong>
              <button className="btn btn-ghost btn-sm" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity"><FiPlus /></button>
            </div>
            <button className="btn btn-primary" style={{ flex: 1, minWidth: 180 }} onClick={add} disabled={!item.isAvailable}>
              {item.isAvailable ? `Add to cart · ${currency(unitPrice * qty)}` : 'Sold out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
