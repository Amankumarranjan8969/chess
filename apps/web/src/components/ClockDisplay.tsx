import React, { useEffect, useState } from 'react';
import { ClockState, Color } from '@chess/core';

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
      className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
        isActive
          ? 'bg-slate-800 border-amber-500/50 shadow-lg shadow-amber-500/10'
          : 'bg-slate-850/60 border-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-3.5 h-3.5 rounded-full border ${
            color === 'w' ? 'bg-white border-slate-400' : 'bg-slate-900 border-slate-600'
          }`}
        />
        <div className="flex flex-col">
          <span className="font-semibold text-slate-100 text-sm">{playerName}</span>
          {materialAdvantage !== undefined && materialAdvantage > 0 && (
            <span className="text-xs font-medium text-emerald-400">+{materialAdvantage}</span>
          )}
        </div>
      </div>

      <div
        className={`px-3 py-1 rounded font-mono text-lg font-bold tracking-wider ${
          isCritical
            ? 'bg-rose-950/80 text-rose-400 animate-pulse border border-rose-500/50'
            : isLowTime
            ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
            : 'bg-slate-900/80 text-slate-200 border border-slate-700/50'
        }`}
      >
        {formatTime(displayMs)}
      </div>
    </div>
  );
};
