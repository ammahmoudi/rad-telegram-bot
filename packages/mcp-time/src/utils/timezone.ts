const DEFAULT_TIMEZONE = 'Asia/Tehran';

export function getAppTimezone(): string {
  const value = process.env.APP_TIMEZONE?.trim();
  return value && value.length > 0 ? value : DEFAULT_TIMEZONE;
}
