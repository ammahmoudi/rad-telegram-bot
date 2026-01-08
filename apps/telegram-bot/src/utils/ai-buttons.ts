/**
 * AI-Suggested Dynamic Buttons Utility
 * 
 * Allows the AI to suggest contextual action buttons that appear below messages.
 * The AI can suggest buttons by including a special XML tag in its response.
 */

import { InlineKeyboard } from 'grammy';

/**
 * Clean AI response by removing internal reasoning and process summaries
 * that should not be shown to end users
 */
export function cleanAiResponse(text: string): string {
  let cleaned = text;
  
  // Remove system prompt instructions that leaked into the response
  // These typically start with "If you found..." or "End with..." or "Crucial:" etc.
  cleaned = cleaned.replace(/^If you found the item[\s\S]*?(?=\n\n[^\n])/gim, '');
  cleaned = cleaned.replace(/^End with \d+-\d+[\s\S]*?(?=\n\n[^\n])/gim, '');
  cleaned = cleaned.replace(/^Crucial:[\s\S]*?(?=\n\n[^\n])/gim, '');
  cleaned = cleaned.replace(/^Language:[\s\S]*?(?=\n\n[^\n])/gim, '');
  cleaned = cleaned.replace(/^Example formatting[\s\S]*?(?=\n\n[^\n])/gim, '');
  cleaned = cleaned.replace(/^Specific instructions for this turn:[\s\S]*?(?=(?:Response:|$))/gim, '');
  
  // Remove internal AI thinking/reasoning that appears before the actual response
  // Common patterns: "Wait, I should...", "Actually,", "Let's try...", etc.
  cleaned = cleaned.replace(/^(?:Wait|Actually|Let's try|Hmm|I should|I will|I'll|I can)[\s\S]*?(?=\n\n[^\n])/gim, '');
  
  // Remove "Response:" label that appears before the actual message
  cleaned = cleaned.replace(/^Response:\s*/gim, '');
  
  // Remove Process Summary sections (both blockquote and plain text versions)
  cleaned = cleaned.replace(/<blockquote[^>]*>💡\s*<b>Process Summary<\/b>[\s\S]*?<\/blockquote>/gi, '');
  cleaned = cleaned.replace(/💡\s*Process Summary[\s\S]*?(?=\n\n|$)/gi, '');
  
  // Remove standalone Reasoning Process sections
  cleaned = cleaned.replace(/💭\s*<b>Reasoning Process:<\/b>[\s\S]*?(?=(?:<blockquote|💡|###BUTTONS|$))/gi, '');
  cleaned = cleaned.replace(/💭\s*Reasoning Process:[\s\S]*?(?=\n\n|$)/gi, '');
  
  // Remove "Step X:" sections that appear outside blockquotes
  cleaned = cleaned.replace(/<b>Step \d+:<\/b>[\s\S]*?Tools used:[\s\S]*?(?=(?:<b>Step|💡|###BUTTONS|$))/gi, '');
  
  // Remove "Tools used:" sections
  cleaned = cleaned.replace(/Tools used:[\s\S]*?(?=\n\n|$)/gi, '');
  cleaned = cleaned.replace(/<b>🛠️ Tools used:<\/b>[\s\S]*?(?=\n\n|$)/gi, '');
  cleaned = cleaned.replace(/<i>↳ Tools used:<\/i>[\s\S]*?(?=\n\n|$)/gi, '');
  
  // Remove forced summarization notices
  cleaned = cleaned.replace(/ℹ️\s*Used forced summarization due to context limits[\s\S]*?(?=\n|$)/gi, '');
  
  // Remove "Search Results:" or similar headers that appear from prompt leakage
  cleaned = cleaned.replace(/^Search Results?:\s*$/gim, '');
  cleaned = cleaned.replace(/^\[Result \d+\]\s*$/gim, '');
  
  // Remove duplicate content by splitting on common separators and keeping first occurrence
  // Split on patterns that indicate repeated content
  const parts = cleaned.split(/\n{3,}/);
  const seenContent = new Set<string>();
  const uniqueParts: string[] = [];
  
  for (const part of parts) {
    const normalized = part.trim().substring(0, 200); // Compare first 200 chars
    if (normalized && !seenContent.has(normalized)) {
      seenContent.add(normalized);
      uniqueParts.push(part);
    }
  }
  
  cleaned = uniqueParts.join('\n\n');
  
  // Clean up excess whitespace
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

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
  // First, clean the response of internal AI content
  let cleanedText = cleanAiResponse(responseText);
  
  // Then parse and remove button markers
  const buttonRegex = /###BUTTONS_START###\s*(\[[\s\S]*?\])\s*###BUTTONS_END###/g;
  const matches = [...cleanedText.matchAll(buttonRegex)];

  if (matches.length === 0) {
    return {
      messageText: cleanedText,
      buttons: [],
    };
  }

  // Collect all buttons from all matches (in case there are multiple button sections)
  const allButtons: AiButton[] = [];
  
  for (const match of matches) {
    try {
      // HTML-decode the JSON string (Telegram encodes quotes as &quot;)
      const buttonsJson = match[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      const buttons: AiButton[] = JSON.parse(buttonsJson);
      allButtons.push(...buttons);
    } catch (error) {
      console.error('[parseAiButtons] Failed to parse button match:', error);
    }
  }
  
  // Remove ALL button markers from the message
  const messageText = cleanedText.replace(buttonRegex, '').trim();

  // Validate button structure
  const validButtons = allButtons.filter(btn => 
    btn.text && 
    btn.action && 
    typeof btn.text === 'string' && 
    typeof btn.action === 'string'
  );

  return {
    messageText,
    buttons: validButtons,
  };
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
  telegramUserId: string,
  options?: {
    /**
     * Optional callback to register a full send_message payload and return a short key.
     * This is used to keep Telegram callback_data under 64 bytes.
     */
    registerSendMessage?: (message: string) => string;
  }
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    
    // Create minimal callback data (max 64 bytes in Telegram)
    let callbackData: string;
    if (button.action === 'send_message' && button.message) {
      const messageKey = options?.registerSendMessage?.(button.message);

      // Preferred: store a short key only; full message is kept in session.
      if (messageKey) {
        callbackData = JSON.stringify({
          a: 'sm', // 'sm' = send_message
          u: telegramUserId,
          k: messageKey,
        });
      } else {
        // Backward/standalone fallback: store first 10 chars only.
        const shortMsg = button.message.substring(0, 10);
        callbackData = JSON.stringify({
          a: 'sm',
          u: telegramUserId,
          m: shortMsg,
        });
      }
    } else {
      callbackData = JSON.stringify({
        a: button.action,
        d: button.data || {},
        u: telegramUserId,
      });
    }

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
  messageKey?: string;
} | null {
  try {
    const parsed = JSON.parse(callbackData);
    return {
      action: parsed.a === 'sm' ? 'send_message' : parsed.a, // Map 'sm' back to 'send_message'
      data: parsed.d || {},
      userId: parsed.u,
      message: parsed.m,
      messageKey: parsed.k,
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
  VIEW_NEXT_WEEK_MENU: 'rastar_view_next_week',
  VIEW_SELECTION_STATS: 'rastar_view_stats',
  VIEW_UNSELECTED_DAYS: 'rastar_view_unselected',
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

/**
 * Helper to encode button callback data for menu buttons
 */
export function encodeButtonCallback(action: string, userId: string, message?: string): string {
  if (action === BUTTON_ACTIONS.SEND_MESSAGE && message) {
    const shortMsg = message.substring(0, 10);
    return JSON.stringify({
      a: 'sm',
      u: userId,
      m: shortMsg,
    });
  }
  return JSON.stringify({
    a: action,
    u: userId,
    d: {},
  });
}
