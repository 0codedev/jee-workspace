import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

interface GlobalHelpDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateView?: (view: string) => void;
}

interface HelpItem {
    id: string;
    title: string;
    category: string;
    tags: string[];
    summary: string;
    content: React.ReactNode;
}

export const GlobalHelpDrawer: React.FC<GlobalHelpDrawerProps> = ({ isOpen, onClose, onNavigateView }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // ESC key listener to close modal or clear selected item
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedItemId) {
                    setSelectedItemId(null);
                } else if (isOpen) {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedItemId, onClose]);

    const handleClose = () => {
        localStorage.setItem('help_panel_seen', 'true');
        setSelectedItemId(null);
        onClose();
    };

    const categories = [
        { id: 'getting-started', label: 'Getting Started & Setup', icon: '🚀' },
        { id: 'understanding-data', label: 'Understanding Your Data (E1-E7)', icon: '🧬' },
        { id: 'subject-tactics', label: 'Subject Master Tactics (PCM)', icon: '🔬' },
        { id: 'studying-smarter', label: 'Studying Smarter (AI & SRS)', icon: '🧠' },
        { id: 'when-things-go-wrong', label: 'When Things Go Wrong (First Aid)', icon: '❤️' },
        { id: 'exam-prep', label: 'Exam Preparation & 180m Strategy', icon: '🔥' },
        { id: 'progress-analytics', label: 'Your Progress & Advanced Metrics', icon: '📊' },
    ];

    const helpItems: HelpItem[] = useMemo(() => [
        // =========================================================================
        // --- 1. GETTING STARTED & SETUP ---
        // =========================================================================
        {
            id: 'what-is-this-app',
            category: 'getting-started',
            title: 'What is this app? (JEE War Room & Sentinel OS)',
            tags: ['overview', 'guide', 'basics', 'tiers', 'intro', 'sentinel', 'philosophy'],
            summary: 'Understand the 3-tier intelligence system: Tracker, Analyst, Strategist with 100% local-first privacy.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-6 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 shadow-xl space-y-3">
                        <p className="font-bold text-cyan-300 text-lg md:text-xl flex items-center gap-2">
                            <span>🚀</span> An Institutional Exam Intelligence Operating System
                        </p>
                        <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                            Most test apps simply record your score (e.g. <em>"162/300"</em>) and leave you to guess what went wrong. 
                            <strong> Sentinel OS</strong> functions like a quantitative trading terminal for competitive exam preparation. It ingests per-question peer telemetry, performs Gaussian rank normalization, diagnoses psychometric Error DNA (E1-E7), and vaccinates you against repeating identical mistakes using SuperMemo-2 Spaced Repetition.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-white font-bold text-base md:text-lg tracking-wide uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                            <span>🏛️</span> The 3 Capability Tiers
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-100 text-sm md:text-base tracking-wide uppercase flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                                        Tier 1 -- TRACKER (Telemetry Ingestion)
                                    </span>
                                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-700 text-slate-200 font-bold">What happened?</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Logs test scorecards, ExamGOAL per-question response telemetry, study session durations, and chapter coverage over time without sending data to external cloud servers.
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-800/80 border border-amber-500/40 shadow-md space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-amber-300 text-sm md:text-base tracking-wide uppercase flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                                        Tier 2 -- ANALYST (Psychometric Diagnostics)
                                    </span>
                                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold">Why did it happen?</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Categorizes errors into 7 distinct codes (E1-E7), separates <em>Knowledge Deficits</em> from <em>Aptitude Leaks</em>, tracks Time Liabilities (Σ Δt), and calculates rolling Burnout Risk.
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-800/80 border border-cyan-500/40 shadow-md space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-cyan-400 text-sm md:text-base tracking-wide uppercase flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                                        Tier 3 -- STRATEGIST (Autonomous Execution)
                                    </span>
                                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold">What to do right now?</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Multi-Persona AI Copilot constructs your daily schedule, projects your Gaussian normalized All-India Rank, and schedules high-ROI spaced repetition practice.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-4">
                        <p className="font-bold text-cyan-300 text-sm md:text-base uppercase tracking-wider flex items-center gap-2">
                            <span>🔄</span> The Closed-Loop Rank Leap Flywheel
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center text-xs md:text-sm">
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                                <span className="block font-bold text-slate-100">1. Take Mock</span>
                                <span className="text-xs text-slate-400">CBT / Paper</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-1">
                                <span className="block font-bold text-slate-100">2. Ingest Data</span>
                                <span className="text-xs text-slate-400">JSON / OCR</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-1">
                                <span className="block font-bold text-amber-300">3. Gap Audit</span>
                                <span className="text-xs text-slate-400">E1-E7 & Time Lag</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-1">
                                <span className="block font-bold text-cyan-300">4. Vaccinate</span>
                                <span className="text-xs text-slate-400">SM-2 Sprints</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-1">
                                <span className="block font-bold text-emerald-300">5. Rank Jump</span>
                                <span className="text-xs text-slate-400">+30-50 Marks</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'profile-setup-guide',
            category: 'getting-started',
            title: 'How do I set up my profile & target metrics?',
            tags: ['profile', 'settings', 'target', 'marks', 'api keys', 'gemini'],
            summary: 'Step-by-step setup for target exams, target scores, and multi-provider AI keys.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Setting accurate target metrics ensures that the <strong>What-If Rank Simulator</strong>, <strong>College Predictor</strong>, and <strong>Daily Task Engine</strong> produce realistic, tailored benchmarks.
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 text-sm md:text-base uppercase tracking-wider flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-800">1</span>
                                Open Settings Tab
                            </span>
                            <p className="text-sm text-slate-300 pl-8.5">Click <strong>Settings</strong> at the bottom of the sidebar (or press <kbd className="px-2 py-1 rounded bg-slate-900 text-cyan-400 font-mono text-xs border border-slate-700">Alt + 0</kbd>).</p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 text-sm md:text-base uppercase tracking-wider flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-800">2</span>
                                Set Target Exam & Score Goals
                            </span>
                            <p className="text-sm text-slate-300 pl-8.5">
                                Set your target (e.g. <em>JEE Mains 2026 Shift 1</em>), dream score target (e.g. <em>210/300</em>), and your primary goal college branch (e.g. <em>NIT Trichy CSE</em> or <em>IIT Bombay EE</em>).
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 text-sm md:text-base uppercase tracking-wider flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-800">3</span>
                                Connect Your AI Keys (Free Gemini 3.7 Flash)
                            </span>
                            <p className="text-sm text-slate-300 pl-8.5">
                                Get a free API Key from <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-mono font-bold">aistudio.google.com</a> and paste it in the Gemini API Key field. 
                                Sentinel automatically routes vision OCR and Socratic explanations through <strong>Gemini 3.7 Flash</strong> with fallback to <strong>Gemini 3.6 Flash</strong>.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 text-sm md:text-base uppercase tracking-wider flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-cyan-800">4</span>
                                Focus Soundscapes & Audio Cues
                            </span>
                            <p className="text-sm text-slate-300 pl-8.5">
                                Toggle audio synthesizer cues on for instant positive reinforcement (+25 XP chimes, level-up fanfares, and Alpha 10Hz binaural beats).
                            </p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'day-1-quickstart-blueprint',
            category: 'getting-started',
            title: 'What should I do on Day 1? (The 24-Hour Quickstart Blueprint)',
            tags: ['day 1', 'quickstart', 'start', 'action plan', 'first steps'],
            summary: 'Your exact 5-step action checklist for your first day on Sentinel OS.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Do not try to master every widget on Day 1. Execute this 5-step sequence to get your intelligence layer humming immediately:
                    </p>

                    <div className="space-y-3.5">
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-800/80 border border-cyan-500/40">
                            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-mono text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                                1
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm md:text-base font-bold text-white uppercase tracking-wide">Ingest Your Recent Mock Test Data</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Go to <strong>ExamGoal Importer</strong> tab and upload your `batch.json` + `attempt.json`, or head to <strong>OCR Scanner</strong> to photograph a paper scorecard.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                                2
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm md:text-base font-bold text-white uppercase tracking-wide">Inspect Your Top-Student Gap Matrix</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Open the <strong>Dashboard</strong>. Look at your <em>Time Liability Counter</em> and <em>Careless Leak Radar</em> to see how many marks you dropped on questions where ≥ 70% of peers were correct.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                                3
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm md:text-base font-bold text-white uppercase tracking-wide">Synthesize Your First 15 Error Vaccines</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Navigate to <strong>Error Vaccinator</strong> → <strong>Triage</strong> tab. Click <em>Synthesize All Missed Questions</em>. Gemini will create holographic active recall cards for each mistake.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                                4
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm md:text-base font-bold text-white uppercase tracking-wide">Run 1 Aptitude Speed Sprint (90s Drills)</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Under the <strong>Dual Sprints</strong> tab, launch a 10-minute speed drill. Train your brain to make rapid first-round execution decisions under a 90-second countdown.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-800/80 border border-emerald-500/40">
                            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-mono text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                                5
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm md:text-base font-bold text-emerald-300 uppercase tracking-wide">Populate Tomorrow's Daily Planner</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Go to <strong>Daily Planner</strong> → click <em>Auto-Generate AI Schedule</em>. It will place your weakest high-ROI chapters into your morning deep-work blocks.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'keyboard-shortcuts-guide',
            category: 'getting-started',
            title: 'Keyboard Shortcuts & Speed Navigation Mastery',
            tags: ['shortcuts', 'hotkeys', 'navigation', 'speed', 'command palette'],
            summary: 'Navigate the entire operating system in milliseconds without reaching for the mouse.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Top quantitative operators navigate by keyboard. Sentinel provides full hotkey accessibility:
                    </p>

                    <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm font-mono">
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Universal Command Palette</span>
                                <kbd className="px-2.5 py-1 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800 font-bold">Ctrl + K</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Close Any Modal</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 font-bold">ESC</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Dashboard HUD</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 font-bold">Alt + 1</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Interactive Syllabus Maps</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 font-bold">Alt + 2</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Daily Planner & Timer</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 font-bold">Alt + 3</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Question Log Editor</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 font-bold">Alt + 4</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Detailed Test Reports</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 font-bold">Alt + 5</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Root Cause Diagnostics</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 font-bold">Alt + 6</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">AI Multi-Persona Copilot</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 font-bold">Alt + 7</kbd>
                            </div>
                            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-slate-200 font-sans">Error Vaccinator Deck</span>
                                <kbd className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 font-bold">Alt + 8</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'backup-privacy-guide',
            category: 'getting-started',
            title: 'How to Back Up & Restore Your Data (Local-First Privacy)',
            tags: ['backup', 'restore', 'export', 'privacy', 'indexeddb', 'json'],
            summary: 'Your test data lives 100% on your device. Learn how to export and sync JSON snapshots.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-2">
                        <span className="font-bold text-emerald-300 text-base md:text-lg flex items-center gap-2">
                            <span>🔒</span> Zero-Telemetry Guarantee
                        </span>
                        <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                            Sentinel never transmits your question logs, test scores, or personal reflections to cloud databases. Everything is persisted locally in your browser via Dexie IndexedDB (`JeePerformanceDB`).
                        </p>
                    </div>

                    <div className="space-y-3.5 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <span className="font-bold text-cyan-300 uppercase tracking-wider block text-sm md:text-base mb-1">Backup Best Practices:</span>
                        <div className="space-y-2.5 text-slate-300">
                            <p>1. <strong>Weekly Export:</strong> Go to <strong>Settings</strong> → click <em>"Export Full Database Backup (.json)"</em>.</p>
                            <p>2. <strong>Browser Cache Protection:</strong> Do not run "Clear All Website Data" in your browser without exporting a backup first.</p>
                            <p>3. <strong>Device Migration:</strong> To move your dashboard to another laptop, simply open the new browser and click <em>"Restore Backup (.json)"</em>.</p>
                        </div>
                    </div>
                </div>
            )
        },

        // =========================================================================
        // --- 2. UNDERSTANDING YOUR DATA (E1-E7) ---
        // =========================================================================
        {
            id: 'error-codes-e1-e7',
            category: 'understanding-data',
            title: 'What are Error Codes E1-E7? (Complete Error DNA Guide)',
            tags: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'error dna', 'taxonomy', 'marks'],
            summary: 'Deep breakdown of E1 to E7 codes: what each means, severity, and exact fix.',
            content: (
                <div className="space-y-5 text-slate-200 text-sm md:text-base">
                    <p className="text-sm text-slate-300">
                        When logging wrong questions, tag them with one of 7 codes. The app uses this to build your <strong>Error DNA</strong> and diagnose whether you need more theory or better execution.
                    </p>

                    <div className="space-y-4">
                        {/* E1 */}
                        <div className="p-5 rounded-2xl bg-slate-800/90 border border-blue-500/40 shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-blue-400 text-base md:text-lg">E1 -- Conceptual Gap</span>
                                <span className="text-xs px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold uppercase">High Severity</span>
                            </div>
                            <p className="text-sm text-slate-200">Did not know or understand the underlying physical/mathematical principle.</p>
                            <div className="text-xs md:text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed">
                                <strong className="text-blue-300">Fix Protocol:</strong> Re-learn theory from scratch. Open AI Coach in <em>Feynman Mode</em> to explain the concept back until gaps are eliminated.
                            </div>
                        </div>

                        {/* E2 */}
                        <div className="p-5 rounded-2xl bg-slate-800/90 border border-purple-500/40 shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-purple-400 text-base md:text-lg">E2 -- Formula Recall / Application Slip</span>
                                <span className="text-xs px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 font-semibold uppercase">Med-High Severity</span>
                            </div>
                            <p className="text-sm text-slate-200">Understood concept, but forgot, misapplied, or remembered formula incorrectly.</p>
                            <div className="text-xs md:text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed">
                                <strong className="text-purple-300">Fix Protocol:</strong> Convert the formula into a Cloze deletion card in the Error Vaccinator. Derive from first principles once.
                            </div>
                        </div>

                        {/* E3 */}
                        <div className="p-5 rounded-2xl bg-slate-800/90 border border-amber-500/40 shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-400 text-base md:text-lg">E3 -- Calculation Slip / Arithmetic Blunder</span>
                                <span className="text-xs px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold uppercase">Medium Severity</span>
                            </div>
                            <p className="text-sm text-slate-200">Knew concept and formula, but made an arithmetic, sign, factor-of-2, or algebraic mistake mid-solve.</p>
                            <div className="text-xs md:text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed">
                                <strong className="text-amber-300">Fix Protocol:</strong> Enforce structured scratchpad division. Slow down by 10% during algebraic simplification. Verify dimensions at the final step.
                            </div>
                        </div>

                        {/* E4 */}
                        <div className="p-5 rounded-2xl bg-slate-800/90 border border-emerald-500/40 shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-400 text-base md:text-lg">E4 -- Misread Question / Boundary Trap</span>
                                <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold uppercase">Med-High Severity</span>
                            </div>
                            <p className="text-sm text-slate-200">Misread question text (e.g. "INCORRECT statement"), missed unit conversions (cm vs m, rad vs deg), or missed boundary conditions (x &gt; 0).</p>
                            <div className="text-xs md:text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed">
                                <strong className="text-emerald-300">Fix Protocol:</strong> Mandatory 5-second boundary underline rule before writing calculations. Highlight unit terms on scratch paper.
                            </div>
                        </div>

                        {/* E5 */}
                        <div className="p-5 rounded-2xl bg-slate-800/90 border border-rose-500/40 shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-400 text-base md:text-lg">E5 -- Time Panic & Rush</span>
                                <span className="text-xs px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold uppercase">High Severity</span>
                            </div>
                            <p className="text-sm text-slate-200">Rushed in final minutes of paper, abandoned strategy, panicked after getting stuck, and made reckless mistakes.</p>
                            <div className="text-xs md:text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed">
                                <strong className="text-rose-300">Fix Protocol:</strong> Follow the 3-Pass Rule strictly. Never stay stuck on any question past 120 seconds in Pass 1. Enter the final 20 minutes with zero panic.
                            </div>
                        </div>

                        {/* E6 */}
                        <div className="p-5 rounded-2xl bg-slate-800/90 border border-cyan-500/40 shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-cyan-400 text-base md:text-lg">E6 -- Wild Guess / Silly Skip</span>
                                <span className="text-xs px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold uppercase">Critical Hazard</span>
                            </div>
                            <p className="text-sm text-slate-200">Gambled on an option without 50/50 logical elimination, or skipped a direct formula question because it looked lengthy.</p>
                            <div className="text-xs md:text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed">
                                <strong className="text-cyan-300">Fix Protocol:</strong> Zero blind guesses. Apply the 30-second read rule: spend 30 seconds reading every long question before making a skip call.
                            </div>
                        </div>

                        {/* E7 */}
                        <div className="p-5 rounded-2xl bg-slate-800/90 border border-fuchsia-500/40 shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-fuchsia-400 text-base md:text-lg">E7 -- Distractor Trap (Overconfidence)</span>
                                <span className="text-xs px-2.5 py-1 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 font-semibold uppercase">Elite Rank Trap</span>
                            </div>
                            <p className="text-sm text-slate-200">Selected an answer with 100% confidence, but fell into a trap specifically engineered by exam setters (e.g. neglected zero-potential ground).</p>
                            <div className="text-xs md:text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed">
                                <strong className="text-fuchsia-300">Fix Protocol:</strong> Launch <em>Knowledge Feynman Drill</em> in Dual Sprints. Force yourself to articulate why the attractive trap option is physically flawed before choosing.
                            </div>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'subject-error-dna-breakdown',
            category: 'understanding-data',
            title: 'Physics vs Chemistry vs Maths Error DNA Archetypes',
            tags: ['subject error dna', 'physics', 'chemistry', 'maths', 'failure modes'],
            summary: 'How error signatures manifest differently across PCM and how to remediate each.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Error patterns differ across subjects. Physics failure is often geometric/boundary, Chemistry is recall/exception, and Maths is algebraic stamina:
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-600/50 space-y-2 text-blue-200">
                            <span className="font-bold text-blue-300 uppercase tracking-wider block text-base">⚡ Physics Dominant Failure: E4 & E7 (Boundary & Sign Traps)</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Forgetting reference frames, mixing up signs in lens formula or potential difference, and omitting rotational kinetic energy in rolling without slipping.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-600/50 space-y-2 text-emerald-200">
                            <span className="font-bold text-emerald-300 uppercase tracking-wider block text-base">🧪 Chemistry Dominant Failure: E2 & E4 (Exceptions & Concentration Units)</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Forgetting inorganic exceptions (e.g. electron gain enthalpy of Chlorine vs Fluorine), confusing reagents (PCC vs KMnO4), and mixing up Molality vs Molarity.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-600/50 space-y-2 text-purple-200">
                            <span className="font-bold text-purple-300 uppercase tracking-wider block text-base">📐 Maths Dominant Failure: E3 & E5 (Algebra Fatigue & Time Sinks)</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Stalling on 7-minute definite integral substitutions, dropping negative signs in determinants, and rushing the final 5 numerical questions.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'rank-predictor-explained',
            category: 'understanding-data',
            title: 'How to read the Rank Predictor? (Gaussian Normalization)',
            tags: ['rank', 'percentile', 'gaussian', 'z-score', 'prediction', 'nta'],
            summary: 'How Sentinel converts raw mock marks into normalized NTA percentiles and All-India Ranks.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Raw marks in JEE Mains do not map linearly to ranks because test paper shifts vary drastically in difficulty. Sentinel normalizes candidate performance against empirical cohort distributions:
                    </p>

                    <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                        <span className="font-bold text-cyan-300 text-base">Gaussian Standard Normal Score (Z-Score)</span>
                        <div className="text-cyan-200 font-mono text-sm bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                            Z = (x_user - μ_cohort) / σ_cohort
                        </div>
                        <p className="text-xs md:text-sm text-slate-400">
                            Where <code>x_user</code> is your score, <code>μ_cohort</code> is the peer cohort mean, and <code>σ_cohort</code> is the standard deviation.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                        <span className="font-bold text-purple-300 text-base">Cumulative Distribution Function (CDF)</span>
                        <div className="text-purple-200 font-mono text-sm bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                            Percentile = 0.5 * (1 + erf(Z / √2)) * 100
                        </div>
                        <p className="text-xs md:text-sm text-slate-400">
                            The resulting percentile accurately models your position against the total test-taker candidate pool (N = 1,400,000).
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-sm text-amber-200 leading-relaxed">
                        💡 <strong>Confidence Bands:</strong> When the predictor reports <em>"96.4% - 97.8% (AIR 32,000 - 45,000)"</em>, it represents your 80% confidence interval across your last 5 mock tests.
                    </div>
                </div>
            )
        },

        {
            id: 'top-student-gap-matrix-guide',
            category: 'understanding-data',
            title: 'Top-Student Gap Matrix & Time Liability Metric (Δt)',
            tags: ['gap matrix', 'top student', 'time liability', 'careless radar', 'delta t'],
            summary: 'Isolating lost marks into Careless Leaks, Distractor Traps, and Time Sinks against cohort averages.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        The <strong>Top-Student Gap Matrix</strong> compares your question-by-question telemetry with the top 5% peer benchmark:
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-600/50 space-y-2 text-amber-200">
                            <span className="font-bold text-amber-300 uppercase tracking-wider block text-base">⏱️ Time Liability Counter (Σ Δt)</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Cumulative seconds lost hesitating or stalling beyond peer averages on solvable questions:
                            </p>
                            <div className="font-mono text-sm bg-slate-900/90 p-3 rounded-xl text-amber-300 border border-slate-800">
                                TimeLiability = Σ max(0, t_user,i - t_peer_avg,i)
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-600/50 space-y-2 text-rose-200">
                            <span className="font-bold text-rose-300 uppercase tracking-wider block text-base">🎯 Careless Leak Radar (Ease ≥ 70%)</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Identifies questions with ≥ 70% peer accuracy where you marked wrong or skipped. These represent your easiest +20 to +35 mark recovery opportunity.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'burnout-risk-explained',
            category: 'understanding-data',
            title: 'What does Burnout Risk mean? (Fatigue & Psychometric Stability)',
            tags: ['burnout', 'stress', 'health', 'fatigue', 'recovery', 'sleep'],
            summary: 'Understand the 4 burnout zones and why strategic rest yields higher marks than exhaustion.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        The Burnout Risk Score (0-100) measures rolling 14-day study intensity, negative mark volatility, late-night sessions, and error clustering.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/80 text-emerald-300">
                            <span className="font-bold text-base block mb-1">🟢 0-44: OPTIMAL RETENTION ZONE</span>
                            <p className="text-sm text-slate-200">Full study load. High synaptic neuroplasticity. Optimal for tackling new, difficult chapters.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-700/80 text-amber-300">
                            <span className="font-bold text-base block mb-1">🟡 45-69: MODERATE COGNITIVE STRAIN</span>
                            <p className="text-sm text-slate-200">Reduce intense problem sets by 20%. Switch to spaced flashcards and structured revision instead of starting new heavy topics.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-orange-950/60 border border-orange-700/80 text-orange-300">
                            <span className="font-bold text-base block mb-1">🟠 70-84: HIGH FATIGUE RISK</span>
                            <p className="text-sm text-slate-200">Cognitive speed drops by ~20%. Calculation slips (E3) and misread traps (E4) will spike. Schedule an active rest half-day.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-700/80 text-rose-300">
                            <span className="font-bold text-base block mb-1">🔴 85-100: CRITICAL BURNOUT EMERGENCY</span>
                            <p className="text-sm text-slate-200">Mandatory deload day. Forcing study in this state creates negative learning loops and test anxiety. Take a full 12-hour mental reset.</p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'radar-8d-explained',
            category: 'understanding-data',
            title: 'How to read the 8D Radar & Calibration Matrix?',
            tags: ['radar', 'dimensions', 'selectivity', 'endurance', 'analytics', 'dunning-kruger'],
            summary: 'Deconstruct your 8 competitive dimensions and the Dunning-Kruger Calibration Matrix.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        The 8D Performance Radar isolates the 8 fundamental psychometric traits of top IIT-JEE rankers:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs md:text-sm">
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                            <span className="font-bold text-cyan-400 block text-base">1. Speed:</span>
                            <p className="text-slate-300">Marks earned per minute of active test time.</p>
                        </div>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                            <span className="font-bold text-emerald-400 block text-base">2. Accuracy:</span>
                            <p className="text-slate-300">% correct answers out of total attempted questions.</p>
                        </div>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-amber-600/60 space-y-1">
                            <span className="font-bold text-amber-400 block text-base">3. Selectivity:</span>
                            <p className="text-slate-300">Quality of skip decisions. High selectivity = 0 negative marks on hard traps.</p>
                        </div>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                            <span className="font-bold text-purple-400 block text-base">4. Confidence:</span>
                            <p className="text-slate-300">Correlation between self-assessed certainty and true correctness.</p>
                        </div>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                            <span className="font-bold text-blue-400 block text-base">5. Consistency:</span>
                            <p className="text-slate-300">Score variance across subjects (Physics vs Chemistry vs Maths balance).</p>
                        </div>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                            <span className="font-bold text-rose-400 block text-base">6. Endurance:</span>
                            <p className="text-slate-300">Accuracy in the final 45 minutes vs the first 45 minutes of a mock.</p>
                        </div>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                            <span className="font-bold text-fuchsia-400 block text-base">7. Adaptability:</span>
                            <p className="text-slate-300">Recovery rate when encountering 3 difficult questions consecutively.</p>
                        </div>
                        <div className="p-4 bg-slate-800/80 rounded-2xl border border-teal-400/50 space-y-1">
                            <span className="font-bold text-teal-400 block text-base">8. Recovery:</span>
                            <p className="text-slate-300">Bounce-back speed in your next mock after a personal score dip.</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-sm">
                        <span className="font-bold text-purple-300 uppercase tracking-wider text-base">🎯 Dunning-Kruger Calibration Matrix</span>
                        <p className="text-slate-200 leading-relaxed">
                            Plots your confidence against accuracy. Questions in the <em>"High Confidence + Wrong Answer"</em> quadrant are your fatal blind spots (E7 traps). Questions in <em>"Low Confidence + Correct Answer"</em> are latent strengths ready for speed crystallization.
                        </p>
                    </div>
                </div>
            )
        },

        // =========================================================================
        // --- 3. SUBJECT MASTER TACTICS (PCM) ---
        // =========================================================================
        {
            id: 'physics-master-strategy',
            category: 'subject-tactics',
            title: 'Physics Master Strategy: From Free-Body Diagrams to Limiting Extremes',
            tags: ['physics', 'mechanics', 'electrodynamics', 'optics', 'dimensional analysis'],
            summary: 'The 4-step physics solving algorithm: Diagram, Equations, Limiting Cases, Units.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Top Physics scorers don't memorize question types; they execute a structured 4-step first-principles solving pipeline:
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 text-base md:text-lg">1. Clean Diagram & Coordinate Axes:</span>
                            <p className="text-sm text-slate-200">Never write an equation without drawing a Free-Body Diagram (FBD) or Circuit Diagram with explicit positive coordinate axes.</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-emerald-300 text-base md:text-lg">2. Conservation Laws First:</span>
                            <p className="text-sm text-slate-200">Always check for conservation of Momentum, Energy, or Charge before setting up heavy differential equations.</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-amber-300 text-base md:text-lg">3. Limiting Cases & Extremes:</span>
                            <p className="text-sm text-slate-200">Test m → 0, t → ∞, or θ → 0 to eliminate 2 out of 4 options in under 15 seconds without full calculation.</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-purple-300 text-base md:text-lg">4. Dimensional & Unit Verification:</span>
                            <p className="text-sm text-slate-200">Verify whether the final algebraic expression has dimensions of Energy (M L² T⁻²) or Force (M L T⁻²).</p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'chemistry-master-strategy',
            category: 'subject-tactics',
            title: 'Chemistry Master Strategy: Organic Mechanisms & Inorganic Exceptions',
            tags: ['chemistry', 'organic', 'inorganic', 'physical chemistry', 'ncert'],
            summary: 'How to reliably score 80+ in Chemistry in under 40 minutes.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Chemistry is the ultimate rank-booster because it provides the highest marks-per-minute return in the entire JEE paper:
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-emerald-300 uppercase tracking-wider block text-base md:text-lg">Inorganic Chemistry NCERT Protocol</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Every line of p-block, d-block, and Coordination Compounds is potential question material. Convert NCERT color changes, oxidation states, and anomalous trends into Cloze SRS flashcards.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 uppercase tracking-wider block text-base md:text-lg">Organic Reagent Matrix & Electron Flow</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Do not memorize isolated reactions. Categorize reagents into Nucleophiles, Electrophiles, Oxidizing Agents, and Reducing Agents. Follow carbocation stability (3° &gt; 2° &gt; 1°) and resonance stabilization.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-amber-300 uppercase tracking-wider block text-base md:text-lg">Physical Chemistry Formula Precision</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Practice Thermodynamics and Electrochemistry calculations with exact constants (R = 8.314 J/(mol·K) = 0.0821 L·atm/(mol·K), F = 96500 C).
                            </p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'mathematics-master-strategy',
            category: 'subject-tactics',
            title: 'Mathematics Speed & Rigor Protocol: Calculus & Coordinate Geometry',
            tags: ['mathematics', 'calculus', 'algebra', 'coordinate geometry', 'vectors'],
            summary: 'Techniques for conquering lengthy algebra and finding elegant geometric shortcuts.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        JEE Mains Maths has become notoriously lengthy in recent years. Survival requires active algebraic discipline:
                    </p>

                    <div className="space-y-4 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <p>1. <strong>Geometric Visualization:</strong> Draw conic sections and tangent curves to scale. Often, the shortest distance between curves lies along the common normal.</p>
                        <p>2. <strong>Calculus Properties & Symmetry:</strong> Apply King's Rule (Integral from a to b of f(x) = Integral of f(a+b-x)) and Leibniz Integral Rule before attempting brute-force integration.</p>
                        <p>3. <strong>Vectors & 3D Geometry:</strong> Use vector cross products (a × b) and scalar triple products [a b c] for distances between skew lines instead of setting up multi-variable Cartesian equations.</p>
                    </div>
                </div>
            )
        },

        // =========================================================================
        // --- 4. STUDYING SMARTER (AI & SRS) ---
        // =========================================================================
        {
            id: 'ai-coach-guide',
            category: 'studying-smarter',
            title: 'How to use AI Coach effectively? (Multi-Persona Prompting)',
            tags: ['ai', 'coach', 'feynman', 'socratic', 'prompts', 'latex'],
            summary: 'How to leverage Socratic mentors, STEM LaTeX derivations, and anxiety focus resets.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        The Sentinel AI Copilot is equipped with specialized behavioral personas powered by Gemini 3.7 Flash:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-700/80 text-emerald-200 space-y-3">
                            <p className="font-bold text-emerald-300 flex items-center gap-2 text-base">
                                <span>✅</span> HIGH-IMPACT PROMPT EXAMPLES:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-200 leading-relaxed">
                                <li><em>"Analyze my E3 calculation blunders in Rotation and give me 3 boundary checks."</em></li>
                                <li><em>"Act as Socratic Coach: Guide me through Q23 without giving away the final formula."</em></li>
                                <li><em>"Show complete LaTeX step-by-step derivation of cyclotron frequency with relativistic correction."</em></li>
                            </ul>
                        </div>

                        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-700/80 text-rose-200 space-y-3">
                            <p className="font-bold text-rose-300 flex items-center gap-2 text-base">
                                <span>❌</span> AVOID LOW-VALUE PROMPTS:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-200 leading-relaxed">
                                <li><em>"Explain Electrostatics."</em> (Too generic; read textbooks for basic theory)</li>
                                <li><em>"How do I score 250 in JEE?"</em> (Ask for chapter-specific tactical steps instead)</li>
                                <li><em>"Give me 50 random MCQs."</em> (Use the Question Log / CBT Reattempt instead)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'feynman-mode-guide',
            category: 'studying-smarter',
            title: 'What is Feynman Mode? (Active Concept Articulation)',
            tags: ['feynman', 'active recall', 'articulation', 'teaching', 'gaps'],
            summary: 'How articulating traps before seeing solutions builds bulletproof conceptual immunity.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-200 space-y-2 text-sm">
                        <p className="font-bold text-purple-300 text-base md:text-lg flex items-center gap-2">
                            <span>🧠</span> The Feynman Knowledge Drill Principle
                        </p>
                        <p className="text-slate-200 leading-relaxed">
                            Nobel Laureate Richard Feynman noted that you only truly understand a principle when you can explain it in plain language without relying on jargon.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 text-base">How to use it in Sentinel Sprints:</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                When a question appears in the <strong>Knowledge Feynman Drill</strong>, the correct answer is hidden. You are prompted to articulate: <em>"Why is option B the trap? What physical law invalidates option D?"</em>
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-emerald-300 text-base">The Neurological Benefit:</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Articulating the failure mode wires your brain to spot distractors in under 5 seconds during the actual exam.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'srs-error-vaccinator-guide',
            category: 'studying-smarter',
            title: 'How to use SRS Flashcards & Error Vaccinator?',
            tags: ['srs', 'sm2', 'flashcards', 'vaccinator', 'decks', 'anki'],
            summary: 'Using 3D holographic cards, SM-2 scheduling, and Anki CSV export for permanent retention.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        The <strong>Error Vaccinator</strong> is not a standard flashcard app. It is a prioritized spaced repetition clinical deck for exam errors.
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 uppercase tracking-wider text-base">Track A (ExamGOAL Rich Questions) vs Track B (Concept Stubs)</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                <strong>Track A cards</strong> preserve high-resolution circuit diagrams, organic structures, and full LaTeX option sets. <strong>Track B cards</strong> focus on concise formula derivations and mnemonic rules.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                            <span className="font-bold text-amber-300 uppercase tracking-wider text-base">The 3-Tier Self-Assessment Feedback</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                                <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-700/80 text-rose-300">
                                    <strong className="block text-base">Still Shaky</strong>
                                    <span className="text-xs text-slate-300">+5 XP • Review Today</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-700/80 text-blue-300">
                                    <strong className="block text-base">Got It</strong>
                                    <span className="text-xs text-slate-300">+25 XP • Review in 3 Days</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/80 text-emerald-300">
                                    <strong className="block text-base">Mastered</strong>
                                    <span className="text-xs text-slate-300">+50 XP • Review in 7+ Days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'boss-questions-guide',
            category: 'studying-smarter',
            title: 'What is a Boss Question? (Capstone Multi-Concept Mastery)',
            tags: ['boss question', 'advanced', 'capstone', 'hard', 'mastery'],
            summary: 'How solving multi-part capstone problems proves true chapter exam readiness.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        In each chapter of the <strong>Interactive Syllabus</strong>, you will find 1 capstone <strong>Boss Question</strong>.
                    </p>

                    <div className="p-5 rounded-2xl bg-slate-800/80 border border-amber-500/40 space-y-3">
                        <span className="font-bold text-amber-300 text-base md:text-lg">👑 Characteristics of a Boss Question:</span>
                        <ul className="list-disc list-inside space-y-2 text-sm text-slate-200">
                            <li>Synthesizes 2 or 3 distinct subtopics (e.g. <em>Conservation of Angular Momentum + Variable Mass + Energy Dissipation</em>).</li>
                            <li>Contains 3 structured sub-parts (Part A: Equilibrium → Part B: Perturbation → Part C: Frequency).</li>
                            <li>Requires zero hints to unlock the gold <em>"Chapter Immunized"</em> status node.</li>
                        </ul>
                    </div>

                    <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-700/60 text-sm text-cyan-200 leading-relaxed">
                        💡 <strong>Auto-Remediation:</strong> If you miss any sub-part of a Boss Question, Sentinel automatically synthesizes 2 targeted prerequisite cards and queues them in your morning Spaced Repetition deck.
                    </div>
                </div>
            )
        },

        {
            id: 'pomodoro-binaural-beats-guide',
            category: 'studying-smarter',
            title: 'The Pomodoro Focus Chamber & Binaural Beats Engine',
            tags: ['pomodoro', 'binaural beats', 'alpha waves', 'focus soundscapes', 'audio engine'],
            summary: 'Using real-time synthesized Alpha (10Hz) and Brown Noise to lock into 90-minute flow states.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Built on the native Web Audio API, Sentinel synthesizes focus frequencies locally with zero external audio stream lag:
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 text-base">Alpha Waves (10 Hz):</span>
                            <p className="text-sm text-slate-200">Synchronizes hemispheric brainwave activity for calm, alert analytical problem solving.</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-purple-300 text-base">Theta Waves (6 Hz):</span>
                            <p className="text-sm text-slate-200">Deeper relaxation frequency for memorizing inorganic chemistry reaction trees.</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-amber-300 text-base">Brown & Pink Noise:</span>
                            <p className="text-sm text-slate-200">Dampens ambient household distractions and stabilizes auditory focus.</p>
                        </div>
                    </div>
                </div>
            )
        },

        // =========================================================================
        // --- 5. WHEN THINGS GO WRONG (EMOTIONAL & TACTICAL FIRST AID) ---
        // =========================================================================
        {
            id: 'score-dropped-troubleshoot',
            category: 'when-things-go-wrong',
            title: 'My score dropped 20-40 marks. What do I do? (Post-Mock Triage)',
            tags: ['score drop', 'panic', 'triage', 'troubleshoot', 'failure', 'mock'],
            summary: 'The emergency 5-step diagnostic checklist to execute when a mock test score dips.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-2">
                        <p className="font-bold text-rose-300 text-base md:text-lg flex items-center gap-2">
                            <span>🛑</span> RULE #1: NEVER PANIC AFTER ONE TEST
                        </p>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            A single score dip is almost never a loss of knowledge. It is 90% driven by either <strong>Paper Difficulty Variation</strong> or an <strong>Execution Leak Cluster</strong>.
                        </p>
                    </div>

                    <div className="space-y-3.5 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <span className="font-bold text-cyan-300 uppercase tracking-wider block text-base mb-2">The 5-Step Forensic Triage:</span>
                        <div className="space-y-2.5 text-slate-200">
                            <p><strong>1. Compare Cohort Percentile:</strong> Did your percentile drop as much as your raw marks? If marks fell by 25 but percentile stayed 97.2%, the paper was difficult for everyone.</p>
                            <p><strong>2. Check Negative Marking:</strong> Did you lose 20+ marks to negative penalties? If yes, the issue is <em>Selectivity</em>, not theory.</p>
                            <p><strong>3. Check Time Sinks:</strong> Did you stall on 3 questions for &gt; 5 minutes each? That cost you 20 minutes and caused late-paper panic (E5).</p>
                            <p><strong>4. Check Sleep & Burnout:</strong> Were you operating on &lt; 6 hours of sleep before the test?</p>
                            <p><strong>5. Execute 24h Remediation:</strong> Vaccinate all missed questions into the flashcard deck within 24 hours.</p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'study-10h-no-improvement',
            category: 'when-things-go-wrong',
            title: 'I study 10 hours a day but don\'t improve. (The Illusion of Competence)',
            tags: ['stuck', 'plateau', 'hours', 'roi', 'effort', 'illusion of competence'],
            summary: 'Why passive studying fails and how to switch to high-yield active problem solving.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
                        <p className="font-bold text-amber-300 text-base md:text-lg">The "Illusion of Competence" Trap</p>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            Re-reading notes, highlighting textbooks, and watching YouTube solution videos feels productive, but it produces <strong>passive recognition</strong> rather than <strong>active retrieval</strong>. When tested under exam pressure, unexercised neural pathways fail.
                        </p>
                    </div>

                    <div className="space-y-3.5 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <span className="font-bold text-emerald-300 uppercase tracking-wider block text-base mb-2">The 70/30 High-Yield Protocol:</span>
                        <div className="space-y-2.5 text-slate-200">
                            <p>• <strong>70% Closed-Book Problem Solving:</strong> Solve problems with closed notes and a stopwatch. No peeking at solutions for at least 6 minutes.</p>
                            <p>• <strong>30% Targeted Theory:</strong> Only read theory to resolve a specific, identified E1 conceptual hole.</p>
                            <p>• <strong>Target Chapter ROI:</strong> Reallocate 100% of study time to chapters classified as <em>Quick Wins</em> in the ROI Matrix.</p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'feel-like-giving-up',
            category: 'when-things-go-wrong',
            title: 'I feel like giving up / Imposter Syndrome. (Mental Fortress Protocol)',
            tags: ['giving up', 'hopeless', 'stuck', 'emotions', 'mindset', 'imposter syndrome'],
            summary: 'An honest, data-backed perspective when motivation and confidence hit rock bottom.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 space-y-3">
                        <p className="font-bold text-cyan-300 text-base md:text-lg">That feeling is an emotion, not empirical data.</p>
                        <p className="text-sm text-slate-200">
                            Every single top-1000 IIT ranker experiences moments of feeling inadequate. In JEE Mains, the distribution curve is exceptionally steep in the 130 to 180 score range:
                        </p>
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center font-mono text-cyan-300 font-bold text-base">
                            Just +16 Marks (4 Clean Questions) = ~18,000 AIR Rank Leap!
                        </div>
                    </div>

                    <div className="space-y-3 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <span className="font-bold text-white uppercase tracking-wider block text-base mb-2">What to do right now:</span>
                        <p>1. Open <strong>Reflections</strong> tab and write down your unfiltered thoughts. Getting them out of your head reduces amygdala arousal.</p>
                        <p>2. Open <strong>Achievements</strong> tab. Review the badges and milestones you have already unlocked.</p>
                        <p>3. If Burnout Risk is &gt; 70, stop studying tonight. Sleep for 8.5 hours. Your brain needs sleep spindles to consolidate math memories.</p>
                    </div>
                </div>
            )
        },

        {
            id: 'panic-attack-in-exam',
            category: 'when-things-go-wrong',
            title: 'Dealing with Test Anxiety, Panic & Brain Fog During the Exam',
            tags: ['anxiety', 'panic', 'freeze', 'heart rate', 'blackout', 'breathing'],
            summary: 'The 60-second physiological sigh reset when your heart races during a mock test.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-200 space-y-3">
                        <span className="font-bold text-purple-300 text-base md:text-lg">The 60-Second Physiological Sigh</span>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            When adrenaline surges after seeing 2 hard questions:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-200">
                            <li>Put your pen down and look away from the monitor screen.</li>
                            <li>Take two deep inhales through your nose (one long, one short top-up).</li>
                            <li>Exhale slowly through your mouth for 6 seconds.</li>
                            <li>Repeat 3 times. This triggers the vagus nerve and slows your heart rate by 15-20 BPM.</li>
                        </ol>
                    </div>
                </div>
            )
        },

        {
            id: 'waking-4am-burnout',
            category: 'when-things-go-wrong',
            title: 'I\'m waking up at 4am but feel foggy and marks are dropping.',
            tags: ['sleep', '4am', 'fatigue', 'early morning', 'anxiety', 'circadian'],
            summary: 'Why sleep quality beats sleep sacrifice every single time in competitive STEM exams.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Forcing a 4:00 AM wake-up on 5 hours of sleep directly damages the prefrontal cortex--the exact brain region responsible for calculation accuracy and working memory.
                    </p>

                    <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-3">
                        <span className="font-bold text-emerald-300 text-base md:text-lg">The 7.5-Hour Sleep Protocol</span>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            Sleeping until 6:00 AM or 6:30 AM (7.5-8 full hours) allows your brain to complete its REM cycles where complex problem schemas are integrated into long-term memory.
                        </p>
                        <p className="text-sm font-semibold text-emerald-200">
                            2 hours of sharp, alert problem-solving beats 5 hours of foggy grinding every single day.
                        </p>
                    </div>
                </div>
            )
        },

        // =========================================================================
        // --- 6. EXAM PREPARATION & 180M STRATEGY ---
        // =========================================================================
        {
            id: 'three-pass-attempt-strategy',
            category: 'exam-prep',
            title: 'The 3-Pass Attempt Rule (The 180-Minute Master Blueprint)',
            tags: ['3-pass', 'strategy', 'time management', 'attempt', 'paper strategy', 'cbt'],
            summary: 'Never solve a JEE paper linearly from Q1 to Q75. Master the 3-Pass Attempt Protocol.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Linear test-takers get stuck on Q12 for 7 minutes, run out of time, and leave 8 easy direct-formula questions at the end unattempted. Use the 3-Pass Protocol:
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-700/80 text-emerald-200 space-y-2">
                            <span className="font-bold text-emerald-300 uppercase tracking-wider block text-base md:text-lg">🟢 Pass 1 (0 to 55 Mins): Easy Direct Sweeps</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Sweep all 75 questions across Physics, Chemistry, and Maths. Only solve Level-1 direct formula and standard theory questions (≥ 70% peer ease). Skip anything requiring &gt; 90 seconds. Target: <strong>30-35 Questions solved cleanly</strong>.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-amber-950/50 border border-amber-700/80 text-amber-200 space-y-2">
                            <span className="font-bold text-amber-300 uppercase tracking-wider block text-base md:text-lg">🟡 Pass 2 (55 to 135 Mins): Standard Core Problems</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Tackle Level-2 multi-step calculation and standard algorithm problems flagged for review during Pass 1. Maintain clean scratchpad calculations. Target: <strong>20-25 Questions</strong>.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-rose-950/50 border border-rose-700/80 text-rose-200 space-y-2">
                            <span className="font-bold text-rose-300 uppercase tracking-wider block text-base md:text-lg">🔴 Pass 3 (135 to 180 Mins): Hard Synthesis & Boundary Checks</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Address Level-3 novel geometry, multi-concept STEM problems, and verify calculation boundary checks on numerical response questions. Target: <strong>5-10 Questions</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'scratchpad-mastery-protocol',
            category: 'exam-prep',
            title: 'The Scratchpad Protocol: Eliminating Arithmetic Blunders (E3)',
            tags: ['scratchpad', 'calculation', 'neatness', 'arithmetic', 'rough sheet'],
            summary: 'How top students divide their rough sheet into numbered quadrants to prevent copying errors.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Over 60% of E3 calculation slips happen when students write numbers chaotically across the scratchpad and miscopy their own handwriting.
                    </p>

                    <div className="space-y-3.5 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <span className="font-bold text-cyan-300 uppercase tracking-wider block text-base mb-2">The 4-Quadrant Grid Method:</span>
                        <div className="space-y-2 text-slate-200">
                            <p>1. <strong>Fold into 4 Boxes:</strong> Fold each A4 rough sheet into 4 distinct quadrants.</p>
                            <p>2. <strong>Write Question Number Boldly:</strong> In the top-left of each box, write <strong>#Q14</strong>.</p>
                            <p>3. <strong>Final Value Boxing:</strong> Draw a rectangle around intermediate values (x = 4.2) so you don't confuse them with step numbers.</p>
                            <p>4. <strong>Instant Verification:</strong> If you return to a marked-for-review question in Pass 2, you can resume from your clean scratchpad step rather than recalculating from scratch.</p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'section-order-dilemma',
            category: 'exam-prep',
            title: 'Section Order Dilemma: Chemistry First vs Physics First',
            tags: ['section order', 'sequence', 'chemistry first', 'strategy', 'time allocation'],
            summary: 'The empirical data behind optimal section sequencing in JEE Mains.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-sm">
                        <span className="font-bold text-emerald-300 uppercase tracking-wider block text-base md:text-lg">Standard Top Ranker Sequence: Chemistry → Physics → Maths</span>
                        <p className="text-slate-200 leading-relaxed">
                            • <strong>Chemistry (0-40 mins):</strong> Fast theory checks build early confidence and bank 60+ marks before fatigue sets in.
                        </p>
                        <p className="text-slate-200 leading-relaxed">
                            • <strong>Physics (40-100 mins):</strong> Standard mechanics and electrodynamics solved with sharp mid-test focus.
                        </p>
                        <p className="text-slate-200 leading-relaxed">
                            • <strong>Maths (100-180 mins):</strong> 80 uninterrupted minutes reserved for extensive algebraic calculations.
                        </p>
                    </div>
                </div>
            )
        },

        {
            id: 'revision-blitz-mode',
            category: 'exam-prep',
            title: 'How to use Revision Blitz Mode? (Pre-Exam 14-Day Protocol)',
            tags: ['blitz', 'revision', '14 days', 'countdown', 'formula'],
            summary: 'Activating high-density daily formula sweeps and clearing overdue flashcard debt.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        When you enter the final 14 days before your JEE Mains shift, switch your dashboard into <strong>Revision Blitz Mode</strong>:
                    </p>

                    <div className="space-y-3.5 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <div className="space-y-2 text-slate-200">
                            <p>1. <strong>Zero New Complex Chapters:</strong> Stop opening completely unstudied chapters. Focus on converting 70% mastery chapters to 100%.</p>
                            <p>2. <strong>Clear Entire SRS Queue:</strong> Ensure zero cards are overdue in the Error Vaccinator.</p>
                            <p>3. <strong>Daily Formula Blitz:</strong> Run 2 rounds of 90-second formula sprints every morning.</p>
                            <p>4. <strong>Mock Simulation:</strong> Take full-length 3-hour mocks at the exact time of your assigned NTA shift (9:00 AM - 12:00 PM or 3:00 PM - 6:00 PM).</p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'exam-day-logistics-planner',
            category: 'exam-prep',
            title: 'How to use the Exam Day Logistics Planner? (T-Minus 24h)',
            tags: ['logistics', 'checklist', 'exam day', 'admit card', 'center', 'glucose'],
            summary: 'A bulletproof checklist for center navigation, admit cards, and cognitive fueling.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="space-y-3.5 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <span className="font-bold text-amber-300 uppercase tracking-wider block text-base mb-2">Mandatory Exam Day Checklist:</span>
                        <div className="space-y-2.5 text-slate-200">
                            <p>• <strong>Printed Admit Card:</strong> Color printout with uploaded passport photo pasted and left thumb impression done before leaving home.</p>
                            <p>• <strong>Original Government ID:</strong> Aadhaar Card / Passport (photocopies are rejected by NTA).</p>
                            <p>• <strong>Transparent Ballpoint Pens:</strong> 2 clear-body blue/black ballpoint pens (gel pens smudge on scratch sheets).</p>
                            <p>• <strong>Nutrition & Glucose Strategy:</strong> Light protein + complex carb breakfast 90 minutes prior. Avoid heavy sugars that trigger insulin crashes at hour 2.</p>
                            <p>• <strong>Arrival Buffer:</strong> Reach the test center 60 minutes before gates close to avoid biometric queue stress.</p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'post-exam-memory-dump',
            category: 'exam-prep',
            title: 'What is the Post-Exam Memory Dump? (Capturing Raw Telemetry)',
            tags: ['memory dump', 'post-exam', 'reconstruction', 'raw telemetry'],
            summary: 'How to capture disputed questions and immediate reactions within 2 hours of testing.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 space-y-2">
                        <span className="font-bold text-cyan-300 text-base md:text-lg flex items-center gap-2">
                            <span>🧠</span> The 2-Hour Working Memory Window
                        </span>
                        <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                            Immediately after stepping out of the CBT hall, your short-term synaptic memory retains exact question wordings, boundary constraints, and ambiguous multiple-choice options. Within 24 hours, the Ebbinghaus forgetting curve degrades ~70% of these critical subtleties.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                            <span className="font-bold text-cyan-300 text-base uppercase tracking-wider block">
                                📋 Step-by-Step Question Reconstruction Protocol
                            </span>
                            <div className="space-y-2.5 text-sm text-slate-200">
                                <p><strong>1. Open Reflections → Memory Dump:</strong> Launch the Memory Dump panel on your phone or laptop within 120 minutes of finishing the exam.</p>
                                <p><strong>2. Record the 4-5 Hesitation Questions:</strong> Don't try to rewrite the whole test. Focus on questions where you stalled, doubted an inorganic exception, or debated between two close options.</p>
                                <p><strong>3. Tag the Error Hypothesis:</strong> Mark whether you suspect an E2 (Formula slip), E4 (Boundary/unit trap), or E7 (Distractor option).</p>
                                <p><strong>4. Auto-Synthesize into Laboratory:</strong> Click <em>"Generate Memory Vaccine Cards"</em> to let Gemini create custom active recall cards for Session 2 & JEE Advanced.</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                            <span className="font-bold text-purple-300 text-base uppercase tracking-wider block">
                                🧘 Psychological Decompression Rationale
                            </span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Writing down ambiguous questions discharges cognitive rumination. Instead of spending the rest of the day anxiously replaying questions in your head, the data is safely captured in Sentinel OS so you can rest with a clear mind.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },

        // =========================================================================
        // --- 7. YOUR PROGRESS & ADVANCED ANALYTICS ---
        // =========================================================================
        {
            id: 'improvement-trend-analytics',
            category: 'progress-analytics',
            title: 'How to read my improvement trend & Sharpe Volatility?',
            tags: ['trend', 'analytics', 'sharpe', 'moving average', 'consistency'],
            summary: 'Understanding 5-test exponential moving averages and performance volatility.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-cyan-300 uppercase tracking-wider block text-base md:text-lg">5-Test Exponential Moving Average (EMA)</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Filters out single-paper test difficulty spikes to show your true underlying capability trajectory.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                            <span className="font-bold text-amber-300 uppercase tracking-wider block text-base md:text-lg">Sharpe Performance Volatility Metric</span>
                            <p className="text-sm text-slate-200 leading-relaxed">
                                Borrowed from quantitative finance: measures your average score return divided by standard deviation across mock tests. A high Sharpe score indicates unwavering exam temperament.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'college-predictor-guide',
            category: 'progress-analytics',
            title: 'How does the College & Branch Predictor work?',
            tags: ['college', 'predictor', 'nit', 'iit', 'iiit', 'cutoffs', 'branches'],
            summary: 'Mapping your Gaussian projected AIR to closing ranks at top NITs, IIITs, and IITs.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        The College Predictor uses historical JoSAA closing ranks across 5 years to calculate real admission probability:
                    </p>

                    <div className="space-y-3.5 text-sm bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
                        <p>• <strong>Safe Tier (Green):</strong> Closing rank is &gt; 25% higher than your projected AIR.</p>
                        <p>• <strong>Target Tier (Yellow):</strong> Your projected AIR falls directly within the historical closing rank band.</p>
                        <p>• <strong>Dream Tier (Purple):</strong> Requires a +15-25 mark improvement in your next 30 days.</p>
                    </div>
                </div>
            )
        },

        {
            id: 'chapter-roi-matrix',
            category: 'progress-analytics',
            title: 'What is Chapter ROI & The Strategic Quadrant?',
            tags: ['roi', 'quadrant', 'quick wins', 'big bets', 'fillers', 'time traps'],
            summary: 'The 4-quadrant strategic classifier for maximum mark yield per study hour.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm">
                        <div className="p-5 bg-emerald-950/50 rounded-2xl border border-emerald-600/60 text-emerald-200 space-y-1">
                            <span className="font-bold text-emerald-300 block text-base">🌟 QUICK WINS (Highest ROI)</span>
                            <p className="text-slate-200">High exam weightage + Low difficulty (e.g. Modern Physics, Vectors & 3D, Coordination Compounds). Study these first!</p>
                        </div>

                        <div className="p-5 bg-blue-950/50 rounded-2xl border border-blue-600/60 text-blue-200 space-y-1">
                            <span className="font-bold text-blue-300 block text-base">🎯 BIG BETS (High Yield Core)</span>
                            <p className="text-slate-200">High exam weightage + Moderate/High difficulty (e.g. Definite Integration, Rotational Dynamics, Thermodynamics).</p>
                        </div>

                        <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 text-slate-300 space-y-1">
                            <span className="font-bold text-slate-200 block text-base">📦 FILLERS (Low Priority)</span>
                            <p className="text-slate-200">Low exam weightage + Easy theory. Review only in final 2 weeks.</p>
                        </div>

                        <div className="p-5 bg-rose-950/50 rounded-2xl border border-rose-600/60 text-rose-200 space-y-1">
                            <span className="font-bold text-rose-300 block text-base">⚠️ TIME TRAPS (Danger Zone)</span>
                            <p className="text-slate-200">Low exam weightage + Massive syllabus depth. Do not sink 30 hours here right before exams!</p>
                        </div>
                    </div>
                </div>
            )
        },

        {
            id: 'knowledge-graph-subway-map',
            category: 'progress-analytics',
            title: 'How to understand the Knowledge Graph & Subway Maps?',
            tags: ['knowledge graph', 'subway', 'skill tree', 'prerequisites', 'concepts'],
            summary: 'Navigating prerequisite dependency trees, transit line colors, and skill tree node unlocks.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-sm leading-relaxed space-y-2">
                        <span className="font-bold text-cyan-300 text-base md:text-lg flex items-center gap-2">
                            <span>🗺️</span> Conceptual Hierarchy in STEM
                        </span>
                        <p className="text-slate-200">
                            Math and Physics concepts are strictly hierarchical. Trying to master <em>Electromagnetic Induction</em> without understanding <em>Faraday's Flux & Vector Cross Products</em> is mathematically impossible. The Knowledge Graph visualizes these exact dependency pipelines.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                            <span>🚇</span> Subway Transit Line Legend & Mastery Colors
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-3.5 text-sm">
                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-rose-600/50 space-y-1.5 text-rose-200">
                                <span className="font-bold text-rose-300 uppercase tracking-wider block text-base">🔴 Red Line -- Critical Prerequisite Bottlenecks</span>
                                <p className="text-slate-200 leading-relaxed">
                                    Chapters where your error rate is &gt; 35%. Downstream chapters connected to this node will naturally suffer unless this bottleneck is immunized first.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-amber-600/50 space-y-1.5 text-amber-200">
                                <span className="font-bold text-amber-300 uppercase tracking-wider block text-base">🟡 Amber Line -- Fragile Mastery (E3 & E4 Vulnerable)</span>
                                <p className="text-slate-200 leading-relaxed">
                                    You understand the theory, but you frequently drop marks to calculation slips or misread questions. Practice 90-second speed sprints here.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-600/50 space-y-1.5 text-emerald-200">
                                <span className="font-bold text-emerald-300 uppercase tracking-wider block text-base">🟢 Matrix Emerald Line -- Immunized Node (100% Exam-Ready)</span>
                                <p className="text-slate-200 leading-relaxed">
                                    Boss Question passed cleanly with 0 hints. Accuracy ≥ 85% in recent mocks. Maintain with 1 spaced flashcard review every 14 days.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 text-sm space-y-2">
                        <span className="font-bold text-purple-300 uppercase tracking-wider block text-base">🌳 Cyber Skill Tree Progression</span>
                        <p className="text-slate-200 leading-relaxed">
                            Nodes unlock sequentially as you level up your chapter XP. Conquering prerequisite foundation chapters unlocks advanced multi-concept synthesis nodes (e.g. <em>Kinematics → NLM → Work Power Energy → Rotational Dynamics</em>).
                        </p>
                    </div>
                </div>
            )
        },

        {
            id: 'what-if-rank-simulator-guide',
            category: 'progress-analytics',
            title: 'What-If Rank Simulator: The Marginal Value of +10 Marks',
            tags: ['what-if', 'simulator', 'marginal value', 'marks', 'percentile'],
            summary: 'Interactive sensitivity analysis simulating mark increases across Physics, Chemistry, and Maths.',
            content: (
                <div className="space-y-6 text-slate-200 text-sm md:text-base leading-relaxed">
                    <p className="text-sm text-slate-300">
                        Located on the <strong>Dashboard</strong>. Drag the sliders to simulate adding +10 marks to Physics, Chemistry, or Maths:
                    </p>

                    <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                        <span className="font-bold text-cyan-300 text-base md:text-lg">The Steepness Factor (Score Curve Derivative)</span>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            In the 140 to 180 score band, the probability density function f(x) is at its steepest peak. Gaining just 2 questions (+8 marks) in Chemistry leapfrogs ~12,000 candidates.
                        </p>
                        <p className="text-sm text-slate-300">
                            Use this slider to identify which subject gives you the fastest rank jump with the least required effort.
                        </p>
                    </div>
                </div>
            )
        }
    ], []);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return helpItems;
        const q = searchQuery.toLowerCase();
        return helpItems.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.summary.toLowerCase().includes(q) ||
            item.tags.some(t => t.toLowerCase().includes(q))
        );
    }, [helpItems, searchQuery]);

    if (!isOpen) return null;

    // Use React Portal directly to document.body with top-level z-[9999] so it floats above the sidebar and everything else
    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex justify-end bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={handleClose}
        >
            <div 
                className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-left relative z-10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 md:p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xl shadow-lg shadow-cyan-950/50">
                            ?
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">JEE War Room Master Guide</h2>
                            <p className="text-xs text-slate-400">Tactical blueprints, error diagnostics & study systems</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors font-bold text-sm"
                        title="Close Guide (Esc)"
                    >
                        ✕
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-slate-900/50 border-b border-slate-800/80 shrink-0">
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Search topics (e.g. E1-E7, 3-Pass Rule, Physics, Scratchpad, Burnout)..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                        <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300">Clear</button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 hide-scrollbar">
                    {/* Detail Item View -- GLASSMORPHIC POPUP MODAL (Fixed Full-Height 86vh) */}
                    {selectedItemId && (() => {
                        const item = helpItems.find(i => i.id === selectedItemId);
                        if (!item) return null;

                        return (
                            <div 
                                className="fixed inset-0 top-0 left-0 w-screen h-screen z-[10000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in"
                                onClick={() => setSelectedItemId(null)}
                            >
                                {/* Ambient Background Glows */}
                                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                                <div 
                                    className="w-full max-w-5xl md:max-w-6xl h-[86vh] max-h-[88vh] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-scale-in relative z-10"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Modal Glass Top Header Bar */}
                                    <div className="p-4 md:p-5 bg-slate-800/60 backdrop-blur-md border-b border-slate-700/80 flex items-center justify-between shrink-0">
                                        <button 
                                            onClick={() => setSelectedItemId(null)}
                                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/80 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-all shadow backdrop-blur-md"
                                        >
                                            <span>← Back to Guide Index</span>
                                        </button>

                                        <div className="text-center hidden sm:block">
                                            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/80">
                                                JEE War Room Master Guide
                                            </span>
                                        </div>

                                        <button 
                                            onClick={() => setSelectedItemId(null)}
                                            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/80 text-slate-300 hover:text-white flex items-center justify-center transition-all text-xs font-bold shadow backdrop-blur-md"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Modal Content Body with Full Scroll */}
                                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 hide-scrollbar">
                                        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-cyan-950/40 border border-cyan-500/30 shadow-lg space-y-2 backdrop-blur-md">
                                            <span className="text-xs font-mono tracking-wider text-cyan-400 uppercase font-bold px-2.5 py-1 bg-cyan-950 rounded-lg border border-cyan-800">
                                                {categories.find(c => c.id === item.category)?.label || 'Guide'}
                                            </span>
                                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight pt-1">{item.title}</h2>
                                            <p className="text-sm md:text-base text-slate-200 leading-relaxed border-t border-slate-800/80 pt-3">{item.summary}</p>
                                        </div>

                                        <div className="p-6 md:p-8 rounded-2xl bg-slate-800/50 backdrop-blur-md border border-slate-700/80 shadow-md">
                                            {item.content}
                                        </div>
                                    </div>

                                    {/* Modal Bottom Action Bar */}
                                    <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between shrink-0">
                                        <span className="text-xs text-slate-400 font-mono">JEE War Room v2 • Master Intelligence Reader</span>
                                        <button 
                                            onClick={() => setSelectedItemId(null)}
                                            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-bold transition-all shadow-md"
                                        >
                                            Got It, Return to Index
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Categorized Accordion View */}
                    {categories.map(cat => {
                        const categoryItems = filteredItems.filter(item => item.category === cat.id);
                        if (categoryItems.length === 0) return null;
                        const isExpanded = expandedCategory === cat.id || Boolean(searchQuery);

                        return (
                            <div key={cat.id} className="rounded-2xl bg-slate-800/40 border border-slate-800 overflow-hidden shadow-sm">
                                <button 
                                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                                    className="w-full p-4 flex items-center justify-between text-left bg-slate-800/60 hover:bg-slate-800 transition-colors"
                                >
                                    <span className="font-bold text-sm text-slate-200 tracking-wide flex items-center gap-2">
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-400 border border-slate-700 ml-1">
                                            {categoryItems.length}
                                        </span>
                                    </span>
                                    <span className="text-slate-400 text-xs font-mono">{isExpanded ? '▲' : '▼'}</span>
                                </button>

                                {isExpanded && (
                                    <div className="p-3 space-y-2 bg-slate-900/40 border-t border-slate-800/60">
                                        {categoryItems.map(item => (
                                            <div 
                                                key={item.id}
                                                onClick={() => setSelectedItemId(item.id)}
                                                className="p-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 cursor-pointer transition-all group"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                                                        <span className="text-cyan-400 font-bold">→</span>
                                                        <span>{item.title}</span>
                                                    </h4>
                                                    <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Read Blueprint →</span>
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-2 pl-4">{item.summary}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 text-center">
                    <p className="text-[11px] text-slate-500">
                        JEE War Room v2 • You are not alone in this prep. Trust the data.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};
