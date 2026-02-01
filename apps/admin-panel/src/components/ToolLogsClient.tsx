/**
 * @deprecated Use ChatLogsSessionsList and ChatSessionView components instead
 * This component has been refactored into separate components for better routing:
 * - ChatLogsSessionsList: Shows list of all sessions at /chat-logs
 * - ChatSessionView: Shows individual session details at /chat-logs/[sessionId]
 * 
 * The old ToolLogsClient was a monolithic component that tried to handle both
 * the sessions list and individual session viewing in one place with URL parameters.
 * It's now split into two focused components with proper dynamic routing.
 */

export function ToolLogsClient() {
  return null;
}
