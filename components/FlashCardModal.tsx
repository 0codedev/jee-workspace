import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useJeeStore } from '../store/useJeeStore';
import { MarkdownRenderer } from './common/MarkdownRenderer';
import { Flashcard } from '../types';
import { playTTS, stopTTS } from '../services/audioEngine';
import { speakText, stopSpeaking, startListening, stopListening, checkAnswerByVoice, parseVoiceNavCommand } from '../services/voiceEngine';
import { enhanceCardWithAI } from '../services/geminiService';
import { formatMathHtml } from './ReattemptModal';
import { Columns, RotateCw, Sparkles, Zap, Clock, AlertTriangle, BookOpen, Volume2, X, Check, Eye, Mic, MicOff } from 'lucide-react';

interface FlashCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
}

export const FlashCardModal: React.FC<FlashCardModalProps> = ({ isOpen, onClose, apiKey }) => {
    const { flashcardSession, rateCurrentCard, closeFlashcardSession } = useJeeStore();
    const [isFlipped, setIsFlipped] = useState(false);
    const [viewMode, setViewMode] = useState<'flip' | 'split'>('split');
    
    // Voice Mode States
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

    // States for Reconstruction & AI
    const [diagnosis, setDiagnosis] = useState<string | null>(null);
    const [showMutation, setShowMutation] = useState(false);
    const [revealMutationAnswer, setRevealMutationAnswer] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedCard, setEnhancedCard] = useState<Flashcard | null>(null);
    
    const cardRef = useRef<HTMLDivElement>(null);

    const activeCardRaw = flashcardSession.deck[flashcardSession.currentCardIndex];
    const currentCard = enhancedCard || activeCardRaw;
    const isFinished = flashcardSession.currentCardIndex >= flashcardSession.deck.length;
    const hasDeck = flashcardSession.deck && flashcardSession.deck.length > 0;
    const isTrackA = currentCard?.track === 'A' || !!currentCard?.questionHtml;

    useEffect(() => {
        return () => {
            stopTTS();
        };
    }, []);

    useEffect(() => {
        if (isOpen && cardRef.current) {
            cardRef.current.focus();
        }
        if (!isFinished) {
            setIsFlipped(false);
            setDiagnosis(null);
            setShowMutation(false);
            setRevealMutationAnswer(false);
            setEnhancedCard(null);
            setVoiceFeedback(null);
            stopTTS();
            stopSpeaking();
            stopListening();

            // Oral Flashcard Auto-Read Mode
            if (isVoiceMode && currentCard) {
                const textToRead = currentCard.front || currentCard.topic || '';
                speakText(textToRead, 1.05, () => {
                    setIsListening(true);
                    startListening((transcript, isFinal) => {
                        // Check voice navigation commands first
                        const cmd = parseVoiceNavCommand(transcript);
                        if (cmd === 'flip') {
                            setIsFlipped(true);
                            return;
                        } else if (cmd === 'rate_easy') {
                            rateCurrentCard(5);
                            return;
                        } else if (cmd === 'rate_hard') {
                            rateCurrentCard(1);
                            return;
                        } else if (cmd === 'rate_good') {
                            rateCurrentCard(4);
                            return;
                        }

                        if (isFinal || transcript.length > 15) {
                            const evalResult = checkAnswerByVoice(transcript, currentCard.back || currentCard.keyFormula || '');
                            setVoiceFeedback(evalResult.feedback);
                            setIsListening(false);
                            stopListening();
                            setIsFlipped(true);
                        }
                    });
                });
            }
        }
    }, [isOpen, flashcardSession.currentCardIndex, isFinished, isVoiceMode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                handleClose();
                return;
            }

            if (isFinished || !hasDeck) return;

            if (e.code === 'Space' && viewMode === 'flip') {
                e.preventDefault();
                setIsFlipped(prev => !prev);
            } else if (isFlipped || viewMode === 'split') {
                if (e.key === '1') handleRate(1); 
                if (e.key === '2') handleRate(3); 
                if (e.key === '3') handleRate(4); 
                if (e.key === '4') handleRate(5); 
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isFlipped, viewMode, isFinished, hasDeck]);

    const handleRate = (quality: number) => {
        rateCurrentCard(quality);
    };

    const handleClose = () => {
        closeFlashcardSession();
        onClose();
    };

    const handleDiagnosis = (reason: string) => {
        setDiagnosis(reason);
        setIsFlipped(true);
    };

    const handlePlayAudio = async (text: string) => {
        if (!text || isAudioLoading) return;
        
        setIsAudioLoading(true);
        try {
            await playTTS(text, apiKey);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAudioLoading(false);
        }
    };

    const handleEnhanceWithAI = async () => {
        if (!currentCard || !apiKey || isEnhancing) return;
        setIsEnhancing(true);
        try {
            const res = await enhanceCardWithAI(currentCard, apiKey);
            setEnhancedCard({
                ...currentCard,
                keyFormula: res.keyFormula,
                mnemonic: res.mnemonic,
                mutation: res.mutation || currentCard.mutation,
                aiEnhanced: true
            });
        } catch (e) {
            console.error("Enhancement failed:", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    if (!isOpen) return null;

    // Render Portal to document.body with top-level z-[9999]
    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-2 sm:p-4 md:p-6 animate-fade-in"
            onClick={handleClose}
        >
            {/* Ambient Lighting */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {isFinished || !hasDeck ? (
                /* Session Complete Modal View */
                (() => {
                    const totalRated = flashcardSession.totalRated || flashcardSession.deck.length;
                    const againCount = flashcardSession.againCount || 0;
                    const infectionRate = Math.round((againCount / Math.max(1, totalRated)) * 100);
                    const cardsToRevisit = flashcardSession.deck.filter(c => (c.consecutiveCorrect || 0) === 0);

                    return (
                        <div 
                            className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6 md:p-8 text-center relative overflow-hidden z-10 animate-scale-in"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/15 via-transparent to-purple-900/15 pointer-events-none"></div>
                            <div className="text-5xl mb-3">🎉</div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">Session Complete</h2>
                            <p className="text-cyan-400 mb-6 font-mono text-xs uppercase tracking-wider">
                                {flashcardSession.sessionMode || 'Standard'} Mode Finalized
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-left">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Mastery Rate</p>
                                    <p className="text-xl font-black text-white">{flashcardSession.masteredCards}/{flashcardSession.deck.length}</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-left">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Max Streak</p>
                                    <p className="text-xl font-black text-amber-400">{flashcardSession.streak}🔥</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-left">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Infection Rate</p>
                                    <p className={`text-xl font-black ${infectionRate > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {infectionRate}%
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-left">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Careless Saves</p>
                                    <p className="text-xl font-black text-amber-300">⚡ {flashcardSession.carelessSaves || 0}</p>
                                </div>
                            </div>

                            {/* Error Codes Encountered */}
                            {flashcardSession.errorCodesEncountered && flashcardSession.errorCodesEncountered.length > 0 && (
                                <div className="mb-4 text-left p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Error Taxonomy Encountered</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {flashcardSession.errorCodesEncountered.map(code => (
                                            <span key={code} className="px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                                                {code}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Topics to Revisit */}
                            {cardsToRevisit.length > 0 && (
                                <div className="mb-6 text-left p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Topics Needing Follow-up ({cardsToRevisit.length})</p>
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                                        {Array.from(new Set(cardsToRevisit.map(c => c.topic))).map(topic => (
                                            <span key={topic} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleClose}
                                className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02]"
                            >
                                Sync & Return to Dashboard
                            </button>
                        </div>
                    );
                })()
            ) : (
                /* Unified Glassmorphic Flashcard Modal Frame */
                <div 
                    className="w-full max-w-6xl h-[92vh] sm:h-[88vh] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-scale-in relative z-10 font-sans"
                    onClick={e => e.stopPropagation()}
                    ref={cardRef}
                    tabIndex={0}
                >
                    {/* Top Header Bar */}
                    <div className="p-3.5 sm:p-4 md:p-5 bg-slate-800/70 backdrop-blur-md border-b border-slate-700/80 flex items-center justify-between shrink-0">
                        {/* Progress Bar & Counter */}
                        <div className="flex items-center gap-2.5 sm:gap-4">
                            <div className="w-24 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div 
                                    className="h-full bg-cyan-500 transition-all duration-500 ease-out" 
                                    style={{ width: `${((flashcardSession.currentCardIndex) / flashcardSession.deck.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono font-bold text-cyan-400 shrink-0">
                                {flashcardSession.currentCardIndex + 1} / {flashcardSession.deck.length}
                            </span>
                            {flashcardSession.sessionMode && (
                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-widest hidden sm:inline-block">
                                    {flashcardSession.sessionMode} Mode
                                </span>
                            )}
                        </div>

                        {/* Middle: Topic / Subject Indicator */}
                        <div className="flex items-center gap-2 max-w-[280px] sm:max-w-none truncate">
                            <span className="px-3 py-1 bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-full uppercase truncate">
                                {currentCard.topic}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                                Q.{flashcardSession.currentCardIndex + 1}
                            </span>
                        </div>

                        {/* Right: Voice Toggle, Mode Toggle & Close Button */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Voice Mode Toggle */}
                            <button
                                onClick={() => {
                                    const next = !isVoiceMode;
                                    setIsVoiceMode(next);
                                    if (!next) {
                                        stopSpeaking();
                                        stopListening();
                                        setIsListening(false);
                                    }
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                                    isVoiceMode 
                                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                        : 'bg-slate-950/80 border-slate-700 text-slate-400 hover:text-white'
                                }`}
                                title="Toggle Voice Study & Oral Auto-Read Mode"
                            >
                                {isVoiceMode ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{isVoiceMode ? (isListening ? 'Listening...' : 'Voice On') : 'Voice Off'}</span>
                            </button>

                            {isTrackA && (
                                <div className="flex bg-slate-950/80 border border-slate-700 p-1 rounded-xl">
                                    <button
                                        onClick={() => setViewMode('flip')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'flip' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <RotateCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Flip</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('split')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'split' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <Columns className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Split</span>
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={handleClose} 
                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all text-xs font-bold shadow"
                                title="Close (Esc)"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Voice Feedback Oral Notification Banner */}
                    {voiceFeedback && (
                        <div className="mx-4 sm:mx-6 mt-3 mb-0 bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in shadow-lg shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🎙️</span>
                                <span><strong>Oral Answer Evaluated:</strong> {voiceFeedback}</span>
                            </div>
                            <button 
                                onClick={() => setVoiceFeedback(null)} 
                                className="text-cyan-400 hover:text-white p-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Prerequisite Soft Warning Banner */}
                    {currentCard.prerequisitesMet === false && (
                        <div className="mx-4 sm:mx-6 mt-3 mb-0 bg-amber-950/80 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2 animate-fade-in shadow-md shrink-0">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                                <strong>Prerequisite Notice:</strong> Recommended to master <em>{currentCard.prerequisiteTopics?.join(', ')}</em> before this topic.
                            </span>
                        </div>
                    )}

                    {/* Modal Content Body */}
                    <div className="flex-1 overflow-hidden p-3 sm:p-5 md:p-6 flex flex-col min-h-0">
                        {viewMode === 'split' && isTrackA ? (
                            /* SPLIT MODE (Side-by-Side with Full KaTeX Rendering) */
                            <div className="w-full h-full flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
                                {/* LEFT PANEL: Question & Options */}
                                <div className="w-full md:w-1/2 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col overflow-y-auto custom-scrollbar min-h-0">
                                    <div className="flex justify-between items-center mb-3 shrink-0">
                                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                            Problem Statement
                                        </span>
                                        {currentCard.isCarelessError && (
                                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-amber-400" /> Careless Leak ({currentCard.peerCorrectPct}% Peer Ease)
                                            </span>
                                        )}
                                    </div>

                                    {/* Formatted Question HTML with KaTeX */}
                                    <div className="text-slate-100 text-sm sm:text-base leading-relaxed mb-4">
                                        {currentCard.questionHtml ? (
                                            <div 
                                                className="prose prose-invert prose-sm sm:prose-base max-w-none space-y-3"
                                                dangerouslySetInnerHTML={{ __html: formatMathHtml(currentCard.questionHtml) }} 
                                            />
                                        ) : (
                                            <MarkdownRenderer content={currentCard.front} baseTextSize="text-sm sm:text-base" baseTextColor="text-slate-100" />
                                        )}
                                    </div>

                                    {/* Options with KaTeX */}
                                    {currentCard.optionsHtml && currentCard.optionsHtml.length > 0 && (
                                        <div className="space-y-2 mt-auto pt-4 border-t border-slate-800/80 shrink-0">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Options</p>
                                            {currentCard.optionsHtml.map(opt => {
                                                const isStudentChoice = currentCard.studentAnswer === opt.identifier;
                                                const isCorrect = currentCard.correctOptions?.includes(opt.identifier);

                                                let bg = 'bg-slate-900/80 border-slate-800 text-slate-300';
                                                if (isCorrect) bg = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 font-bold';
                                                else if (isStudentChoice) bg = 'bg-rose-950/70 border-rose-500 text-rose-100';

                                                return (
                                                    <div key={opt.identifier} className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${bg}`}>
                                                        <span className="font-mono font-bold uppercase shrink-0 mt-0.5">{opt.identifier})</span>
                                                        <div 
                                                            className="flex-1 overflow-x-auto"
                                                            dangerouslySetInnerHTML={{ __html: formatMathHtml(opt.content) }} 
                                                        />
                                                        {isCorrect && <span className="ml-auto text-emerald-400 font-bold text-xs shrink-0">✅ Correct</span>}
                                                        {isStudentChoice && !isCorrect && <span className="ml-auto text-rose-400 font-bold text-xs shrink-0">❌ Your Choice</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT PANEL: Official Solution Protocol & KaTeX Steps */}
                                <div className="w-full md:w-1/2 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between overflow-y-auto custom-scrollbar min-h-0">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 shrink-0">
                                            <h4 className="text-xs uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" /> Official Solution Protocol
                                            </h4>
                                            {!currentCard.aiEnhanced && (
                                                <button 
                                                    onClick={handleEnhanceWithAI}
                                                    disabled={isEnhancing}
                                                    className="px-3 py-1 bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-xl hover:bg-indigo-950 transition-colors flex items-center gap-1.5"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" /> {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Solution Content with KaTeX */}
                                        <div className="text-slate-200 text-sm sm:text-base leading-relaxed">
                                            {currentCard.explanationHtml ? (
                                                <div 
                                                    className="prose prose-invert prose-sm sm:prose-base max-w-none space-y-3"
                                                    dangerouslySetInnerHTML={{ __html: formatMathHtml(currentCard.explanationHtml) }} 
                                                />
                                            ) : (
                                                <MarkdownRenderer content={currentCard.back} baseTextSize="text-sm sm:text-base" />
                                            )}
                                        </div>

                                        {/* AI Formula / Mnemonic */}
                                        {(currentCard.keyFormula || currentCard.mnemonic) && (
                                            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2 text-xs sm:text-sm">
                                                {currentCard.keyFormula && (
                                                    <div>
                                                        <span className="font-bold text-indigo-300 block mb-0.5">💡 Key Formula:</span>
                                                        <code className="text-indigo-200 font-mono bg-slate-950 px-2.5 py-1 rounded block">{currentCard.keyFormula}</code>
                                                    </div>
                                                )}
                                                {currentCard.mnemonic && (
                                                    <div>
                                                        <span className="font-bold text-indigo-300 block mb-0.5">🧠 Memory Hook:</span>
                                                        <p className="text-slate-300 italic">{currentCard.mnemonic}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Rating Controls */}
                                    <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
                                        <button onClick={() => handleRate(1)} className="py-3 rounded-xl bg-slate-800/90 border border-red-500/40 hover:bg-red-950/50 text-red-300 font-bold text-xs transition-all">
                                            [1] Again
                                        </button>
                                        <button onClick={() => handleRate(3)} className="py-3 rounded-xl bg-slate-800/90 border border-orange-500/40 hover:bg-orange-950/50 text-orange-300 font-bold text-xs transition-all">
                                            [2] Hard
                                        </button>
                                        <button onClick={() => handleRate(4)} className="py-3 rounded-xl bg-slate-800/90 border border-blue-500/40 hover:bg-blue-950/50 text-blue-300 font-bold text-xs transition-all">
                                            [3] Good
                                        </button>
                                        <button onClick={() => handleRate(5)} className="py-3 rounded-xl bg-slate-800/90 border border-green-500/40 hover:bg-green-950/50 text-green-300 font-bold text-xs transition-all">
                                            [4] Easy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* 3D FLIP MODE (No Vertical Clipping, Full Natural Scroll) */
                            <div className="w-full h-full [perspective:1000px] flex flex-col min-h-0">
                                <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] min-h-0 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                                    
                                    {/* FRONT: Question & Active Recall (Starts at Top with Custom Scroll) */}
                                    <div className="absolute inset-0 [backface-visibility:hidden] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-xl flex flex-col p-4 sm:p-6 md:p-8 overflow-hidden min-h-0">
                                        <div className="flex justify-between items-start mb-3 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-full uppercase">
                                                    {currentCard.topic}
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono">Q.{flashcardSession.currentCardIndex + 1}</span>
                                            </div>

                                            {currentCard.isCarelessError && (
                                                <div className="px-3 py-1 bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
                                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                    <span>Careless Error: {currentCard.peerCorrectPct}% Peer Accuracy</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Scrollable Question Content -- items-start ensures top line never cuts off */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 text-left w-full min-h-0">
                                            {currentCard.questionHtml ? (
                                                <div 
                                                    className="prose prose-invert prose-base sm:prose-lg max-w-none text-slate-100"
                                                    dangerouslySetInnerHTML={{ __html: formatMathHtml(currentCard.questionHtml) }} 
                                                />
                                            ) : (
                                                <div className="prose prose-invert prose-base sm:prose-lg max-w-none text-slate-100">
                                                    <MarkdownRenderer content={currentCard.front} baseTextSize="text-base sm:text-lg" baseTextColor="text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Symptom Checker / Diagnostic Buttons */}
                                        <div className="mt-4 pt-3 border-t border-slate-800/80 shrink-0">
                                            <p className="text-center text-xs text-slate-400 uppercase tracking-widest font-bold mb-2.5">
                                                Why did you miss this? (Click to Diagnose & Reveal Solution)
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
                                                <button 
                                                    onClick={() => handleDiagnosis('Recall')}
                                                    className="py-3 px-2 rounded-2xl border bg-blue-950/40 text-blue-300 border-blue-500/50 hover:bg-blue-900/50 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                                                >
                                                    <span className="text-xl">🧠</span>
                                                    <span className="text-xs font-bold">Recall Gap</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDiagnosis('Concept')}
                                                    className="py-3 px-2 rounded-2xl border bg-amber-950/40 text-amber-300 border-amber-500/50 hover:bg-amber-900/50 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                                                >
                                                    <span className="text-xl">💡</span>
                                                    <span className="text-xs font-bold">Concept Trap</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDiagnosis('Calculation')}
                                                    className="py-3 px-2 rounded-2xl border bg-rose-950/40 text-rose-300 border-rose-500/50 hover:bg-rose-900/50 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                                                >
                                                    <span className="text-xl">🔢</span>
                                                    <span className="text-xs font-bold">Calculation Slip</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDiagnosis('Panic/Rush')}
                                                    className="py-3 px-2 rounded-2xl border bg-purple-950/40 text-purple-300 border-purple-500/50 hover:bg-purple-900/50 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                                                >
                                                    <span className="text-xl">😰</span>
                                                    <span className="text-xs font-bold">Panic / Rush</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BACK: Solution Protocol & Spaced Repetition Rating */}
                                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-xl flex flex-col p-4 sm:p-6 md:p-8 overflow-hidden min-h-0">
                                        <div className="flex justify-between items-center border-b border-cyan-900/50 pb-3 mb-3 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4" /> Solution Protocol
                                                </h4>
                                                {diagnosis && (
                                                    <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-800">
                                                        Diagnosed: {diagnosis}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!currentCard.aiEnhanced && (
                                                    <button 
                                                        onClick={handleEnhanceWithAI} 
                                                        disabled={isEnhancing} 
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/30"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" /> {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setIsFlipped(false)}
                                                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700"
                                                >
                                                    ← Flip Back
                                                </button>
                                            </div>
                                        </div>

                                        {/* Scrollable Solution Steps with KaTeX */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 text-left w-full min-h-0 space-y-4">
                                            {currentCard.explanationHtml ? (
                                                <div 
                                                    className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-200"
                                                    dangerouslySetInnerHTML={{ __html: formatMathHtml(currentCard.explanationHtml) }} 
                                                />
                                            ) : (
                                                <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-200">
                                                    <MarkdownRenderer content={currentCard.back} baseTextSize="text-sm sm:text-base" />
                                                </div>
                                            )}

                                            {(currentCard.keyFormula || currentCard.mnemonic) && (
                                                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs sm:text-sm space-y-1.5">
                                                    {currentCard.keyFormula && (
                                                        <div>
                                                            <span className="font-bold text-indigo-300 block mb-0.5">Key Formula:</span>
                                                            <code className="text-indigo-200 font-mono bg-slate-950 px-2 py-1 rounded block">{currentCard.keyFormula}</code>
                                                        </div>
                                                    )}
                                                    {currentCard.mnemonic && (
                                                        <div>
                                                            <span className="font-bold text-indigo-300 block mb-0.5">Memory Hook:</span>
                                                            <p className="text-slate-300 italic">{currentCard.mnemonic}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Rating Controls */}
                                        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
                                            <button onClick={() => handleRate(1)} className="py-3 rounded-xl bg-slate-800/90 border border-red-500/40 hover:bg-red-950/40 text-red-300 font-bold text-xs transition-all">
                                                [1] Again (+5 XP)
                                            </button>
                                            <button onClick={() => handleRate(3)} className="py-3 rounded-xl bg-slate-800/90 border border-orange-500/40 hover:bg-orange-950/40 text-orange-300 font-bold text-xs transition-all">
                                                [2] Hard (+15 XP)
                                            </button>
                                            <button onClick={() => handleRate(4)} className="py-3 rounded-xl bg-slate-800/90 border border-blue-500/40 hover:bg-blue-950/40 text-blue-300 font-bold text-xs transition-all">
                                                [3] Good (+25 XP)
                                            </button>
                                            <button onClick={() => handleRate(5)} className="py-3 rounded-xl bg-slate-800/90 border border-green-500/40 hover:bg-green-950/40 text-green-300 font-bold text-xs transition-all">
                                                [4] Easy (+50 XP)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};