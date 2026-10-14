import React from 'react';
import { Flame, Zap, ShieldAlert, Award, Sparkles, Timer, Brain, ArrowUpRight, Target } from 'lucide-react';
import { RevisionMetrics } from '../../services/revisionQueueService';

interface CyberpunkHudProps {
  metrics: RevisionMetrics;
  onLaunchMode?: (mode: 'flashcards' | 'aptitude' | 'knowledge') => void;
  activeMode?: string;
  className?: string;
}

export const CyberpunkHud: React.FC<CyberpunkHudProps> = ({
  metrics,
  onLaunchMode,
  activeMode = 'flashcards',
  className = ''
}) => {
  return (
    <div className={`bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 font-sans ${className}`}>
      
      {/* Top Row: Brand & Gamification Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        
        {/* Left: Identity & Rank */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/10">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                {metrics.rankTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                {metrics.totalXp} XP
              </span>
            </div>

            {/* Next Rank Progress Bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 sm:w-44 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${metrics.nextRankProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Next: {metrics.nextRankTitle} ({metrics.nextRankProgress}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Streak & Due Panic Indicators */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Active Streak */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-950/40 border border-amber-500/30 shadow-inner">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />
            <div>
              <p className="text-[9px] font-mono uppercase font-bold text-amber-400">Revision Streak</p>
              <p className="text-sm font-black font-mono text-amber-300 leading-none">
                {metrics.currentStreak} {metrics.currentStreak === 1 ? 'Day' : 'Days'}
              </p>
            </div>
          </div>

          {/* Due Today Panic Badge */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border shadow-inner ${
            metrics.dueTodayCount > 0 
              ? 'bg-rose-950/50 border-rose-500/40 text-rose-300 animate-pulse' 
              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          }`}>
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-[9px] font-mono uppercase font-bold">
                {metrics.dueTodayCount > 0 ? 'Due For Vaccine' : 'Queue Cleared'}
              </p>
              <p className="text-sm font-black font-mono leading-none">
                {metrics.dueTodayCount} Cards
              </p>
            </div>
          </div>

          {/* Mastered Count */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-[9px] font-mono uppercase font-bold text-indigo-400">Mastered</p>
              <p className="text-sm font-black font-mono leading-none">
                {metrics.masteredCount} Cards
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Row: Quick Mode Switchers */}
      {onLaunchMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          
          {/* Mode 1: Priority Queue */}
          <button
            onClick={() => onLaunchMode('flashcards')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group ${
              activeMode === 'flashcards'
                ? 'bg-cyan-950/70 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                <Zap size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  Active Recall Cards
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                    +{metrics.totalCards}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">SM2 Spaced Repetition</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>

          {/* Mode 2: Aptitude Speed Sprint */}
          <button
            onClick={() => onLaunchMode('aptitude')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group ${
              activeMode === 'aptitude'
                ? 'bg-amber-950/70 border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <Timer size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  Aptitude Speed Sprint
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">
                    90s
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Hesitation & Time-Sink Drill</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          </button>

          {/* Mode 3: Knowledge Feynman Sprint */}
          <button
            onClick={() => onLaunchMode('knowledge')}
            className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group ${
              activeMode === 'knowledge'
                ? 'bg-purple-950/70 border-purple-500/60 shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Brain size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  Knowledge Feynman Drill
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800">
                    Deep
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Distractor & Concept Defense</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
          </button>

        </div>
      )}

    </div>
  );
};