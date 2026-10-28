import React from 'react';
import { ClockState, Color } from '@chess/core';
import { Clock, Hourglass } from 'lucide-react';

interface ClockDisplayProps {
  color: Color;
  playerName: string;
  clockState?: ClockState;
  isActive: boolean;
  materialAdvantage?: number;
}

export const ClockDisplay: React.FC<ClockDisplayProps> = ({
  color,
  playerName,
  clockState,
  isActive,
  materialAdvantage,
}) => {
  const displayMs = clockState
    ? color === 'w'
      ? clockState.whiteRemainingMs
      : clockState.blackRemainingMs
    : 0;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0 && seconds < 10) {
      const tenths = Math.floor((ms % 1000) / 100);
      return `${seconds}.${tenths}`;
    }

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isLowTime = displayMs < 30000 && displayMs > 0;
  const isCritical = displayMs < 10000 && displayMs > 0;

  return (
    <div
      className={`flex items-center justify-between px-3 py-1.5 rounded-xl border transition-all duration-150 shadow-sm ${
        isActive
          ? 'bg-[#f7fbf3] border-[#739552] ring-2 ring-[#739552]/30 shadow-md'
          : 'bg-white border-stone-200'
      }`}
    >
      {/* Player info & live status indicator */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className={`w-3.5 h-3.5 rounded-full border shadow-sm ${
              color === 'w' ? 'bg-white border-stone-400' : 'bg-[#292524] border-stone-700'
            }`}
          />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#739552] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#739552]"></span>
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-900 text-xs tracking-tight truncate max-w-[110px]">
              {playerName}
            </span>
            {isActive && (
              <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-[#739552]/15 text-[#5f7d41] border border-[#739552]/30 flex items-center gap-0.5">
                <Hourglass size={8} className="animate-spin text-[#739552]" />
                Live
              </span>
            )}
          </div>
          {materialAdvantage !== undefined && materialAdvantage > 0 && (
            <span className="text-[10px] font-bold text-[#5f7d41]">+{materialAdvantage}</span>
          )}
        </div>
      </div>

      {/* Compact High-Contrast Timer Box */}
      <div className="flex items-center gap-1.5">
        <div
          className={`px-2.5 py-1 rounded-lg font-mono text-base sm:text-lg font-black tracking-wider flex items-center gap-1.5 transition-all ${
            isCritical
              ? 'bg-rose-50 text-rose-600 animate-pulse border border-rose-500 shadow-sm'
              : isLowTime
              ? 'bg-amber-50 text-amber-700 border border-amber-500'
              : isActive
              ? 'bg-white text-stone-900 border-2 border-[#739552] shadow-sm'
              : 'bg-stone-50 text-stone-600 border border-stone-200'
          }`}
        >
          <Clock
            size={13}
            className={isActive ? 'text-[#739552] animate-pulse' : 'text-stone-400'}
          />
          <span>{formatTime(displayMs)}</span>
        </div>
      </div>
    </div>
  );
};
