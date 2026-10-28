import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChessGame,
  Color,
  DetailedMove,
  GameSnapshot,
  PieceSymbol,
  Square,
  TimeControl,
  ChessAI,
  detectOpening,
  OpeningInfo,
  PIECE_VALUES,
} from '@chess/core';
import { Chessboard, BoardTheme } from './components/Chessboard.js';
import { ClockDisplay } from './components/ClockDisplay.js';
import { MoveHistory } from './components/MoveHistory.js';
import { EvaluationBar } from './components/EvaluationBar.js';
import { CapturedPieces } from './components/CapturedPieces.js';
import { GameOverModal } from './components/GameOverModal.js';
import { NewGameModal } from './components/NewGameModal.js';
import { useChessAI, AIDifficulty } from './hooks/useChessAI.js';
import { useChessSocket } from './hooks/useChessSocket.js';
import { soundManager } from './audio/soundManager.js';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Flag,
  Handshake,
  Bot,
  Users,
  Globe,
  Share2,
  Lightbulb,
  BookOpen,
  Maximize2,
  Minimize2,
  Play,
} from 'lucide-react';

type GameMode = 'computer' | 'local' | 'online';

export const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('computer');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [userColor, setUserColor] = useState<Color>('w');
  const [orientation, setOrientation] = useState<Color>('w');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('green');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showBestMoveHint, setShowBestMoveHint] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);

  // Online credentials
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [playerNameInput, setPlayerNameInput] = useState<string>('Player');

  // History Review / Ply Navigation (-1 = live game, -2 = start, 0..N = move index)
  const [reviewPly, setReviewPly] = useState<number>(-1);

  // Local/Offline Game Engine
  const localGameRef = useRef<ChessGame>(
    new ChessGame(undefined, { timeControl: { initialMs: 300000, incrementMs: 3000 } })
  );
  const [localSnapshot, setLocalSnapshot] = useState<GameSnapshot>(() =>
    localGameRef.current.getSnapshot()
  );
  const [legalMoves, setLegalMoves] = useState<DetailedMove[]>(() =>
    localGameRef.current.getLegalMoves()
  );

  // Background Evaluation Engine
  const evalEngineRef = useRef<ChessAI>(new ChessAI());
  const [evalScore, setEvalScore] = useState<number>(0);
  const [bestMoveHint, setBestMoveHint] = useState<{ from: Square; to: Square } | null>(null);

  // AI Hook
  const { getMove: getAIMove, isThinking: isAIThinking, cancelSearch } = useChessAI();

  // Online Socket Hook
  const socketHook = useChessSocket();

  const isOnline = mode === 'online';
  const liveSnapshot: GameSnapshot = isOnline
    ? socketHook.roomState?.gameState ?? localSnapshot
    : localSnapshot;

  // Real-time clock tick and automatic timeout flag detector for local play
  useEffect(() => {
    if (isOnline || localSnapshot.status !== 'active') return;

    const interval = setInterval(() => {
      const snap = localGameRef.current.getSnapshot();

      // Check if timeout occurred
      if (snap.status === 'finished') {
        setLocalSnapshot(snap);
        setShowGameOverModal(true);
        soundManager.playGameOver();
      } else {
        // Continuous clock snapshot sync
        setLocalSnapshot((prev) => ({
          ...prev,
          clocks: snap.clocks,
        }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOnline, localSnapshot.status]);

  // When game finishes online, trigger game over modal
  useEffect(() => {
    if (isOnline && socketHook.roomState?.gameState.status === 'finished') {
      setShowGameOverModal(true);
    }
  }, [isOnline, socketHook.roomState?.gameState.status]);

  // Active snapshot (either live or historical review)
  const currentSnapshot: GameSnapshot = useMemo(() => {
    if (reviewPly === -1) {
      return liveSnapshot;
    }

    if (reviewPly === -2) {
      const tempGame = new ChessGame();
      return tempGame.getSnapshot();
    }

    const move = liveSnapshot.moveHistory[reviewPly];
    if (move && move.fenAfter) {
      const tempGame = new ChessGame(move.fenAfter);
      const snap = tempGame.getSnapshot();
      return {
        ...snap,
        moveHistory: liveSnapshot.moveHistory,
        lastMove: move,
      };
    }

    return liveSnapshot;
  }, [reviewPly, liveSnapshot]);

  // Compute Opening Name
  const openingInfo: OpeningInfo | null = useMemo(() => {
    const sans = liveSnapshot.moveHistory.map((m) => m.san);
    return detectOpening(sans);
  }, [liveSnapshot.moveHistory]);

  // Compute Captured Pieces & Material Differential
  const { whiteCaptured, blackCaptured, whiteAdvantage, blackAdvantage } = useMemo(() => {
    const whiteCaps: PieceSymbol[] = [];
    const blackCaps: PieceSymbol[] = [];
    let whiteScore = 0;
    let blackScore = 0;

    liveSnapshot.moveHistory.forEach((m) => {
      if (m.captured) {
        if (m.color === 'w') {
          whiteCaps.push(m.captured);
          whiteScore += PIECE_VALUES[m.captured] ?? 0;
        } else {
          blackCaps.push(m.captured);
          blackScore += PIECE_VALUES[m.captured] ?? 0;
        }
      }
    });

    const diff = (whiteScore - blackScore) / 100;
    return {
      whiteCaptured: whiteCaps,
      blackCaptured: blackCaps,
      whiteAdvantage: diff > 0 ? Math.round(diff) : 0,
      blackAdvantage: diff < 0 ? Math.round(Math.abs(diff)) : 0,
    };
  }, [liveSnapshot.moveHistory]);

  // Live Position Evaluation & Best Move Finder
  useEffect(() => {
    try {
      const result = evalEngineRef.current.findBestMove(currentSnapshot.fen, { depth: 2 });
      setEvalScore(result.evaluation);
      if (result.bestMove) {
        setBestMoveHint({
          from: result.bestMove.from as Square,
          to: result.bestMove.to as Square,
        });
      } else {
        setBestMoveHint(null);
      }
    } catch {
      // Fallback
    }
  }, [currentSnapshot.fen]);

  // Keyboard navigation (← and → keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        setReviewPly((prev) => {
          const active = prev === -1 ? liveSnapshot.moveHistory.length - 1 : prev;
          return Math.max(-2, active - 1);
        });
      } else if (e.key === 'ArrowRight') {
        setReviewPly((prev) => {
          if (prev === -1) return -1;
          if (prev >= liveSnapshot.moveHistory.length - 1) return -1;
          return prev + 1;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [liveSnapshot.moveHistory.length]);

  // Start a new local game with configured options
  const startNewLocalGame = useCallback(
    (
      chosenColor: Color = userColor,
      chosenDifficulty: AIDifficulty = difficulty,
      timeControl: TimeControl = { initialMs: 300000, incrementMs: 3000 }
    ) => {
      cancelSearch();
      setReviewPly(-1);
      setShowGameOverModal(false);
      setUserColor(chosenColor);
      setDifficulty(chosenDifficulty);
      setOrientation(chosenColor);

      const newGame = new ChessGame(undefined, { timeControl });
      localGameRef.current = newGame;
      setLocalSnapshot(newGame.getSnapshot());
      setLegalMoves(newGame.getLegalMoves());
    },
    [cancelSearch, userColor, difficulty]
  );

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  const flipBoard = () => {
    setOrientation((prev) => (prev === 'w' ? 'b' : 'w'));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Local move execution
  const handleLocalMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    setReviewPly(-1);
    const res = localGameRef.current.makeMove({ from, to, promotion });
    if (!res.success || !res.move) return;

    if (res.move.isCheckmate) {
      soundManager.playGameOver();
    } else if (res.move.isCheck) {
      soundManager.playCheck();
    } else if (res.move.captured) {
      soundManager.playCapture();
    } else {
      soundManager.playMove();
    }

    const snap = localGameRef.current.getSnapshot();
    setLocalSnapshot(snap);
    setLegalMoves(localGameRef.current.getLegalMoves());

    if (snap.status === 'finished') {
      setShowGameOverModal(true);
    }
  };

  // Online move execution
  const handleOnlineMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    setReviewPly(-1);
    socketHook.sendMove({ from, to, promotion });
  };

  // Trigger AI reply when it's computer's turn in 'computer' mode
  useEffect(() => {
    if (mode !== 'computer') return;
    if (localSnapshot.status !== 'active') return;
    if (reviewPly !== -1) return;

    const computerColor: Color = userColor === 'w' ? 'b' : 'w';
    if (localSnapshot.sideToMove === computerColor && !isAIThinking) {
      getAIMove(localSnapshot, difficulty).then((move) => {
        if (move) {
          handleLocalMove(
            move.from as Square,
            move.to as Square,
            move.promotion as PieceSymbol | undefined
          );
        }
      });
    }
  }, [mode, localSnapshot, userColor, difficulty, isAIThinking, getAIMove, reviewPly]);

  const currentLegalMoves: DetailedMove[] = isOnline
    ? localGameRef.current ? localGameRef.current.getLegalMoves() : []
    : reviewPly === -1 ? legalMoves : [];

  const handleMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (isOnline) {
      handleOnlineMove(from, to, promotion);
    } else {
      handleLocalMove(from, to, promotion);
    }
  };

  const handleResign = () => {
    if (confirm('Are you sure you want to resign?')) {
      if (isOnline) {
        socketHook.resign();
      } else {
        localGameRef.current.resign(localSnapshot.sideToMove);
        const snap = localGameRef.current.getSnapshot();
        setLocalSnapshot(snap);
        setShowGameOverModal(true);
        soundManager.playGameOver();
      }
    }
  };

  const handleClaimDraw = (type: 'threefold' | 'fifty_moves') => {
    if (isOnline) {
      socketHook.claimDraw(type);
    } else {
      localGameRef.current.claimDraw(type);
      const snap = localGameRef.current.getSnapshot();
      setLocalSnapshot(snap);
      setShowGameOverModal(true);
      soundManager.playGameOver();
    }
  };

  const topPlayerColor: Color = orientation === 'w' ? 'b' : 'w';
  const bottomPlayerColor: Color = orientation === 'w' ? 'w' : 'b';

  // Whose turn is it relative to user
  const isUserTurn =
    liveSnapshot.status === 'active' &&
    (isOnline ? socketHook.playerColor === liveSnapshot.sideToMove : liveSnapshot.sideToMove === userColor);

  return (
    <div className="min-h-screen bg-[#161512] text-[#edebe8] flex flex-col font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#2d2b27] bg-[#1b1a17]/95 backdrop-blur px-5 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#739552]/25 border border-[#739552]/50 flex items-center justify-center font-bold text-[#ebecd0] text-xl shadow">
            ♞
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-tight tracking-tight text-white flex items-center gap-2">
              Grandmaster Arena
            </h1>
            <p className="text-[11px] text-stone-400">Professional Chess Platform</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-[#21201d] p-1 rounded-xl border border-[#33302a] text-xs shadow-inner">
          <button
            onClick={() => {
              setMode('computer');
              setShowNewGameModal(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'computer'
                ? 'bg-[#739552] text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Bot size={14} />
            <span>vs Computer</span>
          </button>
          <button
            onClick={() => {
              setMode('online');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'online'
                ? 'bg-[#739552] text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Globe size={14} />
            <span>Play Online</span>
          </button>
          <button
            onClick={() => {
              setMode('local');
              startNewLocalGame('w', 'medium');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'local'
                ? 'bg-[#739552] text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Pass & Play</span>
          </button>
        </div>

        {/* Action Controls & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBestMoveHint((prev) => !prev)}
            title={showBestMoveHint ? 'Hide Best Move Hint' : 'Show Best Move Hint'}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-bold ${
              showBestMoveHint
                ? 'bg-[#739552]/25 border-[#739552] text-[#82aa5a]'
                : 'bg-[#21201d] hover:bg-[#282622] border-[#33302a] text-stone-400'
            }`}
          >
            <Lightbulb size={14} />
            <span className="hidden sm:inline">Hint</span>
          </button>

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 rounded-lg bg-[#21201d] hover:bg-[#282622] border border-[#33302a] text-stone-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-lg bg-[#21201d] hover:bg-[#282622] border border-[#33302a] text-stone-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* Left Column: Board, Evaluation Bar & Prominent Clocks */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Top Player Info & Clock */}
          <div className="w-full max-w-[620px] flex flex-col gap-1">
            <ClockDisplay
              color={topPlayerColor}
              playerName={
                isOnline
                  ? socketHook.roomState?.blackPlayer?.name || 'Waiting for opponent...'
                  : mode === 'computer'
                  ? `Computer (${difficulty.toUpperCase()})`
                  : 'Player 2 (Black)'
              }
              clockState={liveSnapshot.clocks}
              isActive={liveSnapshot.sideToMove === topPlayerColor && liveSnapshot.status === 'active'}
            />
            <div className="px-1">
              <CapturedPieces
                captured={topPlayerColor === 'w' ? whiteCaptured : blackCaptured}
                color={topPlayerColor === 'w' ? 'b' : 'w'}
                advantage={topPlayerColor === 'w' ? whiteAdvantage : blackAdvantage}
              />
            </div>
          </div>

          {/* Central Row: Live Eval Bar + Board */}
          <div className="flex items-center gap-3 w-full max-w-[620px] justify-center">
            {/* Live Evaluation Bar */}
            <div className="h-[460px] sm:h-[520px] md:h-[570px]">
              <EvaluationBar
                scoreCentipawns={evalScore}
                isCheckmate={currentSnapshot.isCheckmate}
                orientation={orientation}
              />
            </div>

            {/* Chessboard */}
            <div className="flex-1 max-w-[570px]">
              <Chessboard
                snapshot={currentSnapshot}
                legalMoves={currentLegalMoves}
                orientation={orientation}
                theme={boardTheme}
                hintMove={showBestMoveHint ? bestMoveHint : null}
                interactive={
                  reviewPly === -1 &&
                  currentSnapshot.status === 'active' &&
                  (!isOnline ||
                    socketHook.playerColor === currentSnapshot.sideToMove ||
                    socketHook.playerColor === 'spectator') &&
                  (!isAIThinking)
                }
                onMove={handleMove}
              />
            </div>
          </div>

          {/* Bottom Player Info & Clock */}
          <div className="w-full max-w-[620px] flex flex-col gap-1">
            <div className="px-1">
              <CapturedPieces
                captured={bottomPlayerColor === 'w' ? whiteCaptured : blackCaptured}
                color={bottomPlayerColor === 'w' ? 'b' : 'w'}
                advantage={bottomPlayerColor === 'w' ? whiteAdvantage : blackAdvantage}
              />
            </div>
            <ClockDisplay
              color={bottomPlayerColor}
              playerName={
                isOnline
                  ? socketHook.roomState?.whitePlayer?.name || playerNameInput
                  : mode === 'computer'
                  ? 'You'
                  : 'Player 1 (White)'
              }
              clockState={liveSnapshot.clocks}
              isActive={liveSnapshot.sideToMove === bottomPlayerColor && liveSnapshot.status === 'active'}
            />
          </div>

          {/* Prominent Active Turn Status Banner */}
          <div className="w-full max-w-[620px]">
            {liveSnapshot.status === 'active' ? (
              <div
                className={`py-2 px-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isUserTurn
                    ? 'bg-[#739552]/15 border-[#739552]/40 text-[#82aa5a] shadow-[0_0_15px_rgba(115,149,82,0.15)]'
                    : 'bg-[#21201d] border-[#33302a] text-stone-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isUserTurn ? 'bg-[#739552] animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {isUserTurn
                      ? "It's your turn — Make a move!"
                      : mode === 'computer'
                      ? 'Computer is analyzing positions...'
                      : "Opponent's turn..."}
                  </span>
                </div>
                {liveSnapshot.isCheck && (
                  <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-600/40 uppercase tracking-widest text-[10px]">
                    Check!
                  </span>
                )}
              </div>
            ) : (
              <div className="py-2 px-4 rounded-xl bg-[#e5a93b]/15 border border-[#e5a93b]/40 text-[#e5a93b] font-bold text-xs flex items-center justify-between">
                <span>Game Over: {liveSnapshot.result}</span>
                <button
                  onClick={() => setShowGameOverModal(true)}
                  className="underline hover:text-white"
                >
                  View Details
                </button>
              </div>
            )}
          </div>

          {/* Historical Review Notification Bar */}
          {reviewPly !== -1 && (
            <div className="w-full max-w-[620px] bg-[#e5a93b]/15 border border-[#e5a93b]/40 rounded-xl p-2.5 flex items-center justify-between shadow-lg">
              <span className="text-xs text-[#e5a93b] font-bold">
                Reviewing move #{reviewPly === -2 ? 0 : reviewPly + 1}
              </span>
              <button
                onClick={() => setReviewPly(-1)}
                className="px-3 py-1 rounded-lg bg-[#e5a93b] text-slate-950 font-bold text-xs hover:bg-[#cf942b] transition-colors shadow"
              >
                Return to Live Game
              </button>
            </div>
          )}

          {/* Clean Action Bar */}
          <div className="w-full max-w-[620px] flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={flipBoard}
                className="px-3 py-1.5 rounded-xl bg-[#21201d] hover:bg-[#282622] border border-[#33302a] text-xs font-semibold text-stone-300 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={13} /> Flip
              </button>

              {/* Theme selector */}
              <div className="flex items-center bg-[#21201d] p-0.5 rounded-xl border border-[#33302a] text-xs">
                <button
                  onClick={() => setBoardTheme('green')}
                  title="Chess.com Green Theme"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    boardTheme === 'green'
                      ? 'bg-[#739552] text-white font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Green
                </button>
                <button
                  onClick={() => setBoardTheme('wood')}
                  title="Tournament Wood Theme"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    boardTheme === 'wood'
                      ? 'bg-[#b58863] text-white font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Wood
                </button>
                <button
                  onClick={() => setBoardTheme('dark')}
                  title="Modern Dark Theme"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    boardTheme === 'dark'
                      ? 'bg-stone-700 text-white font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Dark
                </button>
              </div>

              {!isOnline && (
                <button
                  onClick={() => setShowNewGameModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white text-xs font-bold transition-all shadow flex items-center gap-1.5"
                >
                  <Play size={12} fill="white" /> New Game
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {liveSnapshot.canClaimThreefold && (
                <button
                  onClick={() => handleClaimDraw('threefold')}
                  className="px-3 py-1.5 rounded-xl bg-[#e5a93b]/20 hover:bg-[#e5a93b]/30 border border-[#e5a93b]/40 text-[#e5a93b] text-xs font-bold"
                >
                  Claim Threefold
                </button>
              )}
              {liveSnapshot.canClaimFiftyMoves && (
                <button
                  onClick={() => handleClaimDraw('fifty_moves')}
                  className="px-3 py-1.5 rounded-xl bg-[#e5a93b]/20 hover:bg-[#e5a93b]/30 border border-[#e5a93b]/40 text-[#e5a93b] text-xs font-bold"
                >
                  Claim 50-Move
                </button>
              )}
              {liveSnapshot.status === 'active' && (
                <button
                  onClick={handleResign}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Flag size={13} /> Resign
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Opening Display & Move History Only (Clutter Free!) */}
        <div className="flex flex-col gap-4 w-full">
          {/* Opening Book Explorer Banner */}
          {openingInfo && (
            <div className="bg-[#21201d] border border-[#33302a] rounded-2xl p-3.5 shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#e5a93b]/20 border border-[#e5a93b]/40 flex items-center justify-center text-[#e5a93b]">
                <BookOpen size={16} />
              </div>
              <div className="flex flex-col">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Opening Book ({openingInfo.eco})
                </div>
                <div className="text-sm font-bold text-[#edebe8] leading-tight">
                  {openingInfo.name}
                </div>
              </div>
            </div>
          )}

          {/* Online Matchmaking / Room Panel (Only in Online Mode) */}
          {mode === 'online' && (
            <div className="bg-[#21201d] border border-[#33302a] rounded-2xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-200 text-xs uppercase tracking-wider">
                  Online Match
                </h3>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      socketHook.connected ? 'bg-[#739552]' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-xs text-stone-400">
                    {socketHook.connected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>

              {!socketHook.roomState ? (
                <div className="flex flex-col gap-3 pt-1">
                  <div>
                    <label className="text-xs text-stone-400">Your Name</label>
                    <input
                      type="text"
                      value={playerNameInput}
                      onChange={(e) => setPlayerNameInput(e.target.value)}
                      className="w-full mt-1 bg-[#161512] border border-[#33302a] rounded-xl px-3 py-1.5 text-sm text-[#edebe8] focus:outline-none focus:border-[#739552]"
                    />
                  </div>

                  <button
                    onClick={() =>
                      socketHook.createRoom(
                        { initialMs: 300000, incrementMs: 3000 },
                        playerNameInput
                      )
                    }
                    className="w-full bg-[#739552] hover:bg-[#648346] text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow"
                  >
                    Create Private Room
                  </button>

                  <div className="relative flex items-center justify-center my-1">
                    <div className="border-t border-[#33302a] w-full" />
                    <span className="bg-[#21201d] px-2 text-[10px] text-stone-500 uppercase tracking-widest">
                      or join
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Room Code"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#161512] border border-[#33302a] rounded-xl px-3 py-1.5 text-sm text-[#edebe8] focus:outline-none focus:border-[#739552] uppercase font-mono tracking-widest text-center"
                    />
                    <button
                      onClick={() => socketHook.joinRoom(joinCodeInput, playerNameInput)}
                      disabled={joinCodeInput.length < 4}
                      className="bg-stone-700 hover:bg-stone-600 disabled:opacity-30 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="bg-[#161512] border border-[#33302a] rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-stone-400 uppercase font-semibold">
                        Room Code
                      </div>
                      <div className="text-lg font-mono font-bold text-[#e5a93b]">
                        {socketHook.roomState.roomId}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(socketHook.roomState.roomId);
                        alert('Room code copied to clipboard!');
                      }}
                      className="p-2 rounded-lg bg-[#21201d] hover:bg-[#282622] text-stone-300"
                      title="Copy Code"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  {socketHook.pendingDrawOffer && (
                    <div className="p-3 bg-[#e5a93b]/10 border border-[#e5a93b]/40 rounded-xl flex flex-col gap-2">
                      <span className="text-xs text-[#e5a93b] font-semibold">
                        Opponent offered a draw. Accept?
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => socketHook.respondDraw(true)}
                          className="flex-1 bg-[#739552] text-white font-bold py-1 rounded-lg text-xs"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => socketHook.respondDraw(false)}
                          className="flex-1 bg-[#262421] text-stone-300 py-1 rounded-lg text-xs"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {socketHook.roomState.gameState.status === 'active' && (
                    <button
                      onClick={() => socketHook.offerDraw()}
                      className="w-full py-2 rounded-xl bg-[#262421] hover:bg-[#2c2a26] text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#33302a]"
                    >
                      <Handshake size={14} /> Offer Draw
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Move History Panel with Interactive Navigation */}
          <MoveHistory
            moves={liveSnapshot.moveHistory}
            snapshot={liveSnapshot}
            currentPlyIndex={reviewPly}
            onSelectPly={(plyIndex) => setReviewPly(plyIndex)}
          />
        </div>
      </main>

      {/* New Game Setup Modal */}
      <NewGameModal
        isOpen={showNewGameModal}
        initialColor={userColor}
        initialDifficulty={difficulty}
        onClose={() => setShowNewGameModal(false)}
        onStartGame={(color, diff, tc) => startNewLocalGame(color, diff, tc)}
      />

      {/* Victory / Defeat Game Over Modal */}
      <GameOverModal
        isOpen={showGameOverModal}
        result={liveSnapshot.result}
        endReason={liveSnapshot.endReason}
        userColor={userColor}
        onPlayAgain={() => {
          setShowGameOverModal(false);
          setShowNewGameModal(true);
        }}
        onReviewBoard={() => setShowGameOverModal(false)}
      />
    </div>
  );
};
