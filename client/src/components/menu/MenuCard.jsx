import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiStar, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { addItem } from '../../features/cart/cartSlice.js';
import { currency } from '../../utils/format.js';

export default function MenuCard({ item }) {
  const dispatch = useDispatch();

  const add = () => {
    dispatch(
      addItem({
        menuItem: item._id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: 1,
        selectedOptions: [],
      })
    );
    toast.success(`${item.name} added to cart`);
  };

  return (
    <motion.article
      className="card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Link to={`/menu/${item.slug}`} style={{ position: 'relative', display: 'block' }}>
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }}
        />
        {item.discountPercent > 0 && (
          <span className="badge" style={{ position: 'absolute', top: 12, left: 12, background: 'var(--accent)', color: '#fff' }}>
            -{item.discountPercent}%
          </span>
        )}
        {!item.isAvailable && (
          <span
            className="badge"
            style={{ position: 'absolute', top: 12, right: 12, background: 'var(--err)', color: '#fff' }}
          >
            Sold out
          </span>
        )}
      </Link>

      <div className="stack" style={{ padding: 16, gap: 8, flex: 1 }}>
        <div className="row between">
          <span className="badge">{item.category?.name || 'Dish'}</span>
          <span className="row" style={{ gap: 4, color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>
            <FiStar fill="currentColor" /> {item.ratingAverage?.toFixed(1) ?? '—'}
            <span className="text-muted" style={{ fontWeight: 400 }}>({item.ratingCount || 0})</span>
          </span>
        </div>

        <Link to={`/menu/${item.slug}`}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name}</h3>
        </Link>
        <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem', flex: 1 }}>
          {item.description?.slice(0, 84)}
          {item.description?.length > 84 ? '…' : ''}
        </p>

        <div className="row between" style={{ marginTop: 6 }}>
          <div className="row" style={{ gap: 8 }}>
            <strong style={{ fontSize: '1.15rem' }}>{currency(item.price)}</strong>
            {item.compareAtPrice > item.price && (
              <span className="text-muted" style={{ textDecoration: 'line-through', fontSize: '0.9rem' }}>
                {currency(item.compareAtPrice)}
              </span>
            )}
          </div>
          <button className="btn btn-primary btn-sm" onClick={add} disabled={!item.isAvailable} aria-label={`Add ${item.name} to cart`}>
            <FiPlus /> Add
          </button>
        </div>
      </div>
    </motion.article>
  );
}
