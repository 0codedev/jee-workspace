// ============================================================================
// Time-Per-Mark Efficiency Optimizer (Full-Page Component)
// Question Speed Telemetry, Mark Velocity & Strategic "Leave-It" Heuristic Card
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
    Gauge, Clock, AlertTriangle, ArrowRight, Zap, Copy, Check, 
    Filter, Search, Award, ShieldAlert, Sparkles, TrendingUp,
    CheckCircle2, Compass, BarChart2, Layers, Info, RotateCcw, 
    HelpCircle, Eye, ChevronRight
} from 'lucide-react';
import { 
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, 
    ZAxis, Tooltip, Cell, ReferenceLine 
} from 'recharts';
import { QuestionLog, UserProfile, ChapterEfficiency, EfficiencyQuadrant } from '../types';
import { 
    computeAllChapterEfficiencies, 
    computeTimeLeakageReport, 
    generatePersonalizedStrategyCard,
    simulateCustomTimeBudget 
} from '../services/efficiencyOptimizer';
import { Modal } from './ui/Modal';

interface EfficiencyOptimizerProps {
    questionLogs: QuestionLog[];
    userProfile: UserProfile;
    setView?: (view: any) => void;
}

const QUADRANT_COLORS: Record<EfficiencyQuadrant, { bg: string; border: string; text: string; dot: string; label: string }> = {
    goldmine: {
        bg: 'bg-emerald-950/60',
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
        dot: '#10b981',
        label: 'Goldmine (Fast & Accurate)'
    },
    time_eater: {
        bg: 'bg-amber-950/60',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        dot: '#f59e0b',
        label: 'Time Eater (Accurate but Slow)'
    },
    guess_trap: {
        bg: 'bg-orange-950/60',
        border: 'border-orange-500/40',
        text: 'text-orange-400',
        dot: '#f97316',
        label: 'Guess Trap (Fast but Inaccurate)'
    },
    disaster: {
        bg: 'bg-rose-950/60',
        border: 'border-rose-500/40',
        text: 'text-rose-400',
        dot: '#f43f5e',
        label: 'Disaster Zone (Slow & Inaccurate)'
    }
};

