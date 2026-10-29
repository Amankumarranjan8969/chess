import type { Color, MoveInput, PieceSymbol, Square, TimeControl } from '@chess/core';

/** Error whose message is safe to return to clients. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseRoomId(v: unknown): string {
  if (typeof v !== 'string') throw new ValidationError('Invalid room code');
  const id = v.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,10}$/.test(id)) throw new ValidationError('Invalid room code');
  return id;
}

/** Strips control characters and markup-significant characters, caps the length. */
export function sanitizeText(v: unknown, fallback: string, maxLen: number): string {
  if (typeof v !== 'string') return fallback;
  const cleaned = v
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
  return cleaned || fallback;
}

export function sanitizeName(v: unknown, fallback: string): string {
  return sanitizeText(v, fallback, 24);
}

export function parseColor(v: unknown): Color | undefined {
  return v === 'w' || v === 'b' ? v : undefined;
}

const MIN_INITIAL_MS = 15_000; // 15 seconds
const MAX_INITIAL_MS = 3 * 60 * 60 * 1000; // 3 hours
const MAX_INCREMENT_MS = 3 * 60 * 1000; // 3 minutes

/** Returns undefined when no time control was supplied (caller falls back to default). */
export function parseTimeControl(v: unknown): TimeControl | undefined {
  if (v === undefined || v === null) return undefined;
  if (!isPlainObject(v)) throw new ValidationError('Invalid time control');
  const { initialMs, incrementMs } = v;
  if (
    typeof initialMs !== 'number' ||
    typeof incrementMs !== 'number' ||
    !Number.isInteger(initialMs) ||
    !Number.isInteger(incrementMs)
  ) {
    throw new ValidationError('Invalid time control');
  }
  if (initialMs < MIN_INITIAL_MS || initialMs > MAX_INITIAL_MS) {
    throw new ValidationError('Time control out of range');
  }
  if (incrementMs < 0 || incrementMs > MAX_INCREMENT_MS) {
    throw new ValidationError('Increment out of range');
  }
  return { initialMs, incrementMs };
}

const SQUARE_RE = /^[a-h][1-8]$/;
const SAN_RE = /^[A-Za-z0-9+#=\-]{2,12}$/;
const PROMOTIONS: PieceSymbol[] = ['q', 'r', 'b', 'n'];

export function parseMove(v: unknown): MoveInput | string {
  if (typeof v === 'string') {
    if (!SAN_RE.test(v)) throw new ValidationError('Invalid move');
    return v;
  }
  if (!isPlainObject(v)) throw new ValidationError('Invalid move');
  const { from, to, promotion } = v;
  if (typeof from !== 'string' || typeof to !== 'string' || !SQUARE_RE.test(from) || !SQUARE_RE.test(to)) {
    throw new ValidationError('Invalid move');
  }
  let promo: PieceSymbol | undefined;
  if (promotion !== undefined && promotion !== null) {
    if (typeof promotion !== 'string' || !PROMOTIONS.includes(promotion as PieceSymbol)) {
      throw new ValidationError('Invalid promotion piece');
    }
    promo = promotion as PieceSymbol;
  }
  return { from: from as Square, to: to as Square, promotion: promo };
}

export function parseDrawType(v: unknown): 'threefold' | 'fifty_moves' {
  if (v === 'threefold' || v === 'fifty_moves') return v;
  throw new ValidationError('Invalid draw claim type');
}

/** Opaque per-browser identifier used to let a player reclaim their seat after reconnecting. */
export function parsePlayerKey(v: unknown): string | undefined {
  if (typeof v === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(v)) return v;
  return undefined;
}
