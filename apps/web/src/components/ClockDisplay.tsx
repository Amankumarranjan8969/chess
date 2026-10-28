import React, { useEffect, useState } from 'react';
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
  const [displayMs, setDisplayMs] = useState<number>(() => {
    if (!clockState) return 0;
    return color === 'w' ? clockState.whiteRemainingMs : clockState.blackRemainingMs;
  });

  useEffect(() => {
    if (!clockState) return;

    const baseMs = color === 'w' ? clockState.whiteRemainingMs : clockState.blackRemainingMs;

    if (!isActive || clockState.isPaused || !clockState.turnStartedAtMs) {
      setDisplayMs(baseMs);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.max(0, Date.now() - (clockState.turnStartedAtMs || Date.now()));
      const remaining = Math.max(0, baseMs - elapsed);
      setDisplayMs(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [clockState, isActive, color]);

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
      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 shadow-sm ${
        isActive
          ? 'bg-[#f7fbf3] border-[#739552] ring-2 ring-[#739552]/30 shadow-md'
          : 'bg-white border-stone-200'
      }`}
    >
      {/* Player info & live status indicator */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`w-4 h-4 rounded-full border shadow-sm ${
              color === 'w' ? 'bg-white border-stone-400' : 'bg-[#292524] border-stone-700'
            }`}
          />
          {isActive && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#739552] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#739552]"></span>
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 text-sm tracking-tight">{playerName}</span>
            {isActive && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#739552]/15 text-[#5f7d41] border border-[#739552]/30 flex items-center gap-1">
                <Hourglass size={10} className="animate-spin text-[#739552]" />
                Live
              </span>
            )}
          </div>
          {materialAdvantage !== undefined && materialAdvantage > 0 && (
            <span className="text-xs font-bold text-[#5f7d41]">+{materialAdvantage}</span>
          )}
        </div>
      </div>

      {/* Prominent High-Contrast Timer Box */}
      <div className="flex items-center gap-2">
        <div
          className={`px-3.5 py-1.5 rounded-lg font-mono text-xl sm:text-2xl font-black tracking-wider flex items-center gap-2 transition-all ${
            isCritical
              ? 'bg-rose-50 text-rose-600 animate-pulse border-2 border-rose-500 shadow-md'
              : isLowTime
              ? 'bg-amber-50 text-amber-700 border-2 border-amber-500'
              : isActive
              ? 'bg-white text-stone-900 border-2 border-[#739552] shadow-sm'
              : 'bg-stone-50 text-stone-600 border border-stone-200'
          }`}
        >
          <Clock
            size={16}
            className={isActive ? 'text-[#739552] animate-pulse' : 'text-stone-400'}
          />
          <span>{formatTime(displayMs)}</span>
        </div>
      </div>
    </div>
  );
};
