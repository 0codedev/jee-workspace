
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area, ScatterChart, Scatter, ReferenceLine, ComposedChart, ZAxis, PieChart, Pie
} from 'recharts';
import { SUBJECT_CONFIG } from '../constants';
import CustomTooltip from './common/CustomTooltip';
import { LongTermGoal, QuestionLog, ExamStrategy, Reflection, TestReport, QuestionStatus } from '../types';
import { CalibrationMatrix } from './visualizations/CalibrationMatrix';
import { TopStudentGapMatrix } from './visualizations/TopStudentGapMatrix';
import { formatNumber, formatPercent, formatRank } from '../utils/formatters';
import { isValidSubjectForReport } from '../utils/metrics';
import { StrategicROIPoint } from '../hooks/useDashboardAnalytics';
import { getPredictedColleges } from '../utils/collegePredictor';
import { RangeSlider } from './common/RangeSlider';

// --- Tooltips ---
const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-3 glass-panel border-white/5 rounded-lg shadow-xl text-sm z-50">
                <p className="font-bold text-white mb-2">{data.subject}</p>
                <div className="space-y-1">
                    <p className="text-cyan-400 flex justify-between gap-4"><span>Avg Marks:</span> <span>{formatNumber(data.A)}</span></p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-3 glass-panel border-white/5 rounded-lg shadow-xl text-xs z-50 max-w-[200px]">
                <p className="font-bold text-white mb-1 truncate">{data.topic}</p>
                <span className={`inline-block px-2 py-0.5 rounded mb-2 text-[10px] font-semibold ${data.quadrant === 'Quick Wins' ? 'bg-green-900 text-green-300' :
                    data.quadrant === 'Big Bets' ? 'bg-amber-900 text-amber-300' :
                        data.quadrant === 'Maintenance' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'
                    }`}>{data.quadrant}</span>

                <div className="space-y-1">
                    <p className="text-gray-400 flex justify-between"><span>Impact:</span> <span className="text-white">{formatNumber(data.impact, 0)}</span></p>
                    <p className="text-gray-400 flex justify-between"><span>Effort:</span> <span className="text-white">{formatNumber(data.effort, 1)}</span></p>
                    <p className="text-gray-500 italic mt-1">Click to focus on this topic</p>
                </div>
            </div>
        );
    }
    return null;
};

// --- Reusable AI Footer ---
const AiChartFooter: React.FC<{ summary?: string }> = ({ summary }) => {
    if (!summary) return null;
    return (
        <div className="mt-2 p-2 glass-panel border-t border-white/10 text-xs text-cyan-200 flex items-start gap-2 animate-fade-in">
            <span className="text-lg">✨</span>
            <span className="italic leading-relaxed">{summary}</span>
        </div>
    );
};

// --- Widgets ---

export const OracleWidget: React.FC<{ onConsult: () => void }> = React.memo(({ onConsult }) => {
    return (
        <div className="h-full w-full relative overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 flex flex-col items-center justify-center text-center p-6 group cursor-pointer" onClick={onConsult}>
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)] animate-[spin_20s_linear_infinite]"></div>
            </div>
            
            <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-105">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-black/20 border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.3)] flex items-center justify-center relative">
                    <span className="text-5xl animate-pulse">🔮</span>
                    <div className="absolute inset-0 rounded-full border border-indigo-400/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">The Oracle</h3>
                <p className="text-indigo-200 text-sm max-w-[200px] mx-auto leading-relaxed">
                    Predictive drill based on your likely failure points.
                </p>
            </div>
            
            <div className="absolute bottom-4 flex items-center gap-2 text-indigo-400 text-xs font-semibold group-hover:text-indigo-300">
                <span>Begin 3-Min Interrogation</span>
                <span>→</span>
            </div>
        </div>
    );
});

export const SrsDueWidget: React.FC<{ dueCount: number; onStartReview: () => void }> = React.memo(({ dueCount, onStartReview }) => {
    return (
        <div className="h-full w-full glass-panel p-6 rounded-2xl flex flex-col justify-between border border-purple-500/20 shadow-xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🧠</span>
                    <h3 className="text-lg font-black text-purple-300">Spaced Repetition (SRS)</h3>
                </div>
                <span className="text-xs bg-purple-900/60 text-purple-200 border border-purple-600/40 px-2.5 py-0.5 rounded-full font-bold">
                    SM-2 Engine
                </span>
            </div>

            <div className="my-4 text-center">
                <p className="text-4xl font-black text-white">{dueCount} Cards</p>
                <p className="text-xs text-purple-300/80 mt-1">Due for review today to maintain memory retention</p>
            </div>

            <button 
                onClick={onStartReview}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.02]"
            >
                ⚡ Start Review Session ({dueCount})
            </button>
        </div>
    );
});

export const BurnoutRiskWidget: React.FC<{ studyHoursAvg: number; stressAvg: number }> = React.memo(({ studyHoursAvg, stressAvg }) => {
    const riskScore = Math.min(100, Math.round((studyHoursAvg / 10) * 40 + (stressAvg / 5) * 60));
    let statusColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    let statusText = 'Optimal Balance';

    if (riskScore >= 70) {
        statusColor = 'text-rose-400 border-rose-500/40 bg-rose-950/30';
        statusText = '⚠️ High Burnout Risk -- Take a 30m Rest';
    } else if (riskScore >= 45) {
        statusColor = 'text-amber-400 border-amber-500/40 bg-amber-950/30';
        statusText = 'Moderate Strain';
    }

    return (
        <div className={`p-4 rounded-xl border ${statusColor} flex items-center justify-between shadow-lg`}>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Burnout Risk Score</p>
                <p className="text-2xl font-black mt-0.5">{riskScore} / 100 -- {statusText}</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-current flex items-center justify-center font-bold text-sm">
                {riskScore}%
            </div>
        </div>
    );
});

