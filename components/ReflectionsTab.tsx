import React, { useState, useEffect, useMemo } from 'react';
import { Reflection } from '../types';
import { analyzeReflection } from '../services/geminiService';
import { 
    PenTool, Tag, Target, Link as LinkIcon, Sparkles, Plus, Search, 
    Calendar, Trash2, Image as ImageIcon, X, Shield, Paperclip, 
    CalendarPlus, CheckCircle2, AlertTriangle, Lightbulb, HeartHandshake,
    Smile, Frown, Compass, CheckSquare
} from 'lucide-react';
import { ImageLightboxModal } from './common/ImageLightboxModal';

interface ReflectionsTabProps {
    apiKey: string;
    reflections: Reflection[];
    setReflections: React.Dispatch<React.SetStateAction<Reflection[]>>;
    addTasksToPlanner?: (tasks: { task: string, time: number, topic: string }[]) => void;
}

interface DebriefTemplate {
    id: string;
    title: string;
    icon: string;
    description: string;
    suggestedMood: 'eureka' | 'frustrated' | 'confident' | 'confused';
    content: string;
}

const DEBRIEF_TEMPLATES: DebriefTemplate[] = [
    {
        id: 'mock-autopsy',
        title: 'Mock Exam Autopsy',
        icon: '📋',
        description: 'Post-test psychological autopsy: panic triggers, time sinks, and lost marks.',
        suggestedMood: 'confused',
        content: `### 📋 3-Hour Mock Exam Autopsy

**Test Name / Shift:** [e.g. JEE Main 2024 Jan 27 S1 Mock]
**Score / Marks Secured:** [e.g. 182 / 300]

#### 1. Mindset & Panic Triggers
- Where did I first feel rushed, stuck, or anxious?
- How did I respond when encountering 2 consecutive difficult questions?

#### 2. Time Sink Traps (The 5+ Min Black Holes)
- Question(s) that trapped me: [e.g. Physics Q14 Rotational Motion]
- Estimated time wasted: [e.g. 8 mins]
- Root Cause: Ego trap / reluctance to skip.
- Rule of Thumb: If no clear solution path after 2 mins, mark for review and SKIP immediately!

#### 3. Silly Mistake Surgery
- Calculation / Algebra slips: [e.g. Added 3 instead of multiplied]
- Question misread: [e.g. Asked for INCORRECT statement]
- Marks lost to careless slips: [e.g. -15 marks]

#### 4. The One Golden Commitment for Next Mock
- [e.g. Strictly execute Round 1 scan and lock in all 25 easy questions first!]`
    },
    {
        id: 'silly-mistake',
        title: 'Silly Mistake Surgery',
        icon: '🔬',
        description: 'Deep extraction of careless errors, sign flips, and prevention mantras.',
        suggestedMood: 'frustrated',
        content: `### 🔬 Silly Mistake Surgery

**Topic / Chapter:** [e.g. Electrostatics - Electric Flux]
**Question Type:** [Single Correct / Numerical]

#### Anatomy of the Error
- **What I Did:** [e.g. Forgot factor of 1/2 in kinetic energy equation]
- **Why I Did It:** [e.g. Rushed because 10 mins were left in Chemistry]
- **Error Category:** Calculation Slip / Sign Flip / Unit Mismatch / Misread Condition

#### The Anti-Trap Mantra (Rule of Thumb)
- Rule: [e.g. "Always write the full formula and circle units before plugging in numerical values!"]`
    },
    {
        id: 'aha-moment',
        title: 'Concept AHA! Breakthrough',
        icon: '💡',
        description: 'Connecting difficult topics into an intuitive mental model.',
        suggestedMood: 'eureka',
        content: `### 💡 Concept AHA! Breakthrough

**Core Concept:** [e.g. Phasor Diagrams in AC Circuits vs SHM]

#### The Intuitive Connection
- What clicked today? [e.g. "A pure inductor causes current to lag voltage by 90 deg because flux opposes rate of change of current, exactly like inertia in mechanics!"]
- What confused me before: [e.g. Memorizing phase angles blindly without geometric intuition]

#### Memory Anchor for Exam Day
- Key takeaway: [e.g. ELI the ICE man: EMF leads I in L; I leads E in C]`
    },
    {
        id: 'future-self',
        title: 'Letter to Future Self',
        icon: '✉️',
        description: 'Sealed encouragement to read on the morning of your exam.',
        suggestedMood: 'confident',
        content: `### ✉️ Letter to My Future Self (Exam Day Morning)

Dear Future Me,

I am writing this on ${new Date().toLocaleDateString()}. When you read this on the morning of your JEE exam, take three deep, slow breaths.

Remember the grind:
- You have solved hundreds of hours of PYQs and conquered your error patterns.
- One tough question does not define your score.
- The exam is a game of picking the 40-50 questions you know best and staying ice-cold under pressure.

Trust your preparation. Walk into the exam hall with your head high. You've earned this.`
    }
];

