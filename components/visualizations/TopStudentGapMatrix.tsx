import React, { useState } from 'react';
import { 
  Clock, AlertTriangle, ShieldAlert, Sparkles, Zap, 
  ArrowRight, CheckCircle2, ChevronRight, Target, BarChart2,
  TrendingUp, Award, Flame, Play, Eye
} from 'lucide-react';
import type { QuestionLog } from '../../types';
import { useGapAnalytics, SubjectFilter } from '../../hooks/useGapAnalytics';
import { SUBJECT_CONFIG } from '../../constants';

interface TopStudentGapMatrixProps {
  logs: QuestionLog[];
  onSelectQuestion?: (log: QuestionLog) => void;
  className?: string;
}

export const TopStudentGapMatrix: React.FC<TopStudentGapMatrixProps> = ({
  logs,
  onSelectQuestion,
  className = ''
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectFilter>('all');
  const [activeDrillTab, setActiveDrillTab] = useState<'careless' | 'traps' | 'slowest'>('careless');

  const analytics = useGapAnalytics(logs, selectedSubject);
  const { timeLiabilities, leakBreakdown, subjectDeltas, overall, strategicPriorities } = analytics;

  return (
    <div className={`bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl text-slate-100 space-y-7 font-sans ${className}`}>
      
      {/* Top Header & Cyberpunk Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                Top-Student Gap Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Telemetry HUD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies execution liabilities, distractor traps, and recoverable marks against top-tier cohorts
            </p>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl self-start md:self-auto">
          {(['all', 'physics', 'chemistry', 'maths'] as SubjectFilter[]).map((subj) => {
            const isActive = selectedSubject === subj;
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold capitalize transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {subj}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 1: 4 High-Impact Telemetry HUD Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Time Liability Counter (Neon Amber) */}
        <div className="p-5 rounded-2xl bg-surface/90 border border-amber-500/30 shadow-lg relative overflow-hidden group hover:border-amber-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Time Liability
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-500/30">
              {timeLiabilities.hesitationCount} Stalls
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono text-amber-300">
              {timeLiabilities.totalMinutesWasted}
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase">mins lost</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            Overhead spent on questions beyond global peer solving speed
          </p>
        </div>

        {/* Card 2: Careless Leak Radar (Panic Red) */}
        <div className="p-5 rounded-2xl bg-surface/90 border border-rose-500/30 shadow-lg relative overflow-hidden group hover:border-rose-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" /> Careless Radar
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-500/30">
              -{leakBreakdown.carelessMarksLost} Marks
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono text-rose-300">
              {leakBreakdown.carelessCount}
            </span>
            <span className="text-xs font-bold text-rose-400 uppercase">Leaks</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            Missed high-accuracy questions (peer success &ge; 70%)
          </p>
        </div>

        {/* Card 3: Distractor Trap Alert (Electric Purple) */}
        <div className="p-5 rounded-2xl bg-surface/90 border border-purple-500/30 shadow-lg relative overflow-hidden group hover:border-purple-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-400" /> Distractor Traps
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/30">
              {leakBreakdown.distractorCount} Trapped
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono text-purple-300">
              {leakBreakdown.distractorCount}
            </span>
            <span className="text-xs font-bold text-purple-400 uppercase">Tricks Hit</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            Fell for the most common platform trick distractor option
          </p>
        </div>

        {/* Card 4: Marks on Table (Emerald Glow) */}
        <div className="p-5 rounded-2xl bg-surface/90 border border-emerald-500/30 shadow-lg relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Left On Table
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              Recoverable
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono text-emerald-300">
              +{overall.totalMarksOnTable}
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase">Marks</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            Total of negative penalty marks + unattempted easy/medium questions
          </p>
        </div>

      </div>

      {/* Row 2: Dual Analytics & Split Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Subject Accuracy vs Top 10% Cohort (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface-2 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Subject Gap vs Top 10% Cohort
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Benchmark: Top Tier</span>
          </div>

          <div className="space-y-4 pt-1">
            {(['physics', 'chemistry', 'maths'] as const).map(subj => {
              const delta = subjectDeltas[subj];
              const config = SUBJECT_CONFIG[subj];
              const colorClass = subj === 'physics' ? 'bg-cyan-500' : subj === 'chemistry' ? 'bg-emerald-500' : 'bg-indigo-500';

              return (
                <div key={subj} className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white capitalize flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                      {config.name}
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-400">
                        You: <strong className="text-white">{delta.userAccuracy}%</strong>
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">
                        Top 10%: <strong className="text-cyan-300">{delta.topTierBenchmarkAccuracy}%</strong>
                      </span>
                      {delta.accuracyGap > 0 && (
                        <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded text-[10px] border border-rose-500/30">
                          -{delta.accuracyGap}% Gap
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual Comparison Progress Bar */}
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative">
                    {/* Top Tier Benchmark ghost bar */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-slate-700/60 rounded-full border-r-2 border-cyan-400/80"
                      style={{ width: `${Math.min(100, delta.topTierBenchmarkAccuracy)}%` }}
                    />
                    {/* User actual bar */}
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${Math.min(100, delta.userAccuracy)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>Attempted: {delta.attempted} ({delta.correct} Correct, {delta.wrong} Wrong)</span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      +{delta.totalMarksOnTable} marks left on table
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Aptitude Leak vs. Knowledge Deficit Split (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface-2 border border-slate-800 flex flex-col justify-between shadow-xl space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Error Archetype Split
                </h3>
              </div>
              <span className="text-[11px] text-amber-400 font-mono">Execution vs Concept</span>
            </div>

            {/* Split Progress Visualizer */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Flame size={14} /> Aptitude Leak: {leakBreakdown.aptitudeRatio}%
                </span>
                <span className="text-purple-400 flex items-center gap-1.5">
                  Knowledge Gap: {leakBreakdown.knowledgeRatio}% <Target size={14} />
                </span>
              </div>

              {/* Dual Color Segmented Bar */}
              <div className="w-full h-4 rounded-xl overflow-hidden flex bg-slate-800 p-0.5 border border-slate-700 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-l-lg transition-all duration-500"
                  style={{ width: `${leakBreakdown.aptitudeRatio}%` }}
                />
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-r-lg transition-all duration-500"
                  style={{ width: `${leakBreakdown.knowledgeRatio}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[11px] pt-1">
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-300">
                  <p className="font-bold uppercase text-[10px]">Speed / Execution</p>
                  <p className="text-xs font-mono font-bold">{leakBreakdown.carelessCount} Silly + {leakBreakdown.timeSinksCount} Stalls</p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300">
                  <p className="font-bold uppercase text-[10px]">Conceptual Gaps</p>
                  <p className="text-xs font-mono font-bold">{leakBreakdown.distractorCount} Traps + {leakBreakdown.knowledgeDeficitCount} Hard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Recommendation Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {leakBreakdown.aptitudeRatio >= 50 ? (
              <p>
                <strong className="text-amber-400">⚡ Execution is your primary bottleneck:</strong> More than {leakBreakdown.aptitudeRatio}% of your dropped marks come from silly mistakes and pacing stalls rather than concept deficits. Timed sprint drills will yield immediate score jumps.
              </p>
            ) : (
              <p>
                <strong className="text-purple-400">🧠 Conceptual depth is your primary bottleneck:</strong> {leakBreakdown.knowledgeRatio}% of dropped marks stem from distractor traps and complex topics. Focused theory revision and error dissection will plug these leaks.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Interactive Gap Question Drill-Down */}
      <div className="p-6 rounded-2xl bg-surface-2 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" /> Telemetry Question Drill-Down
            </h3>
            <p className="text-xs text-slate-400">Inspect the exact questions responsible for your score leaks</p>
          </div>

          {/* Drill Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveDrillTab('careless')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDrillTab === 'careless'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              Careless Leaks ({leakBreakdown.carelessCount})
            </button>
            <button
              onClick={() => setActiveDrillTab('traps')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDrillTab === 'traps'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              Distractor Traps ({leakBreakdown.distractorCount})
            </button>
            <button
              onClick={() => setActiveDrillTab('slowest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDrillTab === 'slowest'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              Top 5 Time Sinks ({timeLiabilities.slowestQuestions.length})
            </button>
          </div>
        </div>

        {/* Drill-down Question Cards List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
          {activeDrillTab === 'careless' && (
            leakBreakdown.carelessLeaks.length > 0 ? (
              leakBreakdown.carelessLeaks.map((q, idx) => (
                <div 
                  key={q.questionId || idx}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/20 hover:border-rose-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-rose-950 text-rose-300 font-mono font-bold text-xs flex items-center justify-center border border-rose-500/30 shrink-0">
                      Q{q.questionNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{q.topic}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {q.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-400 mt-0.5 font-mono">
                        {q.peerCorrectPct}% of peers solved this correctly • Reason: {q.reasonForError}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-1 rounded border border-rose-500/30">
                      -{q.marksLost} Marks
                    </span>
                    {onSelectQuestion && (
                      <button 
                        onClick={() => onSelectQuestion(logs.find(l => l.questionNumber === q.questionNumber && l.subject === q.subject) || logs[0])}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Reattempt Question"
                      >
                        <Play size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No careless leaks detected in this view! High accuracy maintained.
              </div>
            )
          )}

          {activeDrillTab === 'traps' && (
            leakBreakdown.distractorTraps.length > 0 ? (
              leakBreakdown.distractorTraps.map((q, idx) => (
                <div 
                  key={q.questionId || idx}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-purple-950 text-purple-300 font-mono font-bold text-xs flex items-center justify-center border border-purple-500/30 shrink-0">
                      Q{q.questionNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{q.topic}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                          {q.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-300 mt-0.5 font-mono">
                        Selected: <strong className="text-rose-400">{q.userAnswer || 'Distractor'}</strong> vs Correct: <strong className="text-emerald-400">{q.correctAnswer || 'Key'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-1 rounded border border-purple-500/30">
                      Trap Hit
                    </span>
                    {onSelectQuestion && (
                      <button 
                        onClick={() => onSelectQuestion(logs.find(l => l.questionNumber === q.questionNumber && l.subject === q.subject) || logs[0])}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Reattempt Question"
                      >
                        <Play size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No major distractor traps identified in this scope.
              </div>
            )
          )}

          {activeDrillTab === 'slowest' && (
            timeLiabilities.slowestQuestions.length > 0 ? (
              timeLiabilities.slowestQuestions.map((q, idx) => (
                <div 
                  key={q.questionId || idx}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-950 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                      Q{q.questionNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{q.topic}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {q.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Time: <strong className="text-amber-300">{q.userTimeSec}s</strong> (Peer Avg: {q.peerTimeSec}s) • <span className="text-rose-400">+{q.deltaSec}s Delay</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-1 rounded border border-amber-500/30">
                      +{Math.round(q.deltaSec / 60)}m Overdue
                    </span>
                    {onSelectQuestion && (
                      <button 
                        onClick={() => onSelectQuestion(logs.find(l => l.questionNumber === q.questionNumber && l.subject === q.subject) || logs[0])}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Reattempt Question"
                      >
                        <Play size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Pacing is optimal. No severe time sink questions detected.
              </div>
            )
          )}
        </div>
      </div>

      {/* Row 4: Strategic Action HUD (3 Deterministic Sprint Priorities) */}
      <div className="p-6 rounded-2xl bg-surface-2 border border-cyan-500/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Strategic Action HUD: Top 3 Sprint Priorities
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            Deterministic Next Steps
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategicPriorities.map((item, index) => (
            <div 
              key={item.id || index}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/30">
                    #{item.rank}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    +{item.impactScore} Potential
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {item.recommendation}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                <span>Target: {item.topic}</span>
                <ChevronRight size={14} className="text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
