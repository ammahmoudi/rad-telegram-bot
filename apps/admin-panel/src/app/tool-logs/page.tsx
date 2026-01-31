import { redirect } from 'next/navigation';

// Redirect old tool-logs URL to new chat-logs URL
export default function ToolLogsPage() {
  redirect('/chat-logs');
}

