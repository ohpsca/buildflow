export {};
const BACKEND_URL = 'http://localhost:3456';

interface StatusElement extends HTMLElement {
  className: string;
  textContent: string;
  style: CSSStyleDeclaration;
}

async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

function showStatus(
  element: StatusElement,
  type: 'success' | 'error' | 'loading',
  message: string
): void {
  element.className = `status ${type}`;
  element.textContent = message;
  element.style.display = 'block';
}

function hideStatus(element: StatusElement): void {
  element.style.display = 'none';
}

async function sendResearch(url: string): Promise<{ success: boolean; sessionId?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/learn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'url',
      source: 'chrome_extension',
      url,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function init(): Promise<void> {
  const urlDisplay = document.getElementById('urlDisplay') as HTMLElement;
  const buildBtn = document.getElementById('buildBtn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as StatusElement;

  const tab = await getCurrentTab();

  if (!tab?.url) {
    urlDisplay.textContent = 'No URL available';
    buildBtn.disabled = true;
    return;
  }

  const url = tab.url;
  urlDisplay.textContent = url;

  buildBtn.addEventListener('click', async () => {
    buildBtn.disabled = true;
    showStatus(statusEl, 'loading', 'Sending to OpenCode...');

    try {
      const result = await sendResearch(url);

      if (result.success) {
        showStatus(statusEl, 'success', '✅ Research started! Check OpenCode.');
        
        chrome.runtime.sendMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title: 'Research Started',
            message: 'OpenCode is processing your request',
          },
        });
      } else {
        showStatus(statusEl, 'error', '❌ Failed to start research');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        showStatus(statusEl, 'error', '❌ Backend not running (localhost:3456)');
      } else {
        showStatus(statusEl, 'error', `❌ Error: ${message}`);
      }
    } finally {
      setTimeout(() => {
        buildBtn.disabled = false;
      }, 2000);
    }
  });
}

init();
