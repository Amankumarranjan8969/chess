import React, { useState, useMemo } from 'react';
import { usePlatform } from '../context/PlatformContext.js';
import { StoredGame, MainSection } from '../types/platform.js';
import { AIDifficulty } from '../hooks/useChessAI.js';
import {
  Zap,
  Flame,
  Clock,
  Bot,
  Users,
  Share2,
  TrendingUp,
  Award,
  ChevronRight,
  Play,
  RotateCcw,
  Download,
  Search,
  Filter,
  UserPlus,
  Wifi,
  ExternalLink,
  Info,
  Calendar,
  X,
  Sparkles,
  Check,
  Target,
  ShieldAlert,
} from 'lucide-react';

interface HomeDashboardProps {
  onStartComputerGame: (timeControl: string, color: 'w' | 'b', difficulty?: AIDifficulty) => void;
  onOpenWifiModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartComputerGame,
  onOpenWifiModal,
}) => {
  const { user, games, friends, startReviewGame, navigateTo, addFriend } = usePlatform();

  // Statistics Category & Period State
  const [statCategory, setStatCategory] = useState<'rapid' | 'blitz' | 'bullet' | 'daily'>('rapid');
  const [statsPeriod, setStatsPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Interactive Streak Modal State
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);

  // Time Control Selector for Quick Play
  const [selectedTimeControl, setSelectedTimeControl] = useState<string>('10+0');
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('grandmaster');

  // Game History Filters
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<'all' | 'rapid' | 'blitz' | 'bullet'>('all');
  const [historyResultFilter, setHistoryResultFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Friends & Social State
  const [friendSearch, setFriendSearch] = useState<string>('');
  const [newFriendInput, setNewFriendInput] = useState<string>('');
  const [friendAddedToast, setFriendAddedToast] = useState<string | null>(null);

  // Active Rating object
  const activeRating = user.ratings[statCategory];
  const winRate =
    activeRating.gamesPlayed > 0
      ? Math.round((activeRating.wins / activeRating.gamesPlayed) * 100)
      : 50;

  // Filtered Game History
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // Category filter
      if (historyCategoryFilter !== 'all' && g.timeControlCategory !== historyCategoryFilter) {
        return false;
      }

      // Result filter
      const isUserWhite = g.userColor === 'w';
      const isWin = g.result === (isUserWhite ? '1-0' : '0-1');
      const isDraw = g.result === '1/2-1/2';
      const isLoss = !isWin && !isDraw;

      if (historyResultFilter === 'win' && !isWin) return false;
      if (historyResultFilter === 'loss' && !isLoss) return false;
      if (historyResultFilter === 'draw' && !isDraw) return false;

      // Search query
      if (historySearchQuery.trim()) {
        const query = historySearchQuery.toLowerCase();
        const opponent = isUserWhite ? g.black.name.toLowerCase() : g.white.name.toLowerCase();
        const opening = g.opening?.name.toLowerCase() || '';
        if (!opponent.includes(query) && !opening.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [games, historyCategoryFilter, historyResultFilter, historySearchQuery]);

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFriendInput.trim()) {
      addFriend(newFriendInput);
      setFriendAddedToast(`Friend request sent to ${newFriendInput.trim()}!`);
      setNewFriendInput('');
      setTimeout(() => setFriendAddedToast(null), 3000);
    }
  };

  const exportPGN = (game: StoredGame) => {
    navigator.clipboard.writeText(game.pgn);
    alert('Game PGN copied to clipboard!');
  };

  // Generate SVG points for rating sparkline chart
  const ratingHistoryPoints = useMemo(() => {
    const history = activeRating.history || [];
    if (history.length === 0) return '';

    const ratings = history.map((h) => h.rating);
    const min = Math.min(...ratings) - 20;
    const max = Math.max(...ratings) + 20;
    const range = Math.max(1, max - min);

    const width = 360;
    const height = 80;

    return history
      .map((h, i) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - ((h.rating - min) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activeRating]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* 1. COMPACT PLAYER WELCOME & INTERACTIVE STREAK BANNER */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-stone-900 dark:via-stone-850 dark:to-stone-900 text-stone-900 dark:text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#739552]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-[#739552]"
            />
            {user.title && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-md shadow-sm">
                {user.title}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-stone-900 dark:text-white">
                Welcome back, {user.username}!
              </h1>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 max-w-md font-medium">
              {user.bio}
            </p>

            {/* Interactive Streak & Goals Pill */}
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
              <button
                onClick={() => setShowStreakModal(true)}
                title="View Streak & Activity History"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20 dark:hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 transition-all cursor-pointer group"
              >
                <Flame size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                <span>{user.streakDays}-Day Streak</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400/80 underline ml-0.5">View</span>
              </button>
              <span className="text-stone-400 dark:text-stone-500">•</span>
              <div
                onClick={() => navigateTo('puzzles')}
                className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                title="Go to Puzzles"
              >
                <Target size={14} />
                <span>Daily Goal: {user.dailyGoalSolved}/3 Solved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Uniform Clickable Rating Cards with Trends */}
        <div className="flex items-center gap-2.5 z-10 flex-wrap">
          {/* Rapid Card */}
          <div
            onClick={() => {
              setStatCategory('rapid');
              const el = document.getElementById('stats-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Click to view Rapid Statistics"
            className={`bg-white dark:bg-stone-800/90 hover:bg-stone-50 dark:hover:bg-stone-800 border rounded-2xl p-2.5 flex flex-col justify-between min-w-[105px] h-[74px] cursor-pointer transition-all shadow-xs ${
              statCategory === 'rapid'
                ? 'border-[#739552] ring-2 ring-[#739552]/40 shadow-sm'
                : 'border-stone-200 dark:border-stone-700/80 hover:border-stone-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                Rapid
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp size={10} className="mr-0.5" /> +38
              </span>
            </div>
            <span className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {user.ratings.rapid.rating}
            </span>
          </div>

          {/* Blitz Card */}
          <div
            onClick={() => {
              setStatCategory('blitz');
              const el = document.getElementById('stats-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Click to view Blitz Statistics"
            className={`bg-white dark:bg-stone-800/90 hover:bg-stone-50 dark:hover:bg-stone-800 border rounded-2xl p-2.5 flex flex-col justify-between min-w-[105px] h-[74px] cursor-pointer transition-all shadow-xs ${
              statCategory === 'blitz'
                ? 'border-yellow-500 ring-2 ring-yellow-500/40 shadow-sm'
                : 'border-stone-200 dark:border-stone-700/80 hover:border-stone-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                Blitz
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-yellow-400 flex items-center">
                <TrendingUp size={10} className="mr-0.5" /> +25
              </span>
            </div>
            <span className="text-xl font-mono font-extrabold text-amber-600 dark:text-yellow-400">
              {user.ratings.blitz.rating}
            </span>
          </div>

          {/* Bullet Card */}
          <div
            onClick={() => {
              setStatCategory('bullet');
              const el = document.getElementById('stats-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Click to view Bullet Statistics"
            className={`bg-white dark:bg-stone-800/90 hover:bg-stone-50 dark:hover:bg-stone-800 border rounded-2xl p-2.5 flex flex-col justify-between min-w-[105px] h-[74px] cursor-pointer transition-all shadow-xs ${
              statCategory === 'bullet'
                ? 'border-amber-600 ring-2 ring-amber-600/40 shadow-sm'
                : 'border-stone-200 dark:border-stone-700/80 hover:border-stone-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                Bullet
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 flex items-center">
                <TrendingUp size={10} className="mr-0.5" /> +15
              </span>
            </div>
            <span className="text-xl font-mono font-extrabold text-amber-700 dark:text-amber-400">
              {user.ratings.bullet.rating}
            </span>
          </div>

          {/* Puzzles Card */}
          <div
            onClick={() => navigateTo('puzzles')}
            title="Click to solve tactical puzzles"
            className="bg-white dark:bg-stone-800/90 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/80 hover:border-purple-500 rounded-2xl p-2.5 flex flex-col justify-between min-w-[105px] h-[74px] cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                Puzzles
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                {user.ratings.puzzles.streak} streak
              </span>
            </div>
            <span className="text-xl font-mono font-extrabold text-purple-600 dark:text-purple-400">
              {user.ratings.puzzles.rating}
            </span>
          </div>
        </div>
      </div>

      {/* 2. START PLAYING: TIME CONTROLS & UNIFORM FULL-CARD CLICKABLE OPTIONS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Play size={18} className="text-[#739552]" fill="currentColor" />
              Start Playing
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Choose your format and jump right in
            </span>
          </div>

          {/* Quick Time Control Selector Pills */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 p-1 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 shadow-xs">
            <span className="text-[11px] text-stone-600 dark:text-stone-400 px-2 font-medium">
              Time Format:
            </span>
            {[
              { id: '1+0', label: '1 min Bullet' },
              { id: '3+2', label: '3+2 Blitz' },
              { id: '5+0', label: '5 min Blitz' },
              { id: '10+0', label: '10 min Rapid' },
              { id: '15+10', label: '15+10 Rapid' },
            ].map((tc) => (
              <button
                key={tc.id}
                onClick={() => setSelectedTimeControl(tc.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedTimeControl === tc.id
                    ? 'bg-[#739552] text-white shadow-sm'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                {tc.id}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Consistent Full-Card Clickable Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Rapid 10+0 */}
          <button
            onClick={() => onStartComputerGame(selectedTimeControl || '10+0', 'w')}
            className="p-4 min-h-[195px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-[#739552] dark:hover:border-[#739552] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Clock size={16} className="text-[#739552]" /> Rapid Chess
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#739552]/10 text-[#5f7d41] dark:text-[#88c558] border border-[#739552]/20">
                  {selectedTimeControl}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2.5 leading-relaxed font-medium">
                Standard tournament pacing. Ideal for thoughtful positional maneuvers and calculating tactical combinations.
              </p>
            </div>
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-[#739552] group-hover:translate-x-1 transition-transform">
              <span>Play Rapid ({selectedTimeControl})</span>
              <ChevronRight size={15} />
            </div>
          </button>

          {/* Card 2: Blitz 3+2 */}
          <button
            onClick={() => onStartComputerGame('3+2', 'w')}
            className="p-4 min-h-[195px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Zap size={16} className="text-amber-500" /> Blitz 3+2
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Fast Paced
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2.5 leading-relaxed font-medium">
                3 minutes with 2-second increment per move. Fast, thrilling tactical battles where rapid intuition counts.
              </p>
            </div>
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Play Blitz 3+2</span>
              <ChevronRight size={15} />
            </div>
          </button>

          {/* Card 3: Play a Friend (Local Wi-Fi Network & Online Challenge) */}
          <button
            onClick={onOpenWifiModal}
            className="p-4 min-h-[195px] rounded-2xl bg-gradient-to-br from-[#739552]/10 via-[#739552]/5 to-transparent border border-[#739552]/40 hover:border-[#739552] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#739552]/20">
                <span className="font-extrabold text-sm text-[#466528] dark:text-[#88c558] flex items-center gap-1.5">
                  <Wifi size={16} className="text-[#739552]" /> Play a Friend
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#739552] text-white shadow-sm">
                  Wi-Fi Match
                </span>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 mt-2.5 leading-relaxed font-medium">
                Share a direct link with anyone on your same Wi-Fi network or enter a room code for instant, low-latency play.
              </p>
            </div>
            <div className="pt-3 border-t border-[#739552]/20 flex items-center justify-between text-xs font-bold text-[#5f7d41] dark:text-[#88c558] group-hover:translate-x-1 transition-transform">
              <span>Generate Wi-Fi Room</span>
              <Share2 size={15} />
            </div>
          </button>

          {/* Card 4: vs Computer with In-Card Difficulty Selector */}
          <div className="p-4 min-h-[195px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Bot size={16} className="text-rose-500" /> vs Computer
                </span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as AIDifficulty)}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 focus:outline-none shadow-xs"
                  title="Select AI Difficulty"
                >
                  <option value="easy">Easy (1000)</option>
                  <option value="medium">Medium (1500)</option>
                  <option value="hard">Hard (1950)</option>
                  <option value="grandmaster">Expert (2400+)</option>
                </select>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2.5 leading-relaxed font-medium">
                Calibrated engine with Quiescence search and tactical evaluation. Test your opening prep and endgame skills.
              </p>
            </div>
            <button
              onClick={() => onStartComputerGame('5+3', 'w', selectedDifficulty)}
              className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform w-full text-left"
            >
              <span>Challenge AI ({selectedDifficulty})</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. PERFORMANCE STATISTICS: TABS, HIGH-CONTRAST METRICS, SPARKLINE CHART & WIN-RATE BAR */}
      <div id="stats-section" className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#739552]" />
              Performance Statistics Overview
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Verified Elo ratings calculated from authoritative match records
            </p>
          </div>

          {/* Time control tab toggle */}
          <div className="flex items-center bg-white dark:bg-stone-800 p-1 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 shadow-xs">
            {(['rapid', 'blitz', 'bullet', 'daily'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setStatCategory(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statCategory === cat
                    ? 'bg-[#739552] text-white shadow-sm'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-750'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* High-Contrast 4-Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Current Rating & Highest */}
          <div className="bg-white dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Current {statCategory} Rating
              </span>
              <span title="Calculated from your official matches" className="cursor-help">
                <Info size={13} className="text-stone-400" />
              </span>
            </div>
            <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-stone-100 mt-1">
              {activeRating.rating}
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
              Peak: {activeRating.highest} Elo
            </span>
          </div>

          {/* Card 2: Games Played & Win Rate */}
          <div className="bg-white dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Total Games Played
              </span>
              <span title="Total rated games completed" className="cursor-help">
                <Info size={13} className="text-stone-400" />
              </span>
            </div>
            <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-stone-100 mt-1">
              {activeRating.gamesPlayed}
            </div>
            <span className="text-xs text-stone-700 dark:text-stone-300 font-semibold block mt-1">
              Overall Win Rate: {winRate}%
            </span>
          </div>

          {/* Card 3: Win / Draw / Loss Record */}
          <div className="bg-white dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                W / D / L Breakdown
              </span>
              <span title="Wins, Draws, and Losses in this format" className="cursor-help">
                <Info size={13} className="text-stone-400" />
              </span>
            </div>
            <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-600 dark:text-emerald-400">{activeRating.wins}W</span>
              <span className="text-stone-400">-</span>
              <span className="text-stone-600 dark:text-stone-300">{activeRating.draws}D</span>
              <span className="text-stone-400">-</span>
              <span className="text-rose-500">{activeRating.losses}L</span>
            </div>
            <span className="text-xs text-stone-700 dark:text-stone-300 font-semibold block mt-1">
              {(
                ((activeRating.wins + 0.5 * activeRating.draws) /
                  Math.max(1, activeRating.gamesPlayed)) *
                100
              ).toFixed(1)}
              % Score
            </span>
          </div>

          {/* Card 4: Recent 30-Day Trend */}
          <div className="bg-white dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Recent 30-Day Trend
              </span>
              <TrendingUp size={13} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <span>+38 pts</span>
            </div>
            <span className="text-xs text-stone-700 dark:text-stone-300 font-semibold block mt-1">
              +6.2% rating gain
            </span>
          </div>
        </div>

        {/* Visual Win-Rate Progress Bar & Tactical Puzzle Rating Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Visual Segmented Win/Draw/Loss Bar */}
          <div className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-200">
                Win / Draw / Loss Visual Distribution
              </span>
              <span className="text-xs font-mono font-semibold text-stone-500">
                {activeRating.gamesPlayed} Matches
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-stone-200 dark:bg-stone-700">
              <div
                style={{
                  width: `${(activeRating.wins / Math.max(1, activeRating.gamesPlayed)) * 100}%`,
                }}
                className="bg-emerald-500 h-full transition-all"
                title={`Wins: ${activeRating.wins}`}
              />
              <div
                style={{
                  width: `${(activeRating.draws / Math.max(1, activeRating.gamesPlayed)) * 100}%`,
                }}
                className="bg-stone-400 dark:bg-stone-500 h-full transition-all"
                title={`Draws: ${activeRating.draws}`}
              />
              <div
                style={{
                  width: `${(activeRating.losses / Math.max(1, activeRating.gamesPlayed)) * 100}%`,
                }}
                className="bg-rose-500 h-full transition-all"
                title={`Losses: ${activeRating.losses}`}
              />
            </div>

            {/* Labels under the bar */}
            <div className="flex items-center justify-between text-[11px] font-semibold mt-2.5">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Wins ({activeRating.wins} •{' '}
                {Math.round((activeRating.wins / Math.max(1, activeRating.gamesPlayed)) * 100)}%)
              </span>
              <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                Draws ({activeRating.draws} •{' '}
                {Math.round((activeRating.draws / Math.max(1, activeRating.gamesPlayed)) * 100)}%)
              </span>
              <span className="text-rose-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Losses ({activeRating.losses} •{' '}
                {Math.round((activeRating.losses / Math.max(1, activeRating.gamesPlayed)) * 100)}%)
              </span>
            </div>
          </div>

          {/* Puzzle Performance Card (Explicitly Separated from Match Elo) */}
          <div className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl">
                🧩
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                    Tactical Puzzle Rating
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Separate Metric
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Solved: {user.ratings.puzzles.solvedCount} puzzles • Streak: {user.ratings.puzzles.streak} in a row
                </p>
                <div className="text-xs font-mono font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                  Rating: {user.ratings.puzzles.rating} (Peak: {user.ratings.puzzles.highest})
                </div>
              </div>
            </div>

            <button
              onClick={() => navigateTo('puzzles')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 shrink-0"
            >
              <span>Solve Puzzles</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Rating History Sparkline Chart (7d / 30d / 90d Filter) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Rating Progression ({statCategory.toUpperCase()})
              </span>
              <span className="text-[11px] text-[#739552] font-mono font-bold">+38 Rating points this month</span>
            </div>
            <div className="flex items-center gap-1 bg-white dark:bg-stone-700/80 border border-stone-200 dark:border-stone-700 p-0.5 rounded-lg text-[10px] font-bold shadow-2xs">
              {(['7d', '30d', '90d'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setStatsPeriod(period)}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    statsPeriod === period
                      ? 'bg-[#739552] text-white shadow-xs'
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-950'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-20 relative flex items-center">
            <svg viewBox="0 0 360 80" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#739552" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#739552" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {ratingHistoryPoints && (
                <>
                  <polygon
                    points={`0,80 ${ratingHistoryPoints} 360,80`}
                    fill="url(#ratingGradient)"
                  />
                  <polyline
                    fill="none"
                    stroke="#739552"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={ratingHistoryPoints}
                  />
                </>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* 4. GAME HISTORY & REVIEW SECTION: FILTERS, WORKING REVIEW GAME BUTTON, EMPTY STATES */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Clock size={18} className="text-[#739552]" />
              Recent Game History
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Click &quot;Review Game&quot; on any match to launch the professional 3-panel analysis
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search opponent or opening */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search opponent / opening..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#739552] w-48 shadow-2xs"
              />
            </div>

            {/* Time control filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-1 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 shadow-xs">
              {(['all', 'rapid', 'blitz', 'bullet'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryCategoryFilter(f)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    historyCategoryFilter === f
                      ? 'bg-[#739552] text-white shadow-xs'
                      : 'text-stone-700 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Result filter (Win / Loss / Draw) */}
            <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-1 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 shadow-xs">
              {(['all', 'win', 'loss', 'draw'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setHistoryResultFilter(r)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                    historyResultFilter === r
                      ? 'bg-[#739552] text-white shadow-xs'
                      : 'text-stone-700 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Games Table or Empty State */}
        {filteredGames.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 text-lg shadow-xs">
              ♟
            </div>
            <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200">
              No games found matching filters
            </h3>
            <p className="text-xs text-stone-500 max-w-sm">
              Try adjusting your search criteria, or start a new game against a friend or the computer!
            </p>
            <button
              onClick={() => onStartComputerGame('10+0', 'w')}
              className="mt-2 px-4 py-2 bg-[#739552] hover:bg-[#648346] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Play a Game Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Opponent</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Opening</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
                {filteredGames.map((g) => {
                  const isUserWhite = g.userColor === 'w';
                  const opponent = isUserWhite ? g.black : g.white;
                  const isWin = g.result === (isUserWhite ? '1-0' : '0-1');
                  const isDraw = g.result === '1/2-1/2';

                  return (
                    <tr
                      key={g.id}
                      className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{opponent.avatar || '👤'}</span>
                          <div>
                            <span className="font-bold text-stone-900 dark:text-stone-100">
                              {opponent.name}
                            </span>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                              Elo {opponent.rating}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-extrabold text-[11px] inline-flex items-center gap-1 ${
                            isWin
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : isDraw
                              ? 'bg-white text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700 shadow-xs'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {isWin ? 'Win' : isDraw ? 'Draw' : 'Loss'} ({g.result})
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-stone-700 dark:text-stone-300">
                        {g.timeControl}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-stone-800 dark:text-stone-200 font-bold truncate max-w-[170px]">
                          {g.opening?.name || 'Custom Match'}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                          {g.opening?.eco || ''}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-stone-500 dark:text-stone-400 text-[11px]">
                        {g.date}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => exportPGN(g)}
                            title="Copy PGN to clipboard"
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                          >
                            <Download size={13} />
                          </button>

                          <button
                            onClick={() => startReviewGame(g.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                            title="Launch 3-Panel Synchronized Game Review"
                          >
                            <span>Review Game</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. FRIENDS & SOCIAL SECTION */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Users size={18} className="text-[#739552]" />
              Your Friends ({friends.length})
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Direct challenges and real-time activity status
            </p>
          </div>

          {/* Add Friend Form */}
          <form onSubmit={handleAddFriend} className="flex items-center gap-2">
            <input
              type="text"
              value={newFriendInput}
              onChange={(e) => setNewFriendInput(e.target.value)}
              placeholder="Username to add..."
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#739552] shadow-2xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs flex items-center gap-1 shadow-xs"
            >
              <UserPlus size={13} /> Add
            </button>
          </form>
        </div>

        {friendAddedToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
            <Check size={14} />
            <span>{friendAddedToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredFriends.map((f) => (
            <div
              key={f.id}
              className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={f.avatar}
                    alt={f.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-stone-900 ${
                      f.status === 'online'
                        ? 'bg-emerald-500'
                        : f.status === 'in_game'
                        ? 'bg-amber-500 animate-ping'
                        : 'bg-stone-400'
                    }`}
                  />
                </div>
                <div>
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                    {f.username}
                  </span>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                    Rating: {f.rating}
                  </div>
                  {f.currentActivity && (
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[110px]">
                      {f.currentActivity}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={onOpenWifiModal}
                className="px-2.5 py-1.5 rounded-xl bg-[#739552]/10 hover:bg-[#739552]/20 text-[#5f7d41] dark:text-[#88c558] font-bold text-xs transition-colors"
                title="Challenge friend via local Wi-Fi link"
              >
                Challenge
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 6. INTERACTIVE STREAK & ACTIVITY MODAL */}
      {showStreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                  <Flame size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    {user.streakDays}-Day Playing Streak
                  </h3>
                  <span className="text-xs text-stone-500">Active everyday competitor</span>
                </div>
              </div>
              <button
                onClick={() => setShowStreakModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4 rounded-xl flex items-center justify-between text-center shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">Streak Record</span>
                <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-500">14 Days</div>
              </div>
              <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">Daily Puzzles</span>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-500">{user.dailyGoalSolved}/3</div>
              </div>
              <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">Total Solved</span>
                <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-500">{user.ratings.puzzles.solvedCount}</div>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Keep playing at least one game or puzzle every day before midnight to keep your fire burning and unlock tournament achievements.
            </p>

            <button
              onClick={() => {
                setShowStreakModal(false);
                navigateTo('puzzles');
              }}
              className="w-full py-2.5 bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Solve Today&apos;s Puzzles
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
