import React, { useState, useMemo, useEffect } from 'react';
import { ChessGame, Color, PieceSymbol, Square } from '@chess/core';
import { usePlatform } from '../context/PlatformContext.js';
import { StoredGame, AnalyzedMove, MoveClassification, GameReviewReport } from '../types/platform.js';
import { GameReviewService } from '../services/gameReviewService.js';
import { Chessboard, BoardTheme } from './Chessboard.js';
import { EvaluationBar } from './EvaluationBar.js';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  BookOpen,
  Award,
  ArrowLeft,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  Eye,
  Zap,
} from 'lucide-react';

export const GameReviewStudio: React.FC = () => {
  const { games, activeReviewGameId, navigateTo, preferences } = usePlatform();

  // Selected game to review
  const game: StoredGame = useMemo(() => {
    return games.find((g) => g.id === activeReviewGameId) || games[0];
  }, [games, activeReviewGameId]);

  // Generate or retrieve analysis report
  const [report, setReport] = useState<GameReviewReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);

  // Active position index (-1 = initial position, 0..N-1 = analyzed move index)
  const [currentMoveIdx, setCurrentMoveIdx] = useState<number>(-1);

  // Filter mode for left timeline
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'mistakes' | 'great'>('all');

  // Active right panel tab
  const [activeTab, setActiveTab] = useState<'insight' | 'mistakes' | 'summary'>('insight');

  // Board orientation
  const [orientation, setOrientation] = useState<Color>(game.userColor || 'w');

  // Auto-play state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Alternative variation preview on board
  const [previewVariation, setPreviewVariation] = useState<boolean>(false);

  // Run analysis when game changes
  useEffect(() => {
    setIsAnalyzing(true);
    // Simulate background computation worker
    const timer = setTimeout(() => {
      const res = GameReviewService.analyzeGame(game);
      setReport(res);
      setIsAnalyzing(false);
      setCurrentMoveIdx(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [game]);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying || !report) return;
    const interval = setInterval(() => {
      setCurrentMoveIdx((prev) => {
        if (prev >= report.analyzedMoves.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying, report]);

  // Reconstruct exact snapshot for currently selected position
  const { currentSnapshot, activeMove } = useMemo(() => {
    if (!report || currentMoveIdx === -1) {
      const g = new ChessGame(game.initialFen || undefined);
      return { currentSnapshot: g.getSnapshot(), activeMove: null };
    }

    const moveObj = report.analyzedMoves[currentMoveIdx];
    if (!moveObj) {
      const g = new ChessGame(game.initialFen || undefined);
      return { currentSnapshot: g.getSnapshot(), activeMove: null };
    }

    const fenToShow = previewVariation && moveObj.fenBefore ? moveObj.fenBefore : moveObj.fenAfter;
    const g = new ChessGame(fenToShow);
    const snap = g.getSnapshot();

    return {
      currentSnapshot: {
        ...snap,
        lastMove: {
          from: moveObj.uci.slice(0, 2) as Square,
          to: moveObj.uci.slice(2, 4) as Square,
          san: moveObj.san,
          uci: moveObj.uci,
          piece: (moveObj.capturedPiece as any) || 'p',
          color: moveObj.color,
          fenAfter: moveObj.fenAfter,
          isCheck: moveObj.isCheck ?? false,
          isCheckmate: false,
          isCastling: false,
          isEnPassant: false,
          ply: currentMoveIdx,
          timestamp: Date.now(),
        },
      },
      activeMove: moveObj,
    };
  }, [report, currentMoveIdx, game.initialFen, previewVariation]);

  // Keyboard navigation (← and →)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!report) return;

      if (e.key === 'ArrowLeft') {
        setCurrentMoveIdx((prev) => Math.max(-1, prev - 1));
        setPreviewVariation(false);
      } else if (e.key === 'ArrowRight') {
        setCurrentMoveIdx((prev) => Math.min(report.analyzedMoves.length - 1, prev + 1));
        setPreviewVariation(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [report]);

  const selectMove = (idx: number) => {
    setIsPlaying(false);
    setPreviewVariation(false);
    setCurrentMoveIdx(idx);
  };

  const getBadgeStyle = (cls: MoveClassification) => {
    switch (cls) {
      case 'book':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'best':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
      case 'excellent':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'inaccuracy':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'mistake':
        return 'bg-orange-100 text-orange-800 border-orange-300 font-bold';
      case 'blunder':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
      case 'missed_win':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-extrabold';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getClassificationIcon = (cls: MoveClassification) => {
    switch (cls) {
      case 'book':
        return <BookOpen size={11} className="text-amber-700" />;
      case 'best':
        return <Sparkles size={11} className="text-emerald-700" />;
      case 'excellent':
        return <CheckCircle2 size={11} className="text-teal-700" />;
      case 'good':
        return <CheckCircle2 size={11} className="text-blue-700" />;
      case 'inaccuracy':
        return <HelpCircle size={11} className="text-amber-700" />;
      case 'mistake':
        return <AlertTriangle size={11} className="text-orange-700" />;
      case 'blunder':
        return <Flame size={11} className="text-rose-700" />;
      case 'missed_win':
        return <Zap size={11} className="text-purple-700" />;
      default:
        return null;
    }
  };

  if (isAnalyzing || !report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#739552]/20 border border-[#739552]/40 flex items-center justify-center text-[#739552] text-2xl animate-spin mb-4">
          ♞
        </div>
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Analyzing Game with Engine...
        </h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Calculating position evaluations, detecting tactical opportunities, identifying mistakes, and generating accuracy scores.
        </p>
      </div>
    );
  }

  // Filtered moves for left timeline
  const filteredIndices: number[] = [];
  report.analyzedMoves.forEach((m, idx) => {
    if (timelineFilter === 'all') {
      filteredIndices.push(idx);
    } else if (
      timelineFilter === 'mistakes' &&
      (m.classification === 'blunder' ||
        m.classification === 'mistake' ||
        m.classification === 'inaccuracy' ||
        m.classification === 'missed_win')
    ) {
      filteredIndices.push(idx);
    } else if (
      timelineFilter === 'great' &&
      (m.classification === 'best' || m.classification === 'excellent')
    ) {
      filteredIndices.push(idx);
    }
  });

  return (
    <div className="flex-1 w-full max-w-[1700px] mx-auto p-3 sm:p-5 flex flex-col gap-4">
      {/* Top Review Header */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Game Review & Analysis</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold border border-stone-200 dark:border-stone-700">
                {game.timeControl}
              </span>
            </h1>
            <p className="text-[11px] text-stone-500">
              {report.openingInfo
                ? `${report.openingInfo.eco}: ${report.openingInfo.name}`
                : 'Custom Game'}{' '}
              • {game.date}
            </p>
          </div>
        </div>

        {/* Accuracy Comparison Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <span className="w-3 h-3 rounded-full bg-white border border-stone-400 shadow-sm" />
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate max-w-[90px]">
              {game.white.name}
            </span>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              {report.whiteAccuracy}%
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <span className="w-3 h-3 rounded-full bg-stone-900 border border-stone-600 shadow-sm" />
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate max-w-[90px]">
              {game.black.name}
            </span>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              {report.blackAccuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* 3-Panel Professional Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-4 sm:gap-6 items-start">
        {/* PANEL 1 (LEFT): Game Timeline & Move Classification Register */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3 shadow-sm flex flex-col h-[640px] max-h-[640px] overflow-hidden">
          {/* Timeline Filter Tabs */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold mb-2 shrink-0">
            <button
              onClick={() => setTimelineFilter('all')}
              className={`flex-1 py-1 rounded-lg transition-all ${
                timelineFilter === 'all'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All ({report.analyzedMoves.length})
            </button>
            <button
              onClick={() => setTimelineFilter('mistakes')}
              className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                timelineFilter === 'mistakes'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <AlertTriangle size={11} /> Mistakes
            </button>
            <button
              onClick={() => setTimelineFilter('great')}
              className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                timelineFilter === 'great'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles size={11} /> Great
            </button>
          </div>

          {/* Move List Table */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs scrollbar-thin">
            {filteredIndices.map((idx) => {
              const m = report.analyzedMoves[idx];
              const isSelected = currentMoveIdx === idx;

              return (
                <div
                  key={idx}
                  onClick={() => selectMove(idx)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#739552]/10 border-[#739552] shadow-sm ring-1 ring-[#739552]/40'
                      : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-semibold w-7">
                      {m.moveNumber}.{m.color === 'b' ? '..' : ''}
                    </span>
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                      {m.san}
                    </span>
                  </div>

                  {/* Classification Pill */}
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] capitalize ${getBadgeStyle(
                      m.classification
                    )}`}
                  >
                    {getClassificationIcon(m.classification)}
                    <span>{m.classification.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Initial position button */}
          <button
            onClick={() => selectMove(-1)}
            className={`mt-2 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all text-center shrink-0 ${
              currentMoveIdx === -1
                ? 'bg-stone-900 text-white'
                : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 hover:bg-stone-100'
            }`}
          >
            Starting Board Position
          </button>
        </div>

        {/* PANEL 2 (CENTER): Interactive Chessboard with Strict Position Synchronization */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-3 shrink-0">
            {/* Evaluation Bar */}
            <div className="h-[min(580px,calc(100vh-220px))] flex items-center">
              <EvaluationBar
                scoreCentipawns={activeMove ? activeMove.evalAfterCp : 15}
                isCheckmate={currentSnapshot.isCheckmate}
                orientation={orientation}
              />
            </div>

            {/* Chessboard */}
            <div className="w-[min(580px,calc(100vh-220px))] h-[min(580px,calc(100vh-220px))] aspect-square flex items-center justify-center">
              <Chessboard
                snapshot={currentSnapshot}
                legalMoves={[]}
                orientation={orientation}
                theme={(preferences.boardTheme as BoardTheme) || 'green'}
                interactive={false}
              />
            </div>
          </div>

          {/* Playback & Navigation Controls */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-2 shadow-sm flex items-center justify-between w-full max-w-[580px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectMove(-1)}
                title="First Move (Home)"
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => selectMove(Math.max(-1, currentMoveIdx - 1))}
                title="Previous Move (←)"
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause Auto-Review' : 'Play Auto-Review'}
                className="p-2 rounded-xl bg-[#739552] text-white hover:bg-[#648346] shadow-sm transition-all"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} fill="white" />}
              </button>
              <button
                onClick={() => selectMove(Math.min(report.analyzedMoves.length - 1, currentMoveIdx + 1))}
                title="Next Move (→)"
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => selectMove(report.analyzedMoves.length - 1)}
                title="Last Move (End)"
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              >
                <ChevronsRight size={16} />
              </button>
            </div>

            <div className="text-xs font-mono font-bold text-stone-500">
              Move {currentMoveIdx >= 0 ? currentMoveIdx + 1 : 0} of {report.analyzedMoves.length}
            </div>

            <button
              onClick={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
              title="Flip Board View"
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} /> Flip
            </button>
          </div>
        </div>

        {/* PANEL 3 (RIGHT): Live Analysis & Tactical Insights */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col h-[640px] max-h-[640px] overflow-hidden gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('insight')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'insight'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Move Analysis
            </button>
            <button
              onClick={() => setActiveTab('mistakes')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'mistakes'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Key Errors
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'summary'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Game Summary
            </button>
          </div>

          {activeTab === 'insight' && activeMove ? (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin">
              {/* Classification Headline Card */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm ${getBadgeStyle(
                  activeMove.classification
                )}`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-white/70 shadow-sm">
                    {getClassificationIcon(activeMove.classification)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm capitalize">
                      {activeMove.classification.replace('_', ' ')}: {activeMove.san}
                    </h3>
                    <p className="text-[11px] opacity-80">
                      Played by {activeMove.color === 'w' ? game.white.name : game.black.name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                    Eval
                  </span>
                  <div className="font-mono font-bold text-xs">
                    {(activeMove.evalAfterCp / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* What Happened & Why It Matters */}
              <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    What Happened
                  </h4>
                  <p className="text-xs text-stone-800 dark:text-stone-200 font-medium leading-relaxed mt-0.5">
                    {activeMove.explanation.whatHappened}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Why It Matters
                  </h4>
                  <p className="text-xs text-stone-800 dark:text-stone-200 font-medium leading-relaxed mt-0.5">
                    {activeMove.explanation.whyItMatters}
                  </p>
                </div>
              </div>

              {/* Engine Recommended Alternative */}
              {activeMove.bestAlternativeSan &&
                activeMove.bestAlternativeSan !== activeMove.san && (
                  <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#bbf7d0] dark:border-emerald-800/50 rounded-2xl p-3.5 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803d] dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles size={11} /> Engine Best Alternative
                      </span>
                      <span className="font-mono font-extrabold text-xs text-[#15803d] dark:text-emerald-300">
                        {activeMove.bestAlternativeSan}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 dark:text-stone-300">
                      The engine strongly favored playing{' '}
                      <strong>{activeMove.bestAlternativeSan}</strong> to retain tighter central control.
                    </p>

                    <button
                      onClick={() => setPreviewVariation(!previewVariation)}
                      className="mt-1 py-1.5 px-3 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Eye size={13} />
                      <span>{previewVariation ? 'Hide Position' : 'Show Position on Board'}</span>
                    </button>
                  </div>
                )}
            </div>
          ) : activeTab === 'mistakes' ? (
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-rose-500" />
                Critical Turning Points & Blunders
              </h4>

              {report.analyzedMoves
                .filter(
                  (m) =>
                    m.classification === 'blunder' ||
                    m.classification === 'mistake' ||
                    m.classification === 'missed_win'
                )
                .map((m, i) => {
                  const origIdx = report.analyzedMoves.findIndex(
                    (orig) => orig.moveNumber === m.moveNumber && orig.color === m.color
                  );

                  return (
                    <div
                      key={i}
                      onClick={() => selectMove(origIdx)}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 hover:bg-stone-100 cursor-pointer transition-all flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono">
                          {m.moveNumber}.{m.color === 'b' ? '..' : ''} {m.san}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${getBadgeStyle(
                            m.classification
                          )}`}
                        >
                          {m.classification.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2">
                        {m.explanation.whatHappened}
                      </p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin">
              {/* Summary Headline */}
              <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5">
                <h4 className="font-extrabold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Award size={14} className="text-[#739552]" /> Coach Verdict
                </h4>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed mt-1">
                  {report.summary.headline}
                </p>
              </div>

              {/* Key Takeaways */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Key Observations
                </span>
                {report.summary.keyTakeaways.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed shadow-sm"
                  >
                    • {point}
                  </div>
                ))}
              </div>

              {/* Recommended Practice */}
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Recommended Study
                </span>
                {report.summary.recommendedPracticeTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateTo('puzzles')}
                    className="p-2.5 rounded-xl bg-[#739552]/10 hover:bg-[#739552]/20 border border-[#739552]/30 text-left text-xs font-bold text-[#5f7d41] dark:text-[#8bc75a] transition-all flex items-center justify-between"
                  >
                    <span>{topic}</span>
                    <ChevronRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
