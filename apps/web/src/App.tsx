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

  // Active snapshot (either live or historical review)
  const currentSnapshot: GameSnapshot = useMemo(() => {
    if (reviewPly === -1) {
      return liveSnapshot;
    }

    if (reviewPly === -2) {
      // Start of game
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
          // White captured a black piece
          whiteCaps.push(m.captured);
          whiteScore += PIECE_VALUES[m.captured] ?? 0;
        } else {
          // Black captured a white piece
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

  // Reset or initialize local game
  const resetLocalGame = useCallback(
    (timeControl: TimeControl = { initialMs: 300000, incrementMs: 3000 }) => {
      cancelSearch();
      setReviewPly(-1);
      const newGame = new ChessGame(undefined, { timeControl });
      localGameRef.current = newGame;
      setLocalSnapshot(newGame.getSnapshot());
      setLegalMoves(newGame.getLegalMoves());
      setOrientation(userColor);
    },
    [cancelSearch, userColor]
  );

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  const flipBoard = () => {
    setOrientation((prev) => (prev === 'w' ? 'b' : 'w'));
  };

  // Local move execution
  const handleLocalMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    setReviewPly(-1); // jump to live
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
    if (reviewPly !== -1) return; // don't move while user reviews history

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
        setLocalSnapshot(localGameRef.current.getSnapshot());
        soundManager.playGameOver();
      }
    }
  };

  const handleClaimDraw = (type: 'threefold' | 'fifty_moves') => {
    if (isOnline) {
      socketHook.claimDraw(type);
    } else {
      localGameRef.current.claimDraw(type);
      setLocalSnapshot(localGameRef.current.getSnapshot());
      soundManager.playGameOver();
    }
  };

  const topPlayerColor: Color = orientation === 'w' ? 'b' : 'w';
  const bottomPlayerColor: Color = orientation === 'w' ? 'w' : 'b';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#739552]/30 border border-[#739552] flex items-center justify-center font-bold text-[#ebecd0] text-xl shadow-md">
            ♞
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-2">
              Grandmaster Arena
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#739552]/30 text-[#ebecd0] border border-[#739552]/50">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">Master-Grade Chess Platform</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-850 p-1 rounded-xl border border-slate-750 text-sm shadow-inner">
          <button
            onClick={() => {
              setMode('computer');
              resetLocalGame();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === 'computer'
                ? 'bg-[#739552] text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot size={15} />
            <span>Play Computer</span>
          </button>
          <button
            onClick={() => {
              setMode('online');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === 'online'
                ? 'bg-[#739552] text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={15} />
            <span>Play Online</span>
          </button>
          <button
            onClick={() => {
              setMode('local');
              resetLocalGame();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === 'local'
                ? 'bg-[#739552] text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={15} />
            <span>Pass & Play</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBestMoveHint((prev) => !prev)}
            title={showBestMoveHint ? 'Hide Best Move Hint' : 'Show Best Move Hint'}
            className={`p-2 rounded-lg border transition-all flex items-center gap-1 text-xs font-semibold ${
              showBestMoveHint
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
            }`}
          >
            <Lightbulb size={16} />
            <span className="hidden sm:inline">Hint</span>
          </button>
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6 items-start">
        {/* Left Column: Evaluation Bar + Board & Clocks */}
        <div className="flex flex-col items-center gap-2">
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
            {/* Captured Pieces by Top Player */}
            <div className="px-1">
              <CapturedPieces
                captured={topPlayerColor === 'w' ? whiteCaptured : blackCaptured}
                color={topPlayerColor === 'w' ? 'b' : 'w'}
                advantage={topPlayerColor === 'w' ? whiteAdvantage : blackAdvantage}
              />
            </div>
          </div>

          {/* Board Center Row (Eval Bar + Chessboard) */}
          <div className="flex items-center gap-2.5 w-full max-w-[620px] justify-center">
            {/* Live Evaluation Bar */}
            <div className="h-[480px] sm:h-[540px] md:h-[580px]">
              <EvaluationBar
                scoreCentipawns={evalScore}
                isCheckmate={currentSnapshot.isCheckmate}
                orientation={orientation}
              />
            </div>

            {/* Interactive Board */}
            <div className="flex-1 max-w-[580px]">
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

          {/* Historical Review Notification Bar */}
          {reviewPly !== -1 && (
            <div className="w-full max-w-[620px] bg-amber-500/15 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                <span>Reviewing historical move #{reviewPly === -2 ? 0 : reviewPly + 1}</span>
              </div>
              <button
                onClick={() => setReviewPly(-1)}
                className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow"
              >
                Return to Live Game
              </button>
            </div>
          )}

          {/* Board Action Bar */}
          <div className="w-full max-w-[620px] flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={flipBoard}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Flip
              </button>

              {/* Theme selector */}
              <div className="flex items-center bg-slate-850 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => setBoardTheme('green')}
                  title="Chess.com Green Theme"
                  className={`px-2 py-1 rounded transition-colors ${
                    boardTheme === 'green'
                      ? 'bg-[#739552] text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Green
                </button>
                <button
                  onClick={() => setBoardTheme('wood')}
                  title="Tournament Wood Theme"
                  className={`px-2 py-1 rounded transition-colors ${
                    boardTheme === 'wood'
                      ? 'bg-[#b58863] text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Wood
                </button>
                <button
                  onClick={() => setBoardTheme('dark')}
                  title="Modern Dark Theme"
                  className={`px-2 py-1 rounded transition-colors ${
                    boardTheme === 'dark'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dark
                </button>
              </div>

              {!isOnline && (
                <button
                  onClick={() => resetLocalGame()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  New Game
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {liveSnapshot.canClaimThreefold && (
                <button
                  onClick={() => handleClaimDraw('threefold')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-xs font-semibold"
                >
                  Claim Threefold Draw
                </button>
              )}
              {liveSnapshot.canClaimFiftyMoves && (
                <button
                  onClick={() => handleClaimDraw('fifty_moves')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-xs font-semibold"
                >
                  Claim 50-Move Draw
                </button>
              )}
              {liveSnapshot.status === 'active' && (
                <button
                  onClick={handleResign}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 text-xs font-medium flex items-center gap-1.5"
                >
                  <Flag size={13} /> Resign
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Opening Display, Mode Settings & Move History */}
        <div className="flex flex-col gap-4">
          {/* Opening Book Explorer Banner */}
          {openingInfo && (
            <div className="bg-slate-850 border border-slate-750 rounded-xl p-3 shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <BookOpen size={16} />
              </div>
              <div className="flex flex-col">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Opening Book ({openingInfo.eco})
                </div>
                <div className="text-sm font-bold text-slate-100 leading-snug">
                  {openingInfo.name}
                </div>
              </div>
            </div>
          )}

          {/* Offline Computer Config Panel */}
          {mode === 'computer' && (
            <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 shadow-lg flex flex-col gap-3">
              <h3 className="font-semibold text-slate-200 text-sm">Computer Opponent Setup</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-1.5 text-xs font-bold rounded-lg border capitalize transition-all ${
                        difficulty === d
                          ? 'bg-[#739552] border-[#739552] text-white shadow'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Play As</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setUserColor('w');
                      setOrientation('w');
                      resetLocalGame();
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      userColor === 'w'
                        ? 'bg-slate-100 text-slate-900 border-white font-bold shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    White
                  </button>
                  <button
                    onClick={() => {
                      setUserColor('b');
                      setOrientation('b');
                      resetLocalGame();
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      userColor === 'b'
                        ? 'bg-slate-950 text-slate-100 border-slate-500 font-bold shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Black
                  </button>
                </div>
              </div>

              {isAIThinking && (
                <div className="flex items-center gap-2 text-xs text-amber-400 animate-pulse pt-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Computer is analyzing positions...</span>
                </div>
              )}
            </div>
          )}

          {/* Online Matchmaking / Private Room Panel */}
          {mode === 'online' && (
            <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 text-sm">Online Match</h3>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      socketHook.connected ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-xs text-slate-400">
                    {socketHook.connected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>

              {!socketHook.roomState ? (
                <div className="flex flex-col gap-3 pt-1">
                  <div>
                    <label className="text-xs text-slate-400">Your Name</label>
                    <input
                      type="text"
                      value={playerNameInput}
                      onChange={(e) => setPlayerNameInput(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-[#739552]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        socketHook.createRoom(
                          { initialMs: 300000, incrementMs: 3000 },
                          playerNameInput
                        )
                      }
                      className="flex-1 bg-[#739552] hover:bg-[#648346] text-white font-bold py-2 rounded-lg text-xs transition-colors shadow"
                    >
                      Create Private Room
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center my-1">
                    <div className="border-t border-slate-800 w-full" />
                    <span className="bg-slate-850 px-2 text-[11px] text-slate-500 uppercase">
                      or join
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 6-char Room Code"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-[#739552] uppercase font-mono tracking-widest text-center"
                    />
                    <button
                      onClick={() => socketHook.joinRoom(joinCodeInput, playerNameInput)}
                      disabled={joinCodeInput.length < 4}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-100 font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Room Code
                      </div>
                      <div className="text-lg font-mono font-bold text-amber-400">
                        {socketHook.roomState.roomId}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(socketHook.roomState.roomId);
                        alert('Room code copied to clipboard!');
                      }}
                      className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Copy Code"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  {socketHook.pendingDrawOffer && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-lg flex flex-col gap-2">
                      <span className="text-xs text-amber-300 font-semibold">
                        Opponent offered a draw. Accept?
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => socketHook.respondDraw(true)}
                          className="flex-1 bg-[#739552] text-white font-bold py-1 rounded text-xs"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => socketHook.respondDraw(false)}
                          className="flex-1 bg-slate-800 text-slate-300 py-1 rounded text-xs"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {socketHook.roomState.gameState.status === 'active' && (
                    <button
                      onClick={() => socketHook.offerDraw()}
                      className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700"
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
    </div>
  );
};
