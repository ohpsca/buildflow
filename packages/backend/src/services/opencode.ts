const OPENCODE_URL = process.env['OPENCODE_URL'] || 'http://localhost:4096';

interface HealthResponse {
  healthy: boolean;
  version: string;
}

interface SessionResponse {
  id: string;
  title?: string;
}

interface SessionStatusResponse {
  [sessionId: string]: {
    status: 'idle' | 'busy';
  };
}

interface AgentResponse {
  id: string;
  name?: string;
}

export async function checkOpencodeHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCODE_URL}/global/health`);
    if (!response.ok) return false;
    
    const data = await response.json() as HealthResponse;
    return data.healthy === true;
  } catch {
    return false;
  }
}

export async function createSession(title: string): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json() as SessionResponse;
    return data.id || null;
  } catch (err) {
    console.error('Failed to create OpenCode session:', err);
    return null;
  }
}

export async function sendPrompt(
  sessionId: string,
  prompt: string
): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts: [{ type: 'text', text: prompt }],
      }),
    });
    
    return response.ok;
  } catch (err) {
    console.error('Failed to send prompt:', err);
    return false;
  }
}

export async function sendPromptAsync(
  sessionId: string,
  prompt: string
): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/prompt_async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts: [{ type: 'text', text: prompt }],
      }),
    });
    
    return response.status === 204 || response.ok;
  } catch (err) {
    console.error('Failed to send async prompt:', err);
    return false;
  }
}

export async function getSessionStatus(sessionId: string): Promise<'idle' | 'busy' | 'unknown'> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/status`);
    if (!response.ok) return 'unknown';
    
    const data = await response.json() as SessionStatusResponse;
    const status = data[sessionId];
    
    if (!status) return 'idle';
    return status.status === 'busy' ? 'busy' : 'idle';
  } catch {
    return 'unknown';
  }
}

export async function listAgents(): Promise<string[]> {
  try {
    const response = await fetch(`${OPENCODE_URL}/agent`);
    if (!response.ok) return [];
    
    const data = await response.json() as AgentResponse[];
    return data.map((a) => a.id);
  } catch {
    return [];
  }
}
