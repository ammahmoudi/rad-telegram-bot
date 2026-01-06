# Character Packs System - Complete Guide

## 🎭 Overview

The Character Packs system allows admins to create multiple personality profiles for the Telegram bot and assign specific packs to individual users. This provides ultimate flexibility in customizing the bot's behavior for different audiences.

## ✨ Features

### 1. **Multiple Character Packs**
- Create unlimited character packs
- Each pack contains complete bot personality (system prompt, character, welcome message)
- Separate content for Persian and English
- One pack can be set as default for all users

### 2. **User-Specific Assignments**
- Assign custom packs to specific users
- Users without assignments get the default pack
- Track who assigned which pack and when

### 3. **User Management**
- View all Telegram users with profile images
- See user names, usernames, and IDs
- Check Planka/Rastar connection status
- Manage user roles (user, manager, admin)
- Assign/change character packs per user

### 4. **Role System** (Future-ready)
- User roles: `user`, `manager`, `admin`
- Prepared for future role-based features
- Roles stored and displayed in admin panel

## 📊 Database Schema

### CharacterPack
```prisma
model CharacterPack {
  id              String   @id
  name            String   // "Friendly Assistant", "Professional Bot", etc.
  description     String?  // Optional description
  isDefault       Boolean  // Only one pack should be default
  createdAt       BigInt
  updatedAt       BigInt
  
  messages        PackMessage[]
  userAssignments UserPackAssignment[]
}
```

### PackMessage
```prisma
model PackMessage {
  id           String  @id
  packId       String  // FK to CharacterPack
  language     String  // 'fa' or 'en'
  messageType  String  // 'welcome', 'system_prompt', 'character'
  content      String  @db.Text
  updatedAt    BigInt
  
  // Unique per pack + language + type
  @@unique([packId, language, messageType])
}
```

### UserPackAssignment
```prisma
model UserPackAssignment {
  id              String  @id
  telegramUserId  String  // Telegram user ID (unique)
  packId          String  // FK to CharacterPack
  assignedAt      BigInt
  assignedBy      String? // Admin username who made the assignment
  
  @@unique([telegramUserId]) // One pack per user
}
```

### TelegramUser
```prisma
model TelegramUser {
  id              String  @id  // Telegram user ID
  firstName       String?
  lastName        String?
  username        String?
  photoUrl        String? // Telegram profile photo URL
  role            String  @default("user") // user, manager, admin
  lastSeenAt      BigInt?
  createdAt       BigInt
  updatedAt       BigInt
}
```

## 🚀 Setup Instructions

### Step 1: Run Migrations

```bash
cd packages/shared
npx prisma generate
npx prisma migrate dev --name add_character_packs
```

### Step 2: Create Default Pack

```bash
# This migrates existing SystemMessages to a default pack
tsx scripts/create-default-pack.ts
```

**What this does:**
- Creates a "Default Pack" with `isDefault: true`
- Copies all existing SystemMessages to the new pack
- All users without assignments will use this pack

### Step 3: Access Admin Panel

```bash
cd apps/admin-panel
npm run dev
```

Visit http://localhost:3002 and login.

## 🎯 Using the Admin Panel

### Dashboard
- Overview of pack count, user count
- Quick access to all sections
- Shows current default pack

### Character Packs (`/packs`)
- **List Packs**: See all character packs
- **Create Pack**: 
  - Give it a name and description
  - Option to copy from default pack
  - Edit messages after creation
- **Edit Pack**: Modify system prompt, character, welcome messages
- **Set Default**: Mark a pack as default
- **Delete Pack**: Remove unused packs

### Users (`/users`)
- **User List**: Table with all users
  - Profile images
  - Names and usernames
  - Telegram IDs
  - Connection status (Planka/Rastar)
  - Current pack assignment
  - User roles
  - Last seen time
- **Assign Pack**: Click user → select pack from dropdown
- **Change Role**: Set user as admin/manager/user

## 💡 Use Cases

### Example 1: Professional vs Casual
**Scenario**: Different tone for work users vs casual users

1. Create "Professional Bot" pack:
   - Formal language
   - Business-focused responses
   - Structured formatting

2. Create "Casual Assistant" pack:
   - Friendly tone
   - Emojis and casual language
   - Relaxed formatting

3. Assign packs:
   - Work team members → Professional Bot
   - Friends/testers → Casual Assistant
   - Everyone else → Default

### Example 2: Language-Specific Personalities
**Scenario**: Different personalities for Persian vs English users

1. Create "Persian Native" pack:
   - Rich Persian system prompt
   - Cultural references
   - Formal Persian greetings

2. Create "English Native" pack:
   - Native English expressions
   - Western cultural context
   - Casual English greetings

### Example 3: VIP Users
**Scenario**: Special treatment for premium users

1. Create "VIP Assistant" pack:
   - More detailed responses
   - Priority handling
   - Exclusive features mentioned

2. Assign to VIP users

### Example 4: Testing New Personalities
**Scenario**: Test new AI behavior before rollout

1. Create "Experimental Pack"
2. Assign to yourself or test users
3. Test thoroughly
4. Once satisfied, set as default or assign to more users

## 🔧 API Routes

### GET /api/packs
List all character packs.

**Response:**
```json
{
  "packs": [
    {
      "id": "pack_123",
      "name": "Default Pack",
      "description": "...",
      "isDefault": true,
      "messages": [...],
      "_count": { "userAssignments": 5 }
    }
  ]
}
```

### POST /api/packs
Create a new character pack.

