
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Maximize2, Minimize2, EyeOff, Move, Maximize, RotateCcw, Search, SlidersHorizontal, Sparkles, Check, ArrowUpDown } from 'lucide-react';
import type { QuestionLog, TestReport, PanicEvent, DependencyAlert, GuessStats } from '../types';
import { ErrorReason, QuestionStatus, QuestionType, TestType, TestSubType } from '../types';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart,
    Scatter, Label, Sector, Line, LabelList, Rectangle, AreaChart, Area, Sankey, ComposedChart, Brush, ZAxis
} from 'recharts';
import { getAIChiefAnalystSummary, generateVaccinePlan } from '../services/geminiService';
import { useRootCauseAnalytics } from '../hooks/useRootCauseAnalytics';
import CustomTooltip from './common/CustomTooltip';
import Modal from './common/Modal';
import { AnimatedTabs } from './ui/AnimatedTabs';
import { JEE_SYLLABUS, SUBJECT_COLORS } from '../constants';
import { DynamicKnowledgeGraph } from './visualizations/DynamicKnowledgeGraph';
import { WeakestTopicsChart } from './visualizations/WeakestTopicsChart';
import { ExecutiveBriefing } from './visualizations/ExecutiveBriefing';
import { LostMarksWaterfall } from './visualizations/LostMarksWaterfall';
import { getMarkingScheme } from '../utils/metrics';
import { Button } from './common/Button';
import { MarkdownRenderer } from './common/MarkdownRenderer';
import { DiagnosticWizardModal } from './rootcause/DiagnosticWizardModal';
import { WidgetInfoModal } from './common/WidgetInfoModal';
import { getWidgetHelpData } from '../constants/widgetHelpData';
import { useJeeStore } from '../store/useJeeStore';
import { RangeSlider } from './common/RangeSlider';

interface RootCauseProps {
  logs: QuestionLog[];
  reports: TestReport[];
  rootCauseFilter: { subject?: string | null };
  setRootCauseFilter: (filter: { subject?: string | null }) => void;
  apiKey: string;
  modelName?: string;
  onAddTask?: (task: { task: string; time: number; topic: string }) => void;
}

type WidgetId = 'conceptualKnowledgeGraph' | 'weakestTopics' | 'errorReason' | 'questionType' | 'scoreContribution' | 'lostMarksWaterfall' | 'metricScatterPlot' | 'errorTrend' | 'fatigueAnalysis' | 'errorFlowSankey' | 'paretoAnalysis' | 'errorReasonsBySubject' | 'speedVsAccuracy' | 'weakestTopics_full' | 'panicAnalysis' | 'guessingGame' | 'scoreSimulator' | 'dependencyAlerts' | 'recidivismTracker' | 'chapterErrorHeatmap';

interface WidgetLayout {
    id: WidgetId;
    visible: boolean;
    size: 'normal' | 'wide';
}

type ModalType = 'errorReasonDetail' | 'topicDetail' | 'widget' | 'simulator' | 'info';

interface ModalData {
    type: ModalType;
    title: string;
    widgetId?: WidgetId;
    drillDownKey?: string;
    simulatorData?: any;
    infoContent?: React.ReactNode;
}

const DEFAULT_ROOT_CAUSE_LAYOUT: WidgetLayout[] = [
    { id: 'recidivismTracker', visible: true, size: 'normal' },
    { id: 'chapterErrorHeatmap', visible: true, size: 'wide' },
    { id: 'scoreSimulator', visible: true, size: 'wide' },
    { id: 'panicAnalysis', visible: true, size: 'normal' },
    { id: 'dependencyAlerts', visible: true, size: 'normal' },
    { id: 'conceptualKnowledgeGraph', visible: true, size: 'wide' },
    { id: 'weakestTopics', visible: true, size: 'wide' },
    { id: 'lostMarksWaterfall', visible: true, size: 'wide' },
    { id: 'speedVsAccuracy', visible: true, size: 'wide' },
    { id: 'errorReasonsBySubject', visible: true, size: 'normal' },
    { id: 'metricScatterPlot', visible: true, size: 'normal' },
    { id: 'scoreContribution', visible: true, size: 'normal' },
    { id: 'errorFlowSankey', visible: true, size: 'wide' },
    { id: 'paretoAnalysis', visible: true, size: 'wide' },
    { id: 'errorTrend', visible: true, size: 'wide' },
    { id: 'fatigueAnalysis', visible: true, size: 'normal' },
    { id: 'errorReason', visible: true, size: 'normal' },
    { id: 'guessingGame', visible: true, size: 'normal' },
    { id: 'questionType', visible: false, size: 'normal' },
];

// ... (Colors and Chart Components omitted for brevity, identical to existing file)

const COLORS_PIE: Record<string, string> = {
    [ErrorReason.ConceptualGap]: '#FBBF24', // amber-400
    [ErrorReason.MisreadQuestion]: '#34D399', // emerald-400
    [ErrorReason.SillyMistake]: '#F87171', // red-400
    [ErrorReason.TimePressure]: '#818CF8', // indigo-400
    [ErrorReason.Guess]: '#A78BFA', // violet-400
};

// Pastel Palette for Waterfall
const PASTEL_COLORS: Record<string, string> = {
    [ErrorReason.SillyMistake]: '#fda4af', // rose-300
    [ErrorReason.ConceptualGap]: '#fcd34d', // amber-300
    [ErrorReason.TimePressure]: '#a5b4fc', // indigo-300
    [ErrorReason.MisreadQuestion]: '#fdba74', // orange-300
    [ErrorReason.Guess]: '#99f6e4', // teal-300
    'Unattempted': '#94a3b8', // slate-400
    'Partial Loss': '#f0abfc', // fuchsia-300
    'Actual': '#34d399', // emerald-400
    'Potential': '#64748b' // slate-500
};

// ... [Child Components (Charts) like ScoreContributionWidget, etc. remain unchanged]

