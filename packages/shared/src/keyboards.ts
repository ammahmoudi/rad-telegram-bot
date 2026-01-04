/**
 * Shared keyboard builder for Telegram bot
 * Used by both telegram-bot and link-portal to ensure consistency
 */

export interface KeyboardTranslations {
  // Planka buttons
  'keyboards.my-cards': string;
  'keyboards.delayed-tasks': string;
  'keyboards.my-boards': string;
  'keyboards.create-task': string;
  'keyboards.planka-status': string;
  
  // Rastar buttons
  'keyboards.todays-menu': string;
  'keyboards.unselected-days': string;
  'keyboards.week-menu': string;
  'keyboards.select-lunch': string;
  'keyboards.rastar-status': string;
  
  // Settings
  'keyboards.settings': string;
}

/**
 * Build main menu keyboard based on connection status
 */
export function buildMainMenuKeyboard(
  plankaLinked: boolean,
  rastarLinked: boolean,
  translations: Partial<KeyboardTranslations>
) {
  const keyboard: string[][] = [];
  
  // Planka buttons
  if (plankaLinked) {
    keyboard.push([
      translations['keyboards.my-cards'] || '📇 My Cards',
      translations['keyboards.delayed-tasks'] || '⏰ Delayed Tasks',
    ]);
    keyboard.push([
      translations['keyboards.my-boards'] || '📋 My Boards',
      translations['keyboards.create-task'] || '➕ Create Task',
    ]);
  } else {
    keyboard.push([translations['keyboards.planka-status'] || '📋 Planka Status']);
  }
  
  // Rastar buttons
  if (rastarLinked) {
    keyboard.push([
      translations['keyboards.todays-menu'] || "🍽️ Today's Menu",
      translations['keyboards.unselected-days'] || '📅 Unselected Days',
    ]);
    keyboard.push([
      translations['keyboards.week-menu'] || '📆 Week Menu',
      translations['keyboards.select-lunch'] || '✅ Select Lunch',
    ]);
  } else {
    keyboard.push([translations['keyboards.rastar-status'] || '🍽️ Rastar Status']);
  }
  
  // Settings button (always visible)
  keyboard.push([translations['keyboards.settings'] || '⚙️ Settings']);
  
  return {
    keyboard,
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}
