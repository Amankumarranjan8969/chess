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
    <div className="bg-[#21201d] border border-[#33302a] rounded-2xl p-4 flex flex-col h-[280px] sm:h-[320px] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#33302a] mb-2">
        <h3 className="font-bold text-stone-200 text-xs uppercase tracking-wider">Move History</h3>
        <button
          onClick={exportPGN}
          disabled={moves.length === 0}
          className="flex items-center gap-1 text-xs text-[#e5a93b] hover:text-[#f3be5d] transition-colors disabled:opacity-30 font-semibold"
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
          <div className="text-stone-500 text-xs italic text-center py-10">
            Game moves will appear here
          </div>
        ) : (
          pairedMoves.map((pair) => {
            const isWhiteActive = pair.white && pair.white.ply === activePly;
            const isBlackActive = pair.black && pair.black.ply === activePly;

            return (
              <div
                key={pair.turnNumber}
                className="grid grid-cols-[38px_1fr_1fr] px-2 py-1 rounded hover:bg-[#282622] items-center transition-colors"
              >
                <span className="text-stone-500 font-semibold">{pair.turnNumber}.</span>
                <button
                  onClick={() => pair.white && onSelectPly(pair.white.ply)}
                  className={`text-left px-2 py-0.5 rounded font-medium transition-all ${
                    isWhiteActive
                      ? 'bg-[#739552]/30 text-[#82aa5a] font-bold ring-1 ring-[#739552]/50'
                      : 'text-stone-200 hover:text-white'
                  }`}
                >
                  {pair.white?.move.san}
                </button>
                {pair.black ? (
                  <button
                    onClick={() => onSelectPly(pair.black!.ply)}
                    className={`text-left px-2 py-0.5 rounded font-medium transition-all ${
                      isBlackActive
                        ? 'bg-[#739552]/30 text-[#82aa5a] font-bold ring-1 ring-[#739552]/50'
                        : 'text-stone-300 hover:text-white'
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

      {/* Game End Mini Status Banner if not modal */}
      {snapshot.status === 'finished' && (
        <div className="mt-2 p-2 rounded-xl bg-[#e5a93b]/10 border border-[#e5a93b]/30 text-center">
          <div className="text-xs font-bold text-[#e5a93b]">{snapshot.result}</div>
          <div className="text-[11px] text-stone-300 capitalize">
            {snapshot.endReason?.replace(/_/g, ' ')}
          </div>
        </div>
      )}

      {/* Navigation Controls (⏮ ◀ ▶ ⏭) */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#33302a] mt-2">
        <button
          onClick={() => onSelectPly(-2)}
          disabled={moves.length === 0 || (activePly === -1 && moves.length === 0)}
          title="Start of game"
          className="p-1.5 rounded-lg hover:bg-[#2c2a26] text-stone-400 hover:text-stone-200 disabled:opacity-30"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onSelectPly(Math.max(-2, activePly - 1))}
          disabled={moves.length === 0 || activePly <= -2}
          title="Previous move"
          className="p-1.5 rounded-lg hover:bg-[#2c2a26] text-stone-400 hover:text-stone-200 disabled:opacity-30"
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
          className="p-1.5 rounded-lg hover:bg-[#2c2a26] text-stone-400 hover:text-stone-200 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onSelectPly(-1)}
          disabled={moves.length === 0 || currentPlyIndex === -1}
          title="Current live position"
          className="p-1.5 rounded-lg hover:bg-[#2c2a26] text-stone-400 hover:text-stone-200 disabled:opacity-30"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};
