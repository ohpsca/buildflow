import type { ChromeMessage, ShowNotificationPayload } from '@build-learn/shared';

chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
  if (message.type === 'SHOW_NOTIFICATION') {
    const payload = message.payload as ShowNotificationPayload;
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: payload.title,
      message: payload.message,
    });
    
    sendResponse({ success: true });
  }
  
  return true;
});

chrome.notifications.onClicked.addListener((_notificationId) => {
  chrome.tabs.create({ url: 'http://localhost:4096' });
});
