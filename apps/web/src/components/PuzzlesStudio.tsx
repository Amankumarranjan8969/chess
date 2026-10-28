import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChessGame, Color, PieceSymbol, Square } from '@chess/core';
import { usePlatform } from '../context/PlatformContext.js';
import { Puzzle } from '../types/platform.js';
import { Chessboard, BoardTheme } from './Chessboard.js';
import { soundManager } from '../audio/soundManager.js';
import {
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Filter,
  Award,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Play,
} from 'lucide-react';

export const PuzzlesStudio: React.FC = () => {
  const { puzzles, activePuzzleId, user, solvePuzzle, preferences, navigateTo } = usePlatform();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentPuzzleIdx, setCurrentPuzzleIdx] = useState<number>(0);

  // Filtered puzzle list
  const filteredPuzzles = useMemo(() => {
    return puzzles.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
      return matchCat && matchDiff;
    });
  }, [puzzles, selectedCategory, selectedDifficulty]);

  const activePuzzle: Puzzle = useMemo(() => {
    if (activePuzzleId) {
      const found = puzzles.find((p) => p.id === activePuzzleId);
      if (found) return found;
    }
    return filteredPuzzles[currentPuzzleIdx] || puzzles[0];
  }, [puzzles, activePuzzleId, filteredPuzzles, currentPuzzleIdx]);

  // Game state for active puzzle
  const [puzzleGame, setPuzzleGame] = useState<ChessGame>(
    () => new ChessGame(activePuzzle.preFen || activePuzzle.fen)
  );
  const [snapshot, setSnapshot] = useState(() => puzzleGame.getSnapshot());
  const [legalMoves, setLegalMoves] = useState(() => puzzleGame.getLegalMoves());

  // Opponent move animation state
  const [isOpponentMoving, setIsOpponentMoving] = useState<boolean>(false);
  const [opponentLastMove, setOpponentLastMove] = useState<{ from: Square; to: Square } | null>(
    activePuzzle.opponentMove
      ? { from: activePuzzle.opponentMove.from as Square, to: activePuzzle.opponentMove.to as Square }
      : null
  );

  // Solution progression
  const [solutionStep, setSolutionStep] = useState<number>(0);
  const [status, setStatus] = useState<'solving' | 'solved' | 'failed'>('solving');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const opponentTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and animate puzzle: displays opponent's preceding move before giving user the turn
  const loadPuzzle = (p: Puzzle, animateOpponentMove: boolean = true) => {
    if (opponentTimerRef.current) {
      clearTimeout(opponentTimerRef.current);
      opponentTimerRef.current = null;
    }

    setSolutionStep(0);
    setStatus('solving');
    setShowHint(false);
    setShowSolution(false);

    if (animateOpponentMove && p.preFen && p.opponentMove) {
      // 1. Initialize at the position immediately before opponent blunder/move
      const preGame = new ChessGame(p.preFen);
      setPuzzleGame(preGame);
      setSnapshot(preGame.getSnapshot());
      setLegalMoves([]);
      setIsOpponentMoving(true);
      setOpponentLastMove(null);
      setFeedbackMsg(`Opponent is playing ${p.opponentMove.san || 'their move'}...`);

      // 2. Play the opponent's move with realistic delay
      opponentTimerRef.current = setTimeout(() => {
        const res = preGame.makeMove({
          from: p.opponentMove!.from as Square,
          to: p.opponentMove!.to as Square,
        });

        if (res.success) {
          if (res.move?.captured) {
            soundManager.playCapture();
          } else {
            soundManager.playMove();
          }
        }

        const afterSnap = preGame.getSnapshot();
        setSnapshot(afterSnap);
        setLegalMoves(preGame.getLegalMoves());
        setIsOpponentMoving(false);
        setOpponentLastMove({
          from: p.opponentMove!.from as Square,
          to: p.opponentMove!.to as Square,
        });
        setFeedbackMsg(
          `Opponent played ${p.opponentMove!.san}. Your turn — find the winning move!`
        );
      }, 500);
    } else {
      // Direct load if no preFen or animation skipped
      const directGame = new ChessGame(p.fen);
      setPuzzleGame(directGame);
      setSnapshot(directGame.getSnapshot());
      setLegalMoves(directGame.getLegalMoves());
      setIsOpponentMoving(false);
      if (p.opponentMove) {
        setOpponentLastMove({
          from: p.opponentMove.from as Square,
          to: p.opponentMove.to as Square,
        });
        setFeedbackMsg(`Opponent played ${p.opponentMove.san}. Find the winning move!`);
      } else {
        setOpponentLastMove(null);
        setFeedbackMsg(null);
      }
    }
  };

  // Reset board when active puzzle changes
  useEffect(() => {
    loadPuzzle(activePuzzle, true);
    return () => {
      if (opponentTimerRef.current) {
        clearTimeout(opponentTimerRef.current);
      }
    };
  }, [activePuzzle]);

  // Handle player move on puzzle board
  const handlePuzzleMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (status === 'solved' || isOpponentMoving) return;

    const expectedMove = activePuzzle.solutionMoves[solutionStep];
    if (!expectedMove) return;

    const isMatch =
      expectedMove.from === from &&
      expectedMove.to === to &&
      (!expectedMove.promotion || expectedMove.promotion === promotion);

    if (isMatch) {
      // Execute the player's correct move
      const res = puzzleGame.makeMove({ from, to, promotion });
      if (!res.success) return;

      if (res.move?.isCheckmate) {
        soundManager.playGameOver();
      } else if (res.move?.captured) {
        soundManager.playCapture();
      } else {
        soundManager.playMove();
      }

      const newSnap = puzzleGame.getSnapshot();
      setSnapshot(newSnap);
      setLegalMoves(puzzleGame.getLegalMoves());
      setOpponentLastMove({ from, to });

      const nextStep = solutionStep + 1;

      // Check if puzzle is fully solved
      if (nextStep >= activePuzzle.solutionMoves.length) {
        setStatus('solved');
        setFeedbackMsg('Brilliant! You found the winning tactical sequence.');
        solvePuzzle(activePuzzle.id, true, 15);
      } else {
        // If there is an opponent reply move in the puzzle
        setSolutionStep(nextStep);
        setFeedbackMsg('Great move! Watch the opponent’s reply...');
        setIsOpponentMoving(true);

        setTimeout(() => {
          const opponentMove = activePuzzle.solutionMoves[nextStep];
          if (opponentMove) {
            puzzleGame.makeMove({
              from: opponentMove.from as Square,
              to: opponentMove.to as Square,
              promotion: opponentMove.promotion as PieceSymbol | undefined,
            });
            soundManager.playMove();
            setSnapshot(puzzleGame.getSnapshot());
            setLegalMoves(puzzleGame.getLegalMoves());
            setOpponentLastMove({
              from: opponentMove.from as Square,
              to: opponentMove.to as Square,
            });
            setSolutionStep(nextStep + 1);
            setIsOpponentMoving(false);
            setFeedbackMsg('Now find the winning follow-up!');
          }
        }, 600);
      }
    } else {
      // Incorrect move
      setStatus('failed');
      setFeedbackMsg('That’s not the best move. Try again or check the hint!');
      solvePuzzle(activePuzzle.id, false, 20);
    }
  };

  const handleRetry = () => {
    loadPuzzle(activePuzzle, true);
  };

  const handleReplayOpponentMove = () => {
    loadPuzzle(activePuzzle, true);
  };

  const handleNextPuzzle = () => {
    setCurrentPuzzleIdx((prev) => (prev + 1) % filteredPuzzles.length);
  };

  const handlePrevPuzzle = () => {
    setCurrentPuzzleIdx((prev) => (prev - 1 + filteredPuzzles.length) % filteredPuzzles.length);
  };

  const pStats = user.ratings.puzzles;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* 1. TOP HEADER BANNER: TACTICAL METRICS & STREAK */}
      <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-900/40">
            🧩
          </div>
          <div>
            <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight">
              Tactical Puzzles Studio
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 max-w-md font-medium">
              Sharpen your tactical vision with verified puzzles calibrated by Elo rating and strategic theme.
            </p>
          </div>
        </div>

        {/* 3 Unified Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 flex flex-col items-center min-w-[90px] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
              Puzzle Rating
            </span>
            <span className="text-xl font-mono font-extrabold text-purple-600 dark:text-purple-400">
              {pStats.rating}
            </span>
          </div>

          <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 flex flex-col items-center min-w-[90px] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Flame size={12} className="text-amber-500" /> Streak
            </span>
            <span className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
              {pStats.streak}
            </span>
          </div>

          <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 flex flex-col items-center min-w-[90px] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
              Solved
            </span>
            <span className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {pStats.solvedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left: The Chessboard and Interactive Controls */}
        <div className="flex flex-col items-center justify-center gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm">
          {/* Turn Objective & Opponent Move Display Banner */}
          <div className="w-full flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3.5 h-3.5 rounded-full border shadow-sm ${
                  activePuzzle.sideToMove === 'w'
                    ? 'bg-white border-stone-400'
                    : 'bg-stone-900 border-stone-600'
                }`}
              />
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {activePuzzle.sideToMove === 'w' ? 'White' : 'Black'} to Move and Win
              </span>

              {/* Explicit Opponent Last Move Tag */}
              {activePuzzle.opponentMove && (
                <div className="flex items-center gap-1.5 ml-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs border ${
                      isOpponentMoving
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    <ArrowRight size={12} className="text-[#739552]" />
                    <span>
                      Opponent played: <strong>{activePuzzle.opponentMove.san}</strong>
                    </span>
                  </span>

                  <button
                    onClick={handleReplayOpponentMove}
                    title="Replay Opponent Move Animation"
                    className="p-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
                  >
                    <RotateCcw size={11} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono border border-stone-200 dark:border-stone-700 shadow-xs">
                Elo {activePuzzle.rating}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#739552]/10 text-[#5f7d41] dark:text-[#88c558] border border-[#739552]/20">
                {activePuzzle.theme}
              </span>
            </div>
          </div>

          {/* Interactive Chessboard with Explicit Opponent Last Move Highlighting */}
          <div className="w-[min(540px,calc(100vh-280px))] h-[min(540px,calc(100vh-280px))] aspect-square flex items-center justify-center shrink-0 relative">
            <Chessboard
              snapshot={snapshot}
              legalMoves={legalMoves}
              orientation={activePuzzle.sideToMove}
              theme={(preferences.boardTheme as BoardTheme) || 'green'}
              interactive={status !== 'solved' && !isOpponentMoving}
              lastMoveOverride={opponentLastMove}
              onMove={handlePuzzleMove}
            />

            {isOpponentMoving && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-stone-900/90 text-white text-xs font-bold px-3 py-1 rounded-xl shadow-lg backdrop-blur-xs flex items-center gap-2 pointer-events-none animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Opponent is making their move...</span>
              </div>
            )}
          </div>

          {/* Feedback & Result Message */}
          {feedbackMsg && (
            <div
              className={`w-full p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold shadow-sm animate-in fade-in ${
                status === 'solved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                  : status === 'failed'
                  ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                  : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
              }`}
            >
              {status === 'solved' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : status === 'failed' ? (
                <XCircle size={16} className="text-rose-600 shrink-0" />
              ) : (
                <Sparkles size={16} className="text-amber-600 shrink-0" />
              )}
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="w-full flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRetry}
                className="px-3 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RotateCcw size={13} /> Retry
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Lightbulb size={13} /> {showHint ? 'Hide Hint' : 'Hint'}
              </button>
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Eye size={13} /> {showSolution ? 'Hide Solution' : 'Solution'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPuzzle}
                title="Previous Puzzle"
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors shadow-xs"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextPuzzle}
                className="px-4 py-2 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Next Puzzle</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Puzzle Details, Hint, Solution Explanation & Filters */}
        <div className="flex flex-col gap-4">
          {/* Hint Card */}
          {showHint && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm animate-in fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                <Lightbulb size={12} /> Tactical Hint
              </span>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                {activePuzzle.hint}
              </p>
            </div>
          )}

          {/* Solution & Explanation Card */}
          {showSolution && (
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 flex flex-col gap-2 shadow-xs animate-in fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <BookOpen size={12} /> Solution Explanation
              </span>
              <div className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>Sequence:</span>
                {activePuzzle.solutionMoves.map((m, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-transparent text-[11px]"
                  >
                    {m.san || `${m.from}-${m.to}`}
                  </span>
                ))}
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed mt-1">
                {activePuzzle.explanation}
              </p>
            </div>
          )}

          {/* Category & Difficulty Filters Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <Filter size={13} /> Puzzle Themes & Categories
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Themes' },
                { id: 'mate_in_1', label: 'Mate in 1' },
                { id: 'fork', label: 'Forks' },
                { id: 'pin', label: 'Pins' },
                { id: 'skewer', label: 'Skewers' },
                { id: 'discovered_attack', label: 'Discovered' },
                { id: 'sacrifice', label: 'Sacrifices' },
                { id: 'back_rank', label: 'Back-Rank' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === c.id
                      ? 'bg-[#739552] text-white shadow-sm'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 hover:bg-stone-50 border border-stone-200 dark:border-stone-700 shadow-xs'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="border-t border-stone-100 dark:border-stone-800 pt-3 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Difficulty Level
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'All Levels' },
                  { id: 'beginner', label: 'Beginner (<1100)' },
                  { id: 'intermediate', label: 'Intermediate (1100-1500)' },
                  { id: 'advanced', label: 'Advanced (1500+)' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDifficulty(d.id)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all text-center ${
                      selectedDifficulty === d.id
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                        : 'bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 shadow-xs'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Personalized Training Recommendation */}
          <div className="bg-gradient-to-br from-[#739552]/10 to-[#739552]/20 border border-[#739552]/30 rounded-3xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#5f7d41] dark:text-[#88c558]">
              <Sparkles size={14} /> Personalized Recommendation
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              Based on your recent game review, practicing <strong>Knight Forks</strong> and{' '}
              <strong>Back-Rank Defense</strong> will boost your tactical rating fastest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
