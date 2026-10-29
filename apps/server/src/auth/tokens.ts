import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TokenPayload {
  /** user id */
  sub: string;
  /** expiry, epoch seconds */
  exp: number;
  /** user's token epoch; bumping it on the server revokes all older tokens (logout) */
  ep: number;
}

/** Minimal HMAC-SHA256 signed bearer tokens. */
export class TokenService {
  constructor(private readonly secret: Buffer) {}

  private mac(body: string): Buffer {
    return createHmac('sha256', this.secret).update(body).digest();
  }

  public sign(payload: TokenPayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${body}.${this.mac(body).toString('base64url')}`;
  }

  public verify(token: string): TokenPayload | null {
    if (typeof token !== 'string' || token.length > 1024) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;

    const expected = this.mac(body);
    const given = Buffer.from(sig, 'base64url');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.exp !== 'number' ||
        typeof payload.ep !== 'number'
      ) {
        return null;
      }
      if (payload.exp * 1000 < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }
}
