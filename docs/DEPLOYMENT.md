# Deployment

## Local

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set a strong `WEBHOOK_SECRET`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

## Production

Use a persistent SQLite volume for a small single-instance MVP, or replace `src/database.js` with PostgreSQL for multi-instance deployment. Set `WEBHOOK_SECRET` through the hosting provider's secret manager.

The real printer vendor should call `/api/webhooks/badge-print` over HTTPS. Never commit `.env` or a real webhook secret.
