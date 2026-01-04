import { marked } from 'marked';

/**
 * Convert markdown to Telegram HTML format
 * Handles: **bold**, __underline__, *italic*, _italic_
 * Also escapes HTML entities for safety
 */
export function markdownToTelegramHtml(text: string): string {
  // Use marked to parse markdown, then convert to Telegram-safe HTML
  const html = marked.parse(text, { async: false }) as string;
  
  return html
    // Convert standard HTML tags to Telegram-supported ones
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    .replace(/<strong>/g, '<b>')
    .replace(/<\/strong>/g, '</b>')
    .replace(/<em>/g, '<i>')
    .replace(/<\/em>/g, '</i>')
    .replace(/<h[1-6]>/g, '<b>')
    .replace(/<\/h[1-6]>/g, '</b>\n')
    .replace(/<ul>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<ol>/g, '\n')
    .replace(/<\/ol>/g, '\n')
    .replace(/<li>/g, '• ')
    .replace(/<\/li>/g, '\n')
    .replace(/<code>/g, '<code>')
    .replace(/<\/code>/g, '</code>')
    .replace(/<pre><code>/g, '<pre>')
    .replace(/<\/code><\/pre>/g, '</pre>')
    // Remove any other unsupported HTML tags
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Format tool name nicely for display
 * Converts: planka_cards_search -> 🔧 Cards Search
 */
export function formatToolName(toolName: string): string {
  const parts = toolName.replace('planka_', '').split('_');
  const formatted = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  return `🔧 ${formatted}`;
}

/**
 * Format tool arguments nicely for display
 * Converts: {projectId: "123", query: "test"} -> " (projectId: "123", query: "test")"
 */
export function formatToolArgs(args: any, maxLength: number = 60): string {
  if (!args) return '';
  
  // Handle if args is a string (parse it)
  let argsObj: any;
  if (typeof args === 'string') {
    try {
      argsObj = JSON.parse(args);
    } catch {
      return ''; // Invalid JSON, skip
    }
  } else {
    argsObj = args;
  }
  
  // Check if it's an object with properties
  if (typeof argsObj !== 'object' || Array.isArray(argsObj)) return '';
  
  const keys = Object.keys(argsObj);
  if (keys.length === 0) return '';
  
  const pairs: string[] = [];
  for (const key of keys) {
    const value = argsObj[key];
    let formattedValue: string;
    
    if (typeof value === 'string') {
      formattedValue = value.length > 30 ? `"${value.substring(0, 27)}..."` : `"${value}"`;
    } else if (value === null || value === undefined) {
      continue; // Skip null/undefined
    } else if (typeof value === 'object') {
      formattedValue = '[...]'; // Don't expand nested objects
    } else {
      formattedValue = String(value);
    }
    pairs.push(`${key}: ${formattedValue}`);
  }
  
  if (pairs.length === 0) return '';
  
  const result = ` (${pairs.join(', ')})`;
  if (result.length > maxLength) {
    return result.substring(0, maxLength - 4) + '...)';
  }
  return result;
}

/**
 * Strip trailing slash from URL
 */
export function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, '');
}
