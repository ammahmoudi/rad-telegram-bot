# Date & Time Handling with Dual Calendar Support

## Overview

The Planka MCP includes a comprehensive date/time system that automatically handles:

- **Timezone Conversion**: All dates are converted between UTC (Planka API) and Tehran timezone
- **Dual Calendar Output**: Every date is provided in BOTH Gregorian and Persian (Jalali/Shamsi) calendars
- **Flexible Input Parsing**: Accept various date formats without forcing specific formats
- **AI-Friendly**: Removes calendar conversion from AI reasoning - code handles it automatically

## Why Dual Calendar System?

**Problem**: AI models can make mistakes when:
- Converting between timezones
- Converting between Gregorian and Persian calendars
- Understanding "today", "yesterday" in different timezones
- Calculating Persian dates

**Solution**: The code automatically provides BOTH calendar systems in every response, so the AI can simply choose which one to show the user without doing any conversion itself.

## Default Configuration

- **Default Timezone**: `Asia/Tehran`
- **API Storage**: Planka stores all dates in UTC (Gregorian)
- **User Display**: Always shows both calendars
- **Input Formats**: Flexible - accepts multiple formats

## Date Types

### DualDate Interface

```typescript
interface DualDate {
  // For API usage
  iso: string;              // "2025-12-30T10:30:00.000Z" (UTC)
  timestamp: number;        // 1735558200000
  
  // Gregorian calendar
  gregorian: {
    date: string;           // "2025-12-30"
    dateTime: string;       // "2025-12-30 14:00:00"
    time: string;           // "14:00:00"
    timezone: string;       // "Asia/Tehran"
    formatted: string;      // "December 30, 2025 14:00"
  };
  
  // Persian (Jalali) calendar
  persian: {
    date: string;           // "1404-10-10"
    dateTime: string;       // "1404-10-10 14:00:00"
    time: string;           // "14:00:00"
    formatted: string;      // "۱۴۰۴/۱۰/۱۰ ساعت ۱۴:۰۰"
    year: number;           // 1404
    month: number;          // 10
    day: number;            // 10
  };
}
```

## Usage Examples

### 1. Parsing Flexible Date Inputs

```typescript
import { parseDate } from '../utils/date-time.js';

// Natural language
const today = parseDate('today');
const tomorrow = parseDate('tomorrow');
const yesterday = parseDate('yesterday');

// Relative dates
const inThreeDays = parseDate('in 3 days');
const twoHoursAgo = parseDate('2 hours ago');

// ISO dates
const specific = parseDate('2025-12-30');
const withTime = parseDate('2025-12-30T10:30:00Z');

// Persian dates
const persianDate = parseDate('1404/10/10');
const persianAlt = parseDate('1404-10-10');
```

### 2. Getting Current Date/Time

```typescript
import { now, today, yesterday, tomorrow } from '../utils/date-time.js';

// Current moment with time
const currentMoment = now();
console.log(currentMoment.gregorian.formatted);  // "December 30, 2025 14:30"
console.log(currentMoment.persian.formatted);     // "۱۴۰۴/۱۰/۱۰ ساعت ۱۴:۳۰"

// Start of today
const todayDate = today();

// Previous/next days
const yesterdayDate = yesterday();
const tomorrowDate = tomorrow();
```

### 3. Converting API Dates

```typescript
import { fromUTC, toUTC } from '../utils/date-time.js';

// Convert from Planka API (UTC) to Tehran time + dual calendar
const plankaDate = "2025-12-30T10:30:00.000Z";
const localDate = fromUTC(plankaDate);

console.log(localDate.gregorian.dateTime);  // "2025-12-30 14:00:00" (Tehran +3:30)
console.log(localDate.persian.dateTime);    // "1404-10-10 14:00:00"

// Convert from local time to UTC for API submission
const localInput = "2025-12-30 14:00:00";
const utcDate = toUTC(localInput);  // "2025-12-30T10:30:00.000Z"
```

### 4. Creating Daily Reports

```typescript
import { createDailyReportCard } from '../helpers/daily-reports.js';

// Create report for today (automatic)
const report1 = await createDailyReportCard(
  auth,
  'me',
  'Daily Report',
  'Completed feature X, worked on bug Y'
);

// Create report for specific date (flexible input)
const report2 = await createDailyReportCard(
  auth,
  'me',
  'Daily Report',
  'Retrospective report',
  'yesterday'  // or '2025-12-29' or '1404/10/09'
);

// Response includes dual calendar
console.log(report2.date.gregorian.formatted);
console.log(report2.date.persian.formatted);
```

### 5. Date Ranges

```typescript
import { getDateRange, formatDateRange } from '../utils/date-time.js';

// Get all dates between two dates
const dates = getDateRange('2025-12-01', '2025-12-07', {
  includeWeekends: false  // Excludes Thursday & Friday in Iran
});

// Format a date range
const range = formatDateRange('2025-12-01', '2025-12-07');
console.log(range.start.gregorian.date);  // "2025-12-01"
console.log(range.start.persian.date);    // "1404-09-11"
console.log(range.duration.days);         // 7
```

### 6. Checking Weekends (Iran)

```typescript
import { isWeekend } from '../utils/date-time.js';

const date = parseDate('2025-12-26');  // Friday
console.log(isWeekend(date));  // true (Friday is weekend in Iran)
```

## Helper Functions Updated

All date-related helper functions now use the dual calendar system:

### Daily Reports

- `createDailyReportCard()` - Returns `{ card, date: DualDate }`
- `getTodayDate()` - Returns `DualDate` instead of string
- `getYesterdayDate()` - Returns `DualDate` instead of string

### User Activity

- Functions filtering by date now accept flexible formats
- All date outputs include dual calendar

### Cards

- Card creation/update with due dates automatically converts
- Due date output always shows both calendars

## AI Usage Guidelines

### ❌ DON'T do this (AI doing conversion):

```typescript
// Bad: AI trying to convert dates
const persianDate = convertGregorianToPersian(gregorianDate);  // NO!
const tehranTime = convertUTCToTehran(utcTime);                // NO!
```

### ✅ DO this (Code handles conversion):

```typescript
// Good: Let the code handle it
const date = parseDate(userInput);

// Then AI just picks which calendar to show:
if (userPrefersPersian) {
  return `تاریخ: ${date.persian.formatted}`;
} else {
  return `Date: ${date.gregorian.formatted}`;
}
```

## Benefits

1. **Accuracy**: No more AI mistakes in date/time conversion
2. **Consistency**: All dates formatted uniformly
3. **Flexibility**: Users can input dates in any format
4. **Cultural Support**: Persian calendar natively supported
5. **Simplicity**: AI doesn't need to know timezone/calendar math
6. **Future-Proof**: Easy to add more calendars or timezones

## Technical Details

### Libraries Used

- **dayjs**: Modern date/time manipulation
  - `utc` plugin: UTC conversion
  - `timezone` plugin: Timezone support
  - `customParseFormat` plugin: Flexible parsing
- **jalaali-js**: Persian (Jalali/Shamsi) calendar conversion

### Timezone Handling

- Default: `Asia/Tehran` (UTC+3:30)
- All API dates stored in UTC
- Automatic conversion on input/output
- Configurable per function (optional parameter)

### Persian Calendar

- Official calendar of Iran
- Also known as Jalali or Shamsi calendar
- 12 months: فروردین to اسفند
- Year 1404 ≈ 2025 CE
- Digit conversion: `1404` → `۱۴۰۴`

## Migration Guide

### Updating Existing Code

If you have existing code using date strings:

**Before:**
```typescript
const today = new Date().toISOString().split('T')[0];
const card = await createCard(auth, listId, name, description, undefined, today);
```

**After:**
```typescript
const todayDate = today();
const card = await createCard(auth, listId, name, description, undefined, todayDate.iso);
// Also return the dual date to user
return { card, date: todayDate };
```

### For New Features

1. Always use `parseDate()` for user inputs
2. Always use `DualDate` in return types
3. Use `.iso` field when calling Planka API
4. Show both calendars to users (let AI choose which to emphasize)

## Future Enhancements

Potential additions:

- [ ] Hijri (Islamic) calendar support
- [ ] Multiple timezone support per user
- [ ] Business day calculations (Iran work week)
- [ ] Persian date validation
- [ ] Natural language parsing in Persian
- [ ] Recurring date patterns

## Examples in Production

### Creating a Daily Report

```typescript
// User says: "create report for yesterday"
const result = await createDailyReportCard(
  auth,
  'me',
  'Daily Report',
  'Worked on authentication module',
  'yesterday'
);

// Response to user includes both:
`✅ Daily report created:
📅 Date: ${result.date.gregorian.formatted}
📅 تاریخ: ${result.date.persian.formatted}
Card: ${result.cardName}
Board: ${result.boardName}`
```

### Filtering Cards by Date Range

```typescript
// User says: "show cards from last week"
const startDate = parseDate('7 days ago');
const endDate = parseDate('today');

const cards = await getCards(auth, {
  dueDate: {
    after: startDate.iso,
    before: endDate.iso
  }
});

// Show results with dual calendar
cards.forEach(card => {
  if (card.dueDate) {
    const due = fromUTC(card.dueDate);
    console.log(`${card.name}: ${due.gregorian.date} (${due.persian.date})`);
  }
});
```

## Testing

The date-time module includes comprehensive tests covering:

- Parsing various formats
- Timezone conversions
- Calendar conversions
- Edge cases (leap years, month boundaries)
- Natural language parsing
- Persian date validation

Run tests:
```bash
npm test src/utils/date-time.test.ts
```

## Support

For issues or questions about date/time handling:
1. Check this documentation first
2. Review examples in `src/utils/date-time.ts`
3. Check test cases in `src/utils/__tests__/date-time.test.ts`
4. Ensure dayjs and jalaali-js are installed

## Related Documentation

- [Helpers Guide](./HELPERS.md) - Overview of all helper functions
- [Name Resolution](./NAME_RESOLUTION.md) - Name/email resolution system
- [API Coverage](./API_COVERAGE.md) - Complete API reference
