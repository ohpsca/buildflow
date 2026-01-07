import type { ResearchSession } from '@build-learn/shared';

export interface DbSession {
  id: string;
  request_id: string;
  opencode_session_id: string;
  status: string;
  title: string;
  report_path: string | null;
  telegram_chat_id: number | null;
  created_at: string;
  completed_at: string | null;
}

export function dbSessionToResearchSession(db: DbSession): ResearchSession {
  return {
    id: db.id,
    requestId: db.request_id,
    opencodeSessionId: db.opencode_session_id,
    status: db.status as ResearchSession['status'],
    title: db.title,
    reportPath: db.report_path || undefined,
    telegramChatId: db.telegram_chat_id || undefined,
    createdAt: new Date(db.created_at),
    completedAt: db.completed_at ? new Date(db.completed_at) : undefined,
  };
}

export interface ActivePoll {
  requestId: string;
  sessionId: string;
  telegramChatId?: number;
  intervalId: NodeJS.Timeout;
  startedAt: Date;
}
