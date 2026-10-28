import React from 'react';
import { usePlatform } from '../context/PlatformContext.js';
import { MainSection } from '../types/platform.js';
import {
  Home,
  Puzzle,
  GraduationCap,
  Tv,
  MoreHorizontal,
  Play,
  Users,
  MessageSquare,
  Moon,
  Sun,
  Shield,
  Award,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeSection, navigateTo, user, messages, preferences, updatePreferences } =
    usePlatform();

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const navItems: { id: MainSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'puzzles', label: 'Puzzles', icon: <Puzzle size={18} /> },
    { id: 'play', label: 'Play', icon: <Play size={18} fill="currentColor" /> },
    { id: 'learn', label: 'Learn', icon: <GraduationCap size={18} /> },
    { id: 'watch', label: 'Watch', icon: <Tv size={18} /> },
    { id: 'more', label: 'More', icon: <MoreHorizontal size={18} />, badge: unreadCount },
  ];

  const toggleTheme = () => {
    updatePreferences({
      themeMode: preferences.themeMode === 'dark' ? 'light' : 'dark',
    });
  };

  const isDark = preferences.themeMode === 'dark';

  return (
    <>
      {/* Top Desktop Navigation Header */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-md px-4 sm:px-8 py-2.5 transition-colors ${
          isDark
            ? 'bg-stone-900/90 border-stone-800 text-stone-100'
            : 'bg-white/95 border-stone-200 text-stone-900 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#739552] to-[#537133] flex items-center justify-center text-white text-xl font-bold shadow-md shadow-[#739552]/20 group-hover:scale-105 transition-transform">
              ♞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight leading-none">
                  CHESSMASTER
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#739552]/20 text-[#739552] border border-[#739552]/30">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-medium tracking-tight">
                Tournament Platform
              </span>
            </div>
          </div>

          {/* Desktop Primary Nav Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 dark:bg-stone-800/80 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-inner">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const isPlay = item.id === 'play';

              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? isPlay
                        ? 'bg-[#739552] text-white shadow-md'
                        : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                      : isPlay
                      ? 'bg-[#739552]/15 text-[#5f7d41] dark:text-[#88b55e] hover:bg-[#739552]/25'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls (Rating Badges, Theme, User Avatar) */}
          <div className="flex items-center gap-2.5">
            {/* Rapid Rating Pill */}
            <div
              onClick={() => navigateTo('home')}
              title="Your Rapid Rating"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold cursor-pointer hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors"
            >
              <span className="text-[#739552] font-sans text-[11px]">⚡</span>
              <span>{user.ratings.rapid.rating}</span>
            </div>

            {/* Quick Messages Pill */}
            <button
              onClick={() => navigateTo('more')}
              title="Messages & Notifications"
              className="relative p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/70 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
            >
              <MessageSquare size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/70 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            {/* User Profile Mini Card */}
            <div
              onClick={() => navigateTo('more')}
              className="flex items-center gap-2 pl-1 cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-[#739552]/40 group-hover:ring-[#739552] transition-all"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-900" />
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold leading-tight flex items-center gap-1 text-stone-900 dark:text-stone-100">
                  {user.title && (
                    <span className="text-[10px] font-extrabold px-1 py-0.2 bg-amber-500 text-white rounded">
                      {user.title}
                    </span>
                  )}
                  {user.username}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  Rating: {user.ratings.rapid.rating}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg px-2 py-1.5 flex items-center justify-around transition-colors ${
          isDark
            ? 'bg-stone-900/95 border-stone-800 text-stone-100'
            : 'bg-white/95 border-stone-200 text-stone-900 shadow-lg'
        }`}
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const isPlay = item.id === 'play';

          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? isPlay
                    ? 'text-[#739552] font-extrabold'
                    : 'text-[#739552] dark:text-[#86c058] font-bold'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive && isPlay ? 'bg-[#739552]/15' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );
};
