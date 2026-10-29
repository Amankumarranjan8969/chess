/**
 * Origin allow-list. The game is meant to be played on localhost / a home or office LAN,
 * so by default only browser pages served from loopback, private-network or single-label
 * (LAN host name) addresses may talk to the API and the WebSocket endpoint. Pages on the
 * public internet are rejected. Extra origins can be added with ALLOWED_ORIGINS=a,b,c.
 */
const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isPrivateHost(rawHost: string): boolean {
  const host = rawHost.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host === '::1') return true;
  if (host.endsWith('.local')) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127 || a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  // Single-label names such as "DESKTOP-ABC" are LAN host names, never public domains.
  if (!host.includes('.') && !host.includes(':')) return true;
  return false;
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  // Non-browser clients and same-origin requests send no Origin header.
  if (!origin) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return isPrivateHost(url.hostname);
  } catch {
    return false;
  }
}
