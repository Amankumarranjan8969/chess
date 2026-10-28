import React, { useState, useRef, useEffect } from 'react';
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
  User,
  BarChart2,
  Settings,
  LogOut,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const {
    activeSection,
    navigateTo,
    user,
    messages,
    preferences,
    updatePreferences,
  } = usePlatform();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const navItems: { id: MainSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'play', label: 'Play', icon: <Play size={18} fill="currentColor" /> },
    { id: 'puzzles', label: 'Puzzles', icon: <Puzzle size={18} /> },
    { id: 'learn', label: 'Learn', icon: <GraduationCap size={18} /> },
    { id: 'watch', label: 'Watch', icon: <Tv size={18} /> },
    { id: 'more', label: 'More', icon: <MoreHorizontal size={18} />, badge: unreadCount },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    updatePreferences({
      themeMode: preferences.themeMode === 'dark' ? 'light' : 'dark',
    });
  };

  const toggleSound = () => {
    updatePreferences({
      soundEnabled: !preferences.soundEnabled,
    });
  };

  const isDark = preferences.themeMode === 'dark';

  return (
    <>
      {/* Top Desktop Navigation Header (Sticky, Compact, High-Contrast) */}
      <header
        className={`sticky top-0 z-50 w-full border-b backdrop-blur-md px-4 sm:px-8 py-2 transition-colors ${
          isDark
            ? 'bg-stone-900/95 border-stone-800 text-stone-100 shadow-sm'
            : 'bg-white/95 border-stone-200 text-stone-900 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Return to Home Dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#739552] to-[#537133] flex items-center justify-center text-white text-xl font-bold shadow-md shadow-[#739552]/20 group-hover:scale-105 transition-transform">
              ♞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight leading-none text-stone-900 dark:text-white">
                  CHESSMASTER
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#739552]/15 text-[#5f7d41] dark:text-[#8bc75a] border border-[#739552]/30">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-tight">
                Tournament Platform
              </span>
            </div>
          </div>

          {/* Desktop Primary Nav Bar with WCAG AA Contrast & Green Active Indicator */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-100 dark:bg-stone-850 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700/80 shadow-xs">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                    isActive
                      ? 'bg-[#739552] text-white shadow-md shadow-[#739552]/25'
                      : isDark
                      ? 'text-stone-300 hover:text-white hover:bg-stone-700/60'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-white shadow-none'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls (Rating Pill, Sound, Theme, User Profile with Dropdown) */}
          <div className="flex items-center gap-2.5">
            {/* Rapid Rating Pill (Clickable -> Switches to Rapid stats on Home) */}
            <div
              onClick={() => navigateTo('home')}
              title="Your Rapid Rating (Click to view statistics)"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold cursor-pointer hover:border-[#739552] dark:hover:border-[#739552] transition-colors shadow-xs"
            >
              <span className="text-[#739552] font-sans text-xs">⚡</span>
              <span className="text-stone-800 dark:text-stone-200">{user.ratings.rapid.rating}</span>
            </div>

            {/* Quick Messages Pill */}
            <button
              onClick={() => navigateTo('more')}
              title="Messages & Notifications"
              className="relative p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors shadow-xs"
            >
              <MessageSquare size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={preferences.soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              className="p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors shadow-xs"
            >
              {preferences.soundEnabled ? (
                <Volume2 size={16} className="text-[#739552]" />
              ) : (
                <VolumeX size={16} className="text-stone-400" />
              )}
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
              className="p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors shadow-xs"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            {/* User Profile Mini Card with Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left group"
                title="Account Menu"
              >
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#739552]/40 group-hover:ring-[#739552] transition-all"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-stone-900" />
                </div>
                <div className="hidden xl:flex flex-col">
                  <span className="text-xs font-bold leading-tight flex items-center gap-1 text-stone-900 dark:text-stone-100">
                    {user.title && (
                      <span className="text-[10px] font-extrabold px-1 py-0.2 bg-amber-500 text-white rounded">
                        {user.title}
                      </span>
                    )}
                    <span>{user.username}</span>
                    <ChevronDown size={12} className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 transition-transform" />
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                    Rapid: {user.ratings.rapid.rating}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Header in Dropdown */}
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#739552]"
                    />
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        {user.title && (
                          <span className="text-[9px] font-extrabold px-1 py-0.2 bg-amber-500 text-white rounded">
                            {user.title}
                          </span>
                        )}
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          {user.username}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                        {user.email}
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono font-bold text-[#739552]">
                        <span>⚡ {user.ratings.rapid.rating} Rapid</span>
                        <span>•</span>
                        <span>🔥 {user.ratings.blitz.rating} Blitz</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigateTo('more');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors"
                    >
                      <User size={15} className="text-[#739552]" />
                      <span>Profile & Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigateTo('home');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors"
                    >
                      <BarChart2 size={15} className="text-[#739552]" />
                      <span>Performance Statistics</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigateTo('more');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors"
                    >
                      <Settings size={15} className="text-[#739552]" />
                      <span>Application Settings</span>
                    </button>
                  </div>

                  <div className="border-t border-stone-100 dark:border-stone-800 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        alert(`Logged out from ${user.username}. Guest mode active.`);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar with Distinct Active State */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg px-2 py-1.5 flex items-center justify-around transition-colors ${
          isDark
            ? 'bg-stone-900/95 border-stone-800 text-stone-100'
            : 'bg-white/95 border-stone-200 text-stone-900 shadow-lg'
        }`}
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-[#739552] dark:text-[#88c558] font-extrabold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#739552]/15 shadow-sm' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center font-bold shadow-sm">
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
