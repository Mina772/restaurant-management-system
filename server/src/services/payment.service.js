import Stripe from 'stripe';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';

let stripe = null;
if (env.stripe.secretKey) {
  stripe = new Stripe(env.stripe.secretKey, { apiVersion: '2024-06-20' });
}

export const isStripeEnabled = Boolean(stripe);

/**
 * Create a PaymentIntent for an order. Amount is converted to the
 * smallest currency unit (cents).
 */
export async function createPaymentIntent(order) {
  if (!stripe) throw AppError.badRequest('Payment processing is not configured');
  return stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: env.stripe.currency,
    metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
    automatic_payment_methods: { enabled: true },
  });
}

export async function refundPayment(paymentIntentId, amount) {
  if (!stripe) throw AppError.badRequest('Payment processing is not configured');
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount ? { amount: Math.round(amount * 100) } : {}),
  });
}

export function constructWebhookEvent(rawBody, signature) {
  if (!stripe) throw AppError.badRequest('Payment processing is not configured');
  return stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
}

export default stripe;
