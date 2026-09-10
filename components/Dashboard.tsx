
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { TestReport, QuestionLog, RootCauseFilter, LongTermGoal, QuizQuestion, UserProfile, ExamStrategy } from '../types';
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { generateContextualInsight, getAIAnalysis, generateDashboardInsight, generateChartAnalysis, generateOracleDrill } from '../services/geminiService';
import { SUBJECT_CONFIG } from '../constants';
import Modal from './common/Modal';
import CustomTooltip from './common/CustomTooltip';
import { useDashboardKpis } from '../hooks/useDashboardAnalytics';
import { CompetitorLeaderboard } from './competitors/CompetitorLeaderboard';
import { Button } from './common/Button';
import { MarkdownRenderer } from './common/MarkdownRenderer';
import { useJeeStore } from '../store/useJeeStore';
import { Skeleton } from './ui/Skeleton';
import { WidgetInfoModal } from './common/WidgetInfoModal';
import { getWidgetHelpData } from '../constants/widgetHelpData';

const PaperStrategyWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.PaperStrategyWidget })));
const StrategicROIWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.StrategicROIWidget })));
const RankPredictorWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.RankPredictorWidget })));
const PercentilePredictorWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.PercentilePredictorWidget })));
const VolatilityWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.VolatilityWidget })));
const PerformanceTrendWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.PerformanceTrendWidget })));
const SubjectComparisonWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.SubjectComparisonWidget })));
const SubjectRadarWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.SubjectRadarWidget })));
const CalendarHeatmapWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.CalendarHeatmapWidget })));
const WeaknessHeatmapWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.WeaknessHeatmapWidget })));
const RankSimulatorWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.RankSimulatorWidget })));
const ReflectionsWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.ReflectionsWidget })));
const SubjectRelativityWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.SubjectRelativityWidget })));
const AvgMarksBarWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.AvgMarksBarWidget })));
const WeakestLinkWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.WeakestLinkWidget })));
const TimeAllocationWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.TimeAllocationWidget })));
const NegativeMarksWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.NegativeMarksWidget })));
const PeerComparisonWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.PeerComparisonWidget })));
const TopperGapWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.TopperGapWidget })));
const SubjectMasteryRingsWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.SubjectMasteryRingsWidget })));
const ErrorDnaWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.ErrorDnaWidget })));
const OracleWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.OracleWidget })));
const CalibrationWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.CalibrationWidget })));
const TopStudentGapWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.TopStudentGapWidget })));
const GoalProgressWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.GoalProgressWidget })));
const ExamStrategyWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.ExamStrategyWidget })));
const ExamDayWidget = React.lazy(() => import('./DashboardWidgets').then(m => ({ default: m.ExamDayWidget })));
const OracleChamber = React.lazy(() => import('./OracleChamber').then(m => ({ default: m.OracleChamber })));

