import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtp.host) {
    logger.warn('SMTP not configured — emails will be logged instead of sent');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

function wrap(title, body) {
  return `<!DOCTYPE html><html><body style="font-family:Segoe UI,Arial,sans-serif;background:#f6f7f9;padding:24px">
    <div style="max-width:520px;margin:auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.06)">
      <h1 style="color:#e11d48;font-size:22px;margin:0 0 16px">🍽️ Restaurant</h1>
      <h2 style="font-size:18px;color:#111">${title}</h2>
      <div style="color:#444;font-size:15px;line-height:1.6">${body}</div>
      <p style="color:#999;font-size:12px;margin-top:32px">If you didn't request this, you can safely ignore this email.</p>
    </div></body></html>`;
}

export async function sendEmail({ to, subject, html }) {
  const tx = getTransporter();
  if (!tx) {
    logger.info(`[email:mock] to=${to} subject="${subject}"`);
    return { mocked: true };
  }
  const info = await tx.sendMail({ from: env.smtp.from, to, subject, html });
  logger.info(`Email sent: ${info.messageId}`);
  return info;
}

export function sendVerificationEmail(user, token) {
  const url = `${env.clientUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your email',
    html: wrap(
      'Confirm your email address',
      `<p>Hi ${user.name}, welcome aboard! Please confirm your email:</p>
       <p><a href="${url}" style="display:inline-block;background:#e11d48;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none">Verify Email</a></p>
       <p style="font-size:12px;color:#888">Or paste this link: ${url}</p>`
    ),
  });
}

export function sendPasswordResetEmail(user, token) {
  const url = `${env.clientUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html: wrap(
      'Reset your password',
      `<p>Hi ${user.name}, we received a request to reset your password.</p>
       <p><a href="${url}" style="display:inline-block;background:#e11d48;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none">Reset Password</a></p>
       <p style="font-size:12px;color:#888">This link expires in 30 minutes.</p>`
    ),
  });
}

export function sendOrderConfirmationEmail(user, order) {
  return sendEmail({
    to: user.email,
    subject: `Order ${order.orderNumber} confirmed`,
    html: wrap(
      'Your order is confirmed 🎉',
      `<p>Thanks ${user.name}! We received your order <b>${order.orderNumber}</b>.</p>
       <p>Total: <b>$${order.total.toFixed(2)}</b> · Type: ${order.type}</p>
       <p>You can track its status live in your account.</p>`
    ),
  });
}
