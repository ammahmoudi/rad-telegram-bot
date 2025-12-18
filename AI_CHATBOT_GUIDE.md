# AI Chatbot Setup Guide

This guide will help you set up the Telegram AI chatbot with OpenRouter and Planka integration.

## Prerequisites

- Node.js `^20.19 || ^22.12 || >=24`
- A Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- An OpenRouter API key (from [openrouter.ai/keys](https://openrouter.ai/keys))
- A Planka instance (optional, for task management features)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd rastar-telegram-bot
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required: Telegram Bot Token from @BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Required for AI chat: OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Optional: Choose your AI model (default: claude-3.5-sonnet)
DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet

# Required: Encryption key (generate with provided command)
TOKEN_ENCRYPTION_KEY=your-32-byte-base64-key

# Required: Admin panel credentials
ADMIN_BASIC_AUTH_USER=admin
ADMIN_BASIC_AUTH_PASS=your-secure-password
```

### 3. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output to `TOKEN_ENCRYPTION_KEY` in your `.env` file.

### 4. Initialize Database

```bash
npm -w packages/shared exec prisma migrate dev
```

### 5. Start Development Server

```bash
npm run dev
```

This starts:
- **Telegram Bot** (connects to Telegram)
- **Link Portal** (http://localhost:8787) - for Planka account linking
- **Admin Panel** (http://localhost:3000) - for configuration
- **MCP Server** - Planka integration

## Features & Usage

### Basic Commands

- `/start` - Welcome message and help
- `/link_planka` - Connect your Planka account
- `/planka_status` - Check Planka connection
- `/planka_unlink` - Disconnect Planka

### AI Chat Commands

- `/new_chat` - Start a fresh conversation
- `/history` - View recent chat sessions  
- `/clear_chat` - Clear current conversation

### AI Chat Features

#### Natural Conversation
Just send any message (not a command) to chat with the AI:

```
User: Hello! Can you help me manage my tasks?
Bot: 🤖 Of course! I can help you manage your Planka tasks...
```

#### Context & Memory
The bot maintains conversation history:

```
User: What did we discuss earlier?
Bot: Earlier we talked about creating a new task...
```

#### Planka Integration
Once you link your Planka account, the AI can:

```
User: Show me all my boards
Bot: 📋 Your Planka Boards:
     1. Project Alpha (ID: abc123)
     2. Team Tasks (ID: def456)

User: Create a new card in Project Alpha for "Fix login bug"
Bot: ✅ Card created: Fix login bug
     ID: xyz789
```

The AI can:
- List all your boards
- Show cards in any board
- Create new cards with descriptions
- Update existing cards
- Search for cards across all boards
- Move cards between lists

## Admin Panel

Access at http://localhost:3000 (use credentials from `.env`)

### System Configuration

Configure:
- **Planka Base URL** - Your Planka instance URL
- **OpenRouter API Key** - Your AI API key
- **Default AI Model** - Choose from available models

### View Linked Accounts

See which users have connected their Planka accounts (tokens are encrypted).

## Available AI Models

Configure via admin panel or `.env`:

### Recommended Models

**Best for Reasoning & Complex Tasks:**
- `anthropic/claude-3.5-sonnet` (default, excellent tool use)
- `openai/gpt-4o` (very capable, multimodal)

**Fast & Cost-Effective:**
- `google/gemini-flash-1.5` (fast responses)
- `anthropic/claude-3-haiku` (quick, affordable)

**Open Source:**
- `meta-llama/llama-3.1-70b-instruct` (powerful, free)
- `meta-llama/llama-3.1-8b-instruct` (very fast)

Browse all models at [openrouter.ai/models](https://openrouter.ai/models)

## Telegram Bot Features

### Inline Queries (Future)
Type `@your_bot_name query` in any chat to search Planka cards.

### Group Chat Support
Add the bot to groups for team collaboration.

### Notifications (Future)
Get notified when cards are updated or assigned to you.

## Architecture

```
rastar-telegram-bot/
├── apps/
│   ├── telegram-bot/      # Main bot application
│   ├── link-portal/       # OAuth-like credential exchange
│   └── admin-panel/       # Configuration UI (Next.js)
├── packages/
│   ├── shared/            # Database, crypto, AI chat
│   └── mcp-planka/        # Planka MCP server
└── data/                  # SQLite database (created automatically)
```

## Security Notes

1. **Never commit `.env`** - It contains secrets
2. **Rotate `TOKEN_ENCRYPTION_KEY`** carefully - requires re-encrypting all stored tokens
3. **Use HTTPS in production** - Especially for the link portal
4. **Admin panel** - Protect with strong Basic Auth credentials
5. **API Keys** - Store in system config or environment, never in code

## Troubleshooting

### Bot not responding to messages

1. Check if OpenRouter API key is configured:
   ```bash
   # Check .env or visit admin panel
   ```

2. View bot logs:
   ```bash
   # In the terminal running npm run dev
   # Look for "[telegram-bot] AI chat message" logs
   ```

### "AI chat is not configured"

- Ensure `OPENROUTER_API_KEY` is set in `.env` OR
- Configure via admin panel at http://localhost:3000

### Planka tools not working

1. Link your Planka account:
   ```
   /link_planka
   ```

2. Check connection:
   ```
   /planka_status
   ```

3. Verify Planka Base URL in admin panel

### Database errors

Regenerate Prisma client:
```bash
npm run prisma:generate
```

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=...
OPENROUTER_API_KEY=...
TOKEN_ENCRYPTION_KEY=...
ADMIN_BASIC_AUTH_USER=...
ADMIN_BASIC_AUTH_PASS=...
LINK_PORTAL_BASE_URL=https://your-domain.com
DATABASE_PATH=/var/data/production.sqlite
```

### Build & Start

```bash
npm run build
npm start
```

### Reverse Proxy (Nginx)

```nginx
# Link Portal
location / {
    proxy_pass http://localhost:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Admin Panel
location /admin {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Cost Considerations

### OpenRouter Pricing

- **Claude 3.5 Sonnet**: ~$3/M input, ~$15/M output tokens
- **GPT-4o**: ~$2.50/M input, ~$10/M output tokens
- **Gemini Flash**: ~$0.075/M input, ~$0.30/M output tokens
- **Llama 3.1 70B**: ~$0.50/M input, ~$0.50/M output tokens

Average conversation: 2-5k tokens (~$0.01-0.05 per exchange with Claude)

### Managing Costs

1. Use cheaper models for simple tasks (Gemini Flash, Llama)
2. Trim conversation history (automatically done, max 30 messages)
3. Set usage limits in OpenRouter dashboard
4. Monitor costs via OpenRouter portal

## Contributing

Contributions welcome! Areas for improvement:

- Streaming responses for better UX
- User-specific model preferences
- Conversation export/import
- More MCP integrations (GitHub, Jira, etc.)
- Voice message support
- Image generation/analysis

## License

MIT
