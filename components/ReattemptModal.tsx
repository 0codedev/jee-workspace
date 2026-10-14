import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, CheckCircle2, AlertCircle, Clock, Zap, Award, Sparkles, BookOpen, 
  RotateCcw, Bookmark, Star, AlertTriangle, Monitor, LayoutGrid, Check, 
  Info, ChevronLeft, ChevronRight, BarChart2, CheckCircle, XCircle, 
  HelpCircle, Flame, ArrowRight, Eye, TrendingUp, User
} from 'lucide-react';
import type { QuestionLog, PanicAlert, TestDebrief } from '../types';
import { db } from '../database';
import { generateInSessionAlert, getPersonalPanicProfile, generatePostTestDebrief } from '../services/panicAnalyzer';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface ReattemptModalProps {
  log: QuestionLog;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLog: (updatedLog: QuestionLog) => void;
  allLogs?: QuestionLog[];
  onSelectLog?: (log: QuestionLog) => void;
  initialLayoutMode?: 'nta' | 'examgoal';
}

interface QuestionSessionState {
  selectedOptionIdx: number | null;
  numericalInput: string;
  status: 'not_visited' | 'visited' | 'answered' | 'marked' | 'answered_marked';
  timeSpent: number; // seconds spent on this question in this session
  hasSubmitted?: boolean;
  isCorrect?: boolean;
  showExplanation?: boolean;
}

/**
 * LaTeX Math Formatter: Cleans unescaped TeX string sequences (\u -> \mu)
 * and renders KaTeX block ($$...$$) & inline ($...$) formulas into rich HTML.
 */
