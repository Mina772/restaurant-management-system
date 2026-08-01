import mongoose from 'mongoose';

export const ORDER_STATUS = [
  'pending', // created, awaiting payment/confirmation
  'confirmed', // accepted by restaurant
  'preparing', // kitchen cooking
  'ready', // ready for pickup / handoff
  'out_for_delivery',
  'delivered',
  'completed', // dine-in/pickup finished
  'cancelled',
  'refunded',
];

export const ORDER_TYPES = ['delivery', 'pickup', 'dine_in'];
export const PAYMENT_STATUS = ['unpaid', 'paid', 'refunded', 'failed'];
export const PAYMENT_METHODS = ['card', 'cash', 'wallet'];

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true }, // snapshot
    image: String,
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedOptions: [
      { name: String, choice: String, priceDelta: { type: Number, default: 0 } },
    ],
    lineTotal: { type: Number, required: true },
    notes: String,
  },
  { _id: false }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUS, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must have at least one item'],
    },

    type: { type: String, enum: ORDER_TYPES, required: true },
    status: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },
    statusHistory: [statusEventSchema],

    // Money (all in major currency units, 2dp)
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: String,

    payment: {
      method: { type: String, enum: PAYMENT_METHODS, default: 'card' },
      status: { type: String, enum: PAYMENT_STATUS, default: 'unpaid', index: true },
      stripePaymentIntentId: String,
      paidAt: Date,
      amountRefunded: { type: Number, default: 0 },
    },

    // Fulfilment context
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
      location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
    },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    estimatedReadyAt: Date,
    notes: String,
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.status': 1, status: 1 });

// Human-friendly order number: RMS-YYMMDD-XXXX
orderSchema.pre('validate', function genOrderNumber(next) {
  if (!this.orderNumber) {
    const d = new Date();
    const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `RMS-${stamp}-${rand}`;
  }
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{ status: this.status, at: new Date() }];
  }
  next();
});

orderSchema.methods.pushStatus = function pushStatus(status, by, note) {
  this.status = status;
  this.statusHistory.push({ status, at: new Date(), by, note });
};

const Order = mongoose.model('Order', orderSchema);
export default Order;