interface DashboardProps {
  reports: TestReport[];
  logs: QuestionLog[];
  apiKey: string;
  setView: (view: any) => void;
  setRootCauseFilter: (filter: RootCauseFilter) => void;
  onStartFocusSession: (topic: string) => void;
  longTermGoals: LongTermGoal[];
  modelName?: string;
  userProfile: UserProfile;
  onUpdateProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

type WidgetId = 'topStudentGap' | 'heatmap' | 'weaknessHeatmap' | 'performanceTrend' | 'subjectComparison' | 'subjectStrengthsRadar' | 'percentilePredictor' | 'aiAnalysis' | 'strategicROI' | 'paperStrategy' | 'rankPredictor' | 'volatility' | 'rankSimulator' | 'goalProgress' | 'oracle' | 'calibration' | 'competitors' | 'reflections' | 'subjectRelativity' | 'avgMarksBar' | 'weakestLink' | 'timeAllocation' | 'negativeMarks' | 'peerComparison' | 'topperGap' | 'subjectMasteryRings' | 'errorDna';

interface WidgetLayout {
    id: WidgetId;
    visible: boolean;
    size: 'normal' | 'wide';
}

const DEFAULT_DASHBOARD_LAYOUT: WidgetLayout[] = [
    { id: 'topStudentGap', visible: true, size: 'wide' },
    { id: 'topperGap', visible: true, size: 'normal' },
    { id: 'subjectMasteryRings', visible: true, size: 'normal' },
    { id: 'errorDna', visible: true, size: 'normal' },
    { id: 'oracle', visible: true, size: 'normal' },
    { id: 'calibration', visible: true, size: 'normal' },
    { id: 'competitors', visible: true, size: 'normal' },
    { id: 'weakestLink', visible: true, size: 'normal' },
    { id: 'subjectRelativity', visible: true, size: 'normal' },
    { id: 'avgMarksBar', visible: true, size: 'normal' },
    { id: 'timeAllocation', visible: true, size: 'normal' },
    { id: 'negativeMarks', visible: true, size: 'normal' },
    { id: 'peerComparison', visible: true, size: 'normal' },
    { id: 'weaknessHeatmap', visible: true, size: 'wide' },
    { id: 'heatmap', visible: true, size: 'wide' },
    { id: 'volatility', visible: true, size: 'normal' },
    { id: 'performanceTrend', visible: true, size: 'normal' },
    { id: 'rankSimulator', visible: true, size: 'normal' },
    { id: 'goalProgress', visible: true, size: 'normal' },
    { id: 'reflections', visible: true, size: 'normal' },
    { id: 'strategicROI', visible: true, size: 'wide' },
    { id: 'paperStrategy', visible: true, size: 'wide' },
    { id: 'rankPredictor', visible: true, size: 'wide' },
    { id: 'subjectComparison', visible: true, size: 'normal' },
    { id: 'subjectStrengthsRadar', visible: true, size: 'normal' },
    { id: 'percentilePredictor', visible: true, size: 'normal' },
    { id: 'aiAnalysis', visible: true, size: 'wide' },
];

interface MissionBriefingCardProps {
    onStartFocusSession: (topic: string) => void;
    onOpenPlanner: () => void;
    logs: QuestionLog[];
}

const MissionBriefingCard = React.memo<MissionBriefingCardProps>(({ onStartFocusSession, onOpenPlanner, logs }) => {
    const [isDismissed, setIsDismissed] = useState(() => {
        const date = sessionStorage.getItem('missionBriefingDismissedDate');
        return date === new Date().toDateString();
    });

    const daysRemaining = useMemo(() => {
        const now = new Date();
        const nextExamYear = now.getMonth() >= 1 ? now.getFullYear() + 1 : now.getFullYear();
        const targetExam = new Date(nextExamYear, 0, 24); // Jan 24th Mains Session 1
        const diffTime = targetExam.getTime() - now.getTime();
        return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }, []);

    if (isDismissed) return null;

    const weakestTopic = logs.length > 0 ? logs[0].topic || 'Thermodynamics' : 'Thermodynamics';

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('missionBriefingDismissedDate', new Date().toDateString());
    };

    return (
        <div className="w-full mb-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-cyan-500/30 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl">🎯</span>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                            Today's Mission Briefing -- {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase font-mono whitespace-nowrap shrink-0 inline-flex items-center">
                            {daysRemaining} Days to JEE Mains
                        </span>
                    </div>
                    <p className="text-sm text-indigo-200/90 leading-relaxed max-w-3xl">
                        Your <strong>{weakestTopic}</strong> chapter has a high paper frequency rating. Spending 2-3 hours on targeted problem practice here yields the highest ROI for your score trajectory.
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                        <span>🔥 Streak: <strong>12 Days</strong></span>
                        <span>📑 SRS Queue: <strong>18 cards overdue</strong></span>
                        <span>⚡ Priority: <strong>High Impact</strong></span>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0">
                    <button 
                        onClick={() => onStartFocusSession(weakestTopic)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 whitespace-nowrap text-center order-1 sm:order-2"
                    >
                        ⚡ Start Deep Work
                    </button>
                    <div className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1">
                        <button 
                            onClick={() => {
                                const briefing = `Good morning! Welcome to your JEE War Room. You have ${daysRemaining} days remaining until JEE Mains. Today's top priority topic is ${weakestTopic}. Stay focused and execute your plan!`;
                                const synth = window.speechSynthesis;
                                if (synth) {
                                    synth.cancel();
                                    const utter = new SpeechSynthesisUtterance(briefing);
                                    utter.rate = 1.0;
                                    synth.speak(utter);
                                } else {
                                    alert(briefing);
                                }
                            }}
                            className="flex-1 sm:flex-initial px-3 py-2 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-500/40 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            <span>▶</span> Morning Briefing
                        </button>
                        <button 
                            onClick={onOpenPlanner}
                            className="flex-1 sm:flex-initial px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition-colors whitespace-nowrap text-center"
                        >
                            Open Planner
                        </button>
                        <button 
                            onClick={handleDismiss}
                            className="p-2 text-slate-500 hover:text-slate-300 text-xs transition-colors shrink-0"
                            title="Dismiss for today"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

const InsightBanner: React.FC<{ reports: TestReport[], apiKey: string }> = ({ reports, apiKey }) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const fetchInsight = async () => {
            const cached = sessionStorage.getItem('dashboardDailyInsight');
            const cachedDate = sessionStorage.getItem('dashboardDailyInsightDate');
            const today = new Date().toDateString();

            if (cached && cachedDate === today) {
                if (!cancelled) setInsight(cached);
                return;
            }

            if (reports.length === 0) return;

            setLoading(true);
            const text = await generateDashboardInsight(reports, apiKey);
            if (!cancelled) {
                setInsight(text);
                sessionStorage.setItem('dashboardDailyInsight', text);
                sessionStorage.setItem('dashboardDailyInsightDate', today);
                setLoading(false);
            }
        };
        fetchInsight();
        return () => { cancelled = true; };
    }, [reports, apiKey]);

    if (!insight && !loading) return null;

    return (
        <div className="w-full mb-6 relative group overflow-hidden rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="relative z-10 p-4 flex items-center justify-between text-left gap-4">
                {loading ? (
                    <div className="flex items-center gap-2 text-indigo-300 text-sm animate-pulse w-full justify-center py-2">
                        <span className="text-xl">✨</span> Analyzing Intelligence...
                    </div>
                ) : (
                    <div className="animate-fade-in flex items-start gap-3 w-full">
                        <span className="text-2xl shrink-0 mt-0.5">💡</span> 
                        <div className="flex-1 text-indigo-200 font-medium text-sm md:text-base leading-relaxed">
                            <MarkdownRenderer content={insight || ''} showExport={false} baseTextSize="text-sm md:text-base" baseTextColor="text-indigo-200" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DashboardWidgetWrapper = React.memo<{
    widget: any;
    widgetConfig: any;
    renderContent: () => React.ReactNode;
    isCustomizing: boolean;
    draggingId: string | null;
    dragOverId: string | null;
    contextualInsight: { widgetId: WidgetId | null; isLoading: boolean; text: string };
    onChartClick: (id: WidgetId) => void;
    onMouseEnter?: (id: WidgetId) => void;
    onMouseLeave?: () => void;
    onInfoClick: (id: WidgetId) => void;
    onHide: (id: WidgetId) => void;
    onResize: (id: WidgetId) => void;
    onDragStart: (e: React.DragEvent, id: WidgetId) => void;
    onDragEnter: (e: React.DragEvent, id: WidgetId) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragLeave: () => void;
}>(({ widget, widgetConfig, renderContent, isCustomizing, draggingId, dragOverId, contextualInsight, onChartClick, onMouseEnter, onMouseLeave, onInfoClick, onHide, onResize, onDragStart, onDragEnter, onDragEnd, onDragLeave }) => {
    const handleChartClick = useCallback(() => onChartClick(widget.id), [onChartClick, widget.id]);
    const handleMouseEnter = useCallback(() => onMouseEnter?.(widget.id), [onMouseEnter, widget.id]);
    const handleInfoClick = useCallback(() => onInfoClick(widget.id), [onInfoClick, widget.id]);
    const handleHide = useCallback(() => onHide(widget.id), [onHide, widget.id]);
    const handleResize = useCallback(() => onResize(widget.id), [onResize, widget.id]);

    const isDraggable = isCustomizing;
    const isAutoHeight = widget.id === 'topStudentGap' || widget.id === 'strategicROI' || widget.id === 'heatmap' || widget.id === 'weaknessHeatmap';
    const isTall = widget.id === 'paperStrategy' || widget.id === 'aiAnalysis';
    const widgetHeightClass = isAutoHeight ? 'h-auto min-h-[32rem]' : isTall ? 'h-[36rem]' : 'h-[28rem]';
    const isInsightActive = contextualInsight.widgetId === widget.id;

    return (
        <div 
            className={`${widget.size === 'wide' ? 'lg:col-span-2' : ''} ${widgetHeightClass} ${isDraggable ? 'cursor-move' : ''} ${dragOverId === widget.id && draggingId ? 'drag-over-indicator' : ''}`} 
            draggable={isDraggable} 
            onDragStart={(e) => onDragStart(e, widget.id)} 
            onDragEnter={(e) => onDragEnter(e, widget.id)} 
            onDragEnd={onDragEnd} 
            onDragLeave={onDragLeave}
        >
            <ChartCard 
                title={widgetConfig.title} 
                isEditing={isCustomizing} 
                isDragging={draggingId === widget.id} 
                onChartClick={handleChartClick} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={onMouseLeave} 
                insightText={isInsightActive ? contextualInsight.text : ''} 
                isInsightLoading={isInsightActive && contextualInsight.isLoading} 
                onInfoClick={handleInfoClick}
                onHide={handleHide}
                onResize={handleResize}
            >
                <React.Suspense fallback={<SkeletonLoader />}>
                    {renderContent()}
                </React.Suspense>
            </ChartCard>
        </div>
    );
});

// ... (KPICard components etc remain unchanged)
const ReadinessGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    let color = 'text-cyan-400';
    if (score < 40) color = 'text-red-400';
    else if (score < 75) color = 'text-yellow-400';

    return (
        <div className="flex items-center justify-center h-full w-full gap-4">
            <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r={radius} fill="none" stroke="#334155" strokeWidth="6" />
                    <circle 
                        cx="35" cy="35" r={radius} fill="none" stroke="currentColor" strokeWidth="6" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        strokeLinecap="round"
                        className={`${color} transition-all duration-1000 ease-out`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${color}`}>{score.toFixed(0)}%</span>
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-bold text-white tracking-tight">Exam Ready</span>
                <span className="text-xs text-gray-400">Based on consistency & accuracy</span>
            </div>
        </div>
    );
};

const useCountUp = (endValue: number, duration: number = 1500) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        if (endValue === 0) {
            setCount(0);
            return;
        }
        const start = performance.now();
        let rafId: number;
        
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = endValue * easedProgress;
            
            if (progress >= 1) {
                setCount(endValue);
            } else {
                setCount(currentValue);
                rafId = requestAnimationFrame(tick);
            }
        };
        
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [endValue, duration]);
    
    const isRank = Math.abs(endValue) > 1000;
    if (isRank) return Math.round(count).toLocaleString();

    const hasDecimal = endValue % 1 !== 0;
    return hasDecimal ? count.toFixed(1) : Math.round(count).toLocaleString();
};

interface KPICardProps {
  title: string;
  value: number | string;
  suffix?: string;
  subtitle?: string;
  comparison?: { diff: number; trend: 'up' | 'down' | 'flat'; };
  trendData?: { value: number }[];
  isGauge?: boolean;
  action?: { label: string, onClick: () => void };
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = React.memo(({ title, value, suffix = '', comparison, subtitle, trendData, isGauge, action, onClick }) => {
  const isNumeric = typeof value === 'number';
  const animatedValue = useCountUp(isNumeric ? value as number : 0);
  const displayValue = isNumeric ? animatedValue : value;
  
  const trendIcon = comparison?.trend === 'up' ? '▲' : comparison?.trend === 'down' ? '▼' : null;
  const isRank = title.toLowerCase().includes('rank');

  let trendColor = 'text-gray-400';
  let chartColor = '#22d3ee'; // Cyan

  if (comparison?.trend === 'up') {
      trendColor = isRank ? 'text-red-400' : 'text-green-400';
  } else if (comparison?.trend === 'down') {
      trendColor = isRank ? 'text-green-400' : 'text-red-400';
  }

  const formattedDiff = comparison ? `${comparison.diff > 0 ? '+' : ''}${isRank ? Math.round(comparison.diff) : comparison.diff.toFixed(1)}` : '';
  const cardId = `kpi-${title.replace(/\s+/g, '-').toLowerCase()}`;

  if (isGauge && isNumeric) {
      return (
          <div className="bg-slate-800/30 backdrop-blur-md p-3 rounded-2xl shadow-lg flex flex-col relative overflow-hidden h-28 cursor-default">
              <ReadinessGauge score={value as number} />
          </div>
      )
  }

  return (
    <div 
      className={`group bg-slate-800/30 backdrop-blur-md p-4 rounded-2xl shadow-lg flex flex-col justify-between flex-1 transition-colors duration-150 border border-slate-700/50 hover:border-cyan-500/40 relative overflow-hidden h-28 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`relative z-10 flex flex-col h-full justify-between pointer-events-none transition-opacity duration-200 ${trendData ? 'group-hover:opacity-0' : ''}`}>
        <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
            <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-white tracking-tight font-mono">{displayValue}{suffix}</p>
                {comparison && comparison.trend !== 'flat' && (
                    <span className={`text-[10px] font-bold ${trendColor} flex items-center bg-slate-900/50 px-1.5 rounded-full backdrop-blur-sm`}>
                    {trendIcon} {Math.abs(Number(formattedDiff))}
                    </span>
                )}
            </div>
        </div>
      
        {(comparison || subtitle) && !action && (
            <p className="text-[9px] text-gray-500 font-medium tracking-wide">{subtitle ? subtitle : 'vs. Average'}</p>
        )}
        
        {action && (
            <div className="mt-auto pt-2 pointer-events-auto">
                <button onClick={(e) => { 
                    e.stopPropagation(); 
                    action.onClick();
                }} 
                className="relative z-20 text-[10px] bg-slate-700/80 hover:bg-cyan-600 text-white px-2 py-1 rounded transition-colors flex items-center gap-1 w-max border border-slate-600 font-semibold">
                    <span className="text-yellow-300">⚡</span> {action.label}
                </button>
            </div>
        )}
      </div>

      {trendData && (
        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 35, right: -1, left: -1, bottom: 0 }}>
              <defs>
                  <linearGradient id={`gradient-${cardId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.5}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
              </defs>
              <YAxis domain={['dataMin - (dataMax - dataMin) * 0.1', 'dataMax + (dataMax - dataMin) * 0.1']} hide reversed={isRank} />
              <Area 
                type="natural" 
                dataKey="value" 
                stroke={chartColor} 
                strokeWidth={2} 
                fill={`url(#gradient-${cardId})`} 
                baseValue={isRank ? "dataMax" : "dataMin"}
                animationDuration={500} 
                isAnimationActive={true}
                activeDot={{ r: 5, fill: 'white', stroke: chartColor, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-cyan-400/50" style={{ filter: 'blur(3px)' }}></div>
        </div>
      )}
    </div>
  );
});

const SkeletonLoader = () => (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-pulse bg-slate-800/20 rounded-lg">
        <div className="w-3/4 h-8 bg-slate-700/50 rounded mb-6"></div>
        <div className="w-full h-full bg-slate-700/30 rounded-full max-w-[200px] max-h-[200px]"></div>
        <div className="w-1/2 h-4 bg-slate-700/50 rounded mt-6"></div>
    </div>
);

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
    insightText?: string;
    isInsightLoading?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}> = React.memo(({ title, children, isEditing, isDragging, onChartClick, actionButton, onInfoClick, headerControls, onHide, onResize, className, insightText, isInsightLoading, onMouseEnter, onMouseLeave }) => (
    <div
        className={`glass-panel p-4 rounded-2xl flex flex-col h-full transition-colors duration-150 relative ${isDragging ? 'shadow-[rgba(var(--color-primary-rgb),0.5)] opacity-50' : ''} ${!isEditing && onChartClick ? 'cursor-pointer hover:border-cyan-500/40 hover:shadow-[rgba(var(--color-primary-rgb),0.2)]' : ''} ${isEditing ? 'ring-2 ring-dashed ring-slate-500 cursor-move' : ''} ${className || ''}`}
        onClick={() => { if (!isEditing && onChartClick) onChartClick(); }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
         {isEditing && (
            <div className="absolute inset-0 z-20 bg-slate-900/60 flex flex-col items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg backdrop-blur-sm">
                <div className="flex gap-2">
                        {onResize && (
                        <button onClick={(e) => { e.stopPropagation(); onResize(); }} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg transition-colors" title="Toggle Size">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
                        </button>
                    )}
                    {onHide && (
                        <button onClick={(e) => { e.stopPropagation(); onHide(); }} className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors" title="Hide Widget">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" /></svg>
                        </button>
                    )}
                </div>
                <span className="text-white font-semibold bg-slate-800 px-3 py-1 rounded-full text-sm border border-slate-600">Drag to Move</span>
            </div>
        )}

        <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[rgb(var(--color-primary))]">
                    {title}
                </h3>
                {onInfoClick && !isEditing && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onInfoClick(); }} 
                        className="text-gray-400 hover:text-white transition-colors"
                        title="What is this?"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2">
                {headerControls && !isEditing && <div onClick={e => e.stopPropagation()}>{headerControls}</div>}
                {actionButton && !isEditing && <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>{actionButton}</div>}
            </div>
        </div>
        <div className="flex-grow h-full relative" onClick={e => e.stopPropagation()}>
            {children}
            {(insightText || isInsightLoading) && (
              <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm flex items-center justify-center p-4 rounded-lg animate-fade-in transition-opacity z-10 pointer-events-none">
                {isInsightLoading ? (
                  <div className="flex items-center gap-2 text-indigo-300">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <p className="text-sm text-indigo-200 text-center"><span className="font-bold">💡 AI Insight:</span> {insightText}</p>
                )}
              </div>
            )}
        </div>
    </div>
));

// --- KPI Detail Modal ---
const KPIModal: React.FC<{ title: string, metricKey: string, reports: TestReport[], onClose: () => void }> = ({ title, metricKey, reports, onClose }) => {
    const data = reports.map(r => {
        // Resolve dotted paths e.g. 'total.marks'
        const val = metricKey.split('.').reduce((o: any, i) => o[i], r);
        return { name: r.testName, value: val };
    });

    const isRank = title.toLowerCase().includes('rank');

    return (
        <Modal isOpen={true} onClose={onClose} title={`${title} Trend Analysis`}>
            <div className="h-80 w-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" reversed={isRank} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#22d3ee" fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="p-4 text-sm text-gray-300 bg-slate-800/50 rounded-lg mx-4 mb-4 border border-slate-700">
                <p><strong>Analysis:</strong> This detailed view shows the progression of your {title.toLowerCase()} over time. {isRank ? 'Lower is better.' : 'Higher is better.'} Look for consistent upward trends or plateaus to identify focus areas.</p>
            </div>
        </Modal>
    );
}

const AiAnalysisWidget: React.FC<{
    aiAnalysis: { content: string; isLoading: boolean; error: string | null };
    aiAnalysisHistory: Record<string, string>;
    handleGenerateAiAnalysis: () => void;
    selectedDate: string | null;
    setSelectedDate: (date: string | null) => void;
}> = ({ aiAnalysis, aiAnalysisHistory, handleGenerateAiAnalysis, selectedDate, setSelectedDate }) => {
    return (
        <div className="flex flex-col">
            <div className="flex justify-end mb-2">
                <button onClick={handleGenerateAiAnalysis} disabled={aiAnalysis.isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {aiAnalysis.isLoading ? 'Analyzing...' : 'Generate Today'}
                </button>
            </div>
            {aiAnalysis.isLoading && <div className="flex-grow flex items-center justify-center text-gray-400 animate-pulse py-8">Thinking... <span className="text-xs ml-2 text-gray-500">(May take 30s)</span></div>}
            {aiAnalysis.error && <div className="flex-grow flex flex-col items-center justify-center text-red-400 py-8"><p>{aiAnalysis.error}</p><button onClick={handleGenerateAiAnalysis} className="mt-2 bg-red-600/50 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-full text-xs">Retry</button></div>}
            
            {!aiAnalysis.isLoading && !aiAnalysis.error && (
                <div className="flex-grow pr-2 space-y-4">
                    {selectedDate && aiAnalysisHistory[selectedDate] ? (
                        <div className="bg-slate-800/30 backdrop-blur-md p-4 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3 border-b border-slate-700/50 pb-2">
                                <button onClick={() => setSelectedDate(null)} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors">&larr; Back to List</button>
                                <span className="text-sm font-semibold text-indigo-300">{selectedDate}</span>
                            </div>
                            <div className="text-gray-300 text-sm leading-relaxed markdown-body">
                                <MarkdownRenderer content={aiAnalysisHistory[selectedDate]} />
                            </div>
                        </div>
                    ) : Object.keys(aiAnalysisHistory).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(aiAnalysisHistory)
                                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                                .map(([date, analysisText]) => (
                                    <div 
                                        key={date} 
                                        onClick={() => setSelectedDate(date)}
                                        className="bg-slate-800/30 backdrop-blur-md hover:bg-slate-800/50 p-3 rounded-xl cursor-pointer transition-colors flex justify-between items-center group"
                                    >
                                        <span className="text-sm text-indigo-300 font-medium">{date}</span>
                                        <span className="text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">View &rarr;</span>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center h-full py-8">
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">No analysis yet. Generate one to see your performance review!</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ reports, logs, apiKey, setView, setRootCauseFilter, onStartFocusSession, longTermGoals, modelName, userProfile, onUpdateProfile }) => {
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [enableAiInsights, setEnableAiInsights] = useState(false);
    const [contextualInsight, setContextualInsight] = useState<{ widgetId: WidgetId | null; text: string; isLoading: boolean }>({ widgetId: null, text: '', isLoading: false });
    const insightTimeoutRef = useRef<number | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<{ content: string; isLoading: boolean; error: string | null }>({ content: '', isLoading: false, error: null });
    const [aiAnalysisHistory, setAiAnalysisHistory] = useState<Record<string, string>>({});
    const [selectedAiAnalysisDate, setSelectedAiAnalysisDate] = useState<string | null>(null);

    useEffect(() => {
        const savedHistory = localStorage.getItem('aiAnalysisHistory_v1');
        if (savedHistory) {
            try {
                setAiAnalysisHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse AI Analysis history", e);
            }
        }
    }, []);
    const [infoModalContent, setInfoModalContent] = useState<{title: string, content: React.ReactNode} | null>(null);
    const [activeKpiModal, setActiveKpiModal] = useState<{ title: string, metricKey: string } | null>(null);
    
    // Oracle State
    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [oracleQuestions, setOracleQuestions] = useState<QuizQuestion[]>([]);
    const [isOracleLoading, setIsOracleLoading] = useState(false);

    // State for chart summaries
    const [chartSummaries, setChartSummaries] = useState<{ performance?: string, subject?: string }>({});

    // Robust State Initialization for Layout
    const [layout, setLayout] = useState<WidgetLayout[]>(() => {
        try {
            const savedLayoutString = localStorage.getItem('dashboardWidgetLayout_v7');
            if (savedLayoutString) {
                const parsedLayout = JSON.parse(savedLayoutString);
                if (Array.isArray(parsedLayout)) {
                    const savedIds = new Set(parsedLayout.map((w: any) => w.id));
                    
                    // 1. Keep saved items in their saved order (respecting user customization)
                    const mergedSaved = parsedLayout.map((savedW: any) => {
                        const defaultW = DEFAULT_DASHBOARD_LAYOUT.find(d => d.id === savedW.id);
                        // If default exists, merge to ensure structure, otherwise use saved (legacy handling)
                        return defaultW ? { ...defaultW, ...savedW } : savedW;
                    }).filter((w: any) => DEFAULT_DASHBOARD_LAYOUT.some(d => d.id === w.id)); // Remove obsolete saved widgets

                    // 2. Append new default items that weren't in saved state
                    const newItems = DEFAULT_DASHBOARD_LAYOUT.filter(d => !savedIds.has(d.id));
                    
                    return [...mergedSaved, ...newItems];
                }
            }
        } catch (e) { 
            console.error("Failed to load dashboard layout", e); 
        }
        return DEFAULT_DASHBOARD_LAYOUT;
    });

    const dragItem = useRef<WidgetId | null>(null);
    const dragOverItem = useRef<WidgetId | null>(null);
    const [draggingId, setDraggingId] = useState<WidgetId | null>(null);
    const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);
    const [enlargedWidget, setEnlargedWidget] = useState<WidgetId | null>(null);
    const [activeWidgetHelpId, setActiveWidgetHelpId] = useState<string | null>(null);

    useEffect(() => {
        try { localStorage.setItem('dashboardWidgetLayout_v7', JSON.stringify(layout)); } catch (e) { console.error("Failed to save layout", e); }
    }, [layout]);

    // ... (Rest of component remains mostly same, just updating the return structure logic if needed)
    
    // Fetch chart summaries once
    useEffect(() => {
        const fetchSummaries = async () => {
            if (!apiKey || reports.length === 0) return;
            const sessionKey = `dashboardChartSummaries_${reports.length}`;
            const cached = sessionStorage.getItem(sessionKey);
            if (cached) {
                try {
                    setChartSummaries(JSON.parse(cached));
                    return;
                } catch {
                    // Ignore corrupt session item
                }
            }

            try {
                // Always use Flash for chart summaries
                const performanceSummary = await generateChartAnalysis("Performance Trend", `Last 5 scores: ${reports.slice(-5).map(r => r.total.marks).join(', ')}`, apiKey);
                // Simple heuristic for subject comparison summary to save API calls or could also call API
                const sub = reports[reports.length - 1];
                const subjectSummary = `In your latest test, Physics: ${sub.physics.marks}, Chem: ${sub.chemistry.marks}, Maths: ${sub.maths.marks}.`;
                const subjectAnalysis = await generateChartAnalysis("Subject Comparison", subjectSummary, apiKey);

                const newSummaries = { performance: performanceSummary, subject: subjectAnalysis };
                setChartSummaries(newSummaries);
                sessionStorage.setItem(sessionKey, JSON.stringify(newSummaries));
            } catch (err) {
                console.warn('Dashboard fetchSummaries fallback:', err);
                setChartSummaries({
                    performance: "Consistent daily revision builds long-term retention.",
                    subject: "Balance practice evenly across Physics, Chemistry, and Mathematics."
                });
            }
        };
        fetchSummaries();
    }, [reports, apiKey]);

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: WidgetId) => { dragItem.current = id; setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; }, []);
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, id: WidgetId) => { if (dragItem.current !== id) { dragOverItem.current = id; setDragOverId(id); } }, []);
    const handleDragEnd = useCallback(() => {
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
    }, []);
    const handleDragLeave = useCallback(() => setDragOverId(null), []);

    const toggleWidgetVisibility = useCallback((widgetId: WidgetId, visible: boolean) => { setLayout(prevLayout => prevLayout.map(w => w.id === widgetId ? { ...w, visible } : w)); }, []);
    const handleToggleWidgetSize = useCallback((widgetId: WidgetId) => { setLayout(prevLayout => prevLayout.map(w => w.id === widgetId ? { ...w, size: w.size === 'normal' ? 'wide' : 'normal' } : w)); }, []);

    const processedReports = useMemo(() => reports.map(r => ({ ...r, testDate: new Date(r.testDate).toLocaleDateString('en-CA'), })).sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()), [reports]);
    const reflections = useJeeStore(state => state.reflections);

    const kpiData = useDashboardKpis(processedReports, logs, longTermGoals);

    // Calculate Readiness for Gauge
    const readinessScore = useMemo(() => {
        const accuracyWeight = 0.4;
        const consistencyWeight = 0.3;
        const scoreTrendWeight = 0.3;
        const accuracyScore = Math.min(100, kpiData.latestAccuracy);
        const consistency = kpiData.consistencyScore;
        let trendScore = 50;
        if (kpiData.scoreComparison?.trend === 'up') trendScore += 20;
        if (kpiData.scoreComparison?.trend === 'down') trendScore -= 20;
        return (accuracyScore * accuracyWeight) + (consistency * consistencyWeight) + (trendScore * scoreTrendWeight);
    }, [kpiData]);

    const weakestSubjectName = 'Physics';

    const historicalAccuracy = useMemo(() => {
        const acc = { physics: 0, chemistry: 0, maths: 0 };
        const counts = { physics: 0, chemistry: 0, maths: 0 };
        reports.forEach(r => {
            (['physics', 'chemistry', 'maths'] as const).forEach(sub => {
                 acc[sub] += r[sub].correct;
                 counts[sub] += (r[sub].correct + r[sub].wrong);
            });
        });
        return {
            physics: counts.physics ? (acc.physics / counts.physics) * 100 : 0,
            chemistry: counts.chemistry ? (acc.chemistry / counts.chemistry) * 100 : 0,
            maths: counts.maths ? (acc.maths / counts.maths) * 100 : 0
        };
    }, [reports]);

    const handleGenerateAiAnalysis = useCallback(async () => {
        if (!apiKey) { setAiAnalysis({ content: '', isLoading: false, error: "API Key not set." }); return; }
        setAiAnalysis({ content: '', isLoading: true, error: null });
        try {
            // Uses the selected model for deep analysis
            const result = await getAIAnalysis(reports, logs, apiKey, modelName);
            setAiAnalysis({ content: result, isLoading: false, error: null });
            
            const getLocalDateStr = (date: Date = new Date()) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            const todayStr = getLocalDateStr();
            setAiAnalysisHistory(prev => {
                const updated = { ...prev, [todayStr]: result };
                localStorage.setItem('aiAnalysisHistory_v1', JSON.stringify(updated));
                return updated;
            });
            setSelectedAiAnalysisDate(todayStr);
        } catch (e) {
            setAiAnalysis({ content: '', isLoading: false, error: e instanceof Error ? e.message : 'An unknown error occurred.' });
        }
    }, [apiKey, reports, logs, modelName]);

    // --- ORACLE HANDLER ---
    const handleConsultOracle = useCallback(async () => {
        setIsOracleLoading(true);
        // Identify weak topics manually here or reuse analytics hook logic
        // For simplicity, we calculate on the fly
        const errorCounts: Record<string, {count: number, reasons: Record<string, number>}> = {};
        logs.forEach(l => {
            // Include partially correct as 'wrong' for drill purposes
            if ((l.status === 'Wrong' || l.status === 'Partially Correct') && l.topic && l.topic !== 'N/A') {
                if (!errorCounts[l.topic]) errorCounts[l.topic] = { count: 0, reasons: {} };
                errorCounts[l.topic].count++;
                if (l.reasonForError) {
                    errorCounts[l.topic].reasons[l.reasonForError] = (errorCounts[l.topic].reasons[l.reasonForError] || 0) + 1;
                }
            }
        });

        // Convert to array and sort
        const sortedErrors = Object.entries(errorCounts)
            .map(([topic, data]) => {
                const topReason = Object.entries(data.reasons).sort((a,b) => b[1] - a[1])[0];
                return { topic, count: data.count, reason: topReason ? topReason[0] : 'General Error' };
            })
            .sort((a, b) => b.count - a.count);

        if (sortedErrors.length === 0) {
            alert("The Oracle needs more error data to generate a prophecy.");
            setIsOracleLoading(false);
            return;
        }

        try {
            const questions = await generateOracleDrill(sortedErrors, apiKey, modelName);
            setOracleQuestions(questions);
            setIsOracleOpen(true);
        } catch (e) {
            console.error("Oracle Failed", e);
            alert("The Oracle is currently silent (API Error). Try again.");
        } finally {
            setIsOracleLoading(false);
        }
    }, [logs, apiKey, modelName]);

    // --- SAVE STRATEGY HANDLER ---
    const handleSaveStrategy = (strategy: ExamStrategy) => {
        onUpdateProfile(prev => ({
            ...prev,
            examStrategy: strategy
        }));
        // Note: The parent App.tsx useEffect will handle persisting `userProfile` to localStorage/DB
    };

    // Stable metadata only - NO JSX components here, so this never recreates on scroll/hover
    const WIDGET_META: Record<WidgetId, { title: string; getDataForInsight: () => string; info: React.ReactNode; }> = useMemo(() => ({
        oracle:             { title: "The Oracle",                        getDataForInsight: () => "The Oracle predicts your future failure points based on past error logs.",                                                                               info: "The Oracle generates a custom micro-test based on your most frequent error patterns." },
        calibration:        { title: "Dunning-Kruger Detector",            getDataForInsight: () => "Analyze the calibration matrix to identify blind spots where confidence exceeds competence.",                                                          info: "Maps your confidence vs. actual competence. 'Blind Spots' (High Confidence, Low Score) are dangerous." },
        competitors:        { title: "Shadow Competitors",                 getDataForInsight: () => "Analyze performance against simulated AI personas.",                                                                                                    info: "Compares your latest test score against AI-simulated personas." },
        heatmap:            { title: "Test Activity Heatmap",              getDataForInsight: () => `Analyze activity from ${reports.length} tests over the past year.`,                                                                                    info: "Heatmap of test-taking frequency and average score over the past year." },
        weaknessHeatmap:    { title: "Weakness Matrix",                    getDataForInsight: () => `Analyze weakness matrix for ${logs.length} question logs.`,                                                                                             info: "Highlights topics with highest error rates. Red = >70% error rate." },
        performanceTrend:   { title: "Performance Trend (Total Score)",    getDataForInsight: () => `Analyze the score trend: ${processedReports.map(r => r.total.marks).join(', ')}.`,                                                                    info: "Tracks total score across all tests." },
        subjectComparison:  { title: "Subject Marks Comparison",           getDataForInsight: () => `Analyze subject contributions for the latest test.`,                                                                                                    info: "Stacked bar chart showing subject contribution per test." },
        subjectStrengthsRadar: { title: "Average of Subjects",            getDataForInsight: () => `Radar plot data: ${JSON.stringify(kpiData.radarData)}.`,                                                                                                info: "Average marks scored in each subject over last 3 tests." },
        percentilePredictor:{ title: "Percentile Predictor",              getDataForInsight: () => `Analyze predicted percentile: ${kpiData.percentileData?.predictedPercentile}`,                                                                          info: "Predicts your future percentile based on current trajectory." },
        rankPredictor:      { title: "Bayesian Rank Predictor",            getDataForInsight: () => `Analyze rank prediction range: ${kpiData.rankPrediction?.bestCase} - ${kpiData.rankPrediction?.worstCase}`,                                           info: "Probabilistic model to estimate your likely rank range." },
        strategicROI:       { title: "Strategic ROI Engine",               getDataForInsight: () => "Analyze strategic ROI bubble chart.",                                                                                                                   info: "Classifies topics into Quick Wins, Big Bets, etc." },
        paperStrategy:      { title: "Paper Strategy Simulator",           getDataForInsight: () => "Analyze paper strategy simulation.",                                                                                                                    info: "Simulate time allocation strategies to see score impact." },
        volatility:         { title: "Consistency & Volatility (Sharpe Ratio)", getDataForInsight: () => `Analyze Sharpe ratio: ${kpiData.volatilityMetrics.sharpeRatio}.`,                                                                               info: "Score stability relative to standard deviation." },
        rankSimulator:      { title: "What-If Rank Simulator",             getDataForInsight: () => "Analyze simulated rank improvements.",                                                                                                                  info: "Simulate how improving subject marks impacts predicted rank." },
        goalProgress:       { title: "Long-Term Goals",                    getDataForInsight: () => `Analyze progress on ${longTermGoals.length} long-term goals.`,                                                                                          info: "Track your progress towards target score and rank milestones." },
        reflections:        { title: "Recent Journal Entries",             getDataForInsight: () => `Analyze ${reflections.length} recent reflections.`,                                                                                                     info: "Displays your recent exam reflections and key learnings." },
        subjectRelativity:  { title: "Subject Velocity & Momentum",        getDataForInsight: () => "Analyze subject velocity.",                                                                                                                             info: "Tracks score momentum across Physics, Chemistry, and Maths." },
        avgMarksBar:        { title: "Subject Score Averages",             getDataForInsight: () => "Analyze subject average marks.",                                                                                                                        info: "Average marks per subject across selected tests." },
        weakestLink:        { title: "Weakest Subject Alert",              getDataForInsight: () => "Analyze weakest subject link.",                                                                                                                         info: "Flags the subject pulling down your overall score the most." },
        timeAllocation:     { title: "Time Allocation Efficiency",         getDataForInsight: () => "Analyze time allocation.",                                                                                                                              info: "Compares time spent vs marks scored per subject." },
        negativeMarks:      { title: "Negative Marks Drain",               getDataForInsight: () => "Analyze negative marks.",                                                                                                                              info: "Tracks lost marks from wrong attempts." },
        peerComparison:     { title: "Cohort Percentile Position",         getDataForInsight: () => "Analyze cohort percentile.",                                                                                                                           info: "Compares your performance against peer cohorts." },
        topperGap:          { title: "Distance to AIR Top 100",            getDataForInsight: () => "Analyze topper gap.",                                                                                                                                   info: "Shows score gap to Top 100 benchmark." },
        subjectMasteryRings:{ title: "Subject Mastery Rings",              getDataForInsight: () => "Analyze subject mastery.",                                                                                                                              info: "Radial visualizer of subject mastery percentages." },
        errorDna:           { title: "Error Fingerprint",                  getDataForInsight: () => "Analyze error fingerprint.",                                                                                                                           info: "Breakdown of silly vs conceptual vs speed errors." },
        topStudentGap:      { title: "Top-Student Gap Engine",             getDataForInsight: () => "Analyze gap vs top 10% students, time liabilities, and careless leak radar.",                                                                           info: "Cyberpunk HUD comparing your speed, careless error leaks, and conceptual traps against cohort benchmarks." },
        aiAnalysis:         { title: "AI Chief Analyst",                   getDataForInsight: () => "AI analysis widget.",                                                                                                                                   info: "AI analysis placeholder." },
    }), [reports.length, logs.length, processedReports, kpiData.radarData, kpiData.percentileData, kpiData.rankPrediction, kpiData.volatilityMetrics.sharpeRatio, longTermGoals.length, reflections.length]);

    // Backward-compat alias so Modal/hidden panel code using WIDGETS still works
    const WIDGETS = WIDGET_META as any;

    // Renders the actual component JSX for a given widget id - called only inside the grid
    const renderWidget = useCallback((id: WidgetId): React.ReactNode => {
        switch (id) {
            case 'topStudentGap':       return <TopStudentGapWidget logs={logs} />;
            case 'oracle':              return isOracleLoading ? (<div className="flex flex-col items-center justify-center h-full text-indigo-300 animate-pulse"><span className="text-4xl mb-2">🔮</span><p className="text-sm font-bold">Consulting the threads of fate...</p></div>) : <OracleWidget onConsult={handleConsultOracle} />;
            case 'calibration':         return <CalibrationWidget logs={logs} />;
            case 'competitors':         return reports.length > 0 ? <CompetitorLeaderboard report={reports[reports.length-1]} allReports={reports} /> : <div className="flex items-center justify-center h-full text-gray-500">No test data available.</div>;
            case 'heatmap':             return <CalendarHeatmapWidget reports={processedReports} />;
            case 'weaknessHeatmap':     return <WeaknessHeatmapWidget logs={logs} />;
            case 'performanceTrend':    return <PerformanceTrendWidget data={processedReports} aiSummary={chartSummaries.performance} />;
            case 'subjectComparison':   return <SubjectComparisonWidget data={processedReports} aiSummary={chartSummaries.subject} />;
            case 'subjectStrengthsRadar': return <SubjectRadarWidget data={kpiData.radarData} />;
            case 'percentilePredictor': return kpiData.percentileData ? <PercentilePredictorWidget percentileData={kpiData.percentileData} /> : <div className="flex items-center justify-center h-full text-gray-500">Not enough data.</div>;
            case 'rankPredictor':       return <RankPredictorWidget reports={reports} onNavigate={setView} />;
            case 'strategicROI':        return <StrategicROIWidget data={kpiData.strategicROI} onPointClick={onStartFocusSession} />;
            case 'paperStrategy':       return <PaperStrategyWidget historicalAccuracy={historicalAccuracy} userTargetTimes={userProfile.targetTimePerQuestion} savedStrategy={userProfile.examStrategy} onSave={handleSaveStrategy} />;
            case 'volatility':          return <VolatilityWidget volatilityMetrics={kpiData.volatilityMetrics} />;
            case 'rankSimulator':       return <RankSimulatorWidget rankModel={kpiData.rankModel} currentAvg={kpiData.avgScores} />;
            case 'goalProgress':        return <GoalProgressWidget goals={longTermGoals} />;
            case 'reflections':         return <ReflectionsWidget reflections={reflections} />;
            case 'subjectRelativity':   return <SubjectRelativityWidget reports={processedReports} />;
            case 'avgMarksBar':         return <AvgMarksBarWidget reports={processedReports} />;
            case 'weakestLink':         return <WeakestLinkWidget reports={processedReports} />;
            case 'timeAllocation':      return <TimeAllocationWidget logs={logs} />;
            case 'negativeMarks':       return <NegativeMarksWidget reports={processedReports} />;
            case 'peerComparison':      return <PeerComparisonWidget logs={logs} />;
            case 'topperGap':           return <TopperGapWidget reports={processedReports} />;
            case 'subjectMasteryRings': return <SubjectMasteryRingsWidget reports={processedReports} />;
            case 'errorDna':            return <ErrorDnaWidget logs={logs} />;
            case 'aiAnalysis':          return <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-300 text-sm">Use the Root Cause tab for deep AI diagnostic insights.</div>;
            default:                    return null;
        }
    }, [isOracleLoading, handleConsultOracle, logs, reports, processedReports, chartSummaries, kpiData, onStartFocusSession, historicalAccuracy, userProfile.targetTimePerQuestion, userProfile.examStrategy, reflections, longTermGoals]);
    
    const hiddenWidgets = DEFAULT_DASHBOARD_LAYOUT.filter(w => !layout.find(l => l.id === w.id)?.visible);

    const WIDGET_META_REF = useRef<any>(null);
    WIDGET_META_REF.current = WIDGET_META;

    const handleMouseEnterWidget = useCallback((widgetId: WidgetId) => {
        if (!enableAiInsights) return;
        if (insightTimeoutRef.current) clearTimeout(insightTimeoutRef.current);
        insightTimeoutRef.current = window.setTimeout(async () => {
            setContextualInsight({ widgetId, isLoading: true, text: '' });
            try {
                const prompt = WIDGET_META_REF.current?.[widgetId]?.getDataForInsight?.();
                if (!prompt) return;
                const insight = await generateContextualInsight(prompt, apiKey);
                setContextualInsight({ widgetId, isLoading: false, text: insight });
            } catch (error) {
                setContextualInsight(prev => (prev.widgetId === null && !prev.isLoading && !prev.text ? prev : { widgetId: null, isLoading: false, text: '' }));
            }
        }, 1200);
    }, [enableAiInsights, apiKey]);

    const handleMouseLeaveWidget = useCallback(() => {
        if (insightTimeoutRef.current) {
            clearTimeout(insightTimeoutRef.current);
            insightTimeoutRef.current = null;
        }
        if (!enableAiInsights) return;
        setContextualInsight(prev => {
            if (prev.widgetId === null && !prev.isLoading && prev.text === '') return prev;
            return { widgetId: null, isLoading: false, text: '' };
        });
    }, [enableAiInsights]);

    const handleChartClick = useCallback((widgetId: WidgetId) => {
        setEnlargedWidget(widgetId);
    }, []);

    const handleInfoClick = useCallback((widgetId: WidgetId) => {
        setActiveWidgetHelpId(widgetId);
    }, []);

    const handleHideWidget = useCallback((widgetId: WidgetId) => {
        toggleWidgetVisibility(widgetId, false);
    }, [toggleWidgetVisibility]);

    const handleResizeWidget = useCallback((widgetId: WidgetId) => {
        handleToggleWidgetSize(widgetId);
    }, [handleToggleWidgetSize]);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center flex-wrap gap-4">
                 <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-cyan-300">Dashboard</h2>
                    <button 
                        onClick={() => setIsOracleOpen(true)}
                        className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-1.5 rounded-full border border-purple-500/30 text-xs font-bold transition-all animate-pulse"
                    >
                        <span>🔮</span> Consult Oracle
                    </button>
                 </div>
                 <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                     <button
                         type="button"
                         onClick={() => setIsFocusMode(!isFocusMode)}
                         className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                             isFocusMode 
                             ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                             : 'glass-panel border-slate-700 text-gray-400 hover:text-white'
                         }`}
                         title="Toggle Focus Mode to hide complex charts and focus on key metrics."
                     >
                         <span>🎯</span>
                         <span>Focus</span>
                     </button>
                     <button
                         type="button"
                         onClick={() => setEnableAiInsights(!enableAiInsights)}
                         className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                             enableAiInsights 
                             ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                             : 'glass-panel border-slate-700 text-gray-400 hover:text-white'
                         }`}
                         title="Hover over or tap a chart for AI-powered insights."
                     >
                         <span>✨</span>
                         <span>AI</span>
                     </button>
                     <Button size="sm" variant={isCustomizing ? 'primary' : 'secondary'} onClick={() => setIsCustomizing(!isCustomizing)} className="text-xs px-3 py-1">
                         {isCustomizing ? 'Done' : 'Customize'}
                     </Button>
                 </div>
            </div>
            
            <MissionBriefingCard onStartFocusSession={onStartFocusSession} onOpenPlanner={() => setView('daily-planner' as any)} logs={logs} />

            <InsightBanner reports={reports} apiKey={apiKey} />

            {/* Quick Tactical Strategy & Command Center Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <React.Suspense fallback={<div className="h-40 bg-slate-900/50 animate-pulse rounded-xl" />}>
                    <ExamStrategyWidget onNavigate={(v) => setView(v as any)} />
                </React.Suspense>
                <React.Suspense fallback={<div className="h-40 bg-slate-900/50 animate-pulse rounded-xl" />}>
                    <ExamDayWidget targetExam={userProfile.targetExams?.[0] || 'JEE Mains 2026'} onNavigate={(v) => setView(v as any)} />
                </React.Suspense>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard 
                    title="Latest Score" 
                    value={kpiData.latestScore} 
                    comparison={kpiData.scoreComparison} 
                    trendData={kpiData.scoreTrend} 
                    onClick={() => setActiveKpiModal({ title: "Total Score", metricKey: "total.marks" })} 
                />
                <KPICard 
                    title="Latest Rank" 
                    value={kpiData.latestRank} 
                    comparison={kpiData.rankComparison} 
                    trendData={kpiData.rankTrend}
                    onClick={() => setActiveKpiModal({ title: "Rank", metricKey: "total.rank" })}
                />
                <KPICard 
                    title="Latest Accuracy" 
                    value={kpiData.latestAccuracy} 
                    suffix="%" 
                    comparison={kpiData.accuracyComparison} 
                    trendData={kpiData.accuracyTrend}
                    onClick={() => setActiveKpiModal({ title: "Accuracy", metricKey: "totalMetrics.accuracy" })}
                />
                <KPICard 
                    title="Weakest Subject" 
                    value={weakestSubjectName}
                    subtitle="Needs Attention"
                    action={{ label: 'Sprint', onClick: () => onStartFocusSession(weakestSubjectName) }} 
                />
                <KPICard title="Readiness" value={readinessScore} isGauge />
            </div>

            <div className="flex gap-6 relative">
                {isFocusMode ? (
                    <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center animate-fade-in">
                        <h3 className="text-3xl font-light text-slate-400 mb-4">Focus Mode</h3>
                        <div className="text-6xl font-bold text-rose-400 mb-8 tracking-tight">
                            {weakestSubjectName}
                        </div>
                        <p className="text-xl text-slate-300 mb-12 max-w-2xl">
                            This is your weakest area right now. Eliminate distractions and focus solely on improving this subject.
                        </p>
                        <Button 
                            variant="primary" 
                            className="text-lg px-8 py-4 rounded-full shadow-lg shadow-cyan-500/20"
                            onClick={() => onStartFocusSession(weakestSubjectName)}
                        >
                            Start Deep Work Session
                        </Button>
                    </div>
                ) : (
                    <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6" onDragOver={(e) => e.preventDefault()}>
                        {reports.length === 0 ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-[28rem] glass-panel p-4 rounded-2xl flex flex-col justify-between">
                                    <Skeleton className="h-6 w-48 mb-4" />
                                    <Skeleton className="flex-grow w-full rounded-xl" />
                                </div>
                            ))
                        ) : (
                            layout.filter(w => w.visible).map((widget) => {
                                const widgetMeta = WIDGET_META[widget.id];
                                if (!widgetMeta) return null;

                                return (
                                    <DashboardWidgetWrapper
                                        key={widget.id}
                                        widget={widget}
                                        widgetConfig={widgetMeta}
                                        renderContent={() => renderWidget(widget.id)}
                                        isCustomizing={isCustomizing}
                                        draggingId={draggingId}
                                        dragOverId={dragOverId}
                                        contextualInsight={contextualInsight}
                                        onChartClick={handleChartClick}
                                        onMouseEnter={enableAiInsights ? handleMouseEnterWidget : undefined}
                                        onMouseLeave={enableAiInsights ? handleMouseLeaveWidget : undefined}
                                        onInfoClick={handleInfoClick}
                                        onHide={handleHideWidget}
                                        onResize={handleResizeWidget}
                                        onDragStart={handleDragStart}
                                        onDragEnter={handleDragEnter}
                                        onDragEnd={handleDragEnd}
                                        onDragLeave={handleDragLeave}
                                    />
                                );
                            })
                        )}
                    </main>
                )}

                 {isCustomizing && !isFocusMode && (
                     <aside className="hidden lg:block w-64 flex-shrink-0 animate-fade-in sticky top-6 h-fit">
                         <div className="bg-slate-800/90 border-dashed border-2 border-slate-600 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-gray-300">Hidden Widgets</h3>
                            <div className="space-y-3 min-h-[100px]">
                                {hiddenWidgets.length === 0 ? <p className="text-sm text-gray-500 text-center italic">All widgets visible</p> : null}
                                {hiddenWidgets.map(defaultWidget => {
                                    const widgetConfig = WIDGETS[defaultWidget.id];
                                    return (
                                        <div key={defaultWidget.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-md border border-slate-700 shadow-sm">
                                            <span className="text-sm text-gray-300 font-medium">{widgetConfig.title}</span>
                                            <Button variant="secondary" size="sm" onClick={() => toggleWidgetVisibility(defaultWidget.id, true)}>Show</Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                         <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-800/50 text-sm text-blue-200">
                            <p className="flex items-start gap-2">
                                <span className="text-lg">💡</span>
                                <span>Drag widgets to reorder. Use the buttons on widgets to resize or hide them.</span>
                            </p>
                        </div>
                    </aside>
                )}
            </div>

            {/* Bottom Layer: Next Best Action */}
            {!isFocusMode && (
                <div className="mt-12 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Ready to improve?</h3>
                        <p className="text-slate-400 max-w-xl">
                            Based on your recent performance, we recommend focusing on <span className="text-cyan-400 font-semibold">{kpiData.strongestSubject.name === 'Physics' ? 'Maths' : 'Physics'}</span>. Generate a targeted practice set to address your specific weaknesses.
                        </p>
                    </div>
                    <Button 
                        variant="primary" 
                        className="whitespace-nowrap px-8 py-4 text-lg rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
                        onClick={() => onStartFocusSession(kpiData.strongestSubject.name === 'Physics' ? 'Maths' : 'Physics')}
                    >
                        Generate Practice Set
                    </Button>
                </div>
            )}
            
             <Modal isOpen={!!enlargedWidget} onClose={() => setEnlargedWidget(null)} title={enlargedWidget ? WIDGETS[enlargedWidget].title : ''}>
                {enlargedWidget ? WIDGETS[enlargedWidget].component : null}
            </Modal>
            
            {/* ORACLE CHAMBER MODAL (Full Screen Override) */}
            {isOracleOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in">
                    <OracleChamber 
                        questions={oracleQuestions} 
                        onClose={() => setIsOracleOpen(false)} 
                        onComplete={(score) => {
                            console.log("Drill Score:", score);
                        }} 
                    />
                </div>
            )}

            {activeWidgetHelpId && (
                <WidgetInfoModal 
                    isOpen={Boolean(activeWidgetHelpId)} 
                    onClose={() => setActiveWidgetHelpId(null)} 
                    data={getWidgetHelpData(activeWidgetHelpId, WIDGETS[activeWidgetHelpId as WidgetId]?.title as string, WIDGETS[activeWidgetHelpId as WidgetId]?.info)} 
                />
            )}
            <Modal isOpen={!!infoModalContent} onClose={() => setInfoModalContent(null)} title={infoModalContent?.title || ''} isInfo={true}>
                <div className="text-sm text-gray-300 space-y-2">{infoModalContent?.content}</div>
            </Modal>
            {activeKpiModal && (
                <KPIModal 
                    title={activeKpiModal.title} 
                    metricKey={activeKpiModal.metricKey} 
                    reports={processedReports} 
                    onClose={() => setActiveKpiModal(null)} 
                />
            )}
        </div>
    );
};
