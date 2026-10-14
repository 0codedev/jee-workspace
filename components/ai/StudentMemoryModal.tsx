import React, { useState, useEffect } from 'react';
import { StudentMemoryItem } from '../../types';
import { StudentMemoryManager } from '../../services/ai/memory/StudentMemoryManager';

interface StudentMemoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMemoriesUpdated?: () => void;
}

export const StudentMemoryModal: React.FC<StudentMemoryModalProps> = ({
    isOpen,
    onClose,
    onMemoriesUpdated
}) => {
    const [memories, setMemories] = useState<StudentMemoryItem[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | StudentMemoryItem['category']>('all');
    const [newFact, setNewFact] = useState('');
    const [newCategory, setNewCategory] = useState<StudentMemoryItem['category']>('weak_spot');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingFact, setEditingFact] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMemories(StudentMemoryManager.getMemories());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const refreshMemories = () => {
        const updated = StudentMemoryManager.getMemories();
        setMemories(updated);
        if (onMemoriesUpdated) onMemoriesUpdated();
    };

    const handleAddMemory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFact.trim()) return;
        StudentMemoryManager.addMemory(newCategory, newFact);
        setNewFact('');
        refreshMemories();
    };

    const handleDeleteMemory = (id: string) => {
        StudentMemoryManager.deleteMemory(id);
        refreshMemories();
    };

    const handleSaveEdit = (id: string) => {
        if (!editingFact.trim()) {
            setEditingId(null);
            return;
        }
        StudentMemoryManager.updateMemory(id, editingFact);
        setEditingId(null);
        refreshMemories();
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to clear all persistent AI memories? This action cannot be undone.")) {
            StudentMemoryManager.clearAllMemories();
            refreshMemories();
        }
    };

    const filteredMemories = memories.filter(m => activeFilter === 'all' || m.category === activeFilter);

    const categoryIcons: Record<StudentMemoryItem['category'], string> = {
        academic_goal: '🎯',
        weak_spot: '⚠️',
        learning_preference: '💡',
        active_commitment: '📋'
    };

    const categoryLabels: Record<StudentMemoryItem['category'], string> = {
        academic_goal: 'Goals & Targets',
        weak_spot: 'Weak Spots & Blindspots',
        learning_preference: 'Learning Preferences',
        active_commitment: 'Active Remediation'
    };

    const categoryColors: Record<StudentMemoryItem['category'], string> = {
        academic_goal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        weak_spot: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        learning_preference: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        active_commitment: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl shadow-inner">
                            🧠
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white">Cross-Session AI Memory</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                                    {memories.length} Active
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Memories persistent across all chat sessions, informing Coach & Tutor guidance.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            activeFilter === 'all'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        All ({memories.length})
                    </button>
                    {(['academic_goal', 'weak_spot', 'learning_preference', 'active_commitment'] as const).map(cat => {
                        const count = memories.filter(m => m.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveFilter(cat)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                    activeFilter === cat
                                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                }`}
                            >
                                <span>{categoryIcons[cat]}</span>
                                <span>{categoryLabels[cat].split(' ')[0]}</span>
                                <span className="text-[10px] opacity-70 font-mono">({count})</span>
                            </button>
                        );
                    })}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {/* Add Memory Form */}
                    <form onSubmit={handleAddMemory} className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <span>Add New Memory</span>
                            <span className="text-[10px] text-slate-400 font-normal">Will be injected into all future AI prompts</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value as StudentMemoryItem['category'])}
                                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500 shrink-0"
                            >
                                <option value="weak_spot">⚠️ Weak Spot</option>
                                <option value="academic_goal">🎯 Target / Goal</option>
                                <option value="learning_preference">💡 Preference</option>
                                <option value="active_commitment">📋 Active Remediation</option>
                            </select>
                            <input
                                type="text"
                                value={newFact}
                                onChange={(e) => setNewFact(e.target.value)}
                                placeholder="e.g. Struggles with torque equilibrium equations in rotational mechanics..."
                                className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                            />
                            <button
                                type="submit"
                                disabled={!newFact.trim()}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                + Remember
                            </button>
                        </div>
                    </form>

                    {/* Memory Cards */}
                    <div className="space-y-2.5">
                        {filteredMemories.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 text-xs">
                                <span className="text-3xl block mb-2">🧠</span>
                                <p className="font-semibold text-slate-400">No memories found in this category</p>
                                <p className="text-[11px] mt-1">Add a key insight or goal above, or chat with the AI Coach to build them automatically.</p>
                            </div>
                        ) : (
                            filteredMemories.map(item => (
                                <div
                                    key={item.id}
                                    className="p-3 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl transition-all flex items-start justify-between gap-3 group"
                                >
                                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                        <span className="text-base mt-0.5">{categoryIcons[item.category]}</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${categoryColors[item.category]}`}>
                                                    {categoryLabels[item.category]}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {new Date(item.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input
                                                        type="text"
                                                        value={editingFact}
                                                        onChange={(e) => setEditingFact(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(item.id);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        className="w-full bg-slate-900 border border-cyan-500 text-xs text-white px-2 py-1 rounded"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEdit(item.id)}
                                                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingId(null)}
                                                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                                    {item.fact}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {editingId !== item.id && (
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(item.id);
                                                    setEditingFact(item.fact);
                                                }}
                                                className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-700 transition-colors"
                                                title="Edit memory"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteMemory(item.id)}
                                                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700 transition-colors"
                                                title="Delete memory"
                                            >
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:underline transition-colors"
                    >
                        Clear All Memories
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};