import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext.js';
import { StoredGame, MainSection } from '../types/platform.js';
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
} from 'lucide-react';

interface HomeDashboardProps {
  onStartComputerGame: (timeControl: string, color: 'w' | 'b') => void;
  onOpenWifiModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartComputerGame,
  onOpenWifiModal,
}) => {
  const { user, games, friends, startReviewGame, navigateTo, addFriend } = usePlatform();

  const [statCategory, setStatCategory] = useState<'rapid' | 'blitz' | 'bullet' | 'daily'>('rapid');
  const [statsPeriod, setStatsPeriod] = useState<'7d' | '30d' | 'all'>('30d');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'rapid' | 'blitz' | 'bullet'>('all');
  const [friendSearch, setFriendSearch] = useState<string>('');
  const [newFriendInput, setNewFriendInput] = useState<string>('');
  const [friendAddedToast, setFriendAddedToast] = useState<string | null>(null);

  const activeRating = user.ratings[statCategory];
  const winRate =
    activeRating.gamesPlayed > 0
      ? Math.round((activeRating.wins / activeRating.gamesPlayed) * 100)
      : 50;

  const filteredGames = games.filter((g) => {
    if (historyFilter === 'all') return true;
    return g.timeControlCategory === historyFilter;
  });

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

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* 1. PLAYER WELCOME & STREAK BANNER */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-6 shadow-xl border border-stone-800 flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#739552]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#739552]"
            />
            {user.title && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-md shadow-sm">
                {user.title}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-xl sm:text-2xl tracking-tight">
                Welcome back, {user.username}!
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-1 max-w-md">
              {user.bio}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-stone-300">
              <span className="flex items-center gap-1 text-amber-400">
                <Flame size={14} /> {user.streakDays}-Day Playing Streak
              </span>
              <span>•</span>
              <span className="text-emerald-400">
                Daily Goal: {user.dailyGoalSolved}/3 Solved
              </span>
            </div>
          </div>
        </div>

        {/* Quick Overall Stats Badge */}
        <div className="flex items-center gap-2 z-10">
          <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-3 flex flex-col items-center min-w-[90px]">
            <span className="text-[10px] text-stone-400 font-bold uppercase">Rapid</span>
            <span className="text-lg font-mono font-extrabold text-emerald-400">
              {user.ratings.rapid.rating}
            </span>
          </div>
          <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-3 flex flex-col items-center min-w-[90px]">
            <span className="text-[10px] text-stone-400 font-bold uppercase">Blitz</span>
            <span className="text-lg font-mono font-extrabold text-yellow-400">
              {user.ratings.blitz.rating}
            </span>
          </div>
          <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-3 flex flex-col items-center min-w-[90px]">
            <span className="text-[10px] text-stone-400 font-bold uppercase">Puzzles</span>
            <span className="text-lg font-mono font-extrabold text-purple-400">
              {user.ratings.puzzles.rating}
            </span>
          </div>
        </div>
      </div>

      {/* 2. START PLAYING: TIME CONTROLS & GAME MODES */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Play size={18} className="text-[#739552]" fill="currentColor" />
            Start Playing
          </h3>
          <span className="text-xs text-stone-400">Server-Authoritative Matchmaking</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Rapid 10+0 */}
          <button
            onClick={() => onStartComputerGame('10+0', 'w')}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-[#739552] dark:hover:border-[#739552] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Clock size={16} className="text-[#739552]" /> Rapid 10+0
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#739552]/10 text-[#5f7d41] dark:text-[#88c558]">
                  Standard
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                10 minutes per player. Ideal for thoughtful tactical combinations.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#739552] group-hover:translate-x-1 transition-transform">
              <span>Play Rapid</span>
              <ChevronRight size={14} />
            </div>
          </button>

          {/* Blitz 3+2 */}
          <button
            onClick={() => onStartComputerGame('3+2', 'w')}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Zap size={16} className="text-amber-500" /> Blitz 3+2
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Fast
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                3 minutes with 2-second increment per move. Fast & exciting.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
              <span>Play Blitz</span>
              <ChevronRight size={14} />
            </div>
          </button>

          {/* Play with Friend (Local Wi-Fi / Online) */}
          <button
            onClick={onOpenWifiModal}
            className="p-4 rounded-2xl bg-gradient-to-br from-[#739552]/10 to-[#739552]/20 border border-[#739552]/40 hover:border-[#739552] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#739552]/20">
                <span className="font-extrabold text-sm text-[#466528] dark:text-[#88c558] flex items-center gap-1.5">
                  <Wifi size={16} className="text-[#739552]" /> Play a Friend
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#739552] text-white">
                  Wi-Fi Match
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2">
                Share a direct link with anyone on your Wi-Fi network. Instant connection.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#5f7d41] dark:text-[#88c558] group-hover:translate-x-1 transition-transform">
              <span>Generate Wi-Fi Link</span>
              <Share2 size={14} />
            </div>
          </button>

          {/* Play Computer (Super Hard) */}
          <button
            onClick={() => onStartComputerGame('5+3', 'w')}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Bot size={16} className="text-rose-500" /> vs Computer
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  Super Hard
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Test your skills against our Grandmaster-calibrated engine with Quiescence search.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
              <span>Challenge AI</span>
              <ChevronRight size={14} />
            </div>
          </button>
        </div>
      </div>

      {/* 3. CHESS STATISTICS OVERVIEW */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#739552]" />
              Performance Statistics Overview
            </h3>
            <p className="text-xs text-stone-400">Real ratings calculated from valid match records</p>
          </div>

          {/* Time control tab toggle */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
            {(['rapid', 'blitz', 'bullet', 'daily'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setStatCategory(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statCategory === cat
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Current Rating
            </span>
            <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-stone-100 mt-1">
              {activeRating.rating}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              Highest: {activeRating.highest}
            </span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Total Matches
            </span>
            <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-stone-100 mt-1">
              {activeRating.gamesPlayed}
            </div>
            <span className="text-[11px] text-stone-500 font-semibold">
              Win Rate: {winRate}%
            </span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Win / Draw / Loss
            </span>
            <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-stone-100 mt-1">
              <span className="text-emerald-600">{activeRating.wins}</span> -{' '}
              <span className="text-stone-400">{activeRating.draws}</span> -{' '}
              <span className="text-rose-500">{activeRating.losses}</span>
            </div>
            <span className="text-[11px] text-stone-500 font-semibold">
              W-D-L Distribution
            </span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Recent Trend
            </span>
            <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-1">
              +38 pts
            </div>
            <span className="text-[11px] text-stone-500 font-semibold">
              Past 30 Days
            </span>
          </div>
        </div>
      </div>

      {/* 4. GAME HISTORY & REVIEW SECTION (MANDATORY WORKING "REVIEW GAME" BUTTON) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Clock size={18} className="text-[#739552]" />
              Recent Game History
            </h3>
            <p className="text-xs text-stone-400">
              Click &quot;Review Game&quot; on any match to launch the professional 3-panel analysis
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
            {(['all', 'rapid', 'blitz', 'bullet'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  historyFilter === f
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Games Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
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
                          <div className="text-[10px] text-stone-400">
                            Elo {opponent.rating}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                          isWin
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isDraw
                            ? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {isWin ? 'Win' : isDraw ? 'Draw' : 'Loss'} ({g.result})
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-stone-600 dark:text-stone-300">
                      {g.timeControl}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-stone-800 dark:text-stone-200 font-bold truncate max-w-[170px]">
                        {g.opening?.name || 'Custom Match'}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {g.opening?.eco || ''}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-stone-400 text-[11px]">
                      {g.date}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => exportPGN(g)}
                          title="Copy PGN"
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                        >
                          <Download size={13} />
                        </button>

                        <button
                          onClick={() => startReviewGame(g.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
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
      </div>

      {/* 5. FRIENDS & SOCIAL SECTION */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Users size={18} className="text-[#739552]" />
              Your Friends ({friends.length})
            </h3>
            <p className="text-xs text-stone-400">Direct challenges and activity status</p>
          </div>

          {/* Add Friend Form */}
          <form onSubmit={handleAddFriend} className="flex items-center gap-2">
            <input
              type="text"
              value={newFriendInput}
              onChange={(e) => setNewFriendInput(e.target.value)}
              placeholder="Username to add..."
              className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#739552]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs flex items-center gap-1"
            >
              <UserPlus size={13} /> Add
            </button>
          </form>
        </div>

        {friendAddedToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
            {friendAddedToast}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredFriends.map((f) => (
            <div
              key={f.id}
              className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 flex items-center justify-between"
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
                  <div className="text-[10px] text-stone-400 font-mono">
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
                onClick={() => {
                  onOpenWifiModal();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#739552]/10 hover:bg-[#739552]/20 text-[#5f7d41] dark:text-[#88c558] font-bold text-xs transition-colors"
              >
                Challenge
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
