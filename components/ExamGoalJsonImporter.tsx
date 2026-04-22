import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, Zap, AlertTriangle, Clock, CheckCircle2, Award, ShieldAlert, Sparkles, Laptop, RefreshCw, FileCode, ArrowRight, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuestionLog, TestReport, SubjectData, DifficultyLevel } from '../types';
import { QuestionStatus } from '../types';

const GUIDE_CONTENT = `
### 🕵️‍♂️ The ExamGOAL "Hacker" Guide: Extracting Test Data

**Phase 1: Open the Trap**
1. Log in to ExamGOAL on your laptop (Chrome or Edge).
2. Go to the **Result / Analysis Page** of the test you just finished.
3. Press **\`F12\`** on your keyboard (This opens the Developer Tools panel on the right).
4. At the top of that new panel, click the **Network** tab.
5. Just below that, click the filter button that says **\`Fetch/XHR\`** (This hides all the images and only shows the pure database files).

**Phase 2: Catch the Data**
1. With the Network panel open, press **\`F5\`** to refresh the page. 
2. Watch the list fill up with files. You are looking for exactly two files.

**Phase 3: Download Target 1 (The Question Database)**
1. Look at the "Name" column in the list. Find the file that starts with the word **\`batch\`** (e.g., \`batch?user_stats=true...\`).
2. **Right-click** on that file name $\rightarrow$ **Copy** $\rightarrow$ **Copy Response**.
3. Save it to your computer as **\`batch.json\`**.

**Phase 4: Download Target 2 (Your Personal Test Data)**
1. Look for a file name that is a long, random string of numbers and letters (e.g., \`72957d76-217f...\` or \`f3047962...\`).
2. **Right-click** $\rightarrow$ **Copy** $\rightarrow$ **Copy Response**.
3. Save it to your computer as **\`attempt.json\`**.

**Phase 5: 100% Telemetry Ingestion**
1. Upload \`attempt.json\` and \`batch.json\` below.
2. Click **Ingest Full Telemetry** to extract global peer benchmarks, time sinks, careless leaks, and 100% offline solutions!
`;

interface ExamGoalJsonImporterProps {
  onImportedData: (data: { report: TestReport; logs: QuestionLog[] }) => void;
}

interface TelemetrySummary {
  totalLoaded: number;
  carelessLeaks: number;
  timeSinks: number;
  distractorTraps: number;
  accuracyPct: number;
  userScore: number;
  peerAvgScore: number;
  estimatedRank: number;
  estimatedPercentile: number;
  physicsRank: number;
  chemistryRank: number;
  mathsRank: number;
}

