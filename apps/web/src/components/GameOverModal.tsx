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
  onOpenGameReview?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  result,
  endReason,
  userColor,
  onPlayAgain,
  onReviewBoard,
  onOpenGameReview,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md p-6 sm:p-8 rounded-2xl border text-center shadow-2xl overflow-hidden bg-white ${
          userWon
            ? 'border-amber-300 shadow-[0_10px_40px_rgba(217,119,6,0.15)]'
            : userLost
            ? 'border-rose-300 shadow-[0_10px_40px_rgba(225,29,72,0.15)]'
            : 'border-stone-300 shadow-[0_10px_40px_rgba(0,0,0,0.1)]'
        }`}
      >
        <div className="relative flex flex-col items-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg border-2 ${
              userWon
                ? 'bg-amber-50 border-amber-400 text-amber-600'
                : userLost
                ? 'bg-rose-50 border-rose-400 text-rose-600'
                : 'bg-stone-50 border-stone-400 text-stone-600'
            }`}
          >
            {userWon ? (
              <Trophy size={40} className="animate-bounce" />
            ) : userLost ? (
              <Skull size={40} />
            ) : (
              <Handshake size={40} />
            )}
          </div>

          <h2
            className={`text-3xl font-black uppercase tracking-tight mb-1 ${
              userWon ? 'text-amber-700' : userLost ? 'text-rose-600' : 'text-stone-800'
            }`}
          >
            {userWon ? 'Victory!' : userLost ? 'Defeat' : 'Draw'}
          </h2>

          <p className="text-stone-600 text-base font-semibold mb-2">
            {userWon
              ? 'You won the match!'
              : userLost
              ? 'You lost the match'
              : 'The game ended in a draw'}
          </p>

          <div className="inline-block px-3.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono font-bold text-stone-700 mb-6">
            Result: {result} • {formatReason(endReason)}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-2.5">
            {onOpenGameReview && (
              <button
                onClick={onOpenGameReview}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide uppercase transition-all shadow-md bg-[#739552] hover:bg-[#648346] text-white flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <Eye size={16} /> Review Game in Analysis Studio
              </button>
            )}

            <button
              onClick={onPlayAgain}
              className={`w-full py-3 px-6 rounded-xl font-bold text-xs tracking-wide uppercase transition-all shadow-sm flex items-center justify-center gap-2 ${
                onOpenGameReview
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-[#739552] hover:bg-[#648346] text-white'
              }`}
            >
              <RotateCcw size={15} /> Play Again
            </button>

            <button
              onClick={onReviewBoard}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-stone-700 hover:text-black bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center justify-center gap-1.5"
            >
              Close & Stay on Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
