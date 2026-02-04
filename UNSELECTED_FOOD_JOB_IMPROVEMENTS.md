# Unselected Food Reminder Job - Current State & Improvements

## Current Implementation

### Job Details
- **Name**: `unselected-food-reminder`
- **Display Name**: 🍽️ Food Selection Reminder
- **Schedule**: `0 22 * * *` (10 PM daily, Asia/Tehran timezone)
- **Location**: `packages/job-scheduler/src/jobs/unselected-food-reminder.job.ts`

### Current Features

1. **Checks tomorrow's food selection only** (not multiple future days)
2. **Configuration options**:
   - `includeRecommendations` (default: true) - Enable AI recommendations
   - `silentNotifications` (default: false) - Silent notifications
   - `messageTemplate` (optional) - Custom message template

3. **Recommendation System** (Basic):
   - Analyzes user's past selection history
   - Finds favorite foods (most frequently selected)
   - Respects user preferences (preferred/avoided foods)
   - Uses simple rule-based logic

4. **Message Format** (Persian only):
   ```
   ⏰ یادآوری انتخاب غذا
   
   سلام! 👋
   فردا غذا انتخاب نکردی! ⚠️
   
   🍽️ گزینه‌های موجود:
   📅 2026-02-05: غذای یک | غذای دو
   
   💡 پیشنهاد ما:
   ➤ غذای یک
   📝 بر اساس تاریخچه انتخاب‌های شما
   ```

## Suggested Improvements

### 1. Multi-Day Checking (High Priority)
**Current**: Only checks tomorrow
**Improvement**: Check next N days (configurable)

```typescript
export interface FoodReminderConfig {
  includeRecommendations: boolean;
  silentNotifications: boolean;
  messageTemplate?: string;
  daysAhead: number; // NEW: Check next N days (default: 3)
  minUnselectedDays: number; // NEW: Only notify if ≥ X days unselected (default: 1)
  [key: string]: unknown;
}
```

### 2. AI-Enhanced Recommendations (Medium Priority)
**Current**: Has AI prompt generator (`createRecommendationPrompt`) but not used
**Improvement**: Add option to use OpenRouter AI for better recommendations

```typescript
export interface FoodReminderConfig {
  includeRecommendations: boolean;
  useAiForRecommendations: boolean; // NEW: Use AI instead of heuristics
  aiModel: string; // NEW: AI model to use (default: 'meta-llama/llama-3.1-8b-instruct:free')
  silentNotifications: boolean;
  messageTemplate?: string;
  daysAhead: number;
  minUnselectedDays: number;
  [key: string]: unknown;
}
```

**Implementation**:
- Call OpenRouter API with `createRecommendationPrompt()`
- Parse AI response to get recommendations with reasons
- Fall back to heuristic recommendations if AI fails
- Cache AI responses to avoid repeated calls

### 3. User Preference Learning (Low Priority)
**Current**: Basic preference support (preferred/avoided foods)
**Improvement**: Learn from selection patterns

- Track selection frequency by day of week
- Identify patterns (e.g., always chicken on Mondays)
- Use pattern data to improve recommendations
- Store in database: `UserFoodPreferences` table

### 4. Interactive Buttons (High Priority)
**Current**: Plain text message
**Improvement**: Add inline buttons for quick actions

```typescript
// Add to notification
replyMarkup: {
  inline_keyboard: [
    [
      { text: '✅ انتخاب کن', callback_data: `food_select_${date}_${scheduleId}` },
      { text: '🔄 گزینه‌های دیگر', callback_data: `food_alternatives_${date}` }
    ],
    [
      { text: '📅 مشاهده هفته', callback_data: 'rastar_view_week' },
      { text: '⏭️ بعداً', callback_data: 'food_remind_later' }
    ]
  ]
}
```

### 5. Smart Scheduling (Medium Priority)
**Current**: Fixed 10 PM schedule
**Improvement**: User-specific reminder times

- Allow users to set preferred reminder time
- Store in database: `UserSettings.foodReminderTime`
- Schedule individual reminders per user timezone
- Default to 10 PM if not set

### 6. Reminder Cadence Options (Low Priority)
**Current**: Daily check
**Improvement**: Configurable frequency

```typescript
export interface FoodReminderConfig {
  reminderFrequency: 'daily' | 'every-other-day' | 'weekly'; // NEW
  reminderDays: number[]; // NEW: Days of week (0=Sunday) for weekly
  // ... rest
}
```

### 7. Multi-Language Support (High Priority)
**Current**: Persian only
**Improvement**: Detect user language from pack/settings

```typescript
private buildMessage(
  user: UserFoodStatus,
  recommendations: any[],
  language: 'fa' | 'en' = 'fa'
): string {
  if (language === 'en') {
    return this.buildEnglishMessage(user, recommendations);
  }
  return this.buildPersianMessage(user, recommendations);
}
```

## Recommended Implementation Order

### Phase 1 (Week 1)
1. ✅ Multi-day checking (daysAhead config)
2. ✅ Interactive buttons for quick food selection
3. ✅ Multi-language support (English + Persian)

### Phase 2 (Week 2)
4. ✅ AI-enhanced recommendations with OpenRouter
5. ✅ Better error handling and retry logic
6. ✅ Job execution history dashboard

### Phase 3 (Week 3)
7. ✅ User-specific reminder times
8. ✅ Preference learning system
9. ✅ Reminder frequency options

## Code Locations

### Main Files
- **Job Implementation**: `packages/job-scheduler/src/jobs/unselected-food-reminder.job.ts`
- **Food Service**: `packages/rastar-service/src/food-service.ts`
- **Recommendation Engine**: `packages/rastar-service/src/recommendation-engine.ts`
- **Job Registry**: `packages/job-scheduler/src/job-registry.ts`

### Related Functions
- `getUsersWithUnselectedTomorrow()` - Get users with unselected tomorrow
- `getUsersWithUnselectedDays(daysAhead)` - Get users with unselected future days
- `generateRecommendations()` - Generate food recommendations
- `createRecommendationPrompt()` - Create AI prompt (not yet used)
- `formatRecommendationsMessage()` - Format recommendations

## Testing

### Manual Testing
```bash
# Trigger job manually via admin panel
POST /api/jobs
{
  "action": "trigger",
  "jobName": "unselected-food-reminder"
}
```

### Test Scenarios
1. User with unselected tomorrow → Should receive notification
2. User with all days selected → Should not receive notification
3. User with no Rastar token → Should be skipped
4. Rastar API error → Should continue with other users
5. With recommendations enabled → Should show recommendations
6. With recommendations disabled → Should show basic message

## Configuration Examples

### Example 1: Daily check, 3 days ahead, with AI
```json
{
  "includeRecommendations": true,
  "useAiForRecommendations": true,
  "aiModel": "meta-llama/llama-3.1-8b-instruct:free",
  "daysAhead": 3,
  "minUnselectedDays": 1,
  "silentNotifications": false
}
```

### Example 2: Weekly reminder on Sundays
```json
{
  "includeRecommendations": true,
  "daysAhead": 7,
  "minUnselectedDays": 2,
  "reminderFrequency": "weekly",
  "reminderDays": [0],
  "silentNotifications": false
}
```

### Example 3: No recommendations, just list
```json
{
  "includeRecommendations": false,
  "daysAhead": 1,
  "minUnselectedDays": 1,
  "silentNotifications": true
}
```
