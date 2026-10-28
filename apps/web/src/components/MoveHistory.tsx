import React, { useEffect, useRef, useState } from 'react';
import { DetailedMove, GameSnapshot } from '@chess/core';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Download,
  Maximize2,
  X,
  FileText,
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
  const [showFullReportModal, setShowFullReportModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentPlyIndex === -1 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, currentPlyIndex]);

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
    <>
      {/* Compact Locked-Height Move Register (Strictly Non-Extending) */}
      <div className="bg-white border border-stone-200 rounded-xl p-2.5 flex flex-col h-[170px] max-h-[170px] overflow-hidden shadow-sm shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">Moves</h3>
            <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded-full">
              {moves.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFullReportModal(true)}
              title="Expand full report"
              className="flex items-center gap-1 text-[10px] text-stone-600 hover:text-stone-900 px-1.5 py-0.5 rounded hover:bg-stone-100 transition-colors font-semibold"
            >
              <Maximize2 size={11} />
              <span>Report</span>
            </button>
            <button
              onClick={exportPGN}
              disabled={moves.length === 0}
              className="flex items-center gap-0.5 text-[10px] text-[#739552] hover:text-[#5f7d41] transition-colors disabled:opacity-30 font-bold"
            >
              <Download size={11} /> PGN
            </button>
          </div>
        </div>

        {/* Scrollable Move List Table */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain space-y-0.5 text-xs font-mono py-1 pr-1 scrollbar-thin"
        >
          {pairedMoves.length === 0 ? (
            <div className="text-stone-400 text-xs italic text-center py-5">
              Moves will appear here
            </div>
          ) : (
            pairedMoves.map((pair) => {
              const isWhiteActive = pair.white && pair.white.ply === activePly;
              const isBlackActive = pair.black && pair.black.ply === activePly;

              return (
                <div
                  key={pair.turnNumber}
                  className="grid grid-cols-[30px_1fr_1fr] px-1.5 py-0.5 rounded hover:bg-stone-50 items-center transition-colors"
                >
                  <span className="text-stone-400 font-semibold text-[10px]">{pair.turnNumber}.</span>
                  <button
                    onClick={() => pair.white && onSelectPly(pair.white.ply)}
                    className={`text-left px-1 py-0.2 rounded font-medium transition-all text-[11px] ${
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
                      className={`text-left px-1 py-0.2 rounded font-medium transition-all text-[11px] ${
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

        {/* Compact Navigation Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-200 shrink-0">
          <button
            onClick={() => onSelectPly(-2)}
            disabled={moves.length === 0 || (activePly === -1 && moves.length === 0)}
            title="Start of game"
            className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 disabled:opacity-30"
          >
            <ChevronsLeft size={13} />
          </button>
          <button
            onClick={() => onSelectPly(Math.max(-2, activePly - 1))}
            disabled={moves.length === 0 || activePly <= -2}
            title="Previous move"
            className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 disabled:opacity-30"
          >
            <ChevronLeft size={13} />
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
            className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 disabled:opacity-30"
          >
            <ChevronRight size={13} />
          </button>
          <button
            onClick={() => onSelectPly(-1)}
            disabled={moves.length === 0 || currentPlyIndex === -1}
            title="Current live position"
            className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900 disabled:opacity-30"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>

      {/* Expanded Full Report Modal */}
      {showFullReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl p-6 text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#739552]" />
                <h3 className="font-bold text-base text-stone-900">Full Game Report</h3>
              </div>
              <button
                onClick={() => setShowFullReportModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-b border-stone-100 shrink-0 text-xs">
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-semibold block">Total Moves</span>
                <span className="text-sm font-bold text-stone-900">{moves.length} plies</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <span className="text-stone-500 font-semibold block">Result</span>
                <span className="text-sm font-bold text-stone-900">
                  {snapshot.result || 'In Progress'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1 font-mono text-xs pr-1">
              {pairedMoves.length === 0 ? (
                <div className="text-center py-10 text-stone-400 italic">No moves recorded yet</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pairedMoves.map((pair) => (
                    <div
                      key={pair.turnNumber}
                      className="bg-stone-50 p-2 rounded-lg border border-stone-200 flex items-center justify-between"
                    >
                      <span className="text-stone-400 font-semibold">{pair.turnNumber}.</span>
                      <span className="font-bold text-stone-900">{pair.white?.move.san}</span>
                      <span className="font-semibold text-stone-600">{pair.black?.move.san || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between shrink-0">
              <button
                onClick={exportPGN}
                className="px-4 py-2 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Download size={14} /> Copy Full PGN
              </button>
              <button
                onClick={() => setShowFullReportModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
