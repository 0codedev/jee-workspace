import React, { useMemo, useState } from 'react';
import { UserProfile, ChapterProgress, SyllabusStatus } from '../../types';
import { JEE_SYLLABUS } from '../../constants';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Sliders, ChevronDown } from 'lucide-react';

interface StrategicPlannerProps {
    userProfile: UserProfile;
    onUpdateTargetExam?: (targetDate: string, bufferDays: number) => void;
}

export const StrategicPlanner: React.FC<StrategicPlannerProps> = ({ userProfile, onUpdateTargetExam }) => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Exam Presets (Target Academic Seasons)
    const examPresets = [
        { label: 'JEE Main Jan (Session 1)', date: '2025-01-22' },
        { label: 'JEE Main Apr (Session 2)', date: '2025-04-01' },
        { label: 'JEE Advanced (May)', date: '2025-05-18' }
    ];

    const currentTargetDate = userProfile.targetExamDate || '2025-04-01';
    const currentBufferDays = userProfile.syllabusCompletionBufferDays ?? 45;

    const [selectedDate, setSelectedDate] = useState<string>(currentTargetDate);
    const [selectedBuffer, setSelectedBuffer] = useState<number>(currentBufferDays);

    const { 
        velocity, 
        requiredVelocity, 
        isOnTrack, 
        remainingChapters, 
        completedCount,
        allChaptersCount,
        daysLeft,
        projectedCompletionDate,
        bufferDeadlineDate,
        slackDays
    } = useMemo(() => {
        if (!userProfile?.syllabus) {
            return { 
                velocity: 0, 
                requiredVelocity: null, 
                isOnTrack: null, 
                remainingChapters: 0, 
                completedCount: 0,
                allChaptersCount: 0,
                daysLeft: 0,
                projectedCompletionDate: null,
                bufferDeadlineDate: null,
                slackDays: 0
            };
        }
        
        const syllabusValues = Object.values(userProfile.syllabus) as Partial<ChapterProgress>[];
        const completed = syllabusValues
            .filter(p => p?.completionDate && (p.status === SyllabusStatus.Completed || p.status === SyllabusStatus.Revising))
            .map(p => ({ date: new Date(p!.completionDate!) }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        const totalChapters = Object.values(JEE_SYLLABUS).flatMap(subject => subject.flatMap(unit => unit.chapters)).length;
        const remaining = totalChapters - completed.length;

        let actualVel = 0;
        if (completed.length >= 2) {
            const firstDate = completed[0].date;
            const lastDate = completed[completed.length - 1].date;
            const daysElapsed = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24) || 1;
            actualVel = (completed.length / daysElapsed) * 7;
        } else if (completed.length === 1) {
            actualVel = 1.0; // Baseline fallback
        }

        let requiredVel: number | null = null;
        let onTrackStatus: 'ahead' | 'behind' | 'on_track' | null = null;
        let days = 0;
        let projectedComp: Date | null = null;
        let targetBufferDate: Date | null = null;
        let calculatedSlack = 0;

        const effectiveExamDateStr = userProfile.targetExamDate || selectedDate;
        if (effectiveExamDateStr) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const examDate = new Date(effectiveExamDateStr);
            examDate.setHours(0, 0, 0, 0);
            
            const diffTime = examDate.getTime() - today.getTime();
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (remaining > 0) {
                const bufferDays = userProfile.syllabusCompletionBufferDays ?? selectedBuffer;
                targetBufferDate = new Date(examDate);
                targetBufferDate.setDate(examDate.getDate() - bufferDays);

                const daysForStudy = (targetBufferDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

                if (daysForStudy > 0) {
                    requiredVel = (remaining / daysForStudy) * 7;
                    if (actualVel >= requiredVel * 1.05) onTrackStatus = 'ahead';
                    else if (actualVel < requiredVel * 0.9) onTrackStatus = 'behind';
                    else onTrackStatus = 'on_track';
                } else {
                    requiredVel = Infinity;
                    onTrackStatus = 'behind';
                }

                // Calculate Projected Completion Date based on actual velocity
                if (actualVel > 0) {
                    const daysToFinish = (remaining / actualVel) * 7;
                    projectedComp = new Date(today);
                    projectedComp.setDate(today.getDate() + Math.round(daysToFinish));

                    calculatedSlack = Math.round((targetBufferDate.getTime() - projectedComp.getTime()) / (1000 * 60 * 60 * 24));
                }
            } else {
                onTrackStatus = 'ahead';
            }
        }
        
        return { 
            velocity: actualVel, 
            requiredVelocity: requiredVel, 
            isOnTrack: onTrackStatus, 
            remainingChapters: remaining, 
            completedCount: completed.length,
            allChaptersCount: totalChapters,
            daysLeft: days,
            projectedCompletionDate: projectedComp,
            bufferDeadlineDate: targetBufferDate,
            slackDays: calculatedSlack
        };
    }, [userProfile, selectedDate, selectedBuffer]);

    const handleSaveConfig = () => {
        if (onUpdateTargetExam) {
            onUpdateTargetExam(selectedDate, selectedBuffer);
        }
        setIsConfigOpen(false);
    };

    const statusConfig = {
        ahead: { text: 'Ahead of Schedule', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/40', icon: '🚀' },
        on_track: { text: 'On Track', color: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-500/40', icon: '⚡' },
        behind: { text: 'Pace Deficit', color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-500/40', icon: '⚠️' },
        null: { text: 'Set Exam Target', color: 'text-gray-400', bg: 'bg-slate-800/60 border-slate-700', icon: '🎯' },
    };
    const currentStatus = statusConfig[isOnTrack || 'null'];

    const completionPercentage = allChaptersCount > 0 ? Math.round((completedCount / allChaptersCount) * 100) : 0;

    return (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl mb-6 relative overflow-hidden transition-all border border-slate-700/60 shadow-xl bg-slate-900/70">
            {/* Header & Target Selector Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-slate-700/50 gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl">⏱️</span>
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Exam Countdown & Velocity Buffer Engine
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono">
                                NTA D-Day Tracking
                            </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Predictive pacing model aligning syllabus completion with mandatory revision buffer
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsConfigOpen(!isConfigOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600/70 transition-all hover:border-cyan-500/50"
                >
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Configure Target ({userProfile.targetExamDate ? new Date(userProfile.targetExamDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set Date'})</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Interactive Target Exam & Buffer Modal / Drawer */}
            {isConfigOpen && (
                <div className="mb-4 p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 animate-fade-in space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-2">Target Exam Session</label>
                            <div className="grid grid-cols-1 gap-1.5">
                                {examPresets.map(preset => (
                                    <button
                                        key={preset.date}
                                        type="button"
                                        onClick={() => setSelectedDate(preset.date)}
                                        className={`px-3 py-2 text-xs rounded-lg text-left font-medium border transition-all flex items-center justify-between ${
                                            selectedDate === preset.date
                                                ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200 shadow-sm'
                                                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                        }`}
                                    >
                                        <span>{preset.label}</span>
                                        <span className="font-mono text-[10px] text-slate-400">{preset.date}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[11px] text-slate-400">Or Custom Date:</span>
                                <input 
                                    type="date" 
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-2">
                                Revision & Mock Test Buffer ({selectedBuffer} Days Before D-Day)
                            </label>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {[30, 45, 60, 90].map(days => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => setSelectedBuffer(days)}
                                        className={`py-2 text-xs rounded-lg font-bold border transition-all ${
                                            selectedBuffer === days
                                                ? 'bg-purple-950/60 border-purple-500/70 text-purple-200'
                                                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                                        }`}
                                    >
                                        {days} Days
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Standard recommendation: 45 to 60 days buffer reserved exclusively for full-length 3-hour CBT mock tests, error analysis, and formula retention sweeps.
                            </p>
                            <div className="mt-4 flex justify-end gap-2">
                                <button 
                                    onClick={() => setIsConfigOpen(false)}
                                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveConfig}
                                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
                                >
                                    Save Exam Target
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Core 4-Card Telemetry Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
                {/* 1. Actual Weekly Velocity */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <p className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Actual Velocity</span>
                        <span className="font-mono text-[10px] text-cyan-400">Past 30d</span>
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-white tabular-nums mt-1">
                        {velocity > 0 ? velocity.toFixed(1) : '0.0'} 
                        <span className="text-xs font-normal text-slate-400 ml-1">ch/wk</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        {completedCount} of {allChaptersCount} completed ({completionPercentage}%)
                    </p>
                </div>

                {/* 2. Required Velocity for Target Buffer */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <p className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Required Pace</span>
                        <span className="font-mono text-[10px] text-purple-400">{userProfile.syllabusCompletionBufferDays ?? selectedBuffer}d Buffer</span>
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-white tabular-nums mt-1">
                        {requiredVelocity === null ? 'N/A' : isFinite(requiredVelocity) ? requiredVelocity.toFixed(1) : '∞'} 
                        <span className="text-xs font-normal text-slate-400 ml-1">ch/wk</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        {remainingChapters} chapters remaining
                    </p>
                </div>

                {/* 3. D-Day Exam Countdown */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <p className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Exam Countdown</span>
                        <span className="font-mono text-[10px] text-amber-400">{daysLeft > 0 ? `${daysLeft} Days` : 'Due'}</span>
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-white tabular-nums mt-1">
                        {daysLeft > 0 ? daysLeft : 'Set Date'} 
                        <span className="text-xs font-normal text-slate-400 ml-1">days</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        Target: {new Date(userProfile.targetExamDate || selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                {/* 4. Strategic Alignment Verdict */}
                <div className={`p-3 rounded-xl border ${currentStatus.bg}`}>
                    <p className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Pacing Verdict</span>
                        <span className="text-sm">{currentStatus.icon}</span>
                    </p>
                    <p className={`text-base sm:text-lg font-black truncate mt-1 ${currentStatus.color}`}>
                        {currentStatus.text}
                    </p>
                    <p className="text-[10px] text-slate-300 mt-0.5 truncate">
                        {isOnTrack === 'ahead' ? `+${slackDays}d buffer surplus` : isOnTrack === 'behind' ? `Need +${(Math.max(0, (requiredVelocity || 0) - velocity)).toFixed(1)} ch/wk boost` : 'On track for buffer'}
                    </p>
                </div>
            </div>

            {/* Bottom Projected Completion Timeline Ribbon */}
            {projectedCompletionDate && bufferDeadlineDate && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Projected Syllabus Finish:</span>
                        <span className="font-mono font-bold text-white">
                            {projectedCompletionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>Revision Buffer Starts:</span>
                        <span className="font-mono font-bold text-purple-300">
                            {bufferDeadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {slackDays >= 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                {slackDays} days safety margin before revision buffer
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                Syllabus spills {Math.abs(slackDays)} days into revision buffer
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};