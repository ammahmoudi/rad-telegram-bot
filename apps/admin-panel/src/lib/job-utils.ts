// Common timezones with user-friendly labels
export const TIMEZONES = [
  { value: 'Asia/Tehran', labelKey: 'iranTehran', label: 'Iran (Tehran)' },
  { value: 'UTC', labelKey: 'utc', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', labelKey: 'usEastern', label: 'US Eastern' },
  { value: 'America/Chicago', labelKey: 'usCentral', label: 'US Central' },
  { value: 'America/Denver', labelKey: 'usMountain', label: 'US Mountain' },
  { value: 'America/Los_Angeles', labelKey: 'usPacific', label: 'US Pacific' },
  { value: 'Europe/London', labelKey: 'ukLondon', label: 'UK (London)' },
  { value: 'Europe/Paris', labelKey: 'euParis', label: 'Central Europe (Paris)' },
  { value: 'Europe/Berlin', labelKey: 'deBerlin', label: 'Germany (Berlin)' },
  { value: 'Europe/Istanbul', labelKey: 'trIstanbul', label: 'Turkey (Istanbul)' },
  { value: 'Asia/Dubai', labelKey: 'uaeDubai', label: 'UAE (Dubai)' },
  { value: 'Asia/Kolkata', labelKey: 'indiaKolkata', label: 'India (Kolkata)' },
  { value: 'Asia/Shanghai', labelKey: 'chinaShanghai', label: 'China (Shanghai)' },
  { value: 'Asia/Tokyo', labelKey: 'japanTokyo', label: 'Japan (Tokyo)' },
  { value: 'Asia/Seoul', labelKey: 'koreaSeoul', label: 'South Korea (Seoul)' },
  { value: 'Asia/Singapore', labelKey: 'singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', labelKey: 'australiaSydney', label: 'Australia (Sydney)' },
  { value: 'Pacific/Auckland', labelKey: 'nzAuckland', label: 'New Zealand (Auckland)' },
];

// Helper function to generate slug from displayName
export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}