const ScoreContributionWidget: React.FC<{ reports: TestReport[] }> = ({ reports }) => {
    const [localTestId, setLocalTestId] = useState('all');

    const data = useMemo(() => {
        let relevantReports = reports;
        if (localTestId !== 'all') {
            relevantReports = reports.filter(r => r.id === localTestId);
        }

        if (relevantReports.length === 0) return [];

        const totals = relevantReports.reduce((acc, r) => {
            acc.physics += r.physics.marks;
            acc.chemistry += r.chemistry.marks;
            acc.maths += r.maths.marks;
            return acc;
        }, { physics: 0, chemistry: 0, maths: 0 });

        const totalScore = totals.physics + totals.chemistry + totals.maths;
        if (totalScore === 0) return [];

        return [
            { name: 'Physics', value: totals.physics, percentage: ((totals.physics / totalScore) * 100).toFixed(1), color: SUBJECT_COLORS.physics },
            { name: 'Chemistry', value: totals.chemistry, percentage: ((totals.chemistry / totalScore) * 100).toFixed(1), color: SUBJECT_COLORS.chemistry },
            { name: 'Maths', value: totals.maths, percentage: ((totals.maths / totalScore) * 100).toFixed(1), color: SUBJECT_COLORS.maths },
        ];
    }, [reports, localTestId]);

    return (
        <div className="flex-grow flex flex-col h-full relative">
             <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                <select 
                    value={localTestId} 
                    onChange={e => setLocalTestId(e.target.value)} 
                    className="bg-slate-800/80 backdrop-blur-sm text-xs py-1 px-3 rounded-full border border-slate-600 text-center focus:ring-1 focus:ring-[rgb(var(--color-primary-rgb))] shadow-lg hover:bg-slate-700 transition-colors cursor-pointer max-w-[200px] truncate"
                    onClick={e => e.stopPropagation()}
                >
                    <option value="all">Avg (All Tests)</option>
                    {reports.map(r => <option key={r.id} value={r.id}>{r.testName}</option>).reverse()}
                </select>
            </div>
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="55%"
                            innerRadius="55%"
                            outerRadius="75%"
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <Label 
                                value={`${data.reduce((sum, item) => sum + item.value, 0).toFixed(0)}`} 
                                position="center" 
                                className="fill-white text-2xl font-bold" 
                            />
                             <Label 
                                value="Marks" 
                                position="center" 
                                dy={20}
                                className="fill-gray-400 text-xs" 
                            />
                        </Pie>
                        <Tooltip content={<CustomTooltip formatter={(value: number, name: string, props: any) => `${value} marks (${props.payload.percentage}%)`} />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ... [SpeedVsAccuracyWidget, MetricScatterWidget, ErrorReasonsBySubjectWidget, InteractiveSankeyNode, InteractiveSankeyLink, SankeyWidget, StatusBadge, PanicAnalysisWidget, GuessingWidget, ScoreSimulatorWidget, DependencyAlertsWidget, AIChiefAnalyst, ErrorReasonPieChart, LostMarksWaterfall, ChartCard, DrillDownModal are unchanged but re-included logic for brevity if needed]
// ... (For full file replacement, these components would need to be present)

const SpeedVsAccuracyWidget: React.FC<{ logs: QuestionLog[] }> = ({ logs }) => {
    const data = useMemo(() => {
        const topicStats = new Map<string, { correct: number, attempts: number, time: number }>();
        
        logs.forEach(log => {
            if (!log.topic || log.topic === 'N/A') return;
            const existing = topicStats.get(log.topic) || { correct: 0, attempts: 0, time: 0 };
            existing.attempts++;
            if (log.status === QuestionStatus.FullyCorrect) existing.correct++;
            const estimatedTime = log.timeSpent || (log.questionType.includes("Single Correct") ? 120 : 180); 
            existing.time += estimatedTime;
            topicStats.set(log.topic, existing);
        });

        return Array.from(topicStats.entries()).map(([topic, stats]) => ({
            topic,
            accuracy: (stats.correct / stats.attempts) * 100,
            avgTime: stats.time / stats.attempts,
            attempts: stats.attempts
        })).filter(d => d.attempts >= 2);
    }, [logs]);

    const avgAcc = data.reduce((acc, d) => acc + d.accuracy, 0) / (data.length || 1);
    const avgTime = data.reduce((acc, d) => acc + d.avgTime, 0) / (data.length || 1);

    return (
        <div className="flex-grow h-full flex flex-col">
            <div className="flex justify-between items-center px-4 text-xs text-gray-400">
                <div>X: Time Spent (s) | Y: Accuracy (%)</div>
                <div className="flex gap-2">
                    <span className="text-green-400">Top-Left: Mastery</span>
                    <span className="text-red-400">Bottom-Right: Gap</span>
                </div>
            </div>
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" dataKey="avgTime" name="Time" unit="s" stroke="#9CA3AF" domain={['auto', 'auto']} label={{ value: 'Avg Time (sec)', position: 'insideBottom', offset: -10, fill: '#9CA3AF', fontSize: 10 }}/>
                        <YAxis type="number" dataKey="accuracy" name="Accuracy" unit="%" stroke="#9CA3AF" domain={[0, 100]} label={{ value: 'Accuracy', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10 }}/>
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-slate-900/90 border border-slate-600 p-2 rounded shadow text-xs z-50">
                                        <p className="font-bold text-white">{d.topic}</p>
                                        <p>Accuracy: {d.accuracy.toFixed(1)}%</p>
                                        <p>Time: {d.avgTime.toFixed(0)}s</p>
                                        <p className="text-gray-400 mt-1">({d.attempts} attempts)</p>
                                    </div>
                                );
                            }
                            return null;
                        }}/>
                        <ReferenceLine x={avgTime} stroke="#64748B" strokeDasharray="3 3" />
                        <ReferenceLine y={avgAcc} stroke="#64748B" strokeDasharray="3 3" />
                        <Scatter name="Topics" data={data} fill="#8884d8">
                            {data.map((entry, index) => {
                                let fill = '#9CA3AF';
                                if (entry.accuracy > avgAcc && entry.avgTime < avgTime) fill = '#10B981';
                                else if (entry.accuracy > avgAcc && entry.avgTime >= avgTime) fill = '#FBBF24';
                                else if (entry.accuracy <= avgAcc && entry.avgTime < avgTime) fill = '#F87171';
                                else fill = '#EF4444';
                                return <Cell key={`cell-${index}`} fill={fill} />;
                            })}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const MetricScatterWidget: React.FC<{ reports: TestReport[] }> = ({ reports }) => {
    const [xAxis, setXAxis] = useState('accuracy');
    const [yAxis, setYAxis] = useState('marks');
    const [visibleSubjects, setVisibleSubjects] = useState<Set<string>>(new Set(['Physics', 'Chemistry', 'Maths']));

    const metrics = [
        { value: 'marks', label: 'Marks' },
        { value: 'rank', label: 'Rank' },
        { value: 'accuracy', label: 'Accuracy (%)' },
        { value: 'attemptRate', label: 'Attempt Rate (%)' },
        { value: 'negative', label: 'Negative Marks' },
        { value: 'cwRatio', label: 'Correct/Wrong Ratio' },
        { value: 'spaq', label: 'Score per Attempted Q' },
        { value: 'unattemptedPercent', label: 'Unattempted (%)' },
        { value: 'scorePotentialRealized', label: 'Score Potential Realized (%)' }
    ];

    const data = useMemo(() => {
        const points: any[] = [];
        reports.forEach(r => {
            ['physics', 'chemistry', 'maths'].forEach(subject => {
                // @ts-ignore
                const metricsData = r[`${subject}Metrics`];
                // @ts-ignore
                const rawData = r[subject];
                let xVal = 0, yVal = 0;
                const getValue = (metricKey: string) => {
                    if (metricKey === 'marks') return rawData.marks;
                    if (metricKey === 'rank') return rawData.rank;
                    if (metricKey === 'negative') return (rawData.wrong * -1);
                    return metricsData?.[metricKey] || 0;
                }
                xVal = getValue(xAxis);
                yVal = getValue(yAxis);
                const subjectCapitalized = subject.charAt(0).toUpperCase() + subject.slice(1);
                if (visibleSubjects.has(subjectCapitalized)) {
                    points.push({ x: xVal, y: yVal, subject: subjectCapitalized, test: r.testName });
                }
            });
        });
        return points;
    }, [reports, xAxis, yAxis, visibleSubjects]);

    const toggleSubject = (subject: string) => {
        setVisibleSubjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subject)) newSet.delete(subject); else newSet.add(subject);
            return newSet;
        });
    };

    const { trendData, correlation, physicsData, chemistryData, mathsData } = useMemo(() => {
        const physicsData = data.filter(d => d.subject === 'Physics');
        const chemistryData = data.filter(d => d.subject === 'Chemistry');
        const mathsData = data.filter(d => d.subject === 'Maths');

        if (data.length < 2) return { trendData: [], correlation: 0, physicsData, chemistryData, mathsData };
        const n = data.length;
        const sumX = data.reduce((a, b) => a + b.x, 0);
        const sumY = data.reduce((a, b) => a + b.y, 0);
        const sumXY = data.reduce((a, b) => a + b.x * b.y, 0);
        const sumXX = data.reduce((a, b) => a + b.x * b.x, 0);
        const sumYY = data.reduce((a, b) => a + b.y * b.y, 0);
        const denominatorSlope = (n * sumXX - sumX * sumX);
        if (denominatorSlope === 0) return { trendData: [], correlation: 0, physicsData, chemistryData, mathsData };
        const slope = (n * sumXY - sumX * sumY) / denominatorSlope;
        const intercept = (sumY - slope * sumX) / n;
        const minX = Math.min(...data.map(d => d.x));
        const maxX = Math.max(...data.map(d => d.x));
        const trendData = [{ x: minX, y: slope * minX + intercept }, { x: maxX, y: slope * maxX + intercept }];
        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        const correlation = denominator === 0 ? 0 : numerator / denominator;
        return { trendData, correlation, physicsData, chemistryData, mathsData };
    }, [data]);

    return (
        <div className="flex-grow flex flex-col h-full">
            <div className="flex flex-wrap justify-between items-center mb-2 gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-gray-200 max-w-[100px] truncate focus:ring-1 focus:ring-cyan-500">
                        {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <span className="text-gray-500 font-bold">vs</span>
                    <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-gray-200 max-w-[100px] truncate focus:ring-1 focus:ring-cyan-500">
                        {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                <div className="text-gray-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                    Corr: <span className={`font-bold ${Math.abs(correlation) > 0.7 ? 'text-green-400' : Math.abs(correlation) > 0.4 ? 'text-yellow-400' : 'text-gray-200'}`}>{correlation.toFixed(2)}</span>
                </div>
            </div>
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" dataKey="x" name={xAxis} stroke="#9CA3AF" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                        <YAxis type="number" dataKey="y" name={yAxis} stroke="#9CA3AF" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-slate-900 border border-slate-600 p-2 rounded shadow text-xs z-50">
                                        <p className="font-bold text-white">{d.test}</p>
                                        <p style={{ color: SUBJECT_COLORS[d.subject.toLowerCase()] }}>{d.subject}</p>
                                        <p>X: {d.x.toFixed(1)}</p>
                                        <p>Y: {d.y.toFixed(1)}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}/>
                        <Scatter name="Physics" data={physicsData} fill={SUBJECT_COLORS.physics} shape="circle" />
                        <Scatter name="Chemistry" data={chemistryData} fill={SUBJECT_COLORS.chemistry} shape="square" />
                        <Scatter name="Maths" data={mathsData} fill={SUBJECT_COLORS.maths} shape="triangle" />
                        {data.length > 1 && <Line dataKey="y" data={trendData} stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} name="Trend" isAnimationActive={false} />}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-2 mt-2 pb-1">
                {['Physics', 'Chemistry', 'Maths'].map(subject => {
                    const color = SUBJECT_COLORS[subject.toLowerCase()];
                    const isActive = visibleSubjects.has(subject);
                    return (
                        <button
                            key={subject}
                            onClick={() => toggleSubject(subject)}
                            className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border transition-all"
                            style={{ 
                                backgroundColor: isActive ? `${color}25` : '#1e293b', 
                                borderColor: isActive ? color : '#334155', 
                                color: isActive ? '#f8fafc' : '#64748b' 
                            }}
                        >
                            {subject}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const ErrorReasonsBySubjectWidget: React.FC<{ data: any[] }> = ({ data }) => {
    return (
        <div className="flex-grow h-full flex flex-col">
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={0} />
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                        <Bar dataKey="physics" name="Physics" stackId="a" fill={SUBJECT_COLORS.physics} barSize={30} />
                        <Bar dataKey="chemistry" name="Chemistry" stackId="a" fill={SUBJECT_COLORS.chemistry} barSize={30} />
                        <Bar dataKey="maths" name="Maths" stackId="a" fill={SUBJECT_COLORS.maths} barSize={30} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const InteractiveSankeyNode = (props: any) => {
    const { x, y, width, height, payload, containerWidth, setActiveNode } = props;
    const isLeft = x < containerWidth / 2;
    const isRight = x > containerWidth / 2;
    let fill = '#818CF8'; 
    if (payload.name === 'Physics') fill = SUBJECT_COLORS.physics;
    if (payload.name === 'Chemistry') fill = SUBJECT_COLORS.chemistry;
    if (payload.name === 'Maths') fill = SUBJECT_COLORS.maths;
    if (Object.values(ErrorReason).includes(payload.name as ErrorReason)) fill = COLORS_PIE[payload.name as keyof typeof COLORS_PIE] || '#F472B6';

    return (
        <g 
            onMouseEnter={() => setActiveNode(payload.name)} 
            onMouseLeave={() => setActiveNode(null)}
            style={{cursor: 'pointer'}}
        >
            <Rectangle x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.9} radius={[4, 4, 4, 4]} stroke="#fff" strokeWidth={1} />
            <text x={isLeft ? x + width + 6 : (isRight ? x - 6 : x + width / 2)} y={y + height / 2} dy="0.35em" textAnchor={isLeft ? "start" : (isRight ? "end" : "middle")} fontSize={10} fill="#fff" fontWeight="bold" style={{pointerEvents: 'none'}}>{payload.name}</text>
            <text x={isLeft ? x + width + 6 : (isRight ? x - 6 : x + width / 2)} y={y + height / 2 + 12} dy="0.35em" textAnchor={isLeft ? "start" : (isRight ? "end" : "middle")} fontSize={9} fill="#9CA3AF" style={{pointerEvents: 'none'}}>{payload.value} errors</text>
        </g>
    );
};

const InteractiveSankeyLink = (props: any) => {
    const { sourceX, sourceY, targetX, targetY, linkWidth, activeNode, payload } = props;
    const isActive = activeNode === payload.source.name || activeNode === payload.target.name;
    const opacity = activeNode ? (isActive ? 0.6 : 0.05) : 0.3; // Highlight or Dim
    
    const fill = props.payload.source.name === 'Physics' ? SUBJECT_COLORS.physics : props.payload.source.name === 'Chemistry' ? SUBJECT_COLORS.chemistry : props.payload.source.name === 'Maths' ? SUBJECT_COLORS.maths : '#64748B';
    
    return (
        <path 
            d={`M${sourceX},${sourceY} C${sourceX + linkWidth / 2},${sourceY} ${targetX - linkWidth / 2},${targetY} ${targetX},${targetY}`} 
            stroke={fill} 
            strokeWidth={Math.max(1, linkWidth)} 
            strokeOpacity={opacity} 
            fill="none" 
            style={{transition: 'stroke-opacity 0.3s ease'}}
        />
    );
};

const SankeyWidget: React.FC<{ data: any }> = ({ data }) => {
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState<number>(800);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            if (entries[0] && entries[0].contentRect) {
                setWidth(entries[0].contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="flex-grow h-full flex flex-col">
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    {data.nodes.length > 0 ? (
                        <Sankey
                            data={data}
                            node={<InteractiveSankeyNode containerWidth={width} setActiveNode={setActiveNode} />} 
                            link={<InteractiveSankeyLink activeNode={activeNode} />}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                            <Tooltip content={<CustomTooltip />} />
                        </Sankey>
                    ) : <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">Not enough data to map failure flows.</div>}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: QuestionStatus }> = ({ status }) => {
    const config = {
        [QuestionStatus.FullyCorrect]: { text: 'Fully Correct', color: 'bg-green-500/20 text-green-300' },
        [QuestionStatus.PartiallyCorrect]: { text: 'Partially Correct', color: 'bg-yellow-500/20 text-yellow-300' },
        [QuestionStatus.Wrong]: { text: 'Wrong', color: 'bg-red-500/20 text-red-300' },
        [QuestionStatus.Unanswered]: { text: 'Unanswered', color: 'bg-gray-500/20 text-gray-300' }
    };
    const { text, color } = config[status] || { text: status, color: 'bg-gray-600' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
};

const PanicAnalysisWidget: React.FC<{ events: PanicEvent[] }> = ({ events }) => {
    if (events.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">No panic cascades detected yet. Good composure!</div>;

    return (
        <div className="flex-grow h-full flex flex-col min-h-0">
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {events.map((event, idx) => (
                    <div key={idx} className="bg-red-900/20 border border-red-800/50 p-3 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-xs text-red-300 font-bold uppercase">{event.testName}</p>
                            <p className="text-sm text-white">Q.{event.startQuestion} - Q.{event.endQuestion}</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-black text-red-500">-{event.lostMarks}</span>
                            <span className="text-[10px] text-red-400">Panic Tax</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GuessingWidget: React.FC<{ stats: GuessStats }> = ({ stats }) => {
    // Intuition Data for Gauge
    const intuitionData = [
        { name: 'Intuition', value: stats.intuitionScore, fill: '#a855f7' }, // Purple
        { name: 'Gap', value: 100 - stats.intuitionScore, fill: '#334155' },
    ];

    return (
        <div className="flex-grow h-full flex flex-col justify-between">
            <div className="flex items-center justify-around h-1/2">
                {/* Metric 1: Net Impact */}
                <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Net Score Impact</p>
                    <p className={`text-4xl font-black ${stats.netScoreImpact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.netScoreImpact > 0 ? '+' : ''}{stats.netScoreImpact}
                    </p>
                </div>

                {/* Metric 2: Intuition Gauge */}
                <div className="relative w-24 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={intuitionData}
                                cx="50%" cy="50%"
                                innerRadius={28} outerRadius={40}
                                startAngle={90} endAngle={-270}
                                dataKey="value" stroke="none"
                            >
                                {intuitionData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-white">{stats.intuitionScore.toFixed(0)}%</span>
                        <span className="text-[8px] text-gray-400 uppercase">Intuition</span>
                    </div>
                </div>
            </div>

            {/* Risk Profile Bar */}
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <div className="flex justify-between text-[10px] text-gray-400 mb-2 uppercase font-bold tracking-wider">
                    <span>Risk Profile</span>
                    <span>Total Guesses: {stats.totalGuesses}</span>
                </div>
                
                <div className="flex h-4 rounded-full overflow-hidden mb-2">
                    {/* Safe Guesses */}
                    <div className="bg-emerald-500/80 h-full flex items-center justify-center text-[9px] text-white font-bold" style={{width: `${(stats.safeGuesses / (stats.totalGuesses || 1)) * 100}%`}} title="Safe Bets (No Negative Marking)">
                        {stats.safeGuesses > 0 && stats.safeGuesses}
                    </div>
                    {/* Risky Guesses */}
                    <div className="bg-amber-500/80 h-full flex items-center justify-center text-[9px] text-white font-bold" style={{width: `${(stats.riskyGuesses / (stats.totalGuesses || 1)) * 100}%`}} title="Risky Gambles (Negative Marking involved)">
                        {stats.riskyGuesses > 0 && stats.riskyGuesses}
                    </div>
                </div>
                
                <div className="flex justify-between text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500/80 rounded-full"></div>
                        <span className="text-gray-300">Safe Bets ({stats.safeGuesses})</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-500/80 rounded-full"></div>
                        <span className="text-gray-300">Risky Gambles ({stats.riskyGuesses})</span>
                    </div>
                </div>
                
                {stats.riskyMisses > 0 && (
                    <p className="text-[10px] text-red-400 mt-2 text-center">
                        ⚠ {stats.riskyMisses} risky gambles failed, causing negative marks.
                    </p>
                )}
            </div>
        </div>
    );
};

const ScoreSimulatorWidget: React.FC<{ initialScore: number, errorProfile: { name: string, value: number }[], logs: QuestionLog[], totalTests: number }> = ({ initialScore, errorProfile, logs, totalTests }) => {
    const [reduction, setReduction] = useState<Record<string, number>>({ 'Silly Mistake': 0, 'Conceptual Gap': 0, 'Time Pressure': 0 });
    const [examType, setExamType] = useState<'Mains' | 'Advanced'>('Mains');
    
    const avgAdvancedMarks = useMemo(() => {
        const correctLogs = logs.filter(l => l.marksAwarded > 0);
        if (correctLogs.length === 0) return 3.5; 
        
        const totalPositive = correctLogs.reduce((sum, l) => sum + l.marksAwarded, 0);
        return totalPositive / correctLogs.length;
    }, [logs]);

    const projectedGain = useMemo(() => {
        let gain = 0;
        const marksPerError = examType === 'Mains' ? 4 : avgAdvancedMarks;
        const testsCount = totalTests > 0 ? totalTests : 1;

        errorProfile.forEach(err => {
            const factor = (reduction[err.name] || 0) / 100;
            const avgErrorsPerTest = err.value / testsCount;
            gain += (avgErrorsPerTest * marksPerError) * factor; 
        });
        
        const maxPossibleScore = examType === 'Mains' ? 300 : 360; 
        const rawProjected = initialScore + gain;
        
        if (rawProjected > maxPossibleScore) {
            return Math.max(0, maxPossibleScore - initialScore);
        }

        return Math.round(gain);
    }, [reduction, errorProfile, examType, avgAdvancedMarks, totalTests, initialScore]);

    return (
        <div className="flex-grow flex flex-col h-full">
            <div className="flex justify-between items-start mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <div className="flex flex-col gap-2">
                    <div>
                        <p className="text-xs text-gray-400">Current Avg</p>
                        <p className="text-xl font-bold text-white">{Math.round(initialScore)}</p>
                    </div>
                    <div className="flex bg-slate-800 rounded p-0.5 border border-slate-600">
                        <button 
                            onClick={() => setExamType('Mains')} 
                            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${examType === 'Mains' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Mains (+4)
                        </button>
                        <button 
                            onClick={() => setExamType('Advanced')} 
                            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${examType === 'Advanced' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Adv (~{avgAdvancedMarks.toFixed(1)})
                        </button>
                    </div>
                </div>
                <div className="text-center self-center pt-4">
                    <span className="text-2xl text-gray-600">➜</span>
                </div>
                <div className="text-right">
                    <p className="text-xs text-green-400">Projected</p>
                    <p className="text-2xl font-bold text-green-400">{Math.round(initialScore + projectedGain)} <span className="text-sm text-green-600">(+{projectedGain})</span></p>
                </div>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                {errorProfile.slice(0, 3).map(err => (
                    <RangeSlider
                        key={err.name}
                        label={`Fix ${err.name}s`}
                        min={0}
                        max={100}
                        step={10}
                        unit="%"
                        value={reduction[err.name] || 0}
                        accentColor="cyan"
                        onChange={(val) => setReduction(prev => ({ ...prev, [err.name]: val }))}
                    />
                ))}
            </div>
        </div>
    );
};

const DependencyAlertsWidget: React.FC<{ alerts: DependencyAlert[] }> = ({ alerts }) => {
    if (alerts.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">No structural dependencies found.</div>;

    return (
        <div className="flex-grow h-full flex flex-col min-h-0">
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {alerts.map((alert, idx) => (
                    <div key={idx} className="bg-amber-900/20 border border-amber-700/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">⚠️</span>
                            <span className="text-xs text-amber-200 font-bold uppercase tracking-wider">Root Cause Detected</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-snug">
                            Failures in <strong className="text-white">{alert.topic}</strong> are likely caused by weakness in <strong className="text-amber-400 underline decoration-dotted">{alert.rootCauseTopic}</strong>.
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecidivismTrackerWidget: React.FC<{ logs: QuestionLog[] }> = ({ logs }) => {
    const chronicErrors = useMemo(() => {
        const counts: Record<string, { topic: string; code: string; count: number }> = {};
        logs.forEach(l => {
            if (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect) {
                const code = l.errorCode || 'E3';
                const key = `${l.topic}-${code}`;
                if (!counts[key]) counts[key] = { topic: l.topic, code, count: 0 };
                counts[key].count += 1;
            }
        });
        return Object.values(counts).filter(item => item.count >= 2).sort((a, b) => b.count - a.count);
    }, [logs]);

    return (
        <div className="flex-grow h-full flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-rose-400 font-extrabold uppercase tracking-wider">Chronic Errors: {chronicErrors.length}</span>
                <span className="text-[10px] text-gray-400 font-mono">≥ 2 Recurrences</span>
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {chronicErrors.map((item, idx) => (
                    <div key={idx} className="glass-panel p-2.5 rounded-lg flex items-center justify-between border-l-4 border-l-rose-500 text-xs">
                        <div>
                            <p className="font-bold text-white truncate max-w-[180px]">{item.topic}</p>
                            <p className="text-[10px] text-rose-300 font-mono">{item.code}</p>
                        </div>
                        <div className="text-right">
                            <span className="bg-rose-900/60 text-rose-200 border border-rose-700/50 px-2 py-0.5 rounded font-black text-xs">
                                {item.count}× Repeat
                            </span>
                        </div>
                    </div>
                ))}
                {chronicErrors.length === 0 && (
                    <div className="py-8 text-center text-gray-500 italic text-xs">No chronic error patterns detected.</div>
                )}
            </div>
        </div>
    );
};

const ChapterErrorHeatmapWidget: React.FC<{ logs: QuestionLog[] }> = ({ logs }) => {
    const eCodes = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'];
    
    const matrix = useMemo(() => {
        const counts: Record<string, Record<string, number>> = {};
        logs.forEach(l => {
            if (l.topic && (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect)) {
                const code = l.errorCode || 'E3';
                if (!counts[l.topic]) counts[l.topic] = {};
                counts[l.topic][code] = (counts[l.topic][code] || 0) + 1;
            }
        });
        return counts;
    }, [logs]);

    const topics = Object.keys(matrix).slice(0, 15); // Top 15 active topics

    return (
        <div className="flex-grow h-full flex flex-col overflow-x-auto min-h-0">
            <table className="w-full text-xs text-left">
                <thead>
                    <tr className="border-b border-slate-700 text-gray-400">
                        <th className="p-2">Chapter / Topic</th>
                        {eCodes.map(code => <th key={code} className="p-2 text-center">{code}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {topics.map(topic => (
                        <tr key={topic} className="hover:bg-slate-800/40">
                            <td className="p-2 text-gray-200 font-medium truncate max-w-[150px]">{topic}</td>
                            {eCodes.map(code => {
                                const count = matrix[topic]?.[code] || 0;
                                let bg = 'bg-slate-800/40 text-gray-600';
                                if (count >= 3) bg = 'bg-red-600 text-white font-bold';
                                else if (count === 2) bg = 'bg-amber-600/80 text-white';
                                else if (count === 1) bg = 'bg-yellow-900/40 text-yellow-300';
                                return (
                                    <td key={code} className={`p-2 text-center rounded ${bg}`}>
                                        {count > 0 ? count : '-'}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {topics.length === 0 && (
                        <tr>
                            <td colSpan={8} className="p-6 text-center text-gray-500 italic">No topic errors logged yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const AIChiefAnalyst: React.FC<{
  weakTopics: { topic: string; count: number }[];
  errorReasons: { name: string; value: number }[];
  correlationData: any;
  apiKey: string;
  model?: string;
  logs: QuestionLog[];
}> = ({ weakTopics, errorReasons, correlationData, apiKey, model, logs }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Record<string, string>>({});
  const [selectedHistory, setSelectedHistory] = useState<{ date: string, content: string } | null>(null);

  useEffect(() => {
      const savedHistory = localStorage.getItem('aiChiefAnalystHistory_v1');
      if (savedHistory) {
          try {
              setHistory(JSON.parse(savedHistory));
          } catch (e) {
              console.error("Failed to parse AI Chief Analyst history", e);
          }
      }
  }, []);

  const prevDataKeyRef = useRef('');
  useEffect(() => {
      const key = JSON.stringify({ weakTopics, errorReasons, correlationData });
      if (prevDataKeyRef.current !== key) {
          prevDataKeyRef.current = key;
          setSummary('');
          setError('');
          setIsLoading(false);
      }
  }, [weakTopics, errorReasons, correlationData]);

  const generateSummary = useCallback(async (improvise = false) => {
    setIsLoading(true);
    setError('');
    setSummary('');
    try {
      const result = await getAIChiefAnalystSummary(weakTopics, errorReasons, correlationData, apiKey, improvise, model);
      setSummary(result);
      
      const timestamp = new Date().toLocaleString();
      setHistory(prev => {
          const updated = { ...prev, [timestamp]: result };
          localStorage.setItem('aiChiefAnalystHistory_v1', JSON.stringify(updated));
          return updated;
      });
    } catch (e: any) {
      setError(e.message || 'Failed to generate summary.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, weakTopics, errorReasons, correlationData, model]);

    const [isGeneratingVaccine, setIsGeneratingVaccine] = useState(false);
    const [vaccinePlan, setVaccinePlan] = useState<string | null>(null);

    const generateVaccinePlanHandler = async () => {
        setIsGeneratingVaccine(true);
        try {
            const plan = await generateVaccinePlan(logs, apiKey, model);
            setVaccinePlan(plan);
        } catch (e) {
            console.error(e);
            setVaccinePlan("Failed to generate vaccination plan. Please try again.");
        } finally {
            setIsGeneratingVaccine(false);
        }
    };

  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex items-center gap-4 mb-4 border-b border-slate-700 pb-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-300 text-2xl border border-indigo-500/30 flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">💡</div>
        <div>
            <h3 className="text-xl font-bold text-white tracking-tight">AI Chief Analyst Report</h3>
            <p className="text-xs text-slate-400">Automated synthesis of your performance data.</p>
        </div>
      </div>
      
      <div className="min-h-[100px]">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 animate-pulse">
                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-sm text-indigo-300 font-medium">Synthesizing insights from your data...</p>
            </div>
        ) : error ? (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
                <strong className="block mb-1">Analysis Failed</strong>
                {error}
            </div>
        ) : summary ? (
            <div className="bg-slate-900/30 rounded-lg border border-slate-700/50 p-5">
                <MarkdownRenderer content={summary} />
            </div>
        ) : (
            <div className="text-center py-8 text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800 border-dashed">
                <p>Ready to analyze your weak topics and error patterns.</p>
            </div>
        )}

        {vaccinePlan && (
            <div className="mt-6 p-5 bg-emerald-900/20 border border-emerald-500/30 rounded-lg animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <span>🛡️</span> Error Vaccination Plan
                    </h4>
                    <button onClick={() => setVaccinePlan(null)} className="text-gray-500 hover:text-white">&times;</button>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none">
                    <MarkdownRenderer content={vaccinePlan} />
                </div>
            </div>
        )}
        
        {!isLoading && (
             <div className="mt-6 flex flex-wrap gap-3 justify-end">
                <button 
                    onClick={generateVaccinePlanHandler}
                    disabled={isGeneratingVaccine}
                    className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                    <span>🛡️</span> {isGeneratingVaccine ? 'Generating...' : 'Get Vaccination Plan'}
                </button>
                <button 
                    onClick={() => generateSummary(false)} 
                    disabled={isLoading} 
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                    <span>📊</span> {summary ? 'Re-run Analysis' : 'Run Full Analysis'}
                </button>
                 <button 
                    onClick={() => generateSummary(true)} 
                    disabled={isLoading} 
                    className="text-sm bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-5 rounded-lg transition-all border border-slate-600 flex items-center gap-2" 
                    title="Generate summary with a fresh, counter-intuitive perspective"
                >
                    <span>🎲</span> {summary ? 'Improvise' : 'Run & Improvise'}
                </button>
            </div>
        )}

        {Object.keys(history).length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-700/50">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Past Analyses</h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(history)
                        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                        .map(([date, content]) => (
                            <div 
                                key={date} 
                                onClick={() => setSelectedHistory({ date, content })}
                                className="bg-slate-800/40 hover:bg-slate-800 p-3 rounded-lg border border-slate-700/50 cursor-pointer transition-colors flex justify-between items-center group"
                            >
                                <span className="text-sm text-indigo-300 font-medium">{date}</span>
                                <span className="text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">View &rarr;</span>
                            </div>
                        ))
                    }
                </div>
            </div>
        )}
      </div>

      {selectedHistory && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <button onClick={() => setSelectedHistory(null)} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors">&larr; Back to List</button>
                          <h2 className="text-xl font-bold text-cyan-300">Analysis from {selectedHistory.date}</h2>
                      </div>
                      <button onClick={() => setSelectedHistory(null)} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                      <div className="bg-slate-900/30 rounded-lg border border-slate-700/50 p-5 markdown-body">
                          <MarkdownRenderer content={selectedHistory.content} />
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
        <g>
            <text x={cx} y={cy - 5} textAnchor="middle" fill="#E5E7EB" fontSize={16} fontWeight="bold">{payload.name}</text>
            <text x={cx} y={cy + 15} textAnchor="middle" fill="#9CA3AF" fontSize={14}>{value} count</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="#1f2937" strokeWidth={3} />
        </g>
    );
};

const ErrorReasonPieChart: React.FC<{ data: any[], totalErrors: number, onSliceClick: (name: string) => void }> = ({ data, totalErrors, onSliceClick }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const onPieEnter = useCallback((_: any, index: number) => { setActiveIndex(index); }, []);

    const PieComponent = Pie as any;
    return (
        <div className="flex-grow h-full flex flex-col">
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                        <PieComponent activeIndex={activeIndex} activeShape={renderActiveShape} data={data} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={'60%'} outerRadius={'80%'} onMouseEnter={onPieEnter} onClick={(d: any) => onSliceClick(d.name)} cursor="pointer" stroke="#1f2937" strokeWidth={2}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_PIE[entry.name as keyof typeof COLORS_PIE] || '#8884d8'} />)}
                        </PieComponent>
                        <Tooltip content={<CustomTooltip totalErrors={totalErrors}/>} />
                        <Legend iconType="square" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
        );
};



const ChartCard: React.FC<{ 
    title: React.ReactNode; 
    children: React.ReactNode; 
    isEditing?: boolean; 
    isDragging?: boolean; 
    onChartClick?: () => void; 
    actionButton?: React.ReactNode; 
    onInfoClick?: () => void; 
    headerControls?: React.ReactNode;
    onHide?: () => void;
    onResize?: () => void;
    className?: string;
}> = ({ title, children, isEditing, isDragging, onChartClick, actionButton, onInfoClick, headerControls, onHide, onResize, className }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`glass-card p-4 rounded-2xl flex flex-col h-full transition-all duration-300 relative border border-[var(--border-color)] ${
            isDragging ? 'opacity-50 ring-2 ring-cyan-500 shadow-2xl' : ''
        } ${
            !isEditing && onChartClick ? 'hover:border-cyan-500/40 hover:-translate-y-0.5 shadow-lg hover:shadow-cyan-950/30' : ''
        } ${isEditing ? 'ring-2 ring-dashed ring-cyan-500/60 bg-slate-900/80 cursor-move' : ''} ${className || ''}`}
        style={isDragging ? { boxShadow: '0 0 25px var(--accent-glow)' } : undefined}
    >
        {/* Editing Persistent Controls Bar */}
        {isEditing && (
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl mb-3 z-20 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold">
                    <Move className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Drag to move</span>
                </div>
                <div className="flex items-center gap-1">
                    {onResize && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onResize(); }} 
                            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" 
                            title="Toggle Size (Normal / Wide)"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onHide && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onHide(); }} 
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors" 
                            title="Hide Widget"
                        >
                            <EyeOff className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        )}

        <div className="flex justify-between items-start gap-2 mb-3">
            <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 tracking-tight">{title}</h3>
                {onInfoClick && !isEditing && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onInfoClick(); }} 
                        className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors" 
                        title="Widget Information"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                {headerControls && !isEditing && <div onClick={e => e.stopPropagation()}>{headerControls}</div>}
                {actionButton && !isEditing && <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>{actionButton}</div>}
                {onChartClick && !isEditing && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onChartClick(); }}
                        className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
                        title="Expand View"
                    >
                        <Maximize className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>

        <div className="flex-grow h-full relative min-h-0 flex flex-col" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </motion.div>
);

// Updated DrillDownModal with 5 Whys, Search, Column Sorting and Persistence
const DrillDownModal: React.FC<{ data: ModalData, logs: QuestionLog[], reports: TestReport[] }> = ({ data, logs, reports }) => {
    const { drillDownKey } = data;
    const [fiveWhysStep, setFiveWhysStep] = useState<number | null>(null);
    const [whyAnswers, setWhyAnswers] = useState<string[]>(Array(5).fill(''));
    const [currentAnswer, setCurrentAnswer] = useState<string>('');
    const [savedNotice, setSavedNotice] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortColumn, setSortColumn] = useState<string>('questionNumber');
    const [sortAsc, setSortAsc] = useState<boolean>(true);
    
    const relevantLogs = useMemo(() => {
        if (!drillDownKey) return [];
        let baseLogs: QuestionLog[] = [];
        if (data.type === 'errorReasonDetail') {
            baseLogs = logs.filter(log => log.reasonForError === drillDownKey);
        } else if (data.type === 'topicDetail') {
            baseLogs = logs.filter(log => log.topic === drillDownKey && (log.status === QuestionStatus.Wrong || log.status === QuestionStatus.PartiallyCorrect));
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            baseLogs = baseLogs.filter(l => 
                l.topic?.toLowerCase().includes(query) || 
                l.subject?.toLowerCase().includes(query) || 
                l.reasonForError?.toLowerCase().includes(query) ||
                l.questionNumber.toString().includes(query)
            );
        }

        return baseLogs.sort((a, b) => {
            let valA: any = a[sortColumn as keyof QuestionLog] || '';
            let valB: any = b[sortColumn as keyof QuestionLog] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });
    }, [drillDownKey, data.type, logs, searchQuery, sortColumn, sortAsc]);

    const handleFiveWhysStart = () => { setFiveWhysStep(1); setCurrentAnswer(''); };
    
    const handleNextWhy = () => {
        if (fiveWhysStep !== null && fiveWhysStep <= 5) {
            const updated = [...whyAnswers];
            updated[fiveWhysStep - 1] = currentAnswer;
            setWhyAnswers(updated);
            setCurrentAnswer(updated[fiveWhysStep] || '');
            setFiveWhysStep(fiveWhysStep + 1);
        }
    };

    const handleFinishWhy = () => {
        if (fiveWhysStep !== null) {
            const updated = [...whyAnswers];
            updated[fiveWhysStep - 1] = currentAnswer;
            setWhyAnswers(updated);
            
            try {
                const key = `fiveWhys_${drillDownKey}_${Date.now()}`;
                localStorage.setItem(key, JSON.stringify({ key: drillDownKey, timestamp: new Date().toISOString(), answers: updated }));
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 4000);
            } catch (e) {
                console.error("Failed to save 5 Whys analysis", e);
            }
            setFiveWhysStep(null);
        }
    };

    const getTestInfo = (testId: string) => {
        const report = reports.find(r => r.id === testId);
        return report ? { name: report.testName, date: report.testDate } : { name: testId, date: 'N/A' };
    };

    const handleSort = (col: string) => {
        if (sortColumn === col) {
            setSortAsc(!sortAsc);
        } else {
            setSortColumn(col);
            setSortAsc(true);
        }
    };

    const whys = [
        "Why did you make this mistake?",
        "Why did that happen?",
        "And why was that the case?",
        "What is the root cause of that?",
        "So, what is the fundamental action to fix this permanently?"
    ];

    return (
        <div className="flex flex-col h-full space-y-4">
            {savedNotice && (
                <div className="bg-emerald-950/90 border border-emerald-500/50 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-300 animate-slide-up-fade">
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Root Cause action plan saved to session memory!</span>
                    </div>
                </div>
            )}

            {data.type === 'errorReasonDetail' && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            5 Whys Root Cause Investigator
                        </h4>
                        <p className="text-xs text-slate-400">Drill down past symptoms to find the underlying issue.</p>
                    </div>
                    {!fiveWhysStep ? (
                        <Button variant="primary" size="sm" onClick={handleFiveWhysStart}>Start 5 Whys</Button>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => setFiveWhysStep(null)}>Close Investigator</Button>
                    )}
                </div>
            )}

            {fiveWhysStep && fiveWhysStep <= 5 && (
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-cyan-500/30 animate-scale-in">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-mono font-bold text-cyan-400">Step {fiveWhysStep} of 5</span>
                        <span className="text-[10px] text-slate-400">Deep Diagnostic</span>
                    </div>
                    <p className="text-sm text-slate-100 mb-4 font-semibold">{whys[fiveWhysStep - 1]}</p>
                    
                    <div className="space-y-3">
                        <textarea 
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs text-white h-20 focus:ring-2 focus:ring-cyan-500 outline-none" 
                            placeholder="Type your honest analysis..."
                        />
                        <div className="flex justify-end gap-2">
                            {fiveWhysStep < 5 ? (
                                <Button variant="primary" size="sm" onClick={handleNextWhy}>Next Why →</Button>
                            ) : (
                                <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={handleFinishWhy}>
                                    Finish & Save Action Plan
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter / Search Bar */}
            <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by topic, reason, question..."
                    className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-white px-2">Clear</button>
                )}
            </div>

            {/* Logs Table */}
            <div className="overflow-y-auto flex-grow rounded-xl border border-slate-800 custom-scrollbar">
                {relevantLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs italic">No matching question logs found.</div>
                ) : (
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-900/90 text-slate-300 font-semibold sticky top-0 border-b border-slate-800">
                            <tr>
                                <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('testId')}>
                                    <div className="flex items-center gap-1">Exam <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('questionNumber')}>
                                    <div className="flex items-center gap-1">Q.No <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('subject')}>
                                    <div className="flex items-center gap-1">Subject <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('topic')}>
                                    <div className="flex items-center gap-1">Topic <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th className="p-2.5">Error Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {relevantLogs.map((log, index) => {
                                const { name } = getTestInfo(log.testId);
                                return (
                                    <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-2.5 font-semibold text-cyan-300">{name}</td>
                                        <td className="p-2.5 font-mono">Q.{log.questionNumber}</td>
                                        <td className="p-2.5 capitalize">{log.subject}</td>
                                        <td className="p-2.5"><StatusBadge status={log.status} /></td>
                                        <td className="p-2.5 text-slate-200">{log.topic}</td>
                                        <td className="p-2.5 text-slate-300">{log.reasonForError || log.errorCode || 'N/A'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// --- Main RootCause Component ---

export const RootCause: React.FC<RootCauseProps> = ({ logs, reports, rootCauseFilter, setRootCauseFilter, apiKey, modelName, onAddTask }) => {
    const [viewMode, setViewMode] = useState<'dashboard' | 'briefing'>('dashboard');
    
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [selectedTest, setSelectedTest] = useState('all');
    const [modalData, setModalData] = useState<ModalData | null>(null);
    
    // Drag and Drop State
    const dragItem = useRef<WidgetId | null>(null);
    const dragOverItem = useRef<WidgetId | null>(null);
    const [draggingId, setDraggingId] = useState<WidgetId | null>(null);
    const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);
    
    const [qTypeMetric, setQTypeMetric] = useState<'errors' | 'totalAttempts' | 'errorRate' | 'avgMarks'>('errors');
    const [errorTrendMode, setErrorTrendMode] = useState<'absolute' | 'percent'>('percent');

    // Robust State Initialization
    const [layout, setLayout] = useState<WidgetLayout[]>(() => {
        try {
            const savedLayoutString = localStorage.getItem('rootCauseWidgetLayout_v7');
            if (savedLayoutString) {
                const parsedLayout = JSON.parse(savedLayoutString);
                if (Array.isArray(parsedLayout)) {
                    const savedIds = new Set(parsedLayout.map((w: any) => w.id));
                    
                    const validSavedLayout = parsedLayout
                        .filter((w: any) => DEFAULT_ROOT_CAUSE_LAYOUT.some(d => d.id === w.id))
                        .map((savedW: any) => {
                             const defaultW = DEFAULT_ROOT_CAUSE_LAYOUT.find(d => d.id === savedW.id);
                             return { ...defaultW, ...savedW };
                        });

                    const newWidgets = DEFAULT_ROOT_CAUSE_LAYOUT.filter(d => !savedIds.has(d.id));
                    
                    return [...validSavedLayout, ...newWidgets];
                }
            }
        } catch (e) { 
            console.error("Failed to load root cause layout", e); 
        }
        return DEFAULT_ROOT_CAUSE_LAYOUT;
    });
    
    const [isDiagnosticWizardOpen, setIsDiagnosticWizardOpen] = useState(false);
    const [activeWidgetHelpId, setActiveWidgetHelpId] = useState<string | null>(null);

    useEffect(() => { try { localStorage.setItem('rootCauseWidgetLayout_v7', JSON.stringify(layout)); } catch (e) { console.error("Failed to save layout to localStorage", e); } }, [layout]);

    // ... (Remaining component logic remains unchanged)
    // Re-declaring functions for context
    const openModal = (type: ModalType, title: string, drillDownKey?: string, widgetId?: WidgetId, simulatorData?: any, infoContent?: React.ReactNode) => {
        setModalData({ type, title, drillDownKey, widgetId, simulatorData, infoContent });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: WidgetId) => { dragItem.current = id; setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, id: WidgetId) => { if (dragItem.current !== id) { dragOverItem.current = id; setDragOverId(id); } };
    const handleDragEnd = () => {
        if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
            setLayout(prevLayout => {
                const newLayout = [...prevLayout];
                const dragItemIndex = newLayout.findIndex(w => w.id === dragItem.current);
                const dragOverItemIndex = newLayout.findIndex(w => w.id === dragOverItem.current);
                if (dragItemIndex === -1 || dragOverItemIndex === -1) return prevLayout;

                const dragItemContent = newLayout[dragItemIndex];
                newLayout.splice(dragItemIndex, 1);
                newLayout.splice(dragOverItemIndex, 0, dragItemContent);
                return newLayout;
            });
        }
        dragItem.current = null; dragOverItem.current = null; setDraggingId(null); setDragOverId(null);
    };
    
    const toggleWidgetVisibility = useCallback((widgetId: WidgetId, visible: boolean) => { setLayout(prevLayout => prevLayout.map(w => w.id === widgetId ? { ...w, visible } : w)); }, []);
    const handleToggleWidgetSize = useCallback((widgetId: WidgetId) => { setLayout(prevLayout => prevLayout.map(w => w.id === widgetId ? { ...w, size: w.size === 'normal' ? 'wide' : 'normal' } : w)); }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const subjectMatch = !rootCauseFilter.subject || log.subject === rootCauseFilter.subject;
            const testMatch = selectedTest === 'all' || log.testId === selectedTest;
            return subjectMatch && testMatch;
        });
    }, [logs, rootCauseFilter, selectedTest]);

    const filteredReportsForCharts = useMemo(() => {
        return reports.filter(report => selectedTest === 'all' || report.id === selectedTest);
    }, [reports, selectedTest]);

    const analysisData = useRootCauseAnalytics(filteredLogs, reports);
    
    const appearancePreferences = useJeeStore(state => state.appearancePreferences);
    const isLiteMode = Boolean(appearancePreferences?.liteMode);

    const WIDGETS = useMemo(() => {
        const widgets: Partial<Record<WidgetId, { title: React.ReactNode; component: React.ReactNode; actionButton?: React.ReactNode; info: React.ReactNode; headerControls?: React.ReactNode }>> = {
            conceptualKnowledgeGraph: {
                title: "Dynamic Knowledge Graph",
                info: "This graph dynamically maps your weak topics (glowing nodes) against the JEE syllabus dependencies. It uses a physics simulation to layout nodes. Pulse indicates high error count. Drag nodes to reorganize.",
                component: <DynamicKnowledgeGraph logs={filteredLogs} onNodeClick={(topic) => openModal('topicDetail', `Topic Details: ${topic}`, topic)} liteMode={isLiteMode} />
            },
            speedVsAccuracy: {
                title: "Speed vs. Accuracy Quadrant",
                info: "Analyze if you are rushing or struggling with concepts. Top-Left: Mastery (Fast & Accurate). Bottom-Right: Conceptual Gaps (Slow & Wrong). Top-Right: Needs Speed (Slow & Accurate). Bottom-Left: Careless/Guessing (Fast & Wrong).",
                component: <SpeedVsAccuracyWidget logs={filteredLogs} />
            },
            errorFlowSankey: {
                title: "Flow of Failure (Root Cause)",
                info: "A Sankey Diagram connecting Subject -> Weak Topics -> Error Reason. This reveals the 'Path of Failure'. For instance, if Physics flows heavily into 'Rotational Motion' and then 'Conceptual Gap', you know exactly where to focus. Hover on nodes to highlight paths.",
                component: <SankeyWidget data={analysisData.sankeyData} />
            },
            paretoAnalysis: {
                title: "80/20 Rule (Pareto)",
                info: "The Pareto Principle states that 80% of consequences come from 20% of causes. This chart shows your error count by topic (bars) and the cumulative impact (line). Fixing the few topics on the left will resolve the majority of your errors.",
                component: (
                    <div className="flex-grow h-full flex flex-col">
                        <div className="flex-grow min-h-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <ComposedChart data={analysisData.paretoData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="topic" angle={-45} textAnchor="end" interval={0} stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                                    <YAxis yAxisId="left" stroke="#9CA3AF" label={{ value: 'Error Count', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" unit="%" domain={[0, 100]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ bottom: 0 }} />
                                    <Bar yAxisId="left" dataKey="count" name="Errors" fill="#6366F1" barSize={20} />
                                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="Cumulative Impact" stroke="#10B981" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )
            },
            lostMarksWaterfall: {
                title: "Lost Marks Breakdown",
                info: "This waterfall chart visualizes the gap between your Potential Score (if all questions were correct) and your Actual Score. It breaks down exactly where you lost marks, sorted by biggest loss.",
                component: <LostMarksWaterfall logs={filteredLogs} reports={filteredReportsForCharts} onAddTask={onAddTask} />
            },
            weakestTopics: {
                title: "Weakest Topics Analysis",
                info: "This chart ranks topics by the total number of incorrect or partially correct questions. Click to see details.",
                component: <WeakestTopicsChart data={analysisData.weakestTopics} onClick={(data) => openModal('topicDetail', `Topic Details: ${data.topic}`, data.topic)} totalErrorCount={analysisData.totalErrors} logs={filteredLogs} fitContainer={true} />,
            },
            errorTrend: {
                title: "Error Evolution (Temporal)",
                info: "See how your error types change over time. Ideally, 'Conceptual Gaps' and 'Silly Mistakes' should shrink. A widening band indicates a worsening problem.",
                headerControls: (
                    <div className="flex bg-slate-700 rounded p-0.5 border border-slate-600 mr-2">
                        <button onClick={() => setErrorTrendMode('absolute')} className={`px-2 py-0.5 text-[10px] rounded ${errorTrendMode === 'absolute' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>Count</button>
                        <button onClick={() => setErrorTrendMode('percent')} className={`px-2 py-0.5 text-[10px] rounded ${errorTrendMode === 'percent' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>%</button>
                    </div>
                ),
                component: (
                    <div className="flex-grow h-full flex flex-col">
                        <div className="flex-grow min-h-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={analysisData.errorTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        {Object.keys(COLORS_PIE).map(reason => (
                                            <linearGradient key={reason} id={`color${reason.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS_PIE[reason]} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={COLORS_PIE[reason]} stopOpacity={0}/>
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <XAxis dataKey="date" stroke="#9CA3AF" tick={{fontSize: 10}} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                                    <YAxis stroke="#9CA3AF" unit={errorTrendMode === 'percent' ? '%' : ''} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                    {Object.keys(COLORS_PIE).map(reason => (
                                        <Area 
                                            key={reason}
                                            type="monotone" 
                                            dataKey={errorTrendMode === 'percent' ? `${reason}%` : reason} 
                                            name={reason}
                                            stackId="1" 
                                            stroke={COLORS_PIE[reason]} 
                                            fill={`url(#color${reason.replace(/\s/g, '')})`} 
                                        />
                                    ))}
                                    <Brush dataKey="date" height={30} stroke="#475569" fill="#1e293b" tickFormatter={() => ''} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )
            },
            fatigueAnalysis: {
                title: "Exam Fatigue Analysis",
                info: "Correlates question position (1-10, 11-20...) with Error Rate. A rising trend indicates fatigue or loss of focus towards the end of the paper.",
                component: (
                    <div className="flex-grow h-full flex flex-col">
                        <div className="flex-grow min-h-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <ComposedChart data={analysisData.fatigueData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="range" stroke="#9CA3AF" label={{ value: 'Question Range', position: 'insideBottom', offset: -10, fill: '#9CA3AF', fontSize: 10 }} />
                                <YAxis yAxisId="left" stroke="#F87171" unit="%" label={{ value: 'Error Rate', angle: -90, position: 'insideLeft', fill: '#F87171' }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" label={{ value: 'Attempts', angle: 90, position: 'insideRight', fill: '#6B7280' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar yAxisId="right" dataKey="attempts" name="Attempts" fill="#374151" barSize={20} />
                                <Line yAxisId="left" type="monotone" dataKey="errorRate" name="Error Rate" stroke="#F87171" strokeWidth={3} dot={{r: 4, fill: '#F87171'}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                        </div>
                    </div>
                )
            },
            errorReason: {
                title: "Error Reason Distribution",
                info: "This pie chart shows the breakdown of why you are making mistakes (e.g., conceptual gaps, silly mistakes). Understanding this helps you focus on strategy (e.g., more careful work) vs. just studying more.",
                component: <ErrorReasonPieChart data={analysisData.errorReasonDistribution} totalErrors={analysisData.totalErrors} onSliceClick={(name) => openModal('errorReasonDetail', `Error Reason: ${name}`, name)} />,
                actionButton: <button onClick={() => openModal('simulator', 'Performance Simulator', undefined, undefined, {type: 'reason', data: analysisData.errorReasonDistribution})} className="text-xs bg-indigo-600/50 hover:bg-indigo-600 text-white font-semibold py-1 px-3 rounded-full transition-colors">Simulate</button>
            },
            metricScatterPlot: { 
                title: "Metric Scatter Plot",
                info: "Compare any two metrics for every subject in every test. Helps identify correlations (e.g., does higher attempt rate lead to lower accuracy?).",
                component: <MetricScatterWidget reports={reports} />
            },
            questionType: {
                title: "Performance by Question Type",
                info: "This chart analyzes your performance based on the type of question (e.g., Single Correct, Integer).",
                headerControls: (
                    <select 
                        value={qTypeMetric} 
                        onChange={(e) => setQTypeMetric(e.target.value as any)} 
                        className="bg-slate-700 text-xs p-1 rounded border border-slate-600 focus:ring-1 focus:ring-cyan-500"
                        onClick={e => e.stopPropagation()}
                    >
                        <option value="errors">Error Count</option>
                        <option value="totalAttempts">Total Attempts</option>
                        <option value="errorRate">Error Rate (%)</option>
                        <option value="avgMarks">Average Marks</option>
                    </select>
                ),
                component: (
                     <div className="flex-grow flex flex-col h-full">
                         <div className="flex-grow min-h-0">
                             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <BarChart data={analysisData.performanceByQuestionType} margin={{ top: 5, right: 20, left: -10, bottom: 50 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="name" stroke="#9CA3AF" angle={-40} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }}/>
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey={qTypeMetric} fill={qTypeMetric === 'errorRate' ? '#EF4444' : qTypeMetric === 'avgMarks' ? '#10B981' : '#FBBF24'} />
                                    </BarChart>
                                </ResponsiveContainer>
                        </div>
                    </div>
                ),
            },
            scoreContribution: {
                title: "Score Contribution by %",
                info: "Shows the percentage of total marks contributed by each subject. Useful to see if you are over-relying on one strong subject.",
                component: <ScoreContributionWidget reports={reports} />,
            },
            errorReasonsBySubject: {
                title: "Error Reasons by Subject",
                info: "A stacked column chart showing the breakdown of error reasons for each subject. Helps identify if certain subjects are more prone to specific types of errors (e.g., Calculation errors in Maths vs Conceptual in Physics).",
                component: <ErrorReasonsBySubjectWidget data={analysisData.flippedStackedErrorData} />
            },
            // --- NEW WIDGETS ---
            panicAnalysis: {
                title: "Panic Cascades (Death Spirals)",
                info: "Detects sequences where you got 3+ questions wrong/unanswered in a row. These 'spirals' indicate psychological panic or stamina loss.",
                component: <PanicAnalysisWidget events={analysisData.panicEvents} />
            },
            guessingGame: {
                title: "Guessing Efficiency",
                info: "Analyzes your 'Luck vs. Intuition'. 'Safe Bets' are guesses on questions with no negative marking (like Integers). 'Risky Gambles' are guesses that can hurt your score. High Intuition means your gut feeling is often right.",
                component: <GuessingWidget stats={analysisData.guessStats} />
            },
            scoreSimulator: {
                title: "Bayesian Score Simulator",
                info: "An interactive 'What-If' engine. Adjust the sliders to see how reducing specific error types (like Silly Mistakes) would improve your average score. Toggles for Mains (+4) vs Advanced (+3) assumptions.",
                component: <ScoreSimulatorWidget initialScore={reports.length > 0 ? reports.reduce((a,b)=>a+b.total.marks,0)/reports.length : 0} errorProfile={analysisData.errorReasonDistribution} logs={filteredLogs} totalTests={reports.length} />
            },
            dependencyAlerts: {
                title: "Dependency Alerts",
                info: "Uses graph theory to find hidden root causes. It flags weak topics whose prerequisites are also weak (e.g., failing Rotational Motion due to weak Vectors).",
                component: <DependencyAlertsWidget alerts={analysisData.dependencyAlerts} />
            },
            recidivismTracker: {
                title: "Error Recidivism Tracker",
                info: "Tracks concepts where the same error code occurs 3 or more times. Shows chronic error counts and status.",
                component: <RecidivismTrackerWidget logs={filteredLogs} />
            },
            chapterErrorHeatmap: {
                title: "Chapter Error Heatmap (60 Chapters × E1-E7)",
                info: "Heatmap grid mapping syllabus chapters against E1-E7 error taxonomy codes. Darker intensity indicates higher error frequency.",
                component: <ChapterErrorHeatmapWidget logs={filteredLogs} />
            }
        };

        return widgets;
    }, [filteredLogs, filteredReportsForCharts, analysisData, qTypeMetric, errorTrendMode, reports, isLiteMode]);

    const hiddenWidgets = DEFAULT_ROOT_CAUSE_LAYOUT.filter(w => !layout.find(l => l.id === w.id)?.visible);

    const handleResetLayout = () => {
        setLayout(DEFAULT_ROOT_CAUSE_LAYOUT);
        try {
            localStorage.removeItem('rootCauseWidgetLayout_v7');
        } catch (e) {
            console.error(e);
        }
    };

    const subjectTabs = useMemo(() => [
        { id: '', label: 'All Subjects' },
        { id: 'physics', label: 'Physics' },
        { id: 'chemistry', label: 'Chemistry' },
        { id: 'maths', label: 'Maths' },
    ], []);

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Controls Bar */}
            <div className="flex justify-between items-center flex-wrap gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <span>Root Cause Analysis</span>
                    </h2>
                    <p className="text-xs text-slate-400">Identify cognitive & operational failure points across exam reports.</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    {/* View Mode Toggle with Motion Indicator */}
                    <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex relative">
                        <button 
                            onClick={() => setViewMode('dashboard')}
                            className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 z-10 ${
                                viewMode === 'dashboard' ? 'text-cyan-200' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {viewMode === 'dashboard' && (
                                <motion.div
                                    layoutId="viewModeIndicator"
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-950 to-indigo-950 border border-cyan-500/40 rounded-lg -z-10 shadow-lg shadow-cyan-950/50"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span>📊</span> Analytics
                        </button>
                        <button 
                            onClick={() => setViewMode('briefing')}
                            className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 z-10 ${
                                viewMode === 'briefing' ? 'text-cyan-200' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {viewMode === 'briefing' && (
                                <motion.div
                                    layoutId="viewModeIndicator"
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-950 to-indigo-950 border border-cyan-500/40 rounded-lg -z-10 shadow-lg shadow-cyan-950/50"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span>🎬</span> Briefing
                        </button>
                    </div>

                    {/* Test Selector */}
                    <div className="flex items-center gap-2">
                        <select 
                            value={selectedTest} 
                            onChange={e => setSelectedTest(e.target.value)} 
                            className="bg-slate-900 text-xs text-slate-200 p-2 rounded-xl border border-slate-700/80 focus:ring-1 focus:ring-cyan-500 outline-none max-w-[160px] truncate cursor-pointer shadow-md"
                        >
                            <option value="all">All Tests ({reports.length})</option>
                            {reports.map(r => <option key={r.id} value={r.id}>{r.testName}</option>).reverse()}
                        </select>
                    </div>

                    {/* Subject Selector Tabs */}
                    <AnimatedTabs
                        tabs={subjectTabs}
                        activeTab={rootCauseFilter.subject || ''}
                        onChange={(id) => setRootCauseFilter({ subject: id || null })}
                    />

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsDiagnosticWizardOpen(true)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold shadow-lg shadow-cyan-950/40"
                    >
                        <span>🔍</span>
                        <span>Diagnose My Problem</span>
                    </Button>

                    {viewMode === 'dashboard' && (
                        <div className="flex items-center gap-2">
                            {isCustomizing && (
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={handleResetLayout}
                                    className="flex items-center gap-1.5 text-slate-300 hover:text-white"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Layout</span>
                                </Button>
                            )}
                            <Button 
                                variant={isCustomizing ? 'primary' : 'secondary'} 
                                size="sm" 
                                onClick={() => setIsCustomizing(!isCustomizing)}
                                className="flex items-center gap-1.5"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>{isCustomizing ? 'Done' : 'Customize Grid'}</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <DiagnosticWizardModal 
                isOpen={isDiagnosticWizardOpen} 
                onClose={() => setIsDiagnosticWizardOpen(false)} 
                onAddTask={onAddTask}
            />

            {viewMode === 'briefing' ? (
                <ExecutiveBriefing reports={filteredReportsForCharts} logs={filteredLogs} />
            ) : (
                <>
                    <AIChiefAnalyst
                        weakTopics={analysisData.weakestTopics}
                        errorReasons={analysisData.errorReasonDistribution}
                        correlationData={{ data: [] }}
                        apiKey={apiKey}
                        model={modelName}
                        logs={filteredLogs}
                    />
                    
                    <div className="flex gap-6 relative">
                        <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-[28rem]" onDragOver={(e) => e.preventDefault()}>
                            {layout.filter(w => w.visible).map((widget) => {
                                const widgetConfig = WIDGETS[widget.id];
                                if (!widgetConfig) return null;
                                const isDraggable = isCustomizing;
                                const isDragOver = dragOverId === widget.id && draggingId && draggingId !== widget.id;
                                
                                const targetWidgetId = widget.id === 'weakestTopics' ? 'weakestTopics_full' : widget.id;

                                return (
                                    <div 
                                        key={widget.id} 
                                        className={`${widget.size === 'wide' ? 'lg:col-span-2' : ''} h-[28rem] transition-all ${
                                            isDraggable ? 'cursor-move' : ''
                                        } ${isDragOver ? 'ring-2 ring-cyan-500 border-dashed rounded-2xl bg-cyan-950/20' : ''}`} 
                                        draggable={isDraggable} 
                                        onDragStart={(e) => handleDragStart(e, widget.id)} 
                                        onDragEnter={(e) => handleDragEnter(e, widget.id)} 
                                        onDragEnd={handleDragEnd} 
                                        onDragLeave={() => setDragOverId(null)}
                                    >
                                        <ChartCard 
                                            title={widgetConfig.title} 
                                            isEditing={isCustomizing} 
                                            isDragging={draggingId === widget.id} 
                                            onChartClick={() => openModal('widget', typeof widgetConfig.title === 'string' ? widgetConfig.title : 'Expanded View', undefined, targetWidgetId)} 
                                            actionButton={widgetConfig.actionButton} 
                                            onInfoClick={() => setActiveWidgetHelpId(widget.id)}
                                            headerControls={widgetConfig.headerControls}
                                            onHide={() => toggleWidgetVisibility(widget.id, false)}
                                            onResize={() => handleToggleWidgetSize(widget.id)}
                                        >
                                            {widgetConfig.component}
                                        </ChartCard>
                                    </div>
                                );
                            })}
                        </main>
                        
                        {/* Hidden Widgets Drawer Sidebar */}
                        <AnimatePresence>
                            {isCustomizing && (
                                 <motion.aside 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="hidden lg:block w-72 flex-shrink-0 sticky top-6 h-fit z-20"
                                >
                                     <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl">
                                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Hidden Widgets</h3>
                                            <span className="text-xs font-mono text-cyan-400 font-bold">{hiddenWidgets.length}</span>
                                        </div>
                                        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                            {hiddenWidgets.length === 0 ? (
                                                <p className="text-xs text-slate-500 text-center italic py-4">All dashboard widgets visible</p>
                                            ) : null}
                                            {hiddenWidgets.map(defaultWidget => {
                                                const widgetConfig = WIDGETS[defaultWidget.id];
                                                return (
                                                    <div key={defaultWidget.id} className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-sm text-xs">
                                                        <span className="text-slate-300 font-semibold truncate max-w-[150px]">
                                                            {typeof widgetConfig?.title === 'string' ? widgetConfig.title : 'Widget'}
                                                        </span>
                                                        <Button variant="secondary" size="sm" onClick={() => toggleWidgetVisibility(defaultWidget.id, true)}>
                                                            Show
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                     <div className="mt-3 p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40 text-xs text-cyan-200">
                                        <p className="flex items-start gap-2">
                                            <span className="text-sm">💡</span>
                                            <span>Drag widgets to rearrange layout. Use controls in widget headers to resize or hide cards.</span>
                                        </p>
                                    </div>
                                </motion.aside>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
            
            {/* Modal Handler */}
            {modalData && (
                <Modal 
                    isOpen={!!modalData} 
                    onClose={() => setModalData(null)} 
                    title={modalData.title}
                    isInfo={modalData.type === 'info'}
                >
                    {modalData.type === 'errorReasonDetail' || modalData.type === 'topicDetail' ? (
                        <DrillDownModal data={modalData} logs={filteredLogs} reports={reports} />
                    ) : modalData.type === 'info' ? (
                        <div className="text-xs text-slate-300 leading-relaxed p-1">{modalData.infoContent}</div>
                    ) : modalData.type === 'simulator' ? (
                        <div className="p-2">
                            <ScoreSimulatorWidget 
                                initialScore={reports.length > 0 ? reports.reduce((a,b)=>a+b.total.marks,0)/reports.length : 0} 
                                errorProfile={analysisData.errorReasonDistribution} 
                                logs={filteredLogs} 
                                totalTests={reports.length} 
                            />
                        </div>
                    ) : modalData.widgetId ? (
                        <div className="flex-grow h-full w-full p-2 flex flex-col min-h-0 min-h-[450px]">
                            {modalData.widgetId === 'weakestTopics_full' ? (
                                <WeakestTopicsChart data={analysisData.weakestTopics} onClick={(data) => openModal('topicDetail', `Topic Details: ${data.topic}`, data.topic)} totalErrorCount={analysisData.totalErrors} logs={filteredLogs} fitContainer={false} />
                            ) : (
                                WIDGETS[modalData.widgetId]?.component
                            )}
                        </div>
                    ) : null}
                </Modal>
            )}

            {activeWidgetHelpId && (
                <WidgetInfoModal 
                    isOpen={Boolean(activeWidgetHelpId)} 
                    onClose={() => setActiveWidgetHelpId(null)} 
                    data={getWidgetHelpData(activeWidgetHelpId, typeof WIDGETS[activeWidgetHelpId]?.title === 'string' ? WIDGETS[activeWidgetHelpId]?.title as string : undefined, WIDGETS[activeWidgetHelpId]?.info)} 
                />
            )}
        </div>
    );
};
