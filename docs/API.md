# API

## POST /api/check-in

Request:

```json
{"attendeeCode":"SOL-001"}
```

First scan returns `202` and `status: pending`.

A duplicate scan while pending returns `200` with the existing job ID. A scan after completion returns `200` with `status: checked_in`.

## GET /api/attendee-status?code=SOL-001

Returns the current attendee state.

## POST /api/webhooks/badge-print

Headers:

```text
X-Webhook-Timestamp
X-Webhook-Signature
```

Body:

```json
{"eventId":"PRINT-E1","jobId":"JOB-1","attendeeCode":"SOL-001","status":"completed"}
```

Returns `401` for invalid/expired signatures, `409` for a job mismatch, and `200` for a successfully processed or safely replayed event.
