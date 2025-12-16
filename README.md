# rastar-telegram-bot

TypeScript monorepo that contains:
- Telegram bot (per-user linking)
- Planka MCP server (per-user tokens)
- Link portal web app (collects Planka credentials on HTTPS page, exchanges for token; does **not** store passwords)

## Prerequisites
- Node.js 20+ (works on Node 22)
- A reachable Link Portal URL (for real users: HTTPS)

## Setup
1. Copy environment:
   - Copy `.env.example` to `.env` and fill values.
2. Install deps:
   - `npm install`
3. Run dev:
   - `npm run dev`

## Security notes
- Never paste passwords/tokens into chat.
- The link portal stores only the Planka access token (encrypted at rest) and never stores the password.
- Rotate `TOKEN_ENCRYPTION_KEY` only if you also rotate/re-encrypt stored secrets.

## What’s next
- Add more MCP servers under `packages/` (e.g. lunch, accounts).
- Add AI orchestration to the Telegram bot (model + tool routing) once core integrations are stable.
