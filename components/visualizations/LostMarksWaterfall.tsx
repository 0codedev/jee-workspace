import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { QuestionLog, TestReport, QuestionStatus, ErrorReason } from '../../types';
import { getMarkingScheme } from '../../utils/metrics';
import { Target, Award, TrendingDown, AlertCircle, Sparkles, SlidersHorizontal, CheckCircle2, CalendarPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { calculatePercentileFromMarks, estimateAIR } from '../../services/rankPredictorService';

interface LostMarksWaterfallProps {
    logs: QuestionLog[];
    reports?: TestReport[];
    onAddTask?: (task: { task: string; time: number; topic: string }) => void;
}

// Vibrant saturated color palette for dark mode
const WATERFALL_COLORS: Record<string, string> = {
    'Potential': '#475569', // Slate 600 (Base Potential)
    'Actual': '#10b981',    // Emerald 500 (Actual Marks Scored)
    'Unattempted (E6)': '#64748b', // Slate 500
    'Partial Loss': '#c084fc',     // Purple 400
    [ErrorReason.SillyMistake]: '#f43f5e',     // Rose 500
    [ErrorReason.ConceptualGap]: '#f59e0b',    // Amber 500
    [ErrorReason.TimePressure]: '#6366f1',     // Indigo 500
    [ErrorReason.MisreadQuestion]: '#fb923c',   // Orange 400
    [ErrorReason.Guess]: '#38bdf8',           // Sky 400
    'E1: Concept Gap': '#f59e0b',
    'E2: Formula Recall': '#eab308',
    'E3: Calc Slip': '#f43f5e',
    'E4: Read Error': '#fb923c',
    'E5: Time Panic': '#6366f1',
    'E6: Silly Skip': '#94a3b8',
    'E7: Overconfidence': '#a855f7',
};

const WaterfallTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        const isLoss = d.displayValue < 0;
        return (
            <div className="p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl text-xs z-50 backdrop-blur-md">
                <p className="font-bold text-white mb-1 text-sm">{d.name}</p>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">{d.isTotal ? 'Score:' : 'Marks Impact:'}</span>
                    <span className={`font-mono font-bold ${d.isTotal ? 'text-cyan-300' : isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {d.isTotal ? d.displayValue.toFixed(0) : `${d.displayValue > 0 ? '+' : ''}${d.displayValue.toFixed(0)}`}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export const LostMarksWaterfall: React.FC<LostMarksWaterfallProps> = ({ logs, onAddTask }) => {
    const [selectedRecoveries, setSelectedRecoveries] = useState<Set<string>>(new Set());
    const [isSimulatorExpanded, setIsSimulatorExpanded] = useState<boolean>(false);
    const [taskAdded, setTaskAdded] = useState(false);

    const { chartData, potentialScore, actualScore, totalDeductions, topLoss, deductionsMap, deductionEntries } = useMemo(() => {
        if (logs.length === 0) {
            return { 
                chartData: [], 
                potentialScore: 0, 
                actualScore: 0, 
                totalDeductions: 0, 
                topLoss: null, 
                deductionsMap: {},
                deductionEntries: []
            };
        }
        
        const actualScoreVal = logs.reduce((acc, log) => acc + log.marksAwarded, 0);
        const eCodeLabels: Record<string, string> = {
            E1: 'E1: Concept Gap', E2: 'E2: Formula Recall', E3: 'E3: Calc Slip',
            E4: 'E4: Read Error', E5: 'E5: Time Panic', E6: 'E6: Silly Skip', E7: 'E7: Overconfidence'
        };
        const deductions: Record<string, number> = { 'Unattempted (E6)': 0, 'Partial Loss': 0 };

        logs.forEach(log => {
             const { correct: maxMarks, wrong: negMarks } = getMarkingScheme(log.questionType);
             if (log.status === QuestionStatus.Unanswered) { 
                 deductions['Unattempted (E6)'] += maxMarks; 
             } else if (log.status === QuestionStatus.Wrong) {
                 const lost = maxMarks + Math.abs(negMarks);
                 const code = log.errorCode || 'E3';
                 const label = eCodeLabels[code] || log.reasonForError || ErrorReason.Guess;
                 deductions[label] = (deductions[label] || 0) + lost;
             } else if (log.status === QuestionStatus.PartiallyCorrect) {
                 const lost = maxMarks - log.marksAwarded;
                 deductions['Partial Loss'] += lost;
             }
        });

        const totalDeductionsVal = Object.values(deductions).reduce((a, b) => a + b, 0);
        const potentialScoreVal = actualScoreVal + totalDeductionsVal;
        const data = [];
        
        data.push({ 
            name: 'Potential Score', 
            value: [0, potentialScoreVal], 
            fill: WATERFALL_COLORS['Potential'], 
            isTotal: true, 
            displayValue: potentialScoreVal 
        });

        let currentHeight = potentialScoreVal;
        const entries = Object.entries(deductions)
            .filter(([, val]) => val > 0)
            .sort(([, a], [, b]) => b - a);

        let highestLoss: { name: string; loss: number } | null = null;

        entries.forEach(([reason, loss]) => {
            if (!highestLoss || loss > highestLoss.loss) {
                highestLoss = { name: reason, loss };
            }
            const nextHeight = currentHeight - loss;
            const color = WATERFALL_COLORS[reason] || '#f43f5e';
            data.push({ 
                name: reason, 
                value: [nextHeight, currentHeight], 
                fill: color, 
                isTotal: false, 
                displayValue: -loss 
            });
            currentHeight = nextHeight;
        });

        data.push({ 
            name: 'Actual Score', 
            value: [0, Math.max(0, currentHeight)], 
            fill: WATERFALL_COLORS['Actual'], 
            isTotal: true, 
            displayValue: currentHeight 
        }); 

        return { 
            chartData: data, 
            potentialScore: potentialScoreVal, 
            actualScore: actualScoreVal, 
            totalDeductions: totalDeductionsVal,
            topLoss: highestLoss,
            deductionsMap: deductions,
            deductionEntries: entries
        };
    }, [logs]);

    // Rank Penalty Projections via official Rank Predictor Service
    const rankProjections = useMemo(() => {
        const clampedActual = Math.max(0, Math.min(300, actualScore));
        const clampedPotential = Math.max(0, Math.min(300, potentialScore));

        const curP = calculatePercentileFromMarks(clampedActual);
        const curAir = estimateAIR(curP);

        const potP = calculatePercentileFromMarks(clampedPotential);
        const potAir = estimateAIR(potP);

        // Simulated recovered marks from active checkboxes
        const simRecoveredMarks = Array.from(selectedRecoveries).reduce((acc, key) => acc + (deductionsMap[key] || 0), 0);
        const simScore = Math.min(300, clampedActual + simRecoveredMarks);
        const simP = calculatePercentileFromMarks(simScore);
        const simAir = estimateAIR(simP);

        const totalAirGain = Math.max(0, curAir.mid - potAir.mid);
        const simAirGain = Math.max(0, curAir.mid - simAir.mid);

        return {
            curPercentile: curP,
            curAir: curAir.mid,
            potPercentile: potP,
            potAir: potAir.mid,
            totalAirGain,
            simScore,
            simPercentile: simP,
            simAir: simAir.mid,
            simAirGain,
            simRecoveredMarks
        };
    }, [actualScore, potentialScore, selectedRecoveries, deductionsMap]);

    const toggleRecoveryReason = (reason: string) => {
        setSelectedRecoveries(prev => {
            const next = new Set(prev);
            if (next.has(reason)) {
                next.delete(reason);
            } else {
                next.add(reason);
            }
            return next;
        });
    };

    const handleScheduleSprint = (reasonName: string, marksLost: number) => {
        if (onAddTask) {
            onAddTask({
                task: `Triage & Recover ${marksLost.toFixed(0)} Marks lost to ${reasonName}`,
                time: 30,
                topic: 'Error Recovery Sprint'
            });
            setTaskAdded(true);
            setTimeout(() => setTaskAdded(false), 3000);
        }
    };

    if (logs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
                No logs available to generate Lost Marks Waterfall.
            </div>
        );
    }

    return (
        <div className="flex-grow h-full flex flex-col min-h-0">
            {/* Top 4-Column Summary Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 shrink-0">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Potential</p>
                        <p className="text-base font-bold text-white font-mono">{potentialScore.toFixed(0)}</p>
                    </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Actual Score</p>
                        <p className="text-base font-bold text-emerald-400 font-mono">{actualScore.toFixed(0)}</p>
                    </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Lost</p>
                        <p className="text-base font-bold text-rose-400 font-mono">-{totalDeductions.toFixed(0)}</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-2.5 rounded-xl border border-indigo-700/50 flex items-center gap-2 shadow-inner">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                        <p className="text-[10px] text-indigo-300 uppercase font-semibold">AIR Opportunity</p>
                        <p className="text-base font-bold text-indigo-200 font-mono">+{rankProjections.totalAirGain.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Waterfall Chart Area */}
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#94a3b8" 
                            tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 500 }} 
                            interval={0} 
                            angle={-35} 
                            textAnchor="end" 
                        />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: 'transparent' }} content={<WaterfallTooltip />} />
                        <Bar 
                            dataKey="value" 
                            shape={(props: any) => { 
                                const { fill, x, y, width, height, payload, index } = props;
                                let connector = null;
                                if (index < chartData.length - 1) {
                                    const lineY = payload.isTotal ? y : y + height;
                                    connector = (
                                        <line 
                                            x1={x + width} 
                                            y1={lineY} 
                                            x2={x + width + 25} 
                                            y2={lineY} 
                                            stroke="#475569" 
                                            strokeDasharray="3 3" 
                                            strokeWidth={1.2} 
                                        />
                                    );
                                }
                                return ( 
                                    <g> 
                                        <rect x={x} y={y} width={width} height={height} fill={fill} rx={5} ry={5} /> 
                                        {connector}
                                    </g> 
                                ); 
                            }}
                        >
                            <LabelList 
                                dataKey="value" 
                                position="top" 
                                content={(props: any) => { 
                                    const { x, y, width, index } = props; 
                                    const d = chartData[index]; 
                                    const val = d ? d.displayValue : 0; 
                                    if (Math.abs(val) < 1) return null; 
                                    const color = val > 0 ? '#10b981' : '#f87171'; 
                                    const displayTxt = val > 0 && !d?.isTotal ? `+${val.toFixed(0)}` : val.toFixed(0); 
                                    return ( 
                                        <text 
                                            x={x + width / 2} 
                                            y={y - 6} 
                                            fill={d?.isTotal ? '#f8fafc' : color} 
                                            textAnchor="middle" 
                                            fontSize={10} 
                                            fontWeight={700}
                                        >
                                            {displayTxt}
                                        </text> 
                                    ); 
                                }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Dynamic Rank Impact & Simulator Ribbon */}
            <div className="mt-2 space-y-2 shrink-0">
                {/* AIR Impact Callout */}
                <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-800/40 px-3.5 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center shrink-0">
                            🏆
                        </div>
                        <div>
                            <span className="text-slate-400">Current Projected AIR: </span>
                            <span className="font-mono font-bold text-white">~{rankProjections.curAir.toLocaleString()}</span>
                            <span className="text-slate-500 font-mono text-[11px] ml-1">({rankProjections.curPercentile.toFixed(2)}%ile)</span>
                            <span className="text-slate-400 mx-1.5">→</span>
                            <span className="text-slate-400">Potential Ceiling: </span>
                            <span className="font-mono font-bold text-cyan-300">~{rankProjections.potAir.toLocaleString()}</span>
                            <span className="text-slate-500 font-mono text-[11px] ml-1">({rankProjections.potPercentile.toFixed(2)}%ile)</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {topLoss && (
                            <button
                                onClick={() => handleScheduleSprint(topLoss.name, topLoss.loss)}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/50"
                                title={`Fix ${topLoss.name} to reclaim ${topLoss.loss.toFixed(0)} marks`}
                            >
                                {taskAdded ? (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                        <span>Scheduled!</span>
                                    </>
                                ) : (
                                    <>
                                        <CalendarPlus className="w-3.5 h-3.5" />
                                        <span>Fix Top Loss ({topLoss.name.split(':')[0]})</span>
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => setIsSimulatorExpanded(prev => !prev)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition-colors flex items-center gap-1 border border-slate-700"
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Simulate</span>
                            {isSimulatorExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    </div>
                </div>

                {/* Interactive Error Recovery Simulator Drawer */}
                {isSimulatorExpanded && (
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 animate-fade-in text-xs">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                                Toggle Error Reasons to Simulate Incremental AIR Advancement:
                            </span>
                            {selectedRecoveries.size > 0 && (
                                <button
                                    onClick={() => setSelectedRecoveries(new Set())}
                                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                                >
                                    Reset Selection
                                </button>
                            )}
                        </div>

                        {/* Checkbox Chips */}
                        <div className="flex flex-wrap gap-1.5">
                            {deductionEntries.map(([reason, loss]) => {
                                const isSelected = selectedRecoveries.has(reason);
                                return (
                                    <button
                                        key={reason}
                                        onClick={() => toggleRecoveryReason(reason)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200 shadow-sm'
                                                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`}></span>
                                        <span>{reason}</span>
                                        <span className="font-mono font-bold text-rose-400">-{loss.toFixed(0)}m</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Simulation Output Banner */}
                        {selectedRecoveries.size > 0 && (
                            <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>
                                        Recovering <strong className="text-emerald-300 font-mono">+{rankProjections.simRecoveredMarks.toFixed(0)} marks</strong> raises score to <strong className="text-white font-mono">{rankProjections.simScore.toFixed(0)}</strong>, boosting projected rank to <strong className="text-emerald-400 font-mono">~{rankProjections.simAir.toLocaleString()}</strong> (<strong className="text-emerald-300 font-mono">+{rankProjections.simAirGain.toLocaleString()} ranks higher</strong>)!
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleScheduleSprint(Array.from(selectedRecoveries).join(', '), rankProjections.simRecoveredMarks)}
                                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 ml-2 transition-all shadow-sm"
                                >
                                    Schedule Sprint
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
