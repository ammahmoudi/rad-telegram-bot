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

## Security notes
- Never paste passwords/tokens into chat.
- The link portal stores only the Planka access token (encrypted at rest) and never stores the password.
- Rotate `TOKEN_ENCRYPTION_KEY` only if you also rotate/re-encrypt stored secrets.

## AI Chat Features
The Telegram bot now includes AI-powered chat capabilities using OpenRouter:

### Setup
1. Get an API key from [openrouter.ai/keys](https://openrouter.ai/keys)
2. Configure via admin panel at `http://localhost:3000` or set in `.env`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet
   ```

### Features
- **Conversational AI**: Chat naturally with the bot
- **Memory**: Maintains conversation context across messages
- **Planka Integration**: AI can use tools to manage your Planka boards, lists, and cards
- **Session Management**: View chat history, start new conversations, or clear current chat

### Available Commands
- `/start` - Show welcome message and available commands
- `/new_chat` - Start a fresh conversation
- `/history` - View recent chat sessions
- `/clear_chat` - Clear current conversation
- `/link_planka` - Connect your Planka account (required for task management)
- `/planka_status` - Check Planka connection status
- `/planka_unlink` - Disconnect Planka account

### How It Works
1. Send any message to the bot (not a command) to start chatting
2. The AI maintains conversation history and context
3. If you've linked your Planka account, the AI can:
   - List your boards and cards
   - Create new cards
   - Update existing cards
   - Search across all your cards
   - Move cards between lists

### Model Options
Choose from various AI models via the admin panel:
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **Google**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Meta**: Llama 3.1 70B, Llama 3.1 8B

## What's next
- Add more MCP servers under `packages/` (e.g. lunch, accounts).
- Add streaming responses for better UX
- Implement user preferences for AI model selection
- Add conversation export feature
