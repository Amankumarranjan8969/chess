import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext.js';
import { Lesson } from '../types/platform.js';
import {
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Compass,
  Eye,
  Target,
  BrainCircuit,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export const LearnStudio: React.FC = () => {
  const { lessons, completeLesson, user, navigateTo } = usePlatform();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'explorer' | 'vision' | 'insights'>('curriculum');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert'>('all');
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0]);

  // Vision drill state
  const [visionTarget, setVisionTarget] = useState<string>('e4');
  const [visionScore, setVisionScore] = useState<number>(0);
  const [visionFeedback, setVisionFeedback] = useState<string | null>(null);

  // Opening explorer state
  const [searchECO, setSearchECO] = useState<string>('');

  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);

  const filteredLessons = lessons.filter(
    (l) => selectedLevel === 'all' || l.level === selectedLevel
  );

  const handleSquareClick = (square: string) => {
    if (square === visionTarget) {
      setVisionScore((prev) => prev + 1);
      setVisionFeedback('Correct! +1 point');
      // Pick next random square
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
      const nextSquare = `${files[Math.floor(Math.random() * 8)]}${ranks[Math.floor(Math.random() * 8)]}`;
      setVisionTarget(nextSquare);
    } else {
      setVisionFeedback(`Missed! You clicked ${square}, target was ${visionTarget}.`);
    }
  };

  const OPENING_DATABASE = [
    { eco: 'C50', name: 'Italian Game', moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4', winRate: 'White 53%' },
    { eco: 'B90', name: 'Sicilian Defense: Najdorf', moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6', winRate: 'Black 51%' },
    { eco: 'D35', name: 'Queen’s Gambit Declined: Exchange', moves: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5', winRate: 'White 56%' },
    { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6', winRate: 'Draw 58%' },
    { eco: 'E60', name: 'King’s Indian Defense', moves: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7', winRate: 'White 52%' },
    { eco: 'B12', name: 'Caro-Kann Defense: Advance', moves: '1. e4 c6 2. d4 d5 3. e5', winRate: 'White 54%' },
  ];

  const filteredOpenings = OPENING_DATABASE.filter(
    (o) =>
      o.name.toLowerCase().includes(searchECO.toLowerCase()) ||
      o.eco.toLowerCase().includes(searchECO.toLowerCase())
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* 1. LEARNING DASHBOARD HEADER */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 text-stone-900 dark:text-white rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-900/40">
            🎓
          </div>
          <div>
            <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight">
              Chess Learning Academy
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-lg">
              Structured progressive curriculum from beginner fundamentals to master calculation, prophylaxis, and technical conversion.
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-4 flex items-center gap-5 shadow-xs">
          <div>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
              Curriculum Mastery
            </span>
            <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {progressPercent}% Complete
            </div>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              {completedCount} of {lessons.length} Lessons Finished
            </span>
          </div>

          <div className="w-16 h-16 rounded-full border-4 border-stone-200 dark:border-stone-700 border-t-[#739552] flex items-center justify-center font-bold text-xs">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* 2. SUB-SECTION TABS */}
      <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl text-xs font-bold border border-stone-200 dark:border-stone-700 w-fit shadow-xs">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'curriculum'
              ? 'bg-[#739552] text-white shadow-sm'
              : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white dark:hover:bg-stone-700'
          }`}
        >
          <BookOpen size={14} /> Curriculum Path
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'explorer'
              ? 'bg-[#739552] text-white shadow-sm'
              : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white dark:hover:bg-stone-700'
          }`}
        >
          <Compass size={14} /> Opening Explorer
        </button>
        <button
          onClick={() => setActiveTab('vision')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'vision'
              ? 'bg-[#739552] text-white shadow-sm'
              : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white dark:hover:bg-stone-700'
          }`}
        >
          <Eye size={14} /> Vision Trainer
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'insights'
              ? 'bg-[#739552] text-white shadow-sm'
              : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white dark:hover:bg-stone-700'
          }`}
        >
          <BrainCircuit size={14} /> Personal Insights
        </button>
      </div>

      {/* 3. CONTENT AREAS */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Lessons List */}
          <div className="flex flex-col gap-4">
            {/* Level Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'beginner', 'intermediate', 'advanced', 'expert'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    selectedLevel === lvl
                      ? 'bg-[#739552] text-white shadow-sm'
                      : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredLessons.map((l) => {
                const isSelected = selectedLesson.id === l.id;

                return (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLesson(l)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                      isSelected
                        ? 'bg-[#739552]/10 border-[#739552] ring-1 ring-[#739552]/40'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 shadow-xs">
                          {l.level}
                        </span>
                        {l.completed ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 size={13} /> Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-stone-400">
                            <Clock size={12} /> {l.durationMinutes} min
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 mt-2">
                        {l.title}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                        {l.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#739552]">
                      <span>{isSelected ? 'Currently Viewing' : 'Select Lesson'}</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lesson Study Inspector */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="text-xs font-bold text-[#739552] uppercase tracking-wider">
                {selectedLesson.category}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                {selectedLesson.durationMinutes} mins study
              </span>
            </div>

            <div>
              <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {selectedLesson.title}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                {selectedLesson.description}
              </p>
            </div>

            {/* Key Objectives */}
            <div className="flex flex-col gap-2 bg-white dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Key Learning Objectives
              </span>
              {selectedLesson.objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-200">
                  <span className="text-[#739552] font-bold">✓</span>
                  <span>{obj}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => completeLesson(selectedLesson.id)}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  selectedLesson.completed
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700 cursor-default'
                    : 'bg-[#739552] hover:bg-[#648346] text-white'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{selectedLesson.completed ? 'Lesson Completed' : 'Mark Lesson Complete'}</span>
              </button>

              <button
                onClick={() => navigateTo('puzzles')}
                className="w-full py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>Practice Associated Puzzles</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opening Explorer Tab */}
      {activeTab === 'explorer' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Compass size={18} className="text-[#739552]" /> Opening Database & Master Repertoire
              </h2>
              <p className="text-xs text-stone-400">
                Explore standard opening lines, ECO codes, and master tournament statistics
              </p>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={searchECO}
                onChange={(e) => setSearchECO(e.target.value)}
                placeholder="Search opening or ECO..."
                className="pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#739552]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">ECO</th>
                  <th className="py-2.5 px-3">Opening Name</th>
                  <th className="py-2.5 px-3">Standard Line</th>
                  <th className="py-2.5 px-3 text-right">Master Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                {filteredOpenings.map((o) => (
                  <tr key={o.eco} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#739552]">{o.eco}</td>
                    <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">{o.name}</td>
                    <td className="py-3 px-3 font-mono text-stone-600 dark:text-stone-300">{o.moves}</td>
                    <td className="py-3 px-3 text-right font-bold text-stone-700 dark:text-stone-300">
                      {o.winRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vision Coordinate Speed Drill */}
      {activeTab === 'vision' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col items-center gap-4 text-center">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center justify-center gap-2">
              <Eye size={18} className="text-[#739552]" /> Board Vision & Coordinate Speed Drill
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Click the target square as quickly as possible to build instant board visualization
            </p>
          </div>

          {/* Target Square Display */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-6 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Click Target Square
              </span>
              <div className="text-3xl font-mono font-extrabold text-[#739552]">
                {visionTarget.toUpperCase()}
              </div>
            </div>
            <div className="w-px h-10 bg-stone-200 dark:bg-stone-700" />
            <div>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Score
              </span>
              <div className="text-3xl font-mono font-extrabold text-stone-900 dark:text-stone-100">
                {visionScore}
              </div>
            </div>
          </div>

          {visionFeedback && (
            <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {visionFeedback}
            </div>
          )}

          {/* Interactive 8x8 Grid for Vision Drill */}
          <div className="w-[320px] aspect-square grid grid-cols-8 grid-rows-8 border-2 border-stone-800 rounded-xl overflow-hidden shadow-md">
            {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank, rIdx) =>
              ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, fIdx) => {
                const sq = `${file}${rank}`;
                const isLight = (rIdx + fIdx) % 2 === 0;

                return (
                  <button
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    className={`flex items-center justify-center font-mono text-[9px] font-bold transition-all hover:opacity-80 active:scale-95 ${
                      isLight ? 'bg-[#ebecd0] text-stone-700' : 'bg-[#739552] text-white'
                    }`}
                  >
                    {sq}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Personal Insights */}
      {activeTab === 'insights' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <BrainCircuit size={18} className="text-[#739552]" /> Player Tactical & Strategic Diagnosis
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Automated diagnosis synthesized from your actual match reviews and puzzle attempts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Tactical Strength
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                High precision in <strong>King and Pawn endgames</strong> (94% accuracy). You consistently calculate passed pawn races correctly.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Recurring Inaccuracy
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                Slight delay in castling on move 6-9 in open Sicilian structures, exposing your king to center pawn lever breaks.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles size={14} /> Next Improvement Target
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                Study <strong>Rook bridge construction (Lucena Position)</strong> to elevate your endgame conversion win rate above 1600 Elo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
