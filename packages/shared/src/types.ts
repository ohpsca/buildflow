export type RequestSource = 'chrome_extension' | 'telegram';

export type RequestType = 'url' | 'x_post';

export type SessionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ResearchRequest {
  id: string;
  type: RequestType;
  source: RequestSource;
  url?: string;
  text?: string;
  containedUrls?: string[];
  timestamp: Date;
  telegramChatId?: number;
  chromeTabId?: number;
}

export interface ResearchSession {
  id: string;
  requestId: string;
  opencodeSessionId: string;
  status: SessionStatus;
  title: string;
  reportPath?: string;
  telegramChatId?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface NotificationTarget {
  telegram?: {
    chatId: number;
  };
  chrome?: {
    tabId?: number;
  };
}

export interface CreateResearchResponse {
  success: boolean;
  requestId: string;
  sessionId: string;
  title: string;
}

export interface ListResearchResponse {
  sessions: ResearchSession[];
  total: number;
}

export type ChromeMessageType =
  | 'SEND_RESEARCH'
  | 'RESEARCH_STARTED'
  | 'RESEARCH_COMPLETED'
  | 'SHOW_NOTIFICATION'
  | 'GET_STATUS';

export interface ChromeMessage<T = unknown> {
  type: ChromeMessageType;
  payload?: T;
}

export interface SendResearchPayload {
  type: RequestType;
  url?: string;
  text?: string;
  containedUrls?: string[];
}

export interface ShowNotificationPayload {
  title: string;
  message: string;
  iconUrl?: string;
}
