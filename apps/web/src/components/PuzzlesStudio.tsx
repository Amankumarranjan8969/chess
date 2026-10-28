import React, { useState, useMemo, useEffect } from 'react';
import { ChessGame, Color, PieceSymbol, Square } from '@chess/core';
import { usePlatform } from '../context/PlatformContext.js';
import { Puzzle } from '../types/platform.js';
import { Chessboard, BoardTheme } from './Chessboard.js';
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
    () => new ChessGame(activePuzzle.fen)
  );
  const [snapshot, setSnapshot] = useState(() => puzzleGame.getSnapshot());
  const [legalMoves, setLegalMoves] = useState(() => puzzleGame.getLegalMoves());

  // Solution progression
  const [solutionStep, setSolutionStep] = useState<number>(0);
  const [status, setStatus] = useState<'solving' | 'solved' | 'failed'>('solving');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // Reset board when active puzzle changes
  useEffect(() => {
    const newGame = new ChessGame(activePuzzle.fen);
    setPuzzleGame(newGame);
    setSnapshot(newGame.getSnapshot());
    setLegalMoves(newGame.getLegalMoves());
    setSolutionStep(0);
    setStatus('solving');
    setFeedbackMsg(null);
    setShowHint(false);
    setShowSolution(false);
  }, [activePuzzle]);

  // Handle player move on puzzle board
  const handlePuzzleMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (status === 'solved') return;

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

      const newSnap = puzzleGame.getSnapshot();
      setSnapshot(newSnap);
      setLegalMoves(puzzleGame.getLegalMoves());

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

        setTimeout(() => {
          const opponentMove = activePuzzle.solutionMoves[nextStep];
          if (opponentMove) {
            puzzleGame.makeMove({
              from: opponentMove.from as Square,
              to: opponentMove.to as Square,
              promotion: opponentMove.promotion as PieceSymbol | undefined,
            });
            setSnapshot(puzzleGame.getSnapshot());
            setLegalMoves(puzzleGame.getLegalMoves());
            setSolutionStep(nextStep + 1);
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
    const newGame = new ChessGame(activePuzzle.fen);
    setPuzzleGame(newGame);
    setSnapshot(newGame.getSnapshot());
    setLegalMoves(newGame.getLegalMoves());
    setSolutionStep(0);
    setStatus('solving');
    setFeedbackMsg(null);
    setShowHint(false);
    setShowSolution(false);
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
      {/* Top Banner: Stats & Streaks */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-5 shadow-lg border border-stone-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-purple-900/30">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight flex items-center gap-2">
              Tactical Puzzles Arena
            </h1>
            <p className="text-xs text-stone-400">
              Pattern recognition, mate nets, forks, pins, and master tactical calculations
            </p>
          </div>
        </div>

        {/* Puzzle Rating Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-stone-800/80 border border-stone-700 rounded-2xl px-4 py-2 flex items-center gap-3">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                Puzzle Rating
              </span>
              <div className="text-xl font-mono font-extrabold text-purple-400">
                {pStats.rating}
              </div>
            </div>
            <div className="w-px h-8 bg-stone-700" />
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider flex items-center gap-1">
                <Flame size={12} className="text-amber-400" /> Streak
              </span>
              <div className="text-xl font-mono font-extrabold text-amber-400">
                {pStats.streak}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left: The Chessboard and Interactive Controls */}
        <div className="flex flex-col items-center justify-center gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-sm">
          {/* Turn Objective Banner */}
          <div className="w-full flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
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
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono">
                Elo {activePuzzle.rating}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#739552]/10 text-[#5f7d41] dark:text-[#88c558] border border-[#739552]/20">
                {activePuzzle.theme}
              </span>
            </div>
          </div>

          {/* Interactive Chessboard */}
          <div className="w-[min(540px,calc(100vh-280px))] h-[min(540px,calc(100vh-280px))] aspect-square flex items-center justify-center shrink-0">
            <Chessboard
              snapshot={snapshot}
              legalMoves={legalMoves}
              orientation={activePuzzle.sideToMove}
              theme={(preferences.boardTheme as BoardTheme) || 'green'}
              interactive={status !== 'solved'}
              onMove={handlePuzzleMove}
            />
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
                className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw size={13} /> Retry
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Lightbulb size={13} /> {showHint ? 'Hide Hint' : 'Hint'}
              </button>
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Eye size={13} /> {showSolution ? 'Hide Solution' : 'Solution'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPuzzle}
                title="Previous Puzzle"
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
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
            <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 flex flex-col gap-2 shadow-sm animate-in fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <BookOpen size={12} /> Solution Explanation
              </span>
              <div className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>Sequence:</span>
                {activePuzzle.solutionMoves.map((m, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-[11px]"
                  >
                    {m.san || `${m.from}-${m.to}`}
                  </span>
                ))}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mt-1">
                {activePuzzle.explanation}
              </p>
            </div>
          )}

          {/* Category & Difficulty Filters Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
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
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="border-t border-stone-100 dark:border-stone-800 pt-3 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
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
                        : 'bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-600 hover:bg-stone-100'
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
