// ============================================================================
// Deck Share & Cloud Import Modal Component
// ============================================================================

import React, { useState } from 'react';
import { 
    Share2, Download, Upload, Copy, Check, Sparkles, X, 
    Layers, Key, AlertCircle, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Flashcard, SharedDeckPayload } from '../../types';
import { 
    exportDeckAsJSON, 
    importDeckFromJSON, 
    publishDeckToFirestore, 
    fetchPublicDeck 
} from '../../services/deckShareService';

interface DeckShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDeck: Flashcard[];
    onImportCards: (newCards: Flashcard[]) => void;
}

export const DeckShareModal: React.FC<DeckShareModalProps> = ({
    isOpen,
    onClose,
    currentDeck,
    onImportCards
}) => {
    const [mode, setMode] = useState<'share' | 'import'>('share');
    const [shareCode, setShareCode] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [inputShareCode, setInputShareCode] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [previewPayload, setPreviewPayload] = useState<SharedDeckPayload | null>(null);
    const [importStatus, setImportStatus] = useState<{ count?: number; error?: string } | null>(null);
    const [isFetchingCloud, setIsFetchingCloud] = useState(false);

    if (!isOpen) return null;

    // Handle Cloud Publish
    const handlePublish = async () => {
        setIsPublishing(true);
        const code = await publishDeckToFirestore(
            currentDeck, 
            'JEE Revision Master Deck',
            'Community Shared High-Yield Deck'
        );
        setShareCode(code);
        setIsPublishing(false);
    };

    // Copy Share Code
    const handleCopyCode = () => {
        navigator.clipboard.writeText(shareCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
    };

    // Download JSON
    const handleDownloadJSON = () => {
        const json = exportDeckAsJSON(currentDeck, 'JEE My Error Cards');
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jee-deck-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Handle JSON Text Import
    const handleImportJson = () => {
        if (!jsonInput.trim()) return;
        const result = importDeckFromJSON(jsonInput, currentDeck);
        if (result.error) {
            setImportStatus({ error: result.error });
        } else {
            onImportCards(result.cards);
            setImportStatus({ count: result.importedCount });
            setTimeout(() => {
                onClose();
            }, 2000);
        }
    };

    // Handle Cloud Share Code Fetch & Preview
    const handleFetchFromCode = async () => {
        if (!inputShareCode.trim()) return;
        setIsFetchingCloud(true);
        setImportStatus(null);
        setPreviewPayload(null);
        
        const payload = await fetchPublicDeck(inputShareCode.trim());
        setIsFetchingCloud(false);

        if (!payload || !payload.cards || payload.cards.length === 0) {
            setImportStatus({ error: 'Deck not found. Check code or create a new share.' });
        } else {
            setPreviewPayload(payload);
        }
    };

    // Confirm Cloud Deck Import
    const handleConfirmImport = () => {
        if (!previewPayload) return;
        const result = importDeckFromJSON(JSON.stringify(previewPayload.cards), currentDeck);
        onImportCards(result.cards);
        setImportStatus({ count: result.importedCount });
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white">Peer Deck Sharing & Import</h3>
                            <p className="text-xs text-slate-400">Share your curated flashcards or import community decks.</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 p-2 bg-slate-950 border-b border-slate-800">
                    <button
                        onClick={() => setMode('share')}
                        className={`py-2 text-xs font-bold rounded-xl transition-all ${
                            mode === 'share' ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        📤 Share Deck ({currentDeck.length} Cards)
                    </button>
                    <button
                        onClick={() => setMode('import')}
                        className={`py-2 text-xs font-bold rounded-xl transition-all ${
                            mode === 'import' ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        📥 Import Deck
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {mode === 'share' ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Cloud Share Code
                                </span>
                                
                                {shareCode ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-2xl font-black font-mono tracking-widest text-cyan-400 bg-cyan-950/60 px-4 py-2 rounded-xl border border-cyan-800">
                                            {shareCode}
                                        </span>
                                        <button
                                            onClick={handleCopyCode}
                                            className="p-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors"
                                        >
                                            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                        className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>{isPublishing ? 'Generating...' : 'Generate 1-Click Share Code'}</span>
                                    </button>
                                )}
                            </div>

                            <div className="text-center">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">&bull; Or Export Locally &bull;</span>
                            </div>

                            <button
                                onClick={handleDownloadJSON}
                                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4 text-cyan-400" />
                                <span>Download .JSON Backup File</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Import via Share Code */}
                            {/* Share Code Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300">Enter Cloud Share Code:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. JEE-8K4P"
                                        value={inputShareCode}
                                        onChange={(e) => setInputShareCode(e.target.value.toUpperCase())}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                                    />
                                    <button
                                        onClick={handleFetchFromCode}
                                        disabled={isFetchingCloud || !inputShareCode.trim()}
                                        className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50"
                                    >
                                        {isFetchingCloud ? 'Loading...' : 'Fetch'}
                                    </button>
                                </div>
                            </div>

                            {/* Deck Preview Box */}
                            {previewPayload && (
                                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2.5 animate-fade-in">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-black text-white">{previewPayload.title}</h4>
                                            <p className="text-[11px] text-slate-400">{previewPayload.description || 'Community Shared Deck'}</p>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                            {previewPayload.cards.length} Cards
                                        </span>
                                    </div>

                                    {/* Preview 2 sample cards */}
                                    <div className="space-y-1 text-xs">
                                        <span className="text-[10px] uppercase font-bold text-slate-500">Sample Card Topics:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {previewPayload.cards.slice(0, 4).map((c, i) => (
                                                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                                    {c.topic || 'General Concept'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleConfirmImport}
                                        className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Confirm Import ({previewPayload.cards.length} Cards)</span>
                                    </button>
                                </div>
                            )}

                            <div className="text-center">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">&bull; Or Paste JSON Content &bull;</span>
                            </div>

                            {/* Paste JSON */}
                            <div className="space-y-2">
                                <textarea
                                    rows={3}
                                    placeholder="Paste JSON deck payload..."
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                                />
                                <button
                                    onClick={handleImportJson}
                                    disabled={!jsonInput.trim()}
                                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
                                >
                                    Import Pasted JSON
                                </button>
                            </div>

                            {/* Status alerts */}
                            {importStatus?.count !== undefined && (
                                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Successfully imported {importStatus.count} new cards! Closing...</span>
                                </div>
                            )}

                            {importStatus?.error && (
                                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-400" />
                                    <span>{importStatus.error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};