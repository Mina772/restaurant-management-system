import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { FiTag } from 'react-icons/fi';
import { selectCartItems, selectCartSubtotal, clearCart } from '../features/cart/cartSlice.js';
import { useCreateOrder } from '../api/queries.js';
import { api, apiError } from '../api/client.js';
import { currency } from '../utils/format.js';

const TAX_RATE = 0.08;
const DELIVERY_FEE = 3.99;
const FREE_DELIVERY = 40;

export default function Checkout() {
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();

  const [type, setType] = useState('delivery');
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: 'US' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [tip, setTip] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applying, setApplying] = useState(false);

  if (items.length === 0) {
    navigate('/menu');
    return null;
  }

  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * TAX_RATE * 100) / 100;
  const deliveryFee = type === 'delivery' ? (subtotal >= FREE_DELIVERY ? 0 : DELIVERY_FEE) : 0;
  const total = Math.round((taxable + tax + deliveryFee + Number(tip)) * 100) / 100;

  const applyCoupon = async () => {
    if (!couponCode) return;
    setApplying(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, subtotal });
      setDiscount(data.data.discount);
      toast.success(`Coupon applied — you saved ${currency(data.data.discount)}`);
    } catch (err) {
      setDiscount(0);
      toast.error(apiError(err, 'Invalid coupon'));
    } finally {
      setApplying(false);
    }
  };

  const placeOrder = async () => {
    if (type === 'delivery' && (!address.street || !address.city || !address.zip)) {
      toast.error('Please complete your delivery address');
      return;
    }
    try {
      const payload = {
        items: items.map((i) => ({ menuItem: i.menuItem, quantity: i.quantity, selectedOptions: i.selectedOptions })),
        type,
        paymentMethod,
        tip: Number(tip) || 0,
        couponCode: couponCode || undefined,
        deliveryAddress: type === 'delivery' ? address : undefined,
      };
      const order = await createOrder.mutateAsync(payload);
      dispatch(clearCart());
      toast.success(`Order ${order.orderNumber} placed!`);
      navigate(`/track/${order.orderNumber}`);
    } catch (err) {
      toast.error(apiError(err, 'Could not place order'));
    }
  };

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 32, alignItems: 'start' }}>
        <div className="stack" style={{ gap: 20 }}>
          {/* Order type */}
          <div className="card" style={{ padding: 20 }}>
            <h3>Order type</h3>
            <div className="row wrap" style={{ gap: 10 }}>
              {['delivery', 'pickup', 'dine_in'].map((t) => (
                <button
                  key={t}
                  className={`btn ${type === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setType(t)}
                >
                  {t === 'dine_in' ? 'Dine-in' : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          {type === 'delivery' && (
            <div className="card" style={{ padding: 20 }}>
              <h3>Delivery address</h3>
              <div className="field"><label>Street</label><input className="input" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} /></div>
              <div className="row" style={{ gap: 12 }}>
                <div className="field" style={{ flex: 1 }}><label>City</label><input className="input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></div>
                <div className="field" style={{ width: 100 }}><label>State</label><input className="input" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} /></div>
                <div className="field" style={{ width: 120 }}><label>ZIP</label><input className="input" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} /></div>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="card" style={{ padding: 20 }}>
            <h3>Payment</h3>
            <div className="row wrap" style={{ gap: 10 }}>
              {['card', 'cash'].map((m) => (
                <button key={m} className={`btn ${paymentMethod === m ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPaymentMethod(m)}>
                  {m === 'card' ? 'Card (Stripe)' : 'Cash on delivery'}
                </button>
              ))}
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 12 }}>
              Card payments are securely processed via Stripe after the order is placed.
            </p>
          </div>
        </div>

        {/* Summary */}
        <aside className="card" style={{ padding: 20, position: 'sticky', top: 88 }}>
          <h3>Summary</h3>
          <div className="stack" style={{ gap: 8, maxHeight: 200, overflow: 'auto' }}>
            {items.map((i) => (
              <div key={i.key} className="row between" style={{ fontSize: '0.9rem' }}>
                <span>{i.quantity} × {i.name}</span>
                <span>{currency(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />

          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiTag style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
            </div>
            <button className="btn btn-ghost" onClick={applyCoupon} disabled={applying}>Apply</button>
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <label>Tip</label>
            <div className="row" style={{ gap: 6 }}>
              {[0, 2, 5, 10].map((t) => (
                <button key={t} className={`btn btn-sm ${Number(tip) === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTip(t)}>
                  {t === 0 ? 'None' : `$${t}`}
                </button>
              ))}
            </div>
          </div>

          <div className="stack" style={{ gap: 6 }}>
            <div className="row between"><span className="text-muted">Subtotal</span><span>{currency(subtotal)}</span></div>
            {discount > 0 && <div className="row between" style={{ color: 'var(--ok)' }}><span>Discount</span><span>−{currency(discount)}</span></div>}
            <div className="row between"><span className="text-muted">Tax</span><span>{currency(tax)}</span></div>
            <div className="row between"><span className="text-muted">Delivery</span><span>{deliveryFee === 0 ? 'Free' : currency(deliveryFee)}</span></div>
            {Number(tip) > 0 && <div className="row between"><span className="text-muted">Tip</span><span>{currency(tip)}</span></div>}
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />
          <div className="row between" style={{ fontSize: '1.1rem' }}><strong>Total</strong><strong>{currency(total)}</strong></div>

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={placeOrder} disabled={createOrder.isPending}>
            {createOrder.isPending ? 'Placing order…' : `Place order · ${currency(total)}`}
          </button>
        </aside>
      </div>
      <style>{`@media (max-width: 860px){ .section .grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
