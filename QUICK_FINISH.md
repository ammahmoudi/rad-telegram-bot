# Quick Finish - Migration Commands

## 🎯 Goal: Complete the migration in 30 minutes

Use these VS Code Find & Replace commands to finish commands.ts quickly.

---

## Step 1: Open commands.ts

`apps/telegram-bot/src/handlers/commands.ts`

---

## Step 2: Find & Replace (Use Regex)

### Replace 1: Remove getUserI18n declarations

**Find (Regex ON):**  
```regex
const t = getUserI18n\(language\);
```

**Replace:**  
```
// i18n via ctx.t()
```

**Expected matches:** ~10

---

### Replace 2: Convert t() to ctx.t()

**Find (Regex ON):**  
```regex
([^a-zA-Z])t\('
```

**Replace:**  
```
$1ctx.t('
```

**Expected matches:** ~150

**Note:** This finds ` t('` preceded by space, comma, or bracket and replaces with ` ctx.t('`

---

### Replace 3: Convert dot notation to dash notation (Part 1 - planka)

**Find (Regex ON):**  
```regex
ctx\.t\('planka\.([a-z_]+)
```

**Replace:**  
```
ctx.t('planka-$1
```

**Expected matches:** ~40

---

### Replace 4: Convert dot notation to dash notation (Part 2 - rastar)

**Find (Regex ON):**  
```regex
ctx\.t\('rastar\.([a-z_]+)
```

**Replace:**  
```
ctx.t('rastar-$1
```

**Expected matches:** ~30

---

### Replace 5: Convert dot notation to dash notation (Part 3 - errors)

**Find (Regex ON):**  
```regex
ctx\.t\('([a-z_]+)\.([a-z_]+)\.([a-z_]+)
```

**Replace:**  
```
ctx.t('$1-$2-$3
```

**Expected matches:** ~20

---

### Replace 6: Convert dot notation to dash notation (Part 4 - two levels)

**Find (Regex ON):**  
```regex
ctx\.t\('([a-z_]+)\.([a-z_]+)
```

**Replace:**  
```
ctx.t('$1-$2
```

**Expected matches:** ~50

---

### Replace 7: Fix underscores in keys

**Find (Regex ON):**  
```regex
ctx\.t\('([a-z-]+)_([a-z_-]+)
```

**Replace:**  
```
ctx.t('$1-$2
```

**Run this 3-4 times** until no more matches (handles multiple underscores)

---

### Replace 8: Update Context type signature

**Find:**  
```
): Context
```

**Replace:**  
```
): BotContext
```

---

## Step 3: Manual Fixes

After regex, scan through the file for:

1. Any remaining `t('...` that should be `ctx.t('...`
2. Any keys with underscores that should be dashes
3. Any function signatures still using `Context` instead of `BotContext`

**Quick scan command in VS Code:**
- Press `Ctrl+F`
- Search for: ` t('`
- Should find **0 matches** when done

---

## Step 4: Build and Test

```bash
cd apps/telegram-bot

# Build
npm run build

# Check for errors
# Should see: "✓ Built successfully"

# If errors, fix them first

# Run bot
node dist/index.new.js
```

---

## Step 5: Test in Telegram

```
/start          # Should show welcome
Send "hello"    # AI should respond (may not work if ai-message.ts not migrated)
/settings       # Should show settings
Send 5 fast msgs # Rate limiter should warn
```

---

## Alternative: Automated Script

If regex is too complex, run this Node.js script:

```javascript
// fix-commands.js
const fs = require('fs');

const file = 'apps/telegram-bot/src/handlers/commands.ts';
let content = fs.readFileSync(file, 'utf8');

// Remove getUserI18n declarations
content = content.replace(/const t = getUserI18n\(language\);/g, '// i18n via ctx.t()');

// Convert t() to ctx.t()
content = content.replace(/([^a-zA-Z])t\('/g, '$1ctx.t(\'');

// Convert dots to dashes in keys
content = content.replace(/ctx\.t\('([a-z_-]+)\.([a-z_-]+)\.([a-z_-]+)/g, 'ctx.t(\'$1-$2-$3');
content = content.replace(/ctx\.t\('([a-z_-]+)\.([a-z_-]+)/g, 'ctx.t(\'$1-$2');

// Convert underscores to dashes (run multiple times)
for (let i = 0; i < 5; i++) {
  content = content.replace(/ctx\.t\('([a-z-]+)_([a-z_-]+)/g, 'ctx.t(\'$1-$2');
}

// Fix Context type
content = content.replace(/\): Context/g, '): BotContext');

fs.writeFileSync(file, content);
console.log('✓ Fixed commands.ts');
```

Run it:
```bash
node fix-commands.js
```

---

## Expected Result

After completion, commands.ts should have:

- ✅ No `getUserI18n` calls
- ✅ All `t('...')` converted to `ctx.t('...')`
- ✅ All translation keys using dashes: `planka-already-linked`
- ✅ All function signatures using `BotContext`
- ✅ No compilation errors

---

## Then Do ai-message.ts

Same process:

1. Remove `getUserI18n` import
2. Replace `t('` with `ctx.t('`
3. Convert `nested.keys` to `flat-keys`
4. Update `Context` to `BotContext`
5. Add streaming with `streamMessage()`

---

## Verification

```bash
# Search for old patterns
grep -r "getUserI18n" apps/telegram-bot/src/handlers/
# Should return: 0 results

grep -r "import.*Context.*from 'grammy'" apps/telegram-bot/src/handlers/
# Should see BotContext imports only

# Build
npm run build
# Should succeed with no errors
```

---

## Time Estimate

- commands.ts regex: **5 minutes**
- Manual fixes: **5 minutes**
- Testing build: **2 minutes**
- ai-message.ts: **10 minutes**
- Final testing: **10 minutes**

**Total: ~30 minutes** ✅

Then you're **DONE!** 🎉
