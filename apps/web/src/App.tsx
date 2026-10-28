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
import { OnlineLobbyModal } from './components/OnlineLobbyModal.js';
import { useChessAI, AIDifficulty } from './hooks/useChessAI.js';
import { useChessSocket } from './hooks/useChessSocket.js';
import { soundManager } from './audio/soundManager.js';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Flag,
  Bot,
  Users,
  Globe,
  Share2,
  Lightbulb,
  BookOpen,
  Maximize2,
  Minimize2,
  Play,
  Wifi,
  Flame,
  Check,
} from 'lucide-react';

type GameMode = 'computer' | 'local' | 'online';

export const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('computer');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('grandmaster');
  const [userColor, setUserColor] = useState<Color>('w');
  const [orientation, setOrientation] = useState<Color>('w');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('green');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Single-use, player-only hint (only available on player's turn, vanishes after 1 move)
  const [singleUseHint, setSingleUseHint] = useState<{ from: Square; to: Square } | null>(null);

  // Modals
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [showOnlineLobbyModal, setShowOnlineLobbyModal] = useState<boolean>(false);

  // Online credentials
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

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

  // URL query parameter auto-detection (e.g. ?room=XYZ123)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setMode('online');
      setJoinCodeInput(roomParam.toUpperCase());
      setShowOnlineLobbyModal(true);
    }
  }, []);

  // When playing online, orient board to player's assigned color
  useEffect(() => {
    if (isOnline && socketHook.playerColor) {
      if (socketHook.playerColor === 'b') {
        setOrientation('b');
        setUserColor('b');
      } else if (socketHook.playerColor === 'w') {
        setOrientation('w');
        setUserColor('w');
      }
    }
  }, [isOnline, socketHook.playerColor]);

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
      const result = evalEngineRef.current.findBestMove(currentSnapshot.fen, { depth: 2, quiescenceDepth: 2 });
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
      const result = evalEngineRef.current.findBestMove(currentSnapshot.fen, { depth: 3, quiescenceDepth: 3 });
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
    setSingleUseHint(null);
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

  // Copy shareable Wi-Fi link for current online room
  const handleCopyShareLink = async () => {
    if (!socketHook.roomState?.roomId) return;
    let hostDomain = window.location.hostname;
    try {
      const serverBase = `${window.location.protocol}//${window.location.hostname}:4000`;
      const res = await fetch(`${serverBase}/api/network-info`);
      if (res.ok) {
        const data = await res.json();
        if (data.lanIp && (hostDomain === 'localhost' || hostDomain === '127.0.0.1')) {
          hostDomain = data.lanIp;
        }
      }
    } catch {}
    const port = window.location.port ? `:${window.location.port}` : '';
    const url = `http://${hostDomain}${port}/?room=${socketHook.roomState.roomId}`;
    await navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const topPlayerColor: Color = orientation === 'w' ? 'b' : 'w';
  const bottomPlayerColor: Color = orientation === 'w' ? 'w' : 'b';

  const computerDifficultyLabel =
    difficulty === 'grandmaster'
      ? 'Super Hard (2400+)'
      : difficulty === 'hard'
      ? 'Hard (1950)'
      : difficulty === 'medium'
      ? 'Medium (1500)'
      : 'Easy (1000)';

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-stone-900 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur px-4 sm:px-6 py-2 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#739552]/15 border border-[#739552]/30 flex items-center justify-center font-bold text-[#5f7d41] text-lg shadow-sm">
            ♞
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-stone-900 flex items-center gap-2">
              Grandmaster Arena
            </h1>
            <p className="text-[10px] text-stone-500 font-medium">Tournament Chess Platform</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs shadow-inner">
          <button
            onClick={() => {
              setMode('computer');
              setShowNewGameModal(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
              mode === 'computer'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Bot size={13} className="text-[#739552]" />
            <span>vs Computer</span>
          </button>
          <button
            onClick={() => {
              setMode('online');
              setShowOnlineLobbyModal(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
              mode === 'online'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Wifi size={13} className="text-[#739552]" />
            <span>Wi-Fi / Online</span>
          </button>
          <button
            onClick={() => {
              setMode('local');
              startNewLocalGame('w', 'medium');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
              mode === 'local'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Users size={13} className="text-[#739552]" />
            <span>Pass & Play</span>
          </button>
        </div>

        {/* Controls & Share Button */}
        <div className="flex items-center gap-2">
          {/* Active Wi-Fi Room Share Button */}
          {isOnline && socketHook.roomState?.roomId && (
            <button
              onClick={handleCopyShareLink}
              title="Copy shareable Wi-Fi link for friends"
              className="px-2.5 py-1.5 rounded-xl bg-[#739552]/10 hover:bg-[#739552]/20 border border-[#739552]/30 text-[#4c6633] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              {copiedShareLink ? <Check size={13} /> : <Share2 size={13} />}
              <span>{copiedShareLink ? 'Link Copied!' : `Wi-Fi Room: ${socketHook.roomState.roomId}`}</span>
            </button>
          )}

          {/* One-time hint button (only active on user's turn) */}
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
            <Lightbulb size={13} className={isUserTurn ? "text-amber-500" : "text-stone-400"} />
            <span>Hint</span>
          </button>

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 transition-colors shadow-sm"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 transition-colors shadow-sm"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* Main Full-View Game Studio: Dead Center Chessboard via Symmetrical 3-Column Grid */}
      <main className="flex-1 w-full max-w-[1750px] mx-auto p-2 sm:p-4 flex flex-col justify-center">
        <div className="w-full grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6">
          {/* Column 1 (Left): Symmetrical Balancer ensuring the Center Column is DEAD CENTER */}
          <div className="hidden xl:flex justify-end items-center pr-2">
            <div className="w-[350px] flex flex-col gap-3">
              {/* Local Wi-Fi Active Room Banner */}
              {isOnline && socketHook.roomState?.roomId ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                      <Wifi size={14} className="text-[#739552]" /> Local Wi-Fi Match
                    </span>
                    <span className="font-mono font-bold px-2 py-0.5 bg-[#739552]/10 border border-[#739552]/20 text-[#5f7d41] rounded-md text-xs">
                      {socketHook.roomState.roomId}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Share this link with a friend on your Wi-Fi network to play across devices in real time:
                  </p>
                  <button
                    onClick={handleCopyShareLink}
                    className="w-full py-2.5 px-3 bg-[#739552] hover:bg-[#648346] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {copiedShareLink ? <Check size={14} /> : <Share2 size={14} />}
                    <span>{copiedShareLink ? 'Link Copied to Clipboard!' : 'Copy Wi-Fi Invite Link'}</span>
                  </button>
                </div>
              ) : mode === 'computer' ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                      <Bot size={14} className="text-[#739552]" /> Engine Opponent
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                        difficulty === 'grandmaster'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {difficulty === 'grandmaster' && <Flame size={11} className="text-amber-600" />}
                      {difficulty}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span>Rating Level:</span>
                      <strong className="text-stone-800 font-bold">{computerDifficultyLabel}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Search Depth:</span>
                      <strong className="text-stone-800 font-bold">
                        {difficulty === 'grandmaster' ? '4 Plies + Quiescence' : difficulty === 'hard' ? '3 Plies + Quiescence' : '2 Plies'}
                      </strong>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewGameModal(true)}
                    className="mt-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all"
                  >
                    Change Engine Difficulty
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Column 2 (Center): EXPANDED CHESSBOARD + EVALUATION BAR (DEAD CENTER AT ALL ZOOM LEVELS) */}
          <div className="flex items-center justify-center gap-3 justify-self-center shrink-0">
            {/* Evaluation Bar */}
            <div className="h-[min(670px,calc(100vh-140px))] flex items-center">
              <EvaluationBar
                scoreCentipawns={evalScore}
                isCheckmate={currentSnapshot.isCheckmate}
                orientation={orientation}
              />
            </div>

            {/* Chessboard (Expanded to 670px to eliminate excessive white space) */}
            <div className="w-[min(670px,calc(100vh-140px))] h-[min(670px,calc(100vh-140px))] aspect-square flex items-center justify-center">
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

          {/* Column 3 (Right): Symmetrical Aligned Right-Side Panel (Top & Bottom Timers, Locked Height) */}
          <div className="w-full xl:w-[350px] max-w-[350px] mx-auto xl:mx-0 flex flex-col justify-between h-[min(670px,calc(100vh-140px))] max-h-[min(670px,calc(100vh-140px))] overflow-hidden justify-self-center xl:justify-self-start shrink-0">
            {/* 1. TOP TIMER: Opponent Clock (Aligned with top of board) */}
            <div className="shrink-0 flex flex-col gap-1">
              <ClockDisplay
                color={topPlayerColor}
                playerName={
                  isOnline
                    ? socketHook.roomState?.blackPlayer?.name || 'Waiting for Wi-Fi opponent...'
                    : mode === 'computer'
                    ? `Computer (${computerDifficultyLabel})`
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

            {/* 2. MIDDLE AREA: Turn Status, Opening Book, Locked Move History, and Controls */}
            <div className="flex-1 flex flex-col gap-2 my-auto overflow-hidden justify-center">
              {/* Draw Offer Notification */}
              {isOnline && socketHook.pendingDrawOffer && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between shadow-sm shrink-0">
                  <div className="text-xs font-bold text-amber-900">Opponent offered a draw</div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => socketHook.respondDraw(true)}
                      className="px-2.5 py-1 bg-[#739552] text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => socketHook.respondDraw(false)}
                      className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Live Turn Status Banner */}
              {liveSnapshot.status === 'active' ? (
                <div
                  className={`py-1.5 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm shrink-0 ${
                    isUserTurn
                      ? 'bg-[#f0fdf4] border-[#86efac] text-[#15803d]'
                      : 'bg-white border-stone-200 text-stone-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isUserTurn ? 'bg-[#22c55e] animate-ping' : 'bg-amber-400'
                      }`}
                    />
                    <span className="truncate">
                      {isUserTurn
                        ? "Your turn — Make a move!"
                        : mode === 'computer'
                        ? 'Computer is calculating...'
                        : "Opponent's turn..."}
                    </span>
                  </div>
                  {liveSnapshot.isCheck && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-extrabold uppercase tracking-wider text-[9px] border border-rose-200 shrink-0">
                      Check!
                    </span>
                  )}
                </div>
              ) : (
                <div className="py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-between shadow-sm shrink-0">
                  <span>Result: {liveSnapshot.result}</span>
                  <button
                    onClick={() => setShowGameOverModal(true)}
                    className="underline hover:text-black font-semibold text-[11px]"
                  >
                    Details
                  </button>
                </div>
              )}

              {/* Opening Book Banner */}
              {openingInfo && (
                <div className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 shadow-sm flex items-center gap-2 shrink-0">
                  <BookOpen size={13} className="text-[#739552] shrink-0" />
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

              {/* Locked-Height Move Register (Internal Scrolling Only) */}
              <div className="shrink-0">
                <MoveHistory
                  moves={liveSnapshot.moveHistory}
                  snapshot={liveSnapshot}
                  currentPlyIndex={reviewPly}
                  onSelectPly={(plyIndex) => setReviewPly(plyIndex)}
                  className="h-[210px] max-h-[210px]"
                />
              </div>

              {/* In-Game Action Bar */}
              <div className="flex items-center justify-between gap-1 shrink-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={flipBoard}
                    className="px-2 py-1 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <RotateCcw size={12} /> Flip
                  </button>

                  <div className="flex items-center bg-white p-0.5 rounded-xl border border-stone-200 text-xs shadow-sm">
                    <button
                      onClick={() => setBoardTheme('green')}
                      className={`px-2 py-0.5 rounded-lg transition-colors font-bold ${
                        boardTheme === 'green' ? 'bg-[#739552] text-white' : 'text-stone-500'
                      }`}
                    >
                      Green
                    </button>
                    <button
                      onClick={() => setBoardTheme('wood')}
                      className={`px-2 py-0.5 rounded-lg transition-colors font-bold ${
                        boardTheme === 'wood' ? 'bg-[#b58863] text-white' : 'text-stone-500'
                      }`}
                    >
                      Wood
                    </button>
                  </div>

                  {!isOnline && (
                    <button
                      onClick={() => setShowNewGameModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-[#739552] hover:bg-[#648346] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    >
                      <Play size={11} fill="white" /> New
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {liveSnapshot.canClaimThreefold && (
                    <button
                      onClick={() => handleClaimDraw('threefold')}
                      className="px-2 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-sm"
                    >
                      3-Fold
                    </button>
                  )}
                  {liveSnapshot.status === 'active' && (
                    <button
                      onClick={handleResign}
                      className="px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <Flag size={12} /> Resign
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. BOTTOM TIMER: Human Player Clock (Aligned with bottom of board) */}
            <div className="shrink-0 flex flex-col gap-1">
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
                    ? socketHook.roomState?.whitePlayer?.name || 'You (White)'
                    : mode === 'computer'
                    ? 'You'
                    : 'Player 1 (White)'
                }
                clockState={liveSnapshot.clocks}
                isActive={liveSnapshot.sideToMove === bottomPlayerColor && liveSnapshot.status === 'active'}
              />
            </div>
          </div>
        </div>
      </main>

      {/* New Game Setup Modal (vs Computer) */}
      <NewGameModal
        isOpen={showNewGameModal}
        initialColor={userColor}
        initialDifficulty={difficulty}
        onClose={() => setShowNewGameModal(false)}
        onStartGame={(color, diff, tc) => startNewLocalGame(color, diff, tc)}
      />

      {/* Local Wi-Fi & Online Lobby Modal */}
      <OnlineLobbyModal
        isOpen={showOnlineLobbyModal}
        onClose={() => setShowOnlineLobbyModal(false)}
        onCreateRoom={(tc, name, color) => socketHook.createRoom(tc, name, color)}
        onJoinRoom={(roomId, name) => socketHook.joinRoom(roomId, name)}
        initialRoomCode={joinCodeInput}
        isJoined={Boolean(socketHook.roomState?.blackPlayer && socketHook.roomState?.whitePlayer)}
        currentRoomId={socketHook.roomState?.roomId}
      />

      {/* Victory / Defeat Game Over Modal */}
      <GameOverModal
        isOpen={showGameOverModal}
        result={liveSnapshot.result}
        endReason={liveSnapshot.endReason}
        userColor={userColor}
        onPlayAgain={() => {
          setShowGameOverModal(false);
          if (isOnline) {
            setShowOnlineLobbyModal(true);
          } else {
            setShowNewGameModal(true);
          }
        }}
        onReviewBoard={() => setShowGameOverModal(false)}
      />
    </div>
  );
};
