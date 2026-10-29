import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  UserAccount,
  StoredGame,
  Puzzle,
  Lesson,
  Friend,
  DirectMessage,
  SupportTicket,
  UserPreferences,
  MainSection,
} from '../types/platform.js';
import { INITIAL_GAMES } from '../data/gamesData.js';
import { INITIAL_PUZZLES } from '../data/puzzlesData.js';
import { INITIAL_LESSONS } from '../data/lessonsData.js';

interface PlatformContextType {
  activeSection: MainSection;
  setActiveSection: (sec: MainSection) => void;
  user: UserProfile;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  allAccounts: UserAccount[];
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (
    username: string,
    email: string,
    password: string,
    avatar?: string,
    country?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => void;
  adminUpdateUserRating: (
    userId: string,
    category: 'bullet' | 'blitz' | 'rapid' | 'puzzles',
    newRating: number
  ) => void;
  adminUpdateUserRole: (userId: string, role: 'user' | 'superadmin', title?: string) => void;
  adminDeleteGame: (gameId: string) => void;
  adminAddPuzzle: (puzzle: Puzzle) => void;
  adminBroadcast: string | null;
  setAdminBroadcast: (msg: string | null) => void;
  games: StoredGame[];
  activeReviewGameId: string | null;
  puzzles: Puzzle[];
  activePuzzleId: string | null;
  setActivePuzzleId: (id: string | null) => void;
  lessons: Lesson[];
  friends: Friend[];
  messages: DirectMessage[];
  supportTickets: SupportTicket[];
  preferences: UserPreferences;

  // Actions
  navigateTo: (section: MainSection, params?: { gameId?: string; puzzleId?: string }) => void;
  startReviewGame: (gameId: string) => void;
  recordFinishedGame: (game: StoredGame) => void;
  solvePuzzle: (puzzleId: string, success: boolean, timeSeconds: number) => void;
  completeLesson: (lessonId: string) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  sendMessage: (receiverId: string, content: string) => void;
  submitSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => string;
  addFriend: (username: string) => boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  themeMode: 'light',
  boardTheme: 'green',
  pieceSet: 'neo',
  soundEnabled: true,
  coordinatesVisible: true,
  legalMoveHighlights: true,
  lastMoveHighlight: true,
  animationSpeed: 'normal',
  autoQueen: true,
  highContrast: false,
  reducedMotion: false,
};

const DEFAULT_USER: UserProfile = {
  id: 'usr-alex-001',
  username: 'Alex_Rivera',
  email: 'alex.rivera@chessmaster.io',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  title: 'CM',
  role: 'user',
  bio: 'Tournament competitor & tactical chess enthusiast. Road to 2000 Elo!',
  country: 'United States',
  joinedDate: 'March 2024',
  streakDays: 8,
  dailyGoalSolved: 3,
  ratings: {
    bullet: {
      rating: 1250,
      highest: 1310,
      gamesPlayed: 45,
      wins: 24,
      losses: 17,
      draws: 4,
      history: [
        { date: '2026-10-01', rating: 1210 },
        { date: '2026-10-10', rating: 1235 },
        { date: '2026-10-20', rating: 1242 },
        { date: '2026-10-28', rating: 1250 },
      ],
    },
    blitz: {
      rating: 1420,
      highest: 1490,
      gamesPlayed: 88,
      wins: 48,
      losses: 32,
      draws: 8,
      history: [
        { date: '2026-10-01', rating: 1380 },
        { date: '2026-10-10', rating: 1405 },
        { date: '2026-10-20', rating: 1412 },
        { date: '2026-10-28', rating: 1420 },
      ],
    },
    rapid: {
      rating: 1560,
      highest: 1615,
      gamesPlayed: 64,
      wins: 38,
      losses: 20,
      draws: 6,
      history: [
        { date: '2026-10-01', rating: 1510 },
        { date: '2026-10-10', rating: 1530 },
        { date: '2026-10-20', rating: 1548 },
        { date: '2026-10-28', rating: 1560 },
      ],
    },
    daily: {
      rating: 1500,
      highest: 1520,
      gamesPlayed: 14,
      wins: 8,
      losses: 4,
      draws: 2,
      history: [
        { date: '2026-10-01', rating: 1480 },
        { date: '2026-10-28', rating: 1500 },
      ],
    },
    puzzles: {
      rating: 1680,
      highest: 1720,
      solvedCount: 142,
      failedCount: 28,
      streak: 7,
    },
  },
};

const SUPER_ADMIN_USER: UserProfile = {
  id: 'usr-superadmin',
  username: 'SuperAdmin',
  email: 'superadmin@123',
  avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&q=80',
  title: 'ADMIN',
  role: 'superadmin',
  bio: 'Platform Super Administrator & Master arbiter. Complete system control authority.',
  country: 'Global',
  joinedDate: 'January 2024',
  streakDays: 45,
  dailyGoalSolved: 10,
  ratings: {
    bullet: {
      rating: 2450,
      highest: 2510,
      gamesPlayed: 120,
      wins: 95,
      losses: 18,
      draws: 7,
      history: [
        { date: '2026-10-01', rating: 2400 },
        { date: '2026-10-28', rating: 2450 },
      ],
    },
    blitz: {
      rating: 2520,
      highest: 2580,
      gamesPlayed: 240,
      wins: 190,
      losses: 35,
      draws: 15,
      history: [
        { date: '2026-10-01', rating: 2480 },
        { date: '2026-10-28', rating: 2520 },
      ],
    },
    rapid: {
      rating: 2600,
      highest: 2650,
      gamesPlayed: 150,
      wins: 125,
      losses: 15,
      draws: 10,
      history: [
        { date: '2026-10-01', rating: 2550 },
        { date: '2026-10-28', rating: 2600 },
      ],
    },
    daily: {
      rating: 2400,
      highest: 2420,
      gamesPlayed: 30,
      wins: 25,
      losses: 3,
      draws: 2,
      history: [
        { date: '2026-10-01', rating: 2380 },
        { date: '2026-10-28', rating: 2400 },
      ],
    },
    puzzles: {
      rating: 2850,
      highest: 2900,
      solvedCount: 1100,
      failedCount: 40,
      streak: 32,
    },
  },
};

const GUEST_USER: UserProfile = {
  id: 'usr-guest',
  username: 'Guest_Player',
  email: 'guest@chessmaster.io',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
  title: undefined,
  role: 'user',
  bio: 'Exploring Chessmaster Platform as Guest.',
  country: 'Global',
  joinedDate: 'Today',
  streakDays: 0,
  dailyGoalSolved: 0,
  ratings: {
    bullet: { rating: 1200, highest: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0, history: [{ date: '2026-10-28', rating: 1200 }] },
    blitz: { rating: 1200, highest: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0, history: [{ date: '2026-10-28', rating: 1200 }] },
    rapid: { rating: 1200, highest: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0, history: [{ date: '2026-10-28', rating: 1200 }] },
    daily: { rating: 1200, highest: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0, history: [{ date: '2026-10-28', rating: 1200 }] },
    puzzles: { rating: 1200, highest: 1200, solvedCount: 0, failedCount: 0, streak: 0 },
  },
};

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-superadmin',
    username: 'SuperAdmin',
    email: 'superadmin@123',
    passwordHash: 'superadmin@123',
    role: 'superadmin',
    profile: SUPER_ADMIN_USER,
  },
  {
    id: 'usr-alex-001',
    username: 'Alex_Rivera',
    email: 'alex.rivera@chessmaster.io',
    passwordHash: 'demo123',
    role: 'user',
    profile: DEFAULT_USER,
  },
];

