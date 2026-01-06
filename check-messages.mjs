// Force correct database path
process.env.DATABASE_URL = 'file:C:/Users/ammah/Documents/GitHub/rastar-telegram-bot/data/rastar.db';

import { getPrisma } from './packages/shared/dist/prisma.js';

async function main() {
  console.log('Checking database messages...\n');
  
  const prisma = getPrisma();
  
  // Get all sessions
  const sessions = await prisma.chatSession.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { messages: true }
      }
    }
  });
  
  console.log(`Found ${sessions.length} sessions:\n`);
  
  for (const session of sessions) {
    console.log(`Session ${session.id}:`);
    console.log(`  User: ${session.telegramUserId}`);
    console.log(`  ThreadId: ${session.threadId}`);
    console.log(`  Messages: ${session._count.messages}`);
    console.log(`  Created: ${new Date(Number(session.createdAt)).toLocaleString()}`);
    console.log(`  Updated: ${new Date(Number(session.updatedAt)).toLocaleString()}`);
    
    // Get first 3 messages from this session
    const messages = await prisma.message.findMany({
      where: { sessionId: session.id },
      take: 3,
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`  First ${messages.length} messages:`);
    messages.forEach((msg, idx) => {
      console.log(`    ${idx + 1}. [${msg.role}] ${msg.content?.substring(0, 50)}${msg.content?.length > 50 ? '...' : ''}`);
    });
    console.log('');
  }
  
  // Check total message count
  const totalMessages = await prisma.message.count();
  console.log(`\nTotal messages in database: ${totalMessages}`);
  
  // Check tool logs
  const totalToolLogs = await prisma.mcpToolLog.count();
  console.log(`Total MCP tool logs: ${totalToolLogs}`);
  
  if (totalToolLogs > 0) {
    const sampleToolLogs = await prisma.mcpToolLog.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    console.log('\nSample tool logs:');
    sampleToolLogs.forEach((log, idx) => {
      console.log(`  ${idx + 1}. ${log.mcpServer}.${log.toolName} - ${log.success ? '✓' : '✗'}`);
      console.log(`     Session: ${log.sessionId}, Message: ${log.messageId}`);
    });
  }
}

main()
  .catch(console.error);
