# Solstice Events Co. — Async Check-In MVP

A production-style MVP for the Solstice Events Co. conference check-in problem. The kiosk starts an asynchronous badge-print job, shows **Printing…**, and only marks an attendee **Checked In** after a verified printer webhook.

## What this solves

- Synchronous printer API removal → asynchronous print-job workflow.
- Duplicate QR scans → idempotent `PRINT_PENDING` state and one active print job per attendee.
- Untrusted callbacks → HMAC-SHA256 signature verification.
- Webhook replay → processed event IDs.
- Out-of-order confirmations → webhook `jobId` must match the attendee's current print job.
- UI accuracy → `CHECKED_IN` is only reached after a valid `completed` webhook.

## Stack

- Node.js + Express
- SQLite via better-sqlite3
- Vanilla HTML/CSS/JavaScript kiosk
- Node Web Crypto/crypto HMAC-SHA256
- Node test runner

## Run locally

```bash
npm install
cp .env.example .env
# Set WEBHOOK_SECRET in .env
npm start
```

Open `http://localhost:3000`.

Run tests:

```bash
npm test
```

## Demo attendees

- `SOL-001` — Amina Wanjiku
- `SOL-002` — Brian Otieno
- `SOL-003` — Claire Njeri

## Webhook contract

Headers:

```text
X-Webhook-Timestamp: <unix seconds>
X-Webhook-Signature: sha256=<hex digest>
```

Signature input:

```text
timestamp + "." + rawBody
```

Payload:

```json
{
  "eventId": "PRINT-E1",
  "jobId": "JOB-1",
  "attendeeCode": "SOL-001",
  "status": "completed"
}
```

See [`docs/WEBHOOK-VERIFICATION.md`](docs/WEBHOOK-VERIFICATION.md) for the security rules.

## Architecture

```text
QR Kiosk
   ↓
Check-In API
   ↓
Atomic/idempotent state transition
   ↓
Print Request / Queue
   ↓
Badge Printer
   ↓
Signed Webhook
   ↓
HMAC + Timestamp Verification
   ↓
Replay + Job Matching Checks
   ↓
CHECKED_IN
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/API.md`](docs/API.md), and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Production note

The MVP includes a deterministic mock printer adapter. The production integration should replace that adapter with the selected badge-printer vendor's queue/API while preserving webhook verification, idempotency, replay protection, and job matching.
