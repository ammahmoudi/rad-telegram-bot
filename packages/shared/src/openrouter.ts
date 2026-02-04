/**
 * OpenRouter API client for fetching available models
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
  };
  top_provider: {
    max_completion_tokens: number | null;
    is_moderated: boolean;
  };
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  supported_parameters?: string[]; // e.g., ["tools", "response_format", ...]
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * Fetch all available models from OpenRouter
 * @param toolsOnly - If true, only return models that support tool calling
 */
export async function fetchOpenRouterModels(toolsOnly = true): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = (await response.json()) as OpenRouterModelsResponse;
    const models = data.data || [];
    
    // Filter to only models supporting tool calling if requested
    if (toolsOnly) {
      return models.filter(supportsTools);
    }
    
    return models;
  } catch (error) {
    console.error('[fetchOpenRouterModels] Error:', error);
    return [];
  }
}

/**
 * Check if a model is free (both prompt and completion pricing are "0")
 */
export function isModelFree(model: OpenRouterModel): boolean {
  return model.pricing.prompt === '0' && model.pricing.completion === '0';
}

/**
 * Check if a model supports tool calling (function calling)
 */
export function supportsTools(model: OpenRouterModel): boolean {
  return model.supported_parameters?.includes('tools') ?? false;
}

/**
 * Format model pricing for display
 */
export function formatModelPricing(model: OpenRouterModel): string {
  const promptPrice = parseFloat(model.pricing.prompt);
  const completionPrice = parseFloat(model.pricing.completion);

  if (promptPrice === 0 && completionPrice === 0) {
    return 'Free';
  }

  // Convert to per-million tokens for readability
  const promptPerM = (promptPrice * 1_000_000).toFixed(2);
  const completionPerM = (completionPrice * 1_000_000).toFixed(2);

  return `$${promptPerM}/$${completionPerM} per 1M tokens`;
}

/**
 * Get model category based on provider
 */
export function getModelCategory(modelId: string): string {
  if (modelId.startsWith('openrouter/')) return 'OpenRouter';
  if (modelId.startsWith('anthropic/')) return 'Anthropic';
  if (modelId.startsWith('openai/')) return 'OpenAI';
  if (modelId.startsWith('google/')) return 'Google';
  if (modelId.startsWith('meta-llama/')) return 'Meta';
  if (modelId.startsWith('mistralai/')) return 'Mistral AI';
  if (modelId.startsWith('cohere/')) return 'Cohere';
  if (modelId.startsWith('x-ai/')) return 'xAI';
  if (modelId.startsWith('perplexity/')) return 'Perplexity';
  if (modelId.startsWith('deepseek/')) return 'DeepSeek';
  if (modelId.startsWith('qwen/')) return 'Qwen';
  return 'Other';
}

/**
 * Sort models: Free first, then by pricing (cheapest first)
 */
export function sortModelsByPrice(models: OpenRouterModel[]): OpenRouterModel[] {
  return [...models].sort((a, b) => {
    const aFree = isModelFree(a);
    const bFree = isModelFree(b);

    // Free models first
    if (aFree && !bFree) return -1;
    if (!aFree && bFree) return 1;

    // Then sort by total cost (prompt + completion)
    const aCost = parseFloat(a.pricing.prompt) + parseFloat(a.pricing.completion);
    const bCost = parseFloat(b.pricing.prompt) + parseFloat(b.pricing.completion);

    return aCost - bCost;
  });
}

/**
 * Get popular/recommended models
 */
export function getRecommendedModels(): string[] {
  return [
    'openrouter/auto', // Auto router
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'google/gemini-flash-1.5',
    'google/gemini-pro-1.5',
    'meta-llama/llama-3.1-70b-instruct',
  ];
}
