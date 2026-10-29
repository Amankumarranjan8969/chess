import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext.js';
import { Puzzle, StoredGame } from '../types/platform.js';
import {
  Shield,
  Users,
  Award,
  Zap,
  Radio,
  Trash2,
  Edit2,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  Server,
  Activity,
} from 'lucide-react';

export const AdminStudio: React.FC = () => {
  const {
    user,
    isSuperAdmin,
    allAccounts,
    games,
    puzzles,
    adminUpdateUserRating,
    adminUpdateUserRole,
    adminDeleteGame,
    adminAddPuzzle,
    adminBroadcast,
    setAdminBroadcast,
    navigateTo,
  } = usePlatform();

  // Active admin sub-tab
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'puzzles' | 'games' | 'broadcast'>('users');

  // Broadcast state
  const [broadcastDraft, setBroadcastDraft] = useState(adminBroadcast || '');
  const [broadcastSavedToast, setBroadcastSavedToast] = useState(false);

  // User search & edit state
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<string | null>(null);
  const [editRatingCategory, setEditRatingCategory] = useState<'rapid' | 'blitz' | 'bullet' | 'puzzles'>('rapid');
  const [newRatingValue, setNewRatingValue] = useState<number>(1500);
  const [editTitleValue, setEditTitleValue] = useState<string>('');

  // Puzzle creation modal state
  const [showAddPuzzleModal, setShowAddPuzzleModal] = useState(false);
  const [newPuzzleFen, setNewPuzzleFen] = useState('r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5');
  const [newPuzzleMoveFrom, setNewPuzzleMoveFrom] = useState('c4');
  const [newPuzzleMoveTo, setNewPuzzleMoveTo] = useState('f7');
  const [newPuzzleDifficulty, setNewPuzzleDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'master'>('intermediate');
  const [newPuzzleRating, setNewPuzzleRating] = useState<number>(1450);
  const [newPuzzleTheme, setNewPuzzleTheme] = useState('Tactical Sacrifice');
  const [newPuzzleHint, setNewPuzzleHint] = useState('Strike at the vulnerable f7 square.');
  const [newPuzzleExplanation, setNewPuzzleExplanation] = useState('Bxf7+ disrupts the enemy king and initiates a mating attack.');

  // Game archive search
  const [gameSearch, setGameSearch] = useState('');

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 text-3xl">
          <Shield />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            Super Administrator Authorization Required
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-md">
            This command center is reserved exclusively for the Super Administrator. Please authenticate with administrator credentials to access this console.
          </p>
        </div>
        <button
          onClick={() => navigateTo('home')}
          className="px-4 py-2 rounded-xl bg-[#739552] text-white font-bold text-xs shadow-sm hover:bg-[#648346] transition-all"
        >
          Return to Platform Home
        </button>
      </div>
    );
  }

  const filteredAccounts = allAccounts.filter((a) => {
    const q = userSearch.toLowerCase();
    return (
      a.username.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.profile.title && a.profile.title.toLowerCase().includes(q))
    );
  });

  const filteredGames = games.filter((g) => {
    const q = gameSearch.toLowerCase();
    return (
      g.white.name.toLowerCase().includes(q) ||
      g.black.name.toLowerCase().includes(q) ||
      (g.opening && g.opening.name.toLowerCase().includes(q))
    );
  });

  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminBroadcast(broadcastDraft.trim() ? broadcastDraft.trim() : null);
    setBroadcastSavedToast(true);
    setTimeout(() => setBroadcastSavedToast(false), 2500);
  };

  const handleClearBroadcast = () => {
    setBroadcastDraft('');
    setAdminBroadcast(null);
    setBroadcastSavedToast(true);
    setTimeout(() => setBroadcastSavedToast(false), 2500);
  };

  const handleSaveUserRating = (userId: string) => {
    adminUpdateUserRating(userId, editRatingCategory, newRatingValue);
    if (editTitleValue) {
      adminUpdateUserRole(userId, 'user', editTitleValue);
    }
    setSelectedUserToEdit(null);
  };

  const handleCreatePuzzle = (e: React.FormEvent) => {
    e.preventDefault();
    const newPuz: Puzzle = {
      id: `puz-custom-${Date.now()}`,
      title: `${newPuzzleTheme} (Admin Custom #${puzzles.length + 1})`,
      fen: newPuzzleFen,
      preFen: newPuzzleFen,
      sideToMove: 'w',
      rating: Number(newPuzzleRating),
      theme: newPuzzleTheme,
      category: 'sacrifice',
      difficulty: newPuzzleDifficulty,
      solutionMoves: [{ from: newPuzzleMoveFrom, to: newPuzzleMoveTo }],
      hint: newPuzzleHint,
      explanation: newPuzzleExplanation,
    };
    adminAddPuzzle(newPuz);
    setShowAddPuzzleModal(false);
  };

  const exportPlatformBackup = () => {
    const data = {
      timestamp: new Date().toISOString(),
      superAdmin: user.username,
      totalUsers: allAccounts.length,
      totalGames: games.length,
      totalPuzzles: puzzles.length,
      accounts: allAccounts,
      games,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chessmaster_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* 1. TOP COMMAND HEADER */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm flex items-center justify-between flex-wrap gap-4 text-stone-900 dark:text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-amber-900/30">
            <Shield size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight">
                Super Administrator Control Center
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                <Zap size={11} /> Root Authority
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
              Manage accounts, calibrate tactical engines, audit game matches, and broadcast announcements.
            </p>
          </div>
        </div>

        {/* Global Action Pills */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportPlatformBackup}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download size={14} /> Export Backup
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#739552] border border-[#739552]/30 text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Server Daemon :4000 Live</span>
          </div>
        </div>
      </div>

      {/* 2. LIVE METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Accounts</span>
            <Users size={16} className="text-[#739552]" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-white mt-1">
            {allAccounts.length}
          </div>
          <span className="text-[10px] text-stone-500 font-medium">Registered players & admins</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Tactical Puzzles</span>
            <Award size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-white mt-1">
            {puzzles.length}
          </div>
          <span className="text-[10px] text-stone-500 font-medium">Calibrated Elo 650–2600+</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Recorded Games</span>
            <Activity size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-stone-900 dark:text-white mt-1">
            {games.length}
          </div>
          <span className="text-[10px] text-stone-500 font-medium">With engine review reports</span>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Broadcast</span>
            <Radio size={16} className="text-rose-500" />
          </div>
          <div className="text-xs font-bold text-stone-900 dark:text-white truncate mt-2">
            {adminBroadcast ? 'Active Banner' : 'None Active'}
          </div>
          <span className="text-[10px] text-stone-500 font-medium">Global platform announcement</span>
        </div>
      </div>

      {/* 3. ADMIN SECTION TABS */}
      <div className="flex items-center bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs font-bold shadow-xs flex-wrap gap-1">
        {[
          { id: 'users', label: 'User Accounts & Ratings', icon: <Users size={14} /> },
          { id: 'puzzles', label: 'Puzzles Engine Manager', icon: <Award size={14} /> },
          { id: 'games', label: 'Game Matches & History', icon: <Activity size={14} /> },
          { id: 'broadcast', label: 'Platform Broadcast', icon: <Radio size={14} /> },
        ].map((tab) => {
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#739552] text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. SUB-PANEL: USER ACCOUNTS & RATINGS */}
      {activeAdminTab === 'users' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4 text-stone-900 dark:text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-base">Platform User Profiles</h3>
              <p className="text-xs text-stone-500">Edit ratings, titles, and manage privileges</p>
            </div>

            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by username, email, title..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#739552]"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Rapid</th>
                  <th className="py-2.5 px-3">Blitz</th>
                  <th className="py-2.5 px-3">Bullet</th>
                  <th className="py-2.5 px-3">Puzzles</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-mono">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-3 flex items-center gap-2.5">
                      <img src={acc.profile.avatar} alt={acc.username} className="w-8 h-8 rounded-full object-cover" />
                      <div className="font-sans">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          {acc.profile.title && (
                            <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-white rounded font-extrabold font-mono">
                              {acc.profile.title}
                            </span>
                          )}
                          <span>{acc.username}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 block font-mono">{acc.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          acc.role === 'superadmin'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        {acc.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {acc.profile.ratings.rapid.rating}
                    </td>
                    <td className="py-3 px-3">{acc.profile.ratings.blitz.rating}</td>
                    <td className="py-3 px-3">{acc.profile.ratings.bullet.rating}</td>
                    <td className="py-3 px-3 text-purple-600 dark:text-purple-400">
                      {acc.profile.ratings.puzzles.rating}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedUserToEdit(acc.id);
                          setNewRatingValue(acc.profile.ratings.rapid.rating);
                          setEditTitleValue(acc.profile.title || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold font-sans inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Edit Modal */}
          {selectedUserToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-stone-800">
                  <h4 className="font-extrabold text-sm flex items-center gap-2">
                    <Edit2 size={15} className="text-[#739552]" />
                    <span>Adjust Player Rating & Title</span>
                  </h4>
                  <button onClick={() => setSelectedUserToEdit(null)} className="text-stone-400 hover:text-stone-600">
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Select Category
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['rapid', 'blitz', 'bullet', 'puzzles'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setEditRatingCategory(cat)}
                        className={`py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                          editRatingCategory === cat
                            ? 'bg-[#739552] text-white shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Set New Elo Rating
                  </label>
                  <input
                    type="number"
                    value={newRatingValue}
                    onChange={(e) => setNewRatingValue(Number(e.target.value))}
                    min={100}
                    max={3200}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    Honorary Title (e.g. GM, IM, CM, FM, Admin)
                  </label>
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    placeholder="e.g. GM"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold uppercase"
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setSelectedUserToEdit(null)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveUserRating(selectedUserToEdit)}
                    className="flex-1 py-2.5 rounded-xl bg-[#739552] text-white font-bold text-xs shadow-sm hover:bg-[#648346]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SUB-PANEL: PUZZLES ENGINE MANAGER */}
      {activeAdminTab === 'puzzles' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4 text-stone-900 dark:text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-base">Tactical Puzzles Database (1,200 Loaded)</h3>
              <p className="text-xs text-stone-500">Inspect verified puzzle library and author custom tactical challenges</p>
            </div>

            <button
              onClick={() => setShowAddPuzzleModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#739552] hover:bg-[#648346] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={14} /> Add Custom Puzzle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {puzzles.slice(0, 9).map((puz) => (
              <div
                key={puz.id}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#739552]/15 text-[#5f7d41] dark:text-[#88c558] border border-[#739552]/30">
                    Elo {puz.rating}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-stone-400 capitalize">
                    {puz.difficulty}
                  </span>
                </div>
                <h4 className="font-bold text-xs truncate">{puz.title}</h4>
                <div className="font-mono text-[10px] text-stone-400 truncate">FEN: {puz.fen}</div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2">{puz.hint}</p>
              </div>
            ))}
          </div>

          {/* Add Puzzle Modal */}
          {showAddPuzzleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <form
                onSubmit={handleCreatePuzzle}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-3.5 text-xs font-medium"
              >
                <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-stone-800">
                  <h4 className="font-extrabold text-sm flex items-center gap-2">
                    <Plus size={16} className="text-[#739552]" />
                    <span>Create Custom Tactical Puzzle</span>
                  </h4>
                  <button type="button" onClick={() => setShowAddPuzzleModal(false)} className="text-stone-400 hover:text-stone-600">
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">FEN String</label>
                  <input
                    type="text"
                    required
                    value={newPuzzleFen}
                    onChange={(e) => setNewPuzzleFen(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Solution Move From</label>
                    <input
                      type="text"
                      required
                      value={newPuzzleMoveFrom}
                      onChange={(e) => setNewPuzzleMoveFrom(e.target.value)}
                      placeholder="e.g. c4"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Solution Move To</label>
                    <input
                      type="text"
                      required
                      value={newPuzzleMoveTo}
                      onChange={(e) => setNewPuzzleMoveTo(e.target.value)}
                      placeholder="e.g. f7"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Difficulty</label>
                    <select
                      value={newPuzzleDifficulty}
                      onChange={(e) => setNewPuzzleDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                    >
                      <option value="beginner">Beginner (&lt;1100)</option>
                      <option value="intermediate">Intermediate (1100-1600)</option>
                      <option value="advanced">Advanced (1600-2000)</option>
                      <option value="master">Master (2000+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Target Elo</label>
                    <input
                      type="number"
                      required
                      value={newPuzzleRating}
                      onChange={(e) => setNewPuzzleRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Theme Title</label>
                  <input
                    type="text"
                    required
                    value={newPuzzleTheme}
                    onChange={(e) => setNewPuzzleTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Hint</label>
                  <input
                    type="text"
                    required
                    value={newPuzzleHint}
                    onChange={(e) => setNewPuzzleHint(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPuzzleModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#739552] text-white font-bold text-xs shadow-sm hover:bg-[#648346]"
                  >
                    Publish to Database
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 6. SUB-PANEL: MATCH ARCHIVE */}
      {activeAdminTab === 'games' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4 text-stone-900 dark:text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-base">Recorded Games Archive ({games.length})</h3>
              <p className="text-xs text-stone-500">Inspect PGNs and purge test matches</p>
            </div>

            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
                placeholder="Search by player or opening..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#739552]"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredGames.map((g) => (
              <div key={g.id} className="py-3 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>{g.white.name} ({g.white.rating})</span>
                    <span className="text-stone-400">vs</span>
                    <span>{g.black.name} ({g.black.rating})</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800">
                      {g.result}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500">
                    {g.date} • {g.timeControl} • {g.opening?.name || 'Custom Match'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateTo('review', { gameId: g.id })}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Eye size={12} /> Review
                  </button>
                  <button
                    onClick={() => adminDeleteGame(g.id)}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete Match"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SUB-PANEL: PLATFORM BROADCAST */}
      {activeAdminTab === 'broadcast' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4 text-stone-900 dark:text-white">
          <div>
            <h3 className="font-extrabold text-base">Global Announcement Broadcast</h3>
            <p className="text-xs text-stone-500">
              Publish high-priority alert banners that appear on every screen for all logged-in players and visitors
            </p>
          </div>

          <form onSubmit={handlePublishBroadcast} className="flex flex-col gap-3">
            <textarea
              rows={3}
              value={broadcastDraft}
              onChange={(e) => setBroadcastDraft(e.target.value)}
              placeholder="e.g. ⚡ Live Grandmaster Blitz Championship begins in 20 minutes! Join the Watch tab to stream live."
              className="w-full p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#739552]"
            />

            {broadcastSavedToast && (
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={14} /> Broadcast status updated successfully.
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Radio size={14} /> Publish Broadcast Banner
              </button>
              {adminBroadcast && (
                <button
                  type="button"
                  onClick={handleClearBroadcast}
                  className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
                >
                  Clear Active Banner
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