const DEFAULT_FRIENDS: Friend[] = [
  {
    id: 'f-1',
    username: 'Magnus_Fan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    rating: 1485,
    status: 'online',
    currentActivity: 'Playing Blitz 3+2',
  },
  {
    id: 'f-2',
    username: 'Hikaru_Live',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    rating: 1720,
    status: 'in_game',
    currentActivity: 'In Rapid Arena',
  },
  {
    id: 'f-3',
    username: 'Anna_Chess',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    rating: 1640,
    status: 'online',
    currentActivity: 'Studying Endgames',
  },
  {
    id: 'f-4',
    username: 'TacticalWizard',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    rating: 1890,
    status: 'offline',
  },
];

const DEFAULT_MESSAGES: DirectMessage[] = [
  {
    id: 'm-1',
    senderId: 'f-1',
    receiverId: 'usr-alex-001',
    content: 'Great game earlier! That pawn sacrifice in the center caught me completely off guard.',
    timestamp: 'Today at 16:30',
    isRead: true,
  },
  {
    id: 'm-2',
    senderId: 'usr-alex-001',
    receiverId: 'f-1',
    content: 'Thanks! Let’s run another 3+2 blitz rematch later tonight.',
    timestamp: 'Today at 16:35',
    isRead: true,
  },
  {
    id: 'm-3',
    senderId: 'f-2',
    receiverId: 'usr-alex-001',
    content: 'Check out the new puzzle streak challenge!',
    timestamp: 'Yesterday at 20:10',
    isRead: false,
  },
];

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: 'TICK-1042',
    category: 'feature',
    subject: 'Request: PGN Batch Export',
    description: 'Would love an option to export multiple games from the history table as a single .pgn file.',
    status: 'in_review',
    createdAt: '2026-10-25',
    resolutionNote: 'Scheduled for next feature sprint.',
  },
];

