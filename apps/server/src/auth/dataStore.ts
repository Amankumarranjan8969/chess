import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export type Role = 'user' | 'superadmin';

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  /** Public profile blob returned to clients (never contains credentials). */
  profile: Record<string, any>;
  /** Incremented on every profile write; clients must present it to avoid overwriting newer data. */
  version: number;
  /** Incremented on logout to revoke previously issued tokens. */
  tokenEpoch: number;
  createdAt: string;
}

interface PersistedData {
  users: StoredUser[];
  broadcast: string | null;
}

/** Small JSON-file backed store (atomic writes). Fine for a LAN-scale deployment. */
export class DataStore {
  private users: StoredUser[] = [];
  private broadcastMessage: string | null = null;
  private readonly file: string;

  constructor(private readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, 'data.json');
    this.load();
  }

  private load(): void {
    if (!fs.existsSync(this.file)) return;
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8')) as Partial<PersistedData>;
      this.users = Array.isArray(parsed.users) ? parsed.users : [];
      this.broadcastMessage = typeof parsed.broadcast === 'string' ? parsed.broadcast : null;
    } catch {
      // Keep the unreadable file for inspection instead of overwriting it.
      const backup = `${this.file}.corrupt-${Date.now()}`;
      try {
        fs.copyFileSync(this.file, backup);
      } catch {
        /* ignore */
      }
      console.error(`[ChessServer] data.json was unreadable; copied to ${backup} and starting empty`);
    }
  }

  public save(): void {
    const tmp = `${this.file}.tmp`;
    const payload: PersistedData = { users: this.users, broadcast: this.broadcastMessage };
    fs.writeFileSync(tmp, JSON.stringify(payload), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }

  /** Signing secret: AUTH_SECRET env var, otherwise a random value generated once and persisted. */
  public getAuthSecret(): Buffer {
    if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) {
      return Buffer.from(process.env.AUTH_SECRET, 'utf8');
    }
    const secretFile = path.join(this.dir, 'auth-secret');
    try {
      const existing = fs.readFileSync(secretFile, 'utf8').trim();
      if (existing.length >= 32) return Buffer.from(existing, 'utf8');
    } catch {
      /* create below */
    }
    const secret = randomBytes(48).toString('hex');
    fs.writeFileSync(secretFile, secret, { mode: 0o600 });
    return Buffer.from(secret, 'utf8');
  }

  public listUsers(): StoredUser[] {
    return this.users;
  }

  public findById(id: string): StoredUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  /** Matches username or email, case-insensitively. */
  public findByIdentifier(identifier: string): StoredUser | undefined {
    const id = identifier.trim().toLowerCase();
    return this.users.find((u) => u.username.toLowerCase() === id || u.email.toLowerCase() === id);
  }

  public addUser(user: StoredUser): void {
    this.users.push(user);
    this.save();
  }

  public getBroadcast(): string | null {
    return this.broadcastMessage;
  }

  public setBroadcast(message: string | null): void {
    this.broadcastMessage = message;
    this.save();
  }
}
