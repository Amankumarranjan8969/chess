import React from 'react';
import { Color, EndReason, GameResult } from '@chess/core';
import { Trophy, Skull, Handshake, RotateCcw, Eye } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  result: GameResult;
  endReason: EndReason | null;
  userColor: Color;
  onPlayAgain: () => void;
  onReviewBoard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  result,
  endReason,
  userColor,
  onPlayAgain,
  onReviewBoard,
}) => {
  if (!isOpen || !result) return null;

  const isWhiteWin = result === '1-0';
  const isBlackWin = result === '0-1';
  const isDraw = result === '1/2-1/2';

  const userWon = (isWhiteWin && userColor === 'w') || (isBlackWin && userColor === 'b');
  const userLost = (isWhiteWin && userColor === 'b') || (isBlackWin && userColor === 'w');

  const formatReason = (reason: EndReason | null) => {
    switch (reason) {
      case 'checkmate':
        return 'by Checkmate';
      case 'timeout':
        return 'on Time (Clock Expired)';
      case 'resignation':
        return 'by Resignation';
      case 'stalemate':
        return 'by Stalemate';
      case 'threefold_repetition':
        return 'by Threefold Repetition';
      case 'fifty_move_rule':
        return 'by 50-Move Rule';
      case 'insufficient_material':
        return 'by Insufficient Material';
      case 'agreement':
        return 'by Mutual Agreement';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md p-6 sm:p-8 rounded-2xl border text-center shadow-2xl overflow-hidden transition-all transform scale-100 ${
          userWon
            ? 'bg-[#1e1c18] border-[#e5a93b]/70 shadow-[0_0_50px_rgba(229,169,59,0.3)]'
            : userLost
            ? 'bg-[#1e1818] border-rose-600/70 shadow-[0_0_50px_rgba(225,29,72,0.3)]'
            : 'bg-[#1d1d1b] border-stone-600 shadow-[0_0_40px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none ${
            userWon ? 'bg-[#e5a93b]' : userLost ? 'bg-rose-600' : 'bg-stone-400'
          }`}
        />

        {/* Icon & Title */}
        <div className="relative flex flex-col items-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-xl border-2 ${
              userWon
                ? 'bg-[#e5a93b]/20 border-[#e5a93b] text-[#e5a93b]'
                : userLost
                ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                : 'bg-stone-800 border-stone-500 text-stone-300'
            }`}
          >
            {userWon ? (
              <Trophy size={42} className="animate-bounce" />
            ) : userLost ? (
              <Skull size={42} />
            ) : (
              <Handshake size={42} />
            )}
          </div>

          <h2
            className={`text-3xl sm:text-4xl font-black uppercase tracking-wider mb-1 ${
              userWon ? 'text-[#e5a93b]' : userLost ? 'text-rose-400' : 'text-stone-200'
            }`}
          >
            {userWon ? 'Victory!' : userLost ? 'Defeat' : 'Draw'}
          </h2>

          <p className="text-stone-300 text-base font-semibold mb-2">
            {userWon
              ? 'You won the match!'
              : userLost
              ? 'You lost the match'
              : 'The game ended in a draw'}
          </p>

          <div className="inline-block px-3 py-1 rounded-full bg-[#161512] border border-[#33302a] text-xs font-mono font-bold text-stone-400 mb-6">
            Result: {result} • {formatReason(endReason)}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={onPlayAgain}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                userWon
                  ? 'bg-[#739552] hover:bg-[#648346] text-white shadow-[#739552]/30 hover:scale-[1.02]'
                  : 'bg-[#e5a93b] hover:bg-[#cf942b] text-slate-950 shadow-[#e5a93b]/20 hover:scale-[1.02]'
              }`}
            >
              <RotateCcw size={16} /> Play Again
            </button>

            <button
              onClick={onReviewBoard}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-stone-300 hover:text-white bg-[#262421] hover:bg-[#312e2b] border border-[#38342e] transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye size={14} /> Review Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
