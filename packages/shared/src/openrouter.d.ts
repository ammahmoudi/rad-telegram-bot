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
    supported_parameters?: string[];
}
export interface OpenRouterModelsResponse {
    data: OpenRouterModel[];
}
/**
 * Fetch all available models from OpenRouter
 * @param toolsOnly - If true, only return models that support tool calling
 */
export declare function fetchOpenRouterModels(toolsOnly?: boolean): Promise<OpenRouterModel[]>;
/**
 * Check if a model is free (both prompt and completion pricing are "0")
 */
export declare function isModelFree(model: OpenRouterModel): boolean;
/**
 * Check if a model supports tool calling (function calling)
 */
export declare function supportsTools(model: OpenRouterModel): boolean;
/**
 * Format model pricing for display
 */
export declare function formatModelPricing(model: OpenRouterModel): string;
/**
 * Get model category based on provider
 */
export declare function getModelCategory(modelId: string): string;
/**
 * Sort models: Free first, then by pricing (cheapest first)
 */
export declare function sortModelsByPrice(models: OpenRouterModel[]): OpenRouterModel[];
/**
 * Get popular/recommended models
 */
export declare function getRecommendedModels(): string[];
