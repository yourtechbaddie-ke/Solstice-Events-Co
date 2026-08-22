# Webhook Verification

The vendor signs the exact request body with HMAC-SHA256 using a shared secret.

```text
signature = HMAC-SHA256(WEBHOOK_SECRET, timestamp + "." + rawBody)
```

The sender includes:

```text
X-Webhook-Timestamp: <unix seconds>
X-Webhook-Signature: sha256=<hex digest>
```

The receiver rejects missing, expired, malformed, or mismatched signatures. Signature comparison uses a timing-safe comparison.

The receiver then checks event ID uniqueness, attendee existence, job ownership, and completion status before changing state.

## Production integration

The production adapter must expose the vendor's raw request bytes to the verification function. Do not parse and re-stringify JSON before verification because JSON whitespace and key ordering can change the signed bytes.
