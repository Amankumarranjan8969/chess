import React, { useState } from 'react';
import { Color, TimeControl } from '@chess/core';
import { AIDifficulty } from '../hooks/useChessAI.js';
import { Bot, Play, X, Clock, Zap, Flame, Award } from 'lucide-react';

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

const DIFFICULTY_LEVELS: { id: AIDifficulty; label: string; elo: string; icon?: React.ReactNode; isGrandmaster?: boolean }[] = [
  { id: 'easy', label: 'Easy', elo: '~1000' },
  { id: 'medium', label: 'Medium', elo: '~1500' },
  { id: 'hard', label: 'Hard', elo: '~1950' },
  { id: 'grandmaster', label: 'Super Hard', elo: '~2400+', isGrandmaster: true },
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
  const [selectedTimeIdx, setSelectedTimeIdx] = useState<number>(2);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#739552]/15 border border-[#739552]/30 flex items-center justify-center text-[#739552]">
              <Bot size={18} />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">New Game vs Computer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Choose Side */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            1. Play As
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedColor('w')}
              className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                selectedColor === 'w'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-md'
                  : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white border border-stone-400 shadow-sm" />
              White (First Move)
            </button>
            <button
              onClick={() => setSelectedColor('b')}
              className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                selectedColor === 'b'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-md'
                  : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-stone-900 border border-stone-600 shadow-sm" />
              Black (Second Move)
            </button>
          </div>
        </div>

        {/* 2. Choose Difficulty */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            2. Engine Difficulty
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTY_LEVELS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedDifficulty(item.id)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 shadow-xs ${
                  selectedDifficulty === item.id
                    ? item.isGrandmaster
                      ? 'bg-gradient-to-br from-amber-600 to-rose-600 border-amber-600 text-white shadow-md ring-2 ring-amber-400/50'
                      : 'bg-[#739552] border-[#739552] text-white shadow-sm'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                <div className="flex items-center gap-1 font-extrabold">
                  {item.isGrandmaster && <Flame size={12} className={selectedDifficulty === item.id ? 'text-yellow-200' : 'text-amber-600'} />}
                  <span>{item.label}</span>
                </div>
                <div
                  className={`text-[10px] font-medium ${
                    selectedDifficulty === item.id
                      ? item.isGrandmaster ? 'text-amber-100' : 'text-stone-100'
                      : 'text-stone-400'
                  }`}
                >
                  {item.elo}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Choose Time Control */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={13} />
            3. Time Control
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_TIMES.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTimeIdx(idx)}
                className={`py-2 px-3 rounded-xl border text-left transition-all shadow-xs ${
                  selectedTimeIdx === idx
                    ? 'bg-[#739552]/10 border-[#739552] text-[#5f7d41] dark:text-[#8bc75a]'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                <div className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1">
                  <Zap size={11} className={selectedTimeIdx === idx ? 'text-[#739552]' : 'text-stone-400'} />
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
          className="w-full py-3.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
        >
          <Play size={16} fill="white" /> Start Game
        </button>
      </div>
    </div>
  );
};
