// ============================================================================
// Burnout & Recovery Intelligence Dashboard (Full-Page Component)
// Empirical CLS Telemetry, Fatigue Debt Trajectory, Diurnal Chronobiology & Smart Deload
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
    Activity, BatteryCharging, AlertTriangle, ShieldCheck, HeartPulse, 
    Moon, Sun, Clock, Zap, Sparkles, Plus, Check, ArrowRight,
    TrendingDown, BarChart3, Coffee, Smile, Meh, Frown, ShieldAlert,
    X, ChevronRight, Info, Battery, BatteryWarning, BatteryFull, Flame,
    Bed, RefreshCw, Award
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { DailyTask, QuestionLog, UserProfile, TaskType, TaskEffort } from '../types';
import { generateCognitiveReport, convertTasksToDeloadRoutine } from '../services/burnoutEngine';

interface BurnoutDashboardProps {
    tasks: DailyTask[];
    logs: QuestionLog[];
    userProfile: UserProfile;
    bioStats?: { sleep?: number; stress?: number; energy?: number } | null;
    onUpdateTasks?: (tasks: DailyTask[] | ((prev: DailyTask[]) => DailyTask[])) => void;
    onUpdateProfile?: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
    setView?: (view: any) => void;
}

export const BurnoutDashboard: React.FC<BurnoutDashboardProps> = ({
    tasks,
    logs,
    userProfile,
    bioStats,
    onUpdateTasks,
    onUpdateProfile,
    setView
}) => {
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [sleepHours, setSleepHours] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('user_daily_sleep_hours');
            return saved ? Number(saved) : (bioStats?.sleep || 7);
        } catch { return bioStats?.sleep || 7; }
    });
    const [moodSaved, setMoodSaved] = useState(false);
    const [tasksInjected, setTasksInjected] = useState(false);

    // Smart Deload Modal & Selection
    const [showDeloadModal, setShowDeloadModal] = useState(false);
    const [selectedDeloadTier, setSelectedDeloadTier] = useState<'micro' | 'half_day' | 'full_rest'>('micro');
    const [deloadApplied, setDeloadApplied] = useState(false);

    // Compute empirical cognitive report
    const liveBioStats = useMemo(() => ({
        sleep: sleepHours,
        stress: bioStats?.stress ?? 3,
        energy: bioStats?.energy ?? 3
    }), [sleepHours, bioStats]);

    const report = useMemo(() => {
        return generateCognitiveReport(
            tasks,
            logs,
            liveBioStats,
            userProfile.weeklyMoodLog
        );
    }, [tasks, logs, liveBioStats, userProfile.weeklyMoodLog]);

    // Save Mood & Sleep
    const handleLogMood = (mood: 1 | 2 | 3 | 4 | 5) => {
        setSelectedMood(mood);
        const todayStr = new Date().toISOString().split('T')[0];
        const updated = [
            ...(userProfile.weeklyMoodLog || []).filter(m => m.date !== todayStr),
            { date: todayStr, mood, timestamp: Date.now() }
        ];

        if (onUpdateProfile) {
            onUpdateProfile(prev => ({
                ...prev,
                weeklyMoodLog: updated
            }));
        }

        setMoodSaved(true);
        setTimeout(() => setMoodSaved(false), 3000);
    };

    const handleUpdateSleep = (hours: number) => {
        setSleepHours(hours);
        try {
            localStorage.setItem('user_daily_sleep_hours', hours.toString());
        } catch {}
    };

    // Apply Smart Deload Routine to Daily Planner
    const handleApplySmartDeload = () => {
        if (!onUpdateTasks) return;
        const deloadTasks = convertTasksToDeloadRoutine(tasks, selectedDeloadTier);
        onUpdateTasks(deloadTasks);
        setDeloadApplied(true);
        setShowDeloadModal(false);
        setTimeout(() => setDeloadApplied(false), 4000);
    };

    // Inject Prescriptive Recovery Protocol into Daily Planner
    const handleInjectProtocol = () => {
        if (!report.recoveryProtocol || !onUpdateTasks) return;

        const newTasks: DailyTask[] = report.recoveryProtocol.suggestedTasks.map((t, idx) => ({
            id: `recovery-${Date.now()}-${idx}`,
            text: `[Recovery] ${t.task}`,
            completed: false,
            taskType: TaskType.Revision,
            effort: t.effort,
            estimatedTime: t.time,
            isGhost: true
        }));

        onUpdateTasks(prev => [...prev, ...newTasks]);
        setTasksInjected(true);
        setTimeout(() => setTasksInjected(false), 4000);
    };

    const cls = report.currentCls;
    const isOptimal = cls >= 80;
    const isModerate = cls >= 60 && cls < 80;
    const isHighRisk = cls >= 40 && cls < 60;
    const isCritical = cls < 40;

    return (
        <div className="space-y-6">
            {/* 1. STANDARDIZED HEADER ROW */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" />
                            <span>Burnout & Cognitive Battery</span>
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold whitespace-nowrap inline-flex items-center ${
                            isCritical ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            isHighRisk ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            isModerate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                            CLS {cls}/100
                        </span>
                        <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 whitespace-nowrap items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Streak Protected
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Psychometric cognitive load tracking, sleep debt telemetry, diurnal focus analysis, and smart active-rest deload.
                    </p>
                </div>

                {/* Quick Check-in Box (Sleep + Mood + Deload Modal Trigger) */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Sleep Input */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-white/10 rounded-xl text-xs">
                        <Bed className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-slate-400">Sleep:</span>
                        <span className="font-mono font-bold text-white">{sleepHours}h</span>
                        <input
                            type="range"
                            min="4"
                            max="10"
                            step="0.5"
                            value={sleepHours}
                            onChange={e => handleUpdateSleep(Number(e.target.value))}
                            className="w-16 h-1 bg-surface-3 rounded appearance-none cursor-pointer accent-indigo-400"
                        />
                    </div>

                    {/* Mood Buttons */}
                    <div className="flex items-center gap-1 bg-surface-2 border border-white/10 p-1 rounded-xl">
                        {[
                            { level: 1 as const, emoji: '😫', label: 'Exhausted' },
                            { level: 2 as const, emoji: '🥱', label: 'Low Energy' },
                            { level: 3 as const, emoji: '😐', label: 'Neutral' },
                            { level: 4 as const, emoji: '🙂', label: 'Focused' },
                            { level: 5 as const, emoji: '⚡', label: 'Peak State' }
                        ].map(m => (
                            <button
                                key={m.level}
                                onClick={() => handleLogMood(m.level)}
                                title={m.label}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-105 ${
                                    selectedMood === m.level || (userProfile.weeklyMoodLog?.slice(-1)[0]?.mood === m.level)
                                        ? 'bg-rose-500/20 border border-rose-500 text-white shadow-sm'
                                        : 'hover:bg-surface-3 text-slate-400'
                                }`}
                            >
                                {m.emoji}
                            </button>
                        ))}
                    </div>

                    {moodSaved && (
                        <span className="text-xs font-mono font-bold text-emerald-400 animate-fade-in">Saved!</span>
                    )}

                    {/* Smart Deload Modal Trigger */}
                    <button
                        onClick={() => setShowDeloadModal(true)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 ${
                            deloadApplied
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                        }`}
                        title="Configure an active-rest deload protocol to prevent overtraining"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{deloadApplied ? 'Deload Active' : 'Smart Deload'}</span>
                    </button>
                </div>
            </div>

            {/* 2. HERO ROW: COGNITIVE LOAD GAUGE & 7-DAY TREND */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 2A: CLS Score Gauge (5 Cols) */}
                <div className={`lg:col-span-5 rounded-2xl p-6 flex flex-col justify-between shadow-2xl border ${
                    isCritical ? 'bg-rose-950/40 border-rose-500/40 shadow-rose-950/20' :
                    isHighRisk ? 'bg-amber-950/40 border-amber-500/40 shadow-amber-950/20' :
                    isModerate ? 'bg-cyan-950/30 border-cyan-500/40 shadow-cyan-950/20' :
                    'bg-slate-900/90 border-slate-800 shadow-xl'
                }`}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
                                <BatteryCharging className="w-4 h-4 text-cyan-400" />
                                Cognitive Load Score (CLS)
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                                isCritical ? 'bg-rose-500 text-white' :
                                isHighRisk ? 'bg-amber-500 text-slate-950' :
                                isOptimal ? 'bg-emerald-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
                            }`}>
                                {report.forecast.riskLevel}
                            </span>
                        </div>

                        {/* Big Battery Meter */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl md:text-6xl font-black text-white font-mono tracking-tight">
                                {cls}
                            </span>
                            <span className="text-slate-400 font-bold text-lg">/ 100</span>
                        </div>

                        {/* Progress Bar with Color Zones */}
                        <div className="space-y-1">
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                <div 
                                    className={`h-full transition-all duration-1000 ${
                                        cls < 40 ? 'bg-rose-500' :
                                        cls < 60 ? 'bg-amber-400' :
                                        cls < 80 ? 'bg-cyan-400' : 'bg-emerald-400'
                                    }`}
                                    style={{ width: `${cls}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                                <span>Critical (&lt;40)</span>
                                <span>Warning (60)</span>
                                <span>Optimal (80+)</span>
                            </div>
                        </div>

                        {/* Primary Stress Driver Banner */}
                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Primary Stress Factor</span>
                            <p className="font-semibold text-slate-200">{report.forecast.primaryStressDriver}</p>
                        </div>
                    </div>

                    {/* Forecast Horizon & Recommendation */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Fatigue Horizon:</span>
                            <span className="font-mono font-bold text-cyan-300">
                                {report.forecast.daysToRisk > 1 ? `~${report.forecast.daysToRisk} Days buffer` : 'Immediate Fatigue Alert'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed italic">
                            {report.forecast.recommendation}
                        </p>
                    </div>
                </div>

                {/* 2B: 7-Day Energy Trend Chart (7 Cols) */}
                <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                            <div>
                                <h3 className="text-base font-black text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                                    <span>Mental Battery & Fatigue Trajectory (7-Day Rolling)</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Empirical rolling mental battery vs study hours. Dashed red line marks the 40 CLS burnout danger threshold.
                                </p>
                            </div>
                            <span className="text-xs font-mono text-slate-400 self-start sm:self-auto">Threshold: 40 CLS</span>
                        </div>

                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.clsHistory} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="clsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                        formatter={(val: any, name: string) => {
                                            if (name === 'score') return [`${val} CLS`, 'Mental Battery'];
                                            return [val, name];
                                        }}
                                    />
                                    <ReferenceLine 
                                        y={40} 
                                        stroke="#f43f5e" 
                                        strokeDasharray="4 4" 
                                        label={{ value: 'Burnout Danger', fill: '#f43f5e', fontSize: 10, position: 'right' }} 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="score" 
                                        stroke="#22d3ee" 
                                        strokeWidth={3} 
                                        fill="url(#clsGradient)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                        <span>💡 Tip: Keep rolling score above 60 to prevent habit degradation</span>
                        <span className="text-cyan-400 font-bold font-mono">
                            Sleep Debt: {report.sleepDebtHours ? `${report.sleepDebtHours}h` : '0h'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. MOOD TO ACCURACY CORRELATION CALLOUT */}
            {report.moodAccuracyCorrelation && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="text-sm font-bold text-white">
                                Cognitive State vs Solving Accuracy Correlation
                            </h4>
                            <p className="text-slate-400">
                                Empirical analysis of mock accuracy on Peak/Focused days vs Exhausted days ({report.moodAccuracyCorrelation.sampleCount} questions analyzed).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-center">
                            <span className="text-[10px] text-slate-400 block uppercase">Peak State</span>
                            <span className="text-sm font-black text-emerald-400 font-mono">
                                {report.moodAccuracyCorrelation.peakAccuracy}% Acc
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/30 text-center">
                            <span className="text-[10px] text-slate-400 block uppercase">Fatigued State</span>
                            <span className="text-sm font-black text-rose-400 font-mono">
                                {report.moodAccuracyCorrelation.exhaustedAccuracy}% Acc
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-center">
                            <span className="text-[10px] text-purple-300 block uppercase">Penalty Delta</span>
                            <span className="text-sm font-black text-purple-300 font-mono">
                                -{report.moodAccuracyCorrelation.accuracyDelta}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. CHRONOBIOLOGICAL DIURNAL FOCUS HEATMAP */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                        <span className="text-xs uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> Chronobiological Peak Window Analysis
                        </span>
                        <h3 className="text-lg font-black text-white mt-0.5">
                            Accuracy & Solving Speed by Daily Time Slot
                        </h3>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 self-start md:self-auto">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span>Peak Focus Slot: <strong>{report.energyHeatmap.peakSlot}</strong></span>
                    </div>
                </div>

                {/* 4 Daily Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Morning */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        report.energyHeatmap.peakSlot === 'Morning' 
                            ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/40' 
                            : 'bg-slate-950/60 border-slate-800'
                    }`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                                <Sun className="w-4 h-4 text-amber-400" />
                                <span>Morning (6am-12pm)</span>
                            </div>
                            {report.energyHeatmap.peakSlot === 'Morning' && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-500 text-slate-950 uppercase">Peak</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-white font-mono">
                                {report.energyHeatmap.morning.avgAccuracy}%
                            </div>
                            <div className="text-[11px] text-slate-400 flex justify-between">
                                <span>Speed: <strong className="text-slate-200 font-mono">{report.energyHeatmap.morning.avgTimeSpentSeconds}s</strong></span>
                                <span>Sample: <strong className="text-slate-400 font-mono">{report.energyHeatmap.morning.sampleSize}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Afternoon */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        report.energyHeatmap.peakSlot === 'Afternoon' 
                            ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/40' 
                            : 'bg-slate-950/60 border-slate-800'
                    }`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                                <Sun className="w-4 h-4 text-amber-500" />
                                <span>Afternoon (12pm-5pm)</span>
                            </div>
                            {report.energyHeatmap.peakSlot === 'Afternoon' && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-500 text-slate-950 uppercase">Peak</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-white font-mono">
                                {report.energyHeatmap.afternoon.avgAccuracy}%
                            </div>
                            <div className="text-[11px] text-slate-400 flex justify-between">
                                <span>Speed: <strong className="text-slate-200 font-mono">{report.energyHeatmap.afternoon.avgTimeSpentSeconds}s</strong></span>
                                <span>Sample: <strong className="text-slate-400 font-mono">{report.energyHeatmap.afternoon.sampleSize}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Evening */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        report.energyHeatmap.peakSlot === 'Evening' 
                            ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/40' 
                            : 'bg-slate-950/60 border-slate-800'
                    }`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                                <Moon className="w-4 h-4 text-indigo-400" />
                                <span>Evening (5pm-10pm)</span>
                            </div>
                            {report.energyHeatmap.peakSlot === 'Evening' && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-500 text-slate-950 uppercase">Peak</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-white font-mono">
                                {report.energyHeatmap.evening.avgAccuracy}%
                            </div>
                            <div className="text-[11px] text-slate-400 flex justify-between">
                                <span>Speed: <strong className="text-slate-200 font-mono">{report.energyHeatmap.evening.avgTimeSpentSeconds}s</strong></span>
                                <span>Sample: <strong className="text-slate-400 font-mono">{report.energyHeatmap.evening.sampleSize}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Night */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        report.energyHeatmap.night.performanceGrade === 'Fatigued' 
                            ? 'bg-rose-950/30 border-rose-500/30' 
                            : 'bg-slate-950/60 border-slate-800'
                    }`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                                <Moon className="w-4 h-4 text-slate-500" />
                                <span>Night (10pm-3am)</span>
                            </div>
                            {report.energyHeatmap.night.performanceGrade === 'Fatigued' && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-900 text-rose-300">Fatigued</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-white font-mono">
                                {report.energyHeatmap.night.avgAccuracy}%
                            </div>
                            <div className="text-[11px] text-slate-400 flex justify-between">
                                <span>Speed: <strong className="text-slate-200 font-mono">{report.energyHeatmap.night.avgTimeSpentSeconds}s</strong></span>
                                <span>Sample: <strong className="text-slate-400 font-mono">{report.energyHeatmap.night.sampleSize}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. ADAPTIVE PRESCRIPTIVE RECOVERY PROTOCOLS */}
            {report.recoveryProtocol && (
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 border border-rose-500/30 rounded-2xl p-6 shadow-xl space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/10 text-rose-300 border border-rose-500/30 uppercase">
                                    Prescriptive Recovery
                                </span>
                                <span className="text-xs text-slate-500 font-mono">{report.recoveryProtocol.recommendedDurationMinutes} Min Block</span>
                            </div>
                            <h3 className="text-xl font-black text-white mt-1">
                                {report.recoveryProtocol.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                                {report.recoveryProtocol.description}
                            </p>
                        </div>

                        {/* Inject Button */}
                        <button
                            onClick={handleInjectProtocol}
                            disabled={tasksInjected}
                            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-lg shrink-0 ${
                                tasksInjected
                                    ? 'bg-emerald-500 text-slate-950 cursor-default'
                                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40 hover:scale-105'
                            }`}
                        >
                            {tasksInjected ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Recovery Tasks Injected into Planner</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span>Auto-Schedule Recovery in Daily Planner</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Suggested Tasks Pills */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        {report.recoveryProtocol.suggestedTasks.map((st, i) => (
                            <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                                <div className="flex justify-between text-[11px]">
                                    <span className="font-bold text-slate-300">{st.topic}</span>
                                    <span className="font-mono text-cyan-400 font-bold">{st.time} min</span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium">{st.task}</p>
                            </div>
                        ))}
                    </div>

                    {/* Mindset Quote */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 italic">
                        🧠 <strong>Mindset Shift:</strong> "{report.recoveryProtocol.mindsetShift}"
                    </div>
                </div>
            )}

            {/* 6. SMART DELOAD PROTOCOL MODAL */}
            {showDeloadModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs uppercase font-black text-rose-400 flex items-center gap-1.5">
                                    <Zap className="w-4 h-4 text-rose-400" /> Active Rest & Overtraining Prevention
                                </span>
                                <h3 className="text-xl font-black text-white mt-1">
                                    Configure Smart Deload Routine
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowDeloadModal(false)}
                                className="p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                            Deloading prevents synaptic exhaustion and preserves long-term retention. 
                            Select a deload intensity to transform today's pending daily tasks into restorative active-rest activities:
                        </p>

                        {/* Tier Selector */}
                        <div className="space-y-3">
                            {[
                                {
                                    tier: 'micro' as const,
                                    label: 'Micro-Deload (45 Mins)',
                                    description: 'Replaces remaining tasks with 20m Formula Vault flashcards & 25m outdoor walk. Ideal for mild fatigue.'
                                },
                                {
                                    tier: 'half_day' as const,
                                    label: 'Half-Day Recovery (2 Hours)',
                                    description: 'Caps daily deep work at 4 hours. Replaces heavy mock solving with speed pillar review & error vaccinator.'
                                },
                                {
                                    tier: 'full_rest' as const,
                                    label: 'Full Rest Reset (24 Hours)',
                                    description: 'Complete detachment from full tests. Preserves your daily study streak with 15m light passive audio review.'
                                }
                            ].map(t => (
                                <div
                                    key={t.tier}
                                    onClick={() => setSelectedDeloadTier(t.tier)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        selectedDeloadTier === t.tier
                                            ? 'bg-rose-950/40 border-rose-500/60 shadow-md ring-1 ring-rose-500/40'
                                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-white">{t.label}</span>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                            selectedDeloadTier === t.tier ? 'border-rose-400 bg-rose-500' : 'border-slate-600'
                                        }`}>
                                            {selectedDeloadTier === t.tier && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        {t.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => setShowDeloadModal(false)}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApplySmartDeload}
                                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black transition-all shadow-lg shadow-rose-950/40 flex items-center gap-1.5"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Apply Deload Routine to Daily Planner</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
