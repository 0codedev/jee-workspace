import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

export interface WidgetInfoData {
    title: string;
    summary: string;
    meaning: string;
    howToImprove: string[];
    redFlags?: string[];
    learnMoreId?: string;
}

interface WidgetInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: WidgetInfoData;
    onOpenGuide?: (itemId?: string) => void;
    onAskAiCoach?: (prompt: string) => void;
}

export const WidgetInfoModal: React.FC<WidgetInfoModalProps> = ({
    isOpen,
    onClose,
    data,
    onOpenGuide,
    onAskAiCoach
}) => {
    // ESC key listener to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in"
            onClick={onClose}
        >
            {/* Glassmorphic Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Glassmorphic Modal Box Container */}
            <div 
                className="w-full max-w-5xl md:max-w-6xl max-h-[86vh] md:max-h-[88vh] bg-slate-900/80 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-scale-in relative z-10"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Glass Header Bar */}
                <div className="p-4 md:p-5 bg-slate-800/50 backdrop-blur-md border-b border-slate-700/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center text-lg shadow-md backdrop-blur-md">
                            📊
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                                    Widget Intelligence
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Press ESC to close</span>
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">{data.title}</h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-600/80 text-slate-300 hover:text-white transition-all text-xs font-bold shadow backdrop-blur-md"
                        aria-label="Close modal"
                    >
                        <span>Close</span>
                        <span className="text-base leading-none">✕</span>
                    </button>
                </div>

                {/* Modal Content Body with Top Gap */}
                <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 hide-scrollbar">
                    {/* Strategic Summary Glass Banner */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-800/60 to-purple-950/40 border border-cyan-500/40 shadow-xl backdrop-blur-lg space-y-1.5">
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                            <span>💡 Strategic Summary</span>
                        </div>
                        <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed">
                            {data.summary}
                        </p>
                    </div>

                    {/* 2-Column Deep Dive Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: What it means & How to Improve */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* What this means for your preparation */}
                            <div className="p-5 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-slate-700/60 shadow-lg space-y-2.5">
                                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                                    🎯 What This Data Means For You
                                </h3>
                                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                                    {data.meaning}
                                </p>
                            </div>

                            {/* Step-by-Step Improvement Plan */}
                            {data.howToImprove.length > 0 && (
                                <div className="p-5 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-slate-700/60 shadow-lg space-y-3">
                                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                        🚀 Exact Step-by-Step Execution Plan
                                    </h3>
                                    <div className="space-y-2.5">
                                        {data.howToImprove.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 backdrop-blur-sm border border-slate-800/80">
                                                <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-xs text-slate-200 leading-relaxed">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Red Flags & Actions */}
                        <div className="space-y-6">
                            {/* Red Flags / Warning Signs */}
                            {data.redFlags && data.redFlags.length > 0 && (
                                <div className="p-5 rounded-2xl bg-rose-950/30 backdrop-blur-md border border-rose-900/50 shadow-lg space-y-2.5">
                                    <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                        ⚠️ Critical Warning Signs
                                    </h3>
                                    <div className="space-y-2">
                                        {data.redFlags.map((flag, idx) => (
                                            <div key={idx} className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs leading-relaxed flex items-start gap-2">
                                                <span className="text-rose-400 text-sm leading-none">🚨</span>
                                                <span>{flag}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Error DNA Quick Reference Box */}
                            <div className="p-4 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-slate-700/60 shadow-lg space-y-2.5">
                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">🧬 Related Error DNA Taxonomy</h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Every error maps to one of the 7 core error codes (E1 Concept, E2 Formula, E3 Calc, E4 Reading, E5 Panic, E6 Skip, E7 Overconfidence).
                                </p>
                                {onOpenGuide && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onOpenGuide('error-codes-e1-e7');
                                        }}
                                        className="w-full py-2 px-3 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span>Read E1-E7 Error DNA Guide</span>
                                        <span>→</span>
                                    </button>
                                )}
                            </div>

                            {/* AI Coach action button */}
                            {onAskAiCoach && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onAskAiCoach(`How can I improve my performance in ${data.title}? Give me a targeted 3-day recovery drill.`);
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <span>🤖 Consult AI Coach</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Glass Bottom Bar */}
                <div className="p-4 bg-slate-900/70 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between shrink-0">
                    <div className="text-[11px] text-slate-400 font-mono">
                        Targeted Intelligence • JEE War Room v2
                    </div>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                        Got It, Return to App
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};