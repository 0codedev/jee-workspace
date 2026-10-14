import React, { useState, useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { QuestionLog, QuestionStatus } from '../../types';
import { SUBJECT_COLORS } from '../../constants';
import { Sparkles } from 'lucide-react';

interface WeakestTopicsChartProps {
    data?: { topic: string; count: number; subject: string }[];
    onClick: (topic: any) => void;
    totalErrorCount?: number;
    logs: QuestionLog[];
    fitContainer?: boolean;
}

const getBarColor = (subject: string) => {
    const sub = subject.toLowerCase();
    if (sub === 'physics') return '#6366f1';
    if (sub === 'chemistry') return '#10b981';
    if (sub === 'maths') return '#f43f5e';
    return '#06b6d4';
};

export const WeakestTopicsChart: React.FC<WeakestTopicsChartProps> = ({ onClick, logs, fitContainer = false }) => {
    const [metric, setMetric] = useState<'count' | 'accuracy' | 'avgMarks'>('count');
    const [subjectFilter, setSubjectFilter] = useState<'All' | 'Physics' | 'Chemistry' | 'Maths'>('All');

    const processedData = useMemo(() => {
        const effectiveSubjectFilter = fitContainer ? 'All' : subjectFilter;

        const topicLogsMap = new Map<string, QuestionLog[]>();
        logs.forEach(l => {
            if (l.topic && l.topic !== 'N/A') {
                let arr = topicLogsMap.get(l.topic);
                if (!arr) {
                    arr = [];
                    topicLogsMap.set(l.topic, arr);
                }
                arr.push(l);
            }
        });
        
        let stats = Array.from(topicLogsMap.entries()).map(([topic, topicLogs]) => {
            const attempts = topicLogs.length;
            let errors = 0;
            let correct = 0;
            let marks = 0;
            let subjectStr = 'Unknown';

            topicLogs.forEach(l => {
                if (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect) errors++;
                if (l.status === QuestionStatus.FullyCorrect) correct++;
                marks += l.marksAwarded;
                if (l.subject && subjectStr === 'Unknown') {
                    subjectStr = l.subject.charAt(0).toUpperCase() + l.subject.slice(1);
                }
            });

            const accuracy = attempts > 0 ? (correct / attempts) * 100 : 0;
            const avgMarks = attempts > 0 ? marks / attempts : 0;

            const sortedLogs = topicLogs.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            const recentLogs = sortedLogs.slice(0, 5);
            let recentErrors = 0;
            recentLogs.forEach(l => {
                if (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect) recentErrors++;
            });
            const trend = recentLogs.length > 0 ? (recentErrors > recentLogs.length / 2 ? 'worsening' : 'improving') : 'stable';
            
            return { topic, count: errors, attempts, accuracy, avgMarks, totalMarks: marks, subject: subjectStr, trend, recentLogsCount: recentLogs.length };
        });
        
        if (effectiveSubjectFilter !== 'All') {
            stats = stats.filter(s => s.subject.toLowerCase() === effectiveSubjectFilter.toLowerCase());
        }

        const sorted = stats.sort((a, b) => {
            if (metric === 'count') return b.count - a.count;
            if (metric === 'accuracy') {
                if (a.accuracy === b.accuracy) return b.count - a.count;
                return a.accuracy - b.accuracy;
            }
            if (metric === 'avgMarks') return a.avgMarks - b.avgMarks;
            return 0;
        });

        if (fitContainer) {
            return sorted.slice(0, 10);
        }
        return sorted;
    }, [logs, metric, fitContainer, subjectFilter]);

    const currentMetricLabel = useMemo(() => {
        if (metric === 'count') return 'Error Count';
        if (metric === 'accuracy') return 'Accuracy (%)';
        if (metric === 'avgMarks') return 'Avg Marks';
        return 'Value';
    }, [metric]);

    const chartHeight = fitContainer ? '100%' : Math.max(processedData.length * 42, 400);

    return (
        <div className="flex-grow h-full flex flex-col min-h-0">
            {/* Header Controls */}
            <div className="flex flex-wrap justify-between items-center mb-3 gap-2 px-1 pt-1 shrink-0">
                 {!fitContainer && (
                     <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
                        {['All', 'Physics', 'Chemistry', 'Maths'].map(sub => (
                            <button 
                                key={sub}
                                onClick={() => setSubjectFilter(sub as any)}
                                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                                    subjectFilter === sub 
                                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                            >
                                {sub}
                            </button>
                        ))}
                     </div>
                 )}

                 {/* Metric Pill Selector */}
                 <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 backdrop-blur-md ml-auto">
                    <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider">Metric</span>
                    {[
                        { id: 'count', label: 'Errors' },
                        { id: 'accuracy', label: 'Accuracy' },
                        { id: 'avgMarks', label: 'Avg Marks' }
                    ].map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMetric(m.id as any)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                metric === m.id 
                                    ? 'bg-cyan-600 text-white shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Chart Area or Empty State */}
            {processedData.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                    <Sparkles className="w-8 h-8 text-cyan-400 mb-2 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-300">No Weak Topics Logged</p>
                    <p className="text-xs text-slate-500 mt-1">Keep attempting test questions to view topic diagnostics.</p>
                </div>
            ) : (
                <div className={`flex-grow min-h-0 ${fitContainer ? 'overflow-hidden' : 'overflow-y-auto pr-2 custom-scrollbar'}`}>
                    <div style={{ height: chartHeight, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart 
                                layout="vertical" 
                                data={processedData} 
                                margin={{ top: 5, right: 45, left: 10, bottom: 5 }}
                                barCategoryGap={fitContainer ? 4 : 10}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} vertical={true} />
                                <XAxis type="number" stroke="#64748b" hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="topic" 
                                    stroke="#94a3b8" 
                                    tick={{ fontSize: 11, fill: '#f8fafc', fontWeight: 500 }} 
                                    width={160} 
                                    interval={0}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} 
                                    content={({ active, payload }) => { 
                                        if (active && payload && payload.length) { 
                                            const d = payload[0].payload; 
                                            const color = getBarColor(d.subject);
                                            return ( 
                                                <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl text-xs z-50 backdrop-blur-md min-w-[200px]"> 
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="font-bold text-white text-sm">{d.topic}</p>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}25`, color }}>
                                                            {d.subject}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 mt-2 text-slate-300">
                                                        <p className="text-cyan-300 flex justify-between gap-4">
                                                            <span>{currentMetricLabel}:</span> 
                                                            <span className="font-mono font-bold">{typeof d[metric] === 'number' ? d[metric].toFixed(1) : d[metric]}</span>
                                                        </p>
                                                        {metric !== 'avgMarks' && <p className="flex justify-between gap-4 text-slate-400"><span>Avg Marks:</span> <span className="font-mono">{d.avgMarks.toFixed(1)}</span></p>}
                                                        {metric !== 'accuracy' && <p className="flex justify-between gap-4 text-slate-400"><span>Accuracy:</span> <span className="font-mono">{d.accuracy.toFixed(1)}%</span></p>}
                                                        {metric !== 'count' && <p className="flex justify-between gap-4 text-slate-400"><span>Errors:</span> <span className="font-mono">{d.count}</span></p>}
                                                        <p className="flex justify-between gap-4 text-slate-400"><span>Attempts:</span> <span className="font-mono">{d.attempts}</span></p>
                                                    </div>
                                                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                                                        <span className="text-slate-400">Recent Trend:</span>
                                                        <span className={`font-semibold uppercase tracking-wider ${d.trend === 'worsening' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                            {d.trend === 'worsening' ? '⚠️ High Error Rate' : '✓ Improving'}
                                                        </span>
                                                    </div>
                                                </div> 
                                            ); 
                                        } 
                                        return null; 
                                    }} 
                                />
                                <Bar 
                                    dataKey={metric} 
                                    radius={[0, 6, 6, 0]} 
                                    onClick={(d) => onClick(d)} 
                                    cursor="pointer" 
                                    barSize={fitContainer ? undefined : 22}
                                    isAnimationActive={true}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                >
                                    {processedData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={getBarColor(entry.subject)} 
                                            className="hover:opacity-85 transition-opacity"
                                        />
                                    ))}
                                    <LabelList 
                                        dataKey={metric} 
                                        position="right" 
                                        fill="#e2e8f0" 
                                        fontSize={11} 
                                        fontWeight={600}
                                        formatter={(val: number) => typeof val === 'number' ? val.toFixed(metric === 'count' ? 0 : 1) : val} 
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};