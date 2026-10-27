import React from 'react';
import { Color } from '@chess/core';

interface EvaluationBarProps {
  scoreCentipawns: number; // positive = White advantage, negative = Black advantage
  isCheckmate?: boolean;
  orientation: Color;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  scoreCentipawns,
  isCheckmate = false,
  orientation,
}) => {
  // Convert centipawns to winning percentage for White (0 to 100%)
  let whitePercent = 50;

  if (Math.abs(scoreCentipawns) >= 15000) {
    // Forced checkmate
    whitePercent = scoreCentipawns > 0 ? 100 : 0;
  } else {
    // Standard logistic curve
    const winProb = 1 / (1 + Math.pow(10, -scoreCentipawns / 400));
    whitePercent = Math.min(98, Math.max(2, Math.round(winProb * 100)));
  }

  // Display text formatted nicely
  let scoreText = '0.0';
  if (Math.abs(scoreCentipawns) >= 15000) {
    scoreText = scoreCentipawns > 0 ? '+M' : '-M';
  } else {
    const pawns = scoreCentipawns / 100;
    const formatted = Math.abs(pawns).toFixed(1);
    scoreText = pawns > 0 ? `+${formatted}` : pawns < 0 ? `-${formatted}` : '0.0';
  }

  // If orientation is Black on bottom, invert the vertical fill
  const topPercent = orientation === 'w' ? 100 - whitePercent : whitePercent;
  const bottomPercent = orientation === 'w' ? whitePercent : 100 - whitePercent;

  return (
    <div className="relative w-7 h-full max-h-[580px] bg-slate-900 border border-slate-700/80 rounded-md overflow-hidden flex flex-col shadow-inner select-none">
      {/* Top Half (Black's side if White orientation) */}
      <div
        style={{ height: `${topPercent}%` }}
        className="w-full bg-[#2d2b28] transition-all duration-300 ease-out flex items-start justify-center pt-1.5"
      >
        {topPercent >= 20 && (
          <span className="text-[10px] font-mono font-bold text-slate-300">
            {scoreCentipawns < 0 ? scoreText : ''}
          </span>
        )}
      </div>

      {/* Bottom Half (White's side if White orientation) */}
      <div
        style={{ height: `${bottomPercent}%` }}
        className="w-full bg-[#fdfdfd] transition-all duration-300 ease-out flex items-end justify-center pb-1.5"
      >
        {bottomPercent >= 20 && (
          <span className="text-[10px] font-mono font-bold text-slate-900">
            {scoreCentipawns >= 0 ? scoreText : ''}
          </span>
        )}
      </div>
    </div>
  );
};
