import React, { useEffect, useRef } from 'react';
import { DetailedMove, GameSnapshot } from '@chess/core';

interface MoveHistoryProps {
  moves: DetailedMove[];
  snapshot: GameSnapshot;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, snapshot }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  // Group moves into pairs (turn #, white move, black move)
  const pairedMoves: { number: number; white?: DetailedMove; black?: DetailedMove }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairedMoves.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  const exportPGN = () => {
    let pgn = '';
    pairedMoves.forEach((pair) => {
      pgn += `${pair.number}. ${pair.white?.san ?? ''} ${pair.black?.san ?? ''} `;
    });
    if (snapshot.result) {
      pgn += snapshot.result;
    }
    navigator.clipboard.writeText(pgn.trim());
    alert('PGN copied to clipboard!');
  };

  return (
    <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col h-[280px] shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
        <h3 className="font-semibold text-slate-200 text-sm">Move History</h3>
        <button
          onClick={exportPGN}
          disabled={moves.length === 0}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40"
        >
          Copy PGN
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 text-sm font-mono pr-1">
        {pairedMoves.length === 0 ? (
          <div className="text-slate-500 text-xs italic text-center py-6">No moves made yet</div>
        ) : (
          pairedMoves.map((pair) => (
            <div
              key={pair.number}
              className="grid grid-cols-[36px_1fr_1fr] px-2 py-0.5 rounded hover:bg-slate-800/50"
            >
              <span className="text-slate-500">{pair.number}.</span>
              <span className="text-slate-200">{pair.white?.san}</span>
              <span className="text-slate-300">{pair.black?.san}</span>
            </div>
          ))
        )}
      </div>

      {snapshot.status === 'finished' && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
          <div className="text-sm font-bold text-amber-400">{snapshot.result}</div>
          <div className="text-xs text-slate-300 capitalize">
            {snapshot.endReason?.replace(/_/g, ' ')}
          </div>
        </div>
      )}
    </div>
  );
};
