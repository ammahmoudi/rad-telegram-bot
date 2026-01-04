/**
 * Represents a reasoning step with associated tools
 */
export interface ReasoningStep {
  reasoning: string;
  tools: Array<{ name: string; args: any }>;
}

/**
 * State for tracking streaming response
 */
export interface StreamingState {
  lastUpdateTime: number;
  reasoningActive: boolean;
  reasoningText: string;
  allReasoningTexts: string[];
  allToolCallsMade: Array<{ name: string; args?: any }>;
  reasoningSteps: ReasoningStep[];
  currentStepTools: Array<{ name: string; args: any }>;
  loadingFrameIndex: number;
  maxToolCalls: number;
  totalToolCallsMade: number;
  finalResponse: string;
  reasoningDetails?: unknown;
}

/**
 * Loading animation frames
 */
export const LOADING_FRAMES = ['⏳', '⌛'];

/**
 * Create initial streaming state
 */
export function createStreamingState(maxToolCalls: number): StreamingState {
  return {
    lastUpdateTime: Date.now(),
    reasoningActive: false,
    reasoningText: '',
    allReasoningTexts: [],
    allToolCallsMade: [],
    reasoningSteps: [],
    currentStepTools: [],
    loadingFrameIndex: 0,
    maxToolCalls,
    totalToolCallsMade: 0,
    finalResponse: '',
    reasoningDetails: undefined,
  };
}
