import { getAllMcpToolLogs, getSessionMessagesWithToolCalls } from '@rad/shared';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const mcpServer = searchParams.get('server');
    const success = searchParams.get('success');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    const options: any = {};
    if (telegramUserId) options.telegramUserId = telegramUserId;
    if (sessionId) options.sessionId = sessionId;
    if (mcpServer) options.mcpServer = mcpServer;
    if (success !== null && success !== undefined) options.success = success === 'true';
    if (startDate) options.startDate = parseInt(startDate);
    if (endDate) options.endDate = parseInt(endDate);
    if (limit) options.limit = parseInt(limit);

    const logs = await getAllMcpToolLogs(options);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch tool logs:', error);
    return NextResponse.json({ error: 'Failed to fetch tool logs' }, { status: 500 });
  }
}
