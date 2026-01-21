import React, { useState } from 'react';
import { Target, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, CalendarPlus, Zap, Brain, Sparkles, X, ChevronRight } from 'lucide-react';

interface DiagnosticWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartAction?: (action: string) => void;
    onAddTask?: (task: { task: string; time: number; topic: string }) => void;
}

type WizardTab = 'five-whys' | 'systemic';

interface FiveWhysState {
    step: number;
    errorType: string;
    topic: string;
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    why5: string;
}

const ERROR_TYPES = [
    { id: 'E3', label: 'E3: Calculation Slip', desc: 'Sign blunder, arithmetic error, fraction flip', color: 'from-rose-500/20 to-red-600/20 text-rose-300 border-rose-500/40' },
    { id: 'E1', label: 'E1: Conceptual Gap', desc: 'Prerequisite missing, wrong formula applied', color: 'from-amber-500/20 to-yellow-600/20 text-amber-300 border-amber-500/40' },
    { id: 'E4', label: 'E4: Reading Trap', desc: 'Missed NOT/INCORRECT, ignored units or STP conditions', color: 'from-orange-500/20 to-amber-600/20 text-orange-300 border-orange-500/40' },
    { id: 'E5', label: 'E5: Time Panic / Rush', desc: 'Hurried under clock ticking, guessed in panic', color: 'from-indigo-500/20 to-blue-600/20 text-indigo-300 border-indigo-500/40' },
    { id: 'E6', label: 'E6: Silly Skip', desc: 'Left easy scoring question unattempted', color: 'from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/40' },
    { id: 'E7', label: 'E7: Trap Choice / Distractor', desc: 'Fell into distractor option without verifying edge case', color: 'from-purple-500/20 to-fuchsia-600/20 text-purple-300 border-purple-500/40' },
];

const WHY1_OPTIONS = [
    'Got -1 negative mark on a standard solvable question',
    'Spent over 5 minutes and ended up guessing or leaving blank',
    'Arrived at right algebraic answer but marked wrong option key',
    'Froze up completely at the start of the question'
];

const WHY2_OPTIONS: Record<string, string[]> = {
    E3: [
        'Attempted multi-step mental math without writing intermediate algebra',
        'Cramped scratchpad notes caused number miscopying (e.g. 7 read as 1)',
        'Misapplied sign convention or mixed up radian vs degree angle',
        'Rushed through denominator multiplication in the final 10 seconds'
    ],
    E1: [
        'Could not recall the exact formula constraints (e.g. valid only for small angles)',
        'Underlying prerequisite topic was never mastered during syllabus prep',
        'Mixed up two similar concepts (e.g. isothermal vs adiabatic work)',
        'Could not translate the worded physics problem into a free body diagram'
    ],
    E4: [
        'Failed to notice "which statement is INCORRECT"',
        'Ignored unit conversion (cm to m, minutes to seconds, atm to Pa)',
        'Overlooked critical boundary condition (e.g. integer x, smooth floor)',
        'Selected option B because it matched an intermediate calculation'
    ],
    E5: [
        'Timer showed under 15 minutes and heart rate spiked',
        'Felt behind schedule and hurried reading comprehension',
        'Attempted numerical question without verifying step 1 sanity',
        'Second-guessed original correct thought and picked hurried alternative'
    ],
    default: [
        'Did not execute systematic 3-step question dissection',
        'Switched approaches midway through the solution',
        'Lost train of thought due to visual clutter on rough paper',
        'Rushed to mark answer before completing sanity check'
    ]
};

const WHY3_OPTIONS = [
    'The on-screen countdown timer was glowing red and triggered acute urgency',
    'My rough sheet was cramped, disorganized, and written all over page borders',
    'I was carrying residual emotional frustration from getting stuck on previous question',
    'Accumulated cognitive fatigue after 2+ hours of intense continuous calculation'
];

const WHY4_OPTIONS = [
    'Spent 6.5 minutes stubbornly refusing to skip Question #14 earlier in the exam',
    'Started paper with hardest section (Maths) instead of high-speed Chemistry',
    'Slept less than 6 hours prior to test day causing brain fog in Hour 2',
    'Did not scan the paper for 3 minutes before starting to identify easy pickings'
];

const WHY5_ROOT_CAUSES = [
    {
        title: 'Ego Attachment to Questions',
        desc: 'Believing "I practiced this chapter so I must solve it" instead of treating every mark equally with a ruthless 180-second hard exit rule.',
        countermeasure: 'Enforce the 180s hard exit rule: If no clear algebraic pathway is visible within 120s, flag and skip immediately.',
        task: 'Implement 180s Hard-Skip Protocol Drill (15 Qs under timer)'
    },
    {
        title: 'Disorganized Scratchpad Protocol',
        desc: 'Writing scattered calculations across rough paper margins without numbered boxes, leading to miscopied intermediate numbers and sign flips.',
        countermeasure: 'Adopt 2-Column Numbered Scratchpad Grid: Divide rough sheet into 6 numbered rectangular boxes per page.',
        task: 'Set up & practice 2-Column Boxed Rough Sheet Grid on 20 PYQs'
    },
    {
        title: 'Rigid Section Sequence Order',
        desc: 'Attempting sections in printed order instead of following the optimal cognitive sequence: Chemistry (40m) -> Physics (55m) -> Maths (65m).',
        countermeasure: 'Adopt Chemistry First Protocol: Clear Chemistry early to bank 60-70 marks and reduce adrenaline pressure.',
        task: 'Simulate Chemistry-First 45-min Speedrun on recent shift paper'
    },
    {
        title: 'Acute Pre-Exam Sleep Sacrifice',
        desc: 'Believing late-night revision pays off, unaware that sleep deprivation increases calculation slips (E3) by 35% and reading traps (E4) by 25%.',
        countermeasure: '7.5-Hour Sleep Boundary: Enforce strict 10:30 PM bed cutoff before mock exam days.',
        task: 'Configure Pre-Mock Sleep & Cognitive Deload Routine'
    }
];

