# rastar-telegram-bot

TypeScript monorepo that contains:
- Telegram bot (per-user linking)
- Planka MCP server (per-user tokens)
- Link portal web app (collects Planka credentials on HTTPS page, exchanges for token; does **not** store passwords)
- Next.js admin panel (Basic Auth) to view linked users (never shows decrypted tokens)

## Prerequisites
- Node.js `^20.19 || ^22.12 || >=24` (required for Prisma 7)
- A reachable Link Portal URL (for real users: HTTPS)

## Setup
1. Copy environment:
   - Copy `.env.example` to `.env` and fill values.
2. Install deps:
   - `npm install`
3. Initialize the database (Prisma migration):
   - `npm -w packages/shared exec prisma migrate dev --name core`
4. Run dev:
   - `npm run dev`

## Admin panel
- Runs at `http://localhost:3000` in `npm run dev`.
- Protected by HTTP Basic Auth via `ADMIN_BASIC_AUTH_USER` / `ADMIN_BASIC_AUTH_PASS`.

## Telegram webhook mode
- Default is long polling.
- Set `TELEGRAM_WEBHOOK_URL` to enable webhook mode. The bot will call `setWebhook()` on startup.
- Set `TELEGRAM_WEBHOOK_PORT` for the local listener port (behind your reverse proxy).

## Security notes
- Never paste passwords/tokens into chat.
- The link portal stores only the Planka access token (encrypted at rest) and never stores the password.
- Rotate `TOKEN_ENCRYPTION_KEY` only if you also rotate/re-encrypt stored secrets.

## What’s next
- Add more MCP servers under `packages/` (e.g. lunch, accounts).
- Add AI orchestration to the Telegram bot (model + tool routing) once core integrations are stable.
