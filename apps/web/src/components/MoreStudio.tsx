import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext.js';
import { UserPreferences, SupportTicket } from '../types/platform.js';
import {
  User,
  Settings,
  Shield,
  HelpCircle,
  Award,
  Palette,
  MessageSquare,
  Users,
  Trophy,
  Send,
  CheckCircle2,
  Lock,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Download,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const MoreStudio: React.FC = () => {
  const {
    user,
    preferences,
    updatePreferences,
    friends,
    messages,
    sendMessage,
    supportTickets,
    submitSupportTicket,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'settings' | 'messages' | 'leaderboards' | 'awards' | 'support'
  >('profile');

  // Messages state
  const [selectedFriendId, setSelectedFriendId] = useState<string>(friends[0]?.id || '');
  const [messageInput, setMessageInput] = useState<string>('');

  // Support ticket form state
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketCategory, setTicketCategory] = useState<'bug' | 'feature' | 'dispute' | 'account'>('bug');
  const [ticketDescription, setTicketDescription] = useState<string>('');
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const selectedFriend = friends.find((f) => f.id === selectedFriendId) || friends[0];
  const activeConversation = messages.filter(
    (m) =>
      (m.senderId === user.id && m.receiverId === selectedFriend?.id) ||
      (m.senderId === selectedFriend?.id && m.receiverId === user.id)
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && selectedFriend) {
      sendMessage(selectedFriend.id, messageInput.trim());
      setMessageInput('');
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketSubject.trim() && ticketDescription.trim()) {
      const ticketId = submitSupportTicket({
        subject: ticketSubject.trim(),
        category: ticketCategory,
        description: ticketDescription.trim(),
      });
      setTicketSuccess(`Support ticket filed successfully! Reference ID: ${ticketId}`);
      setTicketSubject('');
      setTicketDescription('');
      setTimeout(() => setTicketSuccess(null), 5000);
    }
  };

  const ACHIEVEMENTS = [
    { title: 'First Victory', desc: 'Won your first tournament match', icon: '🏆', unlocked: true },
    { title: 'Tactical Striker', desc: 'Solved 100 tactical puzzles', icon: '⚡', unlocked: true },
    { title: 'King Hunter', desc: 'Delivered checkmate in under 20 moves', icon: '👑', unlocked: true },
    { title: 'Streak Master', desc: 'Maintained a 7-day puzzle streak', icon: '🔥', unlocked: true },
    { title: 'Grandmaster Challenger', desc: 'Played against Super Hard AI', icon: '🤖', unlocked: true },
    { title: 'Endgame Wizard', desc: 'Completed Lucena & Philidor lessons', icon: '🎓', unlocked: false },
  ];

  const LEADERBOARD_DATA = [
    { rank: 1, name: 'Magnus Carlsen', rating: 2832, title: 'GM', winRate: '68%' },
    { rank: 2, name: 'Hikaru Nakamura', rating: 2802, title: 'GM', winRate: '65%' },
    { rank: 3, name: 'Alireza Firouzja', rating: 2795, title: 'GM', winRate: '63%' },
    { rank: 4, name: 'D. Gukesh', rating: 2785, title: 'GM', winRate: '62%' },
    { rank: 42, name: `${user.username} (You)`, rating: user.ratings.rapid.rating, title: user.title, winRate: '59%' },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl text-xs font-bold border border-stone-200 dark:border-stone-700 overflow-x-auto scrollbar-none w-full sm:w-fit shadow-xs">
        {[
          { id: 'profile', label: 'Profile & Stats', icon: <User size={14} /> },
          { id: 'messages', label: 'Messages', icon: <MessageSquare size={14} /> },
          { id: 'settings', label: 'Settings & Themes', icon: <Palette size={14} /> },
          { id: 'leaderboards', label: 'Leaderboards & Leagues', icon: <Trophy size={14} /> },
          { id: 'awards', label: 'Awards', icon: <Award size={14} /> },
          { id: 'support', label: 'Help & Support', icon: <HelpCircle size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#739552] text-white shadow-sm'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white dark:hover:bg-stone-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* User Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center gap-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-[#739552]/40"
              />
              {user.title && (
                <span className="absolute bottom-0 right-0 px-2 py-0.5 bg-amber-500 text-white font-extrabold text-xs rounded-lg shadow-sm">
                  {user.title}
                </span>
              )}
            </div>

            <div>
              <h2 className="font-extrabold text-lg text-stone-900 dark:text-stone-100">
                {user.username}
              </h2>
              <p className="text-xs text-stone-400">{user.email}</p>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                {user.bio}
              </p>
            </div>

            <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-around text-center text-xs">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase">Member Since</span>
                <div className="font-bold text-stone-800 dark:text-stone-200">{user.joinedDate}</div>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase">Country</span>
                <div className="font-bold text-stone-800 dark:text-stone-200">{user.country}</div>
              </div>
            </div>
          </div>

          {/* Rating Cards & History */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                Official Time Control Ratings
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Rapid', stat: user.ratings.rapid, color: 'text-emerald-500' },
                  { label: 'Blitz', stat: user.ratings.blitz, color: 'text-yellow-500' },
                  { label: 'Bullet', stat: user.ratings.bullet, color: 'text-rose-500' },
                  { label: 'Daily', stat: user.ratings.daily, color: 'text-blue-500' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 shadow-xs"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      {item.label}
                    </span>
                    <div className={`text-2xl font-mono font-extrabold mt-1 ${item.color}`}>
                      {item.stat.rating}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      High: {item.stat.highest} • {item.stat.gamesPlayed} games
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Management & Data Export */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                  Data Portability & Security
                </h4>
                <p className="text-[11px] text-stone-500">
                  Export complete PGN game history and account records
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('All recorded PGNs compiled into export file.')}
                  className="px-3 py-2 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download size={13} /> Export PGNs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DIRECT MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm h-[600px]">
          {/* Friends message sidebar */}
          <div className="border-r border-stone-100 dark:border-stone-800 flex flex-col p-3 overflow-y-auto">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 px-2">
              Conversations
            </span>
            {friends.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFriendId(f.id)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all ${
                  selectedFriendId === f.id
                    ? 'bg-[#739552]/10 border border-[#739552]/30'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                <img src={f.avatar} alt={f.username} className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                    {f.username}
                  </div>
                  <div className="text-[10px] text-stone-400">Rating {f.rating}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat Pane */}
          <div className="flex flex-col justify-between p-4 h-full">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedFriend?.avatar}
                  alt={selectedFriend?.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                    {selectedFriend?.username}
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                </div>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
              {activeConversation.map((msg) => {
                const isMe = msg.senderId === user.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[75%] ${
                      isMe ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#739552] text-white rounded-br-none shadow-sm'
                          : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-200 border border-stone-200 dark:border-transparent rounded-bl-none shadow-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-stone-400 mt-1">{msg.timestamp}</span>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message ${selectedFriend?.username}...`}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#739552]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. SETTINGS & THEMES TAB */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Palette size={18} className="text-[#739552]" /> Customization & Application Preferences
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Personalize chessboard themes, sound effects, legal move indicators, and accessibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Board Theme */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Chessboard Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'green', label: 'Tournament Green', bg: 'bg-[#739552]' },
                  { id: 'wood', label: 'Warm Wood', bg: 'bg-[#b58863]' },
                  { id: 'ocean', label: 'Ocean Blue', bg: 'bg-[#4a7a96]' },
                  { id: 'classic', label: 'Classic Slate', bg: 'bg-[#708090]' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => updatePreferences({ boardTheme: b.id as any })}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      preferences.boardTheme === b.id
                        ? 'border-[#739552] ring-2 ring-[#739552]/40 bg-white dark:bg-stone-800 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${b.bg} shadow-sm`} />
                    <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 text-center">
                      {b.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sound & Coordinates */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Gameplay & Visual Helpers
              </label>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-xs">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Volume2 size={16} className="text-[#739552]" /> Sound Effects & Audio Ticks
                </span>
                <button
                  onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    preferences.soundEnabled ? 'bg-[#739552]' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      preferences.soundEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 shadow-xs">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Eye size={16} className="text-[#739552]" /> Board Coordinates (a-h, 1-8)
                </span>
                <button
                  onClick={() =>
                    updatePreferences({ coordinatesVisible: !preferences.coordinatesVisible })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    preferences.coordinatesVisible ? 'bg-[#739552]' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      preferences.coordinatesVisible ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEADERBOARDS TAB */}
      {activeTab === 'leaderboards' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Trophy size={18} className="text-[#739552]" /> Global Grandmaster Leaderboard
            </h2>
            <p className="text-xs text-stone-400">
              Rankings verified through authoritative real-time game evaluations
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                {LEADERBOARD_DATA.map((row) => (
                  <tr
                    key={row.rank}
                    className={`hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors ${
                      row.name.includes('(You)') ? 'bg-[#739552]/10 font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-stone-500">#{row.rank}</td>
                    <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      {row.title && (
                        <span className="text-[10px] font-extrabold px-1 py-0.2 bg-amber-500 text-white rounded">
                          {row.title}
                        </span>
                      )}
                      <span>{row.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-[#739552]">{row.rating}</td>
                    <td className="py-3 px-3 text-right font-bold text-stone-700 dark:text-stone-300">{row.winRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. AWARDS TAB */}
      {activeTab === 'awards' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Award size={18} className="text-[#739552]" /> Player Trophies & Milestones
            </h2>
            <p className="text-xs text-stone-400">
              Transparent achievement criteria unlocked by real game performance
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  a.unlocked
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-white dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 opacity-60 shadow-xs'
                }`}
              >
                <div className="text-2xl p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
                  {a.icon}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">{a.title}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. HELP & SUPPORT TAB */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Submit Support Ticket */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <HelpCircle size={18} className="text-[#739552]" /> Submit Help or Dispute Ticket
              </h3>
              <p className="text-xs text-stone-400">
                Direct customer assistance, bug reporting, and fair-play dispute resolution
              </p>
            </div>

            {ticketSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
                {ticketSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#739552]"
                >
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="dispute">Match / Fair-Play Dispute</option>
                  <option value="account">Account & Privacy</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Summary of issue..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#739552]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Description</label>
                <textarea
                  rows={3}
                  required
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Provide detailed description..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#739552]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs transition-all shadow-md mt-1"
              >
                File Ticket
              </button>
            </form>
          </div>

          {/* Active Tickets List */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
              Your Recorded Support Tickets ({supportTickets.length})
            </h3>

            <div className="flex flex-col gap-2">
              {supportTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 flex flex-col gap-1 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-stone-800 dark:text-stone-200">{t.id}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] uppercase font-bold">
                      {t.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">{t.subject}</h4>
                  <p className="text-[11px] text-stone-500">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