export const DiagnosticWizardModal: React.FC<DiagnosticWizardModalProps> = ({ 
    isOpen, 
    onClose, 
    onStartAction,
    onAddTask 
}) => {
    const [activeTab, setActiveTab] = useState<WizardTab>('five-whys');
    const [taskAdded, setTaskAdded] = useState(false);

    // 5-Whys State
    const [whysState, setWhysState] = useState<FiveWhysState>({
        step: 0,
        errorType: 'E3',
        topic: '',
        why1: '',
        why2: '',
        why3: '',
        why4: '',
        why5: WHY5_ROOT_CAUSES[0].title
    });

    // Systemic Diagnostics State
    const [systemicStep, setSystemicStep] = useState<number>(1);
    const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

    if (!isOpen) return null;

    const systemicProblems = [
        {
            id: 'score-dropped',
            icon: '📉',
            title: 'My mock score suddenly dropped 15-20 marks',
            description: 'Happened recently. I am panicked and unsure why.'
        },
        {
            id: 'stuck-plateau',
            icon: '🛑',
            title: 'I study 8-10 hours daily but my score is plateaued',
            description: 'Doing lots of practice but score won\'t move past a barrier.'
        },
        {
            id: 'time-panic',
            icon: '⏱️',
            title: 'I keep running out of time in the last 30 minutes',
            description: 'Leaving easy questions unattempted or guessing in panic.'
        },
        {
            id: 'waking-4am',
            icon: '😴',
            title: 'Waking up at 4am but feeling foggy, anxious and making silly mistakes',
            description: 'Trying hard but fatigue is hurting execution.'
        },
        {
            id: 'dont-know-what-to-study',
            icon: '❓',
            title: 'I sit at my desk and don\'t know what to study first',
            description: 'Overwhelmed by how much syllabus is left.'
        }
    ];

    const getSystemicDiagnosis = (problemId: string) => {
        switch (problemId) {
            case 'score-dropped':
                return {
                    cause: 'Score drops are usually caused by elevated Burnout Risk, high E3 (calculation) or E5 (time panic) error spikes, or attempting low-confidence questions.',
                    steps: [
                        'Check your Burnout Risk score - if > 60, take a lighter day today.',
                        'Review your last test Error DNA - look for E3 and E5 spikes.',
                        'Do NOT increase study hours today. Focus on error review only.'
                    ],
                    actionBtn: 'Generate AI Recovery Plan',
                    plannerTask: 'Execute Post-Drop Mock Autopsy & Silly Mistake Triage'
                };
            case 'stuck-plateau':
                return {
                    cause: 'Plateaus happen when study effort is directed at theory instead of fixing execution errors (E3/E4/E7) or high-ROI chapter gaps.',
                    steps: [
                        'Check your Chapter ROI list and focus ONLY on top-5 ROI chapters.',
                        'Clear overdue SRS cards - if overdue > 40, retention is decaying.',
                        'Use Feynman Mode to test if you truly understand weak concepts.'
                    ],
                    actionBtn: 'Open Chapter ROI Ranking',
                    plannerTask: 'Tackle Top-3 High-ROI Plateau Breaker Chapters'
                };
            case 'time-panic':
                return {
                    cause: 'Time panic is a paper strategy problem, not a knowledge problem. You are spending > 3 minutes on time-sink questions.',
                    steps: [
                        'Enforce a strict 3-minute max limit per question before skipping.',
                        'Attempt Chemistry first (fastest section), then Physics, then Maths.',
                        'Scan paper for 3 minutes before starting to mark easy wins.'
                    ],
                    actionBtn: 'Run Paper Strategy Optimizer',
                    plannerTask: 'Practice 3-Pass Exam Blueprint on Timed PYQ Shift'
                };
            case 'waking-4am':
                return {
                    cause: 'Sleep deprivation increases calculation slips (E3) by 35% and reading errors (E4) by 25%. Sleep quality beats sleep sacrifice.',
                    steps: [
                        'Sleep 7.5 to 8 hours (wake up at 6:00 AM instead of 4:00 AM).',
                        'Study 2 sharp hours after breakfast instead of 5 foggy morning hours.',
                        'Fill daily wellness check-in to track sleep vs test score correlation.'
                    ],
                    actionBtn: 'Open Wellness Check-In',
                    plannerTask: 'Audit Sleep Schedule & Shift Waking to 6:00 AM'
                };
            case 'dont-know-what-to-study':
                return {
                    cause: 'Decision fatigue causes procrastination or re-studying easy topics.',
                    steps: [
                        'Open Today\'s Plan widget and follow the AI-generated schedule.',
                        'Focus on the 1 top-priority chapter assigned for today.',
                        'Start a 45-minute Pomodoro block with Rain ambient audio.'
                    ],
                    actionBtn: 'Load Today\'s AI Plan',
                    plannerTask: 'Follow Top Priority Chapter in Daily Planner'
                };
            default:
                return null;
        }
    };

    const handleScheduleTask = (taskName: string, topicName: string) => {
        if (onAddTask) {
            onAddTask({
                task: taskName,
                time: 30,
                topic: topicName || 'Root Cause Surgery'
            });
            setTaskAdded(true);
            setTimeout(() => setTaskAdded(false), 3000);
        }
    };

    const activeRootCause = WHY5_ROOT_CAUSES.find(r => r.title === whysState.why5) || WHY5_ROOT_CAUSES[0];

    return (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in" onClick={onClose}>
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div 
                className="w-full max-w-2xl max-h-[90vh] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-scale-in relative z-10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Mode Switcher */}
                <div className="p-5 bg-slate-800/80 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-950 to-indigo-950 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center text-lg shadow-inner">
                            🔍
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-wide">Root Cause & Diagnostic Wizard</h3>
                            <p className="text-xs text-slate-400">Identify underlying failure mechanisms and schedule actionable fixes</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Tab Switcher */}
                        <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab('five-whys')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    activeTab === 'five-whys'
                                        ? 'bg-cyan-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Brain className="w-3.5 h-3.5" />
                                <span>5-Whys Autopsy</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('systemic')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    activeTab === 'systemic'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Prep Diagnostics</span>
                            </button>
                        </div>

                        <button 
                            onClick={onClose} 
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto space-y-4 text-slate-300 text-xs flex-grow">
                    {activeTab === 'five-whys' ? (
                        /* --- TAB 1: 5-WHYS QUESTION AUTOPSY --- */
                        <div className="space-y-4 animate-fade-in">
                            {/* Step Progress Bar */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-cyan-400 font-mono">STEP {whysState.step + 1} OF 6</span>
                                    <span className="text-slate-500">|</span>
                                    <span className="text-slate-300 font-medium">
                                        {whysState.step === 0 && 'Select Mistake Type & Topic'}
                                        {whysState.step === 1 && 'Why 1: Immediate Symptom'}
                                        {whysState.step === 2 && 'Why 2: Execution Slip'}
                                        {whysState.step === 3 && 'Why 3: Proximate Pressure'}
                                        {whysState.step === 4 && 'Why 4: Tactical Flaw'}
                                        {whysState.step === 5 && 'Why 5: Systemic Root Cause & Countermeasure'}
                                    </span>
                                </div>
                                {whysState.step > 0 && (
                                    <button 
                                        onClick={() => setWhysState(prev => ({ ...prev, step: prev.step - 1 }))}
                                        className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
                                    >
                                        ← Back
                                    </button>
                                )}
                            </div>

                            {/* Step 0: Error Type & Topic */}
                            {whysState.step === 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-slate-200 font-semibold mb-2">1. What category of error happened on this question?</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {ERROR_TYPES.map(err => (
                                                <button
                                                    key={err.id}
                                                    onClick={() => setWhysState(prev => ({ ...prev, errorType: err.id }))}
                                                    className={`p-3 rounded-xl border text-left transition-all bg-gradient-to-br ${
                                                        whysState.errorType === err.id
                                                            ? `${err.color} shadow-lg ring-1 ring-cyan-400/40`
                                                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <div className="font-bold text-xs">{err.label}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{err.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-200 font-semibold mb-1.5">2. Chapter or Topic (Optional):</label>
                                        <input
                                            type="text"
                                            value={whysState.topic}
                                            onChange={(e) => setWhysState(prev => ({ ...prev, topic: e.target.value }))}
                                            placeholder="e.g. Thermodynamics, Rotational Dynamics, Definite Integrals..."
                                            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    <button
                                        onClick={() => setWhysState(prev => ({ ...prev, step: 1 }))}
                                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
                                    >
                                        <span>Proceed to Why 1</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Step 1: Why 1 */}
                            {whysState.step === 1 && (
                                <div className="space-y-3">
                                    <p className="font-bold text-slate-200 text-sm">Why 1: What was the immediate observable outcome?</p>
                                    <div className="space-y-2">
                                        {WHY1_OPTIONS.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setWhysState(prev => ({ ...prev, why1: opt, step: 2 }))}
                                                className="w-full p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/50 text-left transition-all flex items-center justify-between group"
                                            >
                                                <span className="text-slate-200 group-hover:text-cyan-300">{opt}</span>
                                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Why 2 */}
                            {whysState.step === 2 && (
                                <div className="space-y-3">
                                    <p className="font-bold text-slate-200 text-sm">Why 2: What physical or mental slip occurred in the moment?</p>
                                    <div className="space-y-2">
                                        {(WHY2_OPTIONS[whysState.errorType] || WHY2_OPTIONS.default).map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setWhysState(prev => ({ ...prev, why2: opt, step: 3 }))}
                                                className="w-full p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/50 text-left transition-all flex items-center justify-between group"
                                            >
                                                <span className="text-slate-200 group-hover:text-cyan-300">{opt}</span>
                                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Why 3 */}
                            {whysState.step === 3 && (
                                <div className="space-y-3">
                                    <p className="font-bold text-slate-200 text-sm">Why 3: Why did you rush or skip standard discipline?</p>
                                    <div className="space-y-2">
                                        {WHY3_OPTIONS.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setWhysState(prev => ({ ...prev, why3: opt, step: 4 }))}
                                                className="w-full p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/50 text-left transition-all flex items-center justify-between group"
                                            >
                                                <span className="text-slate-200 group-hover:text-cyan-300">{opt}</span>
                                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Why 4 */}
                            {whysState.step === 4 && (
                                <div className="space-y-3">
                                    <p className="font-bold text-slate-200 text-sm">Why 4: Why were you in a time deficit or fatigued at that moment?</p>
                                    <div className="space-y-2">
                                        {WHY4_OPTIONS.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setWhysState(prev => ({ ...prev, why4: opt, step: 5 }))}
                                                className="w-full p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/50 text-left transition-all flex items-center justify-between group"
                                            >
                                                <span className="text-slate-200 group-hover:text-cyan-300">{opt}</span>
                                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Why 5 & Synthesis */}
                            {whysState.step === 5 && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                                        <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                                            <Target className="w-4 h-4" />
                                            <span>5-Whys Diagnostic Chain</span>
                                        </div>
                                        <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                                            <p><span className="text-slate-500">Why 1:</span> {whysState.why1}</p>
                                            <p><span className="text-slate-500">Why 2:</span> {whysState.why2}</p>
                                            <p><span className="text-slate-500">Why 3:</span> {whysState.why3}</p>
                                            <p><span className="text-slate-500">Why 4:</span> {whysState.why4}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-200 mb-2">Why 5: Select the underlying systemic root cause habit:</p>
                                        <div className="space-y-2">
                                            {WHY5_ROOT_CAUSES.map((cause, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setWhysState(prev => ({ ...prev, why5: cause.title }))}
                                                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                                                        whysState.why5 === cause.title
                                                            ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-400'
                                                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <div className="font-bold text-xs text-indigo-300">{cause.title}</div>
                                                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{cause.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prescribed Countermeasure Banner */}
                                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                                        <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            <span>Prescribed Behavioral Countermeasure</span>
                                        </div>
                                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                                            {activeRootCause.countermeasure}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                                        <button
                                            onClick={() => handleScheduleTask(activeRootCause.task, whysState.topic)}
                                            className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
                                        >
                                            {taskAdded ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                                    <span>Scheduled to Daily Planner!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CalendarPlus className="w-4 h-4" />
                                                    <span>Inject 30-min Sprint to Daily Planner</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setWhysState({
                                                step: 0,
                                                errorType: 'E3',
                                                topic: '',
                                                why1: '',
                                                why2: '',
                                                why3: '',
                                                why4: '',
                                                why5: WHY5_ROOT_CAUSES[0].title
                                            })}
                                            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Autopsy Another</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* --- TAB 2: SYSTEMIC PREPARATION DIAGNOSTIC --- */
                        <div className="space-y-4 animate-fade-in">
                            {systemicStep === 1 ? (
                                <div className="space-y-4">
                                    <p className="font-semibold text-slate-200 text-sm">Select the situation that best describes how you feel right now:</p>
                                    <div className="space-y-2.5">
                                        {systemicProblems.map(p => (
                                            <div 
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedProblem(p.id);
                                                    setSystemicStep(2);
                                                }}
                                                className="p-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 cursor-pointer transition-all flex items-start gap-3 group"
                                            >
                                                <span className="text-2xl shrink-0">{p.icon}</span>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-200 group-hover:text-cyan-300 text-xs transition-colors">{p.title}</h4>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                selectedProblem && (() => {
                                    const diag = getSystemicDiagnosis(selectedProblem);
                                    if (!diag) return null;
                                    return (
                                        <div className="space-y-4 animate-fade-in">
                                            <button 
                                                onClick={() => setSystemicStep(1)} 
                                                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold mb-1 block"
                                            >
                                                ← Select a different situation
                                            </button>

                                            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 space-y-1">
                                                <p className="font-bold text-cyan-300 text-sm">Root Cause Diagnosis:</p>
                                                <p className="text-slate-300 leading-relaxed">{diag.cause}</p>
                                            </div>

                                            <div className="space-y-2 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                                                <p className="font-bold text-slate-200 text-xs uppercase tracking-wider text-emerald-400">Immediate Action Steps:</p>
                                                <ul className="space-y-2 text-slate-300">
                                                    {diag.steps.map((s, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-emerald-400 font-bold">{i + 1}.</span>
                                                            <span>{s}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        handleScheduleTask(diag.plannerTask, 'Exam Recovery');
                                                    }}
                                                    className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
                                                >
                                                    {taskAdded ? (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                                            <span>Scheduled to Daily Planner!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CalendarPlus className="w-4 h-4" />
                                                            <span>Inject Action to Daily Planner</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button 
                                                    onClick={() => {
                                                        onClose();
                                                        if (onStartAction) onStartAction(selectedProblem);
                                                    }}
                                                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all"
                                                >
                                                    ⚡ {diag.actionBtn}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
