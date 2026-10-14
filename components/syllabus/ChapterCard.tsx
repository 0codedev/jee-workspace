
import React, { useState, useMemo } from 'react';
import { Check, Paperclip, Image as ImageIcon, X, FileText, Sparkles, CalendarPlus, CheckSquare, Square, Filter } from 'lucide-react';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { ChapterProgress, QuestionLog, TestReport, SyllabusStatus, QuestionStatus, ErrorReason, UserProfile } from '../../types';
import { TOPIC_WEIGHTAGE, TOPIC_DEPENDENCIES } from '../../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { getChapterNtaStatus, isChapterPrunedByNta, isSubtopicNtaPruned } from '../../services/syllabusReductionService';

// --- Internal Helper Components ---

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-slate-800 border border-slate-600 rounded-md text-xs shadow-xl">
                <p className="font-bold text-white">{payload[0].name}</p>
                <p className="text-cyan-400">{payload[0].value} Questions</p>
            </div>
        );
    }
    return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-slate-800 border border-slate-600 rounded-md text-xs shadow-xl">
                <p className="font-bold text-white mb-1">{label}</p>
                <p className="text-cyan-400">Accuracy: {payload[0].value.toFixed(1)}%</p>
            </div>
        );
    }
    return null;
};

const MemoryBattery: React.FC<{ percentage: number; status: 'good' | 'fading' | 'critical' | 'dormant' | 'fresh'; daysAgo: number }> = ({ percentage, status, daysAgo }) => {
    let color = 'bg-slate-600';
    if (status === 'good' || status === 'fresh') color = 'bg-green-500';
    else if (status === 'fading') color = 'bg-yellow-400';
    else if (status === 'critical') color = 'bg-red-500';
    
    const blocks = Math.ceil(percentage / 25); 

    return (
        <div className="group relative flex items-center gap-1 cursor-help z-20">
            <div className="w-6 h-3 border border-slate-500 rounded-sm p-[1px] flex gap-[1px]">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-full flex-1 rounded-[1px] ${i <= blocks ? color : 'bg-transparent'}`}></div>
                ))}
            </div>
            <div className="w-[2px] h-1.5 bg-slate-500 rounded-r-sm"></div>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-md text-xs text-white p-3 rounded-lg shadow-xl border border-slate-600 relative">
                    <p className="font-bold mb-2 flex justify-between items-center border-b border-slate-700 pb-1">
                        <span className="text-gray-300">Memory Strength</span>
                        <span className={(status === 'good' || status === 'fresh') ? 'text-green-400' : status === 'fading' ? 'text-yellow-400' : status === 'critical' ? 'text-red-400' : 'text-gray-400'}>{percentage}%</span>
                    </p>
                    <div className="space-y-1">
                        <p className="text-gray-400 text-[10px] flex justify-between">
                            <span>Last Reviewed:</span>
                            <span className="text-white font-mono">{daysAgo === 0 ? 'Today' : daysAgo === -1 ? 'Never' : `${daysAgo}d ago`}</span>
                        </p>
                        <p className="text-gray-400 text-[10px] flex justify-between">
                            <span>Status:</span>
                            <span className="uppercase font-bold text-[9px] tracking-wider">{status}</span>
                        </p>
                    </div>
                    {status !== 'good' && status !== 'fresh' && status !== 'dormant' && (
                        <div className="mt-2 pt-1 border-t border-slate-700/50 text-center">
                             <span className="text-cyan-400 text-[10px] font-semibold animate-pulse">⚡ Revision Recommended</span>
                        </div>
                    )}
                    {/* Tooltip Arrow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-slate-600 rotate-45"></div>
                </div>
            </div>
        </div>
    );
};

const DependencyIndicator: React.FC<{ topic: string, userProfile: UserProfile }> = ({ topic, userProfile }) => {
    const prereqs = TOPIC_DEPENDENCIES[topic];
    if (!prereqs || prereqs.length === 0) return null;

    const incompletePrereqs = prereqs.filter(p => {
        const progress = userProfile?.syllabus[p];
        return !progress || progress.status === SyllabusStatus.NotStarted;
    });

    const isBlocked = incompletePrereqs.length > 0;

    return (
        <div className="group relative z-20">
            <span className={`text-xs px-1.5 py-0.5 rounded border cursor-help ${isBlocked ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                {isBlocked ? '⚠️ Prereq Missing' : '🔗 Prereqs OK'}
            </span>
            
             <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-slate-900/95 backdrop-blur-md text-xs text-white p-3 rounded-lg shadow-xl z-50 w-56 border border-slate-600 pointer-events-none">
                <p className="font-bold mb-2 text-gray-300 border-b border-slate-700 pb-1">Dependency Chain</p>
                <ul className="space-y-1.5">
                    {prereqs.map(p => {
                         const pProg = userProfile?.syllabus[p];
                         const pDone = pProg && (pProg.status === SyllabusStatus.Completed || pProg.status === SyllabusStatus.Revising);
                         return (
                             <li key={p} className="flex justify-between items-center">
                                 <span className={pDone ? 'text-gray-400' : 'text-white font-medium'}>{p}</span>
                                 <span className={`text-[10px] px-1.5 rounded ${pDone ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{pDone ? 'Done' : 'Missing'}</span>
                             </li>
                         )
                    })}
                </ul>
                 <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900 border-b border-r border-slate-600 rotate-45"></div>
            </div>
        </div>
    );
}

const statusColors: Record<SyllabusStatus, string> = {
    [SyllabusStatus.Completed]: "bg-green-500/10 border-green-500/30 backdrop-blur-md",
    [SyllabusStatus.Revising]: "bg-blue-500/10 border-blue-500/30 backdrop-blur-md",
    [SyllabusStatus.InProgress]: "bg-yellow-500/10 border-yellow-500/30 backdrop-blur-md",
    [SyllabusStatus.NotStarted]: "bg-slate-700/50 border-slate-700/80 backdrop-blur-md",
};

const COLORS_PIE: Record<string, string> = {
    [ErrorReason.ConceptualGap]: '#FBBF24',
    [ErrorReason.MisreadQuestion]: '#34D399',
    [ErrorReason.SillyMistake]: '#F87171',
    [ErrorReason.TimePressure]: '#818CF8',
    [ErrorReason.Guess]: '#A78BFA',
};

// --- Main Chapter Card Component ---

interface ChapterCardProps {
    chapter: { name: string, subTopics: string[] };
    progress: ChapterProgress;
    onSyllabusChange: (chapter: string, updatedProgress: Partial<ChapterProgress>) => void;
    questionLogs: QuestionLog[];
    reports: TestReport[];
    onStartFocusSession: (topic: string) => void;
    onExplainTopic: (topic: string) => void;
    userProfile: UserProfile; 
    mastery: { score: number, tier: string, color: string, bg: string };
    onTriggerQuiz: (topic: string) => void;
    onCompletionEffect: (coords: { x: number; y: number; }) => void;
    cardRef: (el: HTMLDivElement | null) => void;
    isQuizLoading?: boolean;
    forceExpanded?: boolean;
    showAIPath?: boolean;
    onGeneratePath?: (topic: string) => void;
    isGeneratingPath?: boolean;
    onCardClick?: (topic: string) => void;
    onPredictHurdles: (topic: string) => void;
    isHurdleLoading?: boolean;
    addTasksToPlanner?: (tasks: { task: string, time: number, topic: string }[]) => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({ 
    cardRef, chapter, progress, onSyllabusChange, questionLogs, reports, onStartFocusSession, onExplainTopic, 
    userProfile, mastery, onTriggerQuiz, onCompletionEffect, isQuizLoading, forceExpanded, showAIPath, 
    onGeneratePath, isGeneratingPath, onCardClick, onPredictHurdles, isHurdleLoading, addTasksToPlanner
}) => {
    const [isExpandedState, setIsExpandedState] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [subTopicFilter, setSubTopicFilter] = useState<'all' | 'mains'>('all');
    const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);
    const isExpanded = forceExpanded || isExpandedState;

    const handleNotesImagePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const currentImages: string[] = progress.chapterImages || (progress.chapterImage ? [progress.chapterImage] : []);
        const imageBlobs: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) imageBlobs.push(blob);
            }
        }
        if (imageBlobs.length > 0) {
            Promise.all(imageBlobs.map(blob => new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (evt) => resolve(evt.target?.result as string);
                reader.readAsDataURL(blob);
            }))).then(newImages => {
                const updated = [...currentImages, ...newImages];
                onSyllabusChange(chapter.name, { chapterImages: updated, chapterImage: updated[0] });
            });
        }
    };

    const weightage = TOPIC_WEIGHTAGE[chapter.name] || 'Low';
    const isHighYield = weightage === 'High';
    const ntaStatus = getChapterNtaStatus(chapter.name);
    const isPrunedChapter = isChapterPrunedByNta(chapter.name);

    // Subtopic stats & filtering
    const totalSubtopics = chapter.subTopics ? chapter.subTopics.length : 0;
    const completedSubtopicsCount = useMemo(() => {
        if (!chapter.subTopics || !progress.subTopicStatus) return 0;
        return chapter.subTopics.filter(st => !!progress.subTopicStatus?.[st]).length;
    }, [chapter.subTopics, progress.subTopicStatus]);

    const subtopicPercentage = totalSubtopics > 0 ? Math.round((completedSubtopicsCount / totalSubtopics) * 100) : 0;

    const filteredSubTopics = useMemo(() => {
        if (!chapter.subTopics) return [];
        if (subTopicFilter === 'mains') {
            return chapter.subTopics.filter(st => !isSubtopicNtaPruned(chapter.name, st));
        }
        return chapter.subTopics;
    }, [chapter.subTopics, chapter.name, subTopicFilter]);

    const handleMarkAllSubtopics = (checked: boolean) => {
        if (!chapter.subTopics) return;
        const newStatus = { ...(progress.subTopicStatus || {}) };
        chapter.subTopics.forEach(st => {
            newStatus[st] = checked;
        });
        onSyllabusChange(chapter.name, { subTopicStatus: newStatus });
    };

    const handleScheduleRemainingToPlanner = () => {
        if (!chapter.subTopics || !addTasksToPlanner) return;
        const uncompleted = chapter.subTopics.filter(st => !progress.subTopicStatus?.[st]);
        if (uncompleted.length === 0) {
            setScheduleSuccessMsg('All subtopics already completed!');
            setTimeout(() => setScheduleSuccessMsg(null), 3000);
            return;
        }

        const activeUncompleted = uncompleted.filter(st => !isSubtopicNtaPruned(chapter.name, st));
        const targetSubtopics = (activeUncompleted.length > 0 ? activeUncompleted : uncompleted).slice(0, 3);

        const tasks = targetSubtopics.map(st => ({
            task: `Subtopic Sprint: ${chapter.name} - ${st}`,
            time: 30,
            topic: chapter.name
        }));

        addTasksToPlanner(tasks);
        setScheduleSuccessMsg(`Scheduled ${tasks.length} subtopics into Daily Planner!`);
        setTimeout(() => setScheduleSuccessMsg(null), 3000);
    };

    const memoryHealth = useMemo(() => {
        let lastInteractionDate = new Date('2000-01-01');
        let hasInteraction = false;

        questionLogs.forEach(log => {
            if (log.topic === chapter.name) {
                const report = reports.find(r => r.id === log.testId);
                if (report) {
                    const date = new Date(report.testDate);
                    if (date > lastInteractionDate) {
                        lastInteractionDate = date;
                        hasInteraction = true;
                    }
                }
            }
        });

        if (!hasInteraction && progress.status === SyllabusStatus.NotStarted) return { percentage: 0, status: 'dormant' as const, daysAgo: -1 };
        if (!hasInteraction) return { percentage: 100, status: 'fresh' as const, daysAgo: 0 };

        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastInteractionDate.getTime());
        const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        const stability = 7 * (1 + (progress.revisionCount || 0) * 0.5); 
        const retention = Math.exp(-daysAgo / stability);
        const retentionPercentage = Math.round(retention * 100);

        let status: 'good' | 'fading' | 'critical' = 'good';
        if (retentionPercentage < 50) status = 'critical';
        else if (retentionPercentage < 80) status = 'fading';

        return { percentage: retentionPercentage, status, daysAgo };

    }, [questionLogs, reports, chapter.name, progress.revisionCount, progress.status]);

    const chapterStats = useMemo(() => {
        const logs = questionLogs.filter(l => l.topic === chapter.name);
        const errors = logs.filter(l => l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect);
        const errorReasons = errors.reduce((acc, log) => {
            if (log.reasonForError) {
                acc[log.reasonForError] = (acc[log.reasonForError] || 0) + 1;
            }
            return acc;
        }, {} as Record<ErrorReason, number>);
        const errorReasonData = Object.entries(errorReasons).map(([name, value]) => ({ name, value }));
        
        const attemptedLogs = logs.filter(l => l.status !== QuestionStatus.Unanswered);
        const correctLogs = logs.filter(l => l.status === QuestionStatus.FullyCorrect);

        const accuracy = (correctLogs.length + errors.length) > 0 ? (correctLogs.length / (correctLogs.length + errors.length)) * 100 : 0;
        const attemptRate = logs.length > 0 ? (attemptedLogs.length / logs.length) * 100 : 0;
        const totalMarksForAttempted = attemptedLogs.reduce((sum, l) => sum + l.marksAwarded, 0);
        const spaq = attemptedLogs.length > 0 ? (totalMarksForAttempted / attemptedLogs.length) : 0;

        const accuracyTrend = reports
            .map(report => {
                const reportLogs = questionLogs.filter(l => l.testId === report.id && l.topic === chapter.name);
                if (reportLogs.length === 0) return null;
                const reportCorrect = reportLogs.filter(l => l.status === QuestionStatus.FullyCorrect).length;
                const reportErrors = reportLogs.filter(l => l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect).length;
                if (reportCorrect + reportErrors === 0) return null;
                const acc = (reportCorrect / (reportCorrect + reportErrors)) * 100;
                return { name: report.testName, accuracy: acc };
            })
            .filter((item): item is { name: string; accuracy: number } => item !== null)
            .slice(-5);

        return { totalQuestions: logs.length, errorCount: errors.length, errorReasons: errorReasonData, accuracy, attemptRate, spaq, accuracyTrend };
    }, [questionLogs, reports, chapter.name]);

    const theoryProgress = useMemo(() => {
        const lecture = progress.lectureCompleted ? 1 : 0;
        const notes = progress.notesCompleted ? 1 : 0;
        
        if (!chapter.subTopics || chapter.subTopics.length === 0) {
            return (lecture + notes) / 2 * 100;
        }
        
        const subTopicsDone = Object.values(progress.subTopicStatus || {}).filter(Boolean).length;
        const subTopicRatio = chapter.subTopics.length > 0 ? subTopicsDone / chapter.subTopics.length : 1;
        
        return (lecture * 0.2 + notes * 0.2 + subTopicRatio * 0.6) * 100;
    }, [progress, chapter.subTopics]);

    const applicationProgress = useMemo(() => {
        const logs = questionLogs.filter(l => l.topic === chapter.name);
        const attempts = logs.length;
        if (attempts === 0) return 0;
        
        const correct = logs.filter(l => l.status === QuestionStatus.FullyCorrect).length;
        const attemptedWithOutcome = logs.filter(l => l.status === QuestionStatus.FullyCorrect || l.status === QuestionStatus.Wrong).length;
        
        const accuracy = attemptedWithOutcome > 0 ? correct / attemptedWithOutcome : 0;
        const confidence = 1 - Math.exp(-attempts / 10);
        
        return accuracy * confidence * 100;
    }, [questionLogs, chapter.name]);

    const handleUpdate = <K extends keyof ChapterProgress>(key: K, value: ChapterProgress[K]) => {
        if (key === 'status' && value === SyllabusStatus.Completed) {
            onTriggerQuiz(chapter.name);
        } else {
            onSyllabusChange(chapter.name, { [key]: value });
        }
    };

    const handleSubTopicToggle = (subTopicName: string, isChecked: boolean) => {
        const currentSubTopicStatus = progress.subTopicStatus || {};
        const newSubTopicStatus = {
            ...currentSubTopicStatus,
            [subTopicName]: isChecked
        };
        onSyllabusChange(chapter.name, { subTopicStatus: newSubTopicStatus });
    };

    const handlePracticeToggle = (key: keyof Exclude<ChapterProgress['practice'], undefined>, checked: boolean) => {
        onSyllabusChange(chapter.name, {
            practice: {
                ...(progress.practice || {}),
                [key]: checked
            }
        });
    };
    
    const ringGlowStyle: React.CSSProperties = {};
    if (progress.strength === 'strength') {
        ringGlowStyle.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.5)';
    } else if (progress.strength === 'weakness') {
        ringGlowStyle.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.5)';
    }

    // Removed 'overflow-hidden' from main wrapper to allow tooltips to pop out
    return (
        <div ref={cardRef} className={`relative rounded-lg p-px ${forceExpanded ? 'h-full min-h-[600px]' : ''}`} style={ringGlowStyle}>
            <div className={`relative rounded-lg border transition-all duration-300 ${statusColors[progress.status]} ${forceExpanded ? 'bg-slate-900 h-full border-0 overflow-y-auto custom-scrollbar' : ''}`}>
                {/* Full-height status color overlay for pop-up view */}
                {forceExpanded && (
                    <div className={`absolute inset-0 pointer-events-none opacity-[0.07] ${statusColors[progress.status].split(' ')[0]}`}></div>
                )}
                
                {isHighYield && !forceExpanded && (
                    <div className="absolute top-0 right-0 pointer-events-none z-0 w-16 h-16 overflow-hidden rounded-tr-lg">
                        <div className="bg-amber-500 text-white text-[9px] font-bold py-1 w-[120px] text-center rotate-45 absolute top-[8px] -right-[36px] shadow-sm">
                            HY
                        </div>
                    </div>
                )}
                <div className="p-3 relative">
                    <div 
                        className="flex items-center gap-4 cursor-pointer" 
                        onClick={(e) => {
                            if (forceExpanded) return;
                            if (!isExpandedState && onCardClick) {
                                onCardClick(chapter.name);
                            }
                        }}
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border shadow-inner ${mastery.bg}`}>
                            <span className="text-lg" style={{color: mastery.color}} title={`Mastery: ${mastery.tier}`}>
                                {mastery.tier === 'Grandmaster' ? '👑' : mastery.tier === 'Expert' ? '💎' : mastery.tier === 'Adept' ? '⚔️' : mastery.tier === 'Apprentice' ? '🔨' : '🌱'}
                            </span>
                        </div>
                        
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 flex-wrap relative z-10">
                                <p className={`font-semibold truncate ${isHighYield ? 'text-amber-100' : 'text-gray-200'} ${forceExpanded ? 'text-lg' : ''}`}>{chapter.name}</p>
                                <MemoryBattery percentage={memoryHealth.percentage} status={memoryHealth.status} daysAgo={memoryHealth.daysAgo} />
                                
                                {/* NTA 2024-2026 Reduction Status Badges */}
                                {isPrunedChapter && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-500/50 uppercase tracking-wide flex items-center gap-1 shadow-sm" title="Pruned from JEE Mains by NTA; relevant for JEE Advanced only">
                                        <span>✂️</span> NTA Pruned (Adv Only)
                                    </span>
                                )}
                                {!isPrunedChapter && ntaStatus === 'Partially Modified' && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/50 uppercase tracking-wide flex items-center gap-1 shadow-sm" title="Contains specific subtopics pruned by NTA for JEE Mains 2024-2026">
                                        <span>🟡</span> NTA Modified
                                    </span>
                                )}

                                {/* Priority Tag */}
                                {isHighYield && mastery.score < 80 ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 uppercase tracking-wide">🟢 ATTACK</span>
                                ) : mastery.score >= 80 ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-500/50 uppercase tracking-wide">🟡 SKIM</span>
                                ) : (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-500/50 uppercase tracking-wide">🔴 SKIP</span>
                                )}

                                {/* Two-Phase Mastery Badge */}
                                <div className="flex items-center gap-1 text-[9px] font-bold">
                                    <span className={`px-1.5 py-0.5 rounded border ${progress.status === SyllabusStatus.Completed ? 'bg-green-900/40 text-green-300 border-green-700/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        Studied {progress.status === SyllabusStatus.Completed ? '✅' : '⏳'}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded border ${mastery.score >= 80 ? 'bg-purple-900/40 text-purple-300 border-purple-700/50' : 'bg-amber-900/40 text-amber-300 border-amber-700/50'}`}>
                                        Exam-Ready {mastery.score >= 80 ? '🏆' : '⚠️'} {mastery.score}%
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1.5 mt-2">
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="w-12 text-gray-400">Theory</span>
                                    <div className="w-24 bg-slate-700/50 rounded-full h-1.5 flex-shrink-0"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${theoryProgress}%` }}></div></div>
                                    <span className="w-8 text-right font-mono text-gray-300">{theoryProgress.toFixed(0)}%</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="w-12 text-gray-400">Apply</span>
                                    <div className="w-24 bg-slate-700/50 rounded-full h-1.5 flex-shrink-0"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${applicationProgress}%` }}></div></div>
                                    <span className="w-8 text-right font-mono text-gray-300">{applicationProgress.toFixed(0)}%</span>
                                </div>
                                {chapter.subTopics && chapter.subTopics.length > 0 && (
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="w-12 text-gray-400">Subtopics</span>
                                        <div className="w-24 bg-slate-700/50 rounded-full h-1.5 flex-shrink-0">
                                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${subtopicPercentage}%` }}></div>
                                        </div>
                                        <span className="w-8 text-right font-mono text-indigo-300">{completedSubtopicsCount}/{totalSubtopics}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {!forceExpanded && chapterStats.errorCount > 0 && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 hidden sm:inline-block">{chapterStats.errorCount} Errors</span>}
                        
                        {!forceExpanded && (
                            <div 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setIsExpandedState(!isExpandedState); 
                                }}
                                className="p-1 rounded-full hover:bg-slate-700/50 transition-colors z-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        )}
                    </div>

                    {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4 animate-fade-in relative z-0">
                            <div className="flex justify-between items-center">
                                <DependencyIndicator topic={chapter.name} userProfile={userProfile} />
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-500 block">Weightage: {weightage}</span>
                                    <span className="text-[10px] font-bold" style={{color: mastery.color}}>ELO: {mastery.score}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                                    <select 
                                        value={progress.status} 
                                        onChange={e => handleUpdate('status', e.target.value as SyllabusStatus)} 
                                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md disabled:opacity-50"
                                        disabled={isQuizLoading}
                                    >
                                        {Object.values(SyllabusStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {isQuizLoading && <span className="text-[10px] text-cyan-400 mt-1 animate-pulse">Generating Quiz...</span>}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Strength/Weakness</label>
                                    <select value={progress.strength || ''} onChange={e => handleUpdate('strength', e.target.value as 'strength' | 'weakness' || null)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md">
                                        <option value="">Not Tagged</option>
                                        <option value="strength">Strength</option>
                                        <option value="weakness">Weakness</option>
                                    </select>
                                </div>
                            </div>

                            {/* Theory Checklist - Subtle Glass Pastel Chips */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">Theory Checklist</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onSyllabusChange(chapter.name, { lectureCompleted: !progress.lectureCompleted })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer select-none ${
                                            progress.lectureCompleted
                                                ? 'bg-slate-900/40 border-slate-800/80 text-slate-500 line-through'
                                                : 'bg-cyan-950/30 border-cyan-700/40 text-cyan-200 hover:bg-cyan-900/40 hover:border-cyan-600/60'
                                        }`}
                                    >
                                        Lecture Completed
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onSyllabusChange(chapter.name, { notesCompleted: !progress.notesCompleted })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer select-none ${
                                            progress.notesCompleted
                                                ? 'bg-slate-900/40 border-slate-800/80 text-slate-500 line-through'
                                                : 'bg-emerald-950/30 border-emerald-700/40 text-emerald-200 hover:bg-emerald-900/40 hover:border-emerald-600/60'
                                        }`}
                                    >
                                        Notes Prepared
                                    </button>
                                </div>
                            </div>

                            {/* Problem Practice - Subtle Glass Pastel Chips */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">Problem Practice</h4>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'mains', label: 'Mains Problems', activeStyle: 'bg-cyan-950/30 border-cyan-700/40 text-cyan-200 hover:bg-cyan-900/40' },
                                        { key: 'advanced', label: 'Adv Problems', activeStyle: 'bg-purple-950/30 border-purple-700/40 text-purple-200 hover:bg-purple-900/40' },
                                        { key: 'module', label: 'Coaching Module', activeStyle: 'bg-emerald-950/30 border-emerald-700/40 text-emerald-200 hover:bg-emerald-900/40' },
                                        { key: 'books', label: 'Other Books', activeStyle: 'bg-amber-950/30 border-amber-700/40 text-amber-200 hover:bg-amber-900/40' }
                                    ].map(p => {
                                        const isDone = !!progress.practice?.[p.key as keyof typeof progress.practice];
                                        return (
                                            <button
                                                key={p.key}
                                                type="button"
                                                onClick={() => handlePracticeToggle(p.key as any, !isDone)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer select-none ${
                                                    isDone
                                                        ? 'bg-slate-900/40 border-slate-800/80 text-slate-500 line-through'
                                                        : p.activeStyle
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sub-Topics Checklist with NTA Reduction Intelligence */}
                            {chapter.subTopics && chapter.subTopics.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold text-slate-300">Sub-Topics</h4>
                                            <span className="text-xs text-indigo-300 font-mono bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                                                {completedSubtopicsCount} / {totalSubtopics} Done ({subtopicPercentage}%)
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {/* Subtopic Filter Toggle */}
                                            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setSubTopicFilter('all')}
                                                    className={`px-2 py-0.5 rounded font-medium transition-all ${subTopicFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    All ({totalSubtopics})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSubTopicFilter('mains')}
                                                    className={`px-2 py-0.5 rounded font-medium transition-all ${subTopicFilter === 'mains' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                                    title="Hide topics pruned from JEE Mains by NTA"
                                                >
                                                    Mains Core
                                                </button>
                                            </div>

                                            {/* Bulk Toggle Buttons */}
                                            <button
                                                type="button"
                                                onClick={() => handleMarkAllSubtopics(true)}
                                                className="px-2 py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1"
                                                title="Mark all subtopics in this chapter as completed"
                                            >
                                                <CheckSquare className="w-3 h-3" />
                                                <span>Check All</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMarkAllSubtopics(false)}
                                                className="px-2 py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center gap-1"
                                                title="Clear all subtopic checks"
                                            >
                                                <Square className="w-3 h-3" />
                                                <span>Clear</span>
                                            </button>

                                            {/* 1-Click Inject to Daily Planner */}
                                            {addTasksToPlanner && (
                                                <button
                                                    type="button"
                                                    onClick={handleScheduleRemainingToPlanner}
                                                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 transition-all shadow-sm"
                                                    title="Schedule uncompleted subtopics as 30-min sprints in Daily Planner"
                                                >
                                                    <CalendarPlus className="w-3 h-3 text-cyan-400" />
                                                    <span>Schedule in Planner</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Success Message Banner */}
                                    {scheduleSuccessMsg && (
                                        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
                                            <span>⚡ {scheduleSuccessMsg}</span>
                                            <button onClick={() => setScheduleSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1 bg-slate-900/40 rounded-xl border border-slate-800/60">
                                        {filteredSubTopics.map(subTopic => {
                                            const isDone = !!progress.subTopicStatus?.[subTopic];
                                            const isPruned = isSubtopicNtaPruned(chapter.name, subTopic);
                                            const isFlashcardMastered = isDone || !!progress.flashcard;
                                            
                                            return (
                                                <button
                                                    key={subTopic}
                                                    type="button"
                                                    onClick={() => handleSubTopicToggle(subTopic, !isDone)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer select-none text-left flex items-center gap-1.5 ${
                                                        isDone
                                                            ? 'bg-slate-900/60 border-slate-800/90 text-slate-500 line-through'
                                                            : isPruned
                                                            ? 'bg-rose-950/20 border-rose-800/40 text-rose-300 hover:bg-rose-900/30 hover:border-rose-600/60 border-dashed'
                                                            : 'bg-indigo-950/30 border-indigo-700/40 text-indigo-200 hover:bg-indigo-900/40 hover:border-indigo-600/60'
                                                    }`}
                                                    title={isPruned ? "Pruned by NTA in 2024 syllabus reduction; still relevant for JEE Advanced" : isFlashcardMastered ? "Mastered via Flashcards" : "Click to toggle subtopic completion"}
                                                >
                                                    <span>{subTopic}</span>
                                                    {isPruned && (
                                                        <span className="text-[9px] bg-rose-900/70 text-rose-300 px-1 py-0.2 rounded font-semibold border border-rose-700/50">
                                                            ✂️ Adv Only
                                                        </span>
                                                    )}
                                                    {isFlashcardMastered && !isPruned && (
                                                        <span className="text-[10px] bg-indigo-900/60 px-1 py-0.2 rounded text-indigo-300 font-mono">🃏</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        {filteredSubTopics.length === 0 && (
                                            <p className="text-xs text-slate-500 italic p-2">No active Mains subtopics in this view.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Chapter Quick Notes & Reflection Journal Box */}
                            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-cyan-400" />
                                        Chapter Notes & Revision Journal
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-mono">Auto-saved to SSD</span>
                                </div>
                                <textarea
                                    value={progress.notes || ''}
                                    onChange={e => onSyllabusChange(chapter.name, { notes: e.target.value })}
                                    onPaste={handleNotesImagePaste}
                                    placeholder="Write chapter notes, weak area reminders, or paste screenshots (Ctrl+V)... e.g., 'Torque equilibrium questions require free body diagrams'."
                                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y min-h-[70px]"
                                />
                                
                                {/* Multiple Image Attachment Gallery for Chapter Notes */}
                                <div className="space-y-2 pt-1">
                                    {(() => {
                                        const images: string[] = progress.chapterImages || (progress.chapterImage ? [progress.chapterImage] : []);
                                        return (
                                            <div>
                                                {images.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {images.map((imgSrc, idx) => (
                                                            <div key={idx} className="relative group/img">
                                                                <img
                                                                    src={imgSrc}
                                                                    alt={`Chapter diagram reference ${idx + 1}`}
                                                                    onClick={() => setLightboxImage(imgSrc)}
                                                                    className="w-16 h-16 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-85 transition-opacity"
                                                                    title="Click to expand high-res"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = images.filter((_, i) => i !== idx);
                                                                        onSyllabusChange(chapter.name, {
                                                                            chapterImages: updated,
                                                                            chapterImage: updated[0] || undefined
                                                                        });
                                                                    }}
                                                                    className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md transition-colors"
                                                                    title="Remove image"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                                                        <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                                                        <span>{images.length > 0 ? `Add More Photos / Diagrams (${images.length})` : 'Attach Photos / Diagrams (Multiple, Ctrl+V)'}</span>
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const files = e.target.files;
                                                                if (files && files.length > 0) {
                                                                    const fileArray = Array.from(files);
                                                                    Promise.all(fileArray.map(f => new Promise<string>((resolve) => {
                                                                        const reader = new FileReader();
                                                                        reader.onload = (evt) => resolve(evt.target?.result as string);
                                                                        reader.readAsDataURL(f);
                                                                    }))).then(newImgs => {
                                                                        const updated = [...images, ...newImgs];
                                                                        onSyllabusChange(chapter.name, {
                                                                            chapterImages: updated,
                                                                            chapterImage: updated[0]
                                                                        });
                                                                    });
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                    {images.length > 0 && (
                                                        <span className="text-[11px] text-slate-500 italic">
                                                            {images.length} {images.length === 1 ? 'image' : 'images'} stored locally
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            
                            {/* AI Learning Path & Boss Question Generator */}
                            {showAIPath && (
                                <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-semibold text-indigo-300">AI Learning & Boss Challenge</h4>
                                    </div>
                                    <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/30 text-sm space-y-2">
                                        <p className="text-gray-300 text-xs">Generate a personalized checklist or face the Boss Question.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => onGeneratePath?.(chapter.name)} 
                                                disabled={isGeneratingPath}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded text-xs shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isGeneratingPath ? (
                                                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Path...</>
                                                ) : (
                                                    <>✨ Smart Path</>
                                                )}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    alert(`👑 BOSS QUESTION CHALLENGE for ${chapter.name}:\n\nSolve a multi-concept problem covering all sub-topics in this chapter. Check AI Assistant for the challenge problem!`);
                                                    onExplainTopic?.(`Boss Question Challenge for ${chapter.name}`);
                                                }}
                                                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-3 rounded text-xs shadow-lg flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                👑 Boss Question
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Revisions</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleUpdate('revisionCount', Math.max(0, Number(progress.revisionCount || 0) - 1))} className="px-2 py-1 bg-slate-700 rounded">-</button>
                                    <span className="font-semibold text-cyan-300">{progress.revisionCount || 0}</span>
                                    <button onClick={() => handleUpdate('revisionCount', (Number(progress.revisionCount || 0) || 0) + 1)} className="px-2 py-1 bg-slate-700 rounded">+</button>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">Live Performance</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                                    <div className="bg-slate-900/50 p-2 rounded"><p className="text-gray-400">Accuracy</p><p className="font-bold text-lg text-white">{chapterStats.accuracy.toFixed(1)}%</p></div>
                                    <div className="bg-slate-900/50 p-2 rounded"><p className="text-gray-400">Attempt Rate</p><p className="font-bold text-lg text-white">{chapterStats.attemptRate.toFixed(1)}%</p></div>
                                    <div className="bg-slate-900/50 p-2 rounded"><p className="text-gray-400">SPAQ</p><p className="font-bold text-lg text-white">{chapterStats.spaq.toFixed(2)}</p></div>
                                    <div className="bg-slate-900/50 p-2 rounded h-24 flex flex-col">
                                        <p className="text-gray-400 mb-1">Accuracy Trend</p>
                                        <div className="flex-grow">
                                            {chapterStats.accuracyTrend.length > 1 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chapterStats.accuracyTrend} margin={{top: 5, right: 5, left: 5, bottom: 5}}>
                                                    <defs><linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="rgb(var(--color-primary-rgb))" stopOpacity={0.4}/><stop offset="95%" stopColor="rgb(var(--color-primary-rgb))" stopOpacity={0}/></linearGradient></defs>
                                                    <YAxis domain={[0, 100]} hide />
                                                    <RechartsTooltip content={<CustomAreaTooltip />} />
                                                    <Area type="monotone" dataKey="accuracy" stroke="rgb(var(--color-primary-rgb))" strokeWidth={2} fill="url(#sparklineGradient)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                            ) : <p className="text-gray-500 text-[10px] mt-1">Not enough data</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {chapterStats.errorCount > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Error Analysis</h4>
                                    <div className="h-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={chapterStats.errorReasons} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={5}>
                                                    {chapterStats.errorReasons.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_PIE[entry.name] || '#8884d8'} />)}
                                                </Pie>
                                                <RechartsTooltip content={<CustomPieTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap gap-2">
                                <button onClick={() => onStartFocusSession(chapter.name)} className="flex-1 text-sm bg-indigo-600/50 hover:bg-indigo-600 text-white font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2">⚡️ Start Focus</button>
                                <button onClick={() => onExplainTopic(chapter.name)} className="flex-1 text-sm bg-cyan-600/50 hover:bg-cyan-600 text-white font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2">📖 Explain</button>
                                {progress.status === SyllabusStatus.NotStarted && (
                                    <button 
                                        onClick={() => onPredictHurdles(chapter.name)} 
                                        disabled={isHurdleLoading}
                                        className="flex-1 text-sm bg-amber-600/50 hover:bg-amber-600 text-white font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isHurdleLoading ? '🔮 Predicting...' : '🔮 Predict Hurdles'}
                                    </button>
                                )}
                                <button 
                                    onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(chapter.name + " JEE")}`, '_blank')}
                                    className="text-sm bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center"
                                    title="Search on YouTube"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ImageLightboxModal 
                src={lightboxImage} 
                title={`Diagram Reference - ${chapter.name}`} 
                onClose={() => setLightboxImage(null)} 
            />
        </div>
    );
};