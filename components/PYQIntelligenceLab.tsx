// ============================================================================
// PYQ Intelligence Lab (Full-Page Component)
// Historical Frequency Heatmaps, NTA 2024-2026 Reduction Guard & 2D ROI Matrix
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
    Flame, BarChart3, Target, Compass, Sparkles, Plus, Check, 
    Layers, Search, Filter, ArrowUpRight, TrendingUp, AlertCircle,
    ChevronRight, BookOpen, ShieldCheck, ShieldAlert, Zap, Clock,
    HelpCircle, Eye, ArrowRight, Ban, Award, CheckCircle2
} from 'lucide-react';
import { UserProfile, DailyTask, TaskType, TaskEffort, QuestionLog, PYQChapterMetadata } from '../types';
import { 
    getChapterWeightages, 
    getCoverageQuadrantItems, 
    computeCoverageGapScore, 
    getTrendingTopics,
    getSyllabusPruningSummary
} from '../services/pyqService';
import { Modal } from './ui/Modal';

interface PYQIntelligenceLabProps {
    userProfile: UserProfile;
    questionLogs?: QuestionLog[];
    onUpdateTasks?: (tasks: DailyTask[] | ((prev: DailyTask[]) => DailyTask[])) => void;
    setView?: (view: any) => void;
}

export const PYQIntelligenceLab: React.FC<PYQIntelligenceLabProps> = ({
    userProfile,
    questionLogs = [],
    onUpdateTasks,
    setView
}) => {
    const [examType, setExamType] = useState<'JEE Mains' | 'JEE Advanced'>('JEE Mains');
    const [activeTab, setActiveTab] = useState<'heatmap' | 'roi' | 'coverage' | 'pruned'>('heatmap');
    const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Maths'>('All');
    const [syllabusFilter, setSyllabusFilter] = useState<'All' | 'Active Core' | 'Pruned / Deleted by NTA'>('Active Core');
    const [searchQuery, setSearchQuery] = useState('');
    const [onlyHighYield, setOnlyHighYield] = useState(false);
    const [injectedTasks, setInjectedTasks] = useState<Record<string, boolean>>({});
    const [selectedChapterDetails, setSelectedChapterDetails] = useState<PYQChapterMetadata | null>(null);

    // Data computations
    const weightages = useMemo(() => {
        let list = getChapterWeightages(
            selectedSubject === 'All' ? undefined : selectedSubject,
            examType,
            questionLogs,
            syllabusFilter
        );
        if (onlyHighYield) {
            list = list.filter(w => w.avgQuestionsPerPaper >= 1.2 || w.predictedNextShiftProb >= 95);
        }
        return list;
    }, [selectedSubject, examType, questionLogs, syllabusFilter, onlyHighYield]);

    const quadrantItems = useMemo(() => {
        return getCoverageQuadrantItems(userProfile, examType, questionLogs);
    }, [userProfile, examType, questionLogs]);

    const gapScore = useMemo(() => {
        return computeCoverageGapScore(userProfile, examType, questionLogs);
    }, [userProfile, examType, questionLogs]);

    const pruningSummary = useMemo(() => {
        return getSyllabusPruningSummary(examType);
    }, [examType]);

    // Urgent Gaps (High Frequency + Uncovered in Active Syllabus)
    const urgentGaps = useMemo(() => {
        return quadrantItems.filter(q => 
            q.quadrant === 'High Freq + Uncovered' && 
            q.syllabusStatus !== 'Pruned / Deleted by NTA'
        );
    }, [quadrantItems]);

    // Filtered Heatmap Data
    const filteredWeightages = useMemo(() => {
        if (!searchQuery.trim()) return weightages;
        const q = searchQuery.toLowerCase().trim();
        return weightages.filter(w => 
            w.chapter.toLowerCase().includes(q) || 
            w.dominantTopics.some(t => t.toLowerCase().includes(q))
        );
    }, [weightages, searchQuery]);

    // 1-Click Inject Urgent Gap Task into Daily Planner
    const handleInjectTask = (chapterName: string, avgMarks: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!onUpdateTasks) return;

        const newTask: DailyTask = {
            id: `pyq-gap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            text: `[High-Yield PYQ Sprint] Solve 25 Questions: ${chapterName} (~${avgMarks} Marks)`,
            completed: false,
            taskType: TaskType.ProblemPractice,
            linkedTopic: chapterName,
            estimatedTime: 50,
            effort: TaskEffort.High,
            isGhost: false
        };

        onUpdateTasks(prev => [newTask, ...prev]);
        setInjectedTasks(prev => ({ ...prev, [chapterName]: true }));
        setTimeout(() => {
            setInjectedTasks(prev => ({ ...prev, [chapterName]: false }));
        }, 4000);
    };

    return (
        <div className="space-y-6">
            {/* 1. HEADER & KPI METRICS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 shrink-0" />
                            <span>PYQ Intelligence Lab</span>
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 whitespace-nowrap inline-flex items-center shrink-0">
                            120+ NTA Shifts &bull; 2020-2025
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                        Historical shift telemetry, 2024 NTA syllabus reduction guard, and high-yield coverage gap triage.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Exam Type Toggle */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-bold shadow-sm">
                        <button
                            onClick={() => setExamType('JEE Mains')}
                            className={`px-3 py-1 rounded-lg transition-colors ${
                                examType === 'JEE Mains' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            JEE Mains
                        </button>
                        <button
                            onClick={() => setExamType('JEE Advanced')}
                            className={`px-3 py-1 rounded-lg transition-colors ${
                                examType === 'JEE Advanced' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            JEE Advanced
                        </button>
                    </div>

                    {/* Coverage Gap KPI */}
                    <div className="bg-surface-2 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                        <span className="text-xs text-slate-400 font-medium">High-Yield Alignment:</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                            {gapScore}%
                        </span>
                    </div>

                    {/* Urgent Gaps Pill */}
                    {urgentGaps.length > 0 && (
                        <div className="bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-xs text-rose-300 font-medium">Uncovered High-Yield:</span>
                            <span className="text-xs font-bold text-rose-400 font-mono">{urgentGaps.length}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. NAVIGATION TABS */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('heatmap')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            activeTab === 'heatmap' ? 'bg-slate-800 text-orange-400 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Shift Frequency Matrix</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('roi')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            activeTab === 'roi' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5" />
                        <span>2D ROI Matrix</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('coverage')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            activeTab === 'coverage' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Target className="w-3.5 h-3.5" />
                        <span>Coverage Gap Grid ({urgentGaps.length} Gaps)</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('pruned')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            activeTab === 'pruned' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                        <span>NTA Reduction Guard ({pruningSummary.prunedChaptersCount} Pruned)</span>
                    </button>
                </div>

                {/* Sub-Filters: Subject & Search */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Subject Filter */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                        {(['All', 'Physics', 'Chemistry', 'Maths'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setSelectedSubject(s)}
                                className={`px-2.5 py-1 rounded-lg transition-colors ${
                                    selectedSubject === s ? 'bg-slate-800 text-orange-400' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-44">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search chapter..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                        />
                    </div>
                </div>
            </div>

            {/* TAB 1: SHIFT FREQUENCY MATRIX */}
            {activeTab === 'heatmap' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                        <div>
                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-orange-400" />
                                <span>6-Year Shift Frequency &amp; Weightage Breakdown ({filteredWeightages.length} Chapters)</span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Aggregated across all Jan &amp; April sessions from 2020 through 2025.
                            </p>
                        </div>

                        {/* Syllabus Status Switch */}
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                            {(['Active Core', 'Pruned / Deleted by NTA', 'All'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSyllabusFilter(f as any)}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        syllabusFilter === f ? 'bg-slate-800 text-orange-300' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {f === 'Pruned / Deleted by NTA' ? 'Pruned Topics' : f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frequency Table */}
                    <div className="overflow-x-auto min-w-0 max-w-full scrollbar-thin">
                        <table className="min-w-[800px] w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                    <th className="py-3 px-4">Chapter &amp; Dominant Subtopics</th>
                                    <th className="py-3 px-4">Syllabus Status</th>
                                    <th className="py-3 px-4">Avg Qs / Paper</th>
                                    <th className="py-3 px-4">Shift History (2020 - 2025)</th>
                                    <th className="py-3 px-4">Next Shift Prob</th>
                                    <th className="py-3 px-4">Your PYQ Depth</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {filteredWeightages.map(item => {
                                    const isPruned = item.syllabusStatus === 'Pruned / Deleted by NTA';
                                    const isMod = item.syllabusStatus === 'Partially Modified';
                                    const avgMarks = (item.avgQuestionsPerPaper * 4).toFixed(1);
                                    const isInj = injectedTasks[item.chapter] || false;

                                    return (
                                        <tr 
                                            key={item.id} 
                                            onClick={() => setSelectedChapterDetails(item)}
                                            className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                                        >
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-bold text-white text-sm">{item.chapter}</div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 max-w-xs truncate">
                                                    <span>{item.subject}</span>
                                                    <span>&bull;</span>
                                                    <span className="text-slate-500 truncate">{item.dominantTopics.slice(0, 2).join(', ')}</span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                                                    isPruned 
                                                        ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' :
                                                    isMod
                                                        ? 'bg-amber-950/60 border-amber-500/40 text-amber-400' :
                                                        'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                                                }`}>
                                                    {isPruned ? 'Pruned by NTA' : isMod ? 'Partially Modified' : 'Active Core'}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-mono font-bold text-white text-xs">
                                                    {item.avgQuestionsPerPaper} <span className="text-slate-400 text-[10px]">Qs</span>
                                                </div>
                                                <div className="text-[10px] text-orange-400 font-mono font-semibold">
                                                    ~{avgMarks} Marks
                                                </div>
                                            </td>

                                            {/* Shift Sparkline */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-end gap-1.5 h-6">
                                                    {Object.entries(item.yearAppearances).map(([yr, count]) => {
                                                        const heightPct = Math.min(100, Math.max(15, (count / 30) * 100));
                                                        return (
                                                            <div key={yr} className="flex flex-col items-center gap-0.5" title={`${yr}: ${count} questions`}>
                                                                <div 
                                                                    className={`w-2 rounded-t transition-all ${
                                                                        isPruned ? 'bg-rose-500/40' : 'bg-orange-400'
                                                                    }`}
                                                                    style={{ height: `${heightPct}%` }}
                                                                />
                                                                <span className="text-[8px] font-mono text-slate-500">{yr.slice(2)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span className={`font-mono font-bold text-xs ${
                                                    item.predictedNextShiftProb >= 95 ? 'text-emerald-400' :
                                                    item.predictedNextShiftProb >= 85 ? 'text-cyan-400' :
                                                    item.predictedNextShiftProb === 0 ? 'text-rose-500' : 'text-slate-400'
                                                }`}>
                                                    {item.predictedNextShiftProb}%
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                                                    <div 
                                                        className="bg-emerald-400 h-full transition-all"
                                                        style={{ width: `${item.coverageDepthPct || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400">
                                                    {item.userSolvedCount || 0} / 25 Qs ({item.coverageDepthPct || 0}%)
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                {!isPruned ? (
                                                    <button
                                                        onClick={(e) => handleInjectTask(item.chapter, Number(avgMarks), e)}
                                                        disabled={isInj}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                            isInj 
                                                                ? 'bg-emerald-500 text-slate-950'
                                                                : 'bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-slate-950 border border-orange-500/40'
                                                        }`}
                                                    >
                                                        {isInj ? 'Added' : '+ Practice'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-rose-500 font-mono">Skip (Pruned)</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: 2D ROI MATRIX (STUDY HOURS VS MARKS) */}
            {activeTab === 'roi' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-base font-black text-white">
                                2D ROI Matrix: Study Hours Invested vs Marks Delivered
                            </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Maximizes rank efficiency by identifying high-yield quick wins vs heavy time sink chapters.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Quadrant 1: Quick High-Yield Wins */}
                        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                            <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                                <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" /> 🚀 1. Quick High-Yield Wins (Must Master)
                                </span>
                                <span className="text-[10px] font-mono text-emerald-300 font-bold">&gt; 0.40 Marks / Study Hour</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Moderate to high exam weightage requiring under 14 hours of total preparation time.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {weightages.filter(w => w.roiCategory === 'Quick Win').slice(0, 12).map(w => (
                                    <span key={w.chapter} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                                        {w.chapter} ({(w.avgQuestionsPerPaper * 4).toFixed(0)}m / {w.estimatedStudyHours}h)
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quadrant 2: Heavy Foundation Grinds */}
                        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-3">
                            <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
                                <span className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                                    <Compass className="w-4 h-4" /> 🏋️ 2. Heavy Foundation Grinds
                                </span>
                                <span className="text-[10px] font-mono text-cyan-300 font-bold">High Marks, High Effort</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Vital for 99+ percentile, but requires disciplined long study hours (18 to 35 hours).
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {weightages.filter(w => w.roiCategory === 'Heavy Grind').slice(0, 10).map(w => (
                                    <span key={w.chapter} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                                        {w.chapter} ({(w.avgQuestionsPerPaper * 4).toFixed(0)}m / {w.estimatedStudyHours}h)
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quadrant 3: Low-Effort Niches */}
                        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-3">
                            <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                                <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                                    <Target className="w-4 h-4" /> 🎯 3. Low-Effort Niches
                                </span>
                                <span className="text-[10px] font-mono text-amber-300 font-bold">Fast Standalone Topics</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Standalone 2 to 4 mark topics with short theory (under 10 hours).
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {weightages.filter(w => w.roiCategory === 'Niche').slice(0, 8).map(w => (
                                    <span key={w.chapter} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950/80 border border-amber-700/60 text-amber-300">
                                        {w.chapter} ({(w.avgQuestionsPerPaper * 4).toFixed(0)}m / {w.estimatedStudyHours}h)
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quadrant 4: Low-ROI / Pruned Traps */}
                        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                            <div className="flex justify-between items-center border-b border-rose-500/20 pb-2">
                                <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                                    <Ban className="w-4 h-4" /> ⚠️ 4. Pruned / Zero-ROI Traps
                                </span>
                                <span className="text-[10px] font-mono text-rose-400 font-bold">0 Marks in 2025/2026</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Pruned by NTA. Do NOT spend study time solving these from old PYQ books!
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {pruningSummary.prunedChapters.map(p => (
                                    <span key={p.chapter} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/80 border border-rose-700/60 text-rose-300">
                                        {p.chapter} ({p.subject})
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: 4-QUADRANT COVERAGE MATRIX */}
            {activeTab === 'coverage' && (
                <div className="space-y-6">
                    {/* Urgent Action Banner */}
                    {urgentGaps.length > 0 && (
                        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-white">
                                        {urgentGaps.length} High-Yield Chapters Need Immediate PYQ Coverage
                                    </h4>
                                    <p className="text-xs text-rose-300/80">
                                        These active topics appear in &gt; 90% of shift papers but you have solved &lt; 60% of target practice questions.
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-rose-300 bg-rose-900/60 px-3 py-1 rounded-xl border border-rose-500/40 shrink-0">
                                Up to +{(urgentGaps.length * 6)} Marks Recovery
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* High Freq + Uncovered */}
                        <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 space-y-3">
                            <div className="flex justify-between items-center border-b border-rose-500/20 pb-2">
                                <span className="text-xs font-black uppercase text-rose-400">
                                    🚨 High Frequency &bull; Uncovered ({urgentGaps.length})
                                </span>
                                <span className="text-[10px] text-slate-500">Highest Risk</span>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {urgentGaps.map(item => (
                                    <div key={item.chapter} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                                        <div>
                                            <div className="font-bold text-white text-xs">{item.chapter}</div>
                                            <div className="text-[10px] text-slate-400">{item.subject} &bull; ~{item.avgMarksPerPaper} Marks</div>
                                        </div>
                                        <button
                                            onClick={(e) => handleInjectTask(item.chapter, item.avgMarksPerPaper, e)}
                                            className="px-2 py-1 rounded bg-rose-600/30 hover:bg-rose-500 hover:text-white text-rose-300 text-[10px] font-bold transition-all border border-rose-500/40 shrink-0"
                                        >
                                            {injectedTasks[item.chapter] ? 'Added' : '+ Schedule'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* High Freq + Covered */}
                        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                            <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                                <span className="text-xs font-black uppercase text-emerald-400">
                                    ✅ High Frequency &bull; Covered
                                </span>
                                <span className="text-[10px] text-slate-500">Secured Fortress</span>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {quadrantItems.filter(q => q.quadrant === 'High Freq + Covered').map(item => (
                                    <div key={item.chapter} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                                        <div>
                                            <div className="font-bold text-white text-xs">{item.chapter}</div>
                                            <div className="text-[10px] text-slate-400">{item.subject} &bull; ~{item.avgMarksPerPaper} Marks</div>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                                            Secured
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: NTA 2024-2026 SYLLABUS REDUCTION GUARD */}
            {activeTab === 'pruned' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Ban className="w-5 h-5 text-rose-400" />
                                <h3 className="text-base font-black text-white">
                                    Official NTA Syllabus Reduction Intelligence (2024 - 2026)
                                </h3>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Prevents wasting dozens of hours solving out-of-syllabus questions from older PYQ collections.
                            </p>
                        </div>
                        <div className="bg-rose-950/60 border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-rose-300">
                            Saves ~35+ Hours of Dead Prep
                        </div>
                    </div>

                    {/* Completely Deleted Chapters */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            <span>Completely Deleted Chapters ({pruningSummary.prunedChaptersCount} Chapters)</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {pruningSummary.prunedChapters.map(p => (
                                <div key={p.chapter} className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 space-y-1.5">
                                    <div className="flex justify-between items-start">
                                        <h5 className="font-bold text-white text-xs">{p.chapter}</h5>
                                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                                            {p.subject}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-tight">{p.note}</p>
                                    <div className="text-[10px] text-rose-400/80 font-mono pt-1">
                                        Zero questions expected in 2025/2026
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Partially Pruned Subtopics */}
                    <div className="space-y-3 pt-4 border-t border-slate-800/80">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                            <span>Active Chapters with Pruned Subtopics ({pruningSummary.modifiedChaptersCount} Chapters)</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pruningSummary.modifiedChapters.map(m => (
                                <div key={m.chapter} className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <h5 className="font-bold text-white text-xs">{m.chapter}</h5>
                                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                                            {m.subject}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-amber-300/80">
                                        Omitted: {m.prunedSubtopics.join(' &bull; ')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CHAPTER DETAIL MODAL */}
            {selectedChapterDetails && (
                <Modal
                    isOpen={!!selectedChapterDetails}
                    onClose={() => setSelectedChapterDetails(null)}
                    title={`PYQ Deep Dive: ${selectedChapterDetails.chapter}`}
                    maxWidth="md"
                >
                    <div className="p-6 space-y-5 text-slate-200">
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedChapterDetails.subject}</span>
                                <h4 className="text-base font-bold text-white">{selectedChapterDetails.chapter}</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-mono font-bold text-orange-400 block">
                                    {selectedChapterDetails.avgQuestionsPerPaper} Qs / Paper
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                    {selectedChapterDetails.predictedNextShiftProb}% Shift Probability
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                                Dominant Question Archetypes (Highest Yield)
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                                {selectedChapterDetails.dominantTopics.map((topic, i) => (
                                    <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                                        <span className="text-orange-400 font-mono font-bold">{i + 1}.</span>
                                        <span>{topic}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {selectedChapterDetails.prunedTopics && selectedChapterDetails.prunedTopics.length > 0 && (
                            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                                <span className="font-bold block mb-1">⚠️ Pruned by NTA:</span>
                                <span>{selectedChapterDetails.prunedTopics.join(', ')}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                            <button
                                onClick={() => setSelectedChapterDetails(null)}
                                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleInjectTask(selectedChapterDetails.chapter, selectedChapterDetails.avgQuestionsPerPaper * 4);
                                    setSelectedChapterDetails(null);
                                }}
                                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Schedule Practice Sprint</span>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
