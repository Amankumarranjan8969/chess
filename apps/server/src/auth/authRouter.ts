import { randomUUID } from 'node:crypto';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { DataStore, StoredUser } from './dataStore.js';
import { TokenService } from './tokens.js';
import {
  MAX_PASSWORD_LENGTH,
  getDummyHash,
  hashPassword,
  verifyPassword,
} from './password.js';
import { createDefaultProfile, mergeClientProfile } from './profile.js';
import { RateLimiter } from '../security/rateLimit.js';
import { ValidationError, isPlainObject, sanitizeText } from '../security/validation.js';

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const USERNAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]{1,255}$/;
const RESERVED_NAME_RE = /admin|moderator|support|staff/i;
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';
const RATING_CATEGORIES = ['bullet', 'blitz', 'rapid', 'puzzles'];

function publicUser(u: StoredUser) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    version: u.version,
    profile: {
      ...u.profile,
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
    },
  };
}

/** Wraps async route handlers so rejections reach the error middleware instead of crashing. */
function wrap(fn: (req: Request, res: Response) => Promise<unknown> | unknown): RequestHandler {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
  };
}

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Creates the Super Admin account the first time the server runs. Credentials come from
 * SUPERADMIN_ID / SUPERADMIN_PASSWORD; if unset the project owner's chosen default is used
 * (and a warning is printed). Only a salted scrypt hash is stored, and the credentials never
 * reach the browser bundle.
 */
export async function ensureSuperAdmin(store: DataStore): Promise<void> {
  const loginId = (process.env.SUPERADMIN_ID ?? 'superadmin@123').trim();
  const envPassword = process.env.SUPERADMIN_PASSWORD;
  const password = envPassword ?? 'superadmin@123';

  const existing = store.listUsers().find((u) => u.role === 'superadmin');
  if (existing) {
    if (envPassword && !(await verifyPassword(envPassword, existing.passwordHash))) {
      existing.passwordHash = await hashPassword(envPassword);
      existing.tokenEpoch += 1;
      store.save();
      console.log('[ChessServer] Super Admin password updated from SUPERADMIN_PASSWORD');
    }
    return;
  }

  const id = 'usr-superadmin';
  store.addUser({
    id,
    username: 'SuperAdmin',
    email: loginId,
    passwordHash: await hashPassword(password),
    role: 'superadmin',
    profile: createDefaultProfile({
      id,
      username: 'SuperAdmin',
      email: loginId,
      avatar:
        'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&q=80',
      country: 'Global',
      title: 'ADMIN',
      bio: 'Platform Super Administrator & arbiter.',
      baseRating: 2500,
    }),
    version: 1,
    tokenEpoch: 0,
    createdAt: new Date().toISOString(),
  });

  if (!process.env.SUPERADMIN_PASSWORD) {
    console.warn(
      '[ChessServer] Super Admin created with the default password. ' +
        'Set SUPERADMIN_ID and SUPERADMIN_PASSWORD environment variables to change it.'
    );
  }
}

