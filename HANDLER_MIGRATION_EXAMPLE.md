# Handler Migration Example

## Example: Migrating ai-message.ts

### Before (Old i18n)

```typescript
import { getUserI18n } from '../i18n.js';
import { getUserLanguage } from '@rad/shared';

export async function handleAIMessage(ctx: any, message: string) {
  const telegramUserId = String(ctx.from?.id);
  
  // Get user language
  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  
  try {
    // Process AI request
    const response = await generateAIResponse(message);
    
    // Send response
    await ctx.reply(
      `<b>${t('chat.ai-response')}</b>\n\n${response}`
    );
  } catch (error) {
    // Handle error
    const errorMessage = t('errors.generic.title') + '\n' +
                        t('errors.generic.description');
    await ctx.reply(errorMessage);
  }
}
```

### After (New i18n with ctx.t)

```typescript
// No i18n imports needed! ctx already has i18n
import { streamMessage, replyWithTopic } from '../bot.js';

export async function handleAIMessage(ctx: BotContext, message: string) {
  const telegramUserId = String(ctx.from?.id);
  
  try {
    // Use streaming for live updates
    await streamMessage(ctx, async function* () {
      for await (const chunk of generateAIResponse(message)) {
        yield chunk;
      }
    });
    
  } catch (error) {
    // Error message with i18n
    const errorMessage = 
      `<b>${ctx.t('errors-generic-title')}</b>\n\n` +
      ctx.t('errors-generic-description') + '\n' +
      ctx.t('errors-try-again');
    
    // Use topic-aware reply
    await replyWithTopic(ctx, errorMessage);
  }
}
```

### Key Changes

1. **Removed imports:**
   - ❌ `getUserI18n`
   - ❌ `getUserLanguage`
   
2. **Added imports:**
   - ✅ `streamMessage` (for live updates)
   - ✅ `replyWithTopic` (for topic support)

3. **Translation calls:**
   - ❌ `t('errors.generic.title')` → ✅ `ctx.t('errors-generic-title')`
   - ❌ `t('chat.ai-response')` → ✅ `ctx.t('chat-ai-response')`

4. **Streaming:**
   - ❌ `await ctx.reply(response)` → ✅ `await streamMessage(ctx, generator)`

5. **Topic support:**
   - ❌ `ctx.reply()` → ✅ `replyWithTopic(ctx, ...)`

---

## Complete Migration Pattern

### Step 1: Update Imports

```typescript
// Remove these:
import { getUserI18n } from '../i18n.js';
import { getUserLanguage } from '@rad/shared';

// Add these:
import { replyWithTopic, streamMessage, sendTypingAction } from '../bot.js';
import type { BotContext } from '../bot.js';
```

### Step 2: Update Function Signatures

```typescript
// Before
async function myHandler(ctx: any) {

// After
async function myHandler(ctx: BotContext) {
```

### Step 3: Replace getUserI18n Pattern

```typescript
// Before
const language = await getUserLanguage(String(ctx.from?.id));
const t = getUserI18n(language);
const message = t('welcome.title', { name: 'John' });

// After
const message = ctx.t('welcome-title', { name: 'John' });
```

### Step 4: Update Translation Keys

```typescript
// Before (nested with dots)
t('planka.already_linked')
t('rastar.token_expires', { hours: 24 })
t('errors.rate_limit.title')

// After (flat with dashes)
ctx.t('planka-already-linked')
ctx.t('rastar-token-expires', { hours: 24 })
ctx.t('errors-rate-limit-title')
```

### Step 5: Use Topic-Aware Helpers

```typescript
// Before
await ctx.reply(message);

// After (respects topic context)
await replyWithTopic(ctx, message);
```

### Step 6: Add Streaming for AI Responses

```typescript
// Before (all at once)
const response = await generateResponse();
await ctx.reply(response);

// After (live streaming)
await streamMessage(ctx, async function* () {
  for await (const chunk of generateResponse()) {
    yield chunk;
  }
});
```