export const ReflectionsTab: React.FC<ReflectionsTabProps> = ({ apiKey, reflections, setReflections, addTasksToPlanner }) => {
    const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingContent, setEditingContent] = useState('');
    const [shouldReanalyze, setShouldReanalyze] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [selectedMood, setSelectedMood] = useState<'eureka' | 'frustrated' | 'confident' | 'confused' | undefined>(undefined);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [moodFilter, setMoodFilter] = useState<'all' | 'eureka' | 'frustrated' | 'confident' | 'confused'>('all');
    const [plannerSuccessMsg, setPlannerSuccessMsg] = useState<string | null>(null);

    // Image Attachment State (Array of Base64 strings)
    const [attachedImages, setAttachedImages] = useState<string[]>([]);
    const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

    // Responsive Mobile Selection State (Mobile Stack / Desktop Split)
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const showMobileDetail = isMobile && (selectedReflection !== null || isCreating);

    // Global Clipboard Paste Listener for Images (Ctrl + V)
    useEffect(() => {
        if (!isCreating && !isEditing) return;

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            const imageFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) imageFiles.push(file);
                }
            }
            if (imageFiles.length > 0) {
                Promise.all(imageFiles.map(f => new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (evt) => resolve(evt.target?.result as string);
                    reader.readAsDataURL(f);
                }))).then(newImgs => {
                    setAttachedImages(prev => [...prev, ...newImgs]);
                });
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isCreating, isEditing]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            Promise.all(fileArray.map(f => new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (evt) => resolve(evt.target?.result as string);
                reader.readAsDataURL(f);
            }))).then(newImgs => {
                setAttachedImages(prev => [...prev, ...newImgs]);
            });
        }
        e.target.value = '';
    };

    const handleSave = async () => {
        if (!newContent.trim() && attachedImages.length === 0) return;
        setIsAnalyzing(true);
        
        try {
            const analysis = await analyzeReflection(newContent, apiKey);
            
            const newReflection: Reflection = {
                id: `ref-${Date.now()}`,
                timestamp: Date.now(),
                content: newContent,
                tags: analysis.tags,
                aiSummary: analysis.summary,
                actionItems: analysis.actionItems,
                relatedTopics: analysis.relatedTopics,
                mood: selectedMood || analysis.mood,
                image: attachedImages[0] || undefined,
                images: attachedImages
            };

            setReflections(prev => [newReflection, ...prev]);
            setIsCreating(false);
            setNewContent('');
            setSelectedMood(undefined);
            setAttachedImages([]);
            setSelectedReflection(newReflection);
        } catch (error) {
            console.error("Failed to analyze reflection", error);
            // Fallback save without AI
            const newReflection: Reflection = {
                id: `ref-${Date.now()}`,
                timestamp: Date.now(),
                content: newContent,
                tags: [],
                mood: selectedMood || 'neutral',
                image: attachedImages[0] || undefined,
                images: attachedImages
            };
            setReflections(prev => [newReflection, ...prev]);
            setIsCreating(false);
            setNewContent('');
            setSelectedMood(undefined);
            setAttachedImages([]);
            setSelectedReflection(newReflection);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingContent.trim() || !selectedReflection) return;
        setIsAnalyzing(true);
        
        try {
            let updatedReflection: Reflection = { 
                ...selectedReflection, 
                content: editingContent,
                image: attachedImages[0] || undefined,
                images: attachedImages 
            };
            
            if (shouldReanalyze) {
                const analysis = await analyzeReflection(editingContent, apiKey);
                updatedReflection = {
                    ...updatedReflection,
                    tags: analysis.tags,
                    aiSummary: analysis.summary,
                    actionItems: analysis.actionItems,
                    relatedTopics: analysis.relatedTopics,
                    mood: analysis.mood
                };
            }

            setReflections(prev => prev.map(r => r.id === updatedReflection.id ? updatedReflection : r));
            setSelectedReflection(updatedReflection);
            setIsEditing(false);
            setEditingContent('');
            setAttachedImages([]);
            setShouldReanalyze(false);
        } catch (error) {
            console.error("Failed to update reflection", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDelete = (id: string) => {
        setReflections(prev => prev.filter(r => r.id !== id));
        if (selectedReflection?.id === id) {
            setSelectedReflection(null);
        }
    };

    const handleApplyTemplate = (template: DebriefTemplate) => {
        setNewContent(template.content);
        setSelectedMood(template.suggestedMood);
        setAttachedImages([]);
        setIsCreating(true);
        setSelectedReflection(null);
    };

    const handleScheduleActionItems = () => {
        if (!selectedReflection?.actionItems || selectedReflection.actionItems.length === 0 || !addTasksToPlanner) return;
        
        const tasks = selectedReflection.actionItems.map(item => ({
            task: `Action Item: ${item}`,
            time: 30,
            topic: selectedReflection.relatedTopics?.[0] || 'Reflections'
        }));

        addTasksToPlanner(tasks);
        setPlannerSuccessMsg(`Scheduled ${tasks.length} action item${tasks.length > 1 ? 's' : ''} into Daily Planner!`);
        setTimeout(() => setPlannerSuccessMsg(null), 3500);
    };

    // Metacognitive Intelligence Aggregator
    const metacognitiveStats = useMemo(() => {
        const total = reflections.length;
        if (total === 0) {
            return {
                total: 0,
                moodCounts: { eureka: 0, confident: 0, confused: 0, frustrated: 0, neutral: 0 },
                topTraps: [],
                totalActionItems: 0
            };
        }

        const moodCounts = { eureka: 0, confident: 0, confused: 0, frustrated: 0, neutral: 0 };
        const tagMap: Record<string, number> = {};
        let actionItemTotal = 0;

        reflections.forEach(r => {
            if (r.mood && moodCounts[r.mood] !== undefined) {
                moodCounts[r.mood]++;
            } else {
                moodCounts.neutral++;
            }

            (r.tags || []).forEach(tag => {
                const clean = tag.toLowerCase().trim();
                tagMap[clean] = (tagMap[clean] || 0) + 1;
            });

            actionItemTotal += (r.actionItems || []).length;
        });

        const topTraps = Object.entries(tagMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([tag, count]) => ({ tag, count }));

        return {
            total,
            moodCounts,
            topTraps,
            totalActionItems: actionItemTotal
        };
    }, [reflections]);

    const filteredReflections = useMemo(() => {
        return reflections.filter(r => {
            const matchesSearch = searchQuery === '' || 
                r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesMood = moodFilter === 'all' || r.mood === moodFilter;

            return matchesSearch && matchesMood;
        });
    }, [reflections, searchQuery, moodFilter]);

    const getMoodEmoji = (mood?: string) => {
        switch (mood) {
            case 'eureka': return '💡';
            case 'frustrated': return '😫';
            case 'confident': return '😎';
            case 'confused': return '🤔';
            default: return '📝';
        }
    };

    return (
        <div className="flex flex-col h-auto md:h-[calc(100vh-8rem)] gap-4 min-w-0 max-w-full pb-10">
            {/* Metacognitive Intelligence Summary Ribbon */}
            <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900/95 via-indigo-950/40 to-slate-900/95 shadow-xl flex-shrink-0">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-900/50 border border-indigo-500/40 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                            🧠
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                                Metacognitive Radar & Psychological Debrief
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 font-mono">
                                    {reflections.length} Total Logs
                                </span>
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                Diagnosing test anxiety, silly mistakes, and mental breakthrough patterns across your JEE journey
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end text-xs">
                        {/* Mood Trajectory Distribution */}
                        <div className="flex items-center gap-2 bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Mindset:</span>
                            <span title="Eureka Breakthroughs" className="flex items-center gap-1 text-amber-300 font-mono text-[11px]">
                                💡 {metacognitiveStats.moodCounts.eureka}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span title="Confidence Peaks" className="flex items-center gap-1 text-emerald-300 font-mono text-[11px]">
                                😎 {metacognitiveStats.moodCounts.confident}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span title="Doubt & Confusion" className="flex items-center gap-1 text-cyan-300 font-mono text-[11px]">
                                🤔 {metacognitiveStats.moodCounts.confused}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span title="Frustration / Slips" className="flex items-center gap-1 text-rose-300 font-mono text-[11px]">
                                😫 {metacognitiveStats.moodCounts.frustrated}
                            </span>
                        </div>

                        {/* Top Cognitive Traps */}
                        {metacognitiveStats.topTraps.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Traps:</span>
                                {metacognitiveStats.topTraps.slice(0, 2).map(t => (
                                    <span key={t.tag} className="text-[10px] bg-rose-950/60 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/40 font-mono">
                                        #{t.tag} ({t.count})
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Total Action Items */}
                        <div className="flex items-center gap-1.5 bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-800">
                            <Target className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] text-slate-300 font-mono font-bold">
                                {metacognitiveStats.totalActionItems} Action Items
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Two-Column Journal Container */}
            <div className="flex flex-col md:flex-row flex-1 gap-4 md:gap-6 min-h-0 overflow-hidden">
                {/* Left Sidebar: Journal List & Filters */}
                <div className={`${showMobileDetail ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 glass-panel rounded-2xl flex-col overflow-hidden min-h-[400px] md:min-h-0 border border-slate-700/60`}>
                    <div className="p-3 sm:p-4 border-b border-slate-700/80 space-y-3">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <PenTool className="w-4 h-4 text-indigo-400" />
                                <span>Reflections</span>
                            </h2>
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => { setIsCreating(true); setSelectedReflection(null); setNewContent(''); setSelectedMood(undefined); setAttachedImages([]); }}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1"
                                    title="New Free-form Reflection"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>New Log</span>
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search tags, topics, thoughts..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Mood Filter Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pt-1">
                            {[
                                { id: 'all', label: 'All', icon: '📝' },
                                { id: 'eureka', label: 'Eureka', icon: '💡' },
                                { id: 'confident', label: 'Confident', icon: '😎' },
                                { id: 'confused', label: 'Doubt', icon: '🤔' },
                                { id: 'frustrated', label: 'Frustrated', icon: '😫' }
                            ].map(pill => (
                                <button
                                    key={pill.id}
                                    type="button"
                                    onClick={() => setMoodFilter(pill.id as any)}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1 border ${
                                        moodFilter === pill.id
                                            ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                                            : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                                >
                                    <span>{pill.icon}</span>
                                    <span>{pill.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* List Items */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {filteredReflections.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10 p-4">
                                <Compass className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-xs">No reflections found.</p>
                                <p className="text-[10px] text-slate-600 mt-1">Try clearing filters or choose a guided debrief template.</p>
                            </div>
                        ) : (
                            filteredReflections.map(ref => (
                                <div 
                                    key={ref.id}
                                    onClick={() => { setSelectedReflection(ref); setIsCreating(false); setAttachedImages([]); }}
                                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                        selectedReflection?.id === ref.id 
                                            ? 'bg-indigo-950/70 border-indigo-500/70 shadow-md' 
                                            : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            {new Date(ref.timestamp).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {ref.image && <span title="Has image attachment"><ImageIcon className="w-3 h-3 text-cyan-400" /></span>}
                                            <span className="text-xs" title={ref.mood}>{getMoodEmoji(ref.mood)}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{ref.content}</p>
                                    {ref.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {ref.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[9px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60">#{tag}</span>
                                            ))}
                                            {ref.tags.length > 3 && <span className="text-[9px] text-slate-500">+{ref.tags.length - 3}</span>}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Creation / Detail / Editing Pane */}
                <div className={`${!showMobileDetail && isMobile ? 'hidden md:flex' : 'flex'} flex-1 glass-panel rounded-2xl overflow-hidden flex-col min-w-0 border border-slate-700/60`}>
                    {isCreating ? (
                        <div className="p-4 sm:p-6 flex flex-col h-full space-y-4 overflow-y-auto custom-scrollbar">
                            {isMobile && (
                                <button 
                                    onClick={() => { setSelectedReflection(null); setIsCreating(false); setIsEditing(false); }}
                                    className="md:hidden flex items-center gap-1.5 text-xs text-indigo-400 font-bold hover:text-indigo-300 transition-colors w-fit"
                                >
                                    ← Back to Journal List
                                </button>
                            )}

                            {/* Template Selector Bar */}
                            <div className="space-y-1.5 pb-2 border-b border-slate-800">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Guided Metacognitive Templates
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {DEBRIEF_TEMPLATES.map(tpl => (
                                        <button
                                            key={tpl.id}
                                            type="button"
                                            onClick={() => handleApplyTemplate(tpl)}
                                            className="p-2 rounded-xl text-left border bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/70 hover:border-indigo-500/50 transition-all group"
                                        >
                                            <div className="text-base mb-1">{tpl.icon}</div>
                                            <p className="text-xs font-bold text-white group-hover:text-indigo-300">{tpl.title}</p>
                                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{tpl.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-white">Write Reflection</h2>
                                    {/* Mood Selector Pill Bar */}
                                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                                        {[
                                            { id: 'eureka', label: '💡 Eureka' },
                                            { id: 'confident', label: '😎 Confident' },
                                            { id: 'confused', label: '🤔 Doubt' },
                                            { id: 'frustrated', label: '😫 Frustrated' }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setSelectedMood(m.id as any)}
                                                className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${selectedMood === m.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
                                    <Shield className="w-3 h-3 text-cyan-400" /> Stored on SSD
                                </span>
                            </div>

                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                        handleSave();
                                    }
                                }}
                                placeholder="What did you learn today? What went wrong in today's mock or problem set? (Press Ctrl+Enter to save)"
                                className="flex-1 min-h-[220px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-white resize-none focus:outline-none focus:border-indigo-500 font-sans custom-scrollbar leading-relaxed"
                            />

                            {/* Image Attachment Dropzone & Gallery */}
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                                {attachedImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {attachedImages.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img src={img} alt={`Attachment preview ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))} 
                                                    className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md transition-colors"
                                                    title="Remove photo"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer text-xs font-bold transition-colors">
                                        <Paperclip className="w-4 h-4 text-cyan-400" />
                                        <span>{attachedImages.length > 0 ? `Add More Photos (${attachedImages.length})` : 'Attach Question Paper Photos / Paste (Ctrl+V)'}</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                    <span className="text-[11px] text-slate-500 italic">
                                        Images stay on device SSD.
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => { setIsCreating(false); setNewContent(''); setAttachedImages([]); }}
                                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isAnalyzing || (!newContent.trim() && attachedImages.length === 0)}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center gap-2"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Sparkles className="w-4 h-4 animate-spin" />
                                            <span>Analyzing & Saving...</span>
                                        </>
                                    ) : (
                                        <span>Save Reflection</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : selectedReflection ? (
                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full space-y-6">
                            {isMobile && (
                                <button 
                                    onClick={() => { setSelectedReflection(null); setIsCreating(false); setIsEditing(false); }}
                                    className="md:hidden flex items-center gap-1.5 text-xs text-indigo-400 font-bold hover:text-indigo-300 transition-colors w-fit"
                                >
                                    ← Back to Journal List
                                </button>
                            )}

                            {/* Header Row */}
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="text-2xl" title={selectedReflection.mood}>{getMoodEmoji(selectedReflection.mood)}</span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(selectedReflection.timestamp).toLocaleString()}
                                        </span>
                                        {(() => {
                                            const count = (selectedReflection.images?.length) || (selectedReflection.image ? 1 : 0);
                                            if (count === 0) return null;
                                            return (
                                                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                                                    <Shield className="w-3 h-3 text-cyan-400" /> {count} {count === 1 ? 'Photo' : 'Photos'} Attached
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {selectedReflection.tags.map(tag => (
                                            <span key={tag} className="text-xs bg-indigo-900/30 text-indigo-300 border border-indigo-700/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => { 
                                            setIsEditing(true); 
                                            setEditingContent(selectedReflection.content); 
                                            setAttachedImages(selectedReflection.images || (selectedReflection.image ? [selectedReflection.image] : [])); 
                                            setShouldReanalyze(false); 
                                        }}
                                        className="text-slate-400 hover:text-indigo-300 transition-colors p-2 rounded-lg hover:bg-slate-800"
                                        title="Edit Reflection"
                                    >
                                        <PenTool className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(selectedReflection.id)}
                                        className="text-slate-400 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
                                        title="Delete Reflection"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Success Notification Banner for Action Items */}
                            {plannerSuccessMsg && (
                                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-fade-in shadow-md">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        {plannerSuccessMsg}
                                    </span>
                                    <button onClick={() => setPlannerSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
                                </div>
                            )}

                            {isEditing ? (
                                <div className="flex flex-col h-full space-y-4">
                                    <textarea
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        className="flex-1 min-h-[260px] bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-white resize-none focus:outline-none focus:border-indigo-500 custom-scrollbar leading-relaxed"
                                    />

                                    {/* Edit Image Attachment Gallery */}
                                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                                        {attachedImages.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {attachedImages.map((img, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <img src={img} alt={`Attachment preview ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))} 
                                                            className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md transition-colors"
                                                            title="Remove photo"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer text-xs font-bold transition-colors">
                                                <Paperclip className="w-4 h-4 text-cyan-400" />
                                                <span>{attachedImages.length > 0 ? `Add More Photos (${attachedImages.length})` : 'Attach Photos / Paste Screenshot (Ctrl+V)'}</span>
                                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                            </label>
                                            <span className="text-[11px] text-slate-500 italic">
                                                Stored locally on SSD.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={shouldReanalyze}
                                                onChange={(e) => setShouldReanalyze(e.target.checked)}
                                                className="accent-indigo-600"
                                            />
                                            Re-analyze with AI to update summary & action items
                                        </label>

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setIsEditing(false)}
                                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleUpdate}
                                                disabled={isAnalyzing || (!editingContent.trim() && attachedImages.length === 0)}
                                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2 rounded-lg text-xs font-semibold transition-all shadow flex items-center gap-2"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <Sparkles className="w-4 h-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Main Content Card */}
                                    <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 space-y-4">
                                        <p className="text-slate-200 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{selectedReflection.content}</p>
                                        
                                        {/* Image Attachments Lightbox Gallery */}
                                        {(() => {
                                            const displayImages = selectedReflection.images || (selectedReflection.image ? [selectedReflection.image] : []);
                                            if (displayImages.length === 0) return null;
                                            return (
                                                <div className="pt-3 border-t border-slate-800 space-y-2">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                                        Attached Question Paper Clippings & Notes ({displayImages.length}):
                                                    </span>
                                                    <div className="flex flex-wrap gap-3">
                                                        {displayImages.map((imgSrc, i) => (
                                                            <img 
                                                                key={i}
                                                                src={imgSrc} 
                                                                alt={`Reflection attachment ${i + 1}`} 
                                                                onClick={() => setPreviewModalImage(imgSrc)}
                                                                className="max-h-52 max-w-[220px] rounded-xl border border-slate-700 cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all object-cover bg-slate-950 shadow-md" 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* AI Insights & Action Items Section */}
                                    {selectedReflection.aiSummary && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-indigo-950/30 rounded-2xl p-5 border border-indigo-500/30">
                                                <h3 className="text-indigo-300 font-semibold text-xs sm:text-sm flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-4 h-4 text-indigo-400" /> AI Behavioral Summary
                                                </h3>
                                                <p className="text-xs text-indigo-100/80 leading-relaxed">{selectedReflection.aiSummary}</p>
                                            </div>
                                            
                                            {selectedReflection.actionItems && selectedReflection.actionItems.length > 0 && (
                                                <div className="bg-emerald-950/30 rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-emerald-300 font-semibold text-xs sm:text-sm flex items-center gap-2">
                                                                <Target className="w-4 h-4 text-emerald-400" /> Targeted Action Items
                                                            </h3>
                                                            {addTasksToPlanner && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleScheduleActionItems}
                                                                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 flex items-center gap-1 transition-all shadow-sm"
                                                                    title="Push these commitments as tasks into Daily Planner"
                                                                >
                                                                    <CalendarPlus className="w-3 h-3 text-emerald-400" />
                                                                    <span>Schedule in Planner</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <ul className="space-y-1.5 mt-2">
                                                            {selectedReflection.actionItems.map((item, i) => (
                                                                <li key={i} className="text-xs text-emerald-100/90 flex items-start gap-2">
                                                                    <span className="text-emerald-400 mt-0.5">•</span> 
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedReflection.relatedTopics && selectedReflection.relatedTopics.length > 0 && (
                                                <div className="bg-cyan-950/30 rounded-2xl p-4 border border-cyan-500/30 md:col-span-2">
                                                    <h3 className="text-cyan-300 font-semibold text-xs flex items-center gap-2 mb-2">
                                                        <LinkIcon className="w-3.5 h-3.5 text-cyan-400" /> Linked Chapters & Topics
                                                    </h3>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {selectedReflection.relatedTopics.map((topic, i) => (
                                                            <span key={i} className="text-[11px] bg-cyan-900/40 text-cyan-200 px-2 py-0.5 rounded-lg border border-cyan-700/40">
                                                                {topic}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-4">
                            <PenTool className="w-12 h-12 opacity-20" />
                            <div>
                                <h3 className="text-lg font-semibold text-slate-300 mb-1">Your Metacognitive Journal</h3>
                                <p className="max-w-md text-xs text-slate-400 leading-relaxed">
                                    Select a past reflection from the sidebar to review psychological insights, or pick a guided template below to debrief your latest test.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 max-w-md w-full pt-2">
                                {DEBRIEF_TEMPLATES.map(tpl => (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => handleApplyTemplate(tpl)}
                                        className="p-3 rounded-xl text-left border bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-indigo-500/50 transition-all group"
                                    >
                                        <div className="text-lg mb-1">{tpl.icon}</div>
                                        <p className="text-xs font-bold text-white group-hover:text-indigo-300">{tpl.title}</p>
                                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tpl.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal for Attached Image */}
            <ImageLightboxModal 
                src={previewModalImage} 
                title="Reflection Note Attachment" 
                onClose={() => setPreviewModalImage(null)} 
            />
        </div>
    );
};
