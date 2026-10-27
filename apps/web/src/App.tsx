import React, { useState, useEffect, useRef } from 'react';
import {
  ChessGame,
  Color,
  DetailedMove,
  GameSnapshot,
  PieceSymbol,
  Square,
  TimeControl,
} from '@chess/core';
import { Chessboard } from './components/Chessboard.js';
import { ClockDisplay } from './components/ClockDisplay.js';
import { MoveHistory } from './components/MoveHistory.js';
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
} from 'lucide-react';

type GameMode = 'computer' | 'local' | 'online';

export const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('computer');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [userColor, setUserColor] = useState<Color>('w');
  const [orientation, setOrientation] = useState<Color>('w');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [playerNameInput, setPlayerNameInput] = useState<string>('Player');

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

  // AI Hook
  const { getMove: getAIMove, isThinking: isAIThinking, cancelSearch } = useChessAI();

  // Online Socket Hook
  const socketHook = useChessSocket();

  // Reset or initialize local game
  const resetLocalGame = (
    timeControl: TimeControl = { initialMs: 300000, incrementMs: 3000 }
  ) => {
    cancelSearch();
    const newGame = new ChessGame(undefined, { timeControl });
    localGameRef.current = newGame;
    setLocalSnapshot(newGame.getSnapshot());
    setLegalMoves(newGame.getLegalMoves());
    setOrientation(userColor);
  };

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  // Flip board
  const flipBoard = () => {
    setOrientation((prev) => (prev === 'w' ? 'b' : 'w'));
  };

  // Local move execution
  const handleLocalMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    const res = localGameRef.current.makeMove({ from, to, promotion });
    if (!res.success || !res.move) return;

    // Audio effects
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
    socketHook.sendMove({ from, to, promotion });
  };

  // Trigger AI reply when it's computer's turn in 'computer' mode
  useEffect(() => {
    if (mode !== 'computer') return;
    if (localSnapshot.status !== 'active') return;

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
  }, [mode, localSnapshot, userColor, difficulty, isAIThinking, getAIMove]);

  // Current active snapshot and legal moves depending on mode
  const isOnline = mode === 'online';
  const currentSnapshot: GameSnapshot = isOnline
    ? socketHook.roomState?.gameState ?? localSnapshot
    : localSnapshot;

  const currentLegalMoves: DetailedMove[] = isOnline
    ? localGameRef.current ? localGameRef.current.getLegalMoves() : []
    : legalMoves;

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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-xl">
            ♞
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
              Grandmaster Arena
            </h1>
            <p className="text-xs text-slate-400">Authoritative Real-Time Chess</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-sm">
          <button
            onClick={() => {
              setMode('computer');
              resetLocalGame();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === 'computer'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === 'online'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              mode === 'local'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
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
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Column: Board & Clocks */}
        <div className="flex flex-col items-center gap-3">
          {/* Top Player Clock */}
          <div className="w-full max-w-[560px]">
            <ClockDisplay
              color={orientation === 'w' ? 'b' : 'w'}
              playerName={
                isOnline
                  ? socketHook.roomState?.blackPlayer?.name || 'Waiting for opponent...'
                  : mode === 'computer'
                  ? `Computer (${difficulty.toUpperCase()})`
                  : 'Player 2 (Black)'
              }
              clockState={currentSnapshot.clocks}
              isActive={currentSnapshot.sideToMove === (orientation === 'w' ? 'b' : 'w')}
            />
          </div>

          {/* Interactive Board */}
          <Chessboard
            snapshot={currentSnapshot}
            legalMoves={currentLegalMoves}
            orientation={orientation}
            interactive={
              currentSnapshot.status === 'active' &&
              (!isOnline ||
                socketHook.playerColor === currentSnapshot.sideToMove ||
                socketHook.playerColor === 'spectator') &&
              (!isAIThinking)
            }
            onMove={handleMove}
          />

          {/* Bottom Player Clock */}
          <div className="w-full max-w-[560px]">
            <ClockDisplay
              color={orientation === 'w' ? 'w' : 'b'}
              playerName={
                isOnline
                  ? socketHook.roomState?.whitePlayer?.name || playerNameInput
                  : mode === 'computer'
                  ? 'You'
                  : 'Player 1 (White)'
              }
              clockState={currentSnapshot.clocks}
              isActive={currentSnapshot.sideToMove === (orientation === 'w' ? 'w' : 'b')}
            />
          </div>

          {/* Board Action Bar */}
          <div className="w-full max-w-[560px] flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={flipBoard}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Flip Board
              </button>

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
              {currentSnapshot.canClaimThreefold && (
                <button
                  onClick={() => handleClaimDraw('threefold')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-xs font-semibold"
                >
                  Claim Threefold Draw
                </button>
              )}
              {currentSnapshot.canClaimFiftyMoves && (
                <button
                  onClick={() => handleClaimDraw('fifty_moves')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-xs font-semibold"
                >
                  Claim 50-Move Draw
                </button>
              )}
              {currentSnapshot.status === 'active' && (
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

        {/* Right Column: Game Setup / Online Panel & Move History */}
        <div className="flex flex-col gap-4">
          {/* Offline Computer Config Panel */}
          {mode === 'computer' && (
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
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
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
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
                        ? 'bg-slate-100 text-slate-900 border-white'
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
                        ? 'bg-slate-950 text-slate-100 border-slate-500'
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
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
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
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors"
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
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 uppercase font-mono tracking-widest text-center"
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
                          className="flex-1 bg-amber-500 text-slate-950 font-bold py-1 rounded text-xs"
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

          {/* Move History Panel */}
          <MoveHistory
            moves={currentSnapshot.moveHistory}
            snapshot={currentSnapshot}
          />
        </div>
      </main>
    </div>
  );
};
