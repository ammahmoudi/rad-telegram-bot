#!/usr/bin/env node
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const sqlFile = path.join(here, 'init-sqlite.sql');
const dbPath = path.resolve(repoRoot, 'data', 'rastar.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

console.log(`Initializing SQLite database at: ${dbPath}`);

const sql = fs.readFileSync(sqlFile, 'utf-8');
const db = new Database(dbPath);

// Execute all SQL statements
db.exec(sql);

console.log('Database initialized successfully!');
db.close();
