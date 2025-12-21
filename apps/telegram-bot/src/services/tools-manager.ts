import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { getMcpManager } from '../mcp-client.js';
import { getPlankaToken } from '@rastar/shared';

/**
 * Get AI tools for the given Telegram user
 * Fetches available MCP tools and filters based on user's Planka connection status
 */
export async function getAiTools(telegramUserId: string): Promise<ChatCompletionTool[]> {
  console.log('[getAiTools] Getting tools for user:', telegramUserId);
  
  const mcpManager = getMcpManager();
  if (!mcpManager) {
    console.log('[getAiTools] No MCP manager available');
    return [];
  }

  const plankaToken = await getPlankaToken(telegramUserId);
  console.log('[getAiTools] User has Planka token:', !!plankaToken);

  // Get all available tools from MCP servers (provide 'planka' server name)
  const allTools = await mcpManager.listTools('planka');
  console.log('[getAiTools] Found', allTools.length, 'MCP tools');

  // Filter out auth tools if user is already authenticated
  const filteredTools = allTools.filter(tool => {
    // Always exclude logout (it's not an AI action)
    if (tool.name === 'planka.auth.logout') return false;
    
    // If user has token, exclude all auth tools except status
    if (plankaToken) {
      if (tool.name === 'planka.auth.login') return false;
      if (tool.name === 'planka.auth.register') return false;
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
    }
    
    // Remove internal parameters from required array
    if (inputSchema.required && Array.isArray(inputSchema.required)) {
      inputSchema.required = inputSchema.required.filter(
        (param: string) => param !== 'plankaBaseUrl' && param !== 'plankaToken' && param !== 'telegramUserId'
      );
    }
    
    return {
      type: 'function' as const,
      function: {
        name: tool.name.replace(/\./g, '_'), // Convert planka.cards.search -> planka_cards_search
        description: tool.description || '',
        parameters: inputSchema,
      },
    };
  });

  return tools;
}
