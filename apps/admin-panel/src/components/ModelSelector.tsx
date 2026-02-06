'use client';

import { useState, useEffect } from 'react';
import type { OpenRouterModel } from '@rad/shared';

interface ModelSelectorProps {
  defaultModel: string;
  name: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  emptyDescription?: string;
  onChange?: (modelId: string) => void;
}

interface ModelGroup {
  category: string;
  models: OpenRouterModel[];
}

export function ModelSelector({
  defaultModel,
  name,
  allowEmpty = false,
  emptyLabel = 'Use global default',
  emptyDescription = 'Inherit the model set in AI settings',
  onChange,
}: ModelSelectorProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/openrouter-models');
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModelCategory = (modelId: string): string => {
    if (modelId.startsWith('openrouter/')) return 'OpenRouter';
    if (modelId.startsWith('anthropic/')) return 'Anthropic';
    if (modelId.startsWith('openai/')) return 'OpenAI';
    if (modelId.startsWith('google/')) return 'Google';
    if (modelId.startsWith('meta-llama/')) return 'Meta';
    if (modelId.startsWith('mistralai/')) return 'Mistral AI';
    if (modelId.startsWith('x-ai/')) return 'xAI';
    return 'Other';
  };

  const isModelFree = (model: OpenRouterModel): boolean => {
    return model.pricing.prompt === '0' && model.pricing.completion === '0';
  };

  const formatPrice = (model: OpenRouterModel): string => {
    const promptPrice = parseFloat(model.pricing.prompt);
    const completionPrice = parseFloat(model.pricing.completion);

    if (promptPrice === 0 && completionPrice === 0) {
      return 'Free';
    }

    const promptPerM = (promptPrice * 1_000_000).toFixed(2);
    const completionPerM = (completionPrice * 1_000_000).toFixed(2);

    return `$${promptPerM} / $${completionPerM}`;
  };

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFreeFilter = !showFreeOnly || isModelFree(model);

    return matchesSearch && matchesFreeFilter;
  });

  // Group models by category
  const groupedModels: ModelGroup[] = [];
  const categoryMap = new Map<string, OpenRouterModel[]>();

  // Add Auto Router at top
  const autoModel = models.find((m) => m.id === 'openrouter/auto');
  if (autoModel && (!searchQuery || 'auto'.includes(searchQuery.toLowerCase()))) {
    groupedModels.push({
      category: '⚡ Smart Routing',
      models: [autoModel],
    });
  }

  // Group other models
  filteredModels.forEach((model) => {
    if (model.id === 'openrouter/auto') return; // Already added

    const category = getModelCategory(model.id);
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(model);
  });

  // Convert to array and sort
  categoryMap.forEach((models, category) => {
    groupedModels.push({ category, models });
  });

  const selectedModelData = models.find((m) => m.id === selectedModel);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    onChange?.(modelId);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selectedModel} />

      {/* Selected Model Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950"
      >
        <span className="flex items-center gap-2">
          {selectedModelData ? (
            <>
              <span className="font-medium">{selectedModelData.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({formatPrice(selectedModelData)})
              </span>
            </>
          ) : allowEmpty && !selectedModel ? (
            <span className="text-slate-500">
              {emptyLabel}
            </span>
          ) : (
            <span className="text-slate-500">Select a model...</span>
          )}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg">
          {/* Search and Filters */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Show free models only</span>
              <span className="text-xs text-slate-500">
                ({models.filter(isModelFree).length} free)
              </span>
            </label>
          </div>

          {/* Models List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading models...</div>
            ) : groupedModels.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No models found</div>
            ) : (
              <>
                {allowEmpty && (
                  <div className="border-b border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectModel('');
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${
                        selectedModel === '' ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                              {emptyLabel}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {emptyDescription}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
                {groupedModels.map((group) => (
                  <div key={group.category} className="border-b border-slate-200 dark:border-slate-800 last:border-0">
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {group.category} ({group.models.length})
                    </div>
                    {group.models.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          handleSelectModel(model.id);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${
                          selectedModel === model.id ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                                {model.name}
                              </span>
                              {isModelFree(model) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                  FREE
                                </span>
                              )}
                              {model.id === 'openrouter/auto' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                  AUTO
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {model.id}
                            </div>
                            {model.description && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {model.description}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-medium text-slate-900 dark:text-slate-50">
                              {formatPrice(model)}
                            </div>
                            {!isModelFree(model) && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">per 1M tokens</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>Context: {model.context_length.toLocaleString()}</span>
                          {model.top_provider.is_moderated && (
                            <span className="text-amber-600 dark:text-amber-400">⚠️ Moderated</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{filteredModels.length} models available</span>
              <a
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Browse all models →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
