/**
 * AI-Suggested Dynamic Buttons Utility
 * 
 * Allows the AI to suggest contextual action buttons that appear below messages.
 * The AI can suggest buttons by including a special XML tag in its response.
 */

import { InlineKeyboard } from 'grammy';

export interface AiButton {
  text: string;
  action: string;
  data?: Record<string, any>;
  message?: string; // For send_message action: the message to send to AI
}

export interface ParsedAiResponse {
  messageText: string;
  buttons: AiButton[];
}

/**
 * Parse AI response and extract button suggestions
 * 
 * Format: <buttons>[{"text":"...", "action":"...", "data":{...}}, ...]</buttons>
 * 
 * @param responseText - The AI's response text
 * @returns Parsed message and button definitions
 */
export function parseAiButtons(responseText: string): ParsedAiResponse {
  const buttonRegex = /###BUTTONS_START###\s*(\[[\s\S]*?\])\s*###BUTTONS_END###/;
  const match = responseText.match(buttonRegex);

  if (!match) {
    return {
      messageText: responseText,
      buttons: [],
    };
  }

  try {
    // HTML-decode the JSON string (Telegram encodes quotes as &quot;)
    const buttonsJson = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    const buttons: AiButton[] = JSON.parse(buttonsJson);
    
    // Remove the buttons markers from the message
    const messageText = responseText.replace(buttonRegex, '').trim();

    // Validate button structure
    const validButtons = buttons.filter(btn => 
      btn.text && 
      btn.action && 
      typeof btn.text === 'string' && 
      typeof btn.action === 'string'
    );

    return {
      messageText,
      buttons: validButtons,
    };
  } catch (error) {
    console.error('[parseAiButtons] Failed to parse buttons:', error);
    // Return original text if parsing fails
    return {
      messageText: responseText,
      buttons: [],
    };
  }
}

/**
 * Create an InlineKeyboard from button definitions
 * 
 * @param buttons - Button definitions from AI
 * @param telegramUserId - User ID for button callbacks
 * @returns InlineKeyboard ready to be attached to a message
 */
export function createButtonKeyboard(
  buttons: AiButton[],
  telegramUserId: string
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    
    // Create callback data (max 64 bytes in Telegram)
    const callbackData = JSON.stringify({
      a: button.action, // 'a' for action (shorter key)
      d: button.data || {}, // 'd' for data
      u: telegramUserId, // 'u' for user
      m: button.message, // 'm' for message (optional)
    });

    // Telegram callback_data has 64-byte limit
    if (callbackData.length > 64) {
      console.warn(`[createButtonKeyboard] Button "${button.text}" callback data too long (${callbackData.length} bytes), skipping`);
      continue;
    }

    keyboard.text(button.text, callbackData);

    // Add row break after every 2 buttons (max 2 buttons per row)
    if ((i + 1) % 2 === 0 && i < buttons.length - 1) {
      keyboard.row();
    }
  }

  return keyboard;
}

/**
 * Parse button callback data
 * 
 * @param callbackData - Data from button callback_query
 * @returns Parsed action, data, and user ID
 */
export function parseButtonCallback(callbackData: string): {
  action: string;
  data: Record<string, any>;
  userId: string;
  message?: string;
} | null {
  try {
    const parsed = JSON.parse(callbackData);
    return {
      action: parsed.a,
      data: parsed.d || {},
      userId: parsed.u,
      message: parsed.m,
    };
  } catch (error) {
    console.error('[parseButtonCallback] Failed to parse callback data:', error);
    return null;
  }
}

/**
 * Common button actions that the AI can use
 */
export const BUTTON_ACTIONS = {
  // Rastar food selection
  SELECT_ALL_FOODS: 'rastar_select_all',
  SELECT_BY_APPETITE: 'rastar_select_appetite',
  VIEW_TODAY_MENU: 'rastar_view_today',
  VIEW_WEEK_MENU: 'rastar_view_week',
  CHANGE_SELECTION: 'rastar_change_selection',
  REMOVE_SELECTION: 'rastar_remove_selection',
  
  // Planka task management
  CREATE_TASK: 'planka_create_task',
  VIEW_MY_TASKS: 'planka_view_my_tasks',
  MARK_COMPLETE: 'planka_mark_complete',
  ADD_COMMENT: 'planka_add_comment',
  
  // General actions
  SEND_MESSAGE: 'send_message', // Send a custom message to AI (as if user typed it)
  RETRY_ACTION: 'retry_action',
  CANCEL: 'cancel',
  HELP: 'help',
} as const;
