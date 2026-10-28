import { Color, DetailedMove, GameSnapshot, TimeControl } from '@chess/core';

export type MainSection =
  | 'home'
  | 'play'
  | 'review'
  | 'puzzles'
  | 'learn'
  | 'watch'
  | 'more'
  | 'connect';

export interface UserRating {
  rating: number;
  highest: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  history: { date: string; rating: number }[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  title?: string;
  bio: string;
  country: string;
  joinedDate: string;
  streakDays: number;
  dailyGoalSolved: number;
  ratings: {
    bullet: UserRating;
    blitz: UserRating;
    rapid: UserRating;
    daily: UserRating;
    puzzles: {
      rating: number;
      highest: number;
      solvedCount: number;
      failedCount: number;
      streak: number;
    };
  };
}

export interface StoredMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  uci: string;
  color: Color;
  piece?: string;
  captured?: string;
  fenAfter: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isCastling?: boolean;
  isEnPassant?: boolean;
  ply?: number;
  timestamp?: number;
}

export interface StoredGame {
  id: string;
  date: string;
  timeControl: string;
  timeControlCategory: 'bullet' | 'blitz' | 'rapid' | 'daily' | 'computer';
  white: { name: string; rating: number; avatar?: string };
  black: { name: string; rating: number; avatar?: string };
  userColor: Color;
  result: '1-0' | '0-1' | '1/2-1/2';
  endReason: string;
  ratingChange: number;
  initialFen: string;
  pgn: string;
  moveHistory: (DetailedMove | StoredMove)[];
  opening?: { eco: string; name: string };
  durationSeconds: number;
}

export type MoveClassification =
  | 'book'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win';

export interface AnalyzedMove {
  moveNumber: number;
  color: Color;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  classification: MoveClassification;
  evalBeforeCp: number;
  evalAfterCp: number;
  bestAlternativeSan?: string;
  bestAlternativeUci?: string;
  variationSans?: string[];
  explanation: {
    whatHappened: string;
    whyItMatters: string;
    tacticalIdea?: string;
  };
  capturedPiece?: string;
  isCheck?: boolean;
}

export interface GameReviewReport {
  gameId: string;
  analyzedMoves: AnalyzedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteStats: Record<MoveClassification, number>;
  blackStats: Record<MoveClassification, number>;
  biggestMistake?: { moveIndex: number; move: AnalyzedMove };
  bestMove?: { moveIndex: number; move: AnalyzedMove };
  openingInfo?: { eco: string; name: string; departureMoveNumber?: number };
  summary: {
    headline: string;
    keyTakeaways: string[];
    recommendedPracticeTopics: string[];
  };
}

export interface Puzzle {
  id: string;
  title: string;
  fen: string;
  preFen?: string;
  opponentMove?: {
    from: string;
    to: string;
    san: string;
    piece?: string;
  };
  sideToMove: Color;
  rating: number;
  theme: string;
  category:
    | 'mate_in_1'
    | 'mate_in_2'
    | 'mate_in_3'
    | 'fork'
    | 'pin'
    | 'skewer'
    | 'discovered_attack'
    | 'sacrifice'
    | 'back_rank'
    | 'endgame'
    | 'deflection';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  solutionMoves: { from: string; to: string; promotion?: string; san?: string }[];
  hint: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  description: string;
  durationMinutes: number;
  fen: string;
  objectives: string[];
  completed: boolean;
}

export interface Friend {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  status: 'online' | 'offline' | 'in_game';
  currentActivity?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface SupportTicket {
  id: string;
  category: 'bug' | 'feature' | 'dispute' | 'account';
  subject: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved';
  createdAt: string;
  resolutionNote?: string;
}

export interface UserPreferences {
  themeMode: 'light' | 'dark' | 'system';
  boardTheme: 'green' | 'wood' | 'ocean' | 'classic';
  pieceSet: 'neo' | 'classic';
  soundEnabled: boolean;
  coordinatesVisible: boolean;
  legalMoveHighlights: boolean;
  lastMoveHighlight: boolean;
  animationSpeed: 'fast' | 'normal' | 'slow' | 'none';
  autoQueen: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}
