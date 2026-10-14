import React, { useState } from 'react';

export interface TermHelpData {
    code?: string;
    title: string;
    description: string;
    fixStrategy?: string;
    severity?: string;
}

export const TERM_DICTIONARY: Record<string, TermHelpData> = {
    E1: {
        code: 'E1',
        title: 'Conceptual Gap',
        description: 'Did not know or understand the physical/mathematical principle.',
        fixStrategy: 'Re-learn theory. Use AI Coach Feynman Mode.',
        severity: 'HIGH'
    },
    E2: {
        code: 'E2',
        title: 'Formula Recall Error',
        description: 'Understood concept, but forgot or misapplied formula.',
        fixStrategy: 'Formula Flash Sprint & Cloze SRS cards.',
        severity: 'MED-HIGH'
    },
    E3: {
        code: 'E3',
        title: 'Calculation Slip',
        description: 'Right concept and formula, but made arithmetic/sign error.',
        fixStrategy: 'Write all steps. Slow down 15% on calculations.',
        severity: 'MEDIUM'
    },
    E4: {
        code: 'E4',
        title: 'Reading Error',
        description: 'Misread question statement, given values, or options.',
        fixStrategy: 'Underline key conditions before solving.',
        severity: 'LOW-MED'
    },
    E5: {
        code: 'E5',
        title: 'Time Panic',
        description: 'Rushed under exam clock and guessed without logic.',
        fixStrategy: 'Strict 3-minute skip rule. Use Paper Strategy Optimizer.',
        severity: 'HIGH'
    },
    E6: {
        code: 'E6',
        title: 'Silly Skip',
        description: 'Skipped a question that was actually easy and solvable.',
        fixStrategy: 'Spend 30 seconds reading every question before skipping.',
        severity: 'MEDIUM'
    },
    E7: {
        code: 'E7',
        title: 'Overconfidence Trap',
        description: 'Confidently selected a distractor trap option.',
        fixStrategy: 'Use AI Debate Mode to dismantle trap logic.',
        severity: 'HIGH'
    },
    QES: {
        title: 'Question Efficiency Score (QES)',
        description: 'Marks earned per minute of solving time.',
        fixStrategy: 'Increase speed on easy questions and skip time-sinks.'
    },
    ROI: {
        title: 'Chapter ROI Rating',
        description: 'Return on Investment: (JEE Paper Frequency × Mastery Gap) ÷ Hours to Learn.',
        fixStrategy: 'Focus 80% of study time on top ROI chapters.'
    },
    SM2: {
        title: 'SM-2 Repetition Engine',
        description: 'Scientific algorithm scheduling card reviews right before memory decay occurs.',
        fixStrategy: 'Review overdue cards daily.'
    },
    Selectivity: {
        title: 'Selectivity Score',
        description: 'Measures the quality of your question skip choices.',
        fixStrategy: 'Skip questions with <60% confidence to eliminate negative marks.'
    },
    Endurance: {
        title: 'Exam Endurance',
        description: 'Score performance in the last 30 min vs first 30 min.',
        fixStrategy: 'Stay hydrated, eat light snacks, manage energy pacing.'
    },
    Feynman: {
        title: 'Feynman Learning Mode',
        description: 'Explain a concept to AI as if teaching a beginner.',
        fixStrategy: 'Use weekly to find hidden gaps in understanding.'
    },
    Debate: {
        title: 'AI Debate Mode',
        description: 'AI argues the wrong answer on trap questions.',
        fixStrategy: 'Defend the correct answer using first principles.'
    },
    BossQuestion: {
        title: 'Boss Question Challenge',
        description: 'Multi-part test problem at the end of each syllabus chapter.',
        fixStrategy: 'Solve without hints to prove true exam readiness.'
    }
};

interface HelpTooltipProps {
    termKey: string;
    children?: React.ReactNode;
    onClickGuide?: () => void;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ termKey, children, onClickGuide }) => {
    const [isHovered, setIsHovered] = useState(false);
    const data = TERM_DICTIONARY[termKey];

    if (!data) {
        return <>{children || termKey}</>;
    }

    return (
        <span 
            className="relative inline-block cursor-help group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClickGuide}
        >
            {children || (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 hover:border-cyan-400 transition-colors">
                    {data.code || termKey}
                    <span className="text-[10px] text-slate-400 opacity-60">ⓘ</span>
                </span>
            )}

            {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs pointer-events-none animate-fade-in">
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800">
                        <span className="font-bold text-white flex items-center gap-1">
                            {data.code && <span className="text-cyan-400">[{data.code}]</span>}
                            {data.title}
                        </span>
                        {data.severity && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-700/60 font-semibold">
                                {data.severity}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-300 mb-2 leading-relaxed">{data.description}</p>
                    {data.fixStrategy && (
                        <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/60 text-[11px] text-cyan-200">
                            <strong>Fix:</strong> {data.fixStrategy}
                        </div>
                    )}
                </div>
            )}
        </span>
    );
};