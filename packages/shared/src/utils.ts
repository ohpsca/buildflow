export function generateSlug(text: string, maxLength = 50): string {
  const timestamp = Date.now().toString(36);
  const slug = text
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/^www\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength - timestamp.length - 1);

  return slug ? `${slug}-${timestamp}` : timestamp;
}

export function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname
      .split('/')
      .filter(Boolean)
      .slice(0, 2)
      .join(' / ');

    return pathname ? `${hostname} - ${pathname}` : hostname;
  } catch {
    return url.slice(0, 50);
  }
}

export function titleFromText(text: string, maxLength = 60): string {
  const cleanText = text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanText.length <= maxLength) {
    return cleanText || 'X Post Research';
  }

  return cleanText.slice(0, maxLength - 3).trim() + '...';
}

export function isXPostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isXDomain =
      parsed.hostname === 'x.com' ||
      parsed.hostname === 'twitter.com' ||
      parsed.hostname === 'www.x.com' ||
      parsed.hostname === 'www.twitter.com';

    const isStatusUrl = parsed.pathname.includes('/status/');

    return isXDomain && isStatusUrl;
  } catch {
    return false;
  }
}

export function isGitHubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com'
    );
  } catch {
    return false;
  }
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