export const EfficiencyOptimizer: React.FC<EfficiencyOptimizerProps> = ({
    questionLogs,
    userProfile,
    setView
}) => {
    const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Maths'>('All');
    const [selectedQuadrant, setSelectedQuadrant] = useState<'All' | EfficiencyQuadrant>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [examType, setExamType] = useState<'JEE Mains' | 'JEE Advanced'>('JEE Mains');
    const [copiedCard, setCopiedCard] = useState(false);
    const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

    // Strategy Simulator State (minutes per subject)
    const [customPhysicsTime, setCustomPhysicsTime] = useState(55);
    const [customChemistryTime, setCustomChemistryTime] = useState(45);
    const [customMathsTime, setCustomMathsTime] = useState(65);

    // Compute efficiency metrics
    const allEfficiencies = useMemo(() => {
        return computeAllChapterEfficiencies(questionLogs, examType);
    }, [questionLogs, examType]);

    const timeLeakReport = useMemo(() => {
        return computeTimeLeakageReport(questionLogs);
    }, [questionLogs]);

    const strategyCard = useMemo(() => {
        return generatePersonalizedStrategyCard(allEfficiencies, examType);
    }, [allEfficiencies, examType]);

    // Simulated Time Budget Impact
    const simulatedYield = useMemo(() => {
        return simulateCustomTimeBudget(
            { physics: customPhysicsTime, chemistry: customChemistryTime, maths: customMathsTime },
            allEfficiencies,
            examType
        );
    }, [customPhysicsTime, customChemistryTime, customMathsTime, allEfficiencies, examType]);

    const totalAllocatedMinutes = customPhysicsTime + customChemistryTime + customMathsTime;
    const remainingBufferMinutes = 180 - totalAllocatedMinutes;

    // Filtered list for table and scatter plot
    const filteredEfficiencies = useMemo(() => {
        let pool = allEfficiencies;
        if (selectedSubject !== 'All') {
            pool = pool.filter(e => e.subject === selectedSubject);
        }
        if (selectedQuadrant !== 'All') {
            pool = pool.filter(e => e.quadrant === selectedQuadrant);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            pool = pool.filter(e => e.chapter.toLowerCase().includes(q) || e.tacticalAdvice?.toLowerCase().includes(q));
        }
        return pool;
    }, [allEfficiencies, selectedSubject, selectedQuadrant, searchQuery]);

    // Top Leave-it Sinks
    const leaveItChapters = useMemo(() => {
        return allEfficiencies
            .filter(e => e.strategicVerdict === 'Strategic Skip / Leave It' || e.quadrant === 'disaster' || e.isTimeSink)
            .slice(0, 4);
    }, [allEfficiencies]);

    // Copy Exam Strategy Blueprint to clipboard
    const handleCopyBlueprint = () => {
        const text = `JEE Exam Strategy Blueprint (${examType})
Recommended Order: ${strategyCard.recommendedSubjectOrder.join(' -> ')}
Time Budget: Chemistry: ${strategyCard.timeBudgetMinutes.Chemistry}m | Physics: ${strategyCard.timeBudgetMinutes.Physics}m | Maths: ${strategyCard.timeBudgetMinutes.Maths}m | Buffer: ${strategyCard.timeBudgetMinutes.ReviewBuffer}m
Speed Pillars: ${strategyCard.speedPillars.join(', ')}
Strategic Skips: ${strategyCard.timeSinkAlerts.join(', ')}

3-Pass Flow:
- Pass 1 (${strategyCard.passBreakdown?.pass1.minutes}m): ${strategyCard.passBreakdown?.pass1.focus}
- Pass 2 (${strategyCard.passBreakdown?.pass2.minutes}m): ${strategyCard.passBreakdown?.pass2.focus}
- Pass 3 (${strategyCard.passBreakdown?.pass3.minutes}m): ${strategyCard.passBreakdown?.pass3.focus}

Tactical Rules:
- ${strategyCard.topSkipRules.join('\n- ')}`;

        navigator.clipboard.writeText(text);
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 3000);
    };

    const handleResetSimulator = () => {
        if (examType === 'JEE Advanced') {
            setCustomPhysicsTime(60);
            setCustomChemistryTime(50);
            setCustomMathsTime(60);
        } else {
            setCustomPhysicsTime(55);
            setCustomChemistryTime(45);
            setCustomMathsTime(65);
        }
    };

    // Custom Scatter Plot Tooltip
    const CustomScatterTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;
        const item: ChapterEfficiency = payload[0].payload;
        const qConfig = item.quadrant ? QUADRANT_COLORS[item.quadrant] : QUADRANT_COLORS.goldmine;

        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl max-w-xs text-xs space-y-1.5 z-50">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-white text-sm line-clamp-1">{item.chapter}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.subject}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-0.5">
                    <div>
                        <span className="text-slate-500 block text-[10px]">Speed (Avg Time):</span>
                        <span className="font-mono font-bold text-white">{item.avgTimeSeconds}s / Q</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block text-[10px]">Accuracy:</span>
                        <span className="font-mono font-bold text-emerald-400">{item.accuracy}%</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block text-[10px]">Mark Velocity:</span>
                        <span className="font-mono font-bold text-cyan-400">{item.marksPerMinute} MPM</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block text-[10px]">Sample Size:</span>
                        <span className="font-mono text-slate-300">{item.totalAttempts} Qs {item.isEmpirical ? '(Logged)' : '(Benchmarked)'}</span>
                    </div>
                </div>
                {item.quadrant && (
                    <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${qConfig.bg} ${qConfig.border} ${qConfig.text}`}>
                        {qConfig.label}
                    </div>
                )}
                {item.tacticalAdvice && (
                    <p className="text-[11px] text-amber-300/90 italic pt-1 border-t border-slate-800/80">
                        Rule: {item.tacticalAdvice}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* 1. HERO HEADER & TIME LEAKAGE KPIS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
                            <span>Time-Per-Mark Optimizer</span>
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap inline-flex items-center shrink-0">
                            MPM Telemetry Engine
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                        Question speed telemetry, diminishing returns time budget saturation, and tactical skip heuristics.
                    </p>
                </div>

                {/* Compact KPI Pills */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="bg-surface-2 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm">
                        <span className="text-xs text-slate-400 font-medium">Productive:</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                            {timeLeakReport.productiveTimeMinutes}m / {timeLeakReport.totalExamTimeMinutes}m
                        </span>
                        <span className="text-xs font-bold text-emerald-300 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            {timeLeakReport.timeEfficiencyScore}%
                        </span>
                    </div>

                    <div className="bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                        <span className="text-xs text-rose-300 font-medium">Time Leaked:</span>
                        <span className="text-xs font-bold text-rose-400 font-mono">
                            -{timeLeakReport.leakedTimeMinutes}m
                        </span>
                    </div>

                    <button
                        onClick={() => setIsBlueprintModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                        <Compass className="w-3.5 h-3.5" />
                        <span>View 3-Pass Blueprint</span>
                    </button>
                </div>
            </div>

            {/* 2. EXAM STRATEGY CARD (HERO BLUEPRINT) */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                            <Compass className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                AI Generated Strategy Card
                            </span>
                            <h3 className="text-lg font-black text-white">
                                Optimal 3-Hour Exam Flow & Subject Sequence
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Exam Type Toggle */}
                        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-bold">
                            <button
                                onClick={() => setExamType('JEE Mains')}
                                className={`px-3 py-1 rounded-lg transition-colors ${
                                    examType === 'JEE Mains' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                                }`}
                            >
                                JEE Mains
                            </button>
                            <button
                                onClick={() => setExamType('JEE Advanced')}
                                className={`px-3 py-1 rounded-lg transition-colors ${
                                    examType === 'JEE Advanced' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                                }`}
                            >
                                JEE Advanced
                            </button>
                        </div>

                        {/* Copy Button */}
                        <button
                            onClick={handleCopyBlueprint}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                        >
                            {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCard ? 'Copied' : 'Copy Strategy'}</span>
                        </button>
                    </div>
                </div>

                {/* Subject Flow Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {strategyCard.recommendedSubjectOrder.map((subj, idx) => {
                        const time = strategyCard.timeBudgetMinutes[subj];
                        const isFirst = idx === 0;

                        return (
                            <div 
                                key={subj}
                                className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                                    isFirst 
                                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                                        : 'bg-slate-950/80 border-slate-800 text-slate-300'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                        Step {idx + 1}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-white">
                                        {time} Mins Budget
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-base font-black text-white">{subj}</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {isFirst ? 'Highest mark conversion rate. Build early score confidence!' : 'Tackle with disciplined timer cap.'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Buffer Step */}
                    <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 flex flex-col justify-between space-y-2">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                Step 4
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                                {strategyCard.timeBudgetMinutes.ReviewBuffer} Mins
                            </span>
                        </div>
                        <div>
                            <h4 className="text-base font-black text-white">Review & Section B</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Integer sanity check, bubbled review, and tie-breakers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Interactive Time Budget Strategy Simulator with Saturation Curve */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">
                                    Non-Linear Time Budget Simulator (180 Mins Exam)
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    Accounts for diminishing returns and 100-mark max cap per subject.
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-xs font-mono text-right">
                                Projected Yield: <span className="font-bold text-emerald-400 text-sm">{simulatedYield.projectedScore} Marks</span>
                                {simulatedYield.scoreDelta !== 0 && (
                                    <span className={`ml-1.5 font-bold ${simulatedYield.scoreDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        ({simulatedYield.scoreDelta > 0 ? `+${simulatedYield.scoreDelta}` : simulatedYield.scoreDelta} vs 60m Baseline)
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleResetSimulator}
                                title="Reset sliders to recommended budget"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Physics Slider */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-cyan-300 font-bold">Physics: {customPhysicsTime}m</span>
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    {simulatedYield.subjectScores.physics} / {examType === 'JEE Advanced' ? 120 : 100} Marks
                                </span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="90"
                                value={customPhysicsTime}
                                onChange={e => setCustomPhysicsTime(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                            />
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div 
                                    className="bg-cyan-400 h-full transition-all duration-300" 
                                    style={{ width: `${(simulatedYield.subjectScores.physics / (examType === 'JEE Advanced' ? 120 : 100)) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Chemistry Slider */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-amber-300 font-bold">Chemistry: {customChemistryTime}m</span>
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    {simulatedYield.subjectScores.chemistry} / {examType === 'JEE Advanced' ? 120 : 100} Marks
                                </span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="80"
                                value={customChemistryTime}
                                onChange={e => setCustomChemistryTime(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                            />
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div 
                                    className="bg-amber-400 h-full transition-all duration-300" 
                                    style={{ width: `${(simulatedYield.subjectScores.chemistry / (examType === 'JEE Advanced' ? 120 : 100)) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Maths Slider */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-purple-300 font-bold">Maths: {customMathsTime}m</span>
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    {simulatedYield.subjectScores.maths} / {examType === 'JEE Advanced' ? 120 : 100} Marks
                                </span>
                            </div>
                            <input
                                type="range"
                                min="30"
                                max="100"
                                value={customMathsTime}
                                onChange={e => setCustomMathsTime(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-400"
                            />
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div 
                                    className="bg-purple-400 h-full transition-all duration-300" 
                                    style={{ width: `${(simulatedYield.subjectScores.maths / (examType === 'JEE Advanced' ? 120 : 100)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Time Gauge Breakdown */}
                    <div className="flex items-center justify-between text-xs font-mono px-2 pt-1">
                        <span className="text-slate-400">
                            Total Exam Time Allocated: <strong className="text-white">{totalAllocatedMinutes}m</strong> / 180m
                        </span>
                        <span className={remainingBufferMinutes >= 10 ? 'text-indigo-400 font-bold' : remainingBufferMinutes < 0 ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                            {remainingBufferMinutes < 0 ? `Exceeds 180m limit by ${Math.abs(remainingBufferMinutes)}m!` : `Unallocated Review Buffer: ${remainingBufferMinutes}m`}
                        </span>
                    </div>
                </div>

                {/* Speed Pillars vs Leave-it Sinks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-800/60">
                    <div className="space-y-2">
                        <div className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" /> High-Velocity Speed Pillars (Pass 1 Priority)
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {strategyCard.speedPillars.map((sp, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                                    {sp}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> High-Cost Time Sinks (Defer or Skip)
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {strategyCard.timeSinkAlerts.map((ts, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/60 border border-rose-700/60 text-rose-300">
                                    {ts}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. RECHARTS 4-QUADRANT SPEED VS ACCURACY SCATTER PLOT */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-base font-black text-white">
                                4-Quadrant Chapter Efficiency Scatter Matrix
                            </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Correlates Speed (Seconds per Question) against Accuracy (%) across all 88 JEE chapters.
                        </p>
                    </div>

                    {/* Quadrant Legend / Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        <button
                            onClick={() => setSelectedQuadrant('All')}
                            className={`px-2.5 py-1 rounded-lg transition-colors ${
                                selectedQuadrant === 'All' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            All ({allEfficiencies.length})
                        </button>
                        {(['goldmine', 'time_eater', 'guess_trap', 'disaster'] as const).map(q => {
                            const conf = QUADRANT_COLORS[q];
                            const count = allEfficiencies.filter(e => e.quadrant === q).length;
                            return (
                                <button
                                    key={q}
                                    onClick={() => setSelectedQuadrant(selectedQuadrant === q ? 'All' : q)}
                                    className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
                                        selectedQuadrant === q ? `${conf.bg} ${conf.border} ${conf.text} ring-1 ring-current font-black` : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.dot }} />
                                    <span>{conf.label.split(' ')[0]} ({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Scatter Chart Canvas */}
                <div className="h-[360px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                            <XAxis 
                                type="number" 
                                dataKey="avgTimeSeconds" 
                                name="Time" 
                                unit="s"
                                domain={[30, 220]}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                tickLine={{ stroke: '#334155' }}
                                axisLine={{ stroke: '#334155' }}
                                label={{ value: 'Average Time per Question (Seconds) ->', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 11 }}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="accuracy" 
                                name="Accuracy" 
                                unit="%"
                                domain={[20, 100]}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                tickLine={{ stroke: '#334155' }}
                                axisLine={{ stroke: '#334155' }}
                                label={{ value: 'Accuracy (%) ->', angle: -90, position: 'left', offset: 10, fill: '#64748b', fontSize: 11 }}
                            />
                            <ZAxis type="number" dataKey="marksPerMinute" range={[60, 300]} name="MPM" />
                            <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} />
                            
                            {/* Reference Lines splitting into 4 quadrants: Time = 120s, Accuracy = 70% */}
                            <ReferenceLine x={120} stroke="#64748b" strokeDasharray="4 4" label={{ value: '120s Threshold', fill: '#64748b', fontSize: 10, position: 'insideTopLeft' }} />
                            <ReferenceLine y={70} stroke="#64748b" strokeDasharray="4 4" label={{ value: '70% Accuracy Benchmark', fill: '#64748b', fontSize: 10, position: 'insideBottomRight' }} />

                            <Scatter name="Chapters" data={filteredEfficiencies} fill="#38bdf8">
                                {filteredEfficiencies.map((entry, index) => {
                                    const dotColor = entry.quadrant ? QUADRANT_COLORS[entry.quadrant].dot : '#38bdf8';
                                    return <Cell key={`cell-${index}`} fill={dotColor} fillOpacity={0.85} stroke="#0f172a" strokeWidth={1} />;
                                })}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                {/* Quadrant Definition Explainer Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                        <span className="font-bold block">1. Goldmine (Top-Left)</span>
                        <span className="text-slate-400 text-[10px]">Fast &gt;= 70% acc, &lt;= 120s. Attack first!</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300">
                        <span className="font-bold block">2. Time Eater (Top-Right)</span>
                        <span className="text-slate-400 text-[10px]">Accurate but slow &gt; 120s. Defer to Pass 2.</span>
                    </div>
                    <div className="p-2 rounded-lg bg-orange-950/30 border border-orange-500/20 text-orange-300">
                        <span className="font-bold block">3. Guess Trap (Bottom-Left)</span>
                        <span className="text-slate-400 text-[10px]">Fast &lt; 70% acc. Beware of silly calculation slips.</span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/20 text-rose-300">
                        <span className="font-bold block">4. Disaster Zone (Bottom-Right)</span>
                        <span className="text-slate-400 text-[10px]">Slow &amp; low acc. Automatic Pass 3 skip!</span>
                    </div>
                </div>
            </div>

            {/* 4. STRATEGIC "LEAVE IT" HEURISTIC RADAR */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" /> Tactical Skip Protocol
                        </span>
                        <h3 className="text-base font-black text-white mt-0.5">
                            "Leave It" Detector & Strategic Disengagement Rules
                        </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                        Saves 25 to 40 mins of deadweight time
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {leaveItChapters.map(ch => (
                        <div 
                            key={ch.chapter}
                            className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-3 flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                        {ch.subject} &bull; Time Sink
                                    </span>
                                    <span className="text-xs font-mono font-bold text-rose-400">
                                        {ch.marksPerMinute} MPM
                                    </span>
                                </div>

                                <h4 className="text-sm font-bold text-white line-clamp-1">
                                    {ch.chapter}
                                </h4>

                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Costs <strong className="text-slate-200">{ch.avgTimeSeconds}s</strong> per question at <strong className="text-slate-200">{ch.accuracy}% accuracy</strong>. High probability of multi-branch calculation slip.
                                </p>
                            </div>

                            <div className="p-2 rounded bg-rose-950/40 border border-rose-800/40 text-[10px] text-rose-300 font-medium">
                                Rule: {ch.tacticalAdvice || 'If setup exceeds 75s, mark for Pass 2 review.'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. MARKS-PER-MINUTE (MPM) CHAPTER RANKING MATRIX */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-cyan-400" />
                            Comprehensive Mark Velocity (MPM) Breakdown ({filteredEfficiencies.length} Chapters)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Ranks chapters by net marks delivered per minute of exam time invested.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Subject Filter */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                            {(['All', 'Physics', 'Chemistry', 'Maths'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSubject(s)}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        selectedSubject === s ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-48">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search chapter or rule..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Chapter & Subject</th>
                                <th className="py-3 px-4">Quadrant</th>
                                <th className="py-3 px-4">Mark Velocity (MPM)</th>
                                <th className="py-3 px-4">Avg Time / Q</th>
                                <th className="py-3 px-4">Accuracy</th>
                                <th className="py-3 px-4">Tactical Exam Rule</th>
                                <th className="py-3 px-4">Strategic Verdict</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredEfficiencies.map(row => {
                                const qConf = row.quadrant ? QUADRANT_COLORS[row.quadrant] : null;

                                return (
                                    <tr key={row.chapter} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-white">{row.chapter}</div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                                <span>{row.subject}</span>
                                                <span>&bull;</span>
                                                <span>{row.difficultyTier || 'Standard'}</span>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            {qConf && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${qConf.bg} ${qConf.border} ${qConf.text}`}>
                                                    {qConf.label.split(' ')[0]}
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${
                                                            row.marksPerMinute >= 1.5 ? 'bg-emerald-400' :
                                                            row.marksPerMinute >= 0.8 ? 'bg-cyan-400' :
                                                            row.marksPerMinute >= 0.4 ? 'bg-amber-400' : 'bg-rose-500'
                                                        }`}
                                                        style={{ width: `${Math.min(100, Math.max(5, (row.marksPerMinute / 2.5) * 100))}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono font-bold text-slate-200">
                                                    {row.marksPerMinute} <span className="text-[10px] text-slate-400 font-normal">MPM</span>
                                                </span>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4 font-mono text-slate-300">
                                            {row.avgTimeSeconds}s
                                        </td>

                                        <td className="py-3 px-4 font-mono text-slate-300">
                                            {row.accuracy}%
                                        </td>

                                        <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs">
                                            <span className="text-amber-300/90 italic">
                                                {row.tacticalAdvice || 'Standard solve'}
                                            </span>
                                        </td>

                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                row.strategicVerdict === 'Speed Pillar' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                                                row.strategicVerdict === 'High Yield Solid' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' :
                                                row.strategicVerdict === 'Borderline Drain' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                                                'bg-rose-950 text-rose-300 border border-rose-700'
                                            }`}>
                                                {row.strategicVerdict}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. D-DAY 3-PASS STRATEGY BLUEPRINT MODAL */}
            <Modal
                isOpen={isBlueprintModalOpen}
                onClose={() => setIsBlueprintModalOpen(false)}
                title={`D-Day 3-Pass Exam Hall Strategy Blueprint (${examType})`}
                maxWidth="5xl"
            >
                <div className="p-6 space-y-6 text-slate-200 overflow-y-auto max-h-[75vh]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div>
                            <span className="text-xs uppercase font-black text-cyan-400 tracking-wider">
                                Optimal Subject Execution Order
                            </span>
                            <div className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                                {strategyCard.recommendedSubjectOrder.map((s, idx) => (
                                    <React.Fragment key={s}>
                                        <span className="text-cyan-300">{s} ({strategyCard.timeBudgetMinutes[s]}m)</span>
                                        {idx < strategyCard.recommendedSubjectOrder.length - 1 && (
                                            <ArrowRight className="w-4 h-4 text-slate-500" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleCopyBlueprint}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all self-start sm:self-center"
                        >
                            {copiedCard ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedCard ? 'Copied to Clipboard' : 'Copy Full Blueprint'}</span>
                        </button>
                    </div>

                    {/* 3-Pass Detailed Architecture */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4 text-amber-400" />
                            <span>Structured 3-Pass Execution Protocol (180 Minutes)</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pass 1 */}
                            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                                        Pass 1 (0 to {strategyCard.passBreakdown?.pass1.minutes || 55}m)
                                    </span>
                                    <span className="text-xs font-mono text-emerald-300 font-bold">
                                        Target: {strategyCard.passBreakdown?.pass1.targetQuestions || 32} Qs
                                    </span>
                                </div>
                                <h5 className="font-bold text-white text-sm">Rapid Direct Solve</h5>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {strategyCard.passBreakdown?.pass1.focus || 'Chemistry facts/bonding, direct physics formulas, algebra properties. No deep algebraic loops.'}
                                </p>
                                <div className="text-[11px] text-emerald-300/90 font-mono bg-emerald-950/60 p-2 rounded">
                                    Rule: Strict 60s hard stop. If no clear path emerges, mark for Pass 2.
                                </div>
                            </div>

                            {/* Pass 2 */}
                            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                                        Pass 2 ({strategyCard.passBreakdown?.pass1.minutes || 55}m to {(strategyCard.passBreakdown?.pass1.minutes || 55) + (strategyCard.passBreakdown?.pass2.minutes || 75)}m)
                                    </span>
                                    <span className="text-xs font-mono text-amber-300 font-bold">
                                        Target: {strategyCard.passBreakdown?.pass2.targetQuestions || 28} Qs
                                    </span>
                                </div>
                                <h5 className="font-bold text-white text-sm">Solvable Calculations</h5>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {strategyCard.passBreakdown?.pass2.focus || 'Mechanics integration, physical chemistry stoichiometry, calculus and coordinate geometry.'}
                                </p>
                                <div className="text-[11px] text-amber-300/90 font-mono bg-amber-950/60 p-2 rounded">
                                    Rule: Maintain 2 to 2.5 min cap. Abandon step if quadratic discriminant is irrational.
                                </div>
                            </div>

                            {/* Pass 3 & Buffer */}
                            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700">
                                        Pass 3 & Buffer (Last 50m)
                                    </span>
                                    <span className="text-xs font-mono text-indigo-300 font-bold">
                                        Target: {strategyCard.passBreakdown?.pass3.targetQuestions || 15} Qs
                                    </span>
                                </div>
                                <h5 className="font-bold text-white text-sm">Numericals & Final Sanity</h5>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {strategyCard.passBreakdown?.pass3.focus || 'Integer-type questions, tie-breakers, bubbled review, and verification.'}
                                </p>
                                <div className="text-[11px] text-indigo-300/90 font-mono bg-indigo-950/60 p-2 rounded">
                                    Rule: Reserve last 15 minutes exclusively for calculation sanity checks.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Critical Disengagement Skip Rules */}
                    <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-rose-500/30">
                        <h4 className="text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <span>Non-Negotiable Exam Disengagement Rules</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-300">
                            {strategyCard.topSkipRules.map((rule, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-rose-400 font-bold shrink-0">{idx + 1}.</span>
                                    <span>{rule}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
