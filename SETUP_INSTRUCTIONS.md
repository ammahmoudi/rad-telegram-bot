# Setup Instructions - Admin Panel

## IMPORTANT: Run these commands in order

### 1. Generate Prisma Client with New Schema

The Prisma types need to be regenerated after adding Admin and SystemMessage models.

```bash
# Navigate to shared package
cd packages/shared

# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_admin_and_system_messages
```

### 2. Install Dependencies (if needed)

The dependencies should already be installed, but if you see any errors:

```bash
# In admin-panel
cd apps/admin-panel
npm install

# In telegram-bot
cd apps/telegram-bot
npm install
```

### 3. Create Your First Admin User

```bash
# From project root
tsx scripts/create-admin.ts admin YourSecurePassword123
```

**Requirements:**
- Username: at least 3 characters
- Password: at least 8 characters

### 4. Test the Admin Panel Locally

```bash
# Terminal 1: Start admin panel
cd apps/admin-panel
npm run dev
# Runs on http://localhost:3002

# Terminal 2: Start telegram bot (optional, to test integration)
cd apps/telegram-bot
npm run dev
```

### 5. Login and Configure

1. Visit http://localhost:3002/auth/login
2. Login with your admin credentials
3. Edit system prompts (Persian + English)
4. Edit welcome messages (Persian + English)
5. Click save

### 6. Test in Telegram

1. Send `/start` to your bot - should show custom welcome message
2. Send a regular message - AI should use custom system prompt
3. Test in both languages (fa/en)

## Troubleshooting

### "Property 'admin' does not exist on type 'PrismaClient'"

**Solution:** You need to regenerate Prisma client:
```bash
cd packages/shared
npx prisma generate
```

### "Property 'systemMessage' does not exist on type 'PrismaClient'"

**Solution:** Same as above - regenerate Prisma client.

### "Cannot find module '@rad/shared'"

**Solution:** Build the shared package:
```bash
cd packages/shared
npm run build
```

### Login doesn't work

**Solution:** Make sure you created an admin user:
```bash
tsx scripts/create-admin.ts admin password
```

Then check the database:
```bash
cd packages/shared
npx prisma studio
```

Look for your admin in the `Admin` table.

### Changes not appearing in bot

1. For system prompts: Start a NEW chat session (old sessions cache the prompt)
2. For welcome message: Run `/start` again
3. Check server logs for database errors

## Next Steps After Testing

Once everything works locally:

1. Push changes to GitHub
2. Deploy to Dokploy (follow [DOKPLOY_STEP_BY_STEP.md](DOKPLOY_STEP_BY_STEP.md))
3. Run migrations in production
4. Create production admin user
5. Configure messages via admin panel

## Files Created/Modified

### New Files:
- `apps/admin-panel/src/auth.ts`
- `apps/admin-panel/src/app/api/auth/[...nextauth]/route.ts`
- `apps/admin-panel/src/app/auth/login/page.tsx`
- `apps/admin-panel/src/app/dashboard/page.tsx`
- `apps/admin-panel/src/app/dashboard/SystemPromptForm.tsx`
- `apps/admin-panel/src/app/dashboard/WelcomeMessageForm.tsx`
- `apps/admin-panel/src/app/dashboard/LogoutButton.tsx`
- `apps/admin-panel/src/app/api/system-messages/route.ts`
- `scripts/create-admin.ts`
- `ADMIN_PANEL_GUIDE.md`
- `ADMIN_PANEL_IMPLEMENTATION.md`
- `SETUP_INSTRUCTIONS.md` (this file)

### Modified Files:
- `packages/shared/prisma/schema.prisma` - Added Admin and SystemMessage models
- `apps/telegram-bot/src/config/system-prompt.ts` - Added getSystemPrompt() function
- `apps/telegram-bot/src/handlers/ai-message.ts` - Use getSystemPrompt()
- `apps/telegram-bot/src/handlers/commands.ts` - Fetch custom welcome message

## Summary

✅ Run `npx prisma generate` and `npx prisma migrate dev`
✅ Create admin user with `tsx scripts/create-admin.ts`
✅ Start admin panel and test locally
✅ Configure system prompts and welcome messages
✅ Test in Telegram bot
✅ Deploy to production when ready

**All code is complete and ready!** Just run the setup commands above to get started.
