// ============================================================================
// Launchpad Resource Hub (Full-Page Component)
// Curated JEE Portals, CBT Practice Engines, STEM Visualizers & Bookmarking Tray
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
    Compass, Search, Star, ExternalLink, Plus, X, Trash2, 
    Sparkles, ShieldCheck, Check, Filter, Layers, BookOpen,
    Globe, Laptop, Eye, HelpCircle, AlertCircle
} from 'lucide-react';

export type ToolCategory = 
    | 'All'
    | 'Official Portals' 
    | 'Practice & PYQs' 
    | 'Interactive Sims & Math' 
    | 'Master Theory Videos' 
    | 'Counseling & Cutoffs';

export interface LaunchpadTool {
    id: string;
    name: string;
    url: string;
    description: string;
    icon: string;
    category: Exclude<ToolCategory, 'All'>;
    badge?: string;
    isOfficial?: boolean;
    isFree?: boolean;
    isCustom?: boolean;
}

const CANONICAL_TOOLS: LaunchpadTool[] = [
    // 1. Official Portals
    {
        id: 'nta-jee-main',
        name: 'JEE Main Official Portal',
        url: 'https://jeemain.nta.ac.in/',
        description: 'Official NTA portal for session registrations, city intimation slips, admit cards, and scorecards.',
        icon: '🏛️',
        category: 'Official Portals',
        badge: 'Official NTA',
        isOfficial: true,
        isFree: true
    },
    {
        id: 'jee-adv-official',
        name: 'JEE Advanced Official Portal',
        url: 'https://jeeadv.ac.in/',
        description: 'Official IIT portal for information brochure, syllabi, previous papers, and qualifying ranks.',
        icon: '🎓',
        category: 'Official Portals',
        badge: 'Official IIT',
        isOfficial: true,
        isFree: true
    },
    {
        id: 'josaa-portal',
        name: 'JoSAA Counseling Portal',
        url: 'https://josaa.nic.in/',
        description: 'Joint Seat Allocation Authority for 23 IITs, 32 NITs, IIEST Shibpur, and 26 IIITs seat allocation.',
        icon: '🏫',
        category: 'Official Portals',
        badge: 'Official NIC',
        isOfficial: true,
        isFree: true
    },
    {
        id: 'csab-portal',
        name: 'CSAB Special Rounds',
        url: 'https://csab.nic.in/',
        description: 'Central Seat Allocation Board portal for NIT+ system special vacant seat rounds.',
        icon: '📜',
        category: 'Official Portals',
        badge: 'Official CSAB',
        isOfficial: true,
        isFree: true
    },
    {
        id: 'nta-abhyas',
        name: 'NTA Abhyas Test App',
        url: 'https://www.nta.ac.in/Abhyas',
        description: 'Official National Testing Agency mobile and web mock test repository for JEE Main preparation.',
        icon: '📱',
        category: 'Official Portals',
        badge: 'Official NTA',
        isOfficial: true,
        isFree: true
    },

    // 2. Practice & PYQs
    {
        id: 'examgoal',
        name: 'ExamGoal PYQ CBT Engine',
        url: 'https://room.examgoal.com/',
        description: 'Authentic NTA computer-based test interface with shift-by-shift 2019-2025 PYQs and question analytics.',
        icon: '🎯',
        category: 'Practice & PYQs',
        badge: 'CBT Simulation',
        isFree: false
    },
    {
        id: 'marks-app',
        name: 'MARKS App by MathonGo',
        url: 'https://web.getmarks.app/',
        description: 'Chapter-wise and topic-wise PYQ bucket practice, custom challenge quizzes, and bookmarking.',
        icon: '📝',
        category: 'Practice & PYQs',
        badge: '100% Free PYQs',
        isFree: true
    },
    {
        id: 'embibe',
        name: 'Embibe AI Diagnostic Mock Tests',
        url: 'https://www.embibe.com/',
        description: 'AI-guided test evaluation measuring behavioral score leakage, question stamina, and guess tags.',
        icon: '🧠',
        category: 'Practice & PYQs',
        badge: 'AI Diagnostics',
        isFree: false
    },

    // 3. Interactive Sims & Math
    {
        id: 'desmos',
        name: 'Desmos Graphing Calculator',
        url: 'https://www.desmos.com/calculator',
        description: 'Advanced dynamic function visualizer for calculus curves, conic transformations, and roots.',
        icon: '📈',
        category: 'Interactive Sims & Math',
        badge: 'Calculus Visualizer',
        isFree: true
    },
    {
        id: 'phet-sims',
        name: 'PhET Interactive Simulations',
        url: 'https://phet.colorado.edu/',
        description: 'University of Colorado interactive visualizers for wave interference, EM induction, and circuits.',
        icon: '⚡',
        category: 'Interactive Sims & Math',
        badge: 'Physics Sim',
        isFree: true
    },
    {
        id: 'molview',
        name: 'MolView 3D Chemistry',
        url: 'https://molview.org/',
        description: 'Interactive 3D molecular structure visualizer for organic stereochemistry and crystal lattices.',
        icon: '🧬',
        category: 'Interactive Sims & Math',
        badge: '3D Molecules',
        isFree: true
    },
    {
        id: 'ptable',
        name: 'PTable Dynamic Periodic Table',
        url: 'https://ptable.com/',
        description: 'Interactive periodic table with real-time orbital electron shells, enthalpy trends, and isotopes.',
        icon: '🧪',
        category: 'Interactive Sims & Math',
        badge: 'Inorganic Tool',
        isFree: true
    },
    {
        id: 'wolfram-alpha',
        name: 'Wolfram Alpha Knowledge Engine',
        url: 'https://www.wolframalpha.com/',
        description: 'Computational engine for step-by-step differentiation, definite integrals, and matrix operations.',
        icon: '🤖',
        category: 'Interactive Sims & Math',
        badge: 'Step-by-Step Solver',
        isFree: true
    },

    // 4. Master Theory Videos
    {
        id: 'mohit-tyagi',
        name: 'Mohit Tyagi (Competishun)',
        url: 'https://www.youtube.com/@mohittyagi',
        description: 'Complete uncompromised IIT-JEE syllabus lectures for Physics (ABJ Sir), Chemistry (ALK/NS Sir), and Maths.',
        icon: '📺',
        category: 'Master Theory Videos',
        badge: 'Master Faculty',
        isFree: true
    },
    {
        id: 'eduniti',
        name: 'Eduniti (Mohit Goenka)',
        url: 'https://www.youtube.com/@Eduniti',
        description: 'High-speed precision physics revision, 15-minute formula capsules, and shift-wise PYQ marathons.',
        icon: '⚡',
        category: 'Master Theory Videos',
        badge: 'Speed Physics',
        isFree: true
    },
    {
        id: 'physics-galaxy',
        name: 'Physics Galaxy (Ashish Arora)',
        url: 'https://www.youtube.com/@physicsgalaxy74',
        description: 'Concept videos, advanced illustrations, and revision checklists by Master Mentor Ashish Arora.',
        icon: '🌌',
        category: 'Master Theory Videos',
        badge: 'Adv Illustrations',
        isFree: true
    },
    {
        id: 'mathongo-yt',
        name: 'MathonGo (Anup Sir)',
        url: 'https://www.youtube.com/@MathonGo',
        description: 'Focused JEE Mathematics strategy, NTA shift-wise paper analysis, and predicted cutoff benchmarks.',
        icon: '📐',
        category: 'Master Theory Videos',
        badge: 'Maths Revision',
        isFree: true
    },
    {
        id: 'unacademy-jee',
        name: 'Unacademy JEE',
        url: 'https://www.youtube.com/@UnacademyJEE',
        description: 'Live interactive problem sprints and comprehensive syllabus marathons across all three subjects.',
        icon: '💡',
        category: 'Master Theory Videos',
        badge: 'Live Sprints',
        isFree: true
    },

    // 5. Counseling & Cutoffs
    {
        id: 'college-pravesh',
        name: 'CollegePravesh',
        url: 'https://www.collegepravesh.com/',
        description: 'Authentic historical closing ranks, category-wise opening ranks, campus fees, and placements.',
        icon: '🏫',
        category: 'Counseling & Cutoffs',
        badge: 'Cutoff Archives',
        isFree: true
    },
    {
        id: 'jee-adv-syllabus-pdf',
        name: 'Official JEE Advanced Syllabus (PDF)',
        url: 'https://jeeadv.ac.in/syllabus/combined-syllabus.pdf',
        description: 'The definitive combined JEE Advanced syllabus document directly published by the organizing IIT.',
        icon: '📋',
        category: 'Counseling & Cutoffs',
        badge: 'Official Syllabus',
        isOfficial: true,
        isFree: true
    },
    {
        id: 'reddit-jeeneetards',
        name: 'r/JEENEETards Community',
        url: 'https://www.reddit.com/r/JEENEETards/',
        description: 'The largest verified student community in India for JEE discussions, study resources, and peer guidance.',
        icon: '🧡',
        category: 'Counseling & Cutoffs',
        badge: 'Student Community',
        isFree: true
    }
];

