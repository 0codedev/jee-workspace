
import React, { useMemo, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import type { TestReport } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, ScatterChart, Scatter, Cell, LabelList } from 'recharts';
import { SUBJECT_CONFIG } from '../constants';
import { getPercentileFromScore, getMonthAdjustedScore } from '../utils/ntaData';
import Modal from './common/Modal';
import CustomTooltip from './common/CustomTooltip';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Select } from './common/Select';
import { WidgetInfoModal } from './common/WidgetInfoModal';
import { getWidgetHelpData } from '../constants/widgetHelpData';

interface DeepAnalysisProps {
  reports: TestReport[];
}

interface OverlayConfig {
  trendline: boolean;
  movingAverage: boolean;
  bollingerBands: boolean;
}

const getTrendlineCalculator = (data: { x: number; y: number }[]) => {
    if (data.length < 2) return (_: number) => null;
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const point of data) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    if (isNaN(slope) || isNaN(intercept)) return (_: number) => null;
    return (x: number) => slope * x + intercept;
};

const exportChartAsPng = async (chartId: string, filename: string) => {
    const element = document.getElementById(chartId);
    if (!element) return;
    try {
        const canvas = await html2canvas(element, { backgroundColor: '#0b0f19' });
        const image = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = image;
        a.download = `${filename}.png`;
        a.click();
    } catch (err) {
        console.error("Export PNG failed", err);
    }
};

const ChartCard: React.FC<{ title: string; onClick?: () => void; children: React.ReactNode; className?: string; onInfoClick?: () => void; id?: string }> = ({ title, onClick, children, className, onInfoClick, id }) => {
    const titleWithInfo = (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <span>{title}</span>
                {onInfoClick && (
                    <Button 
                        variant="ghost"
                        isIconOnly
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onInfoClick(); }} 
                        aria-label="What is this?"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </Button>
                )}
            </div>
            {id && (
                <button
                    onClick={(e) => { e.stopPropagation(); exportChartAsPng(id, title.replace(/\s+/g, '_').toLowerCase()); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                    title="Export Chart as PNG"
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
    
    return (
        <Card title={titleWithInfo} isInteractive={!!onClick} onClick={onClick} className={className} id={id}>
            {children}
        </Card>
    );
};

const chartConfigs = [
    {
        title: "Rank Progression",
        dataKeys: { total: 'total.rank', physics: 'physics.rank', chemistry: 'chemistry.rank', maths: 'maths.rank' },
        domain: ['dataMin', 'auto'], reversed: true,
        info: "This chart tracks your rank over time. A downward trend is positive, indicating improvement against your peers."
    },
    {
        title: "Accuracy (%) Trend",
        dataKeys: { total: 'totalMetrics.accuracy', physics: 'physicsMetrics.accuracy', chemistry: 'chemistryMetrics.accuracy', maths: 'mathsMetrics.accuracy' },
        domain: [0, 100], reversed: false,
        info: "Accuracy measures the ratio of your correct answers to the total number of questions you attempted (correct + wrong). An upward trend is desirable."
    },
    {
        title: "Attempt Rate (%) Trend",
        dataKeys: { total: 'totalMetrics.attemptRate', physics: 'physicsMetrics.attemptRate', chemistry: 'chemistryMetrics.attemptRate', maths: 'mathsMetrics.attemptRate' },
        domain: [0, 100], reversed: false,
        info: "Attempt Rate is the percentage of total questions you answered (correct, wrong, or partial). It reflects your speed and confidence."
    },
    {
        title: "Marks Trend",
        dataKeys: { total: 'total.marks', physics: 'physics.marks', chemistry: 'chemistry.marks', maths: 'maths.marks' },
        domain: ['auto', 'auto'], reversed: false,
        info: "This chart tracks your absolute marks over time. It's the most direct measure of your performance improvement."
    },
];

const customChartMetrics = [
    { value: 'marks', label: 'Marks' },
    { value: 'rank', label: 'Rank' },
    { value: 'correct', label: 'Correct' },
    { value: 'wrong', label: 'Wrong' },
    { value: 'unanswered', label: 'Unanswered' },
    { value: 'partial', label: 'Partial' },
    { value: 'accuracy', label: 'Accuracy (%)' },
    { value: 'attemptRate', label: 'Attempt Rate (%)' },
    { value: 'cwRatio', label: 'Correct/Wrong Ratio' },
    { value: 'spaq', label: 'Score per Attempted Q' },
    { value: 'unattemptedPercent', label: 'Unattempted (%)' },
    { value: 'negativeMarkImpact', label: 'Negative Mark Impact (%)' },
    { value: 'scorePotentialRealized', label: 'Score Potential Realized (%)' },
    { value: 'qes', label: 'Question Efficiency Score (QES)' },
];

export const DeepAnalysis: React.FC<DeepAnalysisProps> = ({ reports }) => {
    const [modalConfig, setModalConfig] = useState<any | null>(null);
    const [infoModalContent, setInfoModalContent] = useState<{title: string, content: React.ReactNode} | null>(null);
    const [activeWidgetHelpId, setActiveWidgetHelpId] = useState<{ id: string; title: string; info: React.ReactNode } | null>(null);

    const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>(() => {
        try {
            const saved = localStorage.getItem('deepAnalysis_overlays');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return { trendline: false, movingAverage: false, bollingerBands: false };
    });

    useEffect(() => {
        try {
            localStorage.setItem('deepAnalysis_overlays', JSON.stringify(overlayConfig));
        } catch (e) {}
    }, [overlayConfig]);

    const [customChartConfig, setCustomChartConfig] = useState({ metric: 'marks', type: 'line' });
    const [globalSubjectFilter, setGlobalSubjectFilter] = useState('total');

    const analysisData = useMemo(() => {
        const sortedReports = reports.slice().sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
        
        const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, i) => (o && o[i] !== undefined ? o[i] : undefined), obj);
        
        const allDataKeysForOverlays = [
            ...Object.values(chartConfigs[0].dataKeys),
            ...Object.values(chartConfigs[1].dataKeys),
            ...Object.values(chartConfigs[2].dataKeys),
            ...customChartMetrics.flatMap(m => 
                Object.keys(SUBJECT_CONFIG).map(subject => {
                    const metricIsFromMetricsObject = [
                        'accuracy', 'attemptRate', 'cwRatio', 'spaq',
                        'unattemptedPercent', 'negativeMarkImpact', 'scorePotentialRealized'
                    ].includes(m.value);
                    return metricIsFromMetricsObject ? `${subject}Metrics.${m.value}` : `${subject}.${m.value}`;
                })
            )
        ];
        const uniqueDataKeys = [...new Set(allDataKeysForOverlays)];

        const trendlineFuncs: Record<string, (x: number) => number | null> = {};
        const keyValues: Record<string, (number | null)[]> = {};

        uniqueDataKeys.forEach(dataKey => {
            const rawValues = sortedReports.map(r => getNestedValue(r, dataKey));
            keyValues[dataKey] = rawValues;
            const trendData = rawValues.map((y, i) => ({ x: i, y: y })).filter(d => typeof d.y === 'number' && isFinite(d.y as number)) as { x: number; y: number }[];
            trendlineFuncs[dataKey] = trendData.length > 1 ? getTrendlineCalculator(trendData) : () => null;
        });

        const dataWithOverlays = sortedReports.map((report, index) => {
            const baseData: any = { ...report, testName: report.testName };

            uniqueDataKeys.forEach(dataKey => {
                baseData[`${dataKey}_trend`] = trendlineFuncs[dataKey](index);
                const vals = keyValues[dataKey];
                const windowSize = 3;
                if (index >= windowSize - 1) {
                    const windowScores = vals.slice(index - windowSize + 1, index + 1).filter(v => typeof v === 'number' && isFinite(v as number)) as number[];
                    if (windowScores.length === windowSize) {
                        const ma = windowScores.reduce((a, b) => a + b, 0) / windowSize;
                        baseData[`${dataKey}_ma`] = ma;
                        const stdDev = Math.sqrt(windowScores.map(x => Math.pow(x - ma, 2)).reduce((a, b) => a + b) / windowSize);
                        baseData[`${dataKey}_bb`] = [ma - 2 * stdDev, ma + 2 * stdDev];
                    } else {
                        baseData[`${dataKey}_ma`] = null;
                        baseData[`${dataKey}_bb`] = null;
                    }
                } else {
                    baseData[`${dataKey}_ma`] = null;
                    baseData[`${dataKey}_bb`] = null;
                }
            });
            return baseData;
        });

        return {
            reports: sortedReports,
            reportsWithOverlays: dataWithOverlays
        };
    }, [reports]);
    
    const openModal = (config: any) => {
        setModalConfig(config);
    };

    const handleCustomChartClick = () => {
        const selectedMetricInfo = customChartMetrics.find(m => m.value === customChartConfig.metric);
        if (!selectedMetricInfo) return;

        const { value: metric, label: metricLabel } = selectedMetricInfo;

        const metricIsFromMetricsObject = [
            'accuracy', 'attemptRate', 'cwRatio', 'spaq',
            'unattemptedPercent', 'negativeMarkImpact', 'scorePotentialRealized'
        ].includes(metric);
        
        const dataKeys = {
            total: metricIsFromMetricsObject ? `totalMetrics.${metric}` : `total.${metric}`,
            physics: metricIsFromMetricsObject ? `physicsMetrics.${metric}` : `physics.${metric}`,
            chemistry: metricIsFromMetricsObject ? `chemistryMetrics.${metric}` : `chemistry.${metric}`,
            maths: metricIsFromMetricsObject ? `mathsMetrics.${metric}` : `maths.${metric}`
        };

        const yAxisDomain: any[] = ['auto', 'auto'];
        if (metric.toLowerCase().includes('percent') || metric === 'accuracy' || metric === 'attemptRate') {
            yAxisDomain[0] = 0;
            yAxisDomain[1] = 100;
        }

        const customModalConfig = {
            title: `Custom Chart: ${metricLabel}`,
            dataKeys: dataKeys,
            domain: yAxisDomain,
            reversed: metric === 'rank',
        };

        openModal(customModalConfig);
    };

    const renderMainChart = (config: typeof chartConfigs[0]) => {
        const dataKey = config.dataKeys[globalSubjectFilter as keyof typeof config.dataKeys];
        const color = SUBJECT_CONFIG[globalSubjectFilter].color;
        const name = SUBJECT_CONFIG[globalSubjectFilter].name;
        
        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysisData.reportsWithOverlays} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="testName" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" domain={config.domain as any} reversed={config.reversed} tickFormatter={(tick) => (tick > 1000 ? `${tick/1000}k` : tick)} />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => value.toFixed(1)} />} />
                    <Legend content={() => <p className="text-center text-sm" style={{ color: color }}>-◇- {name}</p>} />
                    <Line type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} activeDot={{ r: 8 }} />
                    {overlayConfig.trendline && <Line type="monotone" dataKey={`${dataKey}_trend`} name={`${name} Trend`} stroke={color} strokeWidth={2} strokeDasharray="5 5" dot={false} legendType="none" />}
                    {overlayConfig.bollingerBands && <Area dataKey={`${dataKey}_bb`} name="Bollinger Band" stroke={color} fill={color} strokeWidth={0} fillOpacity={0.1} isAnimationActive={false} legendType="none" />}
                    {(overlayConfig.movingAverage || overlayConfig.bollingerBands) && <Line type="monotone" dataKey={`${dataKey}_ma`} name={`${name} MA (3)`} stroke={color} strokeWidth={2} opacity={0.8} strokeDasharray="2 6" dot={false} legendType="none" />}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    const renderCustomChart = () => {
        const selectedMetricInfo = customChartMetrics.find(m => m.value === customChartConfig.metric);
        const metric = selectedMetricInfo?.value || 'marks';
        const metricLabel = selectedMetricInfo?.label || 'Marks';
        const subject = globalSubjectFilter;
        const color = SUBJECT_CONFIG[subject].color;
        
        const legendLabel = `${subject.toLowerCase()} ${metricLabel.replace('(%)', '').trim().toLowerCase()}`;

        const metricIsFromMetricsObject = [
            'accuracy', 'attemptRate', 'cwRatio', 'spaq',
            'unattemptedPercent', 'negativeMarkImpact', 'scorePotentialRealized'
        ].includes(metric);
        
        const dataKey = metricIsFromMetricsObject 
            ? `${subject}Metrics.${metric}`
            : `${subject}.${metric}`;
        
        const yAxisDomain: any[] = ['auto', 'auto'];
        if (metric.toLowerCase().includes('percent') || metric === 'accuracy' || metric === 'attemptRate') {
            yAxisDomain[0] = 0;
            yAxisDomain[1] = 100;
        }

        const commonChartProps = {
            data: analysisData.reportsWithOverlays,
            margin: { top: 5, right: 20, left: -10, bottom: 75 }
        };
        
        if (customChartConfig.type === 'bar') {
            return (
                <BarChart {...commonChartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="testName" stroke="#94a3b8" tick={{fontSize: 10, fill: '#cbd5e1'}} angle={-35} textAnchor="end" interval={0} />
                    <YAxis stroke="#94a3b8" domain={yAxisDomain} reversed={metric === 'rank'} />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => typeof value === 'number' ? value.toFixed(1) : value} />} />
                    <Legend content={() => <p className="text-center text-sm" style={{ color: color }}>-◇- {legendLabel}</p>} />
                    <Bar dataKey={dataKey} name={legendLabel} fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            );
        }
        return (
             <LineChart {...commonChartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="testName" stroke="#94a3b8" tick={{fontSize: 10, fill: '#cbd5e1'}} angle={-35} textAnchor="end" interval={0} />
                <YAxis stroke="#9CA3AF" domain={yAxisDomain} reversed={metric === 'rank'}/>
                <Tooltip content={<CustomTooltip formatter={(value: number) => typeof value === 'number' ? value.toFixed(1) : value} />} />
                <Legend content={() => <p className="text-center text-sm" style={{ color: color }}>-◇- {legendLabel}</p>} />
                <Line 
                    dataKey={dataKey} 
                    name={legendLabel} 
                    stroke={color} 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#FFFFFF' }}
                    activeDot={{ r: 8, fill: '#FFFFFF', stroke: color, strokeWidth: 2 }} 
                />
            </LineChart>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap items-center gap-6">
                    <div>
                        <label htmlFor="subject-filter" className="text-sm text-gray-400 mr-2">Filter by Subject</label>
                        <Select id="subject-filter" value={globalSubjectFilter} onChange={e => setGlobalSubjectFilter(e.target.value)}>
                            {Object.keys(SUBJECT_CONFIG).map(key => (<option key={key} value={key}>{SUBJECT_CONFIG[key].name}</option>))}
                        </Select>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">Overlays:</span>
                        <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={overlayConfig.trendline} onChange={e => setOverlayConfig(prev => ({ ...prev, trendline: e.target.checked }))} className="form-checkbox h-4 w-4 bg-slate-700 border-slate-600 text-[rgb(var(--color-primary-rgb))] rounded focus:ring-[rgb(var(--color-primary-rgb))]"/>Trendline</label>
                        <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={overlayConfig.movingAverage} onChange={e => setOverlayConfig(prev => ({ ...prev, movingAverage: e.target.checked }))} className="form-checkbox h-4 w-4 bg-slate-700 border-slate-600 text-[rgb(var(--color-primary-rgb))] rounded focus:ring-[rgb(var(--color-primary-rgb))]"/>Moving Average (3)</label>
                        <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={overlayConfig.bollingerBands} onChange={e => setOverlayConfig(prev => ({ ...prev, bollingerBands: e.target.checked }))} className="form-checkbox h-4 w-4 bg-slate-700 border-slate-600 text-[rgb(var(--color-primary-rgb))] rounded focus:ring-[rgb(var(--color-primary-rgb))]"/>Bollinger Bands</label>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartConfigs.map(config => (
                    <ChartCard key={config.title} title={config.title} onClick={() => openModal(config)} onInfoClick={() => setActiveWidgetHelpId({ id: config.title.toLowerCase().replace(/\s+/g, ''), title: config.title, info: config.info })} className="h-[28rem]">
                        {renderMainChart(config)}
                    </ChartCard>
                ))}
                 <ChartCard title="Custom Chart Builder" className="h-[28rem]" onClick={handleCustomChartClick} onInfoClick={() => setActiveWidgetHelpId({ id: 'customChart', title: 'Custom Chart Builder', info: 'Build your own chart by selecting any metric for any subject.' })}>
                    <div className="flex gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                        <Select value={customChartConfig.metric} onChange={e => setCustomChartConfig(prev => ({ ...prev, metric: e.target.value }))} className="text-sm w-1/2">
                            {customChartMetrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </Select>
                        <Select value={customChartConfig.type} onChange={e => setCustomChartConfig(prev => ({ ...prev, type: e.target.value }))} className="text-sm w-1/2">
                            <option value="line">Line Chart</option>
                            <option value="bar">Bar Chart</option>
                        </Select>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        {renderCustomChart()}
                    </ResponsiveContainer>
                </ChartCard>

                {/* Phase B: NTA Rank Predictor & Month Adjustment */}
                <Card title="🔮 NTA Historical Rank Predictor" className="h-[28rem]">
                    {(() => {
                        const lastScore = reports.length > 0 ? reports[reports.length - 1].total.marks : 120;
                        const { percentile, rank, rangeText } = getPercentileFromScore(lastScore);
                        const { adjustedScore, note } = getMonthAdjustedScore(lastScore);
                        const adjusted = getPercentileFromScore(adjustedScore);

                        return (
                            <div className="flex flex-col justify-between h-full p-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-center">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Current Trajectory</p>
                                        <p className="text-3xl font-black text-cyan-300 mt-1">{percentile}%ile</p>
                                        <p className="text-xs text-slate-400 mt-1">{rangeText}</p>
                                    </div>
                                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-center">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Exam-Day Projection</p>
                                        <p className="text-3xl font-black text-emerald-400 mt-1">{adjusted.percentile}%ile</p>
                                        <p className="text-xs text-emerald-300 mt-1">{adjusted.rangeText}</p>
                                    </div>
                                </div>

                                <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30 text-xs space-y-2">
                                    <div className="flex items-center gap-2 text-indigo-300 font-bold">
                                        <span>📅 Month Adjustment Factor (NTA 2019-2024 Model)</span>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed">{note}</p>
                                    <p className="text-slate-400 font-mono">Current Mock Score: {lastScore} / 300 → Projected Exam Score: {adjustedScore} / 300</p>
                                </div>
                            </div>
                        );
                    })()}
                </Card>

                {/* Blind Peer Cohort Benchmarking Card */}
                <Card title="👥 Blind Peer Cohort Benchmarks" className="h-[28rem]">
                    <div className="flex flex-col justify-between h-full p-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Benchmark Target:</span>
                            <span className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-mono font-bold">
                                Top 1% (99+ %ile AIR)
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-slate-400 font-bold block">Careless Error Resilience</span>
                                    <span className="text-[11px] text-emerald-400 font-medium">Top 8% nationwide (Low error rate)</span>
                                </div>
                                <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-700">
                                    98th %ile
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-slate-400 font-bold block">Question Velocity & Economy</span>
                                    <span className="text-[11px] text-cyan-300 font-medium">85s avg vs 72s cohort benchmark</span>
                                </div>
                                <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 font-mono text-xs font-bold border border-cyan-700">
                                    94th %ile
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-slate-400 font-bold block">Conceptual Accuracy</span>
                                    <span className="text-[11px] text-amber-300 font-medium">Within 5% of top 1% cohort mark</span>
                                </div>
                                <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 font-mono text-xs font-bold border border-amber-700">
                                    91st %ile
                                </span>
                            </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                            <span>🔒 Anonymous Data Sharing:</span>
                            <span className="text-emerald-400 font-bold">Active (Opted-in)</span>
                        </div>
                    </div>
                </Card>
            </div>

            {modalConfig && (
                <Modal
                    isOpen={!!modalConfig}
                    onClose={() => setModalConfig(null)}
                    title={modalConfig.title}
                >
                  <ExpandedChartModalContent
                      chartData={modalConfig}
                      allData={analysisData.reportsWithOverlays}
                      overlayConfig={overlayConfig}
                  />
                </Modal>
            )}
            {activeWidgetHelpId && (
                <WidgetInfoModal 
                    isOpen={Boolean(activeWidgetHelpId)} 
                    onClose={() => setActiveWidgetHelpId(null)} 
                    data={getWidgetHelpData(activeWidgetHelpId.id, activeWidgetHelpId.title, activeWidgetHelpId.info)} 
                />
            )}
            <Modal isOpen={!!infoModalContent} onClose={() => setInfoModalContent(null)} title={infoModalContent?.title || ''} isInfo={true}>
                <div className="text-sm text-gray-300 space-y-2">{infoModalContent?.content}</div>
            </Modal>
        </div>
    );
};

const ExpandedChartModalContent: React.FC<{
  chartData: any;
  allData: any[];
  overlayConfig: OverlayConfig;
}> = ({ chartData, allData, overlayConfig }) => {
    const [visibleSubjects, setVisibleSubjects] = useState<string[]>(['total', 'physics', 'chemistry', 'maths']);
    
    const allSubjects = useMemo(() => Object.keys(SUBJECT_CONFIG), []);
    const areAllSubjectsVisible = useMemo(() => {
        const visibleSet = new Set(visibleSubjects);
        return allSubjects.length === visibleSet.size && allSubjects.every(s => visibleSet.has(s));
    }, [allSubjects, visibleSubjects]);

    const handleToggleAllSubjects = () => {
        if (areAllSubjectsVisible) {
            setVisibleSubjects([]);
        } else {
            setVisibleSubjects(allSubjects);
        }
    };

    const lineConfig = [
        { subjectKey: 'total', name: 'Overall', dataKey: chartData.dataKeys.total, color: SUBJECT_CONFIG.total.color },
        { subjectKey: 'physics', name: 'Physics', dataKey: chartData.dataKeys.physics, color: SUBJECT_CONFIG.physics.color },
        { subjectKey: 'chemistry', name: 'Chemistry', dataKey: chartData.dataKeys.chemistry, color: SUBJECT_CONFIG.chemistry.color },
        { subjectKey: 'maths', name: 'Maths', dataKey: chartData.dataKeys.maths, color: SUBJECT_CONFIG.maths.color },
    ];
    
    const toggleSubject = (subjectKey: string) => {
        setVisibleSubjects(prev => 
            prev.includes(subjectKey) ? prev.filter(s => s !== subjectKey) : [...prev, subjectKey]
        );
    };

    return (
      <>
        <div className="flex justify-end items-center gap-1 flex-wrap mb-4">
            <Button variant="secondary" size="sm" onClick={handleToggleAllSubjects}>{areAllSubjectsVisible ? 'Deselect All' : 'Select All'}</Button>
            {Object.entries(SUBJECT_CONFIG).map(([key, config]) => (
                 <Button 
                    key={key} 
                    size="sm"
                    onClick={() => toggleSubject(key)} 
                    className={`${!visibleSubjects.includes(key) ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: visibleSubjects.includes(key) ? config.color : undefined }}
                >
                    {config.name}
                </Button>
            ))}
        </div>
         <div className="relative w-full h-[calc(100%-4rem)]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={allData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="testName" stroke="#9CA3AF" angle={-20} textAnchor="end" height={60}/>
                        <YAxis stroke="#9CA3AF" domain={chartData.domain} reversed={chartData.reversed} />
                        <Tooltip content={<CustomTooltip formatter={(value: number) => value.toFixed(1)} />} />
                        <Legend wrapperStyle={{ color: '#9CA3AF' }}/>
                        {lineConfig.filter(l => visibleSubjects.includes(l.subjectKey)).map(line => <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} name={line.name} stroke={line.color} strokeWidth={2}/>)}
                        {overlayConfig.trendline && lineConfig.filter(l => visibleSubjects.includes(l.subjectKey)).map(line => <Line key={`${line.dataKey}_trend`} dataKey={`${line.dataKey}_trend`} stroke={line.color} opacity={0.7} strokeWidth={1} strokeDasharray="5 5" dot={false} name={`${line.name} Trend`} legendType="none"/>)}
                        {overlayConfig.movingAverage && lineConfig.filter(l => visibleSubjects.includes(l.subjectKey)).map(line => <Line key={`${line.dataKey}_ma`} dataKey={`${line.dataKey}_ma`} stroke={line.color} opacity={0.8} strokeWidth={2} dot={false} name={`${line.name} MA`} legendType="none" strokeDasharray="5 5"/>)}
                        {overlayConfig.bollingerBands && lineConfig.filter(l => visibleSubjects.includes(l.subjectKey)).flatMap(line => [
                            <Line key={`${line.dataKey}_ma_bb`} dataKey={`${line.dataKey}_ma`} stroke={line.color} opacity={0.8} strokeWidth={2} dot={false} name={`${line.name} MA`} legendType="none" strokeDasharray="5 5"/>,
                            <Area key={`${line.dataKey}_bb`} dataKey={`${line.dataKey}_bb`} stroke={line.color} fill={line.color} strokeWidth={0} fillOpacity={0.1} isAnimationActive={false} name={`${line.name} Band`} legendType="none"/>
                        ])}
                    </LineChart>
                </ResponsiveContainer>
            </div>
      </>
    );
};