export const ExamGoalJsonImporter: React.FC<ExamGoalJsonImporterProps> = ({ onImportedData }) => {
  const [attemptFile, setAttemptFile] = useState<File | null>(null);
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);

  const attemptInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const formatString = (str: string) => {
    if (!str || str === 'Unknown') return 'N/A';
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleImport = async () => {
    if (!attemptFile || !batchFile) {
      setError("Please select both attempt.json and batch.json files.");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const attemptData = await readFileAsJson(attemptFile);
      const batchData = await readFileAsJson(batchFile);

      if (!attemptData?.data?.userState || !batchData?.results) {
        throw new Error("Invalid file format. Please ensure you uploaded the correct attempt and batch JSON files.");
      }

      const userState = attemptData.data.userState;
      const results: any[] = batchData.results;
      
      const testId = attemptData.data.testId || `examgoal-${Date.now()}`;
      const testTitle = attemptData.data.title || batchData.results[0]?.paperTitle || "ExamGoal Imported Test";
      const testDate = attemptData.data.time || new Date().toISOString();

      const logs: QuestionLog[] = [];
      
      let physicsCorrect = 0, physicsWrong = 0, physicsUnanswered = 0, physicsMarks = 0, physicsMaxMarks = 0, physicsPeerExpected = 0;
      let chemistryCorrect = 0, chemistryWrong = 0, chemistryUnanswered = 0, chemistryMarks = 0, chemistryMaxMarks = 0, chemistryPeerExpected = 0;
      let mathsCorrect = 0, mathsWrong = 0, mathsUnanswered = 0, mathsMarks = 0, mathsMaxMarks = 0, mathsPeerExpected = 0;

      let carelessLeaksCount = 0;
      let timeSinksCount = 0;
      let distractorTrapsCount = 0;
      let totalAttemptedCount = 0;
      let totalCorrectCount = 0;

      results.forEach((batchQuestion: any) => {
        const questionId = batchQuestion.question_id;
        const stateData = userState[questionId] || {};

        // 1. Basic Status & User State
        const userStateMode: 'seen' | 'attempted' | 'unattempted' = 
          stateData.state === "attempted" || stateData.state === "attempted_marked"
            ? 'attempted'
            : stateData.state === "seen"
            ? 'seen'
            : 'unattempted';

        const isCorrect = stateData.isRight === true;
        let status = QuestionStatus.Unanswered;
        if (userStateMode === 'attempted') {
          status = isCorrect ? QuestionStatus.FullyCorrect : QuestionStatus.Wrong;
          totalAttemptedCount++;
          if (isCorrect) totalCorrectCount++;
        }

        // 2. Telemetry Times & Deltas
        const userTimeSpent = stateData.timeSpent || 0; // ms
        const peerStats = batchQuestion.user_stats || {};
        const globalAvgTime = peerStats.timeSpent || 0; // ms
        const globalCorrectPct = peerStats.correct || 0;
        const globalWrongPct = peerStats.wrong || 0;
        const optionsDist: Record<string, number> = peerStats.options || {};
        const timeDelta = userTimeSpent - globalAvgTime;

        // 3. Subject Mapping
        let subjectRaw = (batchQuestion.subject || "").toLowerCase();
        let subject: "physics" | "chemistry" | "maths" = "physics";
        if (subjectRaw.includes('physic')) subject = 'physics';
        else if (subjectRaw.includes('chemist')) subject = 'chemistry';
        else if (subjectRaw.includes('math')) subject = 'maths';

        // 4. Marking Scheme & Awarded Marks
        const positiveMarks = batchQuestion.marks || 4;
        const negativeMarks = batchQuestion.negMarks || 1;
        let marksAwarded = 0;

        if (stateData.marksAllotted !== undefined && stateData.negMarksAllotted !== undefined) {
          marksAwarded = isCorrect ? stateData.marksAllotted : (stateData.negMarksAllotted ? -stateData.negMarksAllotted : 0);
        } else {
          if (status === QuestionStatus.FullyCorrect) marksAwarded = positiveMarks;
          else if (status === QuestionStatus.Wrong) marksAwarded = -negativeMarks;
        }

        // 5. English Question Content & Solution TeX HTML
        const enQuestion = batchQuestion.question?.en || {};
        const questionHtml = enQuestion.content || "";
        const explanationHtml = enQuestion.explanation || "";
        const options = enQuestion.options || [];
        const correctOptions: string[] = enQuestion.correct_options || [];

        // 6. User Selection & Answers
        const selectedIndex: number[] = Array.isArray(stateData.selectedIndex) ? stateData.selectedIndex : [];
        const userInputValue: string | null = stateData.input !== undefined && stateData.input !== null ? String(stateData.input) : null;
        
        let answeredStr = undefined;
        if (selectedIndex.length > 0) {
          answeredStr = selectedIndex.map(idx => options[idx]?.identifier || String(idx + 1)).join(', ');
        } else if (userInputValue !== null && userInputValue !== '') {
          answeredStr = userInputValue;
        }

        const finalKeyStr = correctOptions.join(', ');

        // 7. Computed Telemetry Flags
        const isCarelessError = !isCorrect && userStateMode === 'attempted' && globalCorrectPct >= 70;
        if (isCarelessError) carelessLeaksCount++;

        const isTimeSink = userTimeSpent > 1.8 * globalAvgTime && userTimeSpent > 0 && globalAvgTime > 0;
        if (isTimeSink) timeSinksCount++;

        // Determine if distractor trap was hit
        let isDistractorTrap = false;
        if (!isCorrect && userStateMode === 'attempted' && selectedIndex.length > 0) {
          // Identify correct option index
          const correctIdxs = correctOptions.map(cOpt => options.findIndex((o: any) => o.identifier === cOpt)).filter(i => i >= 0);
          
          // Find option index in optionsDist with highest selection count outside correct options
          let maxWrongDistributorIdx = -1;
          let maxWrongCount = -1;
          
          Object.entries(optionsDist).forEach(([optIdxStr, count]) => {
            const optIdx = parseInt(optIdxStr, 10);
            if (!correctIdxs.includes(optIdx) && count > maxWrongCount) {
              maxWrongCount = count;
              maxWrongDistributorIdx = optIdx;
            }
          });

          if (maxWrongDistributorIdx >= 0 && selectedIndex.includes(maxWrongDistributorIdx)) {
            isDistractorTrap = true;
            distractorTrapsCount++;
          }
        }

        // Difficulty formatting
        const diffRaw = (batchQuestion.difficulty || 'medium').toLowerCase();
        const difficultyVal: DifficultyLevel = 
          diffRaw === 'easy' ? 'Easy' : diffRaw === 'hard' ? 'Hard' : 'Medium';

        // Question Type string
        let questionType = batchQuestion.type || "mcq";
        const lowerType = String(questionType).toLowerCase();
        if (lowerType === 'mcq') {
          questionType = `Single Correct (+${positiveMarks}, -${negativeMarks})`;
        } else if (lowerType === 'integer' || lowerType === 'numerical') {
          questionType = `Integer (+${positiveMarks}, -${negativeMarks})`;
        }

        // 8. Push Enriched Telemetry Question Log
        logs.push({
          testId,
          subject,
          questionNumber: (stateData.position !== undefined ? stateData.position : logs.length) + 1,
          questionType,
          status,
          marksAwarded,
          chapter: formatString(batchQuestion.chapter || ""),
          chapterGroup: formatString(batchQuestion.chapterGroup || ""),
          topic: formatString(batchQuestion.topic || ""),
          timeSpent: Math.round(userTimeSpent / 1000), // In seconds for legacy UI
          positiveMarks,
          negativeMarks,
          reasonForError: isCarelessError ? "Silly Mistake" : isTimeSink ? "Time Pressure" : isDistractorTrap ? "Conceptual Gap" : status === QuestionStatus.Wrong ? "Misread Question" : undefined,
          answered: answeredStr,
          finalKey: finalKeyStr,

          // Full Telemetry Data
          questionId,
          questionHtml,
          explanationHtml,
          optionsHtml: options,
          options,
          correctOptions,
          difficulty: difficultyVal,
          tags: batchQuestion.tags || [],
          timeAllotted: batchQuestion.timeAllotted,

          // Peer Benchmarks
          globalAvgTime,
          globalCorrectPct,
          globalWrongPct,
          optionsDistribution: optionsDist,
          peerCorrectPercent: globalCorrectPct,
          peerWrongPercent: globalWrongPct,
          peerTimeSpent: Math.round(globalAvgTime / 1000),

          // User Telemetry
          userTimeSpent,
          userState: userStateMode,
          // Computed Flags
          timeDelta,
          isCarelessError,
          isTimeSink,
          isDistractorTrap
        });

        // Accumulate expected peer marks per subject
        const qPeerExpectedMarks = (positiveMarks * (globalCorrectPct / 100)) - (negativeMarks * (globalWrongPct / 100));

        // Update subject summaries
        if (subject === 'physics') {
          if (status === QuestionStatus.FullyCorrect) physicsCorrect++;
          else if (status === QuestionStatus.Wrong) physicsWrong++;
          else physicsUnanswered++;
          physicsMarks += marksAwarded;
          physicsMaxMarks += positiveMarks;
          physicsPeerExpected += qPeerExpectedMarks;
        } else if (subject === 'chemistry') {
          if (status === QuestionStatus.FullyCorrect) chemistryCorrect++;
          else if (status === QuestionStatus.Wrong) chemistryWrong++;
          else chemistryUnanswered++;
          chemistryMarks += marksAwarded;
          chemistryMaxMarks += positiveMarks;
          chemistryPeerExpected += qPeerExpectedMarks;
        } else if (subject === 'maths') {
          if (status === QuestionStatus.FullyCorrect) mathsCorrect++;
          else if (status === QuestionStatus.Wrong) mathsWrong++;
          else mathsUnanswered++;
          mathsMarks += marksAwarded;
          mathsMaxMarks += positiveMarks;
          mathsPeerExpected += qPeerExpectedMarks;
        }
      });

      logs.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

      // Rank & Percentile Estimation Function
      const estimateRankAndPercentile = (userMarks: number, peerAvg: number, maxScore: number) => {
        if (maxScore <= 0) return { rank: 1, percentile: 50 };
        const diff = userMarks - peerAvg;
        const spread = Math.max(10, maxScore * 0.25);
        const z = diff / spread;
        let percentile = 100 / (1 + Math.exp(-z * 1.6));
        percentile = Math.min(99.99, Math.max(1, Math.round(percentile * 100) / 100));
        const totalCandidates = 50000; // ExamGOAL Active Peer Batch Pool Standard (50k Test-takers)
        const rank = Math.max(1, Math.round(((100 - percentile) / 100) * totalCandidates));
        return { rank, percentile };
      };

      const physPeer = estimateRankAndPercentile(physicsMarks, physicsPeerExpected, physicsMaxMarks || 100);
      const chemPeer = estimateRankAndPercentile(chemistryMarks, chemistryPeerExpected, chemistryMaxMarks || 100);
      const mathPeer = estimateRankAndPercentile(mathsMarks, mathsPeerExpected, mathsMaxMarks || 100);

      const totalMarks = physicsMarks + chemistryMarks + mathsMarks;
      const totalMaxMarks = (physicsMaxMarks + chemistryMaxMarks + mathsMaxMarks) || 300;
      const totalPeerExpected = physicsPeerExpected + chemistryPeerExpected + mathsPeerExpected;
      const totalPeer = estimateRankAndPercentile(totalMarks, totalPeerExpected, totalMaxMarks);

      const createSubjectData = (marks: number, correct: number, wrong: number, unanswered: number, rank: number, percentile: number, maxMarks: number): SubjectData => ({
        marks,
        correct,
        wrong,
        unanswered,
        rank,
        percentile,
        partial: 0,
        maxMarks
      });

      const report: TestReport = {
        id: testId,
        testDate,
        testName: testTitle,
        physics: createSubjectData(physicsMarks, physicsCorrect, physicsWrong, physicsUnanswered, physPeer.rank, physPeer.percentile, physicsMaxMarks || 100),
        chemistry: createSubjectData(chemistryMarks, chemistryCorrect, chemistryWrong, chemistryUnanswered, chemPeer.rank, chemPeer.percentile, chemistryMaxMarks || 100),
        maths: createSubjectData(mathsMarks, mathsCorrect, mathsWrong, mathsUnanswered, mathPeer.rank, mathPeer.percentile, mathsMaxMarks || 100),
        total: createSubjectData(
          totalMarks,
          physicsCorrect + chemistryCorrect + mathsCorrect,
          physicsWrong + chemistryWrong + mathsWrong,
          physicsUnanswered + chemistryUnanswered + mathsUnanswered,
          totalPeer.rank,
          totalPeer.percentile,
          totalMaxMarks
        )
      };

      const computedAccuracy = totalAttemptedCount > 0 ? Math.round((totalCorrectCount / totalAttemptedCount) * 100) : 0;

      setTelemetry({
        totalLoaded: logs.length,
        carelessLeaks: carelessLeaksCount,
        timeSinks: timeSinksCount,
        distractorTraps: distractorTrapsCount,
        accuracyPct: computedAccuracy,
        userScore: Math.round(totalMarks * 100) / 100,
        peerAvgScore: Math.round(totalPeerExpected * 100) / 100,
        estimatedRank: totalPeer.rank,
        estimatedPercentile: totalPeer.percentile,
        physicsRank: physPeer.rank,
        chemistryRank: chemPeer.rank,
        mathsRank: mathPeer.rank
      });

      onImportedData({ report, logs });

    } catch (err: any) {
      setError(err.message || "An error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  const readFileAsJson = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          resolve(json);
        } catch (err) {
          reject(new Error(`Failed to parse ${file.name} as JSON.`));
        }
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
      reader.readAsText(file);
    });
  };

  return (
    <div className="p-6 glass-panel rounded-2xl border border-cyan-500/30 bg-slate-950/80 shadow-[0_0_30px_rgba(34,211,238,0.1)] mt-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ExamGoal 100% Telemetry Ingestion Engine
            </h2>
            <p className="text-xs text-slate-400">
              Extracts peer benchmarks, offline TeX solutions, time sinks & distractor traps
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowGuide(true)}
          className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-full transition-colors"
          title="How to extract attempt.json & batch.json?"
        >
          <Info size={20} />
        </button>
      </div>

      {/* Guide Modal - Rendered via Portal to document.body for true screen-center viewport positioning */}
      {showGuide && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-surface border border-cyan-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-500/10 text-slate-100 overflow-hidden font-sans"
            >
              {/* Modal Top Header */}
              <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-surface-base">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                    <Zap size={22} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                      ExamGOAL Telemetry Extraction Blueprint
                    </h3>
                    <p className="text-xs text-cyan-400 font-mono">100% Offline Peer Data, Solutions & Time-Sink Extraction Guide</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowGuide(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white border border-slate-700/60"
                  title="Close Guide"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: 5 Detailed Procedural Phases */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6 bg-surface-base">
                
                {/* Intro Alert Box */}
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3 text-xs text-cyan-200">
                  <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    This step-by-step procedure extracts your official ExamGOAL test attempt and answer keys directly from Chrome/Edge Developer Tools. No browser extension or API key required.
                  </p>
                </div>

                {/* Phase 1 Card */}
                <div className="p-5 rounded-2xl bg-surface-2 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      PHASE 1
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                      <Laptop size={14} className="text-slate-400" /> Desktop Browser (Chrome or Edge)
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Open Chrome/Edge Developer Tools
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300 leading-relaxed pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <span>Log in to <strong className="text-white">ExamGOAL</strong> on your laptop browser (Chrome or Edge).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <span>Navigate to the <strong className="text-white">Result / Detailed Analysis Page</strong> of your completed test.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <span>Press <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono font-bold text-[11px] shadow">F12</kbd> on your keyboard (or Right Click → Inspect).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                      <span>Click the <strong className="text-white">Network</strong> tab at the top of the DevTools panel.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">5</span>
                      <span>Click the <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 font-mono font-bold text-[11px] shadow">Fetch/XHR</kbd> filter button right below the tabs to hide image clutter.</span>
                    </li>
                  </ul>
                </div>

                {/* Phase 2 Card */}
                <div className="p-5 rounded-2xl bg-surface-2 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      PHASE 2
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                      <RefreshCw size={14} className="text-indigo-400" /> Refresh Page Traffic
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Catch Live Network Streams
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300 leading-relaxed pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <span>With DevTools still open, press <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-indigo-300 font-mono font-bold text-[11px] shadow">F5</kbd> to refresh the page.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <span>Watch the Network request list populate. You will extract exactly <strong>2 target JSON files</strong>.</span>
                    </li>
                  </ul>
                </div>

                {/* Phase 3 Card */}
                <div className="p-5 rounded-2xl bg-surface-2 border border-cyan-500/30 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      PHASE 3: TARGET 1
                    </span>
                    <span className="text-xs text-cyan-400 font-mono flex items-center gap-1.5">
                      <FileCode size={14} /> Save as: <code className="text-cyan-300 font-bold">batch.json</code>
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Download Target 1 -- Question & Solution Database (<code className="text-cyan-400 font-mono text-xs">batch.json</code>)
                  </h4>
                  <ol className="space-y-2 text-xs text-slate-300 leading-relaxed pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-cyan-500/30">1</span>
                      <span>In the DevTools "Name" column, locate the request starting with <code className="text-cyan-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">batch</code> (e.g. <code className="text-slate-400 font-mono">batch?user_stats=true...</code>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-cyan-500/30">2</span>
                      <span><strong>Right-click</strong> on that file name → <strong>Copy</strong> → <strong>Copy Response</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-cyan-500/30">3</span>
                      <span>Open Notepad, paste the response, and save it on your computer as <strong className="text-cyan-300 font-mono">batch.json</strong>.</span>
                    </li>
                  </ol>
                </div>

                {/* Phase 4 Card */}
                <div className="p-5 rounded-2xl bg-surface-2 border border-emerald-500/30 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      PHASE 4: TARGET 2
                    </span>
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                      <FileCode size={14} /> Save as: <code className="text-emerald-300 font-bold">attempt.json</code>
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Download Target 2 -- Personal Score & Telemetry (<code className="text-emerald-400 font-mono text-xs">attempt.json</code>)
                  </h4>
                  <ol className="space-y-2 text-xs text-slate-300 leading-relaxed pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-emerald-500/30">1</span>
                      <span>Look for a request named with a long random ID (e.g. <code className="text-emerald-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">72957d76-217f...</code> or <code className="text-emerald-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">f3047962...</code>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-emerald-500/30">2</span>
                      <span><strong>Right-click</strong> on that file name → <strong>Copy</strong> → <strong>Copy Response</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-emerald-500/30">3</span>
                      <span>Open Notepad, paste the response, and save it on your computer as <strong className="text-emerald-300 font-mono">attempt.json</strong>.</span>
                    </li>
                  </ol>
                </div>

                {/* Phase 5 Card */}
                <div className="p-5 rounded-2xl bg-surface-2 border border-amber-500/30 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      PHASE 5: INGESTION
                    </span>
                    <span className="text-xs text-amber-400 font-mono flex items-center gap-1.5">
                      <Sparkles size={14} /> Full Peer & Solution Analytics
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Upload & Process Telemetry
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Upload both <code className="text-emerald-400 font-mono">attempt.json</code> and <code className="text-cyan-400 font-mono">batch.json</code> into the importer card below, then click <strong className="text-white">Ingest Full Telemetry</strong> to automatically generate peer accuracy benchmarks, time-sink identification, careless mistake detection, and 100% offline step-by-step solutions!
                  </p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-800 bg-surface-base flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Client-Side Ingestion. Your data remains strictly local on your device.</span>
                </div>

                <button 
                  onClick={() => setShowGuide(false)}
                  className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 shrink-0"
                >
                  Understood! Start Upload <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* File Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">1. Attempt JSON (<code className="text-cyan-400">userState</code>)</label>
          <input
            type="file"
            accept=".json"
            ref={attemptInputRef}
            onChange={(e) => setAttemptFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-cyan-500/10 file:text-cyan-400
              hover:file:bg-cyan-500/20
              cursor-pointer border border-slate-800 rounded-xl p-2 bg-slate-950/60"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">2. Batch JSON (<code className="text-cyan-400">user_stats + TeX</code>)</label>
          <input
            type="file"
            accept=".json"
            ref={batchInputRef}
            onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-cyan-500/10 file:text-cyan-400
              hover:file:bg-cyan-500/20
              cursor-pointer border border-slate-800 rounded-xl p-2 bg-slate-950/60"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Telemetry Status Badge */}
      {telemetry && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Zap className="w-4 h-4 text-cyan-400" /> Ingestion Telemetry Summary
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              100% Offline Ready
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Loaded</p>
              <p className="text-lg font-black text-white font-mono">{telemetry.totalLoaded}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Careless
              </p>
              <p className="text-lg font-black text-amber-400 font-mono">{telemetry.carelessLeaks}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Time Sinks
              </p>
              <p className="text-lg font-black text-rose-400 font-mono">{telemetry.timeSinks}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <p className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Traps Hit
              </p>
              <p className="text-lg font-black text-purple-400 font-mono">{telemetry.distractorTraps}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2 md:col-span-1">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                <Award className="w-3 h-3" /> Accuracy
              </p>
              <p className="text-lg font-black text-emerald-400 font-mono">{telemetry.accuracyPct}%</p>
            </div>
          </div>

          {/* New Peer Rank & Score Benchmark Card */}
          <div className="p-4 rounded-xl bg-surface-2 border border-cyan-500/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Award className="w-4 h-4 text-cyan-400" /> Peer Benchmark & Rank Analytics
              </span>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                Est. AIR Rank & Peer Position
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Estimated AIR Rank</p>
                  <p className="text-xl font-black text-amber-400 font-mono">{telemetry.estimatedRank.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Percentile</p>
                  <p className="text-sm font-extrabold text-emerald-400 font-mono">{telemetry.estimatedPercentile}%</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">User Score vs Peer Avg</p>
                  <p className="text-base font-black text-white font-mono">{telemetry.userScore} <span className="text-xs text-slate-400 font-normal">vs {telemetry.peerAvgScore}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-cyan-400 uppercase font-semibold">Delta</p>
                  <p className={`text-sm font-extrabold font-mono ${telemetry.userScore >= telemetry.peerAvgScore ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {telemetry.userScore >= telemetry.peerAvgScore ? '+' : ''}{(telemetry.userScore - telemetry.peerAvgScore).toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Subject AIR Ranks</p>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Phy: <strong className="text-cyan-300">{telemetry.physicsRank.toLocaleString()}</strong></span>
                  <span className="text-slate-300">Chem: <strong className="text-emerald-300">{telemetry.chemistryRank.toLocaleString()}</strong></span>
                  <span className="text-slate-300">Math: <strong className="text-purple-300">{telemetry.mathsRank.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleImport}
        disabled={isImporting || !attemptFile || !batchFile}
        className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2
          ${isImporting || !attemptFile || !batchFile 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
            : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-[0_0_25px_rgba(34,211,238,0.25)] active:scale-98'}`}
      >
        {isImporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Merging & Ingesting Telemetry...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" /> Ingest Full Telemetry Data
          </>
        )}
      </button>
    </div>
  );
};
