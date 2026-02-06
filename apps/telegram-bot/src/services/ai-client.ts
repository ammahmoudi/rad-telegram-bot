import { OpenRouterClient, getPrisma, getSystemConfig, saveLlmUsage } from '@rad/shared';

// Cache for AI client
let aiClient: OpenRouterClient | null = null;
let cachedApiKey: string | undefined = undefined;
let cachedModel: string | undefined = undefined;

/**
 * Get or initialize the AI client
 * Checks both environment variables and system config
 * Recreates client if API key or model changes
 */
export async function getAiClient(): Promise<OpenRouterClient | null> {
  // Get current config (system config overrides env)
  const systemApiKey = await getSystemConfig('OPENROUTER_API_KEY');
  const systemModel = await getSystemConfig('DEFAULT_AI_MODEL');
  
  const apiKey = systemApiKey || process.env.OPENROUTER_API_KEY;
  const model = systemModel || process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!apiKey) {
    return null;
  }

  // Recreate client if API key or model changed
  if (aiClient && (apiKey !== cachedApiKey || model !== cachedModel)) {
    console.log('[telegram-bot] AI config changed, recreating client');
    aiClient = null;
  }

  // Create client if needed
  if (!aiClient) {
    console.log('[telegram-bot] Initializing AI client with model:', model);
    aiClient = new OpenRouterClient(apiKey, model);
    
    // Set up usage tracking callback
    aiClient.setUsageCallback(saveLlmUsage);
    
    cachedApiKey = apiKey;
    cachedModel = model;
  }

  return aiClient;
}

/**
 * Resolve the AI model for a specific user.
 * Pack-specific overrides apply when the user has a custom pack assignment,
 * otherwise the default pack model is used if set.
 */
export async function getAiModelForUser(telegramUserId?: string): Promise<string> {
  const systemModel = await getSystemConfig('DEFAULT_AI_MODEL');
  const fallbackModel = systemModel || process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!telegramUserId) {
    return fallbackModel;
  }

  try {
    const prisma = getPrisma();
    const assignment = await prisma.userPackAssignment.findUnique({
      where: { telegramUserId },
      include: { pack: true },
    });

    const packModel = assignment?.pack?.aiModel?.trim();
    if (packModel) {
      return packModel;
    }

    const defaultPack = await prisma.characterPack.findFirst({
      where: { isDefault: true },
    });

    const defaultModel = defaultPack?.aiModel?.trim();
    if (defaultModel) {
      return defaultModel;
    }
  } catch (error) {
    console.error('[telegram-bot] Failed to resolve pack model:', error);
  }

  return fallbackModel;
}

/**
 * Get the current AI model name (for display purposes)
 */
export async function getCurrentModel(): Promise<string> {
  const systemModel = await getSystemConfig('DEFAULT_AI_MODEL');
  return systemModel || process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet';
}
