import React, { useEffect, useRef } from 'react';
import { DetailedMove, GameSnapshot } from '@chess/core';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Download,
} from 'lucide-react';

interface MoveHistoryProps {
  moves: DetailedMove[];
  snapshot: GameSnapshot;
  currentPlyIndex: number; // -1 means latest live position, 0..N is historical view
  onSelectPly: (plyIndex: number) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  snapshot,
  currentPlyIndex,
  onSelectPly,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest move if viewing live position
  useEffect(() => {
    if (currentPlyIndex === -1 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves, currentPlyIndex]);

  // Group moves into pairs (turn #, white move, black move)
  const pairedMoves: {
    turnNumber: number;
    white?: { move: DetailedMove; ply: number };
    black?: { move: DetailedMove; ply: number };
  }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    pairedMoves.push({
      turnNumber: Math.floor(i / 2) + 1,
      white: moves[i] ? { move: moves[i], ply: i } : undefined,
      black: moves[i + 1] ? { move: moves[i + 1], ply: i + 1 } : undefined,
    });
  }

  const exportPGN = () => {
    let pgn = '';
    pairedMoves.forEach((pair) => {
      pgn += `${pair.turnNumber}. ${pair.white?.move.san ?? ''} ${
        pair.black?.move.san ?? ''
      } `;
    });
    if (snapshot.result) {
      pgn += snapshot.result;
    }
    navigator.clipboard.writeText(pgn.trim());
    alert('PGN copied to clipboard!');
  };

  const activePly = currentPlyIndex === -1 ? moves.length - 1 : currentPlyIndex;

  return (
    <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col h-[340px] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
        <h3 className="font-semibold text-slate-200 text-sm">Move History</h3>
        <button
          onClick={exportPGN}
          disabled={moves.length === 0}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40"
        >
          <Download size={13} /> Copy PGN
        </button>
      </div>

      {/* Move List Table */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-0.5 text-xs font-mono pr-1"
      >
        {pairedMoves.length === 0 ? (
          <div className="text-slate-500 text-xs italic text-center py-10">
            Game moves will appear here
          </div>
        ) : (
          pairedMoves.map((pair) => {
            const isWhiteActive = pair.white && pair.white.ply === activePly;
            const isBlackActive = pair.black && pair.black.ply === activePly;

            return (
              <div
                key={pair.turnNumber}
                className="grid grid-cols-[38px_1fr_1fr] px-2 py-1 rounded hover:bg-slate-800/60 items-center transition-colors"
              >
                <span className="text-slate-500 font-semibold">{pair.turnNumber}.</span>
                <button
                  onClick={() => pair.white && onSelectPly(pair.white.ply)}
                  className={`text-left px-1.5 py-0.5 rounded font-medium transition-all ${
                    isWhiteActive
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  {pair.white?.move.san}
                </button>
                {pair.black ? (
                  <button
                    onClick={() => onSelectPly(pair.black!.ply)}
                    className={`text-left px-1.5 py-0.5 rounded font-medium transition-all ${
                      isBlackActive
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {pair.black.move.san}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Game End Banner */}
      {snapshot.status === 'finished' && (
        <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
          <div className="text-xs font-bold text-amber-400">{snapshot.result}</div>
          <div className="text-[11px] text-slate-300 capitalize">
            {snapshot.endReason?.replace(/_/g, ' ')}
          </div>
        </div>
      )}

      {/* Navigation Controls (⏮ ◀ ▶ ⏭) */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2">
        <button
          onClick={() => onSelectPly(-2)} // Start of game
          disabled={moves.length === 0 || activePly === -1 && moves.length === 0}
          title="Start of game"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onSelectPly(Math.max(-2, activePly - 1))}
          disabled={moves.length === 0 || activePly <= -2}
          title="Previous move"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => {
            if (activePly < moves.length - 1) {
              onSelectPly(activePly + 1);
            } else {
              onSelectPly(-1); // Live
            }
          }}
          disabled={moves.length === 0 || currentPlyIndex === -1}
          title="Next move"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onSelectPly(-1)} // Live
          disabled={moves.length === 0 || currentPlyIndex === -1}
          title="Current live position"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};
