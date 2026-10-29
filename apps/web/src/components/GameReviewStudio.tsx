import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Info,
  X,
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

  // Accuracy explanation popup modal
  const [showAccuracyModal, setShowAccuracyModal] = useState<boolean>(false);

  // Run analysis when game changes
  useEffect(() => {
    setIsAnalyzing(true);
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
      setActiveTab('insight');
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying, report]);

  // Move row references for smooth instant auto-scroll into view without user scrolling
  const moveItemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const rightScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active move into view in timeline and reset right insights scroll to top
  useEffect(() => {
    if (currentMoveIdx >= 0 && moveItemRefs.current[currentMoveIdx]) {
      moveItemRefs.current[currentMoveIdx]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop = 0;
    }
  }, [currentMoveIdx]);

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

  const selectMove = (idx: number) => {
    setIsPlaying(false);
    setPreviewVariation(false);
    setCurrentMoveIdx(idx);
    setActiveTab('insight');
  };

  // Keyboard navigation (← and →)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!report) return;

      if (e.key === 'ArrowLeft') {
        selectMove(Math.max(-1, currentMoveIdx - 1));
      } else if (e.key === 'ArrowRight') {
        selectMove(Math.min(report.analyzedMoves.length - 1, currentMoveIdx + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [report, currentMoveIdx]);

  const getBadgeStyle = (cls: MoveClassification) => {
    switch (cls) {
      case 'book':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'best':
        return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-extrabold';
      case 'excellent':
        return 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800';
      case 'good':
        return 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'inaccuracy':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'mistake':
        return 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800 font-bold';
      case 'blunder':
        return 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-extrabold';
      case 'missed_win':
        return 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-extrabold';
      default:
        return 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    }
  };

  const getClassificationIcon = (cls: MoveClassification) => {
    switch (cls) {
      case 'book':
        return <BookOpen size={11} className="text-amber-700 dark:text-amber-300" />;
      case 'best':
        return <Sparkles size={11} className="text-emerald-700 dark:text-emerald-300" />;
      case 'excellent':
        return <CheckCircle2 size={11} className="text-teal-700 dark:text-teal-300" />;
      case 'good':
        return <CheckCircle2 size={11} className="text-blue-700 dark:text-blue-300" />;
      case 'inaccuracy':
        return <HelpCircle size={11} className="text-amber-700 dark:text-amber-300" />;
      case 'mistake':
        return <AlertTriangle size={11} className="text-orange-700 dark:text-orange-300" />;
      case 'blunder':
        return <Flame size={11} className="text-rose-700 dark:text-rose-300" />;
      case 'missed_win':
        return <Zap size={11} className="text-purple-700 dark:text-purple-300" />;
      default:
        return null;
    }
  };

  // Evaluation Graph Calculations
  const graphPoints = useMemo(() => {
    if (!report || report.analyzedMoves.length === 0) return { polyline: '', points: [] };

    const total = report.analyzedMoves.length;
    const width = 580;
    const height = 54;
    const centerY = height / 2; // 0 cp line

    const pts: { x: number; y: number; cp: number; idx: number }[] = [];

    report.analyzedMoves.forEach((m, i) => {
      const x = total > 1 ? (i / (total - 1)) * width : width / 2;
      // Clamp cp from -600 to +600
      const clamped = Math.max(-600, Math.min(600, m.evalAfterCp));
      // Invert Y so positive cp goes up
      const y = centerY - (clamped / 600) * (height / 2 - 4);
      pts.push({ x, y, cp: m.evalAfterCp, idx: i });
    });

    const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return { polyline, points: pts };
  }, [report]);

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
          Calculating centipawn evaluations, identifying tactical turning points, classifying blunders, and computing accuracy scores.
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
            className="p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Game Review Studio</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-400 font-bold border border-stone-200 dark:border-stone-700 shadow-xs">
                {game.timeControl}
              </span>
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              {report.openingInfo
                ? `${report.openingInfo.eco}: ${report.openingInfo.name}`
                : 'Custom Game'}{' '}
                • {game.date}
            </p>
          </div>
        </div>

        {/* Accuracy Comparison Pills & Info Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs">
            <span className="w-3 h-3 rounded-full bg-white border border-stone-400 shadow-sm" />
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate max-w-[100px]">
              {game.white.name}
            </span>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
              {report.whiteAccuracy}%
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs">
            <span className="w-3 h-3 rounded-full bg-stone-900 border border-stone-600 shadow-sm" />
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate max-w-[100px]">
              {game.black.name}
            </span>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
              {report.blackAccuracy}%
            </span>
          </div>

          <button
            onClick={() => setShowAccuracyModal(true)}
            title="How Accuracy is calculated"
            className="p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors shadow-xs"
          >
            <Info size={15} />
          </button>
        </div>
      </div>

      {/* 3-Panel Synchronized Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-4 sm:gap-6 items-start">
        {/* PANEL 1 (LEFT): Game Timeline & Move Classification Register */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3 shadow-sm flex flex-col h-[min(650px,calc(100vh-160px))] overflow-hidden">
          {/* Timeline Filter Tabs */}
          <div className="flex items-center bg-white dark:bg-stone-800 p-1 rounded-xl text-xs font-bold mb-2 shrink-0 border border-stone-200 dark:border-stone-700 shadow-xs">
            <button
              onClick={() => setTimelineFilter('all')}
              className={`flex-1 py-1 rounded-lg transition-all ${
                timelineFilter === 'all'
                  ? 'bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs border border-stone-200 dark:border-transparent'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              All ({report.analyzedMoves.length})
            </button>
            <button
              onClick={() => setTimelineFilter('mistakes')}
              className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                timelineFilter === 'mistakes'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <AlertTriangle size={11} /> Mistakes
            </button>
            <button
              onClick={() => setTimelineFilter('great')}
              className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                timelineFilter === 'great'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
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
                  ref={(el) => {
                    moveItemRefs.current[idx] = el;
                  }}
                  onClick={() => selectMove(idx)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#739552]/15 dark:bg-[#739552]/25 border-[#739552] shadow-sm ring-1 ring-[#739552]/40'
                      : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold w-7">
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
            className={`mt-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center shrink-0 ${
              currentMoveIdx === -1
                ? 'bg-[#739552] text-white shadow-sm'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-300 hover:bg-stone-50 shadow-xs'
            }`}
          >
            Starting Board Position
          </button>
        </div>

        {/* PANEL 2 (CENTER): Interactive Chessboard, Evaluation Graph & Controls */}
        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="flex items-center justify-center gap-3 shrink-0">
            {/* Evaluation Bar */}
            <div className="h-[min(480px,calc(100vh-290px))] flex items-center">
              <EvaluationBar
                scoreCentipawns={activeMove ? activeMove.evalAfterCp : 15}
                isCheckmate={currentSnapshot.isCheckmate}
                orientation={orientation}
              />
            </div>

            {/* Chessboard */}
            <div className="w-[min(480px,calc(100vh-290px))] h-[min(480px,calc(100vh-290px))] aspect-square flex items-center justify-center">
              <Chessboard
                snapshot={currentSnapshot}
                legalMoves={[]}
                orientation={orientation}
                theme={(preferences.boardTheme as BoardTheme) || 'green'}
                interactive={false}
              />
            </div>
          </div>

          {/* Interactive SVG Evaluation Flow Graph (Click any point to jump to move) */}
          <div className="w-full max-w-[540px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-2.5 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider px-1">
              <span>+ White Advantage</span>
              <span className="font-mono text-stone-700 dark:text-stone-300">
                Evaluation: {activeMove ? (activeMove.evalAfterCp / 100).toFixed(2) : '0.00'}
              </span>
              <span>- Black Advantage</span>
            </div>

            <div className="w-full h-12 relative cursor-pointer group">
              <svg viewBox="0 0 580 54" className="w-full h-full overflow-visible">
                {/* 0.00 Neutral line */}
                <line x1="0" y1="27" x2="580" y2="27" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                {/* Graph Polyline */}
                {graphPoints.polyline && (
                  <polyline
                    fill="none"
                    stroke="#739552"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={graphPoints.polyline}
                  />
                )}

                {/* Clickable hotspots for every move point */}
                {graphPoints.points.map((pt) => {
                  const isCurrent = pt.idx === currentMoveIdx;
                  return (
                    <g key={pt.idx} onClick={() => selectMove(pt.idx)}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isCurrent ? 5 : 2.5}
                        fill={isCurrent ? '#739552' : '#a8a29e'}
                        stroke={isCurrent ? '#ffffff' : 'none'}
                        strokeWidth={isCurrent ? 2 : 0}
                        className="hover:r-4 transition-all"
                      />
                    </g>
                  );
                })}

                {/* Vertical Active Playhead Line */}
                {currentMoveIdx >= 0 && graphPoints.points[currentMoveIdx] && (
                  <line
                    x1={graphPoints.points[currentMoveIdx].x}
                    y1="0"
                    x2={graphPoints.points[currentMoveIdx].x}
                    y2="54"
                    stroke="#739552"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Playback & Navigation Controls */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-2 shadow-sm flex items-center justify-between w-full max-w-[540px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectMove(-1)}
                title="First Move (|<<)"
                className="p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => selectMove(Math.max(-1, currentMoveIdx - 1))}
                title="Previous Move (←)"
                className="p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
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
                className="p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => selectMove(report.analyzedMoves.length - 1)}
                title="Last Move (>>|)"
                className="p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              >
                <ChevronsRight size={16} />
              </button>
            </div>

            <div className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300">
              Move {currentMoveIdx >= 0 ? currentMoveIdx + 1 : 0} of {report.analyzedMoves.length}
            </div>

            <button
              onClick={() => setOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
              title="Flip Board View"
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
            >
              <RotateCcw size={12} /> Flip
            </button>
          </div>
        </div>

        {/* PANEL 3 (RIGHT): Live Analysis & Tactical Insights */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col h-[min(650px,calc(100vh-160px))] overflow-hidden gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-white dark:bg-stone-800 p-1 rounded-xl text-xs font-bold shrink-0 border border-stone-200 dark:border-stone-700 shadow-xs">
            <button
              onClick={() => setActiveTab('insight')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'insight'
                  ? 'bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs border border-stone-200 dark:border-transparent'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Move Analysis
            </button>
            <button
              onClick={() => setActiveTab('mistakes')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'mistakes'
                  ? 'bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs border border-stone-200 dark:border-transparent'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Key Errors
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'summary'
                  ? 'bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs border border-stone-200 dark:border-transparent'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Game Summary
            </button>
          </div>

          {activeTab === 'insight' && activeMove ? (
            <div ref={rightScrollRef} className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-thin">
              {/* Classification Headline Card */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm ${getBadgeStyle(
                  activeMove.classification
                )}`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-white/80 dark:bg-black/40 shadow-sm">
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
              <div className="bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xs">
                <div>
                  <h4 className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    What Happened
                  </h4>
                  <p className="text-xs text-stone-800 dark:text-stone-200 font-medium leading-relaxed mt-0.5">
                    {activeMove.explanation.whatHappened}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
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
                  <div className="bg-[#f0fdf4] dark:bg-emerald-950/40 border border-[#bbf7d0] dark:border-emerald-800/60 rounded-2xl p-3.5 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803d] dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles size={11} /> Engine Best Alternative
                      </span>
                      <span className="font-mono font-extrabold text-xs text-[#15803d] dark:text-emerald-300">
                        {activeMove.bestAlternativeSan}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 dark:text-stone-300">
                      The engine favored playing{' '}
                      <strong>{activeMove.bestAlternativeSan}</strong> to retain tighter central control and tactical initiative.
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
          ) : activeTab === 'insight' ? (
            <div
              ref={rightScrollRef}
              className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin items-center justify-center text-center p-6 bg-stone-50/50 dark:bg-stone-800/30 rounded-2xl border border-stone-100 dark:border-stone-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#739552]/10 border border-[#739552]/30 flex items-center justify-center text-[#739552] text-xl font-bold">
                ♟
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  Starting Position
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-[260px] leading-relaxed">
                  {report.openingInfo ? `${report.openingInfo.eco}: ${report.openingInfo.name}` : 'Standard Game Opening'}.
                  Click any move in the timeline or use the arrow keys to inspect full tactical evaluations and engine suggestions.
                </p>
              </div>
              <button
                onClick={() => selectMove(0)}
                className="px-4 py-2 rounded-xl bg-[#739552] text-white hover:bg-[#648346] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all mt-1"
              >
                <span>Inspect Move 1</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : activeTab === 'mistakes' ? (
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle size={13} className="text-rose-500" />
                Critical Turning Points & Errors ({report.analyzedMoves.filter(m => m.classification === 'blunder' || m.classification === 'mistake' || m.classification === 'missed_win').length})
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
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 hover:border-stone-300 hover:bg-stone-50 cursor-pointer transition-all flex flex-col gap-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-stone-900 dark:text-stone-100">
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
              <div className="bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 shadow-xs">
                <h4 className="font-extrabold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Award size={14} className="text-[#739552]" /> Coach Verdict
                </h4>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed mt-1">
                  {report.summary.headline}
                </p>
              </div>

              {/* Key Takeaways */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Key Observations
                </span>
                {report.summary.keyTakeaways.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed shadow-xs"
                  >
                    • {point}
                  </div>
                ))}
              </div>

              {/* Recommended Practice */}
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Personalized Study Recommendations
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

      {/* Accuracy Explanation Modal (Point 97) */}
      {showAccuracyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#739552]/15 text-[#739552]">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Understanding Accuracy (CAPS)
                  </h3>
                  <span className="text-xs text-stone-500">Evaluation Metric vs Official Rating</span>
                </div>
              </div>
              <button
                onClick={() => setShowAccuracyModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-300 space-y-2.5 leading-relaxed font-medium">
              <p>
                <strong>Accuracy is not an Elo rating.</strong> It measures how closely each player’s moves matched the engine&apos;s top-ranked recommendations throughout this single specific game.
              </p>
              <p>
                A 90%+ accuracy means you played like a master in this particular game, but your overall rating depends on consistency across hundreds of tournament games.
              </p>
              <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] text-stone-700 dark:text-stone-300 shadow-xs">
                • <strong>90–100%:</strong> Master-level precision<br />
                • <strong>80–89%:</strong> Strong competitive play<br />
                • <strong>70–79%:</strong> Solid intermediate performance<br />
                • <strong>&lt; 70%:</strong> High frequency of tactical oversights
              </div>
            </div>

            <button
              onClick={() => setShowAccuracyModal(false)}
              className="w-full py-2.5 bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