export const Launchpad: React.FC = () => {
    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('All');
    const [onlyPinned, setOnlyPinned] = useState(false);

    // Bookmarked / Pinned tools persisted in localStorage
    const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('launchpad_pinned_ids') || '["examgoal", "marks-app", "desmos", "eduniti"]');
        } catch {
            return ['examgoal', 'marks-app', 'desmos', 'eduniti'];
        }
    });

    // Custom links added by user persisted in localStorage
    const [customTools, setCustomTools] = useState<LaunchpadTool[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('launchpad_custom_tools') || '[]');
        } catch {
            return [];
        }
    });

    // Modal state for adding a custom study tool
    const [showAddModal, setShowAddModal] = useState(false);
    const [newToolName, setNewToolName] = useState('');
    const [newToolUrl, setNewToolUrl] = useState('');
    const [newToolCategory, setNewToolCategory] = useState<Exclude<ToolCategory, 'All'>>('Practice & PYQs');
    const [newToolDesc, setNewToolDesc] = useState('');
    const [addError, setAddError] = useState('');

    const togglePin = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPinnedIds(prev => {
            const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
            try { localStorage.setItem('launchpad_pinned_ids', JSON.stringify(updated)); } catch {}
            return updated;
        });
    };

    const handleDeleteCustomTool = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = customTools.filter(t => t.id !== id);
        setCustomTools(updated);
        try { localStorage.setItem('launchpad_custom_tools', JSON.stringify(updated)); } catch {}
        // Also remove from pinned
        setPinnedIds(prev => {
            const filtered = prev.filter(item => item !== id);
            try { localStorage.setItem('launchpad_pinned_ids', JSON.stringify(filtered)); } catch {}
            return filtered;
        });
    };

    const handleCreateCustomTool = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newToolName.trim() || !newToolUrl.trim()) {
            setAddError('Please provide both a Tool Name and a valid Target URL.');
            return;
        }

        let formattedUrl = newToolUrl.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = `https://${formattedUrl}`;
        }

        const newTool: LaunchpadTool = {
            id: `custom-${Date.now()}`,
            name: newToolName.trim(),
            url: formattedUrl,
            description: newToolDesc.trim() || 'Personal custom study resource.',
            icon: '🔗',
            category: newToolCategory,
            badge: 'Custom Link',
            isFree: true,
            isCustom: true
        };

        const updated = [...customTools, newTool];
        setCustomTools(updated);
        try { localStorage.setItem('launchpad_custom_tools', JSON.stringify(updated)); } catch {}

        // Reset and close
        setNewToolName('');
        setNewToolUrl('');
        setNewToolDesc('');
        setAddError('');
        setShowAddModal(false);
    };

    // Combine canonical tools and custom tools
    const allTools = useMemo(() => {
        return [...CANONICAL_TOOLS, ...customTools];
    }, [customTools]);

    // Live counts per Category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { All: allTools.length };
        allTools.forEach(t => {
            counts[t.category] = (counts[t.category] || 0) + 1;
        });
        return counts;
    }, [allTools]);

    // Filtered tools
    const filteredTools = useMemo(() => {
        let pool = allTools;

        if (selectedCategory !== 'All') {
            pool = pool.filter(t => t.category === selectedCategory);
        }

        if (onlyPinned) {
            const pinnedSet = new Set(pinnedIds);
            pool = pool.filter(t => pinnedSet.has(t.id));
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            pool = pool.filter(t => 
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q) ||
                (t.badge && t.badge.toLowerCase().includes(q))
            );
        }

        return pool;
    }, [allTools, selectedCategory, onlyPinned, searchQuery, pinnedIds]);

    // Pinned tools for Quick-Launch tray
    const pinnedTools = useMemo(() => {
        const map = new Map(allTools.map(t => [t.id, t]));
        return pinnedIds.map(id => map.get(id)).filter(Boolean) as LaunchpadTool[];
    }, [allTools, pinnedIds]);

    const categories: ToolCategory[] = [
        'All',
        'Official Portals',
        'Practice & PYQs',
        'Interactive Sims & Math',
        'Master Theory Videos',
        'Counseling & Cutoffs'
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. STANDARDIZED HEADER ROW */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
                            <span>Launchpad Resource Hub</span>
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 whitespace-nowrap inline-flex items-center">
                            {allTools.length} Verified Portals
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        High-speed curated launchpad to official exam authorities, CBT practice engines, STEM visualizers, and top video series.
                    </p>
                </div>

                {/* Right Action: Add Custom Link */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Custom Link</span>
                    </button>
                </div>
            </div>

            {/* 2. PINNED QUICK-LAUNCH TRAY (If any tools pinned) */}
            {pinnedTools.length > 0 && !onlyPinned && (
                <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            Pinned Quick-Launch Tray ({pinnedTools.length})
                        </span>
                        <span className="text-[11px] text-slate-400">
                            1-Click direct study access
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {pinnedTools.map(tool => (
                            <a
                                key={tool.id}
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between group shadow-sm"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg shrink-0">{tool.icon}</span>
                                    <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                                        {tool.name}
                                    </span>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 ml-1 transition-colors" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. FILTER & SEARCH STRIP */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search tools, visualizers, channels..."
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
                        onClick={() => setOnlyPinned(!onlyPinned)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                            onlyPinned
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <Star className={`w-3.5 h-3.5 ${onlyPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                        <span>Pinned Only ({pinnedIds.length})</span>
                    </button>
                </div>

                {/* Category Pills Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar border-t border-slate-800/80 pt-3">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                                selectedCategory === cat
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                        >
                            <span>{cat}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                                {categoryCounts[cat] || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. MASTER RESOURCE GRID */}
            <div>
                <div className="flex justify-between items-center text-xs text-slate-400 px-1 mb-3">
                    <span>Showing <strong>{filteredTools.length}</strong> resources</span>
                    {onlyPinned && <span className="text-amber-400 font-bold">Filtered: Pinned Resources Only</span>}
                </div>

                {filteredTools.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTools.map(tool => {
                            const isPinned = pinnedIds.includes(tool.id);

                            return (
                                <a
                                    key={tool.id}
                                    href={tool.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block"
                                >
                                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 h-full flex flex-col justify-between space-y-4">
                                        <div className="space-y-3">
                                            {/* Header row: Icon, Category, Badge & Pin Button */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800/70 border border-slate-700/60 group-hover:border-cyan-500/40 transition-colors text-2xl shrink-0">
                                                        {tool.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                                                            {tool.name}
                                                        </h3>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                            {tool.category}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={(e) => togglePin(tool.id, e)}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            isPinned
                                                                ? 'text-amber-400 hover:bg-slate-800'
                                                                : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'
                                                        }`}
                                                        title={isPinned ? 'Unpin' : 'Pin to Quick-Launch'}
                                                    >
                                                        <Star className={`w-4 h-4 ${isPinned ? 'fill-amber-400' : ''}`} />
                                                    </button>

                                                    {tool.isCustom && (
                                                        <button
                                                            onClick={(e) => handleDeleteCustomTool(tool.id, e)}
                                                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                                            title="Delete custom link"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {tool.description}
                                            </p>
                                        </div>

                                        {/* Footer Row: Badges & Outbound Link Indicator */}
                                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {tool.badge && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                        tool.isOfficial
                                                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                                                            : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                                                    }`}>
                                                        {tool.badge}
                                                    </span>
                                                )}
                                                {tool.isFree && !tool.isOfficial && (
                                                    <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                                                        Free
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 text-slate-500 group-hover:text-cyan-400 font-bold transition-colors">
                                                <span className="text-[11px]">Open</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                        <p className="text-slate-400 text-xs">No resources match your search or active category filter.</p>
                    </div>
                )}
            </div>

            {/* 5. ADD CUSTOM STUDY LINK MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs uppercase font-black text-cyan-400 flex items-center gap-1.5">
                                    <Plus className="w-4 h-4 text-cyan-400" /> Personal Study Workspace
                                </span>
                                <h3 className="text-xl font-black text-white mt-1">
                                    Add Custom Tool or Coaching Portal
                                </h3>
                            </div>
                            <button
                                onClick={() => { setShowAddModal(false); setAddError(''); }}
                                className="p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {addError && (
                            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{addError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateCustomTool} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="font-bold text-slate-300 block">Tool / Resource Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Allen TestMyPrep, FIITJEE Portal, Google Drive Notes"
                                    value={newToolName}
                                    onChange={e => setNewToolName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300 block">Target URL *</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={newToolUrl}
                                    onChange={e => setNewToolUrl(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300 block">Category</label>
                                <select
                                    value={newToolCategory}
                                    onChange={e => setNewToolCategory(e.target.value as any)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="Practice & PYQs">Practice & PYQs</option>
                                    <option value="Interactive Sims & Math">Interactive Sims & Math</option>
                                    <option value="Master Theory Videos">Master Theory Videos</option>
                                    <option value="Counseling & Cutoffs">Counseling & Cutoffs</option>
                                    <option value="Official Portals">Official Portals</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-slate-300 block">Description (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Brief note on what this link is used for..."
                                    value={newToolDesc}
                                    onChange={e => setNewToolDesc(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setAddError(''); }}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-all shadow-lg shadow-cyan-950/40"
                                >
                                    Save to Launchpad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
