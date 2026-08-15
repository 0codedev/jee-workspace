import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Timer, Brain, Zap, CheckCircle2, XCircle, ChevronRight, 
  ArrowLeft, RotateCcw, Award, Sparkles, ShieldAlert, Clock, AlertTriangle, Play 
} from 'lucide-react';
import type { QuestionLog, Flashcard } from '../../types';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { 
  applyReviewSm2, 
  playXpGainChime, 
  playTickSound, 
  playSprintFinishChime 
} from '../../services/revisionQueueService';

interface DualPerspectiveSprintProps {
  cards: Flashcard[];
  logs?: QuestionLog[];
  initialMode?: 'aptitude' | 'knowledge';
  onClose: () => void;
  onCardUpdated?: (card: Flashcard) => void;
}

export const DualPerspectiveSprint: React.FC<DualPerspectiveSprintProps> = ({
  cards,
  logs = [],
  initialMode = 'aptitude',
  onClose,
  onCardUpdated
}) => {
  const [sprintMode, setSprintMode] = useState<'aptitude' | 'knowledge'>(initialMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Aptitude Mode (Speed Sprint) state
  const [timeLeft, setTimeLeft] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [speedResult, setSpeedResult] = useState<{ isCorrect: boolean; timeTaken: number } | null>(null);

  // Knowledge Mode (Feynman Drill) state
  const [feynmanStage, setFeynmanStage] = useState<'challenge' | 'solution'>('challenge');
  const [userConceptNotes, setUserConceptNotes] = useState('');

  // Filter cards appropriate for each sprint mode
  const activeDeck = useMemo(() => {
    if (sprintMode === 'aptitude') {
      // Prioritize Time Sinks, Careless Errors, and calculation questions
      const prioritized = cards.filter(c => c.isTimeSink || c.isCarelessError || (c.peerCorrectPct && c.peerCorrectPct >= 50));
      return prioritized.length > 0 ? prioritized.slice(0, 10) : cards.slice(0, 10);
    } else {
      // Prioritize Distractor Traps, Conceptual Gaps, and low easeFactor questions
      const prioritized = cards.filter(c => c.studentAnswer || c.front.toLowerCase().includes('distractor') || c.easeFactor < 2.2);
      return prioritized.length > 0 ? prioritized.slice(0, 10) : cards.slice(0, 10);
    }
  }, [cards, sprintMode]);

  const currentCard = activeDeck[currentIndex] || activeDeck[0];

  // 90-Second Countdown Timer for Aptitude Mode
  useEffect(() => {
    if (sprintMode !== 'aptitude' || !isTimerRunning || isFinished || speedResult !== null) return;

    if (timeLeft <= 0) {
      handleTimeExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 10 && prev > 0) {
          playTickSound();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isTimerRunning, sprintMode, isFinished, speedResult]);

  // Reset per question
  useEffect(() => {
    setTimeLeft(90);
    setSelectedOption(null);
    setSpeedResult(null);
    setFeynmanStage('challenge');
    setUserConceptNotes('');
    setIsTimerRunning(true);
  }, [currentIndex, sprintMode]);

  const handleTimeExpire = () => {
    setIsTimerRunning(false);
    setSpeedResult({ isCorrect: false, timeTaken: 90 });
  };

  const handleOptionSelect = (optionKey: string) => {
    if (speedResult !== null || !currentCard) return;

    const timeTaken = 90 - timeLeft;
    setIsTimerRunning(false);
    setSelectedOption(optionKey);

    // Check correctness against correctOptions or back
    const correctKey = currentCard.correctOptions && currentCard.correctOptions.length > 0 
      ? currentCard.correctOptions[0]
      : (currentCard.back.match(/Answer:\s*([A-D0-9.-]+)/i)?.[1] || 'A');

    const isCorrect = optionKey.trim().toLowerCase() === correctKey.trim().toLowerCase();
    setSpeedResult({ isCorrect, timeTaken });

    if (isCorrect) {
      playXpGainChime();
      setSessionScore(prev => prev + 1);
      setSessionXp(prev => prev + 25);
    }
  };

  const handleSelfAssessment = async (rating: 'shaky' | 'got_it' | 'mastered') => {
    if (!currentCard) return;

    const { updatedCard, xpGained } = await applyReviewSm2(currentCard, rating);
    if (onCardUpdated) onCardUpdated(updatedCard);

    playXpGainChime();
    setSessionXp(prev => prev + xpGained);

    if (rating !== 'shaky') {
      setSessionScore(prev => prev + 1);
    }

    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeDeck.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      playSprintFinishChime();
    }
  };

  if (!currentCard || activeDeck.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-cyan-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Sprint Cards Available</h3>
          <p className="text-xs text-slate-400">All questions in this sprint category are currently cleared or mastered!</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto p-3 sm:p-6 font-sans text-slate-100">
      
      {/* Top Header & Cyberpunk Sprint Control Bar */}
      <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider font-mono">
                {sprintMode === 'aptitude' ? '⚡ Aptitude Speed Sprint' : '🧠 Knowledge Feynman Drill'}
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                sprintMode === 'aptitude' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-purple-950 text-purple-300 border border-purple-500/40'
              }`}>
                Card {currentIndex + 1} / {activeDeck.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {sprintMode === 'aptitude' ? 'Rapid 90-second pacing drill to eliminate hesitation overhead' : 'Dissect distractor traps and reconstruct fundamental theorems'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs & Live Score */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-slate-400">Score:</span>
            <strong className="text-cyan-300">{sessionScore}</strong>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">+{sessionXp} XP</span>
          </div>

          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => { setSprintMode('aptitude'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                sprintMode === 'aptitude' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Timer size={14} /> Speed
            </button>
            <button
              onClick={() => { setSprintMode('knowledge'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                sprintMode === 'knowledge' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain size={14} /> Feynman
            </button>
          </div>
        </div>

      </div>

      {/* Main Sprint Body */}
      <div className="max-w-4xl w-full mx-auto my-auto py-6 space-y-6">
        
        {!isFinished ? (
          <div className="bg-surface border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Card Meta Strip */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-400 border border-slate-800 font-mono font-bold text-xs">
                  {currentCard.topic}
                </span>
                {currentCard.subject && (
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-400 border border-slate-800">
                    {currentCard.subject}
                  </span>
                )}
                {currentCard.isCarelessError && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                    Careless Error
                  </span>
                )}
              </div>

              {/* Mode A: Speed Timer Circle */}
              {sprintMode === 'aptitude' && (
                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border font-mono font-bold text-sm ${
                  timeLeft <= 15 ? 'bg-rose-950 text-rose-400 border-rose-500 animate-pulse' : 'bg-slate-950 text-amber-300 border-amber-500/40'
                }`}>
                  <Clock size={16} />
                  <span>{timeLeft}s</span>
                </div>
              )}
            </div>

            {/* Question Body */}
            <div className="space-y-4 text-slate-200 leading-relaxed text-sm sm:text-base">
              {currentCard.questionHtml ? (
                <div 
                  className="prose prose-invert max-w-none text-slate-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: currentCard.questionHtml }}
                />
              ) : (
                <MarkdownRenderer content={currentCard.front} />
              )}
            </div>

            {/* ========================================================================= */}
            {/* MODE A: APTITUDE SPRINT INTERACTION (Speed Options & Delta Comparison) */}
            {/* ========================================================================= */}
            {sprintMode === 'aptitude' && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                {currentCard.optionsHtml && currentCard.optionsHtml.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentCard.optionsHtml.map((opt) => {
                      const isSelected = selectedOption === opt.identifier;
                      return (
                        <button
                          key={opt.identifier}
                          onClick={() => handleOptionSelect(opt.identifier)}
                          disabled={speedResult !== null}
                          className={`p-4 rounded-2xl border text-left font-sans text-xs sm:text-sm transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/20'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold flex items-center justify-center shrink-0">
                            {opt.identifier}
                          </span>
                          <div 
                            className="truncate"
                            dangerouslySetInnerHTML={{ __html: opt.content }}
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['A', 'B', 'C', 'D'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleOptionSelect(key)}
                        disabled={speedResult !== null}
                        className={`p-4 rounded-2xl border font-mono font-bold text-center text-sm transition-all ${
                          selectedOption === key
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        Option {key}
                      </button>
                    ))}
                  </div>
                )}

                {/* Speed Feedback Banner */}
                {speedResult && (
                  <div className={`p-4 rounded-2xl border flex items-center justify-between animate-in fade-in zoom-in-95 duration-200 ${
                    speedResult.isCorrect 
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' 
                      : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {speedResult.isCorrect ? <CheckCircle2 size={24} className="text-emerald-400" /> : <XCircle size={24} className="text-rose-400" />}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">
                          {speedResult.isCorrect ? 'Target Neutralized!' : 'Hesitation or Miscalculation'}
                        </p>
                        <p className="text-xs text-slate-300 font-mono mt-0.5">
                          Solved in <strong className="text-white">{speedResult.timeTaken}s</strong> (Speed Target: &le; 90s)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-600/30"
                    >
                      Next Target <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODE B: KNOWLEDGE FEYNMAN DRILL (Concept Prompt & Step-by-Step Synthesis) */}
            {/* ========================================================================= */}
            {sprintMode === 'knowledge' && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                {feynmanStage === 'challenge' ? (
                  <div className="space-y-4 p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                    <div className="flex items-center gap-2 text-purple-300 text-xs font-mono font-bold">
                      <Brain size={16} />
                      <span>Feynman Challenge: Dissect The Distractor</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Before revealing the solution: In your own words, <strong>why is the common distractor tempting</strong> and what core principle does this question test?
                    </p>
                    <textarea
                      value={userConceptNotes}
                      onChange={(e) => setUserConceptNotes(e.target.value)}
                      placeholder="e.g. Formula applies only in adiabatic conditions, forgot the negative sign in work done..."
                      className="w-full h-20 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none font-sans"
                    />
                    <button
                      onClick={() => setFeynmanStage('solution')}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                    >
                      <Sparkles size={16} /> Reveal Step-by-Step Proof
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    {/* Solution Display */}
                    <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="font-bold text-cyan-400 uppercase font-mono">Formal Solution & Theorem</span>
                        {currentCard.correctOptions && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                            Key: {currentCard.correctOptions.join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 space-y-2">
                        {currentCard.explanationHtml ? (
                          <div 
                            className="prose prose-invert max-w-none text-xs sm:text-sm"
                            dangerouslySetInnerHTML={{ __html: currentCard.explanationHtml }}
                          />
                        ) : (
                          <MarkdownRenderer content={currentCard.back} />
                        )}
                      </div>
                    </div>

                    {/* 3-Tier Self-Assessment Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => handleSelfAssessment('shaky')}
                        className="py-3 px-4 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-600/50 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <XCircle size={16} /> Still Shaky (+5 XP)
                      </button>
                      <button
                        onClick={() => handleSelfAssessment('got_it')}
                        className="py-3 px-4 rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-600/50 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle2 size={16} /> Got It (+25 XP)
                      </button>
                      <button
                        onClick={() => handleSelfAssessment('mastered')}
                        className="py-3 px-4 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/50 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Sparkles size={16} /> Mastered (+50 XP)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          /* ========================================================================= */
          /* SPRINT COMPLETION SUMMARY CARD */
          /* ========================================================================= */
          <div className="bg-surface border border-cyan-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-cyan-500/20">
              🏆
            </div>
            
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
                Sprint Completed!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You successfully cleared {activeDeck.length} high-liability error targets.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-mono uppercase text-slate-400">Score Realized</p>
                <p className="text-2xl font-black text-cyan-400 font-mono">{sessionScore} / {activeDeck.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-mono uppercase text-slate-400">Total XP Gained</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">+{sessionXp} XP</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFinished(false);
                  setSessionScore(0);
                  setSessionXp(0);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 transition-all"
              >
                <RotateCcw size={14} /> Retry Sprint
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/30"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
