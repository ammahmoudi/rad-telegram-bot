# Admin Panel Guide

## Overview

The admin panel allows you to customize the Telegram bot's behavior without changing code. You can:

- ✏️ **Edit System Prompts** - Customize how the AI behaves for both Persian and English users
- 📝 **Edit Welcome Messages** - Customize the /start command message
- 🌐 **Multi-language Support** - Separate configuration for Persian (fa) and English (en)

## Features

### 1. System Prompt Management

The system prompt controls the AI's personality, behavior, and capabilities. You can:

- Define AI character and tone
- Set response formatting rules
- Configure button behavior
- Add custom guidelines

**Location:** Dashboard → System Prompt card

### 2. Welcome Message Management

The welcome message is shown when users run `/start`. You can:

- Customize the greeting
- Highlight key features
- Add custom instructions
- Use HTML formatting

**Location:** Dashboard → Welcome Message card

**Available placeholder:**
- `{name}` - Will be replaced with the user's first name

### 3. Authentication

The admin panel uses NextAuth for secure authentication:

- Username/password login
- Session-based authentication (30-day sessions)
- Bcrypt password hashing
- Protected routes (automatic redirect to login)

## Setup Instructions

### 1. Create Admin User

Before you can login, create an admin user:

```bash
# From the root of the project
cd apps/admin-panel
tsx ../../scripts/create-admin.ts <username> <password>

# Example:
tsx ../../scripts/create-admin.ts admin MySecurePassword123
```

**Requirements:**
- Username: minimum 3 characters
- Password: minimum 8 characters

### 2. Run Database Migrations

Make sure the database schema is up to date:

```bash
cd packages/shared
npx prisma migrate dev
```

### 3. Start the Admin Panel

```bash
cd apps/admin-panel
npm run dev
```

The admin panel will be available at: `http://localhost:3002`

### 4. Login

1. Navigate to `http://localhost:3002/auth/login`
2. Enter your username and password
3. Click "ورود" (Login)
4. You'll be redirected to the dashboard

## Using the Admin Panel

### Editing System Prompts

1. Login to the dashboard
2. Find the **"سیستم پرامپت"** (System Prompt) card
3. Edit the Persian (فارسی) and English versions
4. Click **"ذخیره تغییرات"** (Save Changes)
5. Changes take effect immediately for new conversations

**Tips:**
- Keep the button format examples intact (`###BUTTONS_START###`)
- Maintain the tool calling guidelines
- Test changes with both languages
- Use Markdown for formatting

### Editing Welcome Messages

1. Login to the dashboard
2. Find the **"پیام خوش‌آمدگویی"** (Welcome Message) card
3. Edit the Persian (فارسی) and English versions
4. Use `{name}` placeholder for user's first name
5. Use HTML tags for formatting: `<b>Bold</b>`, `<i>Italic</i>`, `<code>Code</code>`
6. Click **"ذخیره تغییرات"** (Save Changes)

**Example:**

```html
👋 <b>Hi {name}!</b>

🤖 I'm Rad, your AI assistant for Planka and Rastar!

<b>Quick Start:</b>
• /link_planka - Connect Planka
• /link_rastar - Connect Rastar
• Just send me a message to chat!

Let's get started! 🚀
```

### Logging Out

Click the **"خروج"** (Logout) button in the top right corner.

## Database Structure

### Admin Table

```prisma
model Admin {
  id           String @id
  username     String @unique
  passwordHash String
  createdAt    BigInt
  updatedAt    BigInt
}
```

### SystemMessage Table

```prisma
model SystemMessage {
  id           String  @id
  language     String  // 'fa' or 'en'
  messageType  String  // 'welcome', 'system_prompt', 'character'
  content      String  @db.Text
  isActive     Boolean @default(true)
  updatedAt    BigInt

  @@unique([language, messageType])
}
```

## API Routes

### POST /api/system-messages

Save or update system messages.

**Request Body:**
```json
{
  "messageType": "system_prompt" | "welcome" | "character",
  "fa": "Persian content",
  "en": "English content"
}
```

**Response:**
```json
{
  "success": true
}
```

**Authentication:** Required (session cookie)

### GET/POST /api/auth/[...nextauth]

NextAuth authentication endpoints (handled automatically).

## How It Works

### System Prompt Flow

1. Admin edits system prompt in admin panel
2. Content saved to `SystemMessage` table (separate records for fa/en)
3. Telegram bot calls `getSystemPrompt(language)` before each AI chat
4. If custom prompt exists, use it; otherwise use default
5. AI receives the appropriate prompt based on user's language

### Welcome Message Flow

1. Admin edits welcome message in admin panel
2. Content saved to `SystemMessage` table
3. User sends `/start` command to bot
4. Bot fetches custom message from database (based on user's language)
5. Bot replaces `{name}` with user's first name
6. If no custom message, bot uses default hardcoded message

## Deployment

The admin panel is deployed as a separate service in Dokploy:

**Service Name:** `admin-panel`

**Configuration:**
- Build Context: `/` (repository root)
- Dockerfile Path: `apps/admin-panel/Dockerfile`
- Port: 3002
- Environment: Use `.env.production`

**Environment Variables Required:**
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=<your-secret>
```

See [DOKPLOY_STEP_BY_STEP.md](../DOKPLOY_STEP_BY_STEP.md) for full deployment instructions.

## Security Notes

- ✅ Passwords are hashed with bcrypt (strength: 10)
- ✅ Sessions use JWT with 30-day expiry
- ✅ All admin routes are protected (redirect to login)
- ✅ NEXTAUTH_SECRET should be cryptographically random
- ⚠️ Use HTTPS in production
- ⚠️ Keep NEXTAUTH_SECRET secure (never commit to git)

## Troubleshooting

### Can't Login

1. Make sure you created an admin user:
   ```bash
   tsx scripts/create-admin.ts admin YourPassword
   ```

2. Check database connection:
   ```bash
   cd packages/shared
   npx prisma studio
   ```

3. Verify `Admin` table exists and has records

### Changes Not Appearing

1. Check that `isActive` is `true` in `SystemMessage` table
2. For system prompts: Start a NEW conversation (old sessions cache prompts)
3. For welcome messages: Run `/start` again
4. Check browser console and server logs for errors

### "Unauthorized" Error

1. Make sure you're logged in (check for session cookie)
2. Try logging out and back in
3. Clear browser cookies if session is corrupted

## Development Tips

### Testing Changes Locally

1. Create test admin user
2. Login to admin panel
3. Edit messages
4. Test in Telegram bot
5. Iterate quickly!

### Adding New Message Types

To add a new message type (e.g., `error_template`):

1. Update Prisma schema enum (if using enum)
2. Add new card in dashboard UI
3. Create form component
4. Update API route to handle new type
5. Update bot code to fetch and use new message

### Custom Validations

Add validation in the API route:

```typescript
if (messageType === 'system_prompt' && !content.includes('###BUTTONS_START###')) {
  return NextResponse.json(
    { error: 'System prompt must include button format' },
    { status: 400 }
  );
}
```

## Support

For issues or questions:

1. Check this README
2. Review [DOKPLOY_STEP_BY_STEP.md](../DOKPLOY_STEP_BY_STEP.md)
3. Check server logs
4. Review database with `npx prisma studio`
