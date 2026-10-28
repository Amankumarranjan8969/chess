import React, { useState } from 'react';
import { Chessboard, BoardTheme } from './Chessboard.js';
import { ChessGame } from '@chess/core';
import { usePlatform } from '../context/PlatformContext.js';
import {
  Tv,
  Calendar,
  Award,
  ExternalLink,
  Flame,
  Play,
  RotateCcw,
  BookOpen,
  Newspaper,
  Radio,
  Eye,
} from 'lucide-react';

export const WatchStudio: React.FC = () => {
  const { preferences } = usePlatform();

  // Demonstration live game between Grandmasters
  const [liveGame] = useState<ChessGame>(() => {
    const g = new ChessGame();
    // 1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 d5
    ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'Qc2', 'O-O', 'a3', 'Bxc3+', 'Qxc3', 'd5'].forEach(
      (m) => g.makeMove(m)
    );
    return g;
  });

  const [orientation, setOrientation] = useState<'w' | 'b'>('w');

  const TOURNAMENTS = [
    {
      id: 'tour-1',
      title: 'FIDE Candidates Tournament 2026',
      status: 'Live Now',
      format: 'Double Round-Robin (14 Rounds)',
      prizePool: '$500,000',
      leader: 'D. Gukesh (8.5/13)',
      dates: 'April 2026',
      badge: 'Championship',
    },
    {
      id: 'tour-2',
      title: 'Speed Chess Championship Global Finals',
      status: 'Upcoming',
      format: 'Single Elimination (5+1, 3+1, 1+1)',
      prizePool: '$250,000',
      leader: 'H. Nakamura vs M. Carlsen',
      dates: 'Nov 12 - 16, 2026',
      badge: 'Speed Chess',
    },
    {
      id: 'tour-3',
      title: 'Grand Chess Tour: European Classical',
      status: 'Upcoming',
      format: 'Classical 90+30',
      prizePool: '$350,000',
      leader: 'Alireza Firouzja',
      dates: 'Dec 02 - 10, 2026',
      badge: 'Classical',
    },
  ];

  const NEWS_ARTICLES = [
    {
      id: 'news-1',
      title: 'The Modern Evolution of the Berlin Defense at Elite Levels',
      category: 'Opening Theory',
      date: 'Today',
      readTime: '4 min read',
      snippet: 'Grandmasters have pushed the Berlin endgame to unprecedented depths with new queen pawn sacrifices.',
    },
    {
      id: 'news-2',
      title: 'Speed Chess Championship: Historic Semifinal Showdown',
      category: 'Tournament Recap',
      date: 'Yesterday',
      readTime: '6 min read',
      snippet: 'Dramatic bullet tiebreaks decide the finalists in a nail-biting encounter with multiple knight promotions.',
    },
    {
      id: 'news-3',
      title: 'AI and Chess Engines: How Deep Neural Networks Reshaped Strategy',
      category: 'Technology',
      date: 'Oct 24, 2026',
      readTime: '5 min read',
      snippet: 'An examination of piece activity over material balance pioneered by modern self-play engines.',
    },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 text-stone-900 dark:text-white rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-rose-900/40">
            📺
          </div>
          <div>
            <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight flex items-center gap-2">
              Watch Chess Arena & Broadcasts
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-md">
              Live broadcast boards, major international championship events, standings, and chess journalism.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 shadow-xs">
          <Radio size={14} className="text-rose-500" />
          <span>FIDE Broadcast Feed Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left: Featured Live Game Board & Tournaments */}
        <div className="flex flex-col gap-6">
          {/* Live Board Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Live Board 1 — Round 12
                </span>
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                  GM Magnus Carlsen (2832) vs GM Hikaru Nakamura (2802)
                </h3>
              </div>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-300 shadow-xs">
                Eval: +0.42
              </span>
            </div>

            {/* Board */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-[min(480px,calc(100vh-320px))] h-[min(480px,calc(100vh-320px))] aspect-square flex items-center justify-center">
                <Chessboard
                  snapshot={liveGame.getSnapshot()}
                  legalMoves={[]}
                  orientation={orientation}
                  theme={(preferences.boardTheme as BoardTheme) || 'green'}
                  interactive={false}
                />
              </div>

              <div className="flex items-center justify-between w-full max-w-[480px] text-xs font-semibold text-stone-500">
                <span>Move 6... d5 (Nimzo-Indian Defense)</span>
                <button
                  onClick={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
                  className="flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100"
                >
                  <RotateCcw size={12} /> Flip Board
                </button>
              </div>
            </div>
          </div>

          {/* Major Tournaments & Standings */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Award size={18} className="text-[#739552]" /> Featured Championships & Events
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TOURNAMENTS.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 flex flex-col justify-between shadow-xs hover:border-stone-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-700/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#739552]">
                        {t.badge}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        {t.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 mt-2">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1">{t.format}</p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-600 dark:text-stone-300">
                    <div>Leader: <strong>{t.leader}</strong></div>
                    <div className="text-[10px] text-stone-400">Prize Fund: {t.prizePool}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Chess News & Video Highlights */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Newspaper size={18} className="text-[#739552]" /> Chess News & Analysis
            </h3>

            <div className="flex flex-col gap-3 divide-y divide-stone-100 dark:divide-stone-800">
              {NEWS_ARTICLES.map((art) => (
                <div key={art.id} className="pt-3 first:pt-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase">
                    <span className="text-[#739552]">{art.category}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 hover:text-[#739552] cursor-pointer transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 line-clamp-2">
                    {art.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
