import { getSessionStatus } from './opencode.js';
import { updateSessionStatus, getSession } from './database.js';
import { notifyResearchComplete, notifyResearchFailed } from './notifier.js';
import type { ActivePoll } from '../types/index.js';

const activePolls = new Map<string, ActivePoll>();

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 30 * 60 * 1000;

export function startPolling(
  requestId: string,
  opencodeSessionId: string,
  telegramChatId?: number
): void {
  if (activePolls.has(requestId)) {
    console.warn(`Poll already active for request ${requestId}`);
    return;
  }

  const intervalId = setInterval(async () => {
    await checkSessionCompletion(requestId, opencodeSessionId);
  }, POLL_INTERVAL_MS);

  const poll: ActivePoll = {
    requestId,
    sessionId: opencodeSessionId,
    telegramChatId,
    intervalId,
    startedAt: new Date(),
  };

  activePolls.set(requestId, poll);

  setTimeout(() => {
    stopPolling(requestId, 'timeout');
  }, MAX_POLL_DURATION_MS);

  console.log(`📡 Started polling for session ${opencodeSessionId}`);
}

async function checkSessionCompletion(
  requestId: string,
  opencodeSessionId: string
): Promise<void> {
  const status = await getSessionStatus(opencodeSessionId);

  if (status === 'idle') {
    await handleCompletion(requestId);
  } else if (status === 'unknown') {
    console.warn(`Unknown status for session ${opencodeSessionId}, continuing to poll`);
  }
}

async function handleCompletion(requestId: string): Promise<void> {
  const poll = activePolls.get(requestId);
  if (!poll) return;

  stopPolling(requestId, 'completed');

  const session = getSession(requestId);
  if (!session) {
    console.error(`Session ${requestId} not found in database`);
    return;
  }

  updateSessionStatus(requestId, 'completed');

  console.log(`✅ Research ${requestId} completed`);

  if (poll.telegramChatId) {
    await notifyResearchComplete(
      poll.telegramChatId,
      session.title,
      session.report_path || undefined
    );
  }
}

function stopPolling(requestId: string, reason: 'completed' | 'failed' | 'timeout'): void {
  const poll = activePolls.get(requestId);
  if (!poll) return;

  clearInterval(poll.intervalId);
  activePolls.delete(requestId);

  if (reason === 'timeout') {
    console.warn(`⏰ Poll timeout for request ${requestId}`);
    updateSessionStatus(requestId, 'failed');

    if (poll.telegramChatId) {
      const session = getSession(requestId);
      if (session) {
        notifyResearchFailed(poll.telegramChatId, session.title, 'Session timed out');
      }
    }
  } else if (reason === 'failed') {
    updateSessionStatus(requestId, 'failed');
  }
}

export function getActivePolls(): number {
  return activePolls.size;
}

export function stopAllPolling(): void {
  for (const [requestId] of activePolls) {
    stopPolling(requestId, 'failed');
  }
}
