import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import {
  selectCartItems,
  selectCartSubtotal,
  updateQuantity,
  removeItem,
} from '../features/cart/cartSlice.js';
import { currency } from '../utils/format.js';

export default function Cart() {
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container section center" style={{ padding: '15vh 20px' }}>
        <FiShoppingBag size={48} style={{ color: 'var(--text-muted)' }} />
        <h2 style={{ marginTop: 16 }}>Your cart is empty</h2>
        <p className="text-muted">Add some delicious dishes to get started.</p>
        <Link to="/menu" className="btn btn-primary">Browse menu</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1>Your cart</h1>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px', alignItems: 'start', gap: 32 }}>
        <div className="stack">
          {items.map((line) => {
            const optDelta = (line.selectedOptions || []).reduce((s, o) => s + (o.priceDelta || 0), 0);
            const price = line.price + optDelta;
            return (
              <div key={line.key} className="card row" style={{ padding: 12, gap: 14 }}>
                <img src={line.image} alt={line.name} style={{ width: 84, height: 84, borderRadius: 10, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <strong>{line.name}</strong>
                  {line.selectedOptions?.length > 0 && (
                    <div className="text-muted" style={{ fontSize: '0.82rem' }}>
                      {line.selectedOptions.map((o) => `${o.name}: ${o.choice}`).join(' · ')}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontWeight: 700 }}>{currency(price)}</div>
                </div>
                <div className="stack" style={{ alignItems: 'flex-end', gap: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => dispatch(updateQuantity({ key: line.key, quantity: line.quantity - 1 }))} aria-label="Decrease"><FiMinus /></button>
                    <strong style={{ minWidth: 18, textAlign: 'center' }}>{line.quantity}</strong>
                    <button className="btn btn-ghost btn-sm" onClick={() => dispatch(updateQuantity({ key: line.key, quantity: line.quantity + 1 }))} aria-label="Increase"><FiPlus /></button>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch(removeItem(line.key))} style={{ color: 'var(--err)' }} aria-label="Remove">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="card" style={{ padding: 20, position: 'sticky', top: 88 }}>
          <h3>Order summary</h3>
          <div className="row between"><span className="text-muted">Subtotal</span><strong>{currency(subtotal)}</strong></div>
          <div className="row between"><span className="text-muted">Taxes & fees</span><span className="text-muted">Calculated at checkout</span></div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <button className="btn btn-primary btn-block" onClick={() => navigate('/checkout')}>
            Proceed to checkout
          </button>
          <Link to="/menu" className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>Continue shopping</Link>
        </aside>
      </div>

      <style>{`@media (max-width: 780px){ .container .grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