export function createAuthRouter(store: DataStore, tokens: TokenService) {
  const router = Router();

  const loginIpLimiter = new RateLimiter(30, 5 * 60_000);
  const loginIdLimiter = new RateLimiter(8, 5 * 60_000);
  const registerLimiter = new RateLimiter(10, 60 * 60_000);
  const writeLimiter = new RateLimiter(120, 60_000);
  const readLimiter = new RateLimiter(240, 60_000);
  const limiters = [loginIpLimiter, loginIdLimiter, registerLimiter, writeLimiter, readLimiter];

  const issueToken = (user: StoredUser): string =>
    tokens.sign({
      sub: user.id,
      ep: user.tokenEpoch,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    });

  /** Authenticates the Bearer token against the *current* server-side record. */
  const requireAuth: RequestHandler = (req, res, next) => {
    const header = req.headers.authorization;
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = token ? tokens.verify(token) : null;
    const user = payload ? store.findById(payload.sub) : undefined;
    if (!payload || !user || user.tokenEpoch !== payload.ep) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.locals.user = user;
    next();
  };

  /** Role is always read from the server-side record, never from the token or the client. */
  const requireAdmin: RequestHandler = (req, res, next) => {
    const user = res.locals.user as StoredUser;
    if (user.role !== 'superadmin') {
      res.status(403).json({ error: 'Super Admin access required' });
      return;
    }
    next();
  };

  const rateLimit =
    (limiter: RateLimiter): RequestHandler =>
    (req, res, next) => {
      if (!limiter.allow(clientIp(req))) {
        res.status(429).json({ error: 'Too many requests. Please slow down.' });
        return;
      }
      next();
    };

  // ---- Public ---------------------------------------------------------------------------

  router.post(
    '/auth/register',
    wrap(async (req, res) => {
      if (!registerLimiter.allow(clientIp(req))) {
        return res.status(429).json({ error: 'Too many sign-ups from this address. Try again later.' });
      }
      const body = req.body;
      if (!isPlainObject(body)) throw new ValidationError('Invalid request');

      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!USERNAME_RE.test(username)) {
        throw new ValidationError('Username must be 3-20 characters: letters, numbers, _ or -.');
      }
      if (RESERVED_NAME_RE.test(username)) {
        throw new ValidationError('That username is reserved. Please choose another.');
      }
      if (!EMAIL_RE.test(email) || email.length > 100) {
        throw new ValidationError('Please enter a valid email address.');
      }
      if (password.length < 6) throw new ValidationError('Password must be at least 6 characters long.');
      if (password.length > MAX_PASSWORD_LENGTH) throw new ValidationError('Password is too long.');

      if (store.findByIdentifier(username) || store.findByIdentifier(email)) {
        return res.status(409).json({ error: 'An account with that username or email already exists.' });
      }

      let avatar = DEFAULT_AVATAR;
      if (typeof body.avatar === 'string' && body.avatar.length <= 300) {
        try {
          const url = new URL(body.avatar);
          if (url.protocol === 'https:') avatar = url.toString();
        } catch {
          /* keep default */
        }
      }
      const country = sanitizeText(body.country, 'Global', 40);

      const id = `usr-${randomUUID()}`;
      const user: StoredUser = {
        id,
        username,
        email,
        passwordHash: await hashPassword(password),
        role: 'user',
        profile: createDefaultProfile({ id, username, email, avatar, country }),
        version: 1,
        tokenEpoch: 0,
        createdAt: new Date().toISOString(),
      };
      store.addUser(user);
      return res.status(201).json({ token: issueToken(user), user: publicUser(user) });
    })
  );

  router.post(
    '/auth/login',
    wrap(async (req, res) => {
      const body = req.body;
      if (!isPlainObject(body)) throw new ValidationError('Invalid request');
      const identifier =
        typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase().slice(0, 100) : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!identifier || !password || password.length > MAX_PASSWORD_LENGTH) {
        throw new ValidationError('Please enter your username/email and password.');
      }

      const ip = clientIp(req);
      if (!loginIpLimiter.allow(ip) || !loginIdLimiter.allow(`${ip}|${identifier}`)) {
        return res
          .status(429)
          .json({ error: 'Too many login attempts. Please wait a few minutes and try again.' });
      }

      const user = store.findByIdentifier(identifier);
      // Always run a hash comparison so timing does not reveal whether the account exists.
      const ok = await verifyPassword(password, user ? user.passwordHash : await getDummyHash());
      if (!user || !ok) {
        return res.status(401).json({ error: 'Invalid username, email, or password.' });
      }
      return res.json({ token: issueToken(user), user: publicUser(user) });
    })
  );

  router.get('/broadcast', rateLimit(readLimiter), (_req, res) => {
    res.json({ message: store.getBroadcast() });
  });

  // ---- Authenticated users --------------------------------------------------------------

  router.get('/auth/me', rateLimit(readLimiter), requireAuth, (_req, res) => {
    res.json({ user: publicUser(res.locals.user as StoredUser) });
  });

  router.post('/auth/logout', rateLimit(writeLimiter), requireAuth, (_req, res) => {
    const user = res.locals.user as StoredUser;
    user.tokenEpoch += 1; // revokes every token issued so far
    store.save();
    res.json({ ok: true });
  });

  router.put('/profile', rateLimit(writeLimiter), requireAuth, (req, res) => {
    const user = res.locals.user as StoredUser;
    const body = req.body;
    if (!isPlainObject(body)) throw new ValidationError('Invalid request');

    if (body.baseVersion !== user.version) {
      // Someone (e.g. an admin) changed the profile since the client last synced.
      return res.status(409).json({ error: 'Profile changed on the server', user: publicUser(user) });
    }
    user.profile = mergeClientProfile(user.profile, body.profile);
    user.version += 1;
    store.save();
    return res.json({ version: user.version });
  });

  // ---- Super Admin ----------------------------------------------------------------------

  router.get('/admin/users', rateLimit(readLimiter), requireAuth, requireAdmin, (_req, res) => {
    res.json({ users: store.listUsers().map(publicUser) });
  });

  router.patch('/admin/users/:id', rateLimit(writeLimiter), requireAuth, requireAdmin, (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
    const target = store.findById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    const body = req.body;
    if (!isPlainObject(body)) throw new ValidationError('Invalid request');

    if (body.rating !== undefined) {
      const category = body.category;
      const rating = body.rating;
      if (
        typeof category !== 'string' ||
        !RATING_CATEGORIES.includes(category) ||
        typeof rating !== 'number' ||
        !Number.isFinite(rating) ||
        rating < 100 ||
        rating > 3500
      ) {
        throw new ValidationError('Invalid rating update');
      }
      const entry = target.profile.ratings?.[category];
      if (!entry) throw new ValidationError('Unknown rating category');
      entry.rating = Math.round(rating);
      entry.highest = Math.max(entry.highest ?? 0, entry.rating);
    }

    if (body.title !== undefined) {
      const raw = typeof body.title === 'string' ? body.title.trim().toUpperCase() : '';
      if (!/^[A-Z]{0,6}$/.test(raw)) throw new ValidationError('Invalid title');
      if (raw === 'ADMIN' && target.role !== 'superadmin') {
        throw new ValidationError('The ADMIN title is reserved.');
      }
      target.profile.title = raw || undefined;
    }

    target.version += 1;
    store.save();
    return res.json({ user: publicUser(target) });
  });

  router.put('/admin/broadcast', rateLimit(writeLimiter), requireAuth, requireAdmin, (req, res) => {
    const body = req.body;
    if (!isPlainObject(body)) throw new ValidationError('Invalid request');
    const message = body.message === null ? null : sanitizeText(body.message, '', 300) || null;
    store.setBroadcast(message);
    res.json({ message });
  });

  // ---- Error handling (never leaks stack traces) ----------------------------------------

  router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'Malformed JSON' });
      return;
    }
    console.error('[ChessServer] API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return { router, sweep: () => limiters.forEach((l) => l.sweep()) };
}
