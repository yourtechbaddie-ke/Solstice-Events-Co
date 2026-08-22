import { signWebhook } from './webhook-verification.js';

export async function simulateCompletedPrint({ baseUrl, attendeeCode, jobId, eventId, secret }) {
  const payload = { eventId, jobId, attendeeCode, status: 'completed', printedAt: new Date().toISOString() };
  const signed = signWebhook(payload, secret);
  const response = await fetch(`${baseUrl}/api/webhooks/badge-print`, {
    method: 'POST',
    headers: {'Content-Type':'application/json','X-Webhook-Timestamp':signed.timestamp,'X-Webhook-Signature':signed.signature},
    body: signed.rawBody
  });
  return { status: response.status, body: await response.json() };
}
