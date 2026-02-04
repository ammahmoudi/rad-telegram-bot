/**
 * Shared keyboard builder for Telegram bot
 * Used by both telegram-bot and link-portal to ensure consistency
 */
/**
 * Build main menu keyboard based on connection status
 */
export function buildMainMenuKeyboard(plankaLinked, rastarLinked, translations) {
    const keyboard = [];
    // Chat management button first (important action)
    keyboard.push([
        translations['keyboards.clear-chat'] || '🗑️ Clear Chat',
    ]);
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
    }
    else {
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
    }
    else {
        keyboard.push([translations['keyboards.rastar-status'] || '🍽️ Rastar Status']);
    }
    // Settings button (always visible at bottom)
    keyboard.push([translations['keyboards.settings'] || '⚙️ Settings']);
    return {
        keyboard,
        resize_keyboard: true,
        one_time_keyboard: false,
    };
}
