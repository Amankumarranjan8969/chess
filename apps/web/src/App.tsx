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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Single-use, one-time hint state (only shown for the human player's turn, vanishes after 1 move)
  const [singleUseHint, setSingleUseHint] = useState<{ from: Square; to: Square } | null>(null);

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

  // Live Position Evaluation
  useEffect(() => {
    try {
      const result = evalEngineRef.current.findBestMove(currentSnapshot.fen, { depth: 2 });
      setEvalScore(result.evaluation);
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
      setSingleUseHint(null);
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

  // Whose turn is it relative to human player
  const isUserTurn =
    liveSnapshot.status === 'active' &&
    (isOnline
      ? socketHook.playerColor === liveSnapshot.sideToMove
      : liveSnapshot.sideToMove === userColor);

  // Request a single, one-time hint for the human player's turn only
  const handleRequestOneTimeHint = () => {
    if (!isUserTurn) {
      alert("Hints are only available on your turn!");
      return;
    }

    try {
      const result = evalEngineRef.current.findBestMove(currentSnapshot.fen, { depth: 3 });
      if (result.bestMove) {
        setSingleUseHint({
          from: result.bestMove.from as Square,
          to: result.bestMove.to as Square,
        });
      }
    } catch {
      // Ignored
    }
  };

  // Local move execution
  const handleLocalMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    setReviewPly(-1);
    setSingleUseHint(null); // Consumes and removes one-time hint immediately
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
    setSingleUseHint(null);
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

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-stone-900 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#739552]/15 border border-[#739552]/30 flex items-center justify-center font-bold text-[#5f7d41] text-xl shadow-sm">
            ♞
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-tight tracking-tight text-stone-900 flex items-center gap-2">
              Grandmaster Arena
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">Tournament Chess Platform</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs shadow-inner">
          <button
            onClick={() => {
              setMode('computer');
              setShowNewGameModal(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'computer'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Bot size={14} className="text-[#739552]" />
            <span>vs Computer</span>
          </button>
          <button
            onClick={() => {
              setMode('online');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'online'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Globe size={14} className="text-[#739552]" />
            <span>Play Online</span>
          </button>
          <button
            onClick={() => {
              setMode('local');
              startNewLocalGame('w', 'medium');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              mode === 'local'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Users size={14} className="text-[#739552]" />
            <span>Pass & Play</span>
          </button>
        </div>

        {/* Action Controls & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* One-time hint button (only enabled on user's turn) */}
          <button
            onClick={handleRequestOneTimeHint}
            disabled={!isUserTurn}
            title={isUserTurn ? "Show best move hint (one-time)" : "Hints only available on your turn"}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm ${
              singleUseHint
                ? 'bg-[#739552] text-white border-[#739552]'
                : isUserTurn
                ? 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Lightbulb size={14} className={isUserTurn ? "text-amber-500" : "text-stone-400"} />
            <span>Hint</span>
          </button>

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 transition-colors shadow-sm"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 transition-colors shadow-sm"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Full-View Game Studio */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col lg:flex-row gap-6 items-stretch justify-center">
        {/* Left Section: Live Eval Bar + Chessboard */}
        <div className="flex items-center justify-center gap-3">
          {/* Evaluation Bar */}
          <div className="h-[460px] sm:h-[540px] md:h-[600px] flex items-center">
            <EvaluationBar
              scoreCentipawns={evalScore}
              isCheckmate={currentSnapshot.isCheckmate}
              orientation={orientation}
            />
          </div>

          {/* Chessboard */}
          <div className="w-full max-w-[600px] flex items-center justify-center">
            <Chessboard
              snapshot={currentSnapshot}
              legalMoves={currentLegalMoves}
              orientation={orientation}
              theme={boardTheme}
              hintMove={singleUseHint}
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

        {/* Right Section: Timers Perfectly Aligned Top & Bottom + Move Box */}
        <div className="flex-1 max-w-[440px] flex flex-col justify-between gap-3 h-auto min-h-[460px] sm:min-h-[540px] md:min-h-[600px]">
          {/* 1. TOP TIMER: Opponent Clock (Aligned with top of board) */}
          <div className="w-full flex flex-col gap-1">
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

          {/* 2. MIDDLE AREA: Turn Status, Opening Book, Moves Table & Game Controls */}
          <div className="flex-1 flex flex-col gap-2.5 my-1">
            {/* Live Turn Status Banner */}
            {liveSnapshot.status === 'active' ? (
              <div
                className={`py-2 px-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
                  isUserTurn
                    ? 'bg-[#f0fdf4] border-[#86efac] text-[#15803d]'
                    : 'bg-white border-stone-200 text-stone-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isUserTurn ? 'bg-[#22c55e] animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {isUserTurn
                      ? "It's your turn — Make a move!"
                      : mode === 'computer'
                      ? 'Computer is thinking...'
                      : "Opponent's turn..."}
                  </span>
                </div>
                {liveSnapshot.isCheck && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold uppercase tracking-wider text-[10px] border border-rose-200">
                    Check!
                  </span>
                )}
              </div>
            ) : (
              <div className="py-2 px-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-between shadow-sm">
                <span>Result: {liveSnapshot.result}</span>
                <button
                  onClick={() => setShowGameOverModal(true)}
                  className="underline hover:text-black font-semibold"
                >
                  View Details
                </button>
              </div>
            )}

            {/* Opening Book Banner */}
            {openingInfo && (
              <div className="bg-white border border-stone-200 rounded-xl px-3 py-2 shadow-sm flex items-center gap-2.5">
                <BookOpen size={15} className="text-[#739552] shrink-0" />
                <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    {openingInfo.eco}
                  </span>
                  <span className="text-xs font-bold text-stone-800 truncate">
                    {openingInfo.name}
                  </span>
                </div>
              </div>
            )}

            {/* Online Match Panel if in Online Mode */}
            {mode === 'online' && !socketHook.roomState && (
              <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm flex flex-col gap-2.5">
                <div>
                  <label className="text-xs text-stone-500 font-semibold">Your Name</label>
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    className="w-full mt-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-[#739552]"
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
                    className="flex-1 bg-[#739552] hover:bg-[#648346] text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm"
                  >
                    Create Room
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Room Code"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-900 uppercase font-mono tracking-wider text-center"
                  />
                  <button
                    onClick={() => socketHook.joinRoom(joinCodeInput, playerNameInput)}
                    disabled={joinCodeInput.length < 4}
                    className="bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-white font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    Join
                  </button>
                </div>
              </div>
            )}

            {/* Move History Table */}
            <div className="flex-1 min-h-[160px] flex flex-col">
              <MoveHistory
                moves={liveSnapshot.moveHistory}
                snapshot={liveSnapshot}
                currentPlyIndex={reviewPly}
                onSelectPly={(plyIndex) => setReviewPly(plyIndex)}
              />
            </div>

            {/* Historical Review Banner */}
            {reviewPly !== -1 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-center justify-between shadow-sm">
                <span className="text-xs text-amber-800 font-bold">
                  Move #{reviewPly === -2 ? 0 : reviewPly + 1}
                </span>
                <button
                  onClick={() => setReviewPly(-1)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 shadow-sm"
                >
                  Live
                </button>
              </div>
            )}

            {/* In-Game Action Bar */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={flipBoard}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 transition-colors flex items-center gap-1 shadow-sm"
                >
                  <RotateCcw size={12} /> Flip
                </button>

                <div className="flex items-center bg-white p-0.5 rounded-xl border border-stone-200 text-xs shadow-sm">
                  <button
                    onClick={() => setBoardTheme('green')}
                    className={`px-2 py-1 rounded-lg transition-colors font-bold ${
                      boardTheme === 'green' ? 'bg-[#739552] text-white' : 'text-stone-500'
                    }`}
                  >
                    Green
                  </button>
                  <button
                    onClick={() => setBoardTheme('wood')}
                    className={`px-2 py-1 rounded-lg transition-colors font-bold ${
                      boardTheme === 'wood' ? 'bg-[#b58863] text-white' : 'text-stone-500'
                    }`}
                  >
                    Wood
                  </button>
                </div>

                {!isOnline && (
                  <button
                    onClick={() => setShowNewGameModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <Play size={12} fill="white" /> New
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {liveSnapshot.canClaimThreefold && (
                  <button
                    onClick={() => handleClaimDraw('threefold')}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-sm"
                  >
                    3-Fold
                  </button>
                )}
                {liveSnapshot.status === 'active' && (
                  <button
                    onClick={handleResign}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <Flag size={12} /> Resign
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. BOTTOM TIMER: Human Player Clock (Aligned with bottom of board) */}
          <div className="w-full flex flex-col gap-1">
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
