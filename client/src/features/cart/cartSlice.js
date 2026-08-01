import { createSlice } from '@reduxjs/toolkit';

const KEY = 'rms_cart';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { items: [], couponCode: null };
  } catch {
    return { items: [], couponCode: null };
  }
}

function persist(state) {
  localStorage.setItem(KEY, JSON.stringify({ items: state.items, couponCode: state.couponCode }));
}

// Stable line key based on item id + selected options
function lineKey(item) {
  const opts = (item.selectedOptions || [])
    .map((o) => `${o.name}:${o.choice}`)
    .sort()
    .join('|');
  return `${item.menuItem}__${opts}`;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: load(),
  reducers: {
    addItem(state, action) {
      const item = action.payload;
      const key = lineKey(item);
      const existing = state.items.find((i) => i.key === key);
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        state.items.push({ ...item, key, quantity: item.quantity || 1 });
      }
      persist(state);
    },
    updateQuantity(state, action) {
      const { key, quantity } = action.payload;
      const line = state.items.find((i) => i.key === key);
      if (line) {
        line.quantity = Math.max(1, quantity);
        persist(state);
      }
    },
    removeItem(state, action) {
      state.items = state.items.filter((i) => i.key !== action.payload);
      persist(state);
    },
    applyCoupon(state, action) {
      state.couponCode = action.payload;
      persist(state);
    },
    clearCart(state) {
      state.items = [];
      state.couponCode = null;
      persist(state);
    },
  },
});

export const { addItem, updateQuantity, removeItem, applyCoupon, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

/* ── Selectors ───────────────────────────────── */
export const selectCartItems = (s) => s.cart.items;
export const selectCartCount = (s) => s.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartSubtotal = (s) =>
  Math.round(
    s.cart.items.reduce((sum, i) => {
      const optDelta = (i.selectedOptions || []).reduce((d, o) => d + (o.priceDelta || 0), 0);
      return sum + (i.price + optDelta) * i.quantity;
    }, 0) * 100
  ) / 100;
