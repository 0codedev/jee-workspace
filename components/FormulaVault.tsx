// ============================================================================
// Formula & Concept Vault (Full-Page Component)
// KaTeX Math Rendering, Spaced-Repetition Active Recall & AI Explainer
// ============================================================================

import React, { useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
    BookOpen, Search, Filter, Star, Sparkles, Check, X, 
    ChevronDown, ChevronUp, AlertCircle, Zap, Brain, RotateCcw,
    BookmarkCheck, Eye, EyeOff, Edit3, ArrowLeft, ArrowRight,
    Mic, MicOff, Volume2, Clock, CheckCircle2, Layers, Flame, Calendar, Network
} from 'lucide-react';
import { Formula, UserProfile, QuestionLog } from '../types';
import { ALL_FORMULAS, searchFormulas } from '../data/formulaVault';
import { 
    toggleFormulaWeakStatus, 
    recordRecallResult, 
    recordSpacedRecallResult,
    getLinkedFormulas,
    getDueFormulas,
    getMultiDomainBridges,
    getJeeAdvancedDirectResults
} from '../services/formulaService';
import { startListening, stopListening, latexToSpoken } from '../services/voiceEngine';
import { GoogleGenAI } from '@google/genai';

interface FormulaVaultProps {
    userProfile: UserProfile;
    questionLogs: QuestionLog[];
    apiKey?: string;
    onUpdateProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
    setView?: (view: any) => void;
}

