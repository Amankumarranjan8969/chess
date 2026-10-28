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
  currentPlyIndex: number;
  onSelectPly: (plyIndex: number) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  snapshot,
  currentPlyIndex,
  onSelectPly,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentPlyIndex === -1 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves, currentPlyIndex]);

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
    <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col flex-1 min-h-[220px] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-stone-200 mb-2">
        <h3 className="font-bold text-stone-800 text-xs uppercase tracking-wider">Moves</h3>
        <button
          onClick={exportPGN}
          disabled={moves.length === 0}
          className="flex items-center gap-1 text-xs text-[#739552] hover:text-[#5f7d41] transition-colors disabled:opacity-30 font-bold"
        >
          <Download size={13} /> PGN
        </button>
      </div>

      {/* Move List Table */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-0.5 text-xs font-mono pr-1"
      >
        {pairedMoves.length === 0 ? (
          <div className="text-stone-400 text-xs italic text-center py-8">
            Moves will appear here
          </div>
        ) : (
          pairedMoves.map((pair) => {
            const isWhiteActive = pair.white && pair.white.ply === activePly;
            const isBlackActive = pair.black && pair.black.ply === activePly;

            return (
              <div
                key={pair.turnNumber}
                className="grid grid-cols-[36px_1fr_1fr] px-2 py-1 rounded hover:bg-stone-50 items-center transition-colors"
              >
                <span className="text-stone-400 font-semibold">{pair.turnNumber}.</span>
                <button
                  onClick={() => pair.white && onSelectPly(pair.white.ply)}
                  className={`text-left px-2 py-0.5 rounded font-medium transition-all ${
                    isWhiteActive
                      ? 'bg-[#739552]/15 text-[#5f7d41] font-bold ring-1 ring-[#739552]/40'
                      : 'text-stone-800 hover:text-black'
                  }`}
                >
                  {pair.white?.move.san}
                </button>
                {pair.black ? (
                  <button
                    onClick={() => onSelectPly(pair.black!.ply)}
                    className={`text-left px-2 py-0.5 rounded font-medium transition-all ${
                      isBlackActive
                        ? 'bg-[#739552]/15 text-[#5f7d41] font-bold ring-1 ring-[#739552]/40'
                        : 'text-stone-600 hover:text-black'
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

      {/* Game End Status */}
      {snapshot.status === 'finished' && (
        <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <div className="text-xs font-black text-amber-800">{snapshot.result}</div>
          <div className="text-[11px] text-amber-700 font-medium capitalize">
            {snapshot.endReason?.replace(/_/g, ' ')}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-200 mt-2">
        <button
          onClick={() => onSelectPly(-2)}
          disabled={moves.length === 0 || (activePly === -1 && moves.length === 0)}
          title="Start of game"
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 disabled:opacity-30"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onSelectPly(Math.max(-2, activePly - 1))}
          disabled={moves.length === 0 || activePly <= -2}
          title="Previous move"
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => {
            if (activePly < moves.length - 1) {
              onSelectPly(activePly + 1);
            } else {
              onSelectPly(-1);
            }
          }}
          disabled={moves.length === 0 || currentPlyIndex === -1}
          title="Next move"
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onSelectPly(-1)}
          disabled={moves.length === 0 || currentPlyIndex === -1}
          title="Current live position"
          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 disabled:opacity-30"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};
