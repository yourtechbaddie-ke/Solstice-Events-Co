import express from 'express';
import crypto from 'node:crypto';
import { db } from './database.js';
import { verifyWebhook } from './webhook-verification.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-solstice-secret';

app.use(express.static('public'));
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); } }));

function newId(prefix) { return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; }

app.get('/api/attendees', (_req, res) => {
  res.json({ attendees: db.prepare('SELECT attendee_code,name,status,print_job_id,updated_at FROM attendees ORDER BY attendee_code').all() });
});

app.get('/api/attendee-status', (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'code is required' });
  const attendee = db.prepare('SELECT attendee_code,name,status,print_job_id,updated_at FROM attendees WHERE attendee_code=?').get(code);
  if (!attendee) return res.status(404).json({ error: 'Attendee not found' });
  res.json({ attendee });
});

app.post('/api/check-in', (req, res) => {
  const code = String(req.body?.attendeeCode || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'attendeeCode is required' });
  const attendee = db.prepare('SELECT * FROM attendees WHERE attendee_code=?').get(code);
  if (!attendee) return res.status(404).json({ error: 'Attendee not found' });
  if (attendee.status === 'CHECKED_IN') return res.json({ status: 'checked_in', attendee: attendee.name, message: 'Attendee is already checked in.' });
  if (attendee.status === 'PRINT_PENDING') return res.json({ status: 'pending', attendee: attendee.name, jobId: attendee.print_job_id, message: 'Badge is already being printed.' });

  const jobId = newId('JOB');
  const eventId = newId('PRINT');
  const update = db.prepare("UPDATE attendees SET status='PRINT_PENDING',print_job_id=?,print_event_id=?,updated_at=CURRENT_TIMESTAMP WHERE attendee_code=? AND status IN ('NOT_CHECKED_IN','PRINT_FAILED')");
  const result = update.run(jobId, eventId, code);
  if (!result.changes) return res.status(409).json({ error: 'Check-in changed concurrently; please retry.' });
  res.status(202).json({ status: 'pending', attendee: attendee.name, jobId, eventId, message: 'Badge printing started. Waiting for verified webhook confirmation.' });
});

app.post('/api/webhooks/badge-print', (req, res) => {
  const signature = req.get('X-Webhook-Signature');
  const timestamp = req.get('X-Webhook-Timestamp');
  if (!verifyWebhook({ rawBody: req.rawBody || '', signature, timestamp, secret: WEBHOOK_SECRET })) {
    return res.status(401).json({ error: 'Invalid or expired webhook signature' });
  }

  const { eventId, jobId, attendeeCode, status } = req.body || {};
  if (!eventId || !jobId || !attendeeCode || !status) return res.status(400).json({ error: 'Incomplete webhook' });
  const code = String(attendeeCode).toUpperCase();
  if (db.prepare('SELECT event_id FROM processed_webhooks WHERE event_id=?').get(eventId)) return res.json({ ok: true, duplicate: true });

  const attendee = db.prepare('SELECT * FROM attendees WHERE attendee_code=?').get(code);
  if (!attendee) return res.status(404).json({ error: 'Attendee not found' });
  if (attendee.print_job_id !== jobId) return res.status(409).json({ error: 'Webhook job does not match the current print job' });
  if (status !== 'completed') return res.status(202).json({ ok: true, ignored: true, reason: 'Only completed print jobs can check an attendee in.' });

  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO processed_webhooks(event_id,job_id,attendee_code) VALUES(?,?,?)').run(eventId, jobId, code);
    db.prepare("UPDATE attendees SET status='CHECKED_IN',updated_at=CURRENT_TIMESTAMP WHERE attendee_code=? AND status='PRINT_PENDING'").run(code);
  });
  transaction();
  res.json({ ok: true, status: 'checked_in', attendee: attendee.name });
});

app.get('/health', (_req, res) => res.json({ ok: true, service: 'solstice-events-co' }));

app.listen(PORT, () => console.log(`Solstice Events Co. MVP running on http://localhost:${PORT}`));
