import { InlineKeyboard } from 'grammy';

/**
 * Button action types
 */
export interface ButtonAction {
  type: 'text' | 'tool_call' | 'url';
  label: string;
  // For 'text': sends this text as if user typed it
  text?: string;
  // For 'tool_call': calls this MCP tool with args
  tool?: string;
  args?: Record<string, any>;
  // For 'url': opens this URL
  url?: string;
}

/**
 * Parse AI-suggested buttons from response
 * Format: <buttons>[{"type":"text","label":"Choose all","text":"Choose all foods based on my appetite"}]</buttons>
 */
export function parseAiButtons(content: string): { cleanContent: string; buttons: ButtonAction[] } {
  const buttonRegex = /<buttons>([\s\S]*?)<\/buttons>/i;
  const match = content.match(buttonRegex);
  
  if (!match) {
    return { cleanContent: content, buttons: [] };
  }
  
  try {
    const buttonsJson = match[1].trim();
    const buttons: ButtonAction[] = JSON.parse(buttonsJson);
    
    // Remove the <buttons> tag from content
    const cleanContent = content.replace(buttonRegex, '').trim();
    
    return { cleanContent, buttons };
  } catch (error) {
    console.error('[dynamic-buttons] Failed to parse buttons JSON:', error);
    // Return original content if parsing fails
    return { cleanContent: content.replace(buttonRegex, ''), buttons: [] };
  }
}

/**
 * Create Telegram InlineKeyboard from button actions
 */
export function createButtonKeyboard(buttons: ButtonAction[], maxPerRow: number = 2): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  buttons.forEach((button, index) => {
    const callbackData = encodeButtonAction(button, index);
    
    if (button.type === 'url' && button.url) {
      keyboard.url(button.label, button.url);
    } else {
      // Use callback_data for text and tool_call buttons
      keyboard.text(button.label, callbackData);
    }
    
    // Start new row after maxPerRow buttons
    if ((index + 1) % maxPerRow === 0 && index < buttons.length - 1) {
      keyboard.row();
    }
  });
  
  return keyboard;
}

/**
 * Encode button action into callback_data (max 64 bytes)
 * Format: action_type:index:hash
 */
function encodeButtonAction(button: ButtonAction, index: number): string {
  // Store full button data in memory/cache and use short reference
  // For now, use a simpler approach with action type and index
  if (button.type === 'text') {
    // For text buttons, we can include short text directly
    const shortText = button.text?.substring(0, 40) || button.label;
    return `text:${index}:${Buffer.from(shortText).toString('base64').substring(0, 30)}`;
  } else if (button.type === 'tool_call') {
    return `tool:${index}:${button.tool?.substring(0, 30)}`;
  }
  
  return `btn:${index}`;
}

/**
 * Decode button callback data
 */
export function decodeButtonCallback(callbackData: string): { type: string; index: number; data: string } {
  const parts = callbackData.split(':');
  return {
    type: parts[0] || 'unknown',
    index: parseInt(parts[1]) || 0,
    data: parts[2] || '',
  };
}

/**
 * Button cache to store full button data (since callback_data is limited to 64 bytes)
 * Key: chatId:messageId
 */
const buttonCache = new Map<string, ButtonAction[]>();

/**
 * Store buttons for a message
 */
export function cacheButtons(chatId: number, messageId: number, buttons: ButtonAction[]): void {
  const key = `${chatId}:${messageId}`;
  buttonCache.set(key, buttons);
  
  // Clean up old entries after 1 hour
  setTimeout(() => {
    buttonCache.delete(key);
  }, 60 * 60 * 1000);
}

/**
 * Retrieve cached buttons for a message
 */
export function getCachedButtons(chatId: number, messageId: number): ButtonAction[] | undefined {
  const key = `${chatId}:${messageId}`;
  return buttonCache.get(key);
}
