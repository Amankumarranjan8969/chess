import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
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
  games: StoredGame[];
  activeReviewGameId: string | null;
  puzzles: Puzzle[];
  activePuzzleId: string | null;
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

const PlatformContext = createContext<PlatformContextType | null>(null);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<MainSection>('home');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('chess_platform_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });
  const [games, setGames] = useState<StoredGame[]>(() => {
    const saved = localStorage.getItem('chess_platform_games');
    return saved ? JSON.parse(saved) : INITIAL_GAMES;
  });
  const [activeReviewGameId, setActiveReviewGameId] = useState<string | null>(() => {
    return games[0]?.id ?? null;
  });
  const [puzzles, setPuzzles] = useState<Puzzle[]>(() => {
    const saved = localStorage.getItem('chess_platform_puzzles');
    if (!saved) return INITIAL_PUZZLES;
    try {
      const parsed: Puzzle[] = JSON.parse(saved);
      return parsed.map((p) => {
        const init = INITIAL_PUZZLES.find((ip) => ip.id === p.id);
        return {
          ...p,
          preFen: p.preFen || init?.preFen,
          opponentMove: p.opponentMove || init?.opponentMove,
        };
      });
    } catch {
      return INITIAL_PUZZLES;
    }
  });
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(INITIAL_PUZZLES[0].id);
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('chess_platform_lessons');
    return saved ? JSON.parse(saved) : INITIAL_LESSONS;
  });
  const [friends, setFriends] = useState<Friend[]>(() => {
    const saved = localStorage.getItem('chess_platform_friends');
    return saved ? JSON.parse(saved) : DEFAULT_FRIENDS;
  });
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('chess_platform_messages');
    return saved ? JSON.parse(saved) : DEFAULT_MESSAGES;
  });
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('chess_platform_tickets');
    return saved ? JSON.parse(saved) : DEFAULT_TICKETS;
  });
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('chess_platform_prefs');
    const parsed: UserPreferences = saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
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

    // Update user stats
    const cat = game.timeControlCategory;
    if (cat === 'bullet' || cat === 'blitz' || cat === 'rapid' || cat === 'daily') {
      setUser((prevUser) => {
        const currentCat = prevUser.ratings[cat];
        const newRating = Math.max(100, currentCat.rating + game.ratingChange);
        const isWin = game.result === (game.userColor === 'w' ? '1-0' : '0-1');
        const isDraw = game.result === '1/2-1/2';

        return {
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
      });
    }
  }, []);

  const solvePuzzle = useCallback((puzzleId: string, success: boolean, _timeSeconds: number) => {
    setUser((prev) => {
      const pStats = prev.ratings.puzzles;
      const delta = success ? 10 : -8;
      const newRating = Math.max(400, pStats.rating + delta);

      return {
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
        games,
        activeReviewGameId,
        puzzles,
        activePuzzleId,
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
