const db = require('better-sqlite3')('data/rastar.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

// Check if Message table exists
if (tables.find(t => t.name === 'Message')) {
  const msgCount = db.prepare('SELECT COUNT(*) as count FROM Message').get();
  console.log('Message count:', msgCount.count);
  
  const recentMsgs = db.prepare('SELECT id, role, sessionId FROM Message ORDER BY createdAt DESC LIMIT 3').all();
  console.log('Recent messages:', recentMsgs);
} else {
  console.log('Message table does not exist!');
}

// Check ChatSession
if (tables.find(t => t.name === 'ChatSession')) {
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM ChatSession').get();
  console.log('ChatSession count:', sessionCount.count);
  
  const sessions = db.prepare('SELECT id, telegramUserId FROM ChatSession').all();
  console.log('Sessions:', sessions);
} else {
  console.log('ChatSession table does not exist!');
}

db.close();
