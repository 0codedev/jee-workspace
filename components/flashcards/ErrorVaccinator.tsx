import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { QuestionLog, Flashcard, QuestionStatus, TestReport } from '../../types';
import { Button } from '../common/Button';
import { useJeeStore } from '../../store/useJeeStore';
import { generateCardSolution, enhanceCardWithAI } from '../../services/geminiService';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { FlashCardModal } from '../FlashCardModal';
import { exportFlashcardsToAnkiCsv } from '../../services/sheetParser';
import { dbService } from '../../services/dbService';
import { generateBatchCards, buildSession, GroupingMode, SessionMode, checkPrerequisites, syncAndEnrichFlashcards } from '../../services/flashcardEngine';
import { TriageScreen } from './TriageScreen';
import { BulkTagger } from './BulkTagger';
import { TopicHeatmap } from './TopicHeatmap';
import { ScheduleTab } from './ScheduleTab';
import { CyberpunkHud } from '../gamification/CyberpunkHud';
import { DualPerspectiveSprint } from '../sprints/DualPerspectiveSprint';
import { DeckShareModal } from './DeckShareModal';
import { 
    calculateRevisionMetrics, 
    calculatePriorityScore, 
    getWeightedRevisionQueue, 
    applyReviewSm2 
} from '../../services/revisionQueueService';
import { getActiveStreakCount } from '../../utils/streakEngine';
import { 
    Flame, Play, Sparkles, Filter, Search, Layers, Calendar, Tag, 
    ShieldAlert, Zap, AlertTriangle, Timer, Brain, BookOpen, Info, 
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, CheckCircle2 
} from 'lucide-react';
import { formatMathHtml } from '../ReattemptModal';

export function formatCardSnippet(text: string): string {
    if (!text) return '';

    // 1. Clean HTML tags & metadata banners
    let cleaned = text
        .replace(/<div class="p-2\.5[\s\S]*?<\/div>/gi, '')
        .replace(/^#+\s*/gm, '')
        .replace(/\*\*Error Analysis:\*\*\s*[^*]+/gi, '')
        .replace(/\*\*Context:\*\*\s*[^*]+/gi, '')
        .replace(/<b>.*?<\/b>/gi, '')
        .trim();

    // 2. If it contains raw TeX commands without enclosing $ / $$, automatically format
    if (!cleaned.includes('$') && /\\(frac|sqrt|left|right|begin|matrix|array|alpha|beta|gamma|sum|int|cdots|operatorname|mathbf|mathrm|text)\b/.test(cleaned)) {
        cleaned = cleaned.replace(/((?:[A-Za-z0-9_\^\+\-\*\/=><\(\)\{\}\s]|\\(?:frac|sqrt|left|right|begin|end|matrix|array|alpha|beta|gamma|sum|int|cdots|dots|pm|mp|times|div|le|ge|neq|approx|operatorname|mathbf|mathrm|text)\b)+)/g, (match) => {
            if (/\\(frac|sqrt|left|right|begin|matrix|array|alpha|beta|gamma|sum|int|cdots|operatorname)/.test(match)) {
                return `$${match.trim()}$`;
            }
            return match;
        });
    }

    return formatMathHtml(cleaned);
}

interface ErrorVaccinatorProps {
    logs: QuestionLog[];
    reports?: TestReport[]; 
    apiKey: string;
}

// --- 1. VISUALIZATION COMPONENT: Compact Viral Load Monitor ---
const ViralLoadMonitor: React.FC<{ logs: QuestionLog[] }> = ({ logs }) => {
    const stats = useMemo(() => {
        const counts = { physics: 0, chemistry: 0, maths: 0 };
        let total = 0;
        logs.forEach(l => {
            if (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect) {
                if (l.subject && counts[l.subject] !== undefined) {
                    counts[l.subject]++;
                    total++;
                }
            }
        });
        return { counts, total };
    }, [logs]);

    const getLevelHeight = (count: number) => Math.min(100, (count / 15) * 100);
    const getColor = (count: number) => count > 10 ? '#ef4444' : count > 5 ? '#f59e0b' : '#10b981';

    return (
        <div className="flex gap-3 p-3 bg-black/40 rounded-xl border border-slate-700/50 shadow-inner">
            {(['physics', 'chemistry', 'maths'] as const).map(subject => (
                <div key={subject} className="flex flex-col items-center gap-1.5 group">
                    <div className="relative w-8 h-16 bg-slate-800/50 rounded-full border border-slate-600 overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out opacity-80 group-hover:opacity-100"
                            style={{ 
                                height: `${getLevelHeight(stats.counts[subject])}%`, 
                                backgroundColor: getColor(stats.counts[subject]),
                                boxShadow: `0 0 10px ${getColor(stats.counts[subject])}`
                            }}
                        />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-white transition-colors">
                        {subject.slice(0, 3)}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-200">
                        {stats.counts[subject]}
                    </span>
                </div>
            ))}
        </div>
    );
};

// --- 2. HOLOGRAPHIC CARD FOR DECK MANAGER ---
const HolographicCard: React.FC<{
    card: Flashcard;
    metadata: { testName: string; testDate: string; qNum?: string };
    onSynthesize: (cardId: string) => void;
    onEnhanceAI: (card: Flashcard) => void;
    onCardClick: (card: Flashcard) => void;
    isSynthesizing?: boolean;
    isEnhancing?: boolean;
}> = ({ card, metadata, onSynthesize, onEnhanceAI, onCardClick, isSynthesizing, isEnhancing }) => {
    const [rotate, setRotate] = useState({ x: 0, y: 0 });
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
    const cardRef = useRef<HTMLDivElement>(null);

    const isTrackA = card.track === 'A' || !!card.questionHtml;
    const isStub = !isTrackA && (card.back === '__STUB__' || card.back.includes("Solution Needed"));
    const isGroupMaster = card.isGroupMaster === true;

    const borderColor = isTrackA ? 'border-teal-500/40 hover:border-teal-400 shadow-teal-950/30' :
                        isStub ? 'border-red-500/40 hover:border-red-400' :
                        isGroupMaster ? 'border-indigo-500/50 hover:border-indigo-400' :
                        'border-cyan-500/30 hover:border-cyan-400';

    const glowColor = isTrackA ? 'rgba(20, 184, 166, 0.15)' :
                      isStub ? 'rgba(239, 68, 68, 0.15)' :
                      isGroupMaster ? 'rgba(99, 102, 241, 0.2)' :
                      'rgba(6, 182, 212, 0.15)';

    const subjectColor = card.subject === 'physics' ? 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40' : 
                         card.subject === 'chemistry' ? 'text-amber-400 bg-amber-950/70 border-amber-500/40' : 
                         'text-rose-400 bg-rose-950/70 border-rose-500/40';

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        setRotate({ x: rotateX, y: rotateY });
        setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    };

    const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

    const flamesCount = card.consecutiveCorrect || 0;

    // Parse structured metadata from front text
    const rawContent = isStub 
        ? card.front 
        : (card.back && card.back !== '__STUB__' ? card.back : card.front);

    const errorMatch = rawContent.match(/\*\*Error Analysis:\*\*\s*([^*]+)/i);
    const contextMatch = rawContent.match(/\*\*Context:\*\*\s*([^*]+)/i);

    const errorAnalysisText = errorMatch ? errorMatch[1].trim() : null;
    const contextText = contextMatch ? contextMatch[1].trim() : null;

    const snippetHtml = useMemo(() => {
        if (card.questionHtml) {
            return formatMathHtml(card.questionHtml);
        }
        return formatCardSnippet(rawContent);
    }, [card.questionHtml, rawContent]);

    return (
        <div 
            className="perspective-1000 h-[300px] w-full cursor-pointer group" 
            onMouseMove={handleMouseMove} 
            onMouseLeave={handleMouseLeave}
            onClick={() => onCardClick(card)}
        >
            <div 
                ref={cardRef}
                className={`relative h-full w-full rounded-2xl border transition-all duration-200 ease-out shadow-xl hover:shadow-2xl overflow-hidden flex flex-col justify-between ${borderColor} bg-slate-900/80 backdrop-blur-xl group-hover:-translate-y-1`}
                style={{
                    transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                    background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 80%), #0f172a`
                }}
            >
                {/* 1. TOP HEADER STRIP */}
                <div className="px-3.5 py-2.5 flex justify-between items-center border-b border-slate-800/80 bg-slate-950/70 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isTrackA ? 'bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.9)]' : isStub ? 'bg-red-500/80 animate-pulse' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]'}`}></div>
                        <span className={`text-[10px] uppercase font-black tracking-widest ${isTrackA ? 'text-teal-300' : isStub ? 'text-red-400/90' : 'text-cyan-400'}`}>
                            {isTrackA ? 'ACTIVE' : (isStub ? 'STUB' : (isGroupMaster ? 'MASTER' : 'ACTIVE'))}
                        </span>
                        {card.subject && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${subjectColor}`}>
                                {card.subject.slice(0, 3)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {card.isCarelessError && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-950/90 border border-rose-500/60 text-rose-300">
                                ⚠ Careless
                            </span>
                        )}
                        {isTrackA ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-950/90 border border-teal-500/60 text-teal-300">
                                ⚡ Track A
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-900 border border-slate-700 text-slate-300">
                                📋 Track B
                            </span>
                        )}
                        {isGroupMaster && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-950/90 border border-indigo-500/70 text-indigo-300">
                                👑 Master
                            </span>
                        )}
                    </div>
                </div>

                {/* 2. SUB-HEADER STRIP */}
                <div className="px-3.5 py-1.5 bg-slate-950/40 border-b border-slate-800/50 flex justify-between items-center text-[11px] font-mono text-slate-400 shrink-0">
                    <div className="flex items-center gap-2 truncate max-w-[200px]" title={metadata.testName}>
                        <span className="text-cyan-400 font-bold">🧪 {metadata.testName || 'Question Vault'}</span>
                    </div>
                    {metadata.qNum && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 font-bold text-[11px] border border-slate-700 shrink-0">
                            Q.{metadata.qNum}
                        </span>
                    )}
                </div>

                {/* 3. CARD BODY CONTENT */}
                <div className="px-4 py-3 flex-grow flex flex-col justify-between overflow-hidden space-y-2">
                    <div className="space-y-2">
                        {/* Topic Name */}
                        <div>
                            <h4 className="text-sm font-black text-white truncate tracking-tight group-hover:text-cyan-300 transition-colors" title={card.topic}>
                                {card.topic}
                            </h4>
                            {card.chapter && (
                                <p className="text-[10px] text-slate-400 font-medium truncate">{card.chapter}</p>
                            )}
                        </div>

                        {/* Prerequisite Warning Strip */}
                        {card.prerequisitesMet === false && (
                            <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] flex items-center gap-1 font-bold">
                                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">Blocked: Needs Prereqs</span>
                            </div>
                        )}

                        {/* Question Text / Formatted Error Analysis & KaTeX Math Rendering */}
                        {errorAnalysisText ? (
                            <div className="space-y-1 text-xs">
                                <p className="text-rose-300 font-bold text-[11px] truncate">
                                    <span className="text-slate-500 font-normal">Error Analysis: </span>
                                    {errorAnalysisText}
                                </p>
                                {contextText && (
                                    <p className="text-cyan-300 text-[10px] font-mono truncate">
                                        <span className="text-slate-500 font-normal font-sans">Context: </span>
                                        {contextText}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div 
                                className="text-xs text-slate-200 line-clamp-3 leading-relaxed font-sans overflow-hidden select-none prose prose-invert prose-xs max-w-none"
                                dangerouslySetInnerHTML={{ __html: snippetHtml }}
                            />
                        )}
                    </div>

                    {/* Metadata Pill Strip */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                        <span className="font-bold text-amber-400">Level: Lvl {card.ladderLevel || 1}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-teal-400 font-bold">✨ EF: {card.easeFactor?.toFixed(1) || '2.5'}</span>
                            <span>Rev: {card.reviews || 0}</span>
                        </div>
                    </div>
                </div>

                {/* 4. BOTTOM ACTION BUTTON */}
                <div className="px-3.5 pb-3 pt-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {isTrackA ? (
                        <button
                            onClick={() => onCardClick(card)}
                            className="w-full py-2 px-3 rounded-xl bg-teal-950/70 hover:bg-teal-900 border border-teal-500/50 hover:border-teal-400 text-teal-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 transition-all transform active:scale-95"
                        >
                            <Play className="w-3.5 h-3.5 text-teal-400" />
                            <span>Practice Problem</span>
                        </button>
                    ) : isStub ? (
                        <button
                            onClick={() => onSynthesize(card.id)}
                            disabled={isSynthesizing}
                            className="w-full py-2 px-3 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/50 hover:border-red-400 text-red-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all transform active:scale-95"
                        >
                            {isSynthesizing ? (
                                <span className="animate-spin text-sm">⚙</span>
                            ) : (
                                <span className="text-red-400">☣</span>
                            )}
                            <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Vaccine'}</span>
                        </button>
                    ) : !card.aiEnhanced ? (
                        <button
                            onClick={() => onEnhanceAI(card)}
                            disabled={isEnhancing}
                            className="w-full py-2 px-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition-all transform active:scale-95"
                        >
                            {isEnhancing ? (
                                <span className="animate-spin text-sm">✨</span>
                            ) : (
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                            <span>{isEnhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => onCardClick(card)}
                            className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            <Play className="w-3 h-3 text-cyan-400" />
                            <span>Review Card</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 3. GLOBAL INFO MODAL: Laboratory 2.0 Master Intelligence Manual ---
const ErrorVaccinatorInfoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-3 sm:p-5 md:p-6 animate-fade-in"
            onClick={onClose}
        >
            {/* Ambient Glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div 
                className="w-full max-w-5xl md:max-w-6xl h-[86vh] max-h-[88vh] bg-slate-900/95 backdrop-blur-2xl border border-red-500/30 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-scale-in relative z-10"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Top Header Bar */}
                <div className="p-4 md:p-5 bg-slate-800/70 backdrop-blur-md border-b border-slate-700/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 font-bold text-lg shadow-lg shadow-red-950/50">
                            ☣
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                                <span>Laboratory 2.0 & Error Vaccinator</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300 uppercase font-bold">
                                    Intelligence Manual
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400">Complete architectural guide, symbol decoding & the single best student routine</p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/80 text-slate-300 hover:text-white flex items-center justify-center transition-all text-xs font-bold shadow backdrop-blur-md"
                        title="Close (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 hide-scrollbar text-slate-200 text-sm md:text-base leading-relaxed">
                    
                    {/* Hero Philosophy Banner */}
                    <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900/90 to-cyan-950/40 border border-red-500/30 space-y-2 shadow-lg">
                        <span className="text-xs font-mono tracking-wider text-red-400 uppercase font-bold px-2.5 py-1 bg-red-950 rounded-lg border border-red-800">
                            The Spaced Error Immunization Principle
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight pt-1">
                            Why writing errors in a notebook fails -- and how Spaced Vaccines fix it
                        </h2>
                        <p className="text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                            In physical notebooks, wrong questions are passive. You re-read them once, assume you understand the solution, and repeat the identical mistake 3 weeks later in the CBT exam hall. 
                            <strong> Laboratory 2.0</strong> turns every mistake into an active spaced-repetition vaccine using the <strong>SuperMemo-2 (SM-2) algorithm</strong>. It calculates the exact future day your brain is about to forget the solution, prompting an active recall drill right on time.
                        </p>
                    </div>

                    {/* Section 1: Track A vs Track B Explained */}
                    <div className="space-y-3">
                        <h4 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                            <span>🧬</span> Track A vs Track B (STUB) Comparison
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Track A Card */}
                            <div className="p-5 rounded-2xl bg-slate-800/80 border border-teal-500/40 space-y-3 shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-teal-300 text-sm md:text-base uppercase flex items-center gap-2">
                                        <span>⚡</span> Track A (ExamGOAL Rich Diagnostic)
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-bold">
                                        Primary Revision
                                    </span>
                                </div>
                                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                                    Created automatically when importing CBT JSON files. Contains the <strong>complete question text, high-res circuit/organic diagrams, exact 4 options (A, B, C, D), peer accuracy ease %</strong>, and official step-by-step solutions.
                                </p>
                                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-teal-300">
                                    ✓ Zero AI latency • Exact original question • Full interactive options
                                </div>
                            </div>

                            {/* Track B Card */}
                            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200 text-sm md:text-base uppercase flex items-center gap-2">
                                        <span>📋</span> Track B (STUB / Manual / OCR)
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                                        Needs Synthesis
                                    </span>
                                </div>
                                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                                    Created when logging offline paper tests. Contains the test metadata (e.g. <em>WTA-23 Q.38 Waves and Sound - Time Pressure</em>) without full paragraph text. 
                                    Clicking <strong>"Synthesize Vaccine"</strong> uses Gemini to build an active formula hook.
                                </p>
                                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400">
                                    • Fast manual logging • AI creates active recall question from metadata
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Every Term, Symbol & Abbreviation Decoded */}
                    <div className="space-y-3">
                        <h4 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                            <span>📖</span> Dictionary of All Symbols & Terminologies
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs md:text-sm">
                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                                <strong className="text-cyan-400 block text-sm">Quantum Aspirant / Tiers</strong>
                                <p className="text-slate-300">Your gamification rank based on review XP. Unlocks higher tiers (Velocity Tracker → Resonance Master → Singularity Ranker).</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                                <strong className="text-amber-400 block text-sm">Revision Streak</strong>
                                <p className="text-slate-300">Consecutive days you completed your daily scheduled reviews. Builds unbreakable daily discipline.</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                                <strong className="text-red-400 block text-sm">Due for Vaccine</strong>
                                <p className="text-slate-300">Cards that have matured under the SM-2 algorithm and are due for review today.</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                                <strong className="text-emerald-400 block text-sm">Mastered Cards</strong>
                                <p className="text-slate-300">Cards answered correctly 3+ times consecutively with review interval &gt; 21 days.</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                                <strong className="text-purple-400 block text-sm">EF (Easiness Factor)</strong>
                                <p className="text-slate-300">SM-2 ease multiplier (default 2.5). Increases when questions feel easy, shortening/lengthening future intervals.</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                                <strong className="text-rose-400 block text-sm">Careless Leak Radar</strong>
                                <p className="text-slate-300">Questions with ≥ 70% peer accuracy that you missed. Represents your easiest +20 to +40 mark recovery.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: The 4 Step-by-Step Card Flow */}
                    <div className="space-y-3">
                        <h4 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                            <span>🔄</span> The 4 Step-by-Step Card Flow (What happens when a card is clicked)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs md:text-sm">
                            <div className="p-4 rounded-2xl bg-slate-800/90 border border-cyan-500/40 space-y-2">
                                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-800">1</span>
                                <strong className="text-white block">Question Appears</strong>
                                <p className="text-slate-300">Displays question text, diagrams, and options. The answer is completely hidden.</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/90 border border-amber-500/40 space-y-2">
                                <span className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 text-xs font-mono font-bold flex items-center justify-center border border-amber-800">2</span>
                                <strong className="text-white block">Active Recall</strong>
                                <p className="text-slate-300">In your head or on scratch paper, attempt to derive the formula or solve the step.</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/90 border border-purple-500/40 space-y-2">
                                <span className="w-6 h-6 rounded-full bg-purple-950 text-purple-400 text-xs font-mono font-bold flex items-center justify-center border border-purple-800">3</span>
                                <strong className="text-white block">Diagnose & Flip</strong>
                                <p className="text-slate-300">Click <em>Recall Gap</em>, <em>Concept Trap</em>, <em>Calculation</em>, or <em>Panic</em> to flip and see the solution.</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/90 border border-emerald-500/40 space-y-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-800">4</span>
                                <strong className="text-white block">SM-2 Rating</strong>
                                <p className="text-slate-300">Rate honestly: `[1] Again` (Review today) to `[4] Easy` (Review in 7+ days). Gain XP!</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Single Best Student Workflow */}
                    <div className="p-5 md:p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                        <h4 className="text-sm md:text-base font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                            <span>🚀</span> The Single Best Daily Student Routine (Marked Example)
                        </h4>

                        <div className="space-y-3 text-xs md:text-sm text-slate-300">
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <strong className="text-white text-sm block">1. Evening Post-Mock Ingestion (5 Mins):</strong>
                                <p>After taking Mock `WTA-23`, upload via ExamGOAL Importer. Go to <strong>Lab & Triage</strong> → click <em>Synthesize All Missed Questions</em>. 18 wrong questions are immediately turned into Track A/B cards.</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <strong className="text-white text-sm block">2. Morning Brain-Activation (5 Mins):</strong>
                                <p>Every morning before school/coaching, click <strong>"Due for Vaccine"</strong> in the top header. Review the 5-10 cards scheduled for today. Cement yesterday's errors permanently.</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <strong className="text-white text-sm block">3. Pre-Study Speed Drill (10 Mins):</strong>
                                <p>Before starting a 3-hour problem block, open <strong>Dual Sprints</strong> → launch <strong>Aptitude Speed Sprint (90s)</strong>. Trains rapid decision-making under exam countdown pressure.</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <strong className="text-white text-sm block">4. Sunday Anki Mobile Sync (2 Mins):</strong>
                                <p>Click <strong>"Export Anki"</strong> to download a `.csv` and sync with Anki mobile app on your phone for quick reviews while traveling.</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Modal Bottom Bar */}
                <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between shrink-0">
                    <span className="text-xs text-slate-400 font-mono">Laboratory 2.0 • SuperMemo-2 Spaced Repetition Engine</span>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs md:text-sm font-bold transition-all shadow-md"
                    >
                        Got It, Close Manual
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- 4. MAIN ERROR VACCINATOR COMPONENT ---
export const ErrorVaccinator: React.FC<ErrorVaccinatorProps> = ({ logs, reports, apiKey }) => {
    const { 
        flashcardSession, 
        isFlashcardModalOpen, 
        startFlashcardSession, 
        closeFlashcardSession 
    } = useJeeStore();

    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [activeTab, setActiveTab] = useState<'deck' | 'sprints' | 'lab' | 'schedule'>('deck');
    const [sessionMode, setSessionMode] = useState<SessionMode>('rescue');
    const [selectedTopicBlitz, setSelectedTopicBlitz] = useState<string>('');
    const [groupingMode, setGroupingMode] = useState<GroupingMode>('auto');
    const [isBulkTaggerOpen, setIsBulkTaggerOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isDeckShareOpen, setIsDeckShareOpen] = useState(false);
    const [sprintModeOpen, setSprintModeOpen] = useState<'aptitude' | 'knowledge' | null>(null);

    // Filters
    const [subjectFilter, setSubjectFilter] = useState<'all' | 'physics' | 'chemistry' | 'maths'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'stubs' | 'prereq_blocked'>('all');
    const [trackFilter, setTrackFilter] = useState<'all' | 'track_a' | 'track_b'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Production Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(24);

    // Individual action states
    const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState<string | null>(null);

    const refreshFlashcards = async () => {
        const rawCards = await dbService.getFlashcards();
        if (logs && logs.length > 0) {
            const synced = await syncAndEnrichFlashcards(rawCards, logs);
            setFlashcards(synced);
        } else {
            setFlashcards(rawCards);
        }
    };

    useEffect(() => {
        refreshFlashcards();
    }, [logs]);

    const revisionMetrics = useMemo(() => {
        return calculateRevisionMetrics(flashcards);
    }, [flashcards]);

    const handleSynthesize = async (cardId: string) => {
        const card = flashcards.find(c => c.id === cardId);
        if (!card) return;

        setIsSynthesizing(cardId);
        try {
            const res = await generateCardSolution({
                topic: card.topic,
                front: card.front,
                chapter: card.chapter,
                subject: card.subject,
                errorCode: card.errorCode
            }, apiKey);
            const updatedCard: Flashcard = {
                ...card,
                back: res.solution,
                keyFormula: res.keyFormula,
                mnemonic: res.mnemonic,
                mutation: res.mutation,
                visual_aid: res.visual_aid,
                ladderLevel: (((card.ladderLevel || 1) + 1) as any)
            };
            await dbService.upsertFlashcard(updatedCard);
            await refreshFlashcards();
        } catch (e) {
            console.error("Synthesize failed:", e);
            alert("Failed to synthesize vaccine. Please check your Gemini API key.");
        } finally {
            setIsSynthesizing(null);
        }
    };

    const handleEnhanceAI = async (card: Flashcard) => {
        if (!apiKey) {
            alert("Please enter a Gemini API Key in Settings to enhance cards.");
            return;
        }

        setIsEnhancing(card.id);
        try {
            const enhanced = await enhanceCardWithAI(card, apiKey);
            const updatedCard: Flashcard = {
                ...card,
                keyFormula: enhanced.keyFormula,
                mnemonic: enhanced.mnemonic,
                mutation: enhanced.mutation || card.mutation,
                aiEnhanced: true
            };
            await dbService.upsertFlashcard(updatedCard);
            await refreshFlashcards();
        } catch (e) {
            console.error("Enhancement failed:", e);
            alert("Failed to enhance card with AI.");
        } finally {
            setIsEnhancing(null);
        }
    };

    const handleProcessAllNewErrors = async (mode: GroupingMode = groupingMode) => {
        const errorLogs = logs.filter(l => l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect);
        const newCards = await generateBatchCards(errorLogs, mode, reports);
        if (newCards.length === 0) {
            alert("All selected errors already have flashcards in the database.");
            return;
        }

        await dbService.upsertFlashcards(newCards);
        await refreshFlashcards();
        alert(`Successfully generated ${newCards.length} batch flashcards!`);
    };

    const handleSaveBulkTags = async (_updatedTopicMap: Record<string, string>) => {
        setIsBulkTaggerOpen(false);
        await refreshFlashcards();
    };

    const handleStartSession = () => {
        const sessionDeck = buildSession(flashcards, sessionMode, {
            topic: selectedTopicBlitz,
            subject: subjectFilter !== 'all' ? subjectFilter : undefined
        });

        if (sessionDeck.length === 0) {
            alert("No cards available for this session mode!");
            return;
        }

        startFlashcardSession(sessionDeck);
    };

    const handleExportAnki = () => {
        const vaccinatedCards = flashcards.filter(c => c.back !== '__STUB__' && !c.back.includes("Solution Needed"));
        if (vaccinatedCards.length === 0) {
            alert("No vaccinated cards to export.");
            return;
        }
        exportFlashcardsToAnkiCsv(vaccinatedCards);
    };

    // Filtered Cards
    const filteredCards = useMemo(() => {
        return flashcards.filter(card => {
            if (subjectFilter !== 'all' && card.subject !== subjectFilter) return false;
            if (statusFilter === 'stubs' && card.back !== '__STUB__') return false;
            if (statusFilter === 'active' && card.back === '__STUB__') return false;
            if (statusFilter === 'prereq_blocked' && card.prerequisitesMet !== false) return false;
            
            // Track Filter
            const isCardTrackA = card.track === 'A' || !!card.questionHtml;
            if (trackFilter === 'track_a' && !isCardTrackA) return false;
            if (trackFilter === 'track_b' && isCardTrackA) return false;

            if (searchQuery.trim().length > 0) {
                const q = searchQuery.toLowerCase();
                const matchTopic = card.topic.toLowerCase().includes(q);
                const matchChapter = card.chapter?.toLowerCase().includes(q);
                if (!matchTopic && !matchChapter) return false;
            }
            return true;
        });
    }, [flashcards, subjectFilter, statusFilter, trackFilter, searchQuery]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [subjectFilter, statusFilter, trackFilter, searchQuery, pageSize]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
    const paginatedCards = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCards.slice(start, start + pageSize);
    }, [filteredCards, currentPage, pageSize]);

    const getCardMetadata = (cardId: string) => {
        const parts = cardId.split('-');
        const qNum = parts.pop();
        const testId = parts.join('-');
        const report = reports?.find(r => r.id === testId);
        return { 
            testName: report ? report.testName : testId, 
            testDate: report ? report.testDate : 'Unknown', 
            qNum 
        };
    };

    return (
        <div className="flex flex-col h-full space-y-6 pb-20">
            {/* Header & Main Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-panel p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="relative z-10 mb-4 md:mb-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                            <span className="text-red-500 animate-pulse">☣</span> 
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-200 to-red-500">LABORATORY 2.0</span>
                        </h2>
                        <button 
                            onClick={() => setIsInfoModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold transition-all shadow-md"
                            title="Open Laboratory Intelligence Manual"
                        >
                            <Info className="w-3.5 h-3.5" />
                            <span>Guide</span>
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-[0.2em]">Contextual Flashcards & Spaced Repetition</p>
                </div>
                
                <div className="relative z-10 flex items-center gap-6">
                    <ViralLoadMonitor logs={logs} />
                </div>
            </div>

            {/* CYBERPUNK HUD STATUS & MODE LAUNCHER */}
            <CyberpunkHud 
                metrics={revisionMetrics} 
                onLaunchMode={(mode) => {
                    if (mode === 'flashcards') {
                        setActiveTab('deck');
                        handleStartSession();
                    } else {
                        setSprintModeOpen(mode);
                    }
                }}
            />

            {/* 4 TAB NAVIGATION BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700/50 pb-2 gap-3">
                <div className="flex gap-2 overflow-x-auto max-w-full pb-1 -mb-px hide-scrollbar w-full sm:w-auto">
                    <button 
                        onClick={() => setActiveTab('deck')}
                        className={`px-3 sm:px-5 py-2 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-t border-x border-b-0 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'deck' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/40 shadow-[0_-5px_15px_rgba(34,211,238,0.1)]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <span>🃏</span> Deck Manager ({flashcards.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('sprints')}
                        className={`px-3 sm:px-5 py-2 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-t border-x border-b-0 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'sprints' ? 'bg-amber-950/40 text-amber-400 border-amber-500/40 shadow-[0_-5px_15px_rgba(245,158,11,0.1)]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <span>⚡</span> Sprints
                    </button>
                    <button 
                        onClick={() => setActiveTab('lab')}
                        className={`px-3 sm:px-5 py-2 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-t border-x border-b-0 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'lab' ? 'bg-red-950/40 text-red-400 border-red-500/40 shadow-[0_-5px_15px_rgba(220,38,38,0.1)]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <span>🦠</span> Lab & Triage
                    </button>
                    <button 
                        onClick={() => setActiveTab('schedule')}
                        className={`px-3 sm:px-5 py-2 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all border-t border-x border-b-0 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'schedule' ? 'bg-purple-950/40 text-purple-400 border-purple-500/40 shadow-[0_-5px_15px_rgba(168,85,247,0.1)]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <span>📅</span> SRS Schedule
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <Button onClick={() => setIsDeckShareOpen(true)} variant="secondary" size="sm" className="border-cyan-700/60 bg-cyan-950/40 text-cyan-300 text-[10px] uppercase tracking-wider hover:bg-cyan-900/60">
                        📤 Share / Import
                    </Button>
                    <Button onClick={handleExportAnki} variant="secondary" size="sm" className="border-slate-700 text-[10px] uppercase tracking-wider">
                        ⬆ Export Anki
                    </Button>
                </div>
            </div>

            {/* TAB 1: LAB & TRIAGE */}
            {activeTab === 'lab' && (
                <div className="space-y-6">
                    <TriageScreen 
                        logs={logs}
                        existingCards={flashcards}
                        groupingMode={groupingMode}
                        onProcessAll={handleProcessAllNewErrors}
                        onOpenBulkTagger={() => setIsBulkTaggerOpen(true)}
                    />

                    <TopicHeatmap 
                        logs={logs}
                        onSelectTopicFilter={(topic) => {
                            setSelectedTopicBlitz(topic);
                            setSessionMode('blitz');
                            setActiveTab('deck');
                        }}
                    />
                </div>
            )}

            {/* TAB 2: DECK MANAGER */}
            {activeTab === 'deck' && (
                <div className="space-y-6">
                    {/* Session Launcher Controls */}
                    <div className="p-4 glass-panel rounded-xl border border-cyan-500/30 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Play className="w-4 h-4" /> Mode:
                            </span>
                            <select 
                                value={sessionMode} 
                                onChange={(e) => setSessionMode(e.target.value as SessionMode)}
                                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500"
                            >
                                <option value="rescue">🚨 Rescue Mode (Fix Recent Errors)</option>
                                <option value="review">📅 Spaced Review (SM-2 Due)</option>
                                <option value="blitz">⚡ Topic Blitz</option>
                                <option value="prerequisite">⚠️ Prerequisite Drill</option>
                                <option value="exam_sim">🎯 Exam Simulation</option>
                                <option value="weak_subject">📉 Weak Subject Focus</option>
                            </select>

                            {sessionMode === 'blitz' && (
                                <input 
                                    type="text" 
                                    value={selectedTopicBlitz} 
                                    onChange={(e) => setSelectedTopicBlitz(e.target.value)}
                                    placeholder="Type topic for Blitz..." 
                                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                                />
                            )}
                        </div>

                        <Button onClick={handleStartSession} size="sm" className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                            ▶ Initiate Session
                        </Button>
                    </div>

                    {/* Filter Bar with Track A/B Selector */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                            {/* Track A / B Filter */}
                            <select 
                                value={trackFilter} 
                                onChange={(e) => setTrackFilter(e.target.value as any)}
                                className="bg-slate-950 border border-slate-800 text-teal-300 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                            >
                                <option value="all">All Tracks</option>
                                <option value="track_a">⚡ Track A (ExamGOAL Rich)</option>
                                <option value="track_b">📋 Track B (Stubs / Manual)</option>
                            </select>

                            {/* Subject filter */}
                            <select 
                                value={subjectFilter} 
                                onChange={(e) => setSubjectFilter(e.target.value as any)}
                                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
                            >
                                <option value="all">All Subjects</option>
                                <option value="physics">Physics</option>
                                <option value="chemistry">Chemistry</option>
                                <option value="maths">Maths</option>
                            </select>

                            {/* Status filter */}
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active Immunity</option>
                                <option value="stubs">Stubs (Need Vaccine)</option>
                                <option value="prereq_blocked">Prerequisite Blocked</option>
                            </select>

                            {/* Page size selector */}
                            <select 
                                value={pageSize} 
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="bg-slate-950 border border-slate-800 text-slate-400 text-xs rounded-xl px-2.5 py-2 outline-none"
                            >
                                <option value={12}>12 / page</option>
                                <option value={24}>24 / page</option>
                                <option value={48}>48 / page</option>
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search topic, chapter..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-700"
                            />
                        </div>
                    </div>

                    {/* Holographic Card Grid with Standard Production Pagination */}
                    <div className="pb-8 space-y-6">
                        {filteredCards.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                                <span className="text-5xl mb-4 opacity-20">🧬</span>
                                <p className="text-sm font-mono uppercase tracking-widest opacity-50">No cards matching current filters.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-1">
                                    {paginatedCards.map(card => (
                                        <HolographicCard 
                                            key={card.id}
                                            card={card}
                                            metadata={getCardMetadata(card.id)}
                                            onSynthesize={handleSynthesize}
                                            onEnhanceAI={handleEnhanceAI}
                                            onCardClick={(c) => {
                                                startFlashcardSession([c]);
                                            }}
                                            isSynthesizing={isSynthesizing === card.id}
                                            isEnhancing={isEnhancing === card.id}
                                        />
                                    ))}
                                </div>

                                {/* Standard Production Pagination Bar */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                                    <div className="text-xs font-mono text-slate-400">
                                        Showing <span className="text-cyan-400 font-bold">{(currentPage - 1) * pageSize + 1}</span> - <span className="text-cyan-400 font-bold">{Math.min(currentPage * pageSize, filteredCards.length)}</span> of <span className="text-white font-bold">{filteredCards.length}</span> cards
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-xs transition-all"
                                            title="First Page"
                                        >
                                            <ChevronsLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-xs transition-all"
                                            title="Previous Page"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center gap-1 px-2">
                                            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                                                let pNum = currentPage;
                                                if (totalPages <= 5) {
                                                    pNum = idx + 1;
                                                } else if (currentPage <= 3) {
                                                    pNum = idx + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pNum = totalPages - 4 + idx;
                                                } else {
                                                    pNum = currentPage - 2 + idx;
                                                }

                                                return (
                                                    <button
                                                        key={pNum}
                                                        onClick={() => setCurrentPage(pNum)}
                                                        className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all ${currentPage === pNum ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                                    >
                                                        {pNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-xs transition-all"
                                            title="Next Page"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-xs transition-all"
                                            title="Last Page"
                                        >
                                            <ChevronsRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: DUAL SPRINTS (SPEED & FEYNMAN) */}
            {activeTab === 'sprints' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Sprint Card 1: Aptitude Speed Drill */}
                        <div className="p-6 rounded-3xl bg-surface border border-amber-500/30 space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                                        <Timer size={24} />
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                                        90s Countdown
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                                    Aptitude Speed Sprint
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Rapid-fire problem solving targeting time sinks and hesitation traps. Forces fast intuitive judgment before the timer expires.
                                </p>
                                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                                    <p>🎯 Target: {revisionMetrics.timeSinkCount} Time-Sink questions</p>
                                    <p className="text-amber-400">⚡ Rule: 90s per question or mark dropped</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSprintModeOpen('aptitude')}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-black uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Play size={16} /> Launch Speed Sprint
                            </button>
                        </div>

                        {/* Sprint Card 2: Knowledge Feynman Drill */}
                        <div className="p-6 rounded-3xl bg-surface border border-purple-500/30 space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                                        <Brain size={24} />
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                                        Feynman Defense
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                                    Knowledge Feynman Drill
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Deep conceptual dissection of distractor traps and tricky theorem boundaries. Reconstruct core principles in your own words.
                                </p>
                                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                                    <p>🎯 Target: {revisionMetrics.distractorCount} Distractor Traps</p>
                                    <p className="text-purple-400">🧠 Rule: Explain trap before seeing solution</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSprintModeOpen('knowledge')}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-black uppercase tracking-wider text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} /> Launch Feynman Drill
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* TAB 4: SRS SCHEDULE */}
            {activeTab === 'schedule' && (
                <ScheduleTab 
                    cards={flashcards}
                    streakCount={getActiveStreakCount(useJeeStore.getState().streakData)}
                />
            )}

            {/* Offline Paper Test Bulk Tagger Modal */}
            <BulkTagger 
                logs={logs}
                isOpen={isBulkTaggerOpen}
                onClose={() => setIsBulkTaggerOpen(false)}
                onSaveTags={handleSaveBulkTags}
            />

            {/* Card Review Modal */}
            <FlashCardModal 
                isOpen={isFlashcardModalOpen} 
                onClose={closeFlashcardSession} 
                apiKey={apiKey}
            />

            {/* Dual-Perspective Sprints Overlay Modal */}
            {sprintModeOpen !== null && (
                <DualPerspectiveSprint 
                    cards={flashcards}
                    logs={logs}
                    initialMode={sprintModeOpen}
                    onClose={() => {
                        setSprintModeOpen(null);
                        refreshFlashcards();
                    }}
                    onCardUpdated={() => refreshFlashcards()}
                />
            )}

            {/* Global Intelligence Manual Modal */}
            <ErrorVaccinatorInfoModal 
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
            />

            {/* Peer Deck Share / Import Modal */}
            <DeckShareModal
                isOpen={isDeckShareOpen}
                onClose={() => setIsDeckShareOpen(false)}
                currentDeck={flashcards}
                onImportCards={async (newCards) => {
                    setFlashcards(newCards);
                    await dbService.upsertFlashcards(newCards);
                    refreshFlashcards();
                }}
            />
        </div>
    );
};