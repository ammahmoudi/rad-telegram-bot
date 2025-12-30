import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { getMcpManager } from '../mcp-client.js';
import { getPlankaToken, getRastarToken } from '@rad/shared';

/**
 * Get AI tools for the given Telegram user
 * Fetches available MCP tools and filters based on user's Planka and Rastar connection status
 */
export async function getAiTools(telegramUserId: string): Promise<ChatCompletionTool[]> {
  console.log('[getAiTools] Getting tools for user:', telegramUserId);
  
  const mcpManager = getMcpManager();
  if (!mcpManager) {
    console.log('[getAiTools] No MCP manager available');
    return [];
  }

  const plankaToken = await getPlankaToken(telegramUserId);
  const rastarToken = await getRastarToken(telegramUserId);
  console.log('[getAiTools] User has Planka token:', !!plankaToken);
  console.log('[getAiTools] User has Rastar token:', !!rastarToken);

  // Get all available tools from both MCP servers
  const plankaTools = await mcpManager.listTools('planka');
  const rastarTools = await mcpManager.listTools('rastar');
  const allTools = [...plankaTools, ...rastarTools];
  console.log('[getAiTools] Found', allTools.length, 'MCP tools (Planka:', plankaTools.length, ', Rastar:', rastarTools.length, ')');

  // Filter out auth tools if user is already authenticated
  const filteredTools = allTools.filter(tool => {
    // Planka filtering (new tools use underscore format: planka_xxx)
    if (tool.name.startsWith('planka_')) {
      if (tool.name === 'planka_auth_logout') return false;
      if (plankaToken) {
        if (tool.name === 'planka_auth_login') return false;
        if (tool.name === 'planka_auth_register') return false;
      }
    }
    
    // Rastar filtering (new tools use underscore format: rastar_xxx)
    if (tool.name.startsWith('rastar_')) {
      // Hide all auth tools (refresh is automatic)
      if (tool.name.startsWith('rastar_auth_')) return false;
      
      // Hide menu tools if not authenticated
      if (!rastarToken) return false;
    }
    
    return true;
  });

  console.log('[getAiTools] Enabled tools after filtering:', filteredTools.length);

  // Convert MCP tools to OpenAI ChatCompletionTool format
  const tools: ChatCompletionTool[] = filteredTools.map(tool => {
    const inputSchema = tool.inputSchema || { type: 'object', properties: {} };
    
    // Remove internal parameters from schema (credentials + context)
    if (inputSchema.properties) {
      delete inputSchema.properties.plankaBaseUrl;
      delete inputSchema.properties.plankaToken;
      delete inputSchema.properties.telegramUserId;
      delete inputSchema.properties.accessToken;
      delete inputSchema.properties.userId;
    }
    
    // Remove internal parameters from required array
    if (inputSchema.required && Array.isArray(inputSchema.required)) {
      inputSchema.required = inputSchema.required.filter(
        (param: string) => !['plankaBaseUrl', 'plankaToken', 'telegramUserId', 'accessToken', 'userId'].includes(param)
      );
    }
    
    return {
      type: 'function' as const,
      function: {
        name: tool.name, // Tool names already use underscore format (planka_get_user_cards)
        description: tool.description || '',
        parameters: inputSchema,
      },
    };
  });

  return tools;
}
