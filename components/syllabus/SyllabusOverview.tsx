import React from 'react';
import { UserProfile, QuestionLog, SyllabusStatus, QuestionStatus } from '../../types';
import { SubjectDonutCard } from '../visualizations/SubjectDonutCard';
import { JEE_SYLLABUS } from '../../constants';
import { useRevisionStack } from '../../hooks/useSyllabusLogic';
import { getNtaAuditSummary } from '../../services/syllabusReductionService';

export const SyllabusOverviewWidget: React.FC<{ userProfile: UserProfile; questionLogs: QuestionLog[]; reports: any[]; onStartFocusSession: (topic: string) => void }> = ({ userProfile, questionLogs, reports, onStartFocusSession }) => {
    const subjects = ['physics', 'chemistry', 'maths'];
    const revisionStack = useRevisionStack(userProfile, questionLogs, reports);

    const summaryStats = React.useMemo(() => {
        let totalChapters = 0;
        let totalCompletedChapters = 0;
        let examReadyCount = 0;
        let dangerZoneCount = 0;
        let unmasteredChapters = 0;

        let globalTotalCorrect = 0;
        let globalTotalAttempted = 0;

        const subjectStatsMap: Record<string, { total: number; completed: number; inProgress: number; notStarted: number; accuracy: number; loggedQuestions: number; completionPct: number }> = {
            physics: { total: 0, completed: 0, inProgress: 0, notStarted: 0, accuracy: 0, loggedQuestions: 0, completionPct: 0 },
            chemistry: { total: 0, completed: 0, inProgress: 0, notStarted: 0, accuracy: 0, loggedQuestions: 0, completionPct: 0 },
            maths: { total: 0, completed: 0, inProgress: 0, notStarted: 0, accuracy: 0, loggedQuestions: 0, completionPct: 0 }
        };

        subjects.forEach(subject => {
            // @ts-ignore
            const chapters = JEE_SYLLABUS[subject].flatMap((unit: any) => unit.chapters.map((c: any) => c.name));
            let totalCorrectInSub = 0;
            let totalAttemptedInSub = 0;

            chapters.forEach((chapterName: string) => {
                totalChapters++;
                subjectStatsMap[subject].total++;

                const prog = userProfile.syllabus[chapterName];
                const status = prog?.status || SyllabusStatus.NotStarted;

                if (status === SyllabusStatus.Completed) {
                    subjectStatsMap[subject].completed++;
                    totalCompletedChapters++;
                } else if (status === SyllabusStatus.InProgress || status === SyllabusStatus.Revising) {
                    subjectStatsMap[subject].inProgress++;
                } else {
                    subjectStatsMap[subject].notStarted++;
                }

                const logs = questionLogs.filter(l => l.topic === chapterName || (l.subject === subject && l.chapter === chapterName));
                const correct = logs.filter(l => l.status === QuestionStatus.FullyCorrect).length;
                const total = logs.filter(l => l.status === QuestionStatus.FullyCorrect || l.status === QuestionStatus.Wrong).length;

                totalCorrectInSub += correct;
                totalAttemptedInSub += total;
                globalTotalCorrect += correct;
                globalTotalAttempted += total;

                const accuracy = total > 0 ? (correct / total) * 100 : 0;
                
                if (accuracy >= 80 && prog?.status === SyllabusStatus.Completed) {
                    examReadyCount++;
                } else {
                    unmasteredChapters++;
                }

                const isHighYield = ['Electrostatics', 'Rotational Motion', 'Organic Chemistry', 'Calculus', 'Thermodynamics', 'Coordinate Geometry'].some(k => chapterName.includes(k));
                if (isHighYield && (!prog || prog.status === SyllabusStatus.NotStarted)) {
                    dangerZoneCount++;
                }
            });

            const subTotal = subjectStatsMap[subject].total;
            const subCompleted = subjectStatsMap[subject].completed;
            subjectStatsMap[subject].loggedQuestions = totalAttemptedInSub;
            subjectStatsMap[subject].accuracy = totalAttemptedInSub > 0 ? Math.round((totalCorrectInSub / totalAttemptedInSub) * 100) : 0;
            subjectStatsMap[subject].completionPct = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;
        });

        const estHoursRemaining = unmasteredChapters * 4;
        const dailyPaceHours = 3.5;
        const daysToReady = Math.ceil(estHoursRemaining / dailyPaceHours);
        const overallCompletionPct = totalChapters > 0 ? Math.round((totalCompletedChapters / totalChapters) * 100) : 0;
        const overallAccuracy = globalTotalAttempted > 0 ? Math.round((globalTotalCorrect / globalTotalAttempted) * 100) : 0;

        const allChaptersList = subjects.flatMap(s => 
            // @ts-ignore
            JEE_SYLLABUS[s].flatMap((unit: any) => unit.chapters.map((c: any) => c.name))
        );

        return {
            totalChapters,
            totalCompletedChapters,
            overallCompletionPct,
            overallAccuracy,
            examReadyCount,
            dangerZoneCount,
            estHoursRemaining,
            daysToReady,
            subjectStatsMap,
            allChapters: allChaptersList
        };
    }, [userProfile, questionLogs, subjects]);

    const ntaSummary = React.useMemo(() => getNtaAuditSummary(), []);

    return (
        <div className="animate-fade-in space-y-6">
            {/* NTA 2024-2026 Reduction Telemetry Ribbon */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-cyan-950/40 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                        ✂️
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                            Official NTA 2024-2026 Syllabus Rationalization Applied
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                                ~{ntaSummary.hoursSavedEstimate}h Study Time Saved
                            </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Pruned chapters and subtopics are explicitly tagged as <span className="text-rose-300 font-medium">Adv Only</span> so you avoid wasting critical hours on topics removed from JEE Mains.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end flex-shrink-0">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Mains Core Scope</p>
                        <p className="text-lg font-black text-cyan-300">{ntaSummary.activeChapters} <span className="text-xs font-normal text-slate-400">/ {ntaSummary.totalChapters} Ch</span></p>
                    </div>
                    <div className="w-px h-8 bg-slate-700"></div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Adv-Only / Pruned</p>
                        <p className="text-lg font-black text-rose-300">{ntaSummary.prunedChapters} <span className="text-xs font-normal text-slate-400">Chapters</span></p>
                    </div>
                </div>
            </div>

            {/* Syllabus Command Summary Panel (Row 1) */}
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 shadow-xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-extrabold text-cyan-300 flex items-center gap-2">
                        <span>🎯</span> Syllabus Command Summary
                    </h3>
                    <span className="text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
                        Target Pace: 3.5h/day
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Exam-Ready</p>
                        <p className="text-2xl font-black text-purple-400 mt-1">{summaryStats.examReadyCount} / {summaryStats.totalChapters}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">≥80% Mastery</p>
                    </div>
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hours Remaining</p>
                        <p className="text-2xl font-black text-cyan-400 mt-1">{summaryStats.estHoursRemaining} hrs</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">To 80% Mastery</p>
                    </div>
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Completion ETA</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">~{summaryStats.daysToReady} Days</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">At current pace</p>
                    </div>
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Danger Zone</p>
                        <p className="text-2xl font-black text-rose-400 mt-1">{summaryStats.dangerZoneCount}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">High-Yield Unstarted</p>
                    </div>
                </div>
            </div>

            {/* 4-Column Concentric Ring Gauge Cards (Overall Syllabus + Physics + Chemistry + Maths) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Overall Syllabus Donut Card */}
                <SubjectDonutCard 
                    key="overall"
                    subject="overall"
                    chapters={summaryStats.allChapters}
                    userProfile={userProfile}
                    questionLogs={questionLogs}
                />

                {/* 2, 3, 4. Subject Donut Cards */}
                {subjects.map(subject => {
                    // @ts-ignore
                    const chapters = JEE_SYLLABUS[subject].flatMap(unit => unit.chapters.map(c => c.name));
                    return (
                        <SubjectDonutCard 
                            key={subject}
                            subject={subject}
                            chapters={chapters}
                            userProfile={userProfile}
                            questionLogs={questionLogs}
                        />
                    );
                })}
            </div>

            {/* Revision Stack Visualization */}
            <div className="glass-panel p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>📚</span> Revision Priority Stack
                        </h3>
                        <p className="text-xs text-slate-400">Topics decaying in memory or showing high error density.</p>
                    </div>
                    <div className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                        {revisionStack.length} Topics Flagged
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {revisionStack.slice(0, 5).map((topic, index) => (
                        <div 
                            key={topic.name}
                            className="group relative flex items-center gap-4 p-4 glass-panel hover:bg-white/5 rounded-xl transition-all hover:translate-x-1"
                            style={{ opacity: 1 - index * 0.15 }}
                        >
                            <div className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-xs font-bold text-indigo-400">
                                {index + 1}
                            </div>
                            <div className="flex-grow">
                                <h4 className="text-sm font-semibold text-white">{topic.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${topic.reason === 'Decay' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                        {topic.reason}
                                    </span>
                                    <span className="text-[10px] text-slate-500 italic">
                                        Last Revised: {topic.lastRevised ? new Date(topic.lastRevised).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => onStartFocusSession(topic.name)}
                                    className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md transition-colors"
                                >
                                    Revise Now
                                </button>
                            </div>
                        </div>
                    ))}
                    {revisionStack.length === 0 && (
                        <div className="py-12 text-center text-slate-500 italic border-2 border-dashed border-slate-700/50 rounded-xl">
                            No topics currently require urgent revision. Great job!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
