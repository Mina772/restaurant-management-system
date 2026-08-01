import Coupon from '../src/models/Coupon.js';

/**
 * Pure unit tests for coupon evaluation logic (no DB required — we build
 * in-memory documents via `new Coupon(...)`).
 */
describe('Coupon.evaluate', () => {
  const userId = '507f1f77bcf86cd799439011';
  const future = new Date(Date.now() + 86400000);
  const past = new Date(Date.now() - 86400000);

  test('applies a percentage discount capped by maxDiscount', () => {
    const c = new Coupon({ code: 'P20', type: 'percent', value: 20, maxDiscount: 10, expiresAt: future });
    const res = c.evaluate(userId, 100);
    expect(res.valid).toBe(true);
    expect(res.discount).toBe(10); // 20% of 100 = 20, capped at 10
  });

  test('applies a fixed discount not exceeding subtotal', () => {
    const c = new Coupon({ code: 'F5', type: 'fixed', value: 5, expiresAt: future });
    expect(c.evaluate(userId, 3).discount).toBe(3);
    expect(c.evaluate(userId, 20).discount).toBe(5);
  });

  test('rejects expired coupons', () => {
    const c = new Coupon({ code: 'OLD', type: 'fixed', value: 5, expiresAt: past });
    expect(c.evaluate(userId, 20).valid).toBe(false);
  });

  test('rejects when below minimum order', () => {
    const c = new Coupon({ code: 'MIN', type: 'fixed', value: 5, minOrder: 50, expiresAt: future });
    expect(c.evaluate(userId, 20).valid).toBe(false);
  });

  test('respects per-user usage limit', () => {
    const c = new Coupon({
      code: 'ONE',
      type: 'fixed',
      value: 5,
      perUserLimit: 1,
      usedBy: [userId],
      expiresAt: future,
    });
    expect(c.evaluate(userId, 20).valid).toBe(false);
  });
});
