import MenuItem from '../models/MenuItem.js';
import Coupon from '../models/Coupon.js';
import AppError from '../utils/AppError.js';

const TAX_RATE = 0.08; // 8% sales tax
const DELIVERY_FEE = 3.99;
const FREE_DELIVERY_THRESHOLD = 40;

const round = (n) => Math.round(n * 100) / 100;

/**
 * Server-authoritative pricing. Never trusts client-supplied prices:
 * re-resolves every item from the DB, applies option deltas, coupon,
 * tax, delivery fee and tip.
 *
 * @param {Array} cartItems  [{ menuItem, quantity, selectedOptions?, notes? }]
 * @param {Object} opts      { type, couponCode?, tip?, userId }
 */
export async function computeOrder(cartItems, { type, couponCode, tip = 0, userId }) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw AppError.badRequest('Cart is empty');
  }

  const ids = cartItems.map((c) => c.menuItem);
  const docs = await MenuItem.find({ _id: { $in: ids }, isAvailable: true });
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));

  const items = [];
  let subtotal = 0;

  for (const line of cartItems) {
    const doc = byId.get(String(line.menuItem));
    if (!doc) throw AppError.badRequest(`Item unavailable: ${line.menuItem}`);

    const quantity = Math.max(1, parseInt(line.quantity, 10) || 1);
    if (doc.stock != null && doc.stock < quantity) {
      throw AppError.conflict(`Only ${doc.stock} of "${doc.name}" left in stock`);
    }

    let unitPrice = doc.price;
    const selectedOptions = [];
    for (const sel of line.selectedOptions || []) {
      const optDef = doc.options.find((o) => o.name === sel.name);
      const choiceDef = optDef?.choices.find((c) => c.label === sel.choice);
      if (choiceDef) {
        unitPrice += choiceDef.priceDelta;
        selectedOptions.push({ name: sel.name, choice: sel.choice, priceDelta: choiceDef.priceDelta });
      }
    }

    const lineTotal = round(unitPrice * quantity);
    subtotal += lineTotal;

    items.push({
      menuItem: doc._id,
      name: doc.name,
      image: doc.image,
      unitPrice: round(unitPrice),
      quantity,
      selectedOptions,
      lineTotal,
      notes: line.notes,
    });
  }

  subtotal = round(subtotal);

  // Coupon
  let discount = 0;
  let appliedCode;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw AppError.badRequest('Invalid coupon code');
    const result = coupon.evaluate(userId, subtotal);
    if (!result.valid) throw AppError.badRequest(result.reason);
    discount = result.discount;
    appliedCode = coupon.code;
  }

  const taxable = Math.max(subtotal - discount, 0);
  const tax = round(taxable * TAX_RATE);
  const deliveryFee =
    type === 'delivery' ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE) : 0;
  const safeTip = round(Math.max(0, Number(tip) || 0));
  const total = round(taxable + tax + deliveryFee + safeTip);

  return {
    items,
    subtotal,
    discount,
    tax,
    deliveryFee,
    tip: safeTip,
    total,
    couponCode: appliedCode,
  };
}
