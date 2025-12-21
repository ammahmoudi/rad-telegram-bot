import type { ReasoningStep } from '../types/streaming.js';
import { formatToolName, formatToolArgs, markdownToTelegramHtml } from '../utils/formatting.js';

/**
 * Build the final response with expandable summary
 */
export function buildFinalResponse(
  finalResponse: string,
  reasoningSteps: ReasoningStep[],
  allToolCallsMade: Array<{ name: string; args?: any }>,
  forcedSummarizationUsed: boolean
): string {
  let response = markdownToTelegramHtml(finalResponse);
  
  // Add expandable process summary
  const expandableSummary = buildExpandableSummary(
    reasoningSteps,
    allToolCallsMade,
    forcedSummarizationUsed
  );
  
  if (expandableSummary) {
    response += '\n\n' + expandableSummary;
  }
  
  return response;
}

/**
 * Build expandable summary of reasoning and tool calls
 */
export function buildExpandableSummary(
  reasoningSteps: ReasoningStep[],
  allToolCallsMade: Array<{ name: string; args?: any }>,
  forcedSummarizationUsed: boolean = false
): string {
  let summaryContent = '';
  
  // Show reasoning steps with their associated tools
  if (reasoningSteps.length > 0) {
    summaryContent += '<b>💭 Reasoning Process:</b>\n\n';
    
    for (let i = 0; i < reasoningSteps.length; i++) {
      const step = reasoningSteps[i];
      summaryContent += `<b>Step ${i + 1}:</b> ${step.reasoning}\n`;
      
      if (step.tools.length > 0) {
        summaryContent += '<b>Tools used:</b>\n';
        for (const tool of step.tools) {
          const toolNameFormatted = formatToolName(tool.name);
          const argsFormatted = formatToolArgs(tool.args, 200);
          summaryContent += `  • ${toolNameFormatted}${argsFormatted}\n`;
        }
      }
      summaryContent += '\n';
    }
  } else if (allToolCallsMade.length > 0) {
    // Fallback: show all tools without reasoning steps
    summaryContent += '<b>🛠️ Tools used:</b>\n';
    for (const tool of allToolCallsMade) {
      const toolNameFormatted = formatToolName(tool.name);
      const argsFormatted = formatToolArgs(tool.args, 200);
      summaryContent += `  • ${toolNameFormatted}${argsFormatted}\n`;
    }
    summaryContent += '\n';
  }
  
  // Add note about forced summarization if used
  if (forcedSummarizationUsed) {
    summaryContent += '<i>ℹ️ Used forced summarization due to context limits</i>\n';
  }
  
  if (!summaryContent) {
    return '';
  }
  
  // Build expandable blockquote
  return `<blockquote expandable>💡 <b>Process Summary</b>\n\n${summaryContent}</blockquote>`;
}

/**
 * Detect if search tools returned empty results and build notification for AI
 */
export function buildEmptySearchNotification(
  allToolCallsMade: Array<{ name: string; args?: any }>,
  historyWithToolResults: any[]
): string | null {
  // Check if any search tools were used
  const searchTools = allToolCallsMade.filter(
    tool => tool.name.includes('search') || tool.name.includes('list')
  );
  
  if (searchTools.length === 0) {
    return null;
  }
  
  // Check tool results in history
  const hasEmptyResults = historyWithToolResults.some((msg: any) => {
    if (msg.role === 'tool') {
      try {
        const result = typeof msg.content === 'string' 
          ? JSON.parse(msg.content) 
          : msg.content;
        
        // Check for empty search results
        if (result.totalFound === 0 || 
            (Array.isArray(result.cards) && result.cards.length === 0) ||
            (Array.isArray(result.tasks) && result.tasks.length === 0)) {
          return true;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return false;
  });
  
  if (hasEmptyResults) {
    return '\n\n⚠️ IMPORTANT: Some of your searches returned ZERO results (totalFound: 0). Do NOT make up or hallucinate data. If no results were found, clearly tell the user that no matching items were found.';
  }
  
  return null;
}
