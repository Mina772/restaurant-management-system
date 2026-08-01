export const currency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

export const dateTime = (d) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d));

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const STATUS_BADGE = {
  pending: 'badge-warn',
  confirmed: 'badge-info',
  preparing: 'badge-info',
  ready: 'badge-ok',
  out_for_delivery: 'badge-info',
  delivered: 'badge-ok',
  completed: 'badge-ok',
  cancelled: 'badge',
  refunded: 'badge',
};
