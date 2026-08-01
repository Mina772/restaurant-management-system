import Order from '../src/models/Order.js';

describe('Order model', () => {
  test('generates a human-friendly order number on validate', async () => {
    const order = new Order({
      customer: '507f1f77bcf86cd799439011',
      items: [{ menuItem: '507f1f77bcf86cd799439012', name: 'Burger', unitPrice: 10, quantity: 1, lineTotal: 10 }],
      type: 'pickup',
      subtotal: 10,
      total: 10.8,
    });
    await order.validate().catch(() => {});
    expect(order.orderNumber).toMatch(/^RMS-\d{6}-\d{4}$/);
    expect(order.statusHistory[0].status).toBe('pending');
  });

  test('pushStatus records history', () => {
    const order = new Order({
      customer: '507f1f77bcf86cd799439011',
      items: [{ menuItem: '507f1f77bcf86cd799439012', name: 'Burger', unitPrice: 10, quantity: 1, lineTotal: 10 }],
      type: 'pickup',
      subtotal: 10,
      total: 10.8,
    });
    order.pushStatus('confirmed');
    expect(order.status).toBe('confirmed');
    expect(order.statusHistory.at(-1).status).toBe('confirmed');
  });
});