export const FormulaVault: React.FC<FormulaVaultProps> = ({
    userProfile,
    questionLogs,
    apiKey,
    onUpdateProfile,
    setView
}) => {
    const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Maths'>('All');
    const [selectedCategory, setSelectedCategory] = useState<'All' | 'JEE Advanced Direct Result' | 'Multi-Domain Bridge' | 'Standard'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChapter, setSelectedChapter] = useState<string>('All');
    const [onlyWeak, setOnlyWeak] = useState(false);
    const [onlyDue, setOnlyDue] = useState(false);
    const [activeMode, setActiveMode] = useState<'browse' | 'recall' | 'oral' | 'bridges'>('browse');

    // Expanded Derivations state
    const [expandedDerivations, setExpandedDerivations] = useState<Record<string, boolean>>({});
    
    // AI Explainer Drawer state
    const [explainingFormula, setExplainingFormula] = useState<Formula | null>(null);
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Active Recall State
    const [recallIndex, setRecallIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [recallScore, setRecallScore] = useState({ passed: 0, failed: 0 });

    // Oral Recall Mode State (90-second voice sprint)
    const [oralTimeLeft, setOralTimeLeft] = useState(90);
    const [isOralRunning, setIsOralRunning] = useState(false);
    const [oralTranscript, setOralTranscript] = useState('');
    const [oralMatchedIds, setOralMatchedIds] = useState<string[]>([]);

    // Starred & User Notes state
    const [starredIds, setStarredIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('formula_starred_ids') || '[]');
        } catch { return []; }
    });
    const [onlyStarred, setOnlyStarred] = useState(false);
    const [userNotes, setUserNotes] = useState<Record<string, string>>(() => {
        try {
            return JSON.parse(localStorage.getItem('formula_user_notes') || '{}');
        } catch { return {}; }
    });
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

    const weakSet = useMemo(() => new Set(userProfile.formulaWeakList || []), [userProfile.formulaWeakList]);
    const starredSet = useMemo(() => new Set(starredIds), [starredIds]);
    const linkedErrors = useMemo(() => getLinkedFormulas(questionLogs), [questionLogs]);
    const linkedErrorMap = useMemo(() => {
        const map: Record<string, number> = {};
        linkedErrors.forEach(l => { map[l.id] = l.errorCount; });
        return map;
    }, [linkedErrors]);

    // SM-2 Spaced Repetition Due Today Queue
    const dueFormulas = useMemo(() => {
        return getDueFormulas(userProfile, selectedSubject === 'All' ? undefined : selectedSubject);
    }, [userProfile, selectedSubject]);
    const dueSet = useMemo(() => new Set(dueFormulas.map(f => f.id)), [dueFormulas]);

    // Multi-Domain Bridges pool
    const bridgeFormulas = useMemo(() => {
        return getMultiDomainBridges(selectedSubject === 'All' ? undefined : selectedSubject);
    }, [selectedSubject]);

    // Live counts per Category
    const categoryCounts = useMemo(() => {
        let pool = ALL_FORMULAS;
        if (selectedSubject !== 'All') pool = pool.filter(f => f.subject === selectedSubject);
        return {
            all: pool.length,
            direct: pool.filter(f => f.category === 'JEE Advanced Direct Result').length,
            bridge: pool.filter(f => f.category === 'Multi-Domain Bridge').length,
            standard: pool.filter(f => !f.category || f.category === 'Standard').length,
        };
    }, [selectedSubject]);

    const toggleStarred = (id: string) => {
        const updated = starredIds.includes(id)
            ? starredIds.filter(item => item !== id)
            : [...starredIds, id];
        setStarredIds(updated);
        try { localStorage.setItem('formula_starred_ids', JSON.stringify(updated)); } catch {}
    };

    const handleSaveNote = (id: string, noteText: string) => {
        const updated = { ...userNotes, [id]: noteText };
        setUserNotes(updated);
        try { localStorage.setItem('formula_user_notes', JSON.stringify(updated)); } catch {}
        setEditingNoteId(null);
    };

    const handleCopyLatex = (id: string, latex: string) => {
        navigator.clipboard.writeText(latex);
        setCopiedFormulaId(id);
        setTimeout(() => setCopiedFormulaId(null), 2500);
    };

    // Filtered Formulas
    const filteredFormulas = useMemo(() => {
        let pool = ALL_FORMULAS;
        if (selectedSubject !== 'All') {
            pool = pool.filter(f => f.subject === selectedSubject);
        }
        if (selectedCategory !== 'All') {
            if (selectedCategory === 'Standard') {
                pool = pool.filter(f => !f.category || f.category === 'Standard');
            } else {
                pool = pool.filter(f => f.category === selectedCategory);
            }
        }
        if (selectedChapter !== 'All') {
            pool = pool.filter(f => f.chapter === selectedChapter);
        }
        if (onlyWeak) {
            pool = pool.filter(f => weakSet.has(f.id));
        }
        if (onlyStarred) {
            pool = pool.filter(f => starredSet.has(f.id));
        }
        if (onlyDue) {
            pool = pool.filter(f => dueSet.has(f.id));
        }
        if (searchQuery.trim()) {
            pool = searchFormulas(
                searchQuery, 
                selectedSubject === 'All' ? undefined : selectedSubject,
                selectedCategory === 'All' ? undefined : selectedCategory
            );
            if (onlyWeak) pool = pool.filter(f => weakSet.has(f.id));
            if (onlyStarred) pool = pool.filter(f => starredSet.has(f.id));
            if (onlyDue) pool = pool.filter(f => dueSet.has(f.id));
        }
        return pool;
    }, [selectedSubject, selectedCategory, selectedChapter, onlyWeak, onlyStarred, onlyDue, searchQuery, weakSet, starredSet, dueSet]);

    // Available Chapters for current subject filter
    const availableChapters = useMemo(() => {
        let pool = ALL_FORMULAS;
        if (selectedSubject !== 'All') pool = pool.filter(f => f.subject === selectedSubject);
        if (selectedCategory !== 'All') {
            if (selectedCategory === 'Standard') {
                pool = pool.filter(f => !f.category || f.category === 'Standard');
            } else {
                pool = pool.filter(f => f.category === selectedCategory);
            }
        }
        const chapters = Array.from(new Set(pool.map(f => f.chapter)));
        return ['All', ...chapters];
    }, [selectedSubject, selectedCategory]);

    // KaTeX Safe Renderer for Pure LaTeX Math
    const renderLatex = (latexStr: string) => {
        try {
            return {
                __html: katex.renderToString(latexStr, {
                    displayMode: true,
                    throwOnError: false
                })
            };
        } catch {
            return { __html: `<code>${latexStr}</code>` };
        }
    };

    // Helper to render inline math and expressions in traps, notes, and descriptions
    const renderRichMath = (text: string): string => {
        if (!text) return '';

        // Auto-wrap known shorthand like k^2/R^2, k^2/r^2 into LaTeX delimiters
        let processed = text.replace(/\bk\^2\/([Rr])\^2\b/g, '$$k^2/$1^2$$');

        // If text contains $...$, render each math block with KaTeX inline
        if (processed.includes('$')) {
            return processed.replace(/\$([^$]+)\$/g, (_, math) => {
                try {
                    return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
                } catch {
                    return `<code>${math}</code>`;
                }
            });
        }

        // If text contains backslash commands like \Delta, \mu, \pi, \frac, \sqrt, etc.
        if (processed.includes('\\')) {
            return processed.replace(/(\\[a-zA-Z]+(?:\{[^}]*\}|[_^][a-zA-Z0-9{}]|[0-9a-zA-Z=+\-*/(),\s<>|]+)*)/g, (match) => {
                const clean = match.trim().replace(/[.,:;!?]+$/, '');
                try {
                    return katex.renderToString(clean, { displayMode: false, throwOnError: false });
                } catch {
                    return match;
                }
            });
        }

        return processed;
    };

    // Helper to render derivation steps cleanly (separating English prefix from math equation)
    const renderStepWithMath = (step: string): string => {
        if (!step) return '';

        // Check if there is an explanatory English prefix followed by a colon
        const colonIdx = step.indexOf(': ');
        if (colonIdx > 0 && colonIdx < step.length - 2) {
            const prefix = step.substring(0, colonIdx + 1);
            const mathPart = step.substring(colonIdx + 2).trim();

            try {
                const mathHtml = katex.renderToString(mathPart, { displayMode: false, throwOnError: false });
                return `<span class="font-sans text-slate-300 font-medium">${prefix}</span> <span class="font-mono text-cyan-200 inline-block align-middle ml-1">${mathHtml}</span>`;
            } catch {
                return `<span class="font-sans text-slate-300">${step}</span>`;
            }
        }

        // If it's a pure equation
        if (step.includes('\\') || step.includes('=')) {
            try {
                return katex.renderToString(step, { displayMode: false, throwOnError: false });
            } catch {
                return step;
            }
        }

        return step;
    };

    const toggleDerivation = (id: string) => {
        setExpandedDerivations(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // AI Explainer Call
    const handleExplainWithAI = async (formula: Formula) => {
        setExplainingFormula(formula);
        setAiExplanation(null);
        setIsAiLoading(true);

        try {
            const key = apiKey || localStorage.getItem('gemini_api_key') || '';
            if (!key) {
                setAiExplanation("Please provide a Gemini API Key in Settings to generate AI concept breakdowns.");
                setIsAiLoading(false);
                return;
            }

            const ai = new GoogleGenAI({ apiKey: key });
            const prompt = `You are an elite IIT-JEE Master Faculty.
Explain the following JEE Formula in maximum clarity:
Formula Name: ${formula.name} (${formula.subject} - ${formula.chapter})
Formula LaTeX: ${formula.latex}

Please provide:
1. Intuitive Physical / Mathematical Meaning (Why does this formula look the way it does?)
2. Typical JEE Advanced Trap & Common Silly Mistakes
3. One Worked Out JEE-Standard Exam Example Problem with Step-by-Step solution.

Keep it crisp, precise, and format all math in clear LaTeX expressions.`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            setAiExplanation(res.text || "No explanation generated.");
        } catch (err: any) {
            setAiExplanation(`Failed to generate explanation: ${err.message || 'Unknown error'}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    // Active Recall Handlers (4-Tier SM-2 Spaced Repetition)
    const currentRecallFormula = filteredFormulas[recallIndex] || null;

    const handleGradeCard = (grade: 'again' | 'hard' | 'good' | 'easy') => {
        if (!currentRecallFormula) return;
        recordSpacedRecallResult(currentRecallFormula.id, grade, userProfile, onUpdateProfile);
        if (grade === 'again') {
            setRecallScore(prev => ({ ...prev, failed: prev.failed + 1 }));
        } else {
            setRecallScore(prev => ({ ...prev, passed: prev.passed + 1 }));
        }
        nextRecallCard();
    };

    const handleRecallPass = () => handleGradeCard('good');
    const handleRecallFail = () => handleGradeCard('again');

    const nextRecallCard = () => {
        setIsRevealed(false);
        if (recallIndex + 1 < filteredFormulas.length) {
            setRecallIndex(prev => prev + 1);
        } else {
            setRecallIndex(0); // Loop or finish
        }
    };

    // Keyboard shortcuts for Active Recall
    React.useEffect(() => {
        if (activeMode !== 'recall') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.code === 'Space') {
                e.preventDefault();
                setIsRevealed(prev => !prev);
            } else if (e.key === '1' && isRevealed) {
                handleGradeCard('again');
            } else if (e.key === '2' && isRevealed) {
                handleGradeCard('hard');
            } else if (e.key === '3' && isRevealed) {
                handleGradeCard('good');
            } else if (e.key === '4' && isRevealed) {
                handleGradeCard('easy');
            } else if (e.key === 'ArrowRight') {
                nextRecallCard();
            } else if (e.key === 'ArrowLeft') {
                setRecallIndex(prev => Math.max(0, prev - 1));
                setIsRevealed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeMode, isRevealed, currentRecallFormula]);

    return (
        <div className="space-y-6">
            {/* 1. HEADER & CONTROLS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
                            <span>Formula Vault</span>
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap inline-flex items-center shrink-0">
                            {ALL_FORMULAS.length} Formulas
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                        Mathematical derivations, high-yield traps, and active recall drills.
                    </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex flex-wrap items-center gap-1.5 bg-surface-2 border border-white/10 p-1 rounded-xl shrink-0">
                    <button
                        onClick={() => { setActiveMode('browse'); setIsRevealed(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeMode === 'browse'
                                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Explore</span>
                    </button>

                    <button
                        onClick={() => { setActiveMode('recall'); setRecallIndex(0); setIsRevealed(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeMode === 'recall'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Active Recall</span>
                    </button>

                    <button
                        onClick={() => { 
                            setActiveMode('oral'); 
                            setIsOralRunning(false); 
                            setOralTimeLeft(90);
                            setOralTranscript('');
                            setOralMatchedIds([]);
                            stopListening();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeMode === 'oral'
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Oral Sprint</span>
                    </button>

                    <button
                        onClick={() => { setActiveMode('bridges'); setIsRevealed(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeMode === 'bridges'
                                ? 'bg-purple-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Network className="w-3.5 h-3.5" />
                        <span>Concept Bridges</span>
                    </button>
                </div>
            </div>

            {/* 2. FILTER & SEARCH STRIP */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* Subject Tabs */}
                    <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
                        {(['All', 'Physics', 'Chemistry', 'Maths'] as const).map(subj => (
                            <button
                                key={subj}
                                onClick={() => { setSelectedSubject(subj); setSelectedChapter('All'); }}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedSubject === subj
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {subj}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search by name, topic, mnemonics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs">
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Starred Filter Toggle */}
                    <button
                        onClick={() => setOnlyStarred(!onlyStarred)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                            onlyStarred
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        <span>Starred ({starredSet.size})</span>
                    </button>

                    {/* Weak Filter Toggle */}
                    <button
                        onClick={() => setOnlyWeak(!onlyWeak)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                            onlyWeak
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <AlertCircle className={`w-3.5 h-3.5 ${onlyWeak ? 'text-rose-400' : ''}`} />
                        <span>Weak Deck ({weakSet.size})</span>
                    </button>

                    {/* Due Today Filter Toggle (SM-2 Spaced Repetition Queue) */}
                    <button
                        onClick={() => setOnlyDue(!onlyDue)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                            onlyDue
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <Calendar className={`w-3.5 h-3.5 ${onlyDue ? 'text-cyan-400' : ''}`} />
                        <span>Due Today ({dueFormulas.length})</span>
                    </button>
                </div>

                {/* Category Filter Pills: All / JEE Advanced Direct Results / Multi-Domain Bridges / Standard */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0 mr-1">Domain Type:</span>
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            selectedCategory === 'All'
                                ? 'bg-slate-800 text-white border-slate-600 shadow-md'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                    >
                        <span>All Formulas</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-300 font-mono">
                            {categoryCounts.all}
                        </span>
                    </button>
                    <button
                        onClick={() => setSelectedCategory('JEE Advanced Direct Result')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            selectedCategory === 'JEE Advanced Direct Result'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                                : 'bg-slate-950/60 text-amber-400/80 border-amber-900/40 hover:bg-amber-950/30'
                        }`}
                    >
                        <span>⚡ JEE Adv Direct Cut Results</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 font-mono border border-amber-800/60">
                            {categoryCounts.direct}
                        </span>
                    </button>
                    <button
                        onClick={() => setSelectedCategory('Multi-Domain Bridge')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            selectedCategory === 'Multi-Domain Bridge'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md'
                                : 'bg-slate-950/60 text-purple-400/80 border-purple-900/40 hover:bg-purple-950/30'
                        }`}
                    >
                        <span>🔗 Multi-Domain Bridges</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300 font-mono border border-purple-800/60">
                            {categoryCounts.bridge}
                        </span>
                    </button>
                    <button
                        onClick={() => setSelectedCategory('Standard')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            selectedCategory === 'Standard'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                    >
                        <span>Standard Core</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                            {categoryCounts.standard}
                        </span>
                    </button>
                </div>

                {/* Chapter Select */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                    <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Chapter:</span>
                    {availableChapters.map(chap => (
                        <button
                            key={chap}
                            onClick={() => setSelectedChapter(chap)}
                            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                                selectedChapter === chap
                                    ? 'bg-slate-800 text-cyan-300 font-bold border border-cyan-500/30'
                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                            }`}
                        >
                            {chap}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. MAIN CONTENT: BROWSE MODE */}
            {activeMode === 'browse' && (
                /* BROWSE MODE GRID */
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                        <span>Showing <strong>{filteredFormulas.length}</strong> formulas</span>
                        {onlyWeak && <span className="text-rose-400 font-bold">Filtered: Weak Concept Deck</span>}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredFormulas.map(formula => {
                            const isWeak = weakSet.has(formula.id);
                            const errorCount = linkedErrorMap[formula.id] || 0;
                            const isExpanded = expandedDerivations[formula.id] || false;
                            const note = userProfile.formulaNotes?.[formula.id]?.userNote || '';

                            return (
                                <div 
                                    key={`${formula.subject}-${formula.id}`}
                                    className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                                        isWeak
                                            ? 'border-rose-500/50 shadow-rose-950/20'
                                            : 'border-slate-800/80 hover:border-cyan-500/40'
                                    }`}
                                >
                                    <div className="space-y-4">
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                                                        formula.subject === 'Physics' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                                                        formula.subject === 'Chemistry' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                                        'bg-purple-950 text-purple-300 border border-purple-800'
                                                    }`}>
                                                        {formula.subject}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {formula.chapter} &bull; {formula.topic}
                                                    </span>
                                                    {formula.category === 'JEE Advanced Direct Result' && (
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm flex items-center gap-1">
                                                            <span>⚡</span> JEE Adv Direct Result
                                                        </span>
                                                    )}
                                                    {formula.category === 'Multi-Domain Bridge' && (
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-sm flex items-center gap-1">
                                                            <span>🔗</span> Multi-Domain Bridge
                                                        </span>
                                                    )}
                                                    {formula.jeeYearOrigin && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/40">
                                                            🏛️ {formula.jeeYearOrigin}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-black text-white mt-1.5">
                                                    {formula.name}
                                                </h3>

                                                {/* Interlinked Chapters Badges */}
                                                {formula.linkedChapters && formula.linkedChapters.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Interlinked:</span>
                                                        {formula.linkedChapters.map((ch, i) => (
                                                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-purple-500/40 text-purple-300">
                                                                {ch}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Badges: Star & Weak */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => toggleStarred(formula.id)}
                                                    title={starredSet.has(formula.id) ? "Unstar Formula" : "Star / Bookmark Formula"}
                                                    className={`p-2 rounded-xl transition-all ${
                                                        starredSet.has(formula.id)
                                                            ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                                                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    <Star className={`w-4 h-4 ${starredSet.has(formula.id) ? 'fill-amber-400' : ''}`} />
                                                </button>

                                                <button
                                                    onClick={() => toggleFormulaWeakStatus(formula.id, userProfile, onUpdateProfile)}
                                                    title={isWeak ? "Remove from Weak List" : "Mark as Weak Formula"}
                                                    className={`p-2 rounded-xl transition-all ${
                                                        isWeak
                                                            ? 'bg-rose-500/20 border border-rose-500 text-rose-400'
                                                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    <AlertCircle className={`w-4 h-4 ${isWeak ? 'text-rose-400' : ''}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Formula LaTeX Container */}
                                        <div className="relative group p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 shadow-inner text-cyan-200">
                                            <div className="formula-latex-box py-1">
                                                <div 
                                                    className="w-max min-w-full flex items-center justify-center px-4 py-1 text-base md:text-lg font-mono tracking-wide"
                                                    dangerouslySetInnerHTML={renderLatex(formula.latex)} 
                                                />
                                            </div>
                                            {/* Copy LaTeX button */}
                                            <button
                                                onClick={() => handleCopyLatex(formula.id, formula.latex)}
                                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] font-mono text-slate-300 flex items-center gap-1"
                                                title="Copy raw LaTeX equation"
                                            >
                                                {copiedFormulaId === formula.id ? (
                                                    <>
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                        <span className="text-emerald-400">Copied!</span>
                                                    </>
                                                ) : (
                                                    <span>Copy LaTeX</span>
                                                )}
                                            </button>
                                        </div>

                                        {/* Direct Application Context & Exam Shortcut Callout */}
                                        {formula.directApplicationContext && (
                                            <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/40 text-xs space-y-1">
                                                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                                    ⚡ Exam Trigger & Direct Shortcut:
                                                </span>
                                                <p className="text-amber-100/90 text-[11px] leading-relaxed font-medium">
                                                    {formula.directApplicationContext}
                                                </p>
                                            </div>
                                        )}

                                        {/* Description & Frequency */}
                                        {formula.description && (
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                {formula.description}
                                            </p>
                                        )}

                                        {/* User Personal Notes / Mnemonics */}
                                        {userNotes[formula.id] && editingNoteId !== formula.id && (
                                            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs flex items-start justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">My Personal Note:</span>
                                                    <p className="text-slate-200 font-medium">{userNotes[formula.id]}</p>
                                                </div>
                                                <button
                                                    onClick={() => setEditingNoteId(formula.id)}
                                                    className="text-slate-400 hover:text-cyan-300 p-1 text-[11px]"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Note Editor */}
                                        {editingNoteId === formula.id && (
                                            <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-2">
                                                <span className="text-[10px] font-bold text-cyan-400 uppercase">Attach Note / Custom Mnemonic:</span>
                                                <input
                                                    type="text"
                                                    defaultValue={userNotes[formula.id] || ''}
                                                    placeholder="e.g. Always remember sign of work done..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveNote(formula.id, (e.target as HTMLInputElement).value);
                                                    }}
                                                    id={`note-input-${formula.id}`}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                                                />
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setEditingNoteId(null)}
                                                        className="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const el = document.getElementById(`note-input-${formula.id}`) as HTMLInputElement;
                                                            if (el) handleSaveNote(formula.id, el.value);
                                                        }}
                                                        className="px-2.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold text-[11px]"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Badges Row */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                formula.jeeFrequency === 'Very High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                                formula.jeeFrequency === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                                'bg-slate-800 text-slate-300'
                                            }`}>
                                                JEE Weightage: {formula.jeeFrequency}
                                            </span>

                                            {errorCount > 0 && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-700 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errorCount} Past Errors Linked
                                                </span>
                                            )}

                                            {formula.mnemonics && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                                                    💡 {formula.mnemonics}
                                                </span>
                                            )}

                                            {!userNotes[formula.id] && editingNoteId !== formula.id && (
                                                <button
                                                    onClick={() => setEditingNoteId(formula.id)}
                                                    className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded-full transition-colors"
                                                >
                                                    <Edit3 className="w-2.5 h-2.5" /> + Add Note
                                                </button>
                                            )}
                                        </div>

                                        {/* Common Traps */}
                                        {formula.commonTraps && formula.commonTraps.length > 0 && (
                                            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1 text-xs">
                                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                                    ⚠️ Common JEE Traps:
                                                </span>
                                                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                                                    {formula.commonTraps.map((trap, idx) => (
                                                        <li 
                                                            key={idx}
                                                            className="leading-relaxed"
                                                            dangerouslySetInnerHTML={{ __html: renderRichMath(trap) }}
                                                        />
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Derivation Accordion */}
                                        {formula.derivationSteps && formula.derivationSteps.length > 0 && (
                                            <div className="border-t border-slate-800/80 pt-3">
                                                <button
                                                    onClick={() => toggleDerivation(formula.id)}
                                                    className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors"
                                                >
                                                    <span>Derivation & Proof Steps</span>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 animate-fade-in text-xs font-mono text-slate-300">
                                                        {formula.derivationSteps.map((step, idx) => (
                                                            <div key={idx} className="flex gap-2 items-start text-xs">
                                                                <span className="text-cyan-500 font-bold shrink-0">{idx + 1}.</span>
                                                                <div 
                                                                    className="leading-relaxed font-sans overflow-x-auto custom-scrollbar"
                                                                    dangerouslySetInnerHTML={{ __html: renderStepWithMath(step) }} 
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Row */}
                                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                                        <button
                                            onClick={() => handleExplainWithAI(formula)}
                                            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>AI Worked Example</span>
                                        </button>

                                        <span className="text-[10px] text-slate-500 font-mono">
                                            ID: {formula.id}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 4. ACTIVE RECALL MODE (SM-2 FLASHCARD SPRINT) */}
            {activeMode === 'recall' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                    {/* Recall Progress Bar */}
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>Card {recallIndex + 1} of {filteredFormulas.length}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-emerald-400 font-bold">✓ {recallScore.passed} Mastered</span>
                            <span className="text-rose-400 font-bold">✗ {recallScore.failed} Stuck</span>
                        </div>
                    </div>

                    {currentRecallFormula ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded ${
                                    currentRecallFormula.subject === 'Physics' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                                    currentRecallFormula.subject === 'Chemistry' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                    'bg-purple-950 text-purple-300 border border-purple-800'
                                }`}>
                                    {currentRecallFormula.subject} &bull; {currentRecallFormula.chapter}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                    {currentRecallFormula.jeeFrequency} Weight
                                </span>
                            </div>

                            {/* Front of Card: Formula Name */}
                            <div className="py-6 space-y-2">
                                <span className="text-xs text-slate-500 uppercase tracking-widest block font-bold">
                                    Can you recall the exact formula for:
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-white">
                                    {currentRecallFormula.name}
                                </h2>
                                {currentRecallFormula.description && (
                                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                                        {currentRecallFormula.description}
                                    </p>
                                )}
                            </div>

                            {/* Revealed Answer Box */}
                            {isRevealed ? (
                                <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-inner space-y-4 animate-fade-in text-cyan-200">
                                    <div 
                                        className="text-lg md:text-xl font-mono py-2"
                                        dangerouslySetInnerHTML={renderLatex(currentRecallFormula.latex)}
                                    />
                                    {currentRecallFormula.commonTraps && (
                                        <p className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                                            ⚠️ <strong>Key Watchout:</strong> {currentRecallFormula.commonTraps[0]}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsRevealed(true)}
                                    className="w-full py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-cyan-300 font-black text-sm transition-all border border-slate-700/60 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-5 h-5" />
                                    <span>Reveal Formula & Traps</span>
                                </button>
                            )}

                            {/* Evaluation Buttons (SM-2 4-Tier Spaced Repetition) */}
                            {isRevealed && (
                                <div className="space-y-3 pt-4 border-t border-slate-800">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        <button
                                            onClick={() => handleGradeCard('again')}
                                            className="py-3 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex flex-col items-center gap-1 group shadow-sm"
                                            title="Shortcut: Key 1"
                                        >
                                            <div className="flex items-center gap-1">
                                                <RotateCcw className="w-3.5 h-3.5 text-rose-400 group-hover:-rotate-45 transition-transform" />
                                                <span className="font-black text-rose-400">Again</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">&lt; 1 day (Key 1)</span>
                                        </button>

                                        <button
                                            onClick={() => handleGradeCard('hard')}
                                            className="py-3 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex flex-col items-center gap-1 group shadow-sm"
                                            title="Shortcut: Key 2"
                                        >
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                                <span className="font-black text-amber-300">Hard</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">2 days (Key 2)</span>
                                        </button>

                                        <button
                                            onClick={() => handleGradeCard('good')}
                                            className="py-3 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex flex-col items-center gap-1 group shadow-sm"
                                            title="Shortcut: Key 3"
                                        >
                                            <div className="flex items-center gap-1">
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="font-black text-emerald-300">Good</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">5-7 days (Key 3)</span>
                                        </button>

                                        <button
                                            onClick={() => handleGradeCard('easy')}
                                            className="py-3 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex flex-col items-center gap-1 group shadow-sm"
                                            title="Shortcut: Key 4"
                                        >
                                            <div className="flex items-center gap-1">
                                                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                                <span className="font-black text-cyan-300">Easy</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">12+ days (Key 4)</span>
                                        </button>
                                    </div>

                                    {/* SM-2 Telemetry strip */}
                                    {(() => {
                                        const note = userProfile.formulaNotes?.[currentRecallFormula.id];
                                        return (
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 font-mono">
                                                <span className="flex items-center gap-1">
                                                    <Flame className="w-3 h-3 text-amber-400" />
                                                    Streak: <strong className="text-white">{note?.streak || 0}</strong>
                                                </span>
                                                <span>
                                                    Interval: <strong className="text-white">{note?.intervalDays || 1}d</strong>
                                                </span>
                                                <span>
                                                    Ease: <strong className="text-white">{(note?.easeFactor || 2.5).toFixed(2)}</strong>
                                                </span>
                                                <span className="text-slate-500">
                                                    Space: Flip | 1-4: Rate
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                            <p className="text-slate-400">No formulas match the current active filter.</p>
                        </div>
                    )}
                </div>
            )}

            {/* 3. ORAL RECALL MODE (90-SECOND VOICE SPRINT) */}
            {activeMode === 'oral' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                <Mic className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                    Oral Speed Recall
                                </span>
                                <h3 className="text-xl font-black text-white">
                                    90-Second Formula Sprint: {selectedChapter === 'All' ? `${selectedSubject} Overall` : selectedChapter}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Time Left</span>
                                <span className={`text-2xl font-black font-mono ${oralTimeLeft <= 15 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                                    {oralTimeLeft}s
                                </span>
                            </div>

                            {!isOralRunning ? (
                                <button
                                    onClick={() => {
                                        setIsOralRunning(true);
                                        setOralTimeLeft(90);
                                        setOralTranscript('');
                                        setOralMatchedIds([]);
                                        startListening((transcript, isFinal) => {
                                            setOralTranscript(transcript);
                                            // Check which formulas from filtered list are mentioned
                                            const matches: string[] = [];
                                            filteredFormulas.forEach(f => {
                                                const spoken = latexToSpoken(f.latex).toLowerCase();
                                                const keywords = spoken.split(/\s+/).filter(w => w.length >= 4);
                                                const userSpeech = transcript.toLowerCase();
                                                const hitCount = keywords.filter(k => userSpeech.includes(k)).length;
                                                if (hitCount >= Math.min(2, keywords.length) || userSpeech.includes(f.name.toLowerCase())) {
                                                    matches.push(f.id);
                                                }
                                            });
                                            setOralMatchedIds([...new Set(matches)]);
                                        });
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                                >
                                    <Zap className="w-4 h-4" />
                                    <span>Start Sprint</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsOralRunning(false);
                                        stopListening();
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                                >
                                    <span>Stop Session</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Live Speech Feedback & Matches */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Live Transcript */}
                        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isOralRunning ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                                Live Voice Transcript
                            </span>
                            <div className="min-h-[140px] text-sm text-slate-200 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                                {oralTranscript || (isOralRunning ? 'Listening... Speak formulas out loud!' : 'Click Start Sprint and speak any formulas from this chapter out loud.')}
                            </div>
                        </div>

                        {/* Right: Matched Formulas */}
                        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" /> Formulas Recognized ({oralMatchedIds.length} / {filteredFormulas.length})
                                </span>
                                <span className="text-xs font-mono text-cyan-300 font-bold">
                                    {Math.round((oralMatchedIds.length / Math.max(1, filteredFormulas.length)) * 100)}% Complete
                                </span>
                            </div>

                            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                                {filteredFormulas.map(f => {
                                    const isHit = oralMatchedIds.includes(f.id);
                                    return (
                                        <div 
                                            key={f.id}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                                isHit 
                                                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                                                    : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                                            }`}
                                        >
                                            <span className="font-bold">{f.name}</span>
                                            <span className="font-mono">{isHit ? '✓ Recognized' : '○ Pending'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. CONCEPT BRIDGES MODE (CROSS-DOMAIN ISOMORPHISMS) */}
            {activeMode === 'bridges' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Header Banner */}
                    <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-950 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                                    <Network className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                                        Inter-Disciplinary Equivalence Matrix
                                    </span>
                                    <h3 className="text-xl font-black text-white">
                                        Multi-Domain Concept Bridges
                                    </h3>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                                    {bridgeFormulas.length} Cross-Domain Bridges
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
                            JEE Advanced questions frequently fuse two independent syllabus modules into a single isomorphic equation. 
                            Recognizing these mathematical analogies (e.g., LC Oscillations vs Simple Harmonic Motion, Electrostatic Dipoles vs Bar Magnets) eliminates up to 60% of formulation steps on exam day.
                        </p>
                    </div>

                    {/* Bridges Grid */}
                    {bridgeFormulas.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {bridgeFormulas.map(formula => {
                                const isWeak = weakSet.has(formula.id);
                                const isStarred = starredSet.has(formula.id);
                                const isExpanded = expandedDerivations[formula.id] || false;

                                return (
                                    <div 
                                        key={formula.id}
                                        className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                                            isWeak
                                                ? 'border-rose-500/50 shadow-rose-950/20'
                                                : 'border-purple-500/30 hover:border-purple-500/50 shadow-sm'
                                        }`}
                                    >
                                        <div className="space-y-4">
                                            {/* Badge strip */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                                            {formula.subject} &bull; {formula.chapter}
                                                        </span>
                                                        {formula.jeeYearOrigin && (
                                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">
                                                                {formula.jeeYearOrigin}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-lg font-black text-white pt-1">
                                                        {formula.name}
                                                    </h4>
                                                </div>

                                                <button
                                                    onClick={() => toggleStarred(formula.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                                    title={isStarred ? "Unstar" : "Star"}
                                                >
                                                    <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Connected domains chip */}
                                            {formula.linkedChapters && formula.linkedChapters.length > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/40">
                                                    <Network className="w-4 h-4 shrink-0 text-purple-400" />
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        <span className="font-semibold text-slate-400">Synthesizes:</span>
                                                        <span className="font-bold text-white">{formula.chapter}</span>
                                                        <span className="text-purple-400 font-mono">&harr;</span>
                                                        {formula.linkedChapters.map((ch, idx) => (
                                                            <span key={idx} className="font-bold text-purple-200">
                                                                {ch}{idx < (formula.linkedChapters?.length || 1) - 1 ? ',' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Latex Card */}
                                            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/20 text-center overflow-x-auto text-purple-100 py-4 shadow-inner">
                                                <div dangerouslySetInnerHTML={renderLatex(formula.latex)} />
                                            </div>

                                            {/* Direct Application Context / Equivalence Logic */}
                                            {formula.directApplicationContext && (
                                                <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                                                        Cross-Domain Analogy / Isomorphism:
                                                    </span>
                                                    <p className="text-xs text-slate-300 leading-relaxed">
                                                        {formula.directApplicationContext}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Traps */}
                                            {formula.commonTraps && formula.commonTraps.length > 0 && (
                                                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1">
                                                    <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Advanced Trap / Misconception:
                                                    </span>
                                                    <p className="text-xs text-amber-200/90 leading-relaxed">
                                                        {formula.commonTraps[0]}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Derivation Steps Accordion */}
                                            {formula.derivationSteps && formula.derivationSteps.length > 0 && (
                                                <div className="pt-2">
                                                    <button
                                                        onClick={() => toggleDerivation(formula.id)}
                                                        className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-cyan-400 py-1.5 transition-colors border-t border-slate-800/80"
                                                    >
                                                        <span>Derivation Blueprint ({formula.derivationSteps.length} steps)</span>
                                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="space-y-2 mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 animate-fade-in">
                                                            {formula.derivationSteps.map((step, idx) => (
                                                                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                                                    <span className="text-cyan-400 font-mono font-bold shrink-0">{idx + 1}.</span>
                                                                    <div 
                                                                        className="overflow-x-auto leading-relaxed"
                                                                        dangerouslySetInnerHTML={{ __html: renderStepWithMath(step) }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer actions */}
                                        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                                            <button
                                                onClick={() => handleExplainWithAI(formula)}
                                                className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                                <span>AI Worked Example</span>
                                            </button>

                                            <button
                                                onClick={() => toggleFormulaWeakStatus(formula.id, userProfile, onUpdateProfile)}
                                                className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                                                    isWeak
                                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                                        : 'text-slate-500 border-slate-800 hover:text-slate-300'
                                                }`}
                                            >
                                                {isWeak ? 'Marked Weak' : '+ Flag Weak'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                            <p className="text-slate-400">No concept bridges match the current filter.</p>
                        </div>
                    )}
                </div>
            )}

            {/* 6. AI EXPLAINER MODAL / DRAWER */}
            {explainingFormula && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs uppercase font-black text-cyan-400 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" /> AI JEE Masterclass Explainer
                                </span>
                                <h3 className="text-xl font-black text-white mt-1">
                                    {explainingFormula.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setExplainingFormula(null)}
                                className="p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* LaTeX Hero */}
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-cyan-200">
                            <div dangerouslySetInnerHTML={renderLatex(explainingFormula.latex)} />
                        </div>

                        {/* AI Content */}
                        {isAiLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center text-cyan-400 space-y-3">
                                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold tracking-widest uppercase animate-pulse">
                                    Consulting AI Master Faculty...
                                </span>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                                {aiExplanation}
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => setExplainingFormula(null)}
                                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                            >
                                Close Explainer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};