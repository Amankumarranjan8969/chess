import { ValidationError, isPlainObject, sanitizeText } from '../security/validation.js';

const RATED_MODES = ['bullet', 'blitz', 'rapid', 'daily'] as const;
const MIN_RATING = 100;
const MAX_RATING = 3500;
/** Largest rating movement accepted in one profile write (a single game is at most ~20). */
const MAX_RATING_DELTA = 100;

export function createDefaultProfile(opts: {
  id: string;
  username: string;
  email: string;
  avatar: string;
  country: string;
  title?: string;
  bio?: string;
  baseRating?: number;
}): Record<string, any> {
  const base = opts.baseRating ?? 1200;
  const today = new Date().toISOString().slice(0, 10);
  const mode = () => ({
    rating: base,
    highest: base,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    history: [{ date: today, rating: base }],
  });
  return {
    id: opts.id,
    username: opts.username,
    email: opts.email,
    avatar: opts.avatar,
    title: opts.title,
    role: 'user',
    bio: opts.bio ?? `Member since ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}.`,
    country: opts.country,
    joinedDate: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    streakDays: 1,
    dailyGoalSolved: 0,
    ratings: {
      bullet: mode(),
      blitz: mode(),
      rapid: mode(),
      daily: mode(),
      puzzles: { rating: base, highest: base, solvedCount: 0, failedCount: 0, streak: 0 },
    },
  };
}

function num(v: unknown, label: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
    throw new ValidationError(`Invalid ${label}`);
  }
  return Math.round(v);
}

/**
 * Builds the profile to persist from client-submitted data. Only gameplay-driven fields are
 * taken from the client (ratings and counters, within sane bounds); identity, role and title
 * always come from the existing server-side record.
 */
export function mergeClientProfile(
  existing: Record<string, any>,
  incoming: unknown
): Record<string, any> {
  if (!isPlainObject(incoming)) throw new ValidationError('Invalid profile');
  if (JSON.stringify(incoming).length > 40_000) throw new ValidationError('Profile too large');

  const inRatings = incoming.ratings;
  if (!isPlainObject(inRatings)) throw new ValidationError('Invalid ratings');

  const ratings: Record<string, any> = {};
  for (const mode of RATED_MODES) {
    const r = inRatings[mode];
    const old = existing.ratings?.[mode];
    if (!isPlainObject(r) || !old) throw new ValidationError(`Invalid ${mode} rating`);

    const rating = num(r.rating, `${mode} rating`, MIN_RATING, MAX_RATING);
    if (Math.abs(rating - old.rating) > MAX_RATING_DELTA) {
      throw new ValidationError('Rating change too large');
    }
    const history = Array.isArray(r.history) ? r.history.slice(-400) : [];
    ratings[mode] = {
      rating,
      highest: num(r.highest, `${mode} highest`, MIN_RATING, MAX_RATING),
      gamesPlayed: num(r.gamesPlayed, 'games played', 0, 1_000_000),
      wins: num(r.wins, 'wins', 0, 1_000_000),
      losses: num(r.losses, 'losses', 0, 1_000_000),
      draws: num(r.draws, 'draws', 0, 1_000_000),
      history: history
        .filter((h: any) => isPlainObject(h))
        .map((h: any) => ({
          date: sanitizeText(h.date, '', 10),
          rating: num(h.rating, 'history rating', MIN_RATING, MAX_RATING),
        })),
    };
  }

  const p = inRatings.puzzles;
  const oldP = existing.ratings?.puzzles;
  if (!isPlainObject(p) || !oldP) throw new ValidationError('Invalid puzzle rating');
  const puzzleRating = num(p.rating, 'puzzle rating', MIN_RATING, MAX_RATING);
  if (Math.abs(puzzleRating - oldP.rating) > MAX_RATING_DELTA) {
    throw new ValidationError('Rating change too large');
  }
  ratings.puzzles = {
    rating: puzzleRating,
    highest: num(p.highest, 'puzzle highest', MIN_RATING, MAX_RATING),
    solvedCount: num(p.solvedCount, 'solved count', 0, 1_000_000),
    failedCount: num(p.failedCount, 'failed count', 0, 1_000_000),
    streak: num(p.streak, 'streak', 0, 1_000_000),
  };

  return {
    ...existing,
    bio: sanitizeText(incoming.bio, existing.bio ?? '', 200),
    streakDays: num(incoming.streakDays, 'streak days', 0, 100_000),
    dailyGoalSolved: num(incoming.dailyGoalSolved, 'daily goal', 0, 10_000),
    ratings,
  };
}