---

## Find & Replace Regex

Use these in VS Code to speed up migration:

### 1. Find getUserI18n Pattern
```regex
const\s+language\s*=\s*await\s+getUserLanguage\([^)]+\);\s*const\s+t\s*=\s*getUserI18n\(language\);
```
**Replace with:**
```typescript
// Language auto-detected by i18n plugin
```

### 2. Find Translation Calls
```regex
t\('([^']+)'\)
```
**Replace with:**
```typescript
ctx.t('$1')
```

### 3. Find Nested Keys
```regex
ctx\.t\('([^-']+)\.([^']+)'\)
```
**Replace with:**
```typescript
ctx.t('$1-$2')
```

### 4. Find Simple Replies
```regex
ctx\.reply\(([^)]+)\)
```
**Review each and consider:**
```typescript
replyWithTopic(ctx, $1)
```

---

## Testing Your Migration

### 1. Type Check
```bash
cd apps/telegram-bot
npm run build
```

### 2. Test Each Command

```bash
# Test translations
/start  # English
/settings → Language → فارسی
/start  # Persian

# Test AI streaming
"Tell me a story"  # Should stream live

# Test topic support (if in topic chat)
"test message"  # Should reply in same topic

# Test error handling
"break something"  # Should show translated error
```

### 3. Check Logs

```bash
npm run dev

# Look for:
[grammy] ✓ i18n plugin created (en, fa)
[grammy] ✓ Rate limiter loaded
[bot] ← User 12345: Hello
[bot] → Processed in 45ms
```

---

## Common Issues

### Issue: "Cannot find name 'BotContext'"

**Fix:** Import BotContext type
```typescript
import type { BotContext } from '../bot.js';
```

### Issue: "Property 't' does not exist on type 'Context'"

**Fix:** Use BotContext instead of Context
```typescript
// Before
async function handler(ctx: Context) {

// After
async function handler(ctx: BotContext) {
```

### Issue: "Translation key not found"

**Fix:** Check the .ftl file for exact key name
```bash
# Search in locales/en.ftl
grep "welcome-title" locales/en.ftl
```

### Issue: "Rate limiter triggers too often"

**Fix:** Adjust rate limiter config in bot.ts
```typescript
bot.use(limit({
  timeFrame: 3000,  // Increase to 3 seconds
  limit: 5,         // Allow 5 messages
}));
```

---

## Migration Checklist

For each handler file:

- [ ] Remove `getUserI18n` import
- [ ] Remove `getUserLanguage` import  
- [ ] Add `BotContext` import
- [ ] Add helper imports (`replyWithTopic`, `streamMessage`, etc.)
- [ ] Update function signature to use `BotContext`
- [ ] Replace all `getUserI18n()` calls
- [ ] Update all translation keys from `nested.keys` to `flat-keys`
- [ ] Replace `ctx.reply()` with `replyWithTopic()` where needed
- [ ] Add streaming for AI responses
- [ ] Test the handler
- [ ] Check for TypeScript errors

---

## Files to Migrate (Priority Order)

### High Priority (Core Features)
1. ✅ `bot.ts` - Already migrated
2. 🔄 `handlers/ai-message.ts` - Main AI handler
3. 🔄 `handlers/commands.ts` - Bot commands
4. 🔄 `menus/index.ts` - Menu system

### Medium Priority (Status/Settings)
5. 🔄 `handlers/planka-status.ts`
6. 🔄 `handlers/rastar-status.ts`
7. 🔄 `handlers/settings.ts`

### Low Priority (Other)
8. 🔄 `handlers/ai-button-callback.ts`
9. 🔄 `conversations/index.ts`
10. 🔄 `index.new.ts` - Entry point

---

**Quick Win:** Start with `handlers/commands.ts` - smallest file, easiest to test! ✨
