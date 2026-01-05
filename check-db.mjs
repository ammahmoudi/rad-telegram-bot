import Database from 'better-sqlite3';

const db = new Database('./data/rastar.db', { readonly: true });

console.log('=== All Tables ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log(' -', t.name));

console.log('\n=== ChatSession Schema ===');
const chatSessionCols = db.prepare('PRAGMA table_info(ChatSession)').all();
chatSessionCols.forEach(c => console.log(` ${c.name}: ${c.type}${c.notnull ? ' NOT NULL' : ''}`));

console.log('\n=== Message Schema ===');
const messageCols = db.prepare('PRAGMA table_info(Message)').all();
messageCols.forEach(c => console.log(` ${c.name}: ${c.type}${c.notnull ? ' NOT NULL' : ''}`));

console.log('\n=== PlankaToken Check ===');
const plankaExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='PlankaToken'").get();
console.log(plankaExists ? '✓ PlankaToken table exists' : '✗ PlankaToken table MISSING');

if (plankaExists) {
  const plankaCols = db.prepare('PRAGMA table_info(PlankaToken)').all();
  plankaCols.forEach(c => console.log(` ${c.name}: ${c.type}`));
}

console.log('\n=== RastarToken Check ===');
const rastarExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='RastarToken'").get();
console.log(rastarExists ? '✓ RastarToken table exists' : '✗ RastarToken table MISSING');

console.log('\n=== Record Counts ===');
try {
  console.log('ChatSession:', db.prepare('SELECT COUNT(*) as count FROM ChatSession').get().count);
  console.log('Message:', db.prepare('SELECT COUNT(*) as count FROM Message').get().count);
  console.log('TelegramUser:', db.prepare('SELECT COUNT(*) as count FROM TelegramUser').get().count);
  if (plankaExists) console.log('PlankaToken:', db.prepare('SELECT COUNT(*) as count FROM PlankaToken').get().count);
  if (rastarExists) console.log('RastarToken:', db.prepare('SELECT COUNT(*) as count FROM RastarToken').get().count);
} catch (e) {
  console.error('Error counting records:', e.message);
}

db.close();
console.log('\n✓ Database check complete');
