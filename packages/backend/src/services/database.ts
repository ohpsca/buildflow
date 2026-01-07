import Database from 'better-sqlite3';
import { resolve } from 'path';
import type { DbSession } from '../types/index.js';

const DB_PATH = resolve(process.cwd(), 'research', 'history.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    initSchema();
  }
  return db;
}

function initSchema(): void {
  const database = getDb();
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      opencode_session_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      title TEXT NOT NULL,
      report_path TEXT,
      telegram_chat_id INTEGER,
      created_at TEXT NOT NULL,
      completed_at TEXT
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
  `);
}

export function insertSession(session: {
  id: string;
  requestId: string;
  opencodeSessionId: string;
  title: string;
  telegramChatId?: number;
}): void {
  const database = getDb();
  
  database.prepare(`
    INSERT INTO sessions (id, request_id, opencode_session_id, status, title, telegram_chat_id, created_at)
    VALUES (?, ?, ?, 'processing', ?, ?, ?)
  `).run(
    session.id,
    session.requestId,
    session.opencodeSessionId,
    session.title,
    session.telegramChatId || null,
    new Date().toISOString()
  );
}

export function updateSessionStatus(
  id: string,
  status: 'completed' | 'failed',
  reportPath?: string
): void {
  const database = getDb();
  
  database.prepare(`
    UPDATE sessions 
    SET status = ?, report_path = ?, completed_at = ?
    WHERE id = ?
  `).run(status, reportPath || null, new Date().toISOString(), id);
}

export function getSession(id: string): DbSession | null {
  const database = getDb();
  return database.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as DbSession | null;
}

export function listSessions(limit = 50): DbSession[] {
  const database = getDb();
  return database.prepare(
    'SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?'
  ).all(limit) as DbSession[];
}

export function getSessionByOpencodeId(opencodeSessionId: string): DbSession | null {
  const database = getDb();
  return database.prepare(
    'SELECT * FROM sessions WHERE opencode_session_id = ?'
  ).get(opencodeSessionId) as DbSession | null;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