export function formatMathHtml(html?: string): string {
  if (!html) return '';
  
  // 1. Clean unescaped LaTeX commands (e.g. \u= -> \mu=, \u\ -> \mu\)
  let cleaned = html.replace(/\\u([=\s\{\\\_\^\-\+\*\/\(\)0-9a-zA-Z])/g, '\\mu$1');

  // 2. Strip artificial line breaks directly surrounding math delimiters to keep sentences flowing
  cleaned = cleaned.replace(/(<br\s*\/?>|\n)+\s*(\$\$|\$)/gi, ' $2');
  cleaned = cleaned.replace(/(\$\$|\$)\s*(<br\s*\/?>|\n)+/gi, '$1 ');

  // 3. Smart TeX math replacement ($$ ... $$)
  cleaned = cleaned.replace(/\$\$(.*?)\$\$/gs, (_, tex) => {
    const trimmed = tex.trim();
    const isComplexEquation = /\\(frac|sum|int|lim|begin|matrix|iint|prod)/i.test(trimmed) && trimmed.length > 25;

    try {
      const renderedHtml = katex.renderToString(trimmed, { 
        displayMode: isComplexEquation, 
        throwOnError: false 
      });
      return isComplexEquation 
        ? `<div class="my-3 text-center overflow-x-auto">${renderedHtml}</div>`
        : `<span class="inline-block px-1 align-baseline">${renderedHtml}</span>`;
    } catch {
      return `<span class="font-mono text-cyan-300">$${trimmed}$</span>`;
    }
  });

  // 4. TeX inline math ($ ... $)
  cleaned = cleaned.replace(/\$(.*?)\$/g, (_, tex) => {
    const trimmed = tex.trim();
    try {
      const renderedHtml = katex.renderToString(trimmed, { 
        displayMode: false, 
        throwOnError: false 
      });
      return `<span class="inline-block px-1 align-baseline">${renderedHtml}</span>`;
    } catch {
      return `<span class="font-mono text-cyan-300">$${trimmed}$</span>`;
    }
  });

  return cleaned;
}

export const ReattemptModal: React.FC<ReattemptModalProps> = ({ 
  log, 
  isOpen, 
  onClose, 
  onUpdateLog,
  allLogs = [],
  onSelectLog,
  initialLayoutMode
}) => {
  // In-session memory map: remembers selections, inputs, and timers for EVERY question in this session
  const [sessionResponses, setSessionResponses] = useState<Record<string, QuestionSessionState>>({});

  // Active question temporary states
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [numericalInput, setNumericalInput] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  
  // Test Level States
  const [isTestSubmitted, setIsTestSubmitted] = useState<boolean>(false);
  const [showAnalysisScreen, setShowAnalysisScreen] = useState<boolean>(false);

  // Timer tracking
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [flashcardSaved, setFlashcardSaved] = useState<boolean>(false);
  const [panicAlert, setPanicAlert] = useState<PanicAlert | null>(null);

  const panicProfile = useMemo(() => {
    return getPersonalPanicProfile([], allLogs || []);
  }, [allLogs]);

  const currentQStartTimeRef = useRef<number>(Date.now());
  const currentQKeyRef = useRef<string>('');

  // Persistent Layout Mode: 'nta' (Official NTA CBT Interface) vs 'examgoal' (Modern ExamGOAL Interface)
  const [layoutMode, setLayoutMode] = useState<'nta' | 'examgoal'>(() => {
    if (initialLayoutMode) return initialLayoutMode;
    const saved = localStorage.getItem('jee_test_layout_mode');
    return (saved === 'nta' || saved === 'examgoal') ? saved : 'examgoal';
  });

  useEffect(() => {
    localStorage.setItem('jee_test_layout_mode', layoutMode);
  }, [layoutMode]);

  const getLogKey = (l: QuestionLog): string => {
    return l.questionId || `${l.testId}-${l.questionNumber}`;
  };

  const currentKey = log ? getLogKey(log) : '';

  // ─── RESET ON MODAL OPEN / CLOSE ─────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setSessionStartTime(Date.now());
      setElapsedSeconds(0);
      setPanicAlert(null);
      currentQStartTimeRef.current = Date.now();
      setIsTestSubmitted(false);
      setShowAnalysisScreen(false);
      
      if (log) {
        const key = getLogKey(log);
        currentQKeyRef.current = key;
        setSessionResponses({
          [key]: {
            selectedOptionIdx: null,
            numericalInput: '',
            status: 'visited',
            timeSpent: 0,
            hasSubmitted: false,
            isCorrect: false,
            showExplanation: false
          }
        });
        setSelectedOptionIdx(null);
        setNumericalInput('');
        setHasSubmitted(false);
        setIsCorrect(false);
        setShowExplanation(false);
      }
    } else {
      // Clear in-session answers on modal close
      setSessionResponses({});
      setSelectedOptionIdx(null);
      setNumericalInput('');
      setHasSubmitted(false);
      setIsCorrect(false);
      setShowExplanation(false);
      setFlashcardSaved(false);
      setIsTestSubmitted(false);
      setShowAnalysisScreen(false);
      setPanicAlert(null);
    }
  }, [isOpen]);

  // Main session timer & in-session cognitive panic check
  useEffect(() => {
    if (!isOpen || showAnalysisScreen) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      setElapsedSeconds(elapsed);

      // Check panic window every 60s
      if (elapsed > 0 && elapsed % 60 === 0) {
        const alert = generateInSessionAlert(Math.floor(elapsed / 60), panicProfile);
        if (alert) {
          setPanicAlert(alert);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, sessionStartTime, showAnalysisScreen, panicProfile]);

  // ─── SECTION & QUESTION GROUPING ─────────────────────────────────────────────
  const displayLogs = allLogs.length > 0 ? allLogs : (log ? [log] : []);

  const isNumericalLog = (l: QuestionLog): boolean => {
    const t = (l.questionType || '').toLowerCase();
    return t.includes('numeric') || t.includes('integer');
  };

  const testLogs = useMemo(() => {
    if (!log) return [];
    const tid = log.testId;
    const filtered = displayLogs
      .filter(l => l.testId === tid)
      .sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));
    return filtered.length > 0 ? filtered : displayLogs;
  }, [log, displayLogs]);

  const subjectLogs = useMemo(() => {
    if (!log) return [];
    const subj = (log.subject || '').toLowerCase().trim();
    if (!subj) return testLogs;
    const filtered = testLogs.filter(l =>
      (l.subject || '').toLowerCase().trim() === subj
    );
    return filtered.length > 0 ? filtered : testLogs;
  }, [log, testLogs]);

  const sectionALogs = useMemo(() =>
    subjectLogs.filter(l => !isNumericalLog(l)).slice(0, 20),
    [subjectLogs]
  );

  const sectionBLogs = useMemo(() =>
    subjectLogs.filter(l => isNumericalLog(l)).slice(0, 5),
    [subjectLogs]
  );

  const activeSection: 'A' | 'B' = log ? (isNumericalLog(log) ? 'B' : 'A') : 'A';

  const currentSectionLogs = useMemo(() =>
    activeSection === 'B' ? sectionBLogs : sectionALogs,
    [activeSection, sectionALogs, sectionBLogs]
  );

  const currentLogIndex = useMemo(() => {
    if (!log) return 0;
    const idx = subjectLogs.findIndex(l =>
      (l.questionId && log.questionId && l.questionId === log.questionId) ||
      (l.questionNumber === log.questionNumber &&
        (l.subject || '').toLowerCase() === (log.subject || '').toLowerCase())
    );
    return idx >= 0 ? idx : 0;
  }, [log, subjectLogs]);

  // ─── OPTIONS NORMALIZATION ────────────────────────────────────────────────────
  const normalizedOptions = useMemo(() => {
    if (!log) return [];
    let rawOpts: any = log.options || log.optionsHtml;
    if (typeof rawOpts === 'string') {
      try { rawOpts = JSON.parse(rawOpts); } catch { rawOpts = []; }
    }
    if (!Array.isArray(rawOpts) || rawOpts.length === 0) return [];

    return rawOpts.map((opt: any, index: number) => {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const letterId = letters[index] || String(index + 1);
      if (typeof opt === 'string') return { identifier: letterId, content: opt };
      if (typeof opt === 'object' && opt !== null) {
        const identifier = opt.identifier || opt.id || opt.key || letterId;
        const content = opt.content || opt.textHtml || opt.text || opt.value || '';
        return { identifier: String(identifier), content: String(content) };
      }
      return { identifier: letterId, content: String(opt) };
    });
  }, [log]);

  const isNumericalQuestion = log ? (isNumericalLog(log) || normalizedOptions.length === 0) : false;

  // ─── PEER OPTION DISTRIBUTION CALCULATOR ──────────────────────────────────────
  const getPeerDistribution = (optIdentifier: string, idx: number): number => {
    if (!log) return 0;
    
    if (log.optionsDistribution) {
      if (log.optionsDistribution[optIdentifier] !== undefined) {
        return Math.round(log.optionsDistribution[optIdentifier]);
      }
      if (log.optionsDistribution[String(idx)] !== undefined) {
        return Math.round(log.optionsDistribution[String(idx)]);
      }
    }

    const isCorrectOpt = log.correctOptions?.includes(optIdentifier);
    const correctPct = log.globalCorrectPct || 65;
    if (isCorrectOpt) return correctPct;

    const remaining = Math.max(5, 100 - correctPct);
    const wrongCount = Math.max(1, (normalizedOptions.length || 4) - 1);
    const base = Math.floor(remaining / wrongCount);
    return idx % 2 === 0 ? Math.min(40, base + 4) : Math.max(2, base - 4);
  };

  // ─── TRANSITION TO NEW QUESTION WITH IN-SESSION PERSISTENCE ───────────────────
  const switchQuestion = (targetLog: QuestionLog) => {
    if (!log) return;

    const timeSpentOnCurrent = Math.floor((Date.now() - currentQStartTimeRef.current) / 1000);
    const oldKey = currentQKeyRef.current || getLogKey(log);

    setSessionResponses(prev => {
      const existing = prev[oldKey] || {
        selectedOptionIdx: selectedOptionIdx,
        numericalInput: numericalInput,
        status: 'visited',
        timeSpent: 0,
        hasSubmitted: hasSubmitted,
        isCorrect: isCorrect,
        showExplanation: showExplanation
      };

      return {
        ...prev,
        [oldKey]: {
          ...existing,
          selectedOptionIdx: selectedOptionIdx,
          numericalInput: numericalInput,
          timeSpent: (existing.timeSpent || 0) + timeSpentOnCurrent,
          hasSubmitted: hasSubmitted,
          isCorrect: isCorrect,
          showExplanation: showExplanation
        }
      };
    });

    const targetKey = getLogKey(targetLog);
    currentQKeyRef.current = targetKey;
    currentQStartTimeRef.current = Date.now();

    const targetState = sessionResponses[targetKey];
    if (targetState) {
      setSelectedOptionIdx(targetState.selectedOptionIdx);
      setNumericalInput(targetState.numericalInput);
      setHasSubmitted(targetState.hasSubmitted || false);
      setIsCorrect(targetState.isCorrect || false);
      setShowExplanation(targetState.showExplanation || false);
    } else {
      setSelectedOptionIdx(null);
      setNumericalInput('');
      setHasSubmitted(false);
      setIsCorrect(false);
      setShowExplanation(false);
      setSessionResponses(prev => ({
        ...prev,
        [targetKey]: {
          selectedOptionIdx: null,
          numericalInput: '',
          status: 'visited',
          timeSpent: 0,
          hasSubmitted: false,
          isCorrect: false,
          showExplanation: false
        }
      }));
    }

    setFlashcardSaved(false);

    if (onSelectLog) {
      onSelectLog(targetLog);
    }
  };

  const handleNextQuestion = () => {
    if (currentLogIndex < subjectLogs.length - 1) {
      switchQuestion(subjectLogs[currentLogIndex + 1]);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentLogIndex > 0) {
      switchQuestion(subjectLogs[currentLogIndex - 1]);
    }
  };

  const handleSectionChange = (sec: 'A' | 'B') => {
    const target = sec === 'A' ? sectionALogs : sectionBLogs;
    if (target.length > 0) {
      switchQuestion(target[0]);
    }
  };

  // ─── OPTION & INPUT HANDLERS ──────────────────────────────────────────────────
  const handleSelectOption = (idx: number) => {
    if (hasSubmitted && isTestSubmitted) return;
    setSelectedOptionIdx(idx);
    setSessionResponses(prev => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {
          status: 'visited',
          timeSpent: 0,
          hasSubmitted: false,
          isCorrect: false,
          showExplanation: false
        }),
        selectedOptionIdx: idx,
        numericalInput: ''
      }
    }));
  };

  const handleNumericalChange = (val: string) => {
    if (hasSubmitted && isTestSubmitted) return;
    setNumericalInput(val);
    setSessionResponses(prev => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {
          status: 'visited',
          timeSpent: 0,
          hasSubmitted: false,
          isCorrect: false,
          showExplanation: false
        }),
        selectedOptionIdx: null,
        numericalInput: val
      }
    }));
  };

  const handleClearResponse = () => {
    if (hasSubmitted && isTestSubmitted) return;
    setSelectedOptionIdx(null);
    setNumericalInput('');
    setHasSubmitted(false);
    setShowExplanation(false);
    setSessionResponses(prev => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {
          timeSpent: 0,
          hasSubmitted: false,
          isCorrect: false,
          showExplanation: false
        }),
        selectedOptionIdx: null,
        numericalInput: '',
        status: 'visited',
        hasSubmitted: false,
        showExplanation: false
      }
    }));
  };

  const handleMarkForReviewAndNext = () => {
    const hasAnswer = selectedOptionIdx !== null || numericalInput.trim() !== '';
    const newStatus = hasAnswer ? 'answered_marked' : 'marked';

    setSessionResponses(prev => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {
          selectedOptionIdx: selectedOptionIdx,
          numericalInput: numericalInput,
          timeSpent: 0,
          hasSubmitted: false,
          isCorrect: false,
          showExplanation: false
        }),
        status: newStatus
      }
    }));

    handleNextQuestion();
  };

  // ─── SAVE & NEXT (SILENT IN EXAM MODE) ────────────────────────────────────────
  const handleSaveAndNext = () => {
    if (!log) return;

    const timeSpentOnCurrent = Math.floor((Date.now() - currentQStartTimeRef.current) / 1000);
    const existing = sessionResponses[currentKey];
    
    setSessionResponses(prev => ({
      ...prev,
      [currentKey]: {
        ...(existing || {
          timeSpent: 0,
          hasSubmitted: false,
          isCorrect: false,
          showExplanation: false
        }),
        selectedOptionIdx: selectedOptionIdx,
        numericalInput: numericalInput,
        status: 'answered',
        timeSpent: (existing?.timeSpent || 0) + timeSpentOnCurrent
      }
    }));

    if (currentLogIndex < subjectLogs.length - 1) {
      switchQuestion(subjectLogs[currentLogIndex + 1]);
    }
  };

  // ─── INSTANT CHECK ANSWER (PRACTICE / DIAGNOSTIC MODE) ────────────────────────
  const handleCheckAnswer = async () => {
    if (!log) return;

    let userCorrect = false;
    let selectedAnswerStr = '';

    if (isNumericalQuestion) {
      selectedAnswerStr = numericalInput.trim();
      const expectedKey = (log.finalKey || '').trim();
      userCorrect = selectedAnswerStr === expectedKey || parseFloat(selectedAnswerStr) === parseFloat(expectedKey);
    } else {
      const chosenOpt = normalizedOptions[selectedOptionIdx ?? -1];
      selectedAnswerStr = chosenOpt ? chosenOpt.identifier : String((selectedOptionIdx ?? 0) + 1);
      const correctOpts = log.correctOptions || [];
      userCorrect = correctOpts.includes(selectedAnswerStr);
    }

    const timeSpentOnThisQuestion = Math.max(1, Math.floor((Date.now() - currentQStartTimeRef.current) / 1000) + (sessionResponses[currentKey]?.timeSpent || 0));

    setIsCorrect(userCorrect);
    setHasSubmitted(true);
    setShowExplanation(true);

    setSessionResponses(prev => ({
      ...prev,
      [currentKey]: {
        selectedOptionIdx: selectedOptionIdx,
        numericalInput: numericalInput,
        status: 'answered',
        timeSpent: timeSpentOnThisQuestion,
        hasSubmitted: true,
        isCorrect: userCorrect,
        showExplanation: true
      }
    }));

    const updatedLog: QuestionLog = {
      ...log,
      isMastered: userCorrect ? true : log.isMastered,
      reattemptCount: (log.reattemptCount || 0) + 1,
      lastReattemptDate: new Date().toISOString(),
      reattemptHistory: [
        ...(log.reattemptHistory || []),
        {
          date: new Date().toISOString(),
          isCorrect: userCorrect,
          timeSpent: timeSpentOnThisQuestion,
          selectedAnswer: selectedAnswerStr
        }
      ]
    };

    onUpdateLog(updatedLog);

    try {
      const dbLog = await db.questionLogs.where({ testId: log.testId, questionNumber: log.questionNumber }).first();
      if (dbLog && dbLog.id) {
        await db.questionLogs.update(dbLog.id, {
          isMastered: updatedLog.isMastered,
          reattemptCount: updatedLog.reattemptCount,
          lastReattemptDate: updatedLog.lastReattemptDate,
          reattemptHistory: updatedLog.reattemptHistory
        });
      }
    } catch (e) {
      console.error("Failed to persist reattempt record to Dexie:", e);
    }
  };

  // ─── FINAL TEST SUBMISSION & DEEP ANALYSIS EVALUATION ─────────────────────────
  const handleSubmitFullTest = async () => {
    setIsTestSubmitted(true);
    setShowAnalysisScreen(true);

    const evaluatedUpdates: Record<string, QuestionSessionState> = { ...sessionResponses };

    for (const qLog of subjectLogs) {
      const qKey = getLogKey(qLog);
      const qState = evaluatedUpdates[qKey] || {
        selectedOptionIdx: null,
        numericalInput: '',
        status: 'not_visited',
        timeSpent: 0
      };

      const isNumerical = isNumericalLog(qLog);
      let userCorrect = false;
      let selectedAnswerStr = '';

      if (isNumerical) {
        selectedAnswerStr = (qState.numericalInput || '').trim();
        const expectedKey = (qLog.finalKey || '').trim();
        userCorrect = selectedAnswerStr !== '' && (selectedAnswerStr === expectedKey || parseFloat(selectedAnswerStr) === parseFloat(expectedKey));
      } else {
        if (qState.selectedOptionIdx !== null && qState.selectedOptionIdx !== undefined) {
          const rawOpts = qLog.options || qLog.optionsHtml || [];
          const chosenOpt = rawOpts[qState.selectedOptionIdx];
          selectedAnswerStr = chosenOpt ? (chosenOpt.identifier || String(qState.selectedOptionIdx + 1)) : String(qState.selectedOptionIdx + 1);
          userCorrect = (qLog.correctOptions || []).includes(selectedAnswerStr);
        }
      }

      const hasAnswer = selectedAnswerStr !== '';
      evaluatedUpdates[qKey] = {
        ...qState,
        hasSubmitted: true,
        isCorrect: userCorrect,
        showExplanation: true,
        status: hasAnswer ? 'answered' : qState.status
      };

      if (hasAnswer) {
        const updatedLog: QuestionLog = {
          ...qLog,
          isMastered: userCorrect ? true : qLog.isMastered,
          reattemptCount: (qLog.reattemptCount || 0) + 1,
          lastReattemptDate: new Date().toISOString(),
          reattemptHistory: [
            ...(qLog.reattemptHistory || []),
            {
              date: new Date().toISOString(),
              isCorrect: userCorrect,
              timeSpent: qState.timeSpent || 0,
              selectedAnswer: selectedAnswerStr
            }
          ]
        };

        onUpdateLog(updatedLog);

        try {
          const dbLog = await db.questionLogs.where({ testId: qLog.testId, questionNumber: qLog.questionNumber }).first();
          if (dbLog && dbLog.id) {
            await db.questionLogs.update(dbLog.id, {
              isMastered: updatedLog.isMastered,
              reattemptCount: updatedLog.reattemptCount,
              lastReattemptDate: updatedLog.lastReattemptDate,
              reattemptHistory: updatedLog.reattemptHistory
            });
          }
        } catch (e) {
          console.error("Failed to update question log attempt in Dexie:", e);
        }
      }
    }

    setSessionResponses(evaluatedUpdates);
  };

  const handleSaveFlashcard = async () => {
    if (!log) return;
    try {
      const flashcardId = `fc-${log.testId}-Q${log.questionNumber}-${Date.now()}`;
      
      let frontNotice = '';
      if (log.isDistractorTrap) {
        frontNotice = `<div class="p-2.5 my-2 bg-purple-950/60 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-center gap-2"><span>🪤</span><b>Distractor Trap Warning:</b> Peer trap choice detected. Review core logic!</div>`;
      } else if (log.isCarelessError) {
        frontNotice = `<div class="p-2.5 my-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center gap-2"><span>⚠️</span><b>Careless Leak Alert:</b> Peer accuracy ${log.globalCorrectPct || 70}%. Check units!</div>`;
      }

      const questionText = log.questionHtml 
        ? `${frontNotice}<div>${log.questionHtml}</div>`
        : `${frontNotice}<p><b>Q${log.questionNumber} (${log.subject.toUpperCase()})</b> -- ${log.topic || log.chapter || 'JEE Problem'}</p>`;

      const solutionText = log.explanationHtml
        ? `<div class="space-y-2"><p class="text-xs font-bold text-emerald-400 uppercase tracking-widest">Official Solution (${log.finalKey || log.correctOptions?.join(', ') || 'N/A'})</p><div>${log.explanationHtml}</div></div>`
        : `<p>Official Key: <b>${log.finalKey || log.correctOptions?.join(', ') || 'N/A'}</b></p>`;

      await db.flashcards.put({
        id: flashcardId,
        topic: log.topic || log.chapter || 'JEE Review',
        front: questionText,
        back: solutionText,
        nextReview: new Date(Date.now() + 3 * 86400000).toISOString(),
        interval: 3,
        easeFactor: 2.5,
        reviews: 0,
        difficulty: (log.difficulty as any) || 'Medium'
      });

      setFlashcardSaved(true);
    } catch (e) {
      console.error("Failed to save flashcard:", e);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ─── COMPUTED STATS FOR DEEP ANALYSIS SCREEN ──────────────────────────────────
  const testAnalysisMetrics = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    let totalMarks = 0;
    let maxMarks = subjectLogs.length * 4;
    let totalTime = elapsedSeconds;

    const correctLogs: QuestionLog[] = [];
    const wrongLogs: QuestionLog[] = [];
    const unattemptedLogs: QuestionLog[] = [];

    subjectLogs.forEach(l => {
      const qKey = getLogKey(l);
      const state = sessionResponses[qKey];
      const hasAnswer = state?.selectedOptionIdx !== null || (state?.numericalInput && state.numericalInput.trim() !== '');

      if (!hasAnswer) {
        unattempted++;
        unattemptedLogs.push(l);
      } else if (state?.isCorrect) {
        correct++;
        totalMarks += l.positiveMarks || 4;
        correctLogs.push(l);
      } else {
        wrong++;
        totalMarks -= Math.abs(l.negativeMarks || 1);
        wrongLogs.push(l);
      }
    });

    const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
    const avgTimePerQ = subjectLogs.length > 0 ? Math.round(totalTime / subjectLogs.length) : 0;

    const debriefInput = subjectLogs.map(l => {
      const qKey = getLogKey(l);
      const st = sessionResponses[qKey];
      return {
        questionNumber: l.questionNumber,
        timeSpent: st?.timeSpent || 0,
        isCorrect: !!st?.isCorrect,
        subject: l.subject
      };
    });

    const debrief = generatePostTestDebrief(debriefInput);

    return {
      correct,
      wrong,
      unattempted,
      totalMarks,
      maxMarks,
      accuracy,
      totalTime,
      avgTimePerQ,
      correctLogs,
      wrongLogs,
      unattemptedLogs,
      debrief
    };
  }, [subjectLogs, sessionResponses, elapsedSeconds]);

  // ─── PALETTE STATUS COUNTERS ──────────────────────────────────────────────────
  const answeredCount = useMemo(() => {
    return subjectLogs.filter(l => {
      const st = sessionResponses[getLogKey(l)]?.status;
      return st === 'answered' || st === 'answered_marked';
    }).length;
  }, [subjectLogs, sessionResponses]);

  const markedCount = useMemo(() => {
    return subjectLogs.filter(l => {
      const st = sessionResponses[getLogKey(l)]?.status;
      return st === 'marked' || st === 'answered_marked';
    }).length;
  }, [subjectLogs, sessionResponses]);

  const notAnsweredCount = useMemo(() => {
    return subjectLogs.filter(l => sessionResponses[getLogKey(l)]?.status === 'visited').length;
  }, [subjectLogs, sessionResponses]);

  const notVisitedCount = useMemo(() => {
    return subjectLogs.length - (answeredCount + markedCount + notAnsweredCount);
  }, [subjectLogs.length, answeredCount, markedCount, notAnsweredCount]);

  // ─── FORMATTED HTML ───────────────────────────────────────────────────────────
  const formattedQuestionHtml = useMemo(() => log ? formatMathHtml(log.questionHtml) : '', [log?.questionHtml]);
  const formattedExplanationHtml = useMemo(() => log ? formatMathHtml(log.explanationHtml) : '', [log?.explanationHtml]);
  const displayQuestionNumber = log ? log.questionNumber : 1;

  if (!isOpen || !log) return null;

  return createPortal(
    <div 
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-fade-in"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
      onClick={onClose}
    >
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div 
        className="relative w-full max-w-[95vw] lg:max-w-7xl h-[92vh] max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-scale-in z-10 my-auto mx-auto font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* SCREEN A: POST-SUBMISSION DEEP TEST ANALYSIS SCREEN                      */}
        {/* ========================================================================= */}
        {showAnalysisScreen ? (
          <div className="flex flex-col h-full bg-surface-base text-slate-100 font-sans select-none overflow-hidden animate-fade-in">
            {/* Top Analysis Header */}
            <div className="bg-surface border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold flex items-center justify-center text-lg shadow">
                  🏆
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2 font-mono">
                    Test Performance & Diagnostic Telemetry
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {log.testId} • {subjectLogs.length} Questions Re-attempted
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAnalysisScreen(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
                >
                  <Eye size={16} /> Review Questions
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Analysis Dashboard Body */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
              
              {/* Score KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-surface border border-slate-800 shadow-md">
                  <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Total Score</p>
                  <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {testAnalysisMetrics.totalMarks} <span className="text-xs text-slate-500 font-normal">/ {testAnalysisMetrics.maxMarks}</span>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-slate-800 shadow-md">
                  <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Accuracy Rate</p>
                  <p className={`text-2xl sm:text-3xl font-black mt-1 ${testAnalysisMetrics.accuracy >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {testAnalysisMetrics.accuracy}%
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-slate-800 shadow-md">
                  <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Total Time</p>
                  <p className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1 font-mono">
                    {formatTimer(testAnalysisMetrics.totalTime)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-slate-800 shadow-md">
                  <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Avg Time / Q</p>
                  <p className="text-2xl sm:text-3xl font-black text-indigo-300 mt-1 font-mono">
                    {testAnalysisMetrics.avgTimePerQ}s
                  </p>
                </div>
              </div>

              {/* Question Map Summary (Correct / Wrong / Unattempted) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Correct Questions Box */}
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Correct ({testAnalysisMetrics.correct})
                    </span>
                    <span className="text-xs text-emerald-400/80 font-mono font-bold">+{testAnalysisMetrics.correct * 4} Marks</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {testAnalysisMetrics.correctLogs.map(l => (
                      <button
                        key={getLogKey(l)}
                        onClick={() => {
                          setShowAnalysisScreen(false);
                          switchQuestion(l);
                        }}
                        className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center shadow transition-all hover:scale-105"
                      >
                        {l.questionNumber}
                      </button>
                    ))}
                    {testAnalysisMetrics.correctLogs.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">No correct answers in this attempt.</p>
                    )}
                  </div>
                </div>

                {/* Wrong Questions Box */}
                <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 uppercase font-mono flex items-center gap-1.5">
                      <AlertCircle size={16} /> Wrong ({testAnalysisMetrics.wrong})
                    </span>
                    <span className="text-xs text-rose-400/80 font-mono font-bold">-{testAnalysisMetrics.wrong * 1} Marks</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {testAnalysisMetrics.wrongLogs.map(l => (
                      <button
                        key={getLogKey(l)}
                        onClick={() => {
                          setShowAnalysisScreen(false);
                          switchQuestion(l);
                        }}
                        className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center shadow transition-all hover:scale-105"
                      >
                        {l.questionNumber}
                      </button>
                    ))}
                    {testAnalysisMetrics.wrongLogs.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2">Zero errors! Perfect run!</p>
                    )}
                  </div>
                </div>

                {/* Unattempted Questions Box */}
                <div className="p-5 rounded-2xl bg-surface border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase font-mono flex items-center gap-1.5">
                      <HelpCircle size={16} /> Unattempted ({testAnalysisMetrics.unattempted})
                    </span>
                    <span className="text-xs text-slate-500 font-mono">0 Marks</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {testAnalysisMetrics.unattemptedLogs.map(l => (
                      <button
                        key={getLogKey(l)}
                        onClick={() => {
                          setShowAnalysisScreen(false);
                          switchQuestion(l);
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shadow transition-all hover:scale-105"
                      >
                        {l.questionNumber}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Cognitive Panic & Pacing Debrief */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-lg">⚡</span>
                    <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                      Simulation Pacing & Cognitive Panic Debrief
                    </h4>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                    Smart Retrospective
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pacing Windows */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Best Efficiency Window
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        Min {testAnalysisMetrics.debrief.bestWindow.startMin} - {testAnalysisMetrics.debrief.bestWindow.endMin}
                      </span>
                      <span className="text-xs font-mono text-emerald-300 font-bold">
                        {testAnalysisMetrics.debrief.bestWindow.accuracy}% Acc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Peak cognitive flow state and calculation accuracy.</p>
                  </div>

                  {/* Time Sinks */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">
                        Time-Sink Traps ({testAnalysisMetrics.debrief.timeSinkQuestions.length} Qs)
                      </span>
                      {testAnalysisMetrics.debrief.timeSinkQuestions.length > 0 && (
                        <button
                          onClick={() => {
                            const firstSinkQ = testAnalysisMetrics.debrief.timeSinkQuestions[0];
                            const targetLog = subjectLogs.find(l => l.questionNumber === firstSinkQ);
                            if (targetLog) {
                              switchQuestion(targetLog);
                              setShowAnalysisScreen(false);
                            }
                          }}
                          className="px-2.5 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider transition-all"
                        >
                          ⚡ Drill Traps (Q{testAnalysisMetrics.debrief.timeSinkQuestions[0]})
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {testAnalysisMetrics.debrief.timeSinkQuestions.map(q => (
                        <span key={q} className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono text-xs font-bold border border-rose-800">
                          Q{q}
                        </span>
                      ))}
                      {testAnalysisMetrics.debrief.timeSinkQuestions.length === 0 && (
                        <span className="text-xs text-emerald-400">Zero time sinks! Great pacing discipline.</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">Questions taking &gt;160s that resulted in negative or zero marks.</p>
                  </div>

                  {/* Single Key Actionable Takeaway */}
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">
                      Tactical Coach Rule
                    </span>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      💡 {testAnalysisMetrics.debrief.keyTip}
                    </p>
                  </div>
                </div>
              </div>

              {/* Repeat Mistake & Mastery Delta Table */}
              <div className="bg-surface rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={18} /> Re-Attempt Progression & Mistake Resolution
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono">
                        <th className="pb-3 px-2">Q.#</th>
                        <th className="pb-3 px-2">Topic</th>
                        <th className="pb-3 px-2">Original Answer</th>
                        <th className="pb-3 px-2">Current Attempt</th>
                        <th className="pb-3 px-2">Official Key</th>
                        <th className="pb-3 px-2">Time Spent</th>
                        <th className="pb-3 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {subjectLogs.map(l => {
                        const qKey = getLogKey(l);
                        const state = sessionResponses[qKey];
                        const chosenOpt = normalizedOptions[state?.selectedOptionIdx ?? -1];
                        const currentAnswer = isNumericalLog(l) ? (state?.numericalInput || '--') : (chosenOpt ? chosenOpt.identifier : '--');
                        const isCorrectNow = state?.isCorrect;
                        const originalAnswer = l.answered || 'Unattempted';

                        return (
                          <tr key={qKey} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-2 font-bold text-white">Q.{l.questionNumber}</td>
                            <td className="py-3 px-2 text-slate-300 font-sans">{l.topic || l.chapter || 'General'}</td>
                            <td className="py-3 px-2 text-rose-300">{originalAnswer}</td>
                            <td className="py-3 px-2 font-bold text-cyan-300">{currentAnswer}</td>
                            <td className="py-3 px-2 font-bold text-emerald-400">{l.finalKey || l.correctOptions?.join(', ')}</td>
                            <td className="py-3 px-2 text-slate-400">{state?.timeSpent || 0}s</td>
                            <td className="py-3 px-2 text-right">
                              {currentAnswer === '--' ? (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Skipped</span>
                              ) : isCorrectNow ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
                                  ✓ Mastered (+4)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 text-[10px] font-bold">
                                  ✗ Mistake (-1)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-surface border-t border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowAnalysisScreen(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                Back to Questions Preview
              </button>
              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
              >
                Done & Close Test
              </button>
            </div>
          </div>
        ) : layoutMode === 'nta' ? (
          /* ========================================================================= */
          /* MODE 1: OFFICIAL NTA CBT EXAM INTERFACE                                  */
          /* ========================================================================= */
          <div className="flex flex-col h-full bg-surface-base text-slate-100 font-sans select-none overflow-hidden">
            
            {/* Top NTA Header Bar */}
            <div className="bg-surface border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded bg-blue-600 font-mono font-bold text-xs uppercase tracking-wider text-white shadow">
                  NTA CBT
                </span>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  Test: {log.testId}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 bg-surface-2 px-3 py-1 rounded-md border border-slate-700">
                  <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-cyan-300 font-bold">Elapsed : {formatTimer(elapsedSeconds)}</span>
                </div>

                <button 
                  onClick={() => setLayoutMode('examgoal')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-bold transition-all shadow"
                  title="Switch to Modern ExamGOAL UI"
                >
                  <LayoutGrid size={14} /> Switch to ExamGOAL UI
                </button>

                <button 
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sub-header: Subject Sections & Marking Scheme */}
            <div className="bg-surface border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">SECTIONS:</span>
                <button 
                  onClick={() => handleSectionChange('A')}
                  className={`px-3 py-1 rounded font-bold transition-all ${activeSection === 'A' ? 'bg-blue-600 text-white shadow-md' : 'bg-surface-2 text-slate-300 hover:bg-surface-3'}`}
                >
                  SECTION A <span className="text-xs opacity-75 font-mono">({sectionALogs.length})</span>
                </button>
                {sectionBLogs.length > 0 && (
                  <button 
                    onClick={() => handleSectionChange('B')}
                    className={`px-3 py-1 rounded font-bold transition-all ${activeSection === 'B' ? 'bg-blue-600 text-white shadow-md' : 'bg-surface-2 text-slate-300 hover:bg-surface-3'}`}
                  >
                    SECTION B <span className="text-xs opacity-75 font-mono">({sectionBLogs.length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-slate-400 text-xs font-mono">
                <span>Candidate: <strong className="text-white">Jahnavi Gaddam</strong></span>
              </div>
            </div>

            {/* Question Info Bar */}
            <div className="bg-surface-base border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
              <div className="flex items-center gap-3">
                <span>Question Type: <strong className="text-cyan-300">{isNumericalQuestion ? 'Numerical (Section B)' : 'MCQ Single Answer'}</strong></span>
                <span>Marks for correct answer: <strong className="text-emerald-400">+{log.positiveMarks || 4}</strong></span>
                <span>Negative Marks: <strong className="text-rose-400">-{Math.abs(log.negativeMarks || 1)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">View In:</span>
                <span className="text-white font-bold bg-surface-2 px-2 py-0.5 rounded border border-slate-700">English</span>
              </div>
            </div>

            {/* Center Body: Question Panel + Right Palette */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Question & Options Area */}
              <div className="flex-1 flex flex-col justify-between p-5 overflow-y-auto custom-scrollbar bg-surface-base">
                <div className="space-y-4 max-w-4xl">
                  
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                      Question No. {displayQuestionNumber}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono uppercase">
                        {log.subject} • {log.chapter || log.topic || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Question HTML with KaTeX */}
                  <div className="text-slate-100 text-sm sm:text-base leading-relaxed py-2">
                    {log.questionHtml ? (
                      <div 
                        className="prose prose-invert prose-cyan max-w-none leading-relaxed overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: formattedQuestionHtml }}
                      />
                    ) : (
                      <p className="text-sm text-slate-300 font-mono">
                        Question #{displayQuestionNumber} ({log.subject.toUpperCase()}) -- {log.topic || 'N/A'}
                      </p>
                    )}
                  </div>

                  {/* Options List / Numerical Entry */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isNumericalQuestion ? 'Numerical Answer' : 'Which of the following is the correct matching?'}
                    </h4>

                    {isNumericalQuestion ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          disabled={hasSubmitted && isTestSubmitted}
                          value={numericalInput}
                          onChange={e => handleNumericalChange(e.target.value)}
                          placeholder="e.g. 24 or 3.14"
                          className="w-56 bg-surface border border-blue-500/50 rounded-xl p-3 text-base text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {normalizedOptions.map((opt, idx) => {
                          const isSelected = selectedOptionIdx === idx;
                          const isCorrectOpt = log.correctOptions?.includes(opt.identifier);
                          const formattedOptHtml = formatMathHtml(opt.content);
                          const showEvaluation = hasSubmitted || isTestSubmitted;

                          let borderStyle = 'border-slate-800 bg-surface text-slate-200 hover:border-slate-600';
                          if (showEvaluation) {
                            if (isCorrectOpt) borderStyle = 'border-emerald-500 bg-emerald-950/70 text-emerald-200 font-bold';
                            else if (isSelected && !isCorrectOpt) borderStyle = 'border-rose-500 bg-rose-950/70 text-rose-200 font-bold';
                          } else if (isSelected) {
                            borderStyle = 'border-blue-500 bg-blue-950/70 text-blue-200 font-bold shadow-lg shadow-blue-500/10';
                          }

                          return (
                            <div 
                              key={opt.identifier}
                              onClick={() => handleSelectOption(idx)}
                              className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${borderStyle}`}
                            >
                              <div className="pt-0.5">
                                <input 
                                  type="radio" 
                                  readOnly 
                                  checked={isSelected}
                                  name={`nta-opt-${log.questionNumber}`}
                                  className="w-4 h-4 text-blue-600 border-slate-700 focus:ring-blue-500"
                                />
                              </div>
                              <span className="font-mono font-bold text-xs text-blue-400 shrink-0">
                                ({opt.identifier})
                              </span>
                              <div 
                                className="flex-1 prose prose-invert prose-cyan text-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: formattedOptHtml }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Submission Feedback & Solution View */}
                  {(hasSubmitted || isTestSubmitted) && (
                    <div className="space-y-4 pt-4 border-t border-slate-800 animate-fade-in">
                      <div className={`p-4 rounded-xl border flex items-center justify-between ${
                        isCorrect ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          {isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />}
                          <div>
                            <p className="text-sm font-bold font-mono">
                              {isCorrect ? '🎯 CORRECT ANSWER! Registered on NTA server.' : '❌ INCORRECT ANSWER.'}
                            </p>
                            <p className="text-xs opacity-90 mt-0.5 font-mono">
                              Official Answer Key: <span className="font-bold underline text-white">{log.finalKey || log.correctOptions?.join(', ')}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveFlashcard}
                          disabled={flashcardSaved}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-bold text-cyan-300 transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          {flashcardSaved ? 'Saved ✓' : 'Add Flashcard'}
                        </button>
                      </div>

                      {showExplanation && formattedExplanationHtml && (
                        <div className="bg-surface p-5 rounded-xl border border-emerald-500/40 space-y-3">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Award className="w-4 h-4" /> NTA Official Step-by-step Solution
                          </h4>
                          <div 
                            className="text-xs sm:text-sm text-slate-200 prose prose-invert prose-cyan max-w-none leading-relaxed overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: formattedExplanationHtml }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Bottom NTA Action Bar */}
                <div className="pt-6 mt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-surface-base shrink-0">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={handleMarkForReviewAndNext}
                      className="px-3.5 py-2 rounded bg-surface-2 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Mark for Review & Next
                    </button>
                    <button 
                      type="button"
                      onClick={handleClearResponse}
                      className="px-3.5 py-2 rounded bg-surface-2 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Clear Response
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={handlePreviousQuestion}
                      disabled={currentLogIndex === 0}
                      className="px-4 py-2 rounded bg-surface-2 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                      Previous
                    </button>

                    {!hasSubmitted && !isTestSubmitted && (
                      <button 
                        type="button"
                        onClick={handleCheckAnswer}
                        disabled={!isNumericalQuestion && selectedOptionIdx === null && numericalInput.trim() === ''}
                        className="px-4 py-2 rounded bg-cyan-950 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                      >
                        Check Answer
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={!isNumericalQuestion && selectedOptionIdx === null && numericalInput.trim() === ''}
                      className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:opacity-40 transition-all"
                    >
                      Save & Next
                    </button>
                  </div>
                </div>

              </div>

              {/* Right NTA Question Palette Panel */}
              <div className="w-80 bg-surface-2 border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0">
                <div className="space-y-5">
                  
                  {/* Candidate Profile Box */}
                  <div className="flex items-center gap-3 p-3 bg-surface-base rounded-xl border border-slate-700/80">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center text-xl font-bold text-cyan-400 overflow-hidden shrink-0">
                      👤
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Jahnavi Gaddam</h4>
                      <p className="text-xs text-slate-400 font-mono">Roll: 2026-JEE-882</p>
                    </div>
                  </div>

                  {/* NTA Status Legend Grid */}
                  <div className="bg-surface p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-medium text-slate-300">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-emerald-600 text-white rounded text-xs font-bold flex items-center justify-center">{answeredCount}</span>
                        <span>Answered</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-orange-600 text-white rounded text-xs font-bold flex items-center justify-center">{notAnsweredCount}</span>
                        <span>Not Answered</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-slate-700 text-slate-200 rounded text-xs font-bold flex items-center justify-center">{notVisitedCount}</span>
                        <span>Not Visited</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-600 text-white rounded-full text-xs font-bold flex items-center justify-center">{markedCount}</span>
                        <span>Marked Review</span>
                      </div>
                    </div>
                  </div>

                  {/* Question Grid Section */}
                  <div>
                    <div className="flex items-center justify-between bg-surface-base px-3 py-1.5 rounded mb-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        SECTION {activeSection} : Questions
                      </h4>
                      {sectionBLogs.length > 0 && (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleSectionChange('A')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeSection === 'A' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                          >
                            Sec A
                          </button>
                          <button 
                            onClick={() => handleSectionChange('B')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeSection === 'B' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                          >
                            Sec B
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2.5">
                      {currentSectionLogs.map((l) => {
                        const lKey = getLogKey(l);
                        const isCurrent = lKey === currentKey;
                        const state = sessionResponses[lKey];
                        const status = state?.status || 'not_visited';
                        const hasSubmittedState = state?.hasSubmitted || isTestSubmitted;

                        let colorCls = 'bg-slate-700/80 hover:bg-slate-600 text-slate-200';
                        if (hasSubmittedState) {
                          if (state?.isCorrect) colorCls = 'bg-emerald-600 text-white';
                          else if (state?.selectedOptionIdx !== null || (state?.numericalInput && state.numericalInput.trim() !== '')) colorCls = 'bg-rose-600 text-white';
                        } else if (status === 'answered') {
                          colorCls = 'bg-emerald-600 text-white';
                        } else if (status === 'answered_marked') {
                          colorCls = 'bg-purple-600 text-white ring-2 ring-emerald-400';
                        } else if (status === 'marked') {
                          colorCls = 'bg-purple-600 text-white';
                        } else if (status === 'visited') {
                          colorCls = 'bg-orange-600 text-white';
                        }

                        return (
                          <button
                            key={lKey}
                            onClick={() => switchQuestion(l)}
                            className={`h-9 font-mono font-bold text-xs rounded transition-all flex items-center justify-center ${colorCls} ${
                              isCurrent ? 'ring-4 ring-blue-400 scale-105 shadow-lg' : ''
                            }`}
                          >
                            {l.questionNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <button 
                    onClick={handleSubmitFullTest}
                    className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all"
                  >
                    Submit Test
                  </button>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* MODE 2: CLEAN & MODERN EXAMGOAL INTERFACE                                */
          /* ========================================================================= */
          <div className="flex flex-col h-full bg-surface-base text-slate-100 font-sans select-none overflow-hidden">
            
            {/* Top ExamGOAL Header */}
            <div className="bg-surface border-b border-slate-800 px-5 py-3 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-extrabold flex items-center justify-center text-sm shadow">
                  ⚡
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2 font-mono">
                    ExamGOAL 100% Diagnostic Suite
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {log.testId} • Question #{displayQuestionNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <div className="flex items-center gap-2 bg-surface-base px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">Elapsed: {formatTimer(elapsedSeconds)}</span>
                </div>

                <button 
                  onClick={() => setLayoutMode('nta')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300 hover:bg-blue-900 text-xs font-bold transition-all shadow"
                  title="Switch to NTA CBT Exam Screen"
                >
                  <Monitor size={14} /> Switch to NTA CBT UI
                </button>

                <button 
                  onClick={handleSubmitFullTest}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all"
                >
                  Submit Test
                </button>

                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Interactive Question Strip (Matching Image 5) */}
            <div className="bg-surface-base border-b border-slate-800/80 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 shrink-0 mr-1 flex items-center gap-1">
                  <Award size={14} /> Questions:
                </span>
                
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentLogIndex === 0}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="flex items-center gap-1.5">
                  {subjectLogs.map(l => {
                    const lKey = getLogKey(l);
                    const isCurrent = lKey === currentKey;
                    const state = sessionResponses[lKey];
                    const status = state?.status || 'not_visited';
                    const hasSubmittedState = state?.hasSubmitted || isTestSubmitted;

                    let bgCls = 'bg-slate-800 hover:bg-slate-700 text-slate-300';
                    if (hasSubmittedState) {
                      if (state?.isCorrect) bgCls = 'bg-emerald-600 text-white';
                      else if (state?.selectedOptionIdx !== null || (state?.numericalInput && state.numericalInput.trim() !== '')) bgCls = 'bg-rose-600 text-white';
                    } else if (status === 'answered') {
                      bgCls = 'bg-emerald-600 text-white';
                    } else if (status === 'marked' || status === 'answered_marked') {
                      bgCls = 'bg-purple-600 text-white';
                    } else if (status === 'visited') {
                      bgCls = 'bg-orange-600 text-white';
                    }

                    return (
                      <button
                        key={lKey}
                        onClick={() => switchQuestion(l)}
                        className={`h-7 min-w-[28px] px-2 rounded-lg font-mono font-bold text-xs transition-all flex items-center justify-center shrink-0 ${bgCls} ${
                          isCurrent ? 'ring-2 ring-cyan-400 scale-110 shadow-lg' : ''
                        }`}
                      >
                        {l.questionNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextQuestion}
                  disabled={currentLogIndex === subjectLogs.length - 1}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Peer Telemetry Flags */}
              <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                {log.globalCorrectPct !== undefined && (
                  <span className="text-slate-400">
                    Peer Ease: <strong className="text-cyan-300 font-bold">{log.globalCorrectPct}%</strong>
                  </span>
                )}
                {log.isCarelessError && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> Careless Leak
                  </span>
                )}
                {log.isTimeSink && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1">
                    <Clock size={12} /> Time Sink
                  </span>
                )}
              </div>
            </div>

            {/* Main Interactive Question Workspace + Right Sidebar */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Question & Options Area */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between bg-surface-base">
                <div className="space-y-6 max-w-4xl mx-auto w-full">
                  
                  {/* Problem Statement Card */}
                  <div className="bg-surface p-6 rounded-3xl border border-slate-800/80 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
                        Problem Statement (Q.{displayQuestionNumber})
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {log.questionType || 'Single Correct'} • (+{log.positiveMarks || 4}, -{Math.abs(log.negativeMarks || 1)})
                      </span>
                    </div>

                    {/* Question HTML with KaTeX */}
                    {log.questionHtml ? (
                      <div 
                        className="text-sm sm:text-base text-slate-100 prose prose-invert prose-cyan max-w-none leading-relaxed overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: formattedQuestionHtml }}
                      />
                    ) : (
                      <p className="text-sm text-slate-300 font-mono">
                        Question #{displayQuestionNumber} ({log.subject.toUpperCase()}) -- {log.topic || 'N/A'}
                      </p>
                    )}
                  </div>

                  {/* 2x2 Option Cards Grid with Peer Distribution (Matching Image 5) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isNumericalQuestion ? 'Enter Response' : 'Choose the correct answer from the options given below:'}
                    </h4>

                    {isNumericalQuestion ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          disabled={hasSubmitted && isTestSubmitted}
                          value={numericalInput}
                          onChange={e => handleNumericalChange(e.target.value)}
                          placeholder="e.g. 24 or 3.14"
                          className="w-64 bg-surface border border-cyan-500/50 rounded-2xl p-4 text-base text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {normalizedOptions.map((opt, idx) => {
                          const isSelected = selectedOptionIdx === idx;
                          const isCorrectOpt = log.correctOptions?.includes(opt.identifier);
                          const formattedOptHtml = formatMathHtml(opt.content);
                          const peerPct = getPeerDistribution(opt.identifier, idx);
                          const showEvaluation = hasSubmitted || isTestSubmitted;

                          let cardStyle = 'bg-surface border-slate-800 hover:border-cyan-500/50 text-slate-200';
                          if (showEvaluation) {
                            if (isCorrectOpt) {
                              cardStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 font-bold shadow-lg shadow-emerald-500/10';
                            } else if (isSelected && !isCorrectOpt) {
                              cardStyle = 'bg-rose-950/70 border-rose-500 text-rose-100 font-bold shadow-lg shadow-rose-500/10';
                            }
                          } else if (isSelected) {
                            cardStyle = 'bg-blue-950/80 border-blue-500 text-blue-100 font-bold ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10';
                          }

                          return (
                            <div
                              key={opt.identifier}
                              onClick={() => handleSelectOption(idx)}
                              className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer min-h-[90px] ${cardStyle}`}
                            >
                              {/* Top Banner Tag when Evaluated (Matching Image 5) */}
                              {showEvaluation && (
                                <div className="absolute -top-3 right-4">
                                  {isCorrectOpt && isSelected && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wide shadow">
                                      Your answer | Correct answer
                                    </span>
                                  )}
                                  {isCorrectOpt && !isSelected && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow">
                                      Correct answer
                                    </span>
                                  )}
                                  {!isCorrectOpt && isSelected && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow">
                                      Your answer
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Option Body */}
                              <div className="flex items-start gap-3">
                                <span className={`w-8 h-8 rounded-full font-bold font-mono text-xs flex items-center justify-center shrink-0 transition-transform ${
                                  isSelected ? 'bg-blue-600 text-white scale-110 shadow-md' : 'bg-slate-800 text-blue-400 border border-slate-700'
                                }`}>
                                  {opt.identifier}
                                </span>
                                <div 
                                  className="flex-1 prose prose-invert prose-cyan text-xs sm:text-sm max-w-none pt-1 overflow-x-auto"
                                  dangerouslySetInnerHTML={{ __html: formattedOptHtml }}
                                />
                              </div>

                              {/* Bottom Right Peer Distribution Badge (Matching Image 5) */}
                              <div className="flex justify-end mt-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                  showEvaluation && isCorrectOpt 
                                    ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400'
                                }`}>
                                  {peerPct}% users
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Submission Feedback Banner & TeX Explanation */}
                  {(hasSubmitted || isTestSubmitted) && (
                    <div className="space-y-4 pt-4 border-t border-slate-800/80 animate-fade-in">
                      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                        isCorrect ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          {isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />}
                          <div>
                            <p className="text-sm font-bold font-mono">
                              {isCorrect ? '🎯 PERFECT ANSWER!' : '❌ INCORRECT ANSWER.'}
                            </p>
                            <p className="text-xs opacity-90 mt-0.5 font-mono">
                              Answer Key: <span className="font-bold underline text-white">{log.finalKey || log.correctOptions?.join(', ')}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveFlashcard}
                          disabled={flashcardSaved}
                          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-bold text-cyan-300 transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          {flashcardSaved ? 'Saved to Flashcards ✓' : '⚡ Convert to Flashcard'}
                        </button>
                      </div>

                      {showExplanation && formattedExplanationHtml && (
                        <div className="bg-surface p-6 rounded-3xl border border-emerald-500/40 space-y-3 shadow-xl">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Award className="w-4 h-4" /> Step-by-Step Official TeX Solution
                          </h4>
                          <div 
                            className="text-xs sm:text-sm text-slate-200 prose prose-invert prose-cyan max-w-none leading-relaxed overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: formattedExplanationHtml }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Bottom ExamGOAL Action Bar */}
                <div className="pt-6 mt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shrink-0 max-w-4xl mx-auto w-full">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={handleMarkForReviewAndNext}
                      className="px-4 py-2.5 rounded-xl bg-surface-2 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-950/40 transition-colors"
                    >
                      Mark for Review
                    </button>
                    <button 
                      type="button"
                      onClick={handleClearResponse}
                      className="px-4 py-2.5 rounded-xl bg-surface-2 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Clear Response
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={handlePreviousQuestion}
                      disabled={currentLogIndex === 0}
                      className="px-5 py-2.5 rounded-xl bg-surface-2 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                      Previous
                    </button>

                    {!hasSubmitted && !isTestSubmitted && (
                      <button 
                        type="button"
                        onClick={handleCheckAnswer}
                        disabled={!isNumericalQuestion && selectedOptionIdx === null && numericalInput.trim() === ''}
                        className="px-5 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                      >
                        Check Answer
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={!isNumericalQuestion && selectedOptionIdx === null && numericalInput.trim() === ''}
                      className="px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-extrabold text-xs text-slate-950 uppercase tracking-wider shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all active:scale-95"
                    >
                      Save & Next
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Modern ExamGOAL Palette Sidebar */}
              <div className="w-80 bg-surface-base border-l border-slate-800/80 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0">
                <div className="space-y-6">
                  
                  {/* Status Legend Pills */}
                  <div className="space-y-2 text-xs font-semibold text-slate-300">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Status</h4>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Attempted ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-emerald-500 inline-block"></span>
                      <span>Attempted & Marked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
                      <span>Marked ({markedCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
                      <span>Seen / Not Answered ({notAnsweredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-slate-700 inline-block"></span>
                      <span>Not Visited ({notVisitedCount})</span>
                    </div>
                  </div>

                  {/* Section Question Grid */}
                  <div>
                    <div className="flex items-center justify-between bg-surface px-3.5 py-2 rounded-xl border border-slate-800 mb-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        SECTION {activeSection}
                      </h4>
                      {sectionBLogs.length > 0 && (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleSectionChange('A')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${activeSection === 'A' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'}`}
                          >
                            Sec A
                          </button>
                          <button 
                            onClick={() => handleSectionChange('B')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${activeSection === 'B' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'}`}
                          >
                            Sec B
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2.5">
                      {currentSectionLogs.map((l) => {
                        const lKey = getLogKey(l);
                        const isCurrent = lKey === currentKey;
                        const state = sessionResponses[lKey];
                        const status = state?.status || 'not_visited';
                        const hasSubmittedState = state?.hasSubmitted || isTestSubmitted;

                        let colorCls = 'bg-slate-800 hover:bg-slate-700 text-slate-300';
                        if (hasSubmittedState) {
                          if (state?.isCorrect) colorCls = 'bg-emerald-600 text-white';
                          else if (state?.selectedOptionIdx !== null || (state?.numericalInput && state.numericalInput.trim() !== '')) colorCls = 'bg-rose-600 text-white';
                        } else if (status === 'answered') {
                          colorCls = 'bg-emerald-600 text-white';
                        } else if (status === 'answered_marked') {
                          colorCls = 'bg-purple-600 text-white ring-2 ring-emerald-400';
                        } else if (status === 'marked') {
                          colorCls = 'bg-purple-600 text-white';
                        } else if (status === 'visited') {
                          colorCls = 'bg-orange-600 text-white';
                        }

                        return (
                          <button
                            key={lKey}
                            onClick={() => switchQuestion(l)}
                            className={`h-10 rounded-full font-mono font-bold text-xs transition-all flex items-center justify-center shadow ${colorCls} ${
                              isCurrent ? 'ring-4 ring-blue-500/80 scale-105 shadow-lg' : ''
                            }`}
                          >
                            {l.questionNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <button 
                    onClick={handleSubmitFullTest}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Submit Test
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* In-Session Cognitive Panic Alert Toast */}
        {panicAlert && !showAnalysisScreen && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 p-4 max-w-lg rounded-2xl bg-amber-950/90 border border-amber-500/80 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <span className="text-xl">🧘</span>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                {panicAlert.severity === 'critical' ? '🚨 Critical Time Check' : '⚠️ Cognitive Breath Alert'}
              </span>
              <p className="text-xs text-amber-100 font-medium">{panicAlert.message}</p>
            </div>
            <button 
              onClick={() => setPanicAlert(null)}
              className="text-amber-400 hover:text-white p-1 rounded-lg hover:bg-amber-900/60"
            >
              <X size={16} />
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};