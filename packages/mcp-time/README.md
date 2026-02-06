# MCP Time Server

A Model Context Protocol (MCP) server that provides accurate time and date operations with Persian calendar support.

## Features

- ⏰ **Current Time**: Get the actual current date/time
- 📅 **Relative Dates**: Calculate dates like "today", "yesterday", "2 days ago"
- 🌍 **Timezone Support**: Work with different timezones (default from APP_TIMEZONE, fallback Asia/Tehran)
- 📆 **Persian Calendar**: Full Jalali calendar support for Persian users
- ➕ **Time Arithmetic**: Add/subtract durations
- 🔄 **Format Conversion**: Multiple output formats (ISO, Unix, Persian, etc.)

## Why This Exists

AI models don't always have accurate knowledge of the current date. This server solves that by providing tools that:

1. Query the actual system time
2. Perform accurate date calculations
3. Handle Persian calendar conversions
4. Parse natural language time expressions

## Tools

### `get_current_time`
Returns the current date/time in various formats.

**Parameters:**
- `format` (optional): `iso`, `unix`, `jalali`, `formatted`
- `timezone` (optional): IANA timezone (default: `APP_TIMEZONE` or `Asia/Tehran`)

**Example:**
```json
{
  "tool": "get_current_time",
  "arguments": { "format": "jalali", "timezone": "Asia/Tehran" }
}
```

### `calculate_relative_date`
Calculate dates relative to now.

**Parameters:**
- `expression` (required): e.g., "today", "yesterday", "2 days ago", "next week"
- `format` (optional): Output format
- `timezone` (optional): Target timezone (default: `APP_TIMEZONE` or `Asia/Tehran`)

**Example:**
```json
{
  "tool": "calculate_relative_date",
  "arguments": { "expression": "2 days ago", "format": "iso" }
}
```

### `add_duration`
Add or subtract time from a date.

**Parameters:**
- `base_time` (required): Starting time (ISO format or "now")
- `duration` (required): Duration to add (e.g., "2h", "3d", "-1w")
- `format` (optional): Output format
- `timezone` (optional): Target timezone (default: `APP_TIMEZONE` or `Asia/Tehran`)

### `parse_time_range`
Get start and end dates for ranges like "this week", "last month".

**Parameters:**
- `range` (required): e.g., "today", "this week", "last month", "this year"
- `format` (optional): Output format
- `timezone` (optional): Target timezone (default: `APP_TIMEZONE` or `Asia/Tehran`)

## Integration

This server is automatically started with the Telegram bot and provides time tools to the AI assistant.
