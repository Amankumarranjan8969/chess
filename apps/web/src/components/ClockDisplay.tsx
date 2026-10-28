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
      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
        isActive
          ? 'bg-[#262421] border-[#739552] shadow-[0_0_15px_rgba(115,149,82,0.25)] ring-1 ring-[#739552]/50'
          : 'bg-[#21201d]/90 border-[#33302a]'
      }`}
    >
      {/* Player info & live status indicator */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`w-4 h-4 rounded-full border shadow-sm ${
              color === 'w' ? 'bg-[#fdfdfd] border-stone-400' : 'bg-[#2b2723] border-stone-600'
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
            <span className="font-bold text-[#edebe8] text-sm tracking-wide">{playerName}</span>
            {isActive && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#739552]/20 text-[#82aa5a] border border-[#739552]/30 flex items-center gap-1">
                <Hourglass size={10} className="animate-spin text-[#82aa5a]" />
                Ticking
              </span>
            )}
          </div>
          {materialAdvantage !== undefined && materialAdvantage > 0 && (
            <span className="text-xs font-semibold text-[#82aa5a]">+{materialAdvantage}</span>
          )}
        </div>
      </div>

      {/* Prominent High-Contrast Timer Box */}
      <div className="flex items-center gap-2">
        <div
          className={`px-3.5 py-1.5 rounded-lg font-mono text-xl sm:text-2xl font-black tracking-widest flex items-center gap-2 transition-all ${
            isCritical
              ? 'bg-rose-950/80 text-rose-300 animate-pulse border-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : isLowTime
              ? 'bg-amber-950/70 text-amber-300 border-2 border-amber-500/60'
              : isActive
              ? 'bg-[#161512] text-[#edebe8] border-2 border-[#739552] shadow-inner'
              : 'bg-[#161512]/80 text-stone-400 border border-[#33302a]'
          }`}
        >
          <Clock
            size={16}
            className={isActive ? 'text-[#739552] animate-pulse' : 'text-stone-500'}
          />
          <span>{formatTime(displayMs)}</span>
        </div>
      </div>
    </div>
  );
};
