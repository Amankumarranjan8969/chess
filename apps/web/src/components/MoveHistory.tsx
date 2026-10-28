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
  Check,
} from 'lucide-react';

interface MoveHistoryProps {
  moves: (DetailedMove | any)[];
  snapshot: GameSnapshot;
  currentPlyIndex: number;
  onSelectPly: (plyIndex: number) => void;
  className?: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  snapshot,
  currentPlyIndex,
  onSelectPly,
  className = 'h-[230px] max-h-[230px]',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFullReportModal, setShowFullReportModal] = useState<boolean>(false);
  const [copiedPgn, setCopiedPgn] = useState<boolean>(false);

  // Auto-scroll to latest move during active game
  useEffect(() => {
    if (currentPlyIndex === -1 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, currentPlyIndex]);

  const pairedMoves: {
    turnNumber: number;
    white?: { move: any; ply: number };
    black?: { move: any; ply: number };
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
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const activePly = currentPlyIndex === -1 ? moves.length - 1 : currentPlyIndex;

  return (
    <>
      {/* Locked-Height Move Register (Strictly Non-Extending, Perfect Grid) */}
      <div
        className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3 flex flex-col overflow-hidden shadow-sm shrink-0 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider">
              Moves
            </h3>
            <span className="text-[10px] font-bold text-stone-700 dark:text-stone-400 bg-white dark:bg-stone-800 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 shadow-xs">
              {moves.length} plies
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFullReportModal(true)}
              title="Expand full report"
              className="flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors font-semibold"
            >
              <Maximize2 size={12} />
              <span>Report</span>
            </button>
            <button
              onClick={exportPGN}
              disabled={moves.length === 0}
              className="flex items-center gap-1 text-[11px] text-[#739552] dark:text-[#88c558] hover:text-[#5f7d41] px-2 py-1 rounded-lg hover:bg-[#739552]/10 transition-colors disabled:opacity-30 font-bold"
              title="Copy PGN to clipboard"
            >
              {copiedPgn ? <Check size={12} /> : <Download size={12} />}
              <span>{copiedPgn ? 'Copied' : 'PGN'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Move List Grid */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain space-y-0.5 text-xs font-mono py-1.5 pr-1 scrollbar-thin"
        >
          {pairedMoves.length === 0 ? (
            <div className="text-stone-400 dark:text-stone-500 text-xs italic text-center py-8">
              Moves will appear here as the game progresses
            </div>
          ) : (
            pairedMoves.map((pair) => {
              const isWhiteActive = pair.white && pair.white.ply === activePly;
              const isBlackActive = pair.black && pair.black.ply === activePly;

              return (
                <div
                  key={pair.turnNumber}
                  className="grid grid-cols-[32px_1fr_1fr] px-2 py-1 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 items-center transition-colors"
                >
                  <span className="text-stone-400 dark:text-stone-500 font-semibold text-[11px]">
                    {pair.turnNumber}.
                  </span>
                  <button
                    onClick={() => pair.white && onSelectPly(pair.white.ply)}
                    className={`text-left px-1.5 py-0.5 rounded-md font-semibold transition-all text-xs ${
                      isWhiteActive
                        ? 'bg-[#739552] text-white font-extrabold shadow-sm'
                        : 'text-stone-800 dark:text-stone-200 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {pair.white?.move.san}
                  </button>
                  {pair.black ? (
                    <button
                      onClick={() => onSelectPly(pair.black!.ply)}
                      className={`text-left px-1.5 py-0.5 rounded-md font-semibold transition-all text-xs ${
                        isBlackActive
                          ? 'bg-[#739552] text-white font-extrabold shadow-sm'
                          : 'text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white'
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
        <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 dark:border-stone-800 shrink-0">
          <button
            onClick={() => onSelectPly(-2)}
            disabled={moves.length === 0 || (activePly === -1 && moves.length === 0)}
            title="Start of game (|<<)"
            className="p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            onClick={() => onSelectPly(Math.max(-2, activePly - 1))}
            disabled={moves.length === 0 || activePly <= -2}
            title="Previous move (<)"
            className="p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={15} />
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
            title="Next move (>)"
            className="p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => onSelectPly(-1)}
            disabled={moves.length === 0 || currentPlyIndex === -1}
            title="Current live position (>>|)"
            className="p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>

      {/* Expanded Full Report Modal */}
      {showFullReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl p-6 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#739552]" />
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Full Game Move Report
                </h3>
              </div>
              <button
                onClick={() => setShowFullReportModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-b border-stone-100 dark:border-stone-800 shrink-0 text-xs">
              <div className="bg-white dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs">
                <span className="text-stone-500 dark:text-stone-400 font-semibold block">Total Moves</span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{moves.length} plies</span>
              </div>
              <div className="bg-white dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs">
                <span className="text-stone-500 dark:text-stone-400 font-semibold block">Result</span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {snapshot.result || 'In Progress'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1 font-mono text-xs pr-1 scrollbar-thin">
              {pairedMoves.length === 0 ? (
                <div className="text-center py-10 text-stone-400 italic">No moves recorded yet</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pairedMoves.map((pair) => (
                    <div
                      key={pair.turnNumber}
                      className="bg-white dark:bg-stone-800/50 p-2 rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-between shadow-xs"
                    >
                      <span className="text-stone-400 dark:text-stone-500 font-semibold">{pair.turnNumber}.</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">{pair.white?.move.san}</span>
                      <span className="font-semibold text-stone-600 dark:text-stone-400">{pair.black?.move.san || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
              <button
                onClick={exportPGN}
                className="px-4 py-2 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copiedPgn ? <Check size={14} /> : <Download size={14} />}
                <span>{copiedPgn ? 'PGN Copied!' : 'Copy Full PGN'}</span>
              </button>
              <button
                onClick={() => setShowFullReportModal(false)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-300 font-semibold text-xs transition-colors shadow-xs"
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
