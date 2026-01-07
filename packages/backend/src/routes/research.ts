import { Router, type Router as RouterType } from 'express';
import { randomUUID } from 'crypto';
import {
  generateResearchPrompt,
  generateSessionTitle,
  type ResearchRequest,
} from '@build-learn/shared';
import { createSession, sendPromptAsync } from '../services/opencode.js';
import { insertSession, listSessions, getSession } from '../services/database.js';
import { startPolling } from '../services/poller.js';
import { dbSessionToResearchSession } from '../types/index.js';

export const researchRouter: RouterType = Router();

researchRouter.post('/', async (req, res) => {
  try {
    const body = req.body as Partial<ResearchRequest>;

    if (!body.type || !body.source) {
      res.status(400).json({ error: 'Missing required fields: type, source' });
      return;
    }

    if (body.type === 'url' && !body.url) {
      res.status(400).json({ error: 'URL is required for type "url"' });
      return;
    }

    if (body.type === 'x_post' && !body.text && !body.containedUrls?.length) {
      res.status(400).json({ error: 'Text or URLs required for type "x_post"' });
      return;
    }

    const request: ResearchRequest = {
      id: randomUUID(),
      type: body.type,
      source: body.source,
      url: body.url,
      text: body.text,
      containedUrls: body.containedUrls || [],
      timestamp: new Date(),
      telegramChatId: body.telegramChatId,
      chromeTabId: body.chromeTabId,
    };

    const title = generateSessionTitle(request);
    const prompt = generateResearchPrompt(request);

    const opencodeSessionId = await createSession(title);
    if (!opencodeSessionId) {
      res.status(503).json({ error: 'Failed to create OpenCode session. Is OpenCode running?' });
      return;
    }

    insertSession({
      id: request.id,
      requestId: request.id,
      opencodeSessionId,
      title,
      telegramChatId: request.telegramChatId,
    });

    const sent = await sendPromptAsync(opencodeSessionId, prompt);
    if (!sent) {
      res.status(503).json({ error: 'Failed to send prompt to OpenCode' });
      return;
    }

    startPolling(request.id, opencodeSessionId, request.telegramChatId);

    res.json({
      success: true,
      requestId: request.id,
      sessionId: opencodeSessionId,
      title,
    });
  } catch (err) {
    console.error('Research creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

researchRouter.get('/', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 100);
    const sessions = listSessions(limit);
    
    res.json({
      sessions: sessions.map(dbSessionToResearchSession),
      total: sessions.length,
    });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

researchRouter.get('/:id', (req, res) => {
  try {
    const session = getSession(req.params['id']!);
    
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    
    res.json(dbSessionToResearchSession(session));
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
