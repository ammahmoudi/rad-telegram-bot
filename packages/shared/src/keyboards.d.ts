/**
 * Shared keyboard builder for Telegram bot
 * Used by both telegram-bot and link-portal to ensure consistency
 */
export interface KeyboardTranslations {
    'keyboards.my-cards': string;
    'keyboards.delayed-tasks': string;
    'keyboards.my-boards': string;
    'keyboards.create-task': string;
    'keyboards.planka-status': string;
    'keyboards.todays-menu': string;
    'keyboards.unselected-days': string;
    'keyboards.week-menu': string;
    'keyboards.select-lunch': string;
    'keyboards.rastar-status': string;
    'keyboards.clear-chat': string;
    'keyboards.settings': string;
}
/**
 * Build main menu keyboard based on connection status
 */
export declare function buildMainMenuKeyboard(plankaLinked: boolean, rastarLinked: boolean, translations: Partial<KeyboardTranslations>): {
    keyboard: string[][];
    resize_keyboard: boolean;
    one_time_keyboard: boolean;
};
