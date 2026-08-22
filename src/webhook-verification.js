import crypto from 'node:crypto';

export function verifyWebhook({ rawBody, signature, timestamp, secret, toleranceMs = 300000 }) {
  if (!signature || !timestamp || !/^\d+$/.test(timestamp)) return false;
  const age = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (age > toleranceMs) return false;
  const provided = signature.replace(/^sha256=/, '');
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function signWebhook(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const rawBody = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return { rawBody, timestamp: String(timestamp), signature: `sha256=${signature}` };
}