export const CollegePredictorWidget: React.FC<{ userMarks: number }> = React.memo(({ userMarks }) => {
    const predictions = useMemo(() => getPredictedColleges(userMarks), [userMarks]);

    return (
        <div className="h-full w-full glass-panel p-5 rounded-2xl flex flex-col justify-between border border-cyan-500/20 shadow-xl bg-slate-900/90">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🎓</span>
                    <h3 className="text-sm font-bold text-cyan-300">College & Branch Predictor</h3>
                </div>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded font-mono">
                    Mock Marks: {userMarks}
                </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-36 pr-1 custom-scrollbar">
                {predictions.map((p, idx) => (
                    <div key={idx} className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex justify-between items-center text-xs">
                        <div>
                            <p className="font-bold text-white">{p.college}</p>
                            <p className="text-[10px] text-cyan-400">{p.branch}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-mono">
                            Rank ~{p.closingRank}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

// New Calibration Widget Wrapper
export const CalibrationWidget: React.FC<{ logs: QuestionLog[] }> = React.memo(({ logs }) => (
    <CalibrationMatrix logs={logs} />
));

// New Top-Student Gap Engine HUD Widget Wrapper
export const TopStudentGapWidget: React.FC<{ logs: QuestionLog[]; onSelectQuestion?: (log: QuestionLog) => void }> = React.memo(({ logs, onSelectQuestion }) => (
    <TopStudentGapMatrix logs={logs} onSelectQuestion={onSelectQuestion} />
));

export const PaperStrategyWidget: React.FC<{ 
    historicalAccuracy: { physics: number, chemistry: number, maths: number },
    userTargetTimes?: { physics: number, chemistry: number, maths: number },
    savedStrategy?: ExamStrategy,
    onSave?: (strategy: ExamStrategy) => void;
}> = React.memo(({ historicalAccuracy, userTargetTimes, savedStrategy, onSave }) => {
    const [examType, setExamType] = useState<'mains' | 'advanced'>(savedStrategy?.examType || 'mains');
    const [subjectOrder, setSubjectOrder] = useState<('physics' | 'chemistry' | 'maths')[]>(savedStrategy?.subjectOrder || ['physics', 'chemistry', 'maths']);
    
    const [timeAlloc, setTimeAlloc] = useState(savedStrategy?.timeAlloc || { physics: 60, chemistry: 60, maths: 60 });
    const [attemptTarget, setAttemptTarget] = useState(savedStrategy?.attemptTarget || { physics: 20, chemistry: 20, maths: 15 });
    const [confidence, setConfidence] = useState(savedStrategy?.confidence || { physics: 50, chemistry: 50, maths: 50 });

    useEffect(() => {
        if (examType === 'mains' && !savedStrategy) {
            setAttemptTarget({ physics: 20, chemistry: 20, maths: 15 });
        } else if (examType === 'advanced' && !savedStrategy) {
            setAttemptTarget({ physics: 12, chemistry: 12, maths: 8 });
        }
    }, [examType, savedStrategy]);

    const maxAttempts = examType === 'mains' ? 25 : 18;

    const stats = useMemo(() => {
        let totalScore = 0;
        let maxPotential = 0;
        let riskScore = 0;
        
        const safeTargetTimes: { physics: number; chemistry: number, maths: number } = userTargetTimes || { physics: 120, chemistry: 60, maths: 150 }; 

        const subjectStats = subjectOrder.map((sub, index) => {
            const time = timeAlloc[sub];
            const attempts = attemptTarget[sub];
            const conf = confidence[sub] / 100;
            const timePerQ = attempts > 0 ? time / attempts : 0;
            
            const idealTimePerQ = safeTargetTimes[sub] / 60; 
            
            let panicFactor = 1;
            if (timePerQ < idealTimePerQ) {
                const ratio = timePerQ / idealTimePerQ;
                const panicExponent = 1.5 * (1 - (conf * 0.5)); 
                panicFactor = Math.pow(ratio, panicExponent); 
            }

            const fatigueFactor = 1 - (index * 0.05);
            const baseAcc = (historicalAccuracy[sub] || 50) / 100;
            const effectiveAcc = Math.min(1, (baseAcc + (conf * 0.05)) * panicFactor * fatigueFactor);
            
            const expectedCorrect = attempts * effectiveAcc;
            const expectedWrong = attempts * (1 - effectiveAcc);
            
            const marksPerCorrect = examType === 'mains' ? 4 : 3;
            const marksPerWrong = 1;

            const score = (expectedCorrect * marksPerCorrect) - (expectedWrong * marksPerWrong); 
            
            totalScore += score;
            maxPotential += attempts * marksPerCorrect;

            if (attempts > 0) {
                const subjectRisk = (idealTimePerQ - timePerQ) > 0 ? (idealTimePerQ - timePerQ) / idealTimePerQ : 0;
                riskScore += subjectRisk * (attempts / maxAttempts) * 33 * (1 - conf);
            }

            return {
                subject: sub,
                score: Math.round(score),
                timePerQ: timePerQ.toFixed(1),
                panicDrop: Math.round((1 - panicFactor) * 100),
                fatigueDrop: Math.round((1 - fatigueFactor) * 100),
                targetTime: idealTimePerQ.toFixed(1)
            };
        });

        return { totalScore: Math.round(totalScore), maxPotential, subjectStats, riskScore: Math.min(100, Math.max(0, riskScore)) };
    }, [timeAlloc, attemptTarget, confidence, historicalAccuracy, userTargetTimes, examType, subjectOrder, maxAttempts]);

    const totalTime = (Object.values(timeAlloc) as number[]).reduce((a, b) => a + b, 0);
    
    const handleTimeChange = useCallback((sub: string, val: number) => setTimeAlloc(p => ({...p, [sub]: val})), []);
    const handleAttemptChange = useCallback((sub: string, val: number) => setAttemptTarget(p => ({...p, [sub]: val})), []);
    const handleConfidenceChange = useCallback((sub: string, val: number) => setConfidence(p => ({...p, [sub]: val})), []);
    
    const moveLeft = (index: number) => {
        if (index === 0) return;
        setSubjectOrder(prev => {
            const newOrder = [...prev];
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
            return newOrder;
        });
    };

    const moveRight = (index: number) => {
        if (index === subjectOrder.length - 1) return;
        setSubjectOrder(prev => {
            const newOrder = [...prev];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            return newOrder;
        });
    };

    const handleSaveStrategy = () => {
        if (onSave) {
            onSave({
                timeAlloc,
                attemptTarget,
                confidence,
                examType,
                subjectOrder
            });
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div className="flex gap-2">
                    <button onClick={() => setExamType('mains')} className={`text-[10px] px-2 py-1 rounded transition-colors ${examType === 'mains' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-gray-400'}`}>Mains</button>
                    <button onClick={() => setExamType('advanced')} className={`text-[10px] px-2 py-1 rounded transition-colors ${examType === 'advanced' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-gray-400'}`}>Advanced</button>
                </div>
                
                <div className="flex items-center gap-2">
                    {onSave && (
                        <button 
                            onClick={handleSaveStrategy}
                            className="bg-green-600 hover:bg-green-500 text-white text-[10px] px-3 py-1 rounded font-bold transition-colors shadow-lg shadow-green-900/20"
                        >
                            Save
                        </button>
                    )}
                    <div className="text-right pl-4 border-l border-white/10">
                        <p className="text-xs text-gray-400">Est. Score</p>
                        <p className="text-xl font-bold text-cyan-300 tabular-nums">{stats.totalScore}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center px-1">
                <span className="text-xs text-gray-400">Order: <strong className="text-white uppercase tracking-wider">{subjectOrder.map(s => s[0]).join(' > ')}</strong></span>
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {stats.subjectStats.map((stat, idx) => (
                    <div key={stat.subject} className="glass-panel p-3 rounded-xl border-white/10 relative group">
                        <div className="absolute top-2 right-2 flex gap-1">
                            <button onClick={() => moveLeft(idx)} disabled={idx === 0} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white w-5 h-5 rounded flex items-center justify-center disabled:opacity-30">{'<'}</button>
                            <span className="text-[10px] font-bold text-gray-500 w-4 text-center">#{idx + 1}</span>
                            <button onClick={() => moveRight(idx)} disabled={idx === subjectOrder.length - 1} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white w-5 h-5 rounded flex items-center justify-center disabled:opacity-30">{'>'}</button>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2 pt-6">
                            <span className="capitalize font-semibold text-gray-300 text-sm">{stat.subject}</span>
                            <span className={`text-[10px] px-1.5 rounded ${stat.panicDrop > 15 ? 'bg-red-900/50 text-red-300' : 'bg-white/5 text-gray-400'}`}>
                                -{stat.fatigueDrop + stat.panicDrop}% Eff.
                            </span>
                        </div>
                        
                        <div className="space-y-3 pt-1">
                            <RangeSlider
                                label="Time"
                                min={0}
                                max={120}
                                step={5}
                                unit="m"
                                value={timeAlloc[stat.subject as keyof typeof timeAlloc]}
                                accentColor="cyan"
                                onChange={(val) => handleTimeChange(stat.subject, val)}
                            />
                            <RangeSlider
                                label="Attempts"
                                min={0}
                                max={maxAttempts}
                                step={1}
                                unit="Q"
                                value={attemptTarget[stat.subject as keyof typeof attemptTarget]}
                                accentColor="indigo"
                                onChange={(val) => handleAttemptChange(stat.subject, val)}
                            />
                            <div className="pt-1 border-t border-slate-800/50">
                                <RangeSlider
                                    label="Confidence"
                                    min={0}
                                    max={100}
                                    step={10}
                                    unit="%"
                                    value={confidence[stat.subject as keyof typeof confidence]}
                                    accentColor="dynamic"
                                    onChange={(val) => handleConfidenceChange(stat.subject, val)}
                                />
                            </div>
                        </div>
                         <div className="flex justify-between items-end pt-2 mt-1 border-t border-white/10">
                             <span className="text-[10px] text-gray-400">Score: <strong className="text-white">{stat.score}</strong></span>
                             <span className={`text-[9px] ${parseFloat(stat.timePerQ) < parseFloat(stat.targetTime) ? 'text-red-400' : 'text-green-400'}`}>
                                {stat.timePerQ}m / {stat.targetTime}m
                             </span>
                         </div>
                    </div>
                ))}
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-gray-500 bg-white/5 p-2 rounded">
                <span>Total Time: <span className={`${totalTime > 180 ? 'text-red-400' : 'text-green-400 font-bold'}`}>{totalTime}</span> / 180 min</span>
                <span>{totalTime > 180 ? 'Over limit!' : `${180 - totalTime}m buffer`}</span>
            </div>
        </div>
    );
});


export const StrategicROIWidget: React.FC<{ data: StrategicROIPoint[], onPointClick: (topic: string) => void }> = React.memo(({ data, onPointClick }) => (
    <div className="h-full w-full flex flex-col">
        <div className="flex justify-between items-center px-4 pb-2 text-xs text-gray-400">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Quick Wins</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Big Bets</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Maintenance</div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" dataKey="effort" name="Effort" unit="" stroke="#9CA3AF" label={{ value: 'Effort (Difficulty)', position: 'insideBottom', offset: -10, fill: '#9CA3AF', fontSize: 10 }} domain={[0, 'auto']} />
                <YAxis type="number" dataKey="impact" name="Impact" unit="" stroke="#9CA3AF" label={{ value: 'Impact (Weightage)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10 }} domain={[0, 'auto']} />
                <ZAxis type="number" dataKey="bubbleSize" range={[60, 400]} name="Error Volume" />
                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine x={30} stroke="#4B5563" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="#4B5563" strokeDasharray="3 3" />
                <Scatter name="Topics" data={data} onClick={(point: any) => onPointClick(point.topic)} cursor="pointer">
                    {data.map((entry, index) => {
                        let fill = '#6B7280';
                        if (entry.quadrant === 'Quick Wins') fill = '#10B981'; // Green
                        else if (entry.quadrant === 'Big Bets') fill = '#F59E0B'; // Amber
                        else if (entry.quadrant === 'Maintenance') fill = '#3B82F6'; // Blue
                        return <Cell key={`cell-${index}`} fill={fill} fillOpacity={0.7} stroke={fill} strokeWidth={1} />;
                    })}
                </Scatter>
            </ScatterChart>
        </ResponsiveContainer>
    </div>
));

export const RankPredictorWidget: React.FC<{ 
    rankPrediction?: any; 
    goalProbability?: any;
    reports?: TestReport[];
    onNavigate?: (view: any) => void;
}> = React.memo(({ rankPrediction, goalProbability, reports, onNavigate }) => {
    // If reports are provided or if Bayesian data is missing, render the modern College Predictor HUD card
    if (!rankPrediction?.distribution) {
        const latestReport = reports && reports.length > 0 ? reports[reports.length - 1] : null;
        const marks = latestReport?.total?.marks || 195;

        const percentile = marks >= 280 ? 99.9 :
            marks >= 235 ? 99.5 :
            marks >= 208 ? 99.0 :
            marks >= 180 ? 98.0 :
            marks >= 162 ? 97.0 :
            marks >= 135 ? 95.0 :
            marks >= 118 ? 93.0 :
            marks >= 98 ? 90.0 :
            marks >= 78 ? 85.0 :
            marks >= 64 ? 80.0 : Math.max(20, marks * 1.1);

        const estimatedAIR = Math.max(1, Math.round(((100 - percentile) / 100) * 1485000));

        return (
            <div className="p-4 h-full flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/20 rounded-xl">
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
                            <span>🎯</span> Live AIR Projection
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                            {percentile.toFixed(1)}% Percentile
                        </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                        <div>
                            <div className="text-2xl font-black text-white font-mono tracking-tight">
                                #{estimatedAIR.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                                Based on {marks} marks (Latest Mock)
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold block">Status</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Qualified
                            </span>
                        </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                        <span className="truncate text-slate-400">JoSAA Target:</span>
                        <span className="font-bold text-cyan-300">Top 15 NITs / IIITs</span>
                    </div>
                </div>

                <button
                    onClick={() => onNavigate && onNavigate('rank-predictor')}
                    className="mt-2 w-full py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                    <span>Launch College Predictor</span>
                    <span>➔</span>
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2 px-2">
                <div className="text-xs space-y-1">
                    <p className="text-gray-400">Likely Range</p>
                    <p className="text-white font-mono tabular-nums">{formatRank(rankPrediction.bestCase)} - {formatRank(rankPrediction.worstCase)}</p>
                </div>
                {goalProbability && (
                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                        <div className="relative w-8 h-8">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#374151" strokeWidth="4" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={goalProbability.probability > 50 ? '#10B981' : '#F59E0B'} strokeWidth="4" strokeDasharray={`${goalProbability.probability}, 100`} />
                            </svg>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-white tabular-nums">{goalProbability.probability}%</p>
                            <p className="text-[9px] text-gray-400">Chance for {goalProbability.text}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rankPrediction.distribution} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="rankGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.0} />
                                <stop offset="20%" stopColor="#22d3ee" stopOpacity={0.1} />
                                <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.5} />
                                <stop offset="80%" stopColor="#22d3ee" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="rank"
                            reversed={true}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                            tickCount={7}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip label="Predicted Rank" formatter={(val: number) => formatRank(val)} />} />
                        <ReferenceLine x={rankPrediction.likely} stroke="#ffffff" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Likely', position: 'top', fill: '#fff', fontSize: 10 }} />
                        <Area type="basis" dataKey="probability" stroke="#22d3ee" fill="url(#rankGradient)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {onNavigate && (
                <button
                    onClick={() => onNavigate('rank-predictor')}
                    className="mt-1 w-full py-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors text-center"
                >
                    Open Full College Matcher &rarr;
                </button>
            )}
        </div>
    );
});

export const PercentilePredictorWidget: React.FC<{ percentileData: any }> = React.memo(({ percentileData }) => (
    <div className="h-full w-full flex flex-col">
        <div className="flex justify-around mb-2 text-center">
            <div>
                <p className="text-xs text-gray-400">Predicted Score</p>
                <p className="text-xl font-bold text-cyan-300 tabular-nums">{percentileData.predictedScore}</p>
            </div>
            <div>
                <p className="text-xs text-gray-400">Est. Percentile</p>
                <p className="text-xl font-bold text-amber-400 tabular-nums">{percentileData.predictedPercentile}%</p>
            </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={percentileData.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#9CA3AF" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip formatter={(val: number) => typeof val === 'number' ? val.toFixed(1) + '%' : val} />} />
                <Line yAxisId="left" type="monotone" dataKey="percentile" name="Percentile" stroke="#818CF8" strokeWidth={2} dot={{ r: 4, fill: '#818CF8' }} activeDot={{ r: 6 }} />
                <Line yAxisId="left" type="monotone" dataKey="trendPercentile" name="Trend" stroke="#FBBF24" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
));

export const VolatilityWidget: React.FC<{ volatilityMetrics: any }> = React.memo(({ volatilityMetrics }) => (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
        <div className="relative w-full h-full max-w-[240px] max-h-[240px]">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#374151" strokeWidth="2" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={parseFloat(volatilityMetrics.sharpeRatio) > 1 ? '#10B981' : '#FBBF24'} strokeWidth="2" strokeDasharray={`${Math.min(100, parseFloat(volatilityMetrics.sharpeRatio) * 30)}, 100`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white tabular-nums">{volatilityMetrics.sharpeRatio}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Sharpe Ratio</span>
            </div>
        </div>
        <div className="text-center absolute bottom-2">
            <p className={`text-sm font-bold ${volatilityMetrics.isTestingOutOfZone ? 'text-amber-400' : 'text-green-400'}`}>{volatilityMetrics.zoneMessage}</p>
            <p className="text-[10px] text-gray-500 tabular-nums">Std Dev: {volatilityMetrics.stdDev}</p>
        </div>
    </div>
));

export const PerformanceTrendWidget: React.FC<{ data: TestReport[], aiSummary?: string }> = React.memo(({ data, aiSummary }) => (
    <div className="h-full flex flex-col">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="testName" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total.marks" name="Total Score" stroke={SUBJECT_CONFIG.total.color} strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
        <AiChartFooter summary={aiSummary} />
    </div>
));

export const SubjectComparisonWidget: React.FC<{ data: TestReport[], aiSummary?: string }> = React.memo(({ data, aiSummary }) => (
    <div className="h-full flex flex-col">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="testName" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="physics.marks" name="Physics" stackId="a" fill={SUBJECT_CONFIG.physics.color} />
                <Bar dataKey="chemistry.marks" name="Chemistry" stackId="a" fill={SUBJECT_CONFIG.chemistry.color} />
                <Bar dataKey="maths.marks" name="Maths" stackId="a" fill={SUBJECT_CONFIG.maths.color} />
            </BarChart>
        </ResponsiveContainer>
        <AiChartFooter summary={aiSummary} />
    </div>
));

export const SubjectRadarWidget: React.FC<{ data: { subject: string, A: number, fullMark: number }[] }> = React.memo(({ data }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                
                {/* Only User Data */}
                <Radar name="You" dataKey="A" stroke={SUBJECT_CONFIG.total.color} strokeWidth={3} fill={SUBJECT_CONFIG.total.color} fillOpacity={0.6} />
                
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Tooltip content={<CustomRadarTooltip />} cursor={false} />
            </RadarChart>
        </ResponsiveContainer>
    );
});

export const CalendarHeatmapWidget: React.FC<{ reports: TestReport[] }> = React.memo(({ reports }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const newWidth = entries[0].contentRect.width;
                // Add tolerance to prevent infinite loops on sub-pixel rendering differences
                setContainerWidth(prev => Math.abs(prev - newWidth) > 1 ? newWidth : prev);
            }
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    const { days, monthLabels, maxScore, cellSize, cellGap } = useMemo(() => {
        const getLocalDateStr = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const dataMap = new Map<string, { count: number; totalScore: number }>();
        reports.forEach(report => {
            const date = report.testDate; // Assuming testDate is already YYYY-MM-DD
            const existing = dataMap.get(date) || { count: 0, totalScore: 0 };
            existing.count++;
            existing.totalScore += report.total.marks;
            dataMap.set(date, existing);
        });

        let maxScore = 0;
        for (const value of dataMap.values()) {
            const avgScore = value.totalScore / value.count;
            if (avgScore > maxScore) maxScore = avgScore;
        }

        // Align start date to the previous Monday to ensure grid alignment
        const today = new Date();
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 364);
        const dayOfWeek = startDate.getDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        startDate.setDate(startDate.getDate() - diffToMonday);

        const days = [];
        let curr = new Date(startDate);
        while (curr <= endDate) {
            const dateStr = getLocalDateStr(curr);
            const data = dataMap.get(dateStr);
            days.push({ date: new Date(curr), data: data ? { avgScore: data.totalScore / data.count, count: data.count } : undefined });
            curr.setDate(curr.getDate() + 1);
        }

        const WEEKS_IN_YEAR = 53;
        const cellGap = 3;
        const PADDING_LEFT = 32;
        const calculatedCellSize = containerWidth > 0 ? Math.max(1, Math.floor((containerWidth - PADDING_LEFT) / WEEKS_IN_YEAR) - cellGap) : 12;

        const monthLabels = [];
        let lastMonth = -1;
        for (let i = 0; i < Math.ceil(days.length / 7); i++) {
            const firstDayOfWeek = days[i * 7]?.date;
            if (firstDayOfWeek) {
                const month = firstDayOfWeek.getMonth();
                if (month !== lastMonth && (monthLabels.length === 0 || i > monthLabels[monthLabels.length - 1].weekIndex + 2)) {
                    monthLabels.push({ month: firstDayOfWeek.toLocaleString('default', { month: 'short' }), weekIndex: i });
                    lastMonth = month;
                }
            }
        }
        return { days, monthLabels, maxScore: maxScore > 0 ? maxScore : 100, cellSize: calculatedCellSize, cellGap };
    }, [reports, containerWidth]);

    const getColorClass = (score: number | undefined) => {
        if (score === undefined || score === null) return 'bg-white/10';
        const percentage = Math.max(0, score) / maxScore;
        if (percentage === 0) return 'bg-white/10'; if (percentage < 0.25) return 'bg-[rgba(var(--color-primary-rgb),0.2)]';
        if (percentage < 0.5) return 'bg-[rgba(var(--color-primary-rgb),0.4)]'; if (percentage < 0.75) return 'bg-[rgba(var(--color-primary-rgb),0.7)]';
        return 'bg-[rgb(var(--color-primary-rgb))]';
    };

    return (
        <div className="flex flex-col h-full" ref={containerRef}>
            <div className="relative h-5 mb-1" style={{ paddingLeft: '32px' }}>
                {monthLabels.map(({ month, weekIndex }) => <div key={`${month}-${weekIndex}`} className="absolute text-xs text-gray-400" style={{ left: `${weekIndex * (cellSize + cellGap)}px` }}>{month}</div>)}
            </div>
            <div className="flex">
                <div className="flex flex-col justify-around text-xs text-gray-400 pr-2" style={{ height: `${7 * (cellSize + cellGap) - cellGap}px` }}>
                    <span className="h-full flex items-center">M</span>
                    <span className="h-full flex items-center">W</span>
                    <span className="h-full flex items-center">F</span>
                </div>
                <div className="grid grid-flow-col grid-rows-7" style={{ gap: `${cellGap}px` }}>
                    {days.map((day, index) => (
                        <div 
                            key={index} 
                            className="group relative" 
                            style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                            onMouseEnter={() => setHoveredDayIndex(index)}
                            onMouseLeave={() => setHoveredDayIndex(null)}
                        >
                            <div className={`w-full h-full rounded-sm ${getColorClass(day.data?.avgScore)}`}></div>
                            {hoveredDayIndex === index && day.date && (
                                <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 text-xs text-white bg-slate-900/95 border border-slate-700/80 rounded-md shadow-lg w-max pointer-events-none">
                                    <p className="font-bold">{day.date.toLocaleDateString()}</p>
                                    <p>{day.data ? `${day.data.avgScore.toFixed(1)} score (${day.data.count} test${day.data.count > 1 ? 's' : ''})` : 'No tests'}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end items-center gap-2 text-xs text-gray-400 mt-2 flex-grow">
                <span>Less</span><div className="w-3.5 h-3.5 rounded-sm bg-white/10"></div><div className="w-3.5 h-3.5 rounded-sm bg-[rgba(var(--color-primary-rgb),0.2)]"></div><div className="w-3.5 h-3.5 rounded-sm bg-[rgba(var(--color-primary-rgb),0.4)]"></div><div className="w-3.5 h-3.5 rounded-sm bg-[rgba(var(--color-primary-rgb),0.7)]"></div><div className="w-3.5 h-3.5 rounded-sm bg-[rgb(var(--color-primary-rgb))]"></div><span>More</span>
            </div>
        </div>
    );
});

// --- NEW WIDGET: Rank Simulator ---
export const RankSimulatorWidget: React.FC<{ rankModel: { slope: number, intercept: number } | null, currentAvg: { physics: number, chemistry: number, maths: number } }> = React.memo(({ rankModel, currentAvg }) => {
    const [improvements, setImprovements] = useState({ physics: 0, chemistry: 0, maths: 0 });
    
    const simulatedData = useMemo(() => {
        if (!rankModel) return null;
        
        const baseScore = currentAvg.physics + currentAvg.chemistry + currentAvg.maths;
        const improvementScore = improvements.physics + improvements.chemistry + improvements.maths;
        const totalSimScore = baseScore + improvementScore;
        
        const baseLogRank = rankModel.slope * baseScore + rankModel.intercept;
        const simLogRank = rankModel.slope * totalSimScore + rankModel.intercept;
        
        const baseRank = Math.exp(baseLogRank);
        const simRank = Math.exp(simLogRank);
        
        return {
            baseRank: Math.round(baseRank),
            simRank: Math.round(simRank),
            rankImprovement: Math.round(baseRank - simRank),
            percentImprovement: baseRank > 0 ? ((baseRank - simRank) / baseRank) * 100 : 0
        };
    }, [rankModel, currentAvg, improvements]);

    if (!rankModel) return <div className="flex items-center justify-center h-full text-gray-500">Not enough data for simulation.</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/10 mb-4">
                <div>
                    <p className="text-xs text-gray-400">Current Rank Est.</p>
                    <p className="text-lg font-bold text-white tabular-nums">#{simulatedData?.baseRank ? formatRank(simulatedData.baseRank) : 'N/A'}</p>
                </div>
                <div className="text-2xl text-gray-600">➔</div>
                <div className="text-right">
                    <p className="text-xs text-cyan-400">Simulated Rank</p>
                    <p className="text-2xl font-bold text-cyan-300 tabular-nums">#{simulatedData?.simRank ? formatRank(simulatedData.simRank) : 'N/A'}</p>
                    {simulatedData && simulatedData.rankImprovement > 0 && (
                        <p className="text-[10px] text-green-400 font-bold">▲ {formatRank(simulatedData.rankImprovement)} spots</p>
                    )}
                </div>
            </div>
            
            <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {(['physics', 'chemistry', 'maths'] as const).map(subject => (
                    <div key={subject}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize text-gray-300">{subject} Improvement</span>
                            <span className="text-cyan-400">+{improvements[subject]} marks</span>
                        </div>
                        <input 
                            type="range" min="0" max="30" step="1" 
                            value={improvements[subject]} 
                            onChange={(e) => setImprovements(prev => ({...prev, [subject]: parseInt(e.target.value)}))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                            <span>0</span>
                            <span>+30</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-4 p-2 bg-blue-900/20 border border-blue-800/30 rounded text-[10px] text-blue-200 text-center">
                Simulating effect of score boost on predicted rank using regression model.
            </div>
        </div>
    );
});

// --- NEW WIDGET: Reflections ---
export const ReflectionsWidget: React.FC<{ reflections: Reflection[] }> = React.memo(({ reflections }) => {
    if (reflections.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">No reflections yet. Start journaling!</div>;

    const recentReflections = reflections.slice(0, 3);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {recentReflections.map(r => (
                    <div key={r.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-gray-400">{new Date(r.timestamp).toLocaleDateString()}</span>
                            <span className="text-sm">{r.mood === 'eureka' ? '💡' : r.mood === 'frustrated' ? '😫' : r.mood === 'confident' ? '😎' : r.mood === 'confused' ? '🤔' : '📝'}</span>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2">{r.content}</p>
                        {r.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {r.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded text-[10px] border border-indigo-700/50">
                                        {tag}
                                    </span>
                                ))}
                                {r.tags.length > 3 && <span className="text-[10px] text-gray-500">+{r.tags.length - 3}</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

// --- NEW WIDGET: Weakness Heatmap ---
export const WeaknessHeatmapWidget: React.FC<{ logs: QuestionLog[], onSelectTopic?: (topic: string) => void }> = React.memo(({ logs, onSelectTopic }) => {
    const topicStats = useMemo(() => {
        const stats = new Map<string, { attempts: number, wrong: number, subject: string }>();
        logs.forEach(log => {
            if (log.topic && log.topic !== 'N/A') {
                const curr = stats.get(log.topic) || { attempts: 0, wrong: 0, subject: log.subject };
                curr.attempts++;
                if (log.status === 'Wrong' || log.status === 'Partially Correct') {
                    curr.wrong++;
                }
                stats.set(log.topic, curr);
            }
        });

        const topics = Array.from(stats.entries())
            .filter(([_, data]) => data.attempts >= 3)
            .map(([topic, data]) => ({
                topic,
                subject: data.subject,
                errorRate: data.wrong / data.attempts,
                attempts: data.attempts
            }))
            .sort((a, b) => b.errorRate - a.errorRate)
            .slice(0, 15);

        return topics;
    }, [logs]);

    if (topicStats.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
                Not enough data to generate weakness heatmap. Attempt more questions!
            </div>
        );
    }

    const getColor = (rate: number) => {
        if (rate > 0.7) return 'bg-red-500/80 border-red-500 text-white shadow-red-950/40';
        if (rate > 0.4) return 'bg-orange-500/80 border-orange-500 text-white shadow-orange-950/40';
        if (rate > 0.2) return 'bg-amber-500/80 border-amber-500 text-black shadow-amber-950/40';
        return 'bg-emerald-500/80 border-emerald-500 text-white shadow-emerald-950/40';
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                    {topicStats.map(t => (
                        <div 
                            key={t.topic} 
                            onClick={() => onSelectTopic?.(t.topic)}
                            className={`px-3 py-2 rounded-xl border text-xs font-medium flex flex-col gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md ${getColor(t.errorRate)}`}
                            title={`${t.subject}: ${(t.errorRate * 100).toFixed(0)}% Error Rate (${t.attempts} attempts). Click to filter.`}
                        >
                            <span className="truncate max-w-[120px] font-bold">{t.topic}</span>
                            <span className="opacity-90 font-mono text-[10px]">{(t.errorRate * 100).toFixed(0)}% Error</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                <span>Low Error</span>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
                <span>High Error</span>
            </div>
        </div>
    );
});

// --- NEW WIDGET: Goal Progress ---
export const GoalProgressWidget: React.FC<{ goals: LongTermGoal[] }> = React.memo(({ goals }) => {
    if (goals.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">No long term goals set in Settings.</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {goals.map(goal => (
                    <div key={goal.id} className={`p-3 rounded-lg border transition-all ${goal.completed ? 'bg-green-900/20 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${goal.completed ? 'border-green-500 bg-green-500' : 'border-gray-500'}`}>
                                {goal.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <p className={`text-sm font-medium ${goal.completed ? 'text-green-100 line-through' : 'text-white'}`}>{goal.text}</p>
                        </div>
                        
                        {!goal.completed && (
                            <div className="mt-3 pl-8">
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500 w-1/3 rounded-full opacity-50"></div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 text-right">In Progress</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

// --- Custom Tooltips for New Widgets ---
const CustomAvgMarksTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-3 glass-panel border-white/5 rounded-lg shadow-xl text-sm z-50">
                <p className="font-bold text-white mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-cyan-400 flex justify-between gap-4"><span>Avg Marks:</span> <span className="font-mono text-white">{data.avg}</span></p>
                    <p className="text-gray-400 flex justify-between gap-4 text-xs"><span>Total Marks:</span> <span className="font-mono text-white">{data.total}</span></p>
                    <p className="text-gray-400 flex justify-between gap-4 text-xs"><span>Tests Taken:</span> <span className="font-mono text-white">{data.count}</span></p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomTimeAllocationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        // Recharts PieChart payload structure can be nested
        const data = payload[0].payload.payload || payload[0].payload;
        return (
            <div className="p-3 glass-panel border-white/5 rounded-lg shadow-xl text-sm z-50">
                <p className="font-bold text-white mb-2">{data.name}</p>
                <div className="space-y-1">
                    <p className="text-cyan-400 flex justify-between gap-4"><span>Time Spent:</span> <span className="font-mono text-white">{Math.round(data.value / 60)} mins</span></p>
                    {data.totalTime > 0 && (
                        <p className="text-gray-400 flex justify-between gap-4 text-xs"><span>% of Total:</span> <span className="font-mono text-white">{Math.round((data.value / data.totalTime) * 100)}%</span></p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const CustomNegativeMarksTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-3 glass-panel border-white/5 rounded-lg shadow-xl text-sm z-50">
                <p className="font-bold text-white mb-2">{data.date}</p>
                <div className="space-y-1">
                    <p className="text-red-400 flex justify-between gap-4"><span>Marks Lost:</span> <span className="font-mono text-white">{data.lostMarks}</span></p>
                    <p className="text-gray-400 flex justify-between gap-4 text-xs"><span>Test:</span> <span className="font-mono text-white">{data.testName}</span></p>
                </div>
            </div>
        );
    }
    return null;
};

// --- NEW WIDGET: Subject Relativity ---
export const SubjectRelativityWidget: React.FC<{ reports: TestReport[] }> = React.memo(({ reports }) => {
    const stats = useMemo(() => {
        if (reports.length === 0) return null;
        let p = 0, c = 0, m = 0;
        reports.forEach(r => {
            if (isValidSubjectForReport(r, 'physics')) p += (r.physics?.marks || 0);
            if (isValidSubjectForReport(r, 'chemistry')) c += (r.chemistry?.marks || 0);
            if (isValidSubjectForReport(r, 'maths')) m += (r.maths?.marks || 0);
        });
        const total = p + c + m;
        if (total === 0) return null;
        return { p, c, m };
    }, [reports]);

    if (!stats) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">Not enough data.</div>;

    const { p, c, m } = stats;
    
    const getRatio = (val1: number, val2: number) => {
        if (val2 === 0) return '∞';
        return (val1 / val2).toFixed(1);
    };

    return (
        <div className="h-full flex flex-col justify-center p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-4 text-center">Score Multipliers</h4>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-cyan-400 font-bold">Maths vs Physics</span>
                    <span className="text-xl font-black text-white">{getRatio(m, p)}x</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-purple-400 font-bold">Physics vs Chem</span>
                    <span className="text-xl font-black text-white">{getRatio(p, c)}x</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-emerald-400 font-bold">Chem vs Maths</span>
                    <span className="text-xl font-black text-white">{getRatio(c, m)}x</span>
                </div>
            </div>
            <div className="mt-4 text-xs text-gray-400 text-center italic">
                Based on total marks across all tests.
            </div>
        </div>
    );
});

// --- NEW WIDGET: Avg Marks Bar Graph ---
export const AvgMarksBarWidget: React.FC<{ reports: TestReport[] }> = React.memo(({ reports }) => {
    const data = useMemo(() => {
        if (reports.length === 0) return [];
        let p = 0, c = 0, m = 0;
        let pCount = 0, cCount = 0, mCount = 0;
        reports.forEach(r => {
            if (isValidSubjectForReport(r, 'physics')) { p += (r.physics?.marks || 0); pCount++; }
            if (isValidSubjectForReport(r, 'chemistry')) { c += (r.chemistry?.marks || 0); cCount++; }
            if (isValidSubjectForReport(r, 'maths')) { m += (r.maths?.marks || 0); mCount++; }
        });
        return [
            { subject: 'Physics', avg: pCount > 0 ? Math.round(p / pCount) : 0, total: p, count: pCount, fill: SUBJECT_CONFIG.physics.color },
            { subject: 'Chemistry', avg: cCount > 0 ? Math.round(c / cCount) : 0, total: c, count: cCount, fill: SUBJECT_CONFIG.chemistry.color },
            { subject: 'Maths', avg: mCount > 0 ? Math.round(m / mCount) : 0, total: m, count: mCount, fill: SUBJECT_CONFIG.maths.color }
        ];
    }, [reports]);

    if (data.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">Not enough data.</div>;

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomAvgMarksTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});

// --- NEW WIDGET: Weakest Link Analysis ---
export const WeakestLinkWidget: React.FC<{ reports: TestReport[] }> = React.memo(({ reports }) => {
    const analysis = useMemo(() => {
        if (reports.length === 0) return null;
        let p = 0, c = 0, m = 0;
        let pNeg = 0, cNeg = 0, mNeg = 0;
        let pCount = 0, cCount = 0, mCount = 0;
        reports.forEach(r => {
            if (isValidSubjectForReport(r, 'physics')) { p += (r.physics?.marks || 0); pNeg += (r.physics?.wrong || 0); pCount++; }
            if (isValidSubjectForReport(r, 'chemistry')) { c += (r.chemistry?.marks || 0); cNeg += (r.chemistry?.wrong || 0); cCount++; }
            if (isValidSubjectForReport(r, 'maths')) { m += (r.maths?.marks || 0); mNeg += (r.maths?.wrong || 0); mCount++; }
        });
        
        const subjects = [
            { name: 'Physics', marks: p, neg: pNeg, count: pCount, color: 'text-purple-400', bg: 'bg-purple-500/20' },
            { name: 'Chemistry', marks: c, neg: cNeg, count: cCount, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
            { name: 'Maths', marks: m, neg: mNeg, count: mCount, color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
        ].filter(s => s.count > 0);
        
        if (subjects.length === 0) return null;

        subjects.sort((a, b) => a.marks - b.marks);
        const weakest = subjects[0];
        
        let reason = "Low overall accuracy.";
        if (weakest.neg > (weakest.count * 5)) {
            reason = "High negative marking is dragging your score down.";
        } else if (weakest.marks < (weakest.count * 10)) {
            reason = "Very low attempt rate or conceptual gaps.";
        }

        return { weakest, reason };
    }, [reports]);

    if (!analysis) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">Not enough data.</div>;

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className={`w-20 h-20 rounded-full ${analysis.weakest.bg} flex items-center justify-center mb-4 border border-white/10`}>
                <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Bottleneck: <span className={analysis.weakest.color}>{analysis.weakest.name}</span></h3>
            <p className="text-sm text-gray-400 mb-4">{analysis.reason}</p>
            
            <div className="w-full bg-black/20 rounded-lg p-3 border border-white/5">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Total Marks</span>
                    <span className="font-bold text-white">{analysis.weakest.marks}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Total Negatives</span>
                    <span className="font-bold text-red-400">-{analysis.weakest.neg}</span>
                </div>
            </div>
        </div>
    );
});

// --- NEW WIDGET: Time Allocation ---
export const TimeAllocationWidget: React.FC<{ logs: QuestionLog[] }> = React.memo(({ logs }) => {
    const data = useMemo(() => {
        if (logs.length === 0) return [];
        let p = 0, c = 0, m = 0;
        logs.forEach(log => {
            if (log.subject === 'physics') p += (log.timeSpent || 0);
            if (log.subject === 'chemistry') c += (log.timeSpent || 0);
            if (log.subject === 'maths') m += (log.timeSpent || 0);
        });
        if (p === 0 && c === 0 && m === 0) return [];
        const totalTime = p + c + m;
        return [
            { name: 'Physics', value: p, totalTime, fill: SUBJECT_CONFIG.physics.color },
            { name: 'Chemistry', value: c, totalTime, fill: SUBJECT_CONFIG.chemistry.color },
            { name: 'Maths', value: m, totalTime, fill: SUBJECT_CONFIG.maths.color }
        ];
    }, [logs]);

    if (data.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">Not enough time data.</div>;

    return (
        <div className="h-full w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTimeAllocationTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
});

// --- NEW WIDGET: Negative Marks Impact ---
export const NegativeMarksWidget: React.FC<{ reports: TestReport[] }> = React.memo(({ reports }) => {
    const data = useMemo(() => {
        if (reports.length === 0) return [];
        return reports.slice(-5).map((r, i) => {
            const totalNegative = (r.physics?.wrong || 0) + (r.chemistry?.wrong || 0) + (r.maths?.wrong || 0);
            return {
                name: `T${i + 1}`,
                lostMarks: totalNegative, // Assuming 1 mark lost per incorrect
                date: new Date(r.testDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                testName: r.testName
            };
        });
    }, [reports]);

    if (data.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">Not enough data.</div>;

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomNegativeMarksTooltip />} />
                    <Area type="monotone" dataKey="lostMarks" name="Marks Lost" stroke="#ef4444" fillOpacity={1} fill="url(#colorLost)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
});

// --- NEW WIDGET: Peer Comparison ---
export const PeerComparisonWidget: React.FC<{ logs: QuestionLog[] }> = React.memo(({ logs }) => {
    const data = useMemo(() => {
        if (logs.length === 0) return null;
        
        let userCorrectTime = 0;
        let peerCorrectTime = 0;
        let correctCount = 0;
        
        let userAccuracy = 0;
        let peerAccuracy = 0;
        let totalQuestions = 0;

        logs.forEach(log => {
            if (log.peerTimeSpent && log.timeSpent && log.status === 'Fully Correct') {
                userCorrectTime += log.timeSpent;
                peerCorrectTime += log.peerTimeSpent;
                correctCount++;
            }
            if (log.peerCorrectPercent !== undefined) {
                userAccuracy += (log.status === 'Fully Correct' ? 100 : 0);
                peerAccuracy += log.peerCorrectPercent;
                totalQuestions++;
            }
        });

        if (totalQuestions === 0) return null;

        return {
            avgUserCorrectTime: correctCount > 0 ? Math.round(userCorrectTime / correctCount) : 0,
            avgPeerCorrectTime: correctCount > 0 ? Math.round(peerCorrectTime / correctCount) : 0,
            avgUserAccuracy: Math.round(userAccuracy / totalQuestions),
            avgPeerAccuracy: Math.round(peerAccuracy / totalQuestions),
        };
    }, [logs]);

    if (!data) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">Not enough peer data.</div>;

    return (
        <div className="h-full flex flex-col justify-center p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-4 text-center">You vs Peers</h4>
            <div className="space-y-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-xs">Accuracy</span>
                        <span className="text-xs font-bold text-white">{data.avgUserAccuracy}% vs {data.avgPeerAccuracy}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden flex">
                        <div className="bg-cyan-500 h-full" style={{ width: `${data.avgUserAccuracy}%` }}></div>
                        <div className="bg-purple-500 h-full opacity-50" style={{ width: `${Math.max(0, data.avgPeerAccuracy - data.avgUserAccuracy)}%` }}></div>
                    </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-xs">Time on Correct (s)</span>
                        <span className="text-xs font-bold text-white">{data.avgUserCorrectTime}s vs {data.avgPeerCorrectTime}s</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(data.avgUserCorrectTime, data.avgPeerCorrectTime) > 0 ? Math.min(100, (data.avgUserCorrectTime / Math.max(data.avgUserCorrectTime, data.avgPeerCorrectTime)) * 100) : 0}%` }}></div>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden flex mt-1">
                         <div className="bg-amber-500 h-full" style={{ width: `${Math.max(data.avgUserCorrectTime, data.avgPeerCorrectTime) > 0 ? Math.min(100, (data.avgPeerCorrectTime / Math.max(data.avgUserCorrectTime, data.avgPeerCorrectTime)) * 100) : 0}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const TopperGapWidget: React.FC<{ reports: TestReport[] }> = React.memo(({ reports }) => {
    const userStats = useMemo(() => {
        if (!reports || reports.length === 0) return { avgScore: 0, accuracy: 0, attemptRate: 0, cwRatio: 0, negMarks: 0 };
        const last3 = reports.slice(-3);
        const avgScore = Math.round(last3.reduce((s, r) => s + (r.total?.marks || 0), 0) / last3.length);
        const avgAcc = Math.round(last3.reduce((s, r) => s + (r.totalMetrics?.accuracy || 0), 0) / last3.length);
        const avgAtt = Math.round(last3.reduce((s, r) => s + (r.totalMetrics?.attemptRate || 0), 0) / last3.length);
        const avgCW = Math.round((last3.reduce((s, r) => s + (r.totalMetrics?.cwRatio || 0), 0) / last3.length) * 10) / 10;
        const avgNeg = Math.round(last3.reduce((s, r) => s + (r.total?.wrong || 0), 0) / last3.length) * 1;
        return { avgScore, accuracy: avgAcc, attemptRate: avgAtt, cwRatio: avgCW, negMarks: avgNeg };
    }, [reports]);

    const topperBenchmark = { avgScore: 175, accuracy: 89, attemptRate: 74, cwRatio: 6.8, negMarks: 4 };

    return (
        <div className="p-4 h-full flex flex-col justify-between">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <span>🏆</span> Topper Gap Analysis (vs 99%ile AIR 500)
            </h4>
            <div className="space-y-2 text-xs">
                <div className="grid grid-cols-4 font-semibold text-slate-400 pb-1 border-b border-slate-700">
                    <span>Metric</span>
                    <span className="text-right">You</span>
                    <span className="text-right text-cyan-400">99%ile</span>
                    <span className="text-right">Gap</span>
                </div>
                <div className="grid grid-cols-4 items-center">
                    <span className="text-slate-300">Avg Score</span>
                    <span className="text-right font-mono text-white">{userStats.avgScore}</span>
                    <span className="text-right font-mono text-cyan-400">{topperBenchmark.avgScore}</span>
                    <span className={`text-right font-mono ${userStats.avgScore >= topperBenchmark.avgScore ? 'text-green-400' : 'text-red-400'}`}>
                        {userStats.avgScore - topperBenchmark.avgScore}
                    </span>
                </div>
                <div className="grid grid-cols-4 items-center">
                    <span className="text-slate-300">Accuracy</span>
                    <span className="text-right font-mono text-white">{userStats.accuracy}%</span>
                    <span className="text-right font-mono text-cyan-400">{topperBenchmark.accuracy}%</span>
                    <span className={`text-right font-mono ${userStats.accuracy >= topperBenchmark.accuracy ? 'text-green-400' : 'text-red-400'}`}>
                        {userStats.accuracy - topperBenchmark.accuracy}%
                    </span>
                </div>
                <div className="grid grid-cols-4 items-center">
                    <span className="text-slate-300">Attempt Rate</span>
                    <span className="text-right font-mono text-white">{userStats.attemptRate}%</span>
                    <span className="text-right font-mono text-cyan-400">{topperBenchmark.attemptRate}%</span>
                    <span className="text-right font-mono text-amber-400">
                        {userStats.attemptRate > topperBenchmark.attemptRate ? 'Over-att' : 'Optimal'}
                    </span>
                </div>
                <div className="grid grid-cols-4 items-center">
                    <span className="text-slate-300">C/W Ratio</span>
                    <span className="text-right font-mono text-white">{userStats.cwRatio}x</span>
                    <span className="text-right font-mono text-cyan-400">{topperBenchmark.cwRatio}x</span>
                    <span className="text-right font-mono text-slate-400">{(userStats.cwRatio - topperBenchmark.cwRatio).toFixed(1)}x</span>
                </div>
                <div className="grid grid-cols-4 items-center">
                    <span className="text-slate-300">Neg Loss</span>
                    <span className="text-right font-mono text-red-400">-{userStats.negMarks}m</span>
                    <span className="text-right font-mono text-cyan-400">-{topperBenchmark.negMarks}m</span>
                    <span className="text-right font-mono text-red-400">-{Math.max(0, userStats.negMarks - topperBenchmark.negMarks)}m</span>
                </div>
            </div>
        </div>
    );
});

export const SubjectMasteryRingsWidget: React.FC<{ reports: TestReport[], onSelectSubject?: (sub: string) => void }> = React.memo(({ reports, onSelectSubject }) => {
    const data = useMemo(() => {
        if (!reports || reports.length === 0) return { physics: 45, chemistry: 60, maths: 30 };
        const last = reports[reports.length - 1];
        return {
            physics: Math.min(100, Math.round((last.physicsMetrics?.accuracy || 50))),
            chemistry: Math.min(100, Math.round((last.chemistryMetrics?.accuracy || 60))),
            maths: Math.min(100, Math.round((last.mathsMetrics?.accuracy || 40))),
        };
    }, [reports]);

    return (
        <div className="p-4 h-full flex flex-col items-center justify-center text-center">
            <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">Subject Mastery Rings</h4>
            <div className="flex items-center justify-center gap-6 my-2">
                <div className="cursor-pointer group" onClick={() => onSelectSubject?.('physics')}>
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="6" className="text-cyan-400 transition-all duration-1000" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * data.physics) / 100} strokeLinecap="round" />
                    </svg>
                    <span className="block text-[11px] font-bold text-cyan-300 mt-1">Physics ({data.physics}%)</span>
                </div>
                <div className="cursor-pointer group" onClick={() => onSelectSubject?.('chemistry')}>
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="6" className="text-emerald-400 transition-all duration-1000" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * data.chemistry) / 100} strokeLinecap="round" />
                    </svg>
                    <span className="block text-[11px] font-bold text-emerald-300 mt-1">Chem ({data.chemistry}%)</span>
                </div>
                <div className="cursor-pointer group" onClick={() => onSelectSubject?.('maths')}>
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="6" className="text-amber-400 transition-all duration-1000" fill="transparent" strokeDasharray={150} strokeDashoffset={150 - (150 * data.maths) / 100} strokeLinecap="round" />
                    </svg>
                    <span className="block text-[11px] font-bold text-amber-300 mt-1">Maths ({data.maths}%)</span>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Tap a ring to view weakest chapters</p>
        </div>
    );
});

export const ErrorDnaWidget: React.FC<{ logs: QuestionLog[] }> = React.memo(({ logs }) => {
    const eStats = useMemo(() => {
        const counts: Record<string, number> = { E1: 0, E2: 0, E3: 0, E4: 0, E5: 0, E6: 0, E7: 0 };
        let totalWrong = 0;
        logs.forEach(l => {
            if (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect) {
                totalWrong++;
                if (l.errorCode && counts[l.errorCode] !== undefined) {
                    counts[l.errorCode]++;
                } else {
                    counts['E3']++; // fallback
                }
            }
        });
        const highestCode = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'E3');
        const labels: Record<string, string> = {
            E1: 'Conceptual Gap', E2: 'Formula Recall', E3: 'Calculation Slip',
            E4: 'Reading Error', E5: 'Time Panic', E6: 'Silly Skip', E7: 'Overconfidence'
        };
        return { counts, totalWrong, highestCode, highestLabel: labels[highestCode] };
    }, [logs]);

    const colors: Record<string, string> = {
        E1: 'bg-red-500', E2: 'bg-orange-500', E3: 'bg-amber-500',
        E4: 'bg-yellow-500', E5: 'bg-purple-500', E6: 'bg-blue-500', E7: 'bg-pink-500'
    };

    return (
        <div className="p-4 h-full flex flex-col justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>🧬 Error DNA Taxonomy</span>
                <span className="text-[10px] text-slate-400 font-normal">{eStats.totalWrong} errors logged</span>
            </h4>
            
            <div className="my-3">
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    {Object.entries(eStats.counts).map(([code, cnt]) => {
                        if (cnt === 0 || eStats.totalWrong === 0) return null;
                        const pct = Math.round((cnt / eStats.totalWrong) * 100);
                        return (
                            <div key={code} className={`${colors[code]} h-full`} style={{ width: `${pct}%` }} title={`${code}: ${cnt} (${pct}%)`} />
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-slate-300">
                    {Object.entries(eStats.counts).map(([code, cnt]) => (
                        <div key={code} className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${colors[code]}`}></span>
                            <span>{code}: <strong>{cnt}</strong></span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-2 rounded bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300">
                ⚠️ Primary Error DNA: <strong>{eStats.highestCode} ({eStats.highestLabel})</strong>. Focus drills here.
            </div>
        </div>
    );
});

export const SundayDebriefCard: React.FC<{ logs: QuestionLog[]; reports: TestReport[] }> = React.memo(({ logs, reports }) => {
    const isSunday = new Date().getDay() === 0;

    const summaryData = useMemo(() => {
        const totalTests = reports.length;
        const recentReport = reports[reports.length - 1];
        const lastScore = recentReport ? (recentReport.total?.marks || 0) : 0;
        const e3Count = logs.filter(l => l.errorCode === 'E3').length;
        const topError = e3Count > logs.length * 0.3 ? 'E3 Calculation Slips' : 'Formula Recall (E2)';

        return {
            totalTests,
            lastScore,
            topError,
            recommendation: 'Focus on 45-minute timed DPP blocks and slow down by 10% during intermediate calculations.'
        };
    }, [logs, reports]);

    return (
        <div className="w-full mb-6 p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <h3 className="text-sm font-bold text-purple-300 tracking-wide">
                        {isSunday ? 'Sunday Weekly Debrief Card' : 'Weekly Insight Preview'}
                    </h3>
                </div>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded font-mono">
                    AI Coach Observations
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <p className="text-slate-400 text-[11px]">Latest Test Performance</p>
                    <p className="text-base font-bold text-white mt-0.5">{summaryData.lastScore} marks</p>
                    <p className="text-[10px] text-slate-500">{summaryData.totalTests} total mock tests logged</p>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <p className="text-slate-400 text-[11px]">Primary Mark-Killer</p>
                    <p className="text-base font-bold text-amber-300 mt-0.5">{summaryData.topError}</p>
                    <p className="text-[10px] text-amber-400/80">Responsible for majority of lost marks</p>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-cyan-900/40">
                    <p className="text-slate-400 text-[11px]">Top Single Action Next Week</p>
                    <p className="text-xs font-semibold text-cyan-200 mt-1 leading-relaxed">{summaryData.recommendation}</p>
                </div>
            </div>
        </div>
    );
});

export const BurnoutIntelligenceWidget: React.FC<{
    clsScore?: number;
    riskLevel?: string;
    peakSlot?: string;
    onNavigate?: (view: string) => void;
}> = React.memo(({ clsScore = 78, riskLevel = 'optimal', peakSlot = 'Morning', onNavigate }) => {
    const isCritical = clsScore < 40;
    const isHigh = clsScore < 60;

    return (
        <div className={`p-4 h-full flex flex-col justify-between rounded-xl border ${
            isCritical ? 'bg-rose-950/40 border-rose-500/40' :
            isHigh ? 'bg-amber-950/40 border-amber-500/40' :
            'bg-slate-900 border-slate-800'
        }`}>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-black tracking-widest text-rose-400 flex items-center gap-1.5">
                        <span>🔋</span> Cognitive Load (CLS)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isCritical ? 'bg-rose-500 text-white' :
                        isHigh ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                    }`}>
                        {riskLevel}
                    </span>
                </div>

                <div className="flex items-baseline justify-between">
                    <div>
                        <div className="text-2xl font-black text-white font-mono tracking-tight">
                            {clsScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                            Mental Battery Level
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">Peak Focus</span>
                        <span className="text-xs font-bold text-cyan-300">
                            {peakSlot}
                        </span>
                    </div>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${clsScore < 40 ? 'bg-rose-500' : clsScore < 60 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                        style={{ width: `${clsScore}%` }}
                    />
                </div>
            </div>

            <button
                onClick={() => onNavigate && onNavigate('burnout-dashboard')}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
                <span>Open Burnout & Energy Lab</span>
                <span>➔</span>
            </button>
        </div>
    );
});

export const WeakZoneRadarWidget: React.FC<{
    criticalCount?: number;
    topChapter?: string;
    onNavigate?: (view: string) => void;
}> = React.memo(({ criticalCount = 4, topChapter = 'Rotational Motion', onNavigate }) => {
    return (
        <div className="p-4 h-full flex flex-col justify-between rounded-xl bg-slate-900 border border-rose-500/30 shadow-lg">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-black tracking-widest text-rose-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        Weak Zone Radar
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700 text-rose-300 font-bold">
                        Ebbinghaus Decay
                    </span>
                </div>

                <div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                        {criticalCount} Chapters
                    </div>
                    <div className="text-[10px] text-rose-300/80 font-medium">
                        At risk of memory amnesia
                    </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                    <span className="text-slate-400 truncate">Top Priority:</span>
                    <span className="font-bold text-rose-400 truncate max-w-[130px]">{topChapter}</span>
                </div>
            </div>

            <button
                onClick={() => onNavigate && onNavigate('weak-zone-radar')}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
                <span>Launch Retention Radar</span>
                <span>➔</span>
            </button>
        </div>
    );
});

export const PYQGapScoreWidget: React.FC<{
    alignmentScore?: number;
    urgentGapsCount?: number;
    onNavigate?: (view: string) => void;
}> = React.memo(({ alignmentScore = 82, urgentGapsCount = 3, onNavigate }) => {
    return (
        <div className="p-4 h-full flex flex-col justify-between rounded-xl bg-slate-900 border border-cyan-500/30 shadow-lg">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        PYQ Intelligence
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-bold">
                        120+ Shifts
                    </span>
                </div>

                <div className="flex items-baseline justify-between">
                    <div>
                        <div className="text-2xl font-black text-white font-mono tracking-tight">
                            {alignmentScore}% <span className="text-xs text-slate-400 font-normal">Covered</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                            High-Yield JEE Alignment
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">Urgent Gaps</span>
                        <span className="text-xs font-bold text-rose-400 font-mono">
                            {urgentGapsCount} Chapters
                        </span>
                    </div>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${alignmentScore < 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${alignmentScore}%` }}
                    />
                </div>
            </div>

            <button
                onClick={() => onNavigate && onNavigate('pyq-lab')}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
                <span>Launch PYQ Lab</span>
                <span>➔</span>
            </button>
        </div>
    );
});

export const ExamStrategyWidget: React.FC<{
    order?: string[];
    onNavigate?: (view: string) => void;
}> = React.memo(({ order = ['Chemistry', 'Physics', 'Maths'], onNavigate }) => {
    return (
        <div className="p-4 h-full flex flex-col justify-between rounded-xl bg-slate-900 border border-amber-500/30 shadow-lg">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-black tracking-widest text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        Strategy Card
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-300 font-bold">
                        MPM Optimized
                    </span>
                </div>

                <div>
                    <div className="text-xs text-slate-400 font-medium">
                        Recommended Sequence:
                    </div>
                    <div className="text-sm font-black text-white font-mono tracking-tight mt-1 flex items-center gap-1.5">
                        <span className="text-amber-300">1. {order[0]}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="text-slate-200">2. {order[1]}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="text-slate-200">3. {order[2]}</span>
                    </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between">
                    <span>Target Time Budget:</span>
                    <span className="font-mono font-bold text-amber-400">45m &bull; 55m &bull; 65m</span>
                </div>
            </div>

            <button
                onClick={() => onNavigate && onNavigate('efficiency-optimizer')}
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
                <span>Open Time Optimizer</span>
                <span>➔</span>
            </button>
        </div>
    );
});

export const ExamDayWidget: React.FC<{
    targetExam?: string;
    onNavigate?: (view: string) => void;
}> = React.memo(({ targetExam = 'JEE Mains 2026', onNavigate }) => {
    return (
        <div className="p-4 h-full flex flex-col justify-between rounded-xl bg-gradient-to-br from-red-950/40 to-slate-900 border border-rose-500/40 shadow-lg">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-black tracking-widest text-rose-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        Command Center
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-bold">
                        D-Day Ready
                    </span>
                </div>

                <div>
                    <h4 className="text-sm font-black text-white">
                        {targetExam} Protocol
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                        4-7-8 breathing reset, admit card essentials checklist & top 5 trap warnings.
                    </p>
                </div>
            </div>

            <button
                onClick={() => onNavigate && onNavigate('exam-day-center')}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950"
            >
                <span>Launch Command Center</span>
                <span>➔</span>
            </button>
        </div>
    );
});


