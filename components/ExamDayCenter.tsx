// ============================================================================
// Exam Day Command Center (Full-Page Component)
// D-Day War-Room Protocol, Mental Reset, Morning Checklist & Strategy Card
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShieldAlert, Compass, CheckCircle2, Clock, Zap, AlertTriangle, 
    Check, Sparkles, Heart, Flag, Bookmark, Award, HelpCircle,
    ChevronRight, ArrowRight, Eye, RefreshCw, AlertOctagon, X,
    FileText, Layers, Ban, UserCheck, Activity, Info, RotateCcw
} from 'lucide-react';
import { UserProfile, QuestionLog, Reflection } from '../types';
import { 
    generateAttemptStrategyCard, 
    getPreExamProtocol, 
    estimateDayOfScore,
    estimateExamPerformance,
    isExamDay
} from '../services/examDayService';

interface ExamDayCenterProps {
    userProfile: UserProfile;
    questionLogs: QuestionLog[];
    reflections?: Reflection[];
    setView?: (view: any) => void;
}

export const ExamDayCenter: React.FC<ExamDayCenterProps> = ({
    userProfile,
    questionLogs,
    reflections = [],
    setView
}) => {
    // Checklist persistence
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(localStorage.getItem('exam_day_checklist_state') || '{}');
        } catch { return {}; }
    });

    // Breathing pacer state
    const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [breathingSeconds, setBreathingSeconds] = useState(4);
    const [isBreathingActive, setIsBreathingActive] = useState(false);
    const [selectedAffirmationIndex, setSelectedAffirmationIndex] = useState(0);

    // Shift selection
    const [shiftMode, setShiftMode] = useState<'Morning (09:00 - 12:00)' | 'Afternoon (15:00 - 18:00)'>('Morning (09:00 - 12:00)');
    const [activeChecklistTab, setActiveChecklistTab] = useState<'mandatory' | 'permitted' | 'prohibited' | 'dress'>('mandatory');

    // Panic reset modal state
    const [showPanicModal, setShowPanicModal] = useState(false);
    const [panicStepIndex, setPanicStepIndex] = useState(0);

    // Score estimator state
    const [scoreShiftDifficulty, setScoreShiftDifficulty] = useState<'Easy' | 'Moderate' | 'Tough'>('Moderate');
    const [questionStates, setQuestionStates] = useState<Record<number, 'correct' | 'wrong' | 'unattempted'>>(() => {
        try {
            return JSON.parse(localStorage.getItem('exam_day_question_states') || '{}');
        } catch { return {}; }
    });

    const strategyCard = useMemo(() => {
        return generateAttemptStrategyCard(questionLogs);
    }, [questionLogs]);

    const preExamProtocol = useMemo(() => {
        return getPreExamProtocol(reflections);
    }, [reflections]);

    // Save checklist state to localStorage
    const handleToggleCheck = (itemId: string) => {
        setChecklistState(prev => {
            const next = { ...prev, [itemId]: !prev[itemId] };
            try { localStorage.setItem('exam_day_checklist_state', JSON.stringify(next)); } catch {}
            return next;
        });
    };

    // Toggle 75-question state: unattempted -> correct (+4) -> wrong (-1) -> unattempted
    const handleToggleQuestionState = (qNum: number) => {
        setQuestionStates(prev => {
            const current = prev[qNum] || 'unattempted';
            const next: 'unattempted' | 'correct' | 'wrong' = current === 'unattempted' ? 'correct' : current === 'correct' ? 'wrong' : 'unattempted';
            const updated: Record<number, 'unattempted' | 'correct' | 'wrong'> = { ...prev, [qNum]: next };
            try { localStorage.setItem('exam_day_question_states', JSON.stringify(updated)); } catch {}
            return updated;
        });
    };

    // Quick score actions
    const handleClearScoreEstimator = () => {
        setQuestionStates({});
        try { localStorage.removeItem('exam_day_question_states'); } catch {}
    };

    const handleFillSample = () => {
        const sample: Record<number, 'correct' | 'wrong' | 'unattempted'> = {};
        for (let i = 1; i <= 75; i++) {
            const rand = Math.random();
            if (rand < 0.60) sample[i] = 'correct';
            else if (rand < 0.75) sample[i] = 'wrong';
            else sample[i] = 'unattempted';
        }
        setQuestionStates(sample);
        try { localStorage.setItem('exam_day_question_states', JSON.stringify(sample)); } catch {}
    };

    // Calculate live estimated marks
    const scoreBreakdown = useMemo(() => {
        let pScore = 0, cScore = 0, mScore = 0;
        let pCorrect = 0, pWrong = 0, cCorrect = 0, cWrong = 0, mCorrect = 0, mWrong = 0;

        for (let i = 1; i <= 75; i++) {
            const state = questionStates[i] || 'unattempted';
            const marks = state === 'correct' ? 4 : state === 'wrong' ? -1 : 0;

            if (i <= 25) {
                pScore += marks;
                if (state === 'correct') pCorrect++;
                if (state === 'wrong') pWrong++;
            } else if (i <= 50) {
                cScore += marks;
                if (state === 'correct') cCorrect++;
                if (state === 'wrong') cWrong++;
            } else {
                mScore += marks;
                if (state === 'correct') mCorrect++;
                if (state === 'wrong') mWrong++;
            }
        }

        const totalScore = Math.max(0, pScore + cScore + mScore);
        const totalAttempted = pCorrect + pWrong + cCorrect + cWrong + mCorrect + mWrong;
        const totalCorrect = pCorrect + cCorrect + mCorrect;
        const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

        return {
            physics: pScore,
            chemistry: cScore,
            maths: mScore,
            totalScore,
            totalAttempted,
            totalCorrect,
            accuracy
        };
    }, [questionStates]);

    // Live performance projection
    const performanceProjection = useMemo(() => {
        return estimateExamPerformance(scoreBreakdown.totalScore, scoreShiftDifficulty);
    }, [scoreBreakdown.totalScore, scoreShiftDifficulty]);

    // 4-7-8 Breathing Loop
    useEffect(() => {
        if (!isBreathingActive) return;

        const interval = setInterval(() => {
            setBreathingSeconds(prev => {
                if (prev > 1) return prev - 1;

                if (breathingPhase === 'Inhale') {
                    setBreathingPhase('Hold');
                    return 7;
                } else if (breathingPhase === 'Hold') {
                    setBreathingPhase('Exhale');
                    return 8;
                } else {
                    setBreathingPhase('Inhale');
                    return 4;
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isBreathingActive, breathingPhase]);

    // Mandatory docs completion calculation
    const mandatoryList = preExamProtocol.categorizedChecklist?.mandatoryDocs || [];
    const completedMandatoryCount = mandatoryList.filter(d => checklistState[d.id]).length;
    const totalMandatoryCount = mandatoryList.length;
    const isReadyForCenter = completedMandatoryCount === totalMandatoryCount;

    return (
        <div className="space-y-6">
            {/* 1. STANDARDIZED HEADER ROW */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" />
                            <span>Exam Day Command Center</span>
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 whitespace-nowrap inline-flex items-center">
                            D-Day War Room
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Authentic NTA regulations, 3-Pass pacing strategy, biometric countdown, and rapid post-exam score key.
                    </p>
                </div>

                {/* Right control cluster */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Shift Selector */}
                    <div className="flex items-center gap-1 bg-surface-2 border border-white/10 p-1 rounded-xl text-xs font-medium">
                        <button
                            onClick={() => setShiftMode('Morning (09:00 - 12:00)')}
                            className={`px-3 py-1.5 rounded-lg transition-all font-mono font-bold ${
                                shiftMode.startsWith('Morning') ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Morning (09:00)
                        </button>
                        <button
                            onClick={() => setShiftMode('Afternoon (15:00 - 18:00)')}
                            className={`px-3 py-1.5 rounded-lg transition-all font-mono font-bold ${
                                shiftMode.startsWith('Afternoon') ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Afternoon (15:00)
                        </button>
                    </div>

                    {/* Panic Protocol Trigger Button */}
                    <button
                        onClick={() => { setShowPanicModal(true); setPanicStepIndex(0); }}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/30"
                    >
                        <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                        <span>Panic Protocol</span>
                    </button>
                </div>
            </div>

            {/* CRITICAL NTA GATE CLOSURE ALERT BANNER */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-slate-900 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                        <strong className="text-rose-300 font-bold block sm:inline mr-2">
                            Strict NTA Biometric Gate Closure:
                        </strong>
                        <span className="text-slate-300">
                            {shiftMode.startsWith('Morning')
                                ? 'Morning Shift gate locks strictly at 08:30 AM. Reporting starts at 07:30 AM.'
                                : 'Afternoon Shift gate locks strictly at 02:30 PM. Reporting starts at 01:30 PM.'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30 text-[11px]">
                        {shiftMode.startsWith('Morning') ? 'Gate Lock: 08:30 AM' : 'Gate Lock: 02:30 PM'}
                    </span>
                </div>
            </div>

            {/* 2. TWO-COLUMN HIGH-IMPACT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COL: 4-7-8 Breathing, Affirmations & Venue Arrival (1 Col) */}
                <div className="space-y-6">
                    {/* Guided Breathing Box */}
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-5 text-center">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                Physiological Reset
                            </span>
                            <h3 className="text-base font-black text-white mt-1">
                                4-7-8 Heart-Rate Stabilizer
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Activates the parasympathetic vagus nerve to reduce acute cortisol spikes before entering the hall.
                            </p>
                        </div>

                        {/* Interactive Breathing Circle */}
                        <div className="flex flex-col items-center justify-center py-2">
                            <div 
                                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-2xl border-4 ${
                                    breathingPhase === 'Inhale' 
                                        ? 'bg-cyan-950/80 border-cyan-400 scale-110 shadow-cyan-500/30' :
                                    breathingPhase === 'Hold'
                                        ? 'bg-amber-950/80 border-amber-400 scale-105 shadow-amber-500/30' :
                                        'bg-indigo-950/80 border-indigo-400 scale-95 shadow-indigo-500/30'
                                }`}
                            >
                                <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                                    {breathingPhase}
                                </span>
                                <span className="text-4xl font-black font-mono text-white mt-1">
                                    {breathingSeconds}s
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setIsBreathingActive(!isBreathingActive);
                                setBreathingPhase('Inhale');
                                setBreathingSeconds(4);
                            }}
                            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
                                isBreathingActive
                                    ? 'bg-slate-800 text-rose-300 border border-slate-700 hover:bg-slate-700'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                            }`}
                        >
                            {isBreathingActive ? 'Pause Breathing Cycle' : 'Start 4-7-8 Reset (3 Mins)'}
                        </button>
                    </div>

                    {/* Affirmations Carousel */}
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Mindset & Mental Anchor
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                                {selectedAffirmationIndex + 1} / {preExamProtocol.affirmations.length}
                            </span>
                        </div>

                        <div className="min-h-[85px] flex items-center justify-center p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-200 font-medium text-center leading-relaxed italic">
                            "{preExamProtocol.affirmations[selectedAffirmationIndex]}"
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                onClick={() => setSelectedAffirmationIndex((selectedAffirmationIndex + 1) % preExamProtocol.affirmations.length)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors flex items-center gap-1"
                            >
                                <span>Next Anchor</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Center Arrival & Terminal Checklist */}
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" /> Venue & Terminal Protocol
                        </span>
                        <ul className="space-y-2 text-xs text-slate-300">
                            {preExamProtocol.centerArrivalGuide.map((guide, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                    <span className="text-cyan-400 font-mono font-bold shrink-0">{idx + 1}.</span>
                                    <span>{guide}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* RIGHT COL: Categorized Checklists, 3-Pass Strategy & Traps (2 Cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* SECTION 1: 3-HOUR EXAM FLOW BLUEPRINT (3-PASS STRATEGY) */}
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                    Pacing Architecture
                                </span>
                                <h3 className="text-lg font-black text-white mt-0.5">
                                    3-Pass Examination Blueprint (180 Minutes)
                                </h3>
                            </div>
                            <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold self-start sm:self-auto">
                                Negative-Mark Immune
                            </span>
                        </div>

                        {/* 3-Pass Flow Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pass 1 */}
                            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                            0 - 60 Min
                                        </span>
                                        <span className="text-xs font-mono text-cyan-400 font-bold">Pass 1</span>
                                    </div>
                                    <h4 className="text-base font-black text-white">Speed Harvest</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {strategyCard.passBreakdown?.pass1.focus || 'Direct recall, formula application, single-concept theory.'}
                                    </p>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-cyan-900/40">
                                    <span className="text-[11px] font-mono text-cyan-300 font-bold block">
                                        Target: {strategyCard.passBreakdown?.pass1.targetYield || '30-35 Qs | 110-130 Marks'}
                                    </span>
                                    <p className="text-[10px] text-slate-400 italic">
                                        Rule: {strategyCard.passBreakdown?.pass1.skipRule || 'Skip if >60s algebra needed.'}
                                    </p>
                                </div>
                            </div>

                            {/* Pass 2 */}
                            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                            60 - 140 Min
                                        </span>
                                        <span className="text-xs font-mono text-indigo-400 font-bold">Pass 2</span>
                                    </div>
                                    <h4 className="text-base font-black text-white">Calculated Grind</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {strategyCard.passBreakdown?.pass2.focus || 'Moderate multi-step problems, coordinate geometry & Section B numericals.'}
                                    </p>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-indigo-900/40">
                                    <span className="text-[11px] font-mono text-indigo-300 font-bold block">
                                        Target: {strategyCard.passBreakdown?.pass2.targetYield || '18-22 Qs | 60-80 Marks'}
                                    </span>
                                    <p className="text-[10px] text-slate-400 italic">
                                        Rule: {strategyCard.passBreakdown?.pass2.skipRule || 'Abandon algebra dead-ends after 2 mins.'}
                                    </p>
                                </div>
                            </div>

                            {/* Pass 3 */}
                            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                            140 - 180 Min
                                        </span>
                                        <span className="text-xs font-mono text-purple-400 font-bold">Pass 3</span>
                                    </div>
                                    <h4 className="text-base font-black text-white">Audit & Negative Prevention</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {strategyCard.passBreakdown?.pass3.focus || 'Calculation verification, arithmetic sign checks, eliminating negative marks.'}
                                    </p>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-purple-900/40">
                                    <span className="text-[11px] font-mono text-purple-300 font-bold block">
                                        Target: {strategyCard.passBreakdown?.pass3.targetYield || '+8 to +16 Net Delta'}
                                    </span>
                                    <p className="text-[10px] text-slate-400 italic">
                                        Rule: {strategyCard.passBreakdown?.pass3.skipRule || 'Zero blind 50/50 guessing.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section B Numerical Selection Heuristic */}
                        {strategyCard.sectionBStrategy && (
                            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1">
                                <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" /> Section B Numerical Selection Tactic (Pick 5 of 10)
                                </span>
                                <p className="text-xs text-amber-200/90 leading-relaxed">
                                    {strategyCard.sectionBStrategy}
                                </p>
                            </div>
                        )}

                        {/* Confidence Starters */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" /> High-Confidence Momentum Starters (Open First 15 Mins Here)
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {strategyCard.confidenceStarters.map((c, i) => (
                                    <span key={i} className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold">
                                        ⚡ {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CATEGORIZED NTA CHECKLIST (DOCS, PERMITTED, PROHIBITED, DRESS CODE) */}
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    Official Verification
                                </span>
                                <h3 className="text-lg font-black text-white mt-0.5">
                                    NTA Center Security & Compliance Checklist
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
                                    isReadyForCenter 
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80' 
                                        : 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                                }`}>
                                    {completedMandatoryCount}/{totalMandatoryCount} Mandatory Ready
                                </span>
                            </div>
                        </div>

                        {/* Checklist Category Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                            <button
                                onClick={() => setActiveChecklistTab('mandatory')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    activeChecklistTab === 'mandatory'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                📄 Mandatory Docs ({preExamProtocol.categorizedChecklist?.mandatoryDocs.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveChecklistTab('permitted')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    activeChecklistTab === 'permitted'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                🖊️ Permitted Items ({preExamProtocol.categorizedChecklist?.permittedItems.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveChecklistTab('prohibited')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    activeChecklistTab === 'prohibited'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                🚫 Strictly Banned ({preExamProtocol.categorizedChecklist?.prohibitedItems.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveChecklistTab('dress')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    activeChecklistTab === 'dress'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                👕 Dress Code Rules
                            </button>
                        </div>

                        {/* Tab 1: Mandatory Docs */}
                        {activeChecklistTab === 'mandatory' && (
                            <div className="space-y-3 animate-fade-in">
                                {preExamProtocol.categorizedChecklist?.mandatoryDocs.map(doc => {
                                    const isChecked = !!checklistState[doc.id];
                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => handleToggleCheck(doc.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                                                isChecked
                                                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 shrink-0 ${
                                                    isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                                                }`}>
                                                    {isChecked && <Check className="w-3.5 h-3.5 font-black" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-xs">{doc.item}</span>
                                                        {doc.mandatory && (
                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                                                Mandatory
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed">
                                                        {doc.detail}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tab 2: Permitted Items */}
                        {activeChecklistTab === 'permitted' && (
                            <div className="space-y-3 animate-fade-in">
                                {preExamProtocol.categorizedChecklist?.permittedItems.map(item => {
                                    const isChecked = !!checklistState[item.id];
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleToggleCheck(item.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                                                isChecked
                                                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 shrink-0 ${
                                                    isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                                                }`}>
                                                    {isChecked && <Check className="w-3.5 h-3.5 font-black" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="font-bold text-xs">{item.item}</span>
                                                    <p className="text-xs text-slate-400 leading-relaxed">
                                                        {item.detail}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tab 3: Prohibited Items */}
                        {activeChecklistTab === 'prohibited' && (
                            <div className="space-y-3 animate-fade-in">
                                {preExamProtocol.categorizedChecklist?.prohibitedItems.map(banned => (
                                    <div
                                        key={banned.id}
                                        className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 flex items-start gap-3"
                                    >
                                        <Ban className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-rose-300">{banned.item}</span>
                                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                                                    Strictly Barred
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {banned.risk}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tab 4: Dress Code */}
                        {activeChecklistTab === 'dress' && (
                            <div className="space-y-3 animate-fade-in">
                                {preExamProtocol.categorizedChecklist?.dressCodeRules.map(dress => (
                                    <div
                                        key={dress.id}
                                        className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-start gap-3"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <span className="font-bold text-xs text-cyan-300">{dress.rule}</span>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {dress.rationale}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: TOP 5 MISTAKES TO AVOID */}
                    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" /> Mock Mistake Vaccinator
                        </span>
                        <h3 className="text-base font-black text-white">
                            Top 5 Mock Error Patterns to Eliminate Today
                        </h3>

                        <div className="space-y-2.5">
                            {strategyCard.topMistakesToAvoid.map((mistake, idx) => (
                                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-200">
                                    <span className="font-mono font-bold text-rose-400 shrink-0">#{idx + 1}</span>
                                    <span className="leading-relaxed">{mistake}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. POST-EXAM 75-QUESTION RAPID SCORE ESTIMATOR & LIVE PROJECTION */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                                📊 Unofficial Score Key
                            </span>
                            <span className="text-xs text-slate-400 font-mono">75 Questions (300 Marks)</span>
                        </div>
                        <h3 className="text-xl font-black text-white mt-1">
                            JEE Mains 75-Question Rapid Score Estimator & Rank Engine
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Click any question to toggle: <span className="text-emerald-400 font-bold">🟢 Correct (+4)</span> ➔ <span className="text-rose-400 font-bold">🔴 Incorrect (-1)</span> ➔ <span className="text-slate-400 font-bold">⚪ Unattempted (0)</span>. Section B highlights numericals where only 5 are counted.
                        </p>
                    </div>

                    {/* Actions and Shift difficulty toggle */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                            <span className="text-[10px] text-slate-500 px-2 uppercase font-black">Shift:</span>
                            {(['Easy', 'Moderate', 'Tough'] as const).map(diff => (
                                <button
                                    key={diff}
                                    onClick={() => setScoreShiftDifficulty(diff)}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                        scoreShiftDifficulty === diff
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleFillSample}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
                        >
                            Sample Run
                        </button>

                        <button
                            onClick={handleClearScoreEstimator}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition-colors flex items-center gap-1"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                {/* Performance Projection Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-center space-y-0.5">
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Physics</span>
                        <span className="text-xl font-black text-white font-mono">{scoreBreakdown.physics}</span>
                        <span className="text-[10px] text-slate-500 block">/ 100 Marks</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-center space-y-0.5">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Chemistry</span>
                        <span className="text-xl font-black text-white font-mono">{scoreBreakdown.chemistry}</span>
                        <span className="text-[10px] text-slate-500 block">/ 100 Marks</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-center space-y-0.5">
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Maths</span>
                        <span className="text-xl font-black text-white font-mono">{scoreBreakdown.maths}</span>
                        <span className="text-[10px] text-slate-500 block">/ 100 Marks</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-500 text-slate-950 text-center shadow-lg shadow-emerald-500/20 space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider block">Total Raw Score</span>
                        <span className="text-2xl font-black font-mono">{scoreBreakdown.totalScore}</span>
                        <span className="text-[10px] font-bold block">/ 300 Marks</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Predicted %tile</span>
                        <span className="text-xl font-black text-cyan-300 font-mono">
                            {performanceProjection.percentile.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">{scoreShiftDifficulty} Shift</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Predicted AIR</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                            ~{performanceProjection.airEstimate.mid.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                            {performanceProjection.qualifiesForAdvanced ? 'Qualified for Adv' : 'Borderline'}
                        </span>
                    </div>
                </div>

                {/* College Tier Eligibility Callout */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-400">Predicted Allocation Frontier:</span>
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                            {performanceProjection.topCollegeTier}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 font-mono">
                        <span>Attempts: <strong className="text-white">{scoreBreakdown.totalAttempted}/75</strong></span>
                        <span>Accuracy: <strong className="text-emerald-400">{scoreBreakdown.accuracy}%</strong></span>
                    </div>
                </div>

                {/* 3 Subject Grids with Section A and Section B Demarcation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Physics Q1 - Q25 */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/20 space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-cyan-300 border-b border-slate-800 pb-2">
                            <span>Physics (Q1 - Q25)</span>
                            <span className="font-mono">{scoreBreakdown.physics} Marks</span>
                        </div>

                        {/* Section A: MCQs Q1 - Q20 */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                Section A: Single Correct (Q1 - Q20)
                            </span>
                            <div className="grid grid-cols-5 gap-1.5">
                                {Array.from({ length: 20 }, (_, i) => i + 1).map(qNum => {
                                    const st = questionStates[qNum] || 'unattempted';
                                    const bg = st === 'correct' ? 'bg-emerald-600 text-white font-black' : st === 'wrong' ? 'bg-rose-600 text-white font-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white';
                                    return (
                                        <button
                                            key={qNum}
                                            onClick={() => handleToggleQuestionState(qNum)}
                                            className={`h-8 rounded-lg font-mono text-xs transition-all flex items-center justify-center ${bg}`}
                                            title={`Q${qNum}: ${st === 'correct' ? '+4' : st === 'wrong' ? '-1' : '0'}`}
                                        >
                                            Q{qNum}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section B: Numericals Q21 - Q25 */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                                Section B: Numericals (Q21 - Q25)
                            </span>
                            <div className="grid grid-cols-5 gap-1.5">
                                {Array.from({ length: 5 }, (_, i) => i + 21).map(qNum => {
                                    const st = questionStates[qNum] || 'unattempted';
                                    const bg = st === 'correct' ? 'bg-emerald-600 text-white font-black' : st === 'wrong' ? 'bg-rose-600 text-white font-black' : 'bg-slate-900 border border-cyan-800/50 text-cyan-400 hover:text-white';
                                    return (
                                        <button
                                            key={qNum}
                                            onClick={() => handleToggleQuestionState(qNum)}
                                            className={`h-8 rounded-lg font-mono text-xs transition-all flex items-center justify-center ${bg}`}
                                            title={`Q${qNum} Numerical: ${st === 'correct' ? '+4' : st === 'wrong' ? '-1' : '0'}`}
                                        >
                                            Q{qNum}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Chemistry Q26 - Q50 */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-amber-300 border-b border-slate-800 pb-2">
                            <span>Chemistry (Q26 - Q50)</span>
                            <span className="font-mono">{scoreBreakdown.chemistry} Marks</span>
                        </div>

                        {/* Section A: MCQs Q26 - Q45 */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                Section A: Single Correct (Q26 - Q45)
                            </span>
                            <div className="grid grid-cols-5 gap-1.5">
                                {Array.from({ length: 20 }, (_, i) => i + 26).map(qNum => {
                                    const st = questionStates[qNum] || 'unattempted';
                                    const bg = st === 'correct' ? 'bg-emerald-600 text-white font-black' : st === 'wrong' ? 'bg-rose-600 text-white font-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white';
                                    return (
                                        <button
                                            key={qNum}
                                            onClick={() => handleToggleQuestionState(qNum)}
                                            className={`h-8 rounded-lg font-mono text-xs transition-all flex items-center justify-center ${bg}`}
                                            title={`Q${qNum}: ${st === 'correct' ? '+4' : st === 'wrong' ? '-1' : '0'}`}
                                        >
                                            Q{qNum}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section B: Numericals Q46 - Q50 */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] uppercase font-bold text-amber-400 block">
                                Section B: Numericals (Q46 - Q50)
                            </span>
                            <div className="grid grid-cols-5 gap-1.5">
                                {Array.from({ length: 5 }, (_, i) => i + 46).map(qNum => {
                                    const st = questionStates[qNum] || 'unattempted';
                                    const bg = st === 'correct' ? 'bg-emerald-600 text-white font-black' : st === 'wrong' ? 'bg-rose-600 text-white font-black' : 'bg-slate-900 border border-amber-800/50 text-amber-400 hover:text-white';
                                    return (
                                        <button
                                            key={qNum}
                                            onClick={() => handleToggleQuestionState(qNum)}
                                            className={`h-8 rounded-lg font-mono text-xs transition-all flex items-center justify-center ${bg}`}
                                            title={`Q${qNum} Numerical: ${st === 'correct' ? '+4' : st === 'wrong' ? '-1' : '0'}`}
                                        >
                                            Q{qNum}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Maths Q51 - Q75 */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/20 space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-purple-300 border-b border-slate-800 pb-2">
                            <span>Mathematics (Q51 - Q75)</span>
                            <span className="font-mono">{scoreBreakdown.maths} Marks</span>
                        </div>

                        {/* Section A: MCQs Q51 - Q70 */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                Section A: Single Correct (Q51 - Q70)
                            </span>
                            <div className="grid grid-cols-5 gap-1.5">
                                {Array.from({ length: 20 }, (_, i) => i + 51).map(qNum => {
                                    const st = questionStates[qNum] || 'unattempted';
                                    const bg = st === 'correct' ? 'bg-emerald-600 text-white font-black' : st === 'wrong' ? 'bg-rose-600 text-white font-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white';
                                    return (
                                        <button
                                            key={qNum}
                                            onClick={() => handleToggleQuestionState(qNum)}
                                            className={`h-8 rounded-lg font-mono text-xs transition-all flex items-center justify-center ${bg}`}
                                            title={`Q${qNum}: ${st === 'correct' ? '+4' : st === 'wrong' ? '-1' : '0'}`}
                                        >
                                            Q{qNum}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section B: Numericals Q71 - Q75 */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] uppercase font-bold text-purple-400 block">
                                Section B: Numericals (Q71 - Q75)
                            </span>
                            <div className="grid grid-cols-5 gap-1.5">
                                {Array.from({ length: 5 }, (_, i) => i + 71).map(qNum => {
                                    const st = questionStates[qNum] || 'unattempted';
                                    const bg = st === 'correct' ? 'bg-emerald-600 text-white font-black' : st === 'wrong' ? 'bg-rose-600 text-white font-black' : 'bg-slate-900 border border-purple-800/50 text-purple-400 hover:text-white';
                                    return (
                                        <button
                                            key={qNum}
                                            onClick={() => handleToggleQuestionState(qNum)}
                                            className={`h-8 rounded-lg font-mono text-xs transition-all flex items-center justify-center ${bg}`}
                                            title={`Q${qNum} Numerical: ${st === 'correct' ? '+4' : st === 'wrong' ? '-1' : '0'}`}
                                        >
                                            Q{qNum}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. EMERGENCY PANIC RESET PROTOCOL MODAL */}
            {showPanicModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-black tracking-widest text-rose-400 flex items-center gap-1.5">
                                    <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
                                    Acute Freeze Rescue Protocol
                                </span>
                                <h3 className="text-xl font-black text-white">
                                    3-Question Mental Reset Flow
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowPanicModal(false)}
                                className="p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            {(preExamProtocol.panicResetProtocol || []).map((step, idx) => (
                                <button
                                    key={step.step}
                                    onClick={() => setPanicStepIndex(idx)}
                                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                                        panicStepIndex === idx
                                            ? 'text-rose-400'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] ${
                                        panicStepIndex === idx ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                        {step.step}
                                    </span>
                                    <span className="hidden sm:inline">Step {step.step}</span>
                                </button>
                            ))}
                        </div>

                        {/* Active Step Content */}
                        {(() => {
                            const activeStep = (preExamProtocol.panicResetProtocol || [])[panicStepIndex];
                            if (!activeStep) return null;

                            return (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="space-y-2">
                                        <span className="text-xs uppercase font-black tracking-widest text-rose-400">
                                            Step {activeStep.step} of 4
                                        </span>
                                        <h4 className="text-lg font-black text-white">
                                            {activeStep.title}
                                        </h4>
                                    </div>

                                    {/* Action Card */}
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                                        <span className="text-[10px] font-black uppercase text-cyan-400 block">
                                            Physical Action:
                                        </span>
                                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                            {activeStep.action}
                                        </p>
                                    </div>

                                    {/* Mental Reframe Card */}
                                    <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 space-y-2">
                                        <span className="text-[10px] font-black uppercase text-rose-400 block">
                                            Internal Cognitive Script:
                                        </span>
                                        <p className="text-xs text-rose-200/90 leading-relaxed italic">
                                            "{activeStep.mentalScript}"
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Modal Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                            <button
                                disabled={panicStepIndex === 0}
                                onClick={() => setPanicStepIndex(prev => Math.max(0, prev - 1))}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Back
                            </button>

                            {panicStepIndex < (preExamProtocol.panicResetProtocol?.length || 4) - 1 ? (
                                <button
                                    onClick={() => setPanicStepIndex(prev => prev + 1)}
                                    className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/40"
                                >
                                    <span>Next Step</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowPanicModal(false)}
                                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                                >
                                    <Check className="w-4 h-4 font-black" />
                                    <span>I Am Calm & Ready to Re-Enter</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
