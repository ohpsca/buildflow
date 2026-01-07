export {};
const BACKEND_URL = 'http://localhost:3456';
const BUTTON_CLASS = 'build-learn-btn';
const PROCESSED_ATTR = 'data-build-learn-processed';

interface TweetData {
  text: string;
  urls: string[];
}

function createBuildButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = BUTTON_CLASS;
  btn.innerHTML = '🔨';
  btn.title = 'Send to Build & Learn';
  return btn;
}

function extractTweetData(article: Element): TweetData | null {
  const textEl = article.querySelector('[data-testid="tweetText"]');
  const text = textEl?.textContent || '';
  
  if (!text.trim()) {
    return null;
  }

  const urls: string[] = [];
  const links = article.querySelectorAll('a[href]');
  
  links.forEach((link) => {
    const href = (link as HTMLAnchorElement).href;
    if (href && !href.includes('x.com') && !href.includes('twitter.com') && href.startsWith('http')) {
      urls.push(href);
    }
  });

  return { text, urls: [...new Set(urls)] };
}

async function sendToBackend(data: TweetData): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'x_post',
        source: 'chrome_extension',
        text: data.text,
        containedUrls: data.urls,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

function findButtonContainer(article: Element): Element | null {
  const timeEl = article.querySelector('time');
  if (!timeEl) return null;

  const timeLink = timeEl.closest('a');
  if (!timeLink) return null;

  return timeLink.parentElement;
}

function injectButton(article: Element): void {
  if (article.hasAttribute(PROCESSED_ATTR)) {
    return;
  }
  
  article.setAttribute(PROCESSED_ATTR, 'true');

  const container = findButtonContainer(article);
  if (!container) return;

  const existingBtn = container.querySelector(`.${BUTTON_CLASS}`);
  if (existingBtn) return;

  const btn = createBuildButton();
  
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const data = extractTweetData(article);
    if (!data) {
      btn.innerHTML = '❌';
      setTimeout(() => { btn.innerHTML = '🔨'; }, 2000);
      return;
    }

    btn.innerHTML = '⏳';
    btn.disabled = true;

    const success = await sendToBackend(data);
    
    btn.innerHTML = success ? '✅' : '❌';
    
    if (success) {
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: 'Research Started',
          message: 'X post sent to OpenCode',
        },
      });
    }

    setTimeout(() => {
      btn.innerHTML = '🔨';
      btn.disabled = false;
    }, 3000);
  });

  container.appendChild(btn);
}

function processTweets(): void {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  articles.forEach(injectButton);
}

function initObserver(): void {
  processTweets();

  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
        break;
      }
    }
    
    if (shouldProcess) {
      processTweets();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initObserver);
} else {
  initObserver();
}