**Request:**
```json
{
  "name": "New Pack",
  "description": "Optional description",
  "copyFromDefault": true
}
```

**Response:**
```json
{
  "pack": {
    "id": "pack_456",
    "name": "New Pack",
    ...
  }
}
```

### POST /api/packs/[id]/messages
Update pack messages.

**Request:**
```json
{
  "messages": {
    "system_prompt_fa": "...",
    "system_prompt_en": "...",
    "welcome_fa": "...",
    "welcome_en": "...",
    "character_fa": "...",
    "character_en": "..."
  }
}
```

### POST /api/users/[id]/assign-pack
Assign a pack to a user.

**Request:**
```json
{
  "packId": "pack_123"
}
```

### POST /api/users/[id]/role
Change user role.

**Request:**
```json
{
  "role": "manager"
}
```

## 🤖 How It Works in the Bot

### 1. User Sends Message

```typescript
// Bot receives message
const telegramUserId = ctx.from.id;
const userLanguage = getUserLanguage(telegramUserId);
```

### 2. Fetch User's Pack

```typescript
// Check if user has custom pack
const assignment = await prisma.userPackAssignment.findUnique({
  where: { telegramUserId }
});

// If yes, use their pack; otherwise use default
const packId = assignment?.packId || defaultPack.id;
```

### 3. Get System Prompt from Pack

```typescript
const systemPrompt = await prisma.packMessage.findUnique({
  where: {
    packId_language_messageType: {
      packId,
      language: userLanguage,
      messageType: 'system_prompt'
    }
  }
});
```

### 4. AI Uses Pack-Specific Prompt

```typescript
const response = await aiClient.chat(history, {
  systemPrompt: systemPrompt.content
});
```

### 5. Update User Info

```typescript
// Track user activity and profile
await prisma.telegramUser.upsert({
  where: { id: telegramUserId },
  update: {
    firstName: ctx.from.first_name,
    username: ctx.from.username,
    lastSeenAt: Date.now()
  },
  create: {
    id: telegramUserId,
    firstName: ctx.from.first_name,
    username: ctx.from.username,
    role: 'user',
    lastSeenAt: Date.now()
  }
});
```

## 📝 Migration from Old System

The old system used `SystemMessage` model with global messages. The new system:

1. **Backwards Compatible**: Bot checks packs first, falls back to SystemMessage
2. **Migration Script**: `create-default-pack.ts` copies SystemMessages to default pack
3. **Gradual Transition**: Can keep both systems until fully migrated

## 🎨 UI Components

### Pack Card
```tsx
- Pack name and description
- Default badge if isDefault
- Message count (💬)
- User count (👥)
- Edit/Delete buttons
```

### User Row
```tsx
- Profile image (or initial)
- Name + username
- Role badge (colored)
- Connection badges (Planka/Rastar)
- Assigned pack name
- Last seen date
- Edit button
```

### Dashboard Stats
```tsx
- 🎭 Pack count
- 👥 User count
- ✨ Default pack name
```

## 🔒 Security & Best Practices

1. **Admin-Only Access**: All pack/user management routes require authentication
2. **Default Pack Protection**: Prevent deleting default pack if users depend on it
3. **Pack Validation**: Ensure all required messages exist before saving
4. **User Privacy**: Don't expose sensitive user data in API responses
5. **Role Checks**: Verify admin permissions before role changes

## 🚧 Future Enhancements

- **Pack Templates**: Pre-made personality templates
- **A/B Testing**: Randomly assign packs to compare performance
- **Pack Versioning**: Track changes and rollback if needed
- **Analytics**: Track which packs perform better
- **Pack Marketplace**: Share packs with community
- **Rich Editor**: WYSIWYG editor for pack messages
- **Preview Mode**: Test pack before assigning
- **Bulk Assignment**: Assign pack to multiple users at once
- **Role-Based Auto-Assignment**: Auto-assign packs based on user role

## 📖 Related Documentation

- [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) - Initial setup guide
- [ADMIN_PANEL_GUIDE.md](./ADMIN_PANEL_GUIDE.md) - Admin panel user guide
- [ADMIN_PANEL_IMPLEMENTATION.md](./ADMIN_PANEL_IMPLEMENTATION.md) - Technical implementation details

## 🆘 Troubleshooting

### Pack not appearing for user
1. Check if pack is properly created in database
2. Verify user assignment exists
3. Check if default pack is set
4. Bot may be caching - restart bot

### User info not showing
1. User must interact with bot first (send a message)
2. Check TelegramUser table in database
3. Profile photos require Telegram API access

### Messages not updating
1. Clear bot's message cache
2. Verify messages saved to PackMessage table
3. Check language and messageType match

## 💻 Development Tips

### Test Pack Assignments
```typescript
// Create test pack
const testPack = await prisma.characterPack.create({
  data: { name: 'Test', isDefault: false }
});

// Assign to yourself
await prisma.userPackAssignment.create({
  data: {
    telegramUserId: 'YOUR_TELEGRAM_ID',
    packId: testPack.id,
    assignedBy: 'admin'
  }
});
```

### Query User's Effective Pack
```typescript
const effectivePack = await getUser EffectivePack(telegramUserId);
console.log(`User is using: ${effectivePack.name}`);
```

### Debug Pack Loading
```typescript
// Add logging in getSystemPrompt()
console.log('[pack] User:', telegramUserId);
console.log('[pack] Assignment:', assignment);
console.log('[pack] Pack ID:', packId);
console.log('[pack] Message:', message?.content.substring(0, 100));
```

---

**Ready to create legendary character packs!** 🎭✨
