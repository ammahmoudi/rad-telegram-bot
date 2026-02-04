/**
 * Notification Templates
 * Pre-built message templates for common notifications
 */

export interface FoodReminderData {
  userName?: string;
  date: string;
  foodOptions: Array<{ name: string; description?: string }>;
  recommendation?: { name: string; reason: string };
}

export interface WeeklyReportData {
  userName?: string;
  weekRange: string;
  selectionsCount: number;
  totalDays: number;
  missedDays: string[];
}

/**
 * Food reminder template (Persian)
 */
export function foodReminderTemplate(data: FoodReminderData): string {
  const greeting = data.userName 
    ? `سلام ${data.userName}! 👋` 
    : 'سلام! 👋';
  
  const lines = [
    '⏰ <b>یادآوری انتخاب غذا</b>',
    '',
    greeting,
    `برای <b>${data.date}</b> هنوز غذا انتخاب نکردی! ⚠️`,
    '',
    '🍽️ <b>گزینه‌های موجود:</b>',
  ];

  for (const food of data.foodOptions) {
    lines.push(`   • ${food.name}`);
    if (food.description) {
      lines.push(`     <i>${food.description}</i>`);
    }
  }

  if (data.recommendation) {
    lines.push('');
    lines.push('💡 <b>پیشنهاد ما:</b>');
    lines.push(`   ➤ <b>${data.recommendation.name}</b>`);
    lines.push(`   📝 ${data.recommendation.reason}`);
  }

  lines.push('');
  lines.push('برای انتخاب غذا پیام بده یا به پنل رستار مراجعه کن! 📲');

  return lines.join('\n');
}

/**
 * Weekly report template (Persian)
 */
export function weeklyReportTemplate(data: WeeklyReportData): string {
  const greeting = data.userName 
    ? `سلام ${data.userName}! 👋` 
    : 'سلام! 👋';

  const selectionRate = data.totalDays > 0 
    ? Math.round((data.selectionsCount / data.totalDays) * 100)
    : 0;

  const statusEmoji = selectionRate === 100 ? '🌟' : selectionRate >= 80 ? '👍' : '📊';

  const lines = [
    '📊 <b>گزارش هفتگی غذا</b>',
    '',
    greeting,
    '',
    `📅 <b>هفته:</b> ${data.weekRange}`,
    `${statusEmoji} <b>درصد انتخاب:</b> ${selectionRate}%`,
    `✅ <b>روزهای انتخاب شده:</b> ${data.selectionsCount} از ${data.totalDays}`,
  ];

  if (data.missedDays.length > 0) {
    lines.push('');
    lines.push('❌ <b>روزهای انتخاب نشده:</b>');
    for (const day of data.missedDays) {
      lines.push(`   • ${day}`);
    }
  }

  if (selectionRate === 100) {
    lines.push('');
    lines.push('🎉 آفرین! این هفته همه روزها رو انتخاب کردی!');
  } else if (selectionRate < 50) {
    lines.push('');
    lines.push('💪 سعی کن هفته بعد زودتر انتخاب کنی!');
  }

  return lines.join('\n');
}

/**
 * Generic notification template
 */
export function genericNotificationTemplate(
  title: string,
  body: string,
  footer?: string
): string {
  const lines = [
    `📢 <b>${title}</b>`,
    '',
    body,
  ];

  if (footer) {
    lines.push('');
    lines.push(`<i>${footer}</i>`);
  }

  return lines.join('\n');
}
