const DEFAULT_TIMEZONE = 'Asia/Tehran';

export function getAppTimezone(): string {
  const value = process.env.APP_TIMEZONE?.trim();
  return value && value.length > 0 ? value : DEFAULT_TIMEZONE;
}

export function formatDateYmd(date: Date, timezone: string = getAppTimezone()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addDaysToYmd(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDateForLocale(
  dateStr: string,
  locale: string,
  timezone: string = getAppTimezone(),
  options?: Intl.DateTimeFormatOptions
): string {
  const [year, month, day] = dateStr.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    ...options,
  }).format(date);
}
