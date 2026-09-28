// ============================================================================
// Predictive Weak Zone & Retention Decay Radar (Full-Page Component)
// Mathematical Ebbinghaus Forgetting Curve, FSRS Half-Life & Syllabus Heatmap
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
    AlertTriangle, ShieldAlert, Sparkles, Plus, Check, Clock, 
    Search, Filter, BookOpen, Zap, ArrowRight, TrendingDown,
    Activity, ChevronRight, Layers, Calendar, Timer, Flame
} from 'lucide-react';
import { UserProfile, QuestionLog, DailyTask, TaskType, TaskEffort, RetentionScore } from '../types';
import { 
    getAllChapterRetentionScores, 
    getTopDecayingChapters, 
    getRadarChartData,
    generate3DayEmergencyRecoverySchedule,
    generateMicroRevisionCapsule
} from '../services/retentionDecayService';
import { Modal } from './ui/Modal';

interface WeakZoneRadarProps {
    userProfile: UserProfile;
    questionLogs: QuestionLog[];
    onUpdateTasks?: (tasks: DailyTask[] | ((prev: DailyTask[]) => DailyTask[])) => void;
    setView?: (view: any) => void;
}

export const WeakZoneRadar: React.FC<WeakZoneRadarProps> = ({
    userProfile,
    questionLogs,
    onUpdateTasks,
    setView
}) => {
    const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Maths'>('All');
    const [heatmapClassFilter, setHeatmapClassFilter] = useState<'All' | 'Class 11' | 'Class 12'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Critical Decay' | 'Fading' | 'Fresh' | 'Unstudied'>('All');
    const [injectedTasks, setInjectedTasks] = useState<Record<string, boolean>>({});
    const [recoveryScheduleInjected, setRecoveryScheduleInjected] = useState(false);

    // Modal States
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [selectedCapsuleChapter, setSelectedCapsuleChapter] = useState<RetentionScore | null>(null);

    // Compute all retention scores across all 88+ chapters
    const allScores = useMemo(() => {
        return getAllChapterRetentionScores(userProfile, questionLogs);
    }, [userProfile, questionLogs]);

    // Danger Zone chapters (Top priority by decay severity & JEE weight)
    const dangerZoneChapters = useMemo(() => {
        return getTopDecayingChapters(allScores, 6);
    }, [allScores]);

    // Radar chart points
    const radarData = useMemo(() => {
        return getRadarChartData(
            allScores, 
            selectedSubject === 'All' ? undefined : selectedSubject
        );
    }, [allScores, selectedSubject]);

    // Summary counts
    const criticalCount = useMemo(() => allScores.filter(s => s.status === 'Critical Decay').length, [allScores]);
    const fadingCount = useMemo(() => allScores.filter(s => s.status === 'Fading').length, [allScores]);
    const freshCount = useMemo(() => allScores.filter(s => s.status === 'Fresh').length, [allScores]);
    const unstudiedCount = useMemo(() => allScores.filter(s => s.status === 'Unstudied').length, [allScores]);

    // Filtered table list
    const filteredScores = useMemo(() => {
        let pool = allScores;
        if (selectedSubject !== 'All') {
            pool = pool.filter(s => s.subject === selectedSubject);
        }
        if (statusFilter !== 'All') {
            pool = pool.filter(s => s.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            pool = pool.filter(s => 
                s.chapter.toLowerCase().includes(q) || 
                (s.unit && s.unit.toLowerCase().includes(q))
            );
        }
        return pool.sort((a, b) => a.retentionPercentage - b.retentionPercentage);
    }, [allScores, selectedSubject, statusFilter, searchQuery]);

    // Syllabus Heatmap grouping by subject and class
    const heatmapScores = useMemo(() => {
        let pool = allScores;
        if (selectedSubject !== 'All') {
            pool = pool.filter(s => s.subject === selectedSubject);
        }
        if (heatmapClassFilter !== 'All') {
            pool = pool.filter(s => s.classLevel === heatmapClassFilter);
        }
        return pool;
    }, [allScores, selectedSubject, heatmapClassFilter]);

    // 1-Click Inject Single Task into Daily Planner
    const handleInjectTask = (score: RetentionScore) => {
        if (!onUpdateTasks) return;

        const newTask: DailyTask = {
            id: `weak-zone-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            text: `[Retention Reset] Deep Revision: ${score.chapter} (${score.subject})`,
            completed: false,
            taskType: TaskType.Revision,
            linkedTopic: score.chapter,
            estimatedTime: 40,
            effort: TaskEffort.High,
            isGhost: false
        };

        onUpdateTasks(prev => [newTask, ...prev]);
        setInjectedTasks(prev => ({ ...prev, [score.chapter]: true }));
        setTimeout(() => {
            setInjectedTasks(prev => ({ ...prev, [score.chapter]: false }));
        }, 4000);
    };

    // Confirm & Inject 3-Day Emergency Recovery Plan
    const handleConfirm3DayPlan = () => {
        if (!onUpdateTasks || dangerZoneChapters.length === 0) return;
        const tasks = generate3DayEmergencyRecoverySchedule(dangerZoneChapters);
        onUpdateTasks(prev => [...tasks, ...prev]);
        setRecoveryScheduleInjected(true);
        setIsEmergencyModalOpen(false);
        setTimeout(() => setRecoveryScheduleInjected(false), 5000);
    };

    // Micro capsule for modal
    const activeCapsuleData = useMemo(() => {
        if (!selectedCapsuleChapter) return null;
        return generateMicroRevisionCapsule(selectedCapsuleChapter);
    }, [selectedCapsuleChapter]);

    const handleInjectCapsuleTask = () => {
        if (!onUpdateTasks || !selectedCapsuleChapter || !activeCapsuleData) return;

        const newTask: DailyTask = {
            id: `capsule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            text: `⚡ [15m Drill] Quick Retrieval: ${activeCapsuleData.chapterName} (${activeCapsuleData.subject})`,
            completed: false,
            taskType: TaskType.ProblemPractice,
            linkedTopic: activeCapsuleData.chapterName,
            estimatedTime: activeCapsuleData.durationMinutes,
            effort: TaskEffort.Medium,
            isGhost: false
        };

        onUpdateTasks(prev => [newTask, ...prev]);
        setInjectedTasks(prev => ({ ...prev, [selectedCapsuleChapter.chapter]: true }));
        setSelectedCapsuleChapter(null);
    };

    // 3-Day Recovery Preview Tasks
    const preview3DayTasks = useMemo(() => {
        return generate3DayEmergencyRecoverySchedule(dangerZoneChapters);
    }, [dangerZoneChapters]);

    return (
        <div className="space-y-6">
            {/* 1. HEADER & KPI CARDS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" />
                            <span>Weak Zone &amp; Retention Radar</span>
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap inline-flex items-center shrink-0">
                            FSRS Half-Life &bull; {allScores.length} Chapters
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                        Ebbinghaus spaced-repetition forgetting curves, memory half-life calculations, and proactive recovery drills.
                    </p>
                </div>

                {/* Action & Status Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setIsEmergencyModalOpen(true)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                            recoveryScheduleInjected
                                ? 'bg-emerald-500 text-slate-950 cursor-default'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                        }`}
                        title="Review and schedule 3-day recovery sprint for top decaying chapters"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{recoveryScheduleInjected ? '3-Day Injected!' : '⚡ 3-Day Emergency Recovery'}</span>
                    </button>

                    <div className="bg-rose-950/40 border border-rose-500/30 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs text-rose-300 font-medium">Critical:</span>
                        <span className="text-xs font-bold text-white font-mono">{criticalCount}</span>
                    </div>

                    <div className="bg-amber-950/30 border border-amber-500/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <span className="text-xs text-amber-300 font-medium">Fading:</span>
                        <span className="text-xs font-bold text-white font-mono">{fadingCount}</span>
                    </div>

                    <div className="bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <span className="text-xs text-emerald-300 font-medium">Fresh:</span>
                        <span className="text-xs font-bold text-white font-mono">{freshCount}</span>
                    </div>
                </div>
            </div>

            {/* 2. RADAR CHART & IMMEDIATE DANGER ZONE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 2A: Polar Radar Chart (5 Cols) */}
                <div className="lg:col-span-5 glass-panel border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-black text-white flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-cyan-400" />
                                    Multivariate Retention Spider
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Compares retention curve vs JEE exam importance.
                                </p>
                            </div>

                            {/* Subject Toggle */}
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                                {(['All', 'Physics', 'Chemistry', 'Maths'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSelectedSubject(s)}
                                        className={`px-2.5 py-1 rounded-lg transition-colors ${
                                            selectedSubject === s ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {s === 'All' ? 'All' : s[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="chapter" stroke="#94a3b8" fontSize={9} />
                                    <PolarRadiusAxis domain={[0, 100]} stroke="#64748b" fontSize={9} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                        formatter={(val: any) => [`${val}%`, 'Retention Level']}
                                    />
                                    <Radar name="Memory Retention" dataKey="retention" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.35} />
                                    <Radar name="JEE Importance" dataKey="importance" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Retention Curve
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Exam Priority
                        </span>
                    </div>
                </div>

                {/* 2B: Top Fragility Action Cards (7 Cols) */}
                <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-xs uppercase font-black tracking-widest text-rose-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> Immediate Amnesia Risk Triggers
                            </span>
                            <h3 className="text-lg font-black text-white mt-0.5">
                                Top Chapters in Severe Decay Zone
                            </h3>
                        </div>
                        <span className="text-xs font-mono text-slate-500">Ranked by Decay &amp; JEE Weight</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {dangerZoneChapters.map(ch => {
                            const isInjected = injectedTasks[ch.chapter] || false;

                            return (
                                <div
                                    key={ch.chapter}
                                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between space-y-3 hover:border-rose-500/40 transition-colors"
                                >
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                    ch.subject === 'Physics' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                                                    ch.subject === 'Chemistry' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                                    'bg-purple-950 text-purple-300 border border-purple-800'
                                                }`}>
                                                    {ch.subject} &bull; {ch.jeeWeightage} Wt
                                                </span>
                                                <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">
                                                    {ch.chapter}
                                                </h4>
                                            </div>

                                            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                                                ch.retentionPercentage < 45 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                                                'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                            }`}>
                                                {ch.retentionPercentage}%
                                            </span>
                                        </div>

                                        {/* Retention Bar */}
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${ch.retentionPercentage < 45 ? 'bg-rose-500' : 'bg-amber-400'}`}
                                                style={{ width: `${ch.retentionPercentage}%` }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 font-medium pt-1">
                                            <div>
                                                <span className="text-slate-500 block">Idle:</span>
                                                <strong className="text-slate-200">{ch.daysSinceLastPractice}d</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Half-Life:</span>
                                                <strong className="text-cyan-300">{ch.halfLifeDays || 12}d</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Accuracy:</span>
                                                <strong className="text-slate-200">{ch.accuracy}%</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons: 15m Capsule + 40m Deep Sprint */}
                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                                        <button
                                            onClick={() => setSelectedCapsuleChapter(ch)}
                                            className="py-1 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                                        >
                                            <Timer className="w-3 h-3 text-cyan-400" />
                                            <span>15m Capsule</span>
                                        </button>

                                        <button
                                            onClick={() => handleInjectTask(ch)}
                                            disabled={isInjected}
                                            className={`py-1 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                                isInjected
                                                    ? 'bg-emerald-500 text-slate-950'
                                                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                                            }`}
                                        >
                                            {isInjected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                            <span>{isInjected ? 'Added' : 'Schedule'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. INTERACTIVE FULL-SYLLABUS RETENTION HEATMAP GRID */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-amber-400" />
                            <h3 className="text-base font-black text-white">
                                Full-Syllabus Retention Heatmap Matrix ({heatmapScores.length} Chapters)
                            </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Bird's-eye view of memory stability across the entire 2-year JEE syllabus.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Class Filter */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                            {(['All', 'Class 11', 'Class 12'] as const).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setHeatmapClassFilter(c)}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        heatmapClassFilter === c ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {/* Subject Filter */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                            {(['All', 'Physics', 'Chemistry', 'Maths'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSubject(s)}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        selectedSubject === s ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Heatmap Grid of Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
                    {heatmapScores.map(score => {
                        const isCrit = score.status === 'Critical Decay';
                        const isFade = score.status === 'Fading';
                        const isFresh = score.status === 'Fresh';

                        return (
                            <div
                                key={score.chapter}
                                onClick={() => setSelectedCapsuleChapter(score)}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2 ${
                                    isCrit 
                                        ? 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400' :
                                    isFade 
                                        ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-400' :
                                    isFresh 
                                        ? 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-400' :
                                        'bg-slate-950/60 border-slate-800 text-slate-500'
                                }`}
                                title={`Click to view 15m revision drill: ${score.chapter}`}
                            >
                                <div>
                                    <div className="flex justify-between items-center text-[9px] font-bold">
                                        <span className="text-slate-400 truncate max-w-[80px]">
                                            {score.unit || score.subject}
                                        </span>
                                        <span className={`font-mono ${
                                            isCrit ? 'text-rose-400' : isFade ? 'text-amber-400' : isFresh ? 'text-emerald-400' : 'text-slate-500'
                                        }`}>
                                            {score.retentionPercentage}%
                                        </span>
                                    </div>
                                    <h5 className="text-xs font-bold text-white mt-1 line-clamp-1">
                                        {score.chapter}
                                    </h5>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                                    <span className="font-mono text-[9px]">
                                        t½: {score.halfLifeDays || 12}d
                                    </span>
                                    <span className={`text-[9px] font-bold ${
                                        score.jeeWeightage === 'Very High' ? 'text-rose-400' :
                                        score.jeeWeightage === 'High' ? 'text-amber-400' : 'text-slate-500'
                                    }`}>
                                        {score.jeeWeightage}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Fresh (&ge;70%)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Fading (45-69%)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Critical Decay (&lt;45%)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Unstudied
                        </span>
                    </div>
                    <span className="text-[11px] text-slate-500 italic">
                        Tip: Click any tile to inspect its 15-minute diagnostic drill capsule
                    </span>
                </div>
            </div>

            {/* 4. ALL CHAPTERS FRAGILITY TABLE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-cyan-400" />
                            Comprehensive Syllabus Fragility Matrix ({filteredScores.length} Chapters)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Full breakdown of memory decay, half-life parameters, days idle, and historical test accuracy.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full hide-scrollbar">
                            {(['All', 'Critical Decay', 'Fading', 'Fresh', 'Unstudied'] as const).map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 ${
                                        statusFilter === st ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-48">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search chapter or unit..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-w-0 max-w-full scrollbar-thin">
                    <table className="min-w-[760px] w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                <th className="py-3 px-4">Chapter &amp; Unit</th>
                                <th className="py-3 px-4">Retention %</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Memory Half-Life (t½)</th>
                                <th className="py-3 px-4">Days Idle</th>
                                <th className="py-3 px-4">Historical Accuracy</th>
                                <th className="py-3 px-4">JEE Weight</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredScores.map(row => (
                                <tr key={row.chapter} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="font-bold text-white whitespace-nowrap">{row.chapter}</div>
                                        <div className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                                            <span>{row.subject}</span>
                                            <span>&bull;</span>
                                            <span>{row.unit || 'Standard'}</span>
                                        </div>
                                    </td>

                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                                                <div 
                                                    className={`h-full ${
                                                        row.retentionPercentage < 45 ? 'bg-rose-500' :
                                                        row.retentionPercentage < 70 ? 'bg-amber-400' : 'bg-emerald-400'
                                                    }`}
                                                    style={{ width: `${row.retentionPercentage}%` }}
                                                />
                                            </div>
                                            <span className="font-mono font-bold text-slate-200">{row.retentionPercentage}%</span>
                                        </div>
                                    </td>

                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap inline-flex items-center shrink-0 ${
                                            row.status === 'Critical Decay' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                                            row.status === 'Fading' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                                            row.status === 'Fresh' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                                            'bg-slate-800 text-slate-400'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>

                                    <td className="py-3 px-4 font-mono text-cyan-300 whitespace-nowrap">
                                        {row.halfLifeDays || 12} days
                                    </td>

                                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                                        {row.daysSinceLastPractice} days ago
                                    </td>

                                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                                        {row.accuracy}% ({row.totalAttempts} Qs)
                                    </td>

                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <span className={`text-[10px] font-bold whitespace-nowrap inline-flex items-center ${
                                            row.jeeWeightage === 'Very High' ? 'text-rose-400' :
                                            row.jeeWeightage === 'High' ? 'text-amber-400' : 'text-slate-400'
                                        }`}>
                                            {row.jeeWeightage}
                                        </span>
                                    </td>

                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => setSelectedCapsuleChapter(row)}
                                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold transition-all"
                                                title="View 15-minute diagnostic capsule"
                                            >
                                                Capsule
                                            </button>
                                            <button
                                                onClick={() => handleInjectTask(row)}
                                                className="px-2.5 py-1 rounded bg-rose-600/30 hover:bg-rose-500 hover:text-white text-rose-300 text-[10px] font-bold transition-all whitespace-nowrap shrink-0 border border-rose-500/40"
                                            >
                                                + Schedule
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5. 3-DAY EMERGENCY RECOVERY PLAN MODAL */}
            <Modal
                isOpen={isEmergencyModalOpen}
                onClose={() => setIsEmergencyModalOpen(false)}
                title="⚡ 3-Day Emergency Retention Recovery Sprint"
                maxWidth="2xl"
            >
                <div className="p-6 space-y-6 text-slate-200">
                    <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <span>Proactive Spaced Retrieval Protocol</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                            Distributes your top 6 decaying high-weightage chapters across the next 3 days in the Daily Planner to halt amnesia drift before test day.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {preview3DayTasks.map((t, idx) => (
                            <div key={t.id || idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                            {t.scheduledTime || `Day ${Math.floor(idx / 2) + 1}`}
                                        </span>
                                        <span className="text-xs font-bold text-white">{t.linkedTopic}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{t.text}</p>
                                </div>
                                <span className="text-xs font-mono font-bold text-cyan-300 shrink-0">
                                    {t.estimatedTime}m
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            onClick={() => setIsEmergencyModalOpen(false)}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm3DayPlan}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
                        >
                            <Zap className="w-4 h-4" />
                            <span>Confirm &amp; Inject 6 Tasks into Planner</span>
                        </button>
                    </div>
                </div>
            </Modal>

            {/* 6. 15-MINUTE MICRO-REVISION CAPSULE MODAL */}
            {selectedCapsuleChapter && activeCapsuleData && (
                <Modal
                    isOpen={!!selectedCapsuleChapter}
                    onClose={() => setSelectedCapsuleChapter(null)}
                    title={`⚡ 15-Minute Micro-Revision Drill: ${activeCapsuleData.chapterName}`}
                    maxWidth="md"
                >
                    <div className="p-6 space-y-5 text-slate-200">
                        <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div>
                                <span className="text-[10px] font-mono uppercase text-slate-400">{activeCapsuleData.subject}</span>
                                <h4 className="text-base font-bold text-white">{activeCapsuleData.chapterName}</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-mono text-rose-400 font-bold block">{activeCapsuleData.currentRetention}% Retention</span>
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">&rarr; {activeCapsuleData.projectedRetention}% Projected</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Timer className="w-4 h-4" />
                                <span>3-Phase Micro-Sprint Strategy</span>
                            </h5>

                            <div className="space-y-2 text-xs">
                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                                    <div className="font-bold text-white flex justify-between">
                                        <span>Phase 1: Active Recall (4 mins)</span>
                                        <span className="text-cyan-400 font-mono">0 - 4m</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] mt-0.5">
                                        {activeCapsuleData.focusStrategy}
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                                    <div className="font-bold text-white flex justify-between">
                                        <span>Phase 2: Target PYQs (9 mins)</span>
                                        <span className="text-cyan-400 font-mono">4 - 13m</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] mt-0.5">
                                        Attempt {activeCapsuleData.targetQuestions} high-probability questions under strict exam timing.
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                                    <div className="font-bold text-white flex justify-between">
                                        <span>Phase 3: Error Tagging (2 mins)</span>
                                        <span className="text-cyan-400 font-mono">13 - 15m</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] mt-0.5">
                                        Log any slips to reset memory half-life to +{activeCapsuleData.halfLifeExtendedDays} days.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                            <button
                                onClick={() => setSelectedCapsuleChapter(null)}
                                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleInjectCapsuleTask}
                                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Schedule 15m Drill in Planner</span>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