function safeParse<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

const SERVER_BASE =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : 'http://localhost:4000';

const PlatformContext = createContext<PlatformContextType | null>(null);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<MainSection>('home');

  // Accounts repository persisted in localStorage with safe fallback
  const [allAccounts, setAllAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('chess_platform_accounts');
      if (!saved) return DEFAULT_ACCOUNTS;
      const parsed: UserAccount[] = JSON.parse(saved);
      const hasAdmin = parsed.some((a) => a.id === 'usr-superadmin');
      if (!hasAdmin) return [DEFAULT_ACCOUNTS[0], ...parsed];
      return parsed;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  // Current session & auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const sess = localStorage.getItem('chess_platform_session');
    return Boolean(sess && sess !== 'logged_out');
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const sess = localStorage.getItem('chess_platform_session');
    if (sess === 'logged_out') return GUEST_USER;
    if (sess === 'usr-superadmin') return SUPER_ADMIN_USER;
    return safeParse<UserProfile>('chess_platform_user', DEFAULT_USER);
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Super Admin live platform broadcast announcement
  const [adminBroadcast, setAdminBroadcast] = useState<string | null>(() => {
    return localStorage.getItem('chess_platform_broadcast') || null;
  });

  const isSuperAdmin = Boolean(isAuthenticated && user.role === 'superadmin');

  // Background sync on mount: check server broadcast and verify session token
  useEffect(() => {
    // 1. Fetch live broadcast from server
    fetch(`${SERVER_BASE}/api/broadcast`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && 'message' in d) {
          setAdminBroadcast(d.message);
        }
      })
      .catch(() => {});

    // 2. Validate current session token if present
    const token = localStorage.getItem('chess_platform_token');
    if (token) {
      fetch(`${SERVER_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && d.user) {
            setUser(d.user.profile || d.user);
            setIsAuthenticated(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Sync accounts and session to localStorage
  useEffect(() => {
    localStorage.setItem('chess_platform_accounts', JSON.stringify(allAccounts));
  }, [allAccounts]);

  useEffect(() => {
    if (adminBroadcast) {
      localStorage.setItem('chess_platform_broadcast', adminBroadcast);
    } else {
      localStorage.removeItem('chess_platform_broadcast');
    }
  }, [adminBroadcast]);

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Secure authentication
  const login = useCallback(
    async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const cleanId = identifier.trim().toLowerCase();
      const cleanPass = password.trim();

      // 1. Try authoritative server authentication
      try {
        const res = await fetch(`${SERVER_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.token && data.user) {
          localStorage.setItem('chess_platform_token', data.token);
          localStorage.setItem('chess_platform_session', data.user.id);
          localStorage.setItem('chess_platform_user', JSON.stringify(data.user.profile || data.user));
          setUser(data.user.profile || data.user);
          setIsAuthenticated(true);
          closeAuthModal();
          return { success: true };
        } else if (data.error) {
          return { success: false, error: data.error };
        }
      } catch {
        // Server unreachable -> fallback to local verified accounts
      }

      // 2. Offline fallback (Super Admin authentication)
      if (
        (cleanId === 'superadmin@123' || cleanId === 'superadmin') &&
        cleanPass === 'superadmin@123'
      ) {
        setUser(SUPER_ADMIN_USER);
        setIsAuthenticated(true);
        localStorage.setItem('chess_platform_session', 'usr-superadmin');
        localStorage.setItem('chess_platform_user', JSON.stringify(SUPER_ADMIN_USER));
        closeAuthModal();
        return { success: true };
      }

      // 3. Offline registered accounts check (STRICT MATCH ONLY - NO BACKDOOR PASSWORD)
      const found = allAccounts.find(
        (a) =>
          (a.email.toLowerCase() === cleanId || a.username.toLowerCase() === cleanId) &&
          a.passwordHash === cleanPass
      );

      if (found) {
        setUser(found.profile);
        setIsAuthenticated(true);
        localStorage.setItem('chess_platform_session', found.id);
        localStorage.setItem('chess_platform_user', JSON.stringify(found.profile));
        closeAuthModal();
        return { success: true };
      }

      return { success: false, error: 'Invalid username, email, or password.' };
    },
    [allAccounts, closeAuthModal]
  );

  const logout = useCallback(async () => {
    const token = localStorage.getItem('chess_platform_token');
    if (token) {
      fetch(`${SERVER_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('chess_platform_token');
    localStorage.setItem('chess_platform_session', 'logged_out');
    localStorage.setItem('chess_platform_user', JSON.stringify(GUEST_USER));
    setIsAuthenticated(false);
    setUser(GUEST_USER);
    if (activeSection === 'admin') {
      setActiveSection('home');
    }
  }, [activeSection]);

  const loginAsDemo = useCallback(() => {
    const demoAcc = allAccounts.find((a) => a.id === 'usr-alex-001') || DEFAULT_ACCOUNTS[1];
    setUser(demoAcc.profile);
    setIsAuthenticated(true);
    localStorage.setItem('chess_platform_session', demoAcc.id);
    localStorage.setItem('chess_platform_user', JSON.stringify(demoAcc.profile));
    closeAuthModal();
  }, [allAccounts, closeAuthModal]);

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      avatar?: string,
      country?: string
    ): Promise<{ success: boolean; error?: string }> => {
      const cleanName = username.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName || cleanName.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters long.' };
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      // 1. Try authoritative server registration
      try {
        const res = await fetch(`${SERVER_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanName, email: cleanEmail, password, avatar, country }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.token && data.user) {
          localStorage.setItem('chess_platform_token', data.token);
          localStorage.setItem('chess_platform_session', data.user.id);
          localStorage.setItem('chess_platform_user', JSON.stringify(data.user.profile || data.user));
          setUser(data.user.profile || data.user);
          setIsAuthenticated(true);
          closeAuthModal();
          return { success: true };
        } else if (data.error) {
          return { success: false, error: data.error };
        }
      } catch {
        // Server unreachable -> fallback to local creation
      }

      const exists = allAccounts.some(
        (a) =>
          a.username.toLowerCase() === cleanName.toLowerCase() ||
          a.email.toLowerCase() === cleanEmail
      );
      if (exists) {
        return { success: false, error: 'An account with that username or email already exists.' };
      }

      const newId = `usr-${Date.now()}`;
      const newProfile: UserProfile = {
        id: newId,
        username: cleanName,
        email: cleanEmail,
        avatar:
          avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        title: undefined,
        role: 'user',
        bio: `Member since ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
        country: country || 'United States',
        joinedDate: new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
        streakDays: 1,
        dailyGoalSolved: 0,
        ratings: {
          bullet: {
            rating: 1200,
            highest: 1200,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            history: [{ date: new Date().toISOString().split('T')[0], rating: 1200 }],
          },
          blitz: {
            rating: 1200,
            highest: 1200,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            history: [{ date: new Date().toISOString().split('T')[0], rating: 1200 }],
          },
          rapid: {
            rating: 1200,
            highest: 1200,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            history: [{ date: new Date().toISOString().split('T')[0], rating: 1200 }],
          },
          daily: {
            rating: 1200,
            highest: 1200,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            history: [{ date: new Date().toISOString().split('T')[0], rating: 1200 }],
          },
          puzzles: { rating: 1200, highest: 1200, solvedCount: 0, failedCount: 0, streak: 0 },
        },
      };

      const newAccount: UserAccount = {
        id: newId,
        username: cleanName,
        email: cleanEmail,
        passwordHash: password,
        role: 'user',
        profile: newProfile,
      };

      setAllAccounts((prev) => [newAccount, ...prev]);
      setUser(newProfile);
      setIsAuthenticated(true);
      localStorage.setItem('chess_platform_session', newId);
      localStorage.setItem('chess_platform_user', JSON.stringify(newProfile));
      closeAuthModal();
      return { success: true };
    },
    [allAccounts, closeAuthModal]
  );

  // Super Admin Management Actions
  const adminUpdateUserRating = useCallback(
    (userId: string, category: 'bullet' | 'blitz' | 'rapid' | 'puzzles', newRating: number) => {
      // Sync to server if token available
      const token = localStorage.getItem('chess_platform_token');
      if (token) {
        fetch(`${SERVER_BASE}/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ category, rating: newRating }),
        }).catch(() => {});
      }

      setAllAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== userId) return acc;
          const p = acc.profile;
          if (category === 'puzzles') {
            return {
              ...acc,
              profile: {
                ...p,
                ratings: {
                  ...p.ratings,
                  puzzles: {
                    ...p.ratings.puzzles,
                    rating: newRating,
                    highest: Math.max(p.ratings.puzzles.highest, newRating),
                  },
                },
              },
            };
          } else {
            const catObj = p.ratings[category];
            return {
              ...acc,
              profile: {
                ...p,
                ratings: {
                  ...p.ratings,
                  [category]: {
                    ...catObj,
                    rating: newRating,
                    highest: Math.max(catObj.highest, newRating),
                  },
                },
              },
            };
          }
        })
      );

      setUser((prevUser) => {
        if (prevUser.id !== userId) return prevUser;
        if (category === 'puzzles') {
          return {
            ...prevUser,
            ratings: {
              ...prevUser.ratings,
              puzzles: {
                ...prevUser.ratings.puzzles,
                rating: newRating,
                highest: Math.max(prevUser.ratings.puzzles.highest, newRating),
              },
            },
          };
        } else {
          const catObj = prevUser.ratings[category];
          return {
            ...prevUser,
            ratings: {
              ...prevUser.ratings,
              [category]: {
                ...catObj,
                rating: newRating,
                highest: Math.max(catObj.highest, newRating),
              },
            },
          };
        }
      });
    },
    []
  );

  const adminUpdateUserRole = useCallback(
    (userId: string, role: 'user' | 'superadmin', title?: string) => {
      // Sync to server if token available
      const token = localStorage.getItem('chess_platform_token');
      if (token) {
        fetch(`${SERVER_BASE}/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        }).catch(() => {});
      }

      setAllAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== userId) return acc;
          return {
            ...acc,
            role,
            profile: {
              ...acc.profile,
              role,
              title: title !== undefined ? title : acc.profile.title,
            },
          };
        })
      );

      setUser((prevUser) => {
        if (prevUser.id !== userId) return prevUser;
        return {
          ...prevUser,
          role,
          title: title !== undefined ? title : prevUser.title,
        };
      });
    },
    []
  );

  const updateAdminBroadcast = useCallback((msg: string | null) => {
    setAdminBroadcast(msg);
    const token = localStorage.getItem('chess_platform_token');
    if (token) {
      fetch(`${SERVER_BASE}/api/admin/broadcast`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      }).catch(() => {});
    }
  }, []);

  const adminDeleteGame = useCallback((gameId: string) => {
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  }, []);

  const adminAddPuzzle = useCallback((puzzle: Puzzle) => {
    setPuzzles((prev) => [puzzle, ...prev]);
  }, []);
  const [games, setGames] = useState<StoredGame[]>(() => {
    return safeParse<StoredGame[]>('chess_platform_games', INITIAL_GAMES);
  });
  const [activeReviewGameId, setActiveReviewGameId] = useState<string | null>(() => {
    return games[0]?.id ?? null;
  });
  const [puzzles, setPuzzles] = useState<Puzzle[]>(() => {
    const parsed = safeParse<Puzzle[]>('chess_platform_puzzles', INITIAL_PUZZLES);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_PUZZLES.length) {
      return INITIAL_PUZZLES;
    }
    return parsed.map((p) => {
      const init = INITIAL_PUZZLES.find((ip) => ip.id === p.id);
      return {
        ...p,
        preFen: p.preFen || init?.preFen,
        opponentMove: p.opponentMove || init?.opponentMove,
      };
    });
  });
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(INITIAL_PUZZLES[0].id);
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    return safeParse<Lesson[]>('chess_platform_lessons', INITIAL_LESSONS);
  });
  const [friends, setFriends] = useState<Friend[]>(() => {
    return safeParse<Friend[]>('chess_platform_friends', DEFAULT_FRIENDS);
  });
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    return safeParse<DirectMessage[]>('chess_platform_messages', DEFAULT_MESSAGES);
  });
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    return safeParse<SupportTicket[]>('chess_platform_tickets', DEFAULT_TICKETS);
  });
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const parsed = safeParse<UserPreferences>('chess_platform_prefs', DEFAULT_PREFERENCES);
    if (typeof document !== 'undefined') {
      if (parsed.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
    return parsed;
  });

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem('chess_platform_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('chess_platform_games', JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem('chess_platform_prefs', JSON.stringify(preferences));
    if (typeof document !== 'undefined') {
      if (preferences.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('chess_platform_tickets', JSON.stringify(supportTickets));
  }, [supportTickets]);

  const navigateTo = useCallback(
    (section: MainSection, params?: { gameId?: string; puzzleId?: string }) => {
      if (params?.gameId) setActiveReviewGameId(params.gameId);
      if (params?.puzzleId) setActivePuzzleId(params.puzzleId);
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const startReviewGame = useCallback((gameId: string) => {
    setActiveReviewGameId(gameId);
    setActiveSection('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const recordFinishedGame = useCallback((game: StoredGame) => {
    setGames((prev) => [game, ...prev]);

    // Update user stats dynamically for both online, local and vs computer matches
    const rawCat = game.timeControlCategory;
    const cat = rawCat === 'computer' ? 'rapid' : rawCat;

    if (cat === 'bullet' || cat === 'blitz' || cat === 'rapid' || cat === 'daily') {
      setUser((prevUser) => {
        const currentCat = prevUser.ratings[cat];
        const newRating = Math.max(100, currentCat.rating + game.ratingChange);
        const isWin = game.result === (game.userColor === 'w' ? '1-0' : '0-1');
        const isDraw = game.result === '1/2-1/2';

        const updatedUser: UserProfile = {
          ...prevUser,
          ratings: {
            ...prevUser.ratings,
            [cat]: {
              ...currentCat,
              rating: newRating,
              highest: Math.max(currentCat.highest, newRating),
              gamesPlayed: currentCat.gamesPlayed + 1,
              wins: currentCat.wins + (isWin ? 1 : 0),
              draws: currentCat.draws + (isDraw ? 1 : 0),
              losses: currentCat.losses + (!isWin && !isDraw ? 1 : 0),
              history: [
                ...currentCat.history,
                { date: new Date().toISOString().split('T')[0], rating: newRating },
              ],
            },
          },
        };

        // Sync into allAccounts
        setAllAccounts((prevAccounts) =>
          prevAccounts.map((acc) =>
            acc.id === prevUser.id ? { ...acc, profile: updatedUser } : acc
          )
        );

        return updatedUser;
      });
    }
  }, []);

  const solvePuzzle = useCallback((puzzleId: string, success: boolean, _timeSeconds: number) => {
    setUser((prev) => {
      const pStats = prev.ratings.puzzles;
      const delta = success ? 10 : -8;
      const newRating = Math.max(400, pStats.rating + delta);

      const updatedUser: UserProfile = {
        ...prev,
        dailyGoalSolved: success ? prev.dailyGoalSolved + 1 : prev.dailyGoalSolved,
        ratings: {
          ...prev.ratings,
          puzzles: {
            ...pStats,
            rating: newRating,
            highest: Math.max(pStats.highest, newRating),
            solvedCount: pStats.solvedCount + (success ? 1 : 0),
            failedCount: pStats.failedCount + (success ? 0 : 1),
            streak: success ? pStats.streak + 1 : 0,
          },
        },
      };

      // Sync into allAccounts
      setAllAccounts((prevAccounts) =>
        prevAccounts.map((acc) =>
          acc.id === prev.id ? { ...acc, profile: updatedUser } : acc
        )
      );

      return updatedUser;
    });
  }, []);

  const completeLesson = useCallback((lessonId: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, completed: true } : l))
    );
  }, []);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'usr-alex-001',
      receiverId,
      content,
      timestamp: 'Just now',
      isRead: true,
    };
    setMessages((prev) => [...prev, newMsg]);
  }, []);

  const submitSupportTicket = useCallback(
    (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
      const id = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket: SupportTicket = {
        ...ticket,
        id,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'open',
      };
      setSupportTickets((prev) => [newTicket, ...prev]);
      return id;
    },
    []
  );

  const addFriend = useCallback((username: string) => {
    const trimmed = username.trim();
    if (!trimmed) return false;
    const newFriend: Friend = {
      id: `f-${Date.now()}`,
      username: trimmed,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      rating: 1400,
      status: 'offline',
    };
    setFriends((prev) => [...prev, newFriend]);
    return true;
  }, []);

  return (
    <PlatformContext.Provider
      value={{
        activeSection,
        setActiveSection,
        user,
        isAuthenticated,
        isSuperAdmin,
        allAccounts,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        logout,
        register,
        loginAsDemo,
        adminUpdateUserRating,
        adminUpdateUserRole,
        adminDeleteGame,
        adminAddPuzzle,
        adminBroadcast,
        setAdminBroadcast: updateAdminBroadcast,
        games,
        activeReviewGameId,
        puzzles,
        activePuzzleId,
        setActivePuzzleId,
        lessons,
        friends,
        messages,
        supportTickets,
        preferences,
        navigateTo,
        startReviewGame,
        recordFinishedGame,
        solvePuzzle,
        completeLesson,
        updatePreferences,
        sendMessage,
        submitSupportTicket,
        addFriend,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return ctx;
}
