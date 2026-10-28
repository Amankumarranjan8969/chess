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
import { PlatformProvider, usePlatform } from './context/PlatformContext.js';
import { Navigation } from './components/Navigation.js';
import { HomeDashboard } from './components/HomeDashboard.js';
import { GameReviewStudio } from './components/GameReviewStudio.js';
import { PuzzlesStudio } from './components/PuzzlesStudio.js';
import { LearnStudio } from './components/LearnStudio.js';
import { WatchStudio } from './components/WatchStudio.js';
import { MoreStudio } from './components/MoreStudio.js';
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
import { StoredGame } from './types/platform.js';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Flag,
  Bot,
  Users,
  Share2,
  Lightbulb,
  BookOpen,
  Maximize2,
  Minimize2,
  Play,
  Wifi,
  Flame,
  Check,
  Eye,
} from 'lucide-react';

type GameMode = 'computer' | 'local' | 'online';

const MainAppContent: React.FC = () => {
  const {
    activeSection,
    navigateTo,
    startReviewGame,
    recordFinishedGame,
    preferences,
    user,
  } = usePlatform();

  // Play Studio State
  const [mode, setMode] = useState<GameMode>('computer');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('grandmaster');
  const [userColor, setUserColor] = useState<Color>('w');
  const [orientation, setOrientation] = useState<Color>('w');
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
  const [lastFinishedGameId, setLastFinishedGameId] = useState<string | null>(null);

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
      navigateTo('play');
      setShowOnlineLobbyModal(true);
    }
  }, [navigateTo]);

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

      if (snap.status === 'finished') {
        setLocalSnapshot(snap);
        handleGameFinished(snap);
      } else {
        setLocalSnapshot((prev) => ({
          ...prev,
          clocks: snap.clocks,
        }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOnline, localSnapshot.status]);

  // When game finishes online, record and trigger game over modal
  useEffect(() => {
    if (isOnline && socketHook.roomState?.gameState.status === 'finished') {
      handleGameFinished(socketHook.roomState.gameState);
    }
  }, [isOnline, socketHook.roomState?.gameState.status]);

  // Save game record into unified store when finished
  const handleGameFinished = useCallback(
    (snap: GameSnapshot) => {
      soundManager.playGameOver();
      setShowGameOverModal(true);

      const gameId = `game-${Date.now()}`;
      setLastFinishedGameId(gameId);

      const moves = snap.moveHistory;
      let pgn = '';
      for (let i = 0; i < moves.length; i += 2) {
        pgn += `${Math.floor(i / 2) + 1}. ${moves[i].san} ${moves[i + 1]?.san ?? ''} `;
      }
      if (snap.result) pgn += snap.result;

      const opening = detectOpening(moves.map((m) => m.san));

      const isWhiteWin = snap.result === '1-0';
      const isBlackWin = snap.result === '0-1';
      const userWon = (isWhiteWin && userColor === 'w') || (isBlackWin && userColor === 'b');
      const isDraw = snap.result === '1/2-1/2';
      const delta = userWon ? 12 : isDraw ? 1 : -10;

      const stored: StoredGame = {
        id: gameId,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        timeControl: '5+3',
        timeControlCategory: mode === 'computer' ? 'computer' : 'rapid',
        white: {
          name: isOnline
            ? socketHook.roomState?.whitePlayer?.name || 'Player 1'
            : userColor === 'w'
            ? user.username
            : `Computer (${difficulty.toUpperCase()})`,
          rating: userColor === 'w' ? user.ratings.rapid.rating : 1500,
        },
        black: {
          name: isOnline
            ? socketHook.roomState?.blackPlayer?.name || 'Player 2'
            : userColor === 'b'
            ? user.username
            : `Computer (${difficulty.toUpperCase()})`,
          rating: userColor === 'b' ? user.ratings.rapid.rating : 1500,
        },
        userColor,
        result: snap.result as any,
        endReason: snap.endReason || 'concluded',
        ratingChange: delta,
        initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: pgn.trim(),
        moveHistory: snap.moveHistory,
        opening: opening ? { eco: opening.eco, name: opening.name } : undefined,
        durationSeconds: 320,
      };

      recordFinishedGame(stored);
    },
    [isOnline, socketHook.roomState, userColor, user, mode, difficulty, recordFinishedGame]
  );

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
      handleGameFinished(snap);
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
    if (activeSection !== 'play') return;
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
  }, [activeSection, mode, localSnapshot, userColor, difficulty, isAIThinking, getAIMove, reviewPly]);

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
        handleGameFinished(snap);
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
      handleGameFinished(snap);
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

  const isDark = preferences.themeMode === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none transition-colors ${
        isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#f7f7f6] text-stone-900'
      }`}
    >
      {/* Persistent Navigation Across All Sections */}
      <Navigation />

      {/* Main Content Area Routed by Active Section */}
      <main className="flex-1 flex flex-col pb-16 md:pb-6">
        {activeSection === 'home' && (
          <HomeDashboard
            onStartComputerGame={(tc, color, diff) => {
              setMode('computer');
              navigateTo('play');
              const timeControlMap: Record<string, { initialMs: number; incrementMs: number }> = {
                '1+0': { initialMs: 60000, incrementMs: 0 },
                '3+2': { initialMs: 180000, incrementMs: 2000 },
                '5+0': { initialMs: 300000, incrementMs: 0 },
                '5+3': { initialMs: 300000, incrementMs: 3000 },
                '10+0': { initialMs: 600000, incrementMs: 0 },
                '15+10': { initialMs: 900000, incrementMs: 10000 },
              };
              const config = timeControlMap[tc] || { initialMs: 600000, incrementMs: 0 };
              startNewLocalGame(color, diff || 'grandmaster', config);
            }}
            onOpenWifiModal={() => {
              setMode('online');
              navigateTo('play');
              setShowOnlineLobbyModal(true);
            }}
          />
        )}

        {activeSection === 'review' && <GameReviewStudio />}

        {activeSection === 'puzzles' && <PuzzlesStudio />}

        {activeSection === 'learn' && <LearnStudio />}

        {activeSection === 'watch' && <WatchStudio />}

        {activeSection === 'more' && <MoreStudio />}

        {activeSection === 'play' && (
          <div className="flex-1 w-full max-w-[1750px] mx-auto p-2 sm:p-4 flex flex-col justify-center">
            {/* Play Sub-Bar Controls */}
            <div className="flex items-center justify-between mb-2 px-2 flex-wrap gap-2">
              <div className="flex items-center bg-white dark:bg-stone-800 p-1 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 shadow-xs">
                <button
                  onClick={() => {
                    setMode('computer');
                    setShowNewGameModal(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    mode === 'computer'
                      ? 'bg-[#739552] text-white shadow-sm'
                      : 'text-stone-700 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
                >
                  <Bot size={13} className={mode === 'computer' ? 'text-white' : 'text-[#739552]'} />
                  <span>vs Computer</span>
                </button>
                <button
                  onClick={() => {
                    setMode('online');
                    setShowOnlineLobbyModal(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    mode === 'online'
                      ? 'bg-[#739552] text-white shadow-sm'
                      : 'text-stone-700 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
                >
                  <Wifi size={13} className={mode === 'online' ? 'text-white' : 'text-[#739552]'} />
                  <span>Wi-Fi / Online</span>
                </button>
                <button
                  onClick={() => {
                    setMode('local');
                    startNewLocalGame('w', 'medium');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    mode === 'local'
                      ? 'bg-[#739552] text-white shadow-sm'
                      : 'text-stone-700 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700'
                  }`}
                >
                  <Users size={13} className={mode === 'local' ? 'text-white' : 'text-[#739552]'} />
                  <span>Pass & Play</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isOnline && socketHook.roomState?.roomId && (
                  <button
                    onClick={handleCopyShareLink}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-[#739552]/30 text-[#4c6633] dark:text-[#8bc75a] font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    {copiedShareLink ? <Check size={13} /> : <Share2 size={13} />}
                    <span>{copiedShareLink ? 'Link Copied!' : `Wi-Fi Room: ${socketHook.roomState.roomId}`}</span>
                  </button>
                )}

                <button
                  onClick={handleRequestOneTimeHint}
                  disabled={!isUserTurn}
                  className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs ${
                    singleUseHint
                      ? 'bg-[#739552] text-white border-[#739552]'
                      : isUserTurn
                      ? 'bg-white dark:bg-stone-800 hover:bg-stone-50 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Lightbulb size={13} className={isUserTurn ? 'text-amber-500' : 'text-stone-400'} />
                  <span>Hint</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 transition-colors shadow-xs"
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
              </div>
            </div>

            {/* Centered Tournament Chess Stage & Integrated Game Panel */}
            <div className="w-full max-w-[1240px] mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6 py-1">
              {/* STAGE 1: Chessboard with Direct Opponent & Player Attached Bars */}
              <div className="w-full max-w-[min(640px,calc(100vh-175px))] flex flex-col gap-2 shrink-0">
                {/* Opponent Bar (Directly Above Board) */}
                <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center text-lg font-bold border border-stone-200 dark:border-stone-700 shadow-xs">
                        {mode === 'computer' ? '🤖' : isOnline ? '👤' : '♟️'}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-stone-900 ${
                          topPlayerColor === 'w' ? 'bg-white' : 'bg-stone-900'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate max-w-[130px]">
                          {isOnline
                            ? socketHook.roomState?.blackPlayer?.name || 'Wi-Fi Opponent'
                            : mode === 'computer'
                            ? `Computer`
                            : 'Player 2'}
                        </span>
                        {mode === 'computer' && (
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                              difficulty === 'grandmaster'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : difficulty === 'hard'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                            }`}
                          >
                            {difficulty === 'grandmaster' ? 'Expert 2400+' : difficulty === 'hard' ? 'Hard 1950' : 'Medium 1500'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CapturedPieces
                          captured={topPlayerColor === 'w' ? whiteCaptured : blackCaptured}
                          color={topPlayerColor === 'w' ? 'b' : 'w'}
                          advantage={topPlayerColor === 'w' ? whiteAdvantage : blackAdvantage}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Opponent Clock (Directly Top-Right) */}
                  <ClockDisplay
                    minimal={true}
                    color={topPlayerColor}
                    clockState={liveSnapshot.clocks}
                    isActive={liveSnapshot.sideToMove === topPlayerColor && liveSnapshot.status === 'active'}
                  />
                </div>

                {/* Center Chessboard Stage with Vertical Evaluation Bar */}
                <div className="flex items-center justify-center gap-2.5 w-full">
                  <div className="h-[min(570px,calc(100vh-255px))] flex items-center">
                    <EvaluationBar
                      scoreCentipawns={evalScore}
                      isCheckmate={currentSnapshot.isCheckmate}
                      orientation={orientation}
                    />
                  </div>

                  <div className="w-[min(570px,calc(100vh-255px))] h-[min(570px,calc(100vh-255px))] aspect-square flex items-center justify-center">
                    <Chessboard
                      snapshot={currentSnapshot}
                      legalMoves={currentLegalMoves}
                      orientation={orientation}
                      theme={(preferences.boardTheme as BoardTheme) || 'green'}
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

                {/* Player Bar (Directly Below Board) */}
                <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#739552]/40"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-stone-900 ${
                          bottomPlayerColor === 'w' ? 'bg-white' : 'bg-stone-900'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {user.title && (
                          <span className="text-[9px] font-extrabold px-1 py-0.2 bg-amber-500 text-white rounded">
                            {user.title}
                          </span>
                        )}
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                          {isOnline
                            ? socketHook.roomState?.whitePlayer?.name || user.username
                            : user.username}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 font-bold">
                          ({user.ratings.rapid.rating})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CapturedPieces
                          captured={bottomPlayerColor === 'w' ? whiteCaptured : blackCaptured}
                          color={bottomPlayerColor === 'w' ? 'b' : 'w'}
                          advantage={bottomPlayerColor === 'w' ? whiteAdvantage : blackAdvantage}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Player Clock (Directly Bottom-Right) */}
                  <ClockDisplay
                    minimal={true}
                    color={bottomPlayerColor}
                    clockState={liveSnapshot.clocks}
                    isActive={liveSnapshot.sideToMove === bottomPlayerColor && liveSnapshot.status === 'active'}
                  />
                </div>
              </div>

              {/* STAGE 2: Game Info & Move History Panel (Right Side) */}
              <div className="w-full lg:w-[380px] xl:w-[410px] flex flex-col justify-between h-[min(640px,calc(100vh-175px))] max-h-[min(640px,calc(100vh-175px))] overflow-hidden gap-2.5 shrink-0">
                {/* Match Status & Opening Header */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Turn Status Alert */}
                  {liveSnapshot.status === 'active' ? (
                    <div
                      className={`py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
                        isUserTurn
                          ? 'bg-[#f0fdf4] dark:bg-emerald-950/40 border-[#86efac] dark:border-emerald-800 text-[#15803d] dark:text-emerald-300'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isUserTurn ? 'bg-[#22c55e] animate-ping' : 'bg-amber-400'
                          }`}
                        />
                        <span className="truncate">
                          {isUserTurn
                            ? 'Your turn — Make a move!'
                            : mode === 'computer'
                            ? 'Computer is calculating...'
                            : "Opponent's turn..."}
                        </span>
                      </div>
                      {liveSnapshot.isCheck && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold uppercase tracking-wider text-[10px] border border-rose-200 dark:border-rose-800 shrink-0">
                          Check!
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-between shadow-sm">
                      <span>Result: {liveSnapshot.result} ({liveSnapshot.endReason})</span>
                      <button
                        onClick={() => setShowGameOverModal(true)}
                        className="underline hover:text-black dark:hover:text-white font-semibold text-[11px]"
                      >
                        Details
                      </button>
                    </div>
                  )}

                  {/* Opening Banner */}
                  {openingInfo && (
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-2">
                      <BookOpen size={14} className="text-[#739552] shrink-0" />
                      <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-[10px] uppercase font-mono font-bold text-stone-400 tracking-wider">
                          {openingInfo.eco}
                        </span>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                          {openingInfo.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Move History Table (Takes Available Height) */}
                <div className="flex-1 min-h-[220px] max-h-[340px] overflow-hidden">
                  <MoveHistory
                    moves={liveSnapshot.moveHistory}
                    snapshot={liveSnapshot}
                    currentPlyIndex={reviewPly}
                    onSelectPly={(plyIndex) => setReviewPly(plyIndex)}
                    className="h-full max-h-full"
                  />
                </div>

                {/* Bottom Action Controls Bar */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-2.5 shadow-sm flex items-center justify-between gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={flipBoard}
                      title="Flip board orientation"
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <RotateCcw size={13} />
                      <span>Flip</span>
                    </button>

                    {!isOnline && (
                      <button
                        onClick={() => setShowNewGameModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                      >
                        <Play size={12} fill="white" />
                        <span>New Game</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {liveSnapshot.canClaimThreefold && (
                      <button
                        onClick={() => handleClaimDraw('threefold')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-bold shadow-sm"
                      >
                        3-Fold Draw
                      </button>
                    )}

                    {liveSnapshot.status === 'active' && (
                      <button
                        onClick={handleResign}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                        title="Resign current game"
                      >
                        <Flag size={13} />
                        <span>Resign</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Game Setup Modal */}
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

      {/* Victory / Defeat Game Over Modal with Direct "Review Game" Link */}
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
        onOpenGameReview={() => {
          setShowGameOverModal(false);
          if (lastFinishedGameId) {
            startReviewGame(lastFinishedGameId);
          } else {
            navigateTo('review');
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PlatformProvider>
      <MainAppContent />
    </PlatformProvider>
  );
};
