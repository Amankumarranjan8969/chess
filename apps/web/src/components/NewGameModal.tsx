import React, { useState } from 'react';
import { Color, TimeControl } from '@chess/core';
import { AIDifficulty } from '../hooks/useChessAI.js';
import { Bot, Play, X, Clock, Zap } from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  initialColor: Color;
  initialDifficulty: AIDifficulty;
  onClose: () => void;
  onStartGame: (color: Color, difficulty: AIDifficulty, timeControl: TimeControl) => void;
}

const PRESET_TIMES: { label: string; sub: string; tc: TimeControl }[] = [
  { label: '1 min', sub: 'Bullet (1+0)', tc: { initialMs: 60000, incrementMs: 0 } },
  { label: '3 | 2', sub: 'Blitz (3+2)', tc: { initialMs: 180000, incrementMs: 2000 } },
  { label: '5 | 3', sub: 'Rapid (5+3)', tc: { initialMs: 300000, incrementMs: 3000 } },
  { label: '10 min', sub: 'Standard (10+0)', tc: { initialMs: 600000, incrementMs: 0 } },
];

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  initialColor,
  initialDifficulty,
  onClose,
  onStartGame,
}) => {
  const [selectedColor, setSelectedColor] = useState<Color>(initialColor);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>(initialDifficulty);
  const [selectedTimeIdx, setSelectedTimeIdx] = useState<number>(2); // 5 | 3 default

  if (!isOpen) return null;

  const handleStart = () => {
    onStartGame(
      selectedColor,
      selectedDifficulty,
      PRESET_TIMES[selectedTimeIdx].tc
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#21201d] border border-[#33302a] rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-[#edebe8]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#33302a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#739552]/25 border border-[#739552]/40 flex items-center justify-center text-[#739552]">
              <Bot size={18} />
            </div>
            <h3 className="font-bold text-base text-white">New Game vs Computer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2d2b27] text-stone-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Choose Side */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            1. Play As
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedColor('w')}
              className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                selectedColor === 'w'
                  ? 'bg-[#fdfdfd] text-[#1a1917] border-white shadow-lg'
                  : 'bg-[#262421] text-stone-300 border-[#38342e] hover:border-stone-500'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white border border-stone-400 shadow-sm" />
              White (Moves 1st)
            </button>
            <button
              onClick={() => setSelectedColor('b')}
              className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                selectedColor === 'b'
                  ? 'bg-[#161512] text-white border-stone-400 shadow-lg'
                  : 'bg-[#262421] text-stone-300 border-[#38342e] hover:border-stone-500'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#161512] border border-stone-600 shadow-sm" />
              Black (Moves 2nd)
            </button>
          </div>
        </div>

        {/* 2. Choose Difficulty */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            2. Engine Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className={`py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                  selectedDifficulty === d
                    ? 'bg-[#739552] border-[#739552] text-white shadow-md'
                    : 'bg-[#262421] border-[#38342e] text-stone-400 hover:text-stone-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Choose Time Control */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={13} />
            3. Clock Time Control
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_TIMES.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTimeIdx(idx)}
                className={`py-2 px-3 rounded-xl border text-left transition-all ${
                  selectedTimeIdx === idx
                    ? 'bg-[#739552]/20 border-[#739552] text-[#82aa5a]'
                    : 'bg-[#262421] border-[#38342e] text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="font-bold text-xs text-white flex items-center gap-1">
                  <Zap size={11} className={selectedTimeIdx === idx ? 'text-[#82aa5a]' : 'text-stone-500'} />
                  {item.label}
                </div>
                <div className="text-[10px] text-stone-500">{item.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#739552]/25 flex items-center justify-center gap-2 hover:scale-[1.02]"
        >
          <Play size={16} fill="white" /> Start Game
        </button>
      </div>
    </div>
  );
};
