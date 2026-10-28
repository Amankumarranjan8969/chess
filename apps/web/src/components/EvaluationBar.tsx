import React from 'react';
import { Color } from '@chess/core';

interface EvaluationBarProps {
  scoreCentipawns: number;
  isCheckmate?: boolean;
  orientation: Color;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  scoreCentipawns,
  isCheckmate = false,
  orientation,
}) => {
  let whitePercent = 50;

  if (Math.abs(scoreCentipawns) >= 15000) {
    whitePercent = scoreCentipawns > 0 ? 100 : 0;
  } else {
    const winProb = 1 / (1 + Math.pow(10, -scoreCentipawns / 400));
    whitePercent = Math.min(98, Math.max(2, Math.round(winProb * 100)));
  }

  let scoreText = '0.0';
  if (Math.abs(scoreCentipawns) >= 15000) {
    scoreText = scoreCentipawns > 0 ? '+M' : '-M';
  } else {
    const pawns = scoreCentipawns / 100;
    const formatted = Math.abs(pawns).toFixed(1);
    scoreText = pawns > 0 ? `+${formatted}` : pawns < 0 ? `-${formatted}` : '0.0';
  }

  const topPercent = orientation === 'w' ? 100 - whitePercent : whitePercent;
  const bottomPercent = orientation === 'w' ? whitePercent : 100 - whitePercent;

  return (
    <div className="relative w-7 h-full max-h-[600px] bg-[#161512] border border-[#33302a] rounded-lg overflow-hidden flex flex-col shadow-inner select-none">
      {/* Top Half (Black side if White orientation) */}
      <div
        style={{ height: `${topPercent}%` }}
        className="w-full bg-[#2b2723] transition-all duration-300 ease-out flex items-start justify-center pt-2"
      >
        {topPercent >= 18 && (
          <span className="text-[10px] font-mono font-black text-stone-300">
            {scoreCentipawns < 0 ? scoreText : ''}
          </span>
        )}
      </div>

      {/* Bottom Half (White side if White orientation) */}
      <div
        style={{ height: `${bottomPercent}%` }}
        className="w-full bg-[#fdfdfd] transition-all duration-300 ease-out flex items-end justify-center pb-2"
      >
        {bottomPercent >= 18 && (
          <span className="text-[10px] font-mono font-black text-[#1a1917]">
            {scoreCentipawns >= 0 ? scoreText : ''}
          </span>
        )}
      </div>
    </div>
  );
};
