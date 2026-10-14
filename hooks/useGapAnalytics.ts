import { useMemo } from 'react';
import type { QuestionLog } from '../types';
import { QuestionStatus } from '../types';

export type SubjectFilter = 'all' | 'physics' | 'chemistry' | 'maths';

export interface SlowestQuestion {
  questionId?: string;
  questionNumber: number;
  subject: 'physics' | 'chemistry' | 'maths';
  topic: string;
  chapter?: string;
  userTimeSec: number;
  peerTimeSec: number;
  deltaSec: number;
  status: QuestionStatus;
  marksAwarded: number;
  difficulty?: string;
  globalCorrectPct?: number;
  questionHtml?: string;
}

export interface CarelessLeakQuestion {
  questionId?: string;
  questionNumber: number;
  subject: 'physics' | 'chemistry' | 'maths';
  topic: string;
  userTimeSec: number;
  peerCorrectPct: number;
  marksLost: number;
  reasonForError?: string;
}

export interface DistractorTrapQuestion {
  questionId?: string;
  questionNumber: number;
  subject: 'physics' | 'chemistry' | 'maths';
  topic: string;
  userAnswer?: string;
  correctAnswer?: string;
  peerDistribution?: Record<string, number>;
}

export interface SubjectGapDelta {
  subject: 'physics' | 'chemistry' | 'maths';
  attempted: number;
  correct: number;
  wrong: number;
  unattempted: number;
  userAccuracy: number;
  topTierBenchmarkAccuracy: number;
  accuracyGap: number;
  marksScored: number;
  marksLostNegative: number;
  unattemptedEasyMarks: number;
  unattemptedMediumMarks: number;
  totalMarksOnTable: number;
}

export interface StrategicPriority {
  id: string;
  rank: number;
  title: string;
  category: 'careless' | 'time_sink' | 'distractor_trap' | 'unattempted_easy';
  subject: string;
  topic: string;
  impactScore: number;
  recommendation: string;
}

export interface GapAnalyticsResult {
  // 1. Time Liabilities
  timeLiabilities: {
    totalSecondsWasted: number;
    totalMinutesWasted: number;
    hesitationCount: number;
    slowestQuestions: SlowestQuestion[];
    avgUserTimeSec: number;
    avgPeerTimeSec: number;
  };

  // 2. Leak Breakdown
  leakBreakdown: {
    carelessLeaks: CarelessLeakQuestion[];
    carelessCount: number;
    carelessMarksLost: number;
    distractorTraps: DistractorTrapQuestion[];
    distractorCount: number;
    timeSinksCount: number;
    aptitudeLeakCount: number;
    knowledgeDeficitCount: number;
    aptitudeRatio: number; // % of total errors from execution/careless/speed
    knowledgeRatio: number; // % of total errors from conceptual deficit
  };

  // 3. Subject Deltas
  subjectDeltas: Record<'physics' | 'chemistry' | 'maths', SubjectGapDelta>;

  // 4. Overall High-Level Metrics
  overall: {
    totalQuestions: number;
    totalAttempted: number;
    totalCorrect: number;
    totalWrong: number;
    userOverallAccuracy: number;
    peerOverallAccuracy: number;
    accuracyDelta: number;
    totalMarksOnTable: number;
    totalNegativeMarks: number;
  };

  // 5. Deterministic Strategic Sprint Priorities
  strategicPriorities: StrategicPriority[];
}

export const useGapAnalytics = (
  logs: QuestionLog[],
  subjectFilter: SubjectFilter = 'all'
): GapAnalyticsResult => {
  return useMemo(() => {
    // 1. Filter logs by subject if specified
    const filteredLogs = subjectFilter === 'all'
      ? logs
      : logs.filter(l => (l.subject || '').toLowerCase().trim() === subjectFilter);

    // Initial accumulators
    let totalSecondsWasted = 0;
    let hesitationCount = 0;
    let totalUserTimeMs = 0;
    let totalPeerTimeMs = 0;
    let timeLogCount = 0;

    const slowestCandidates: SlowestQuestion[] = [];
    const carelessList: CarelessLeakQuestion[] = [];
    const distractorList: DistractorTrapQuestion[] = [];
    let timeSinksCount = 0;

    // Subject accumulator maps
    const subMap: Record<'physics' | 'chemistry' | 'maths', {
      attempted: number;
      correct: number;
      wrong: number;
      unattempted: number;
      marksScored: number;
      marksLostNegative: number;
      unattemptedEasyMarks: number;
      unattemptedMediumMarks: number;
      peerCorrectSum: number;
      peerCount: number;
    }> = {
      physics: { attempted: 0, correct: 0, wrong: 0, unattempted: 0, marksScored: 0, marksLostNegative: 0, unattemptedEasyMarks: 0, unattemptedMediumMarks: 0, peerCorrectSum: 0, peerCount: 0 },
      chemistry: { attempted: 0, correct: 0, wrong: 0, unattempted: 0, marksScored: 0, marksLostNegative: 0, unattemptedEasyMarks: 0, unattemptedMediumMarks: 0, peerCorrectSum: 0, peerCount: 0 },
      maths: { attempted: 0, correct: 0, wrong: 0, unattempted: 0, marksScored: 0, marksLostNegative: 0, unattemptedEasyMarks: 0, unattemptedMediumMarks: 0, peerCorrectSum: 0, peerCount: 0 }
    };

    // Topic error tracking for deterministic strategic priorities
    const topicImpactMap = new Map<string, {
      subject: 'physics' | 'chemistry' | 'maths';
      carelessCount: number;
      timeWastedSec: number;
      distractorCount: number;
      unattemptedEasyCount: number;
      totalErrors: number;
    }>();

    filteredLogs.forEach(l => {
      const rawSubj = (l.subject || 'physics').toLowerCase();
      const subject: 'physics' | 'chemistry' | 'maths' =
        rawSubj.includes('physic') ? 'physics' : rawSubj.includes('chemist') ? 'chemistry' : 'maths';

      const isAttempted = l.status === QuestionStatus.FullyCorrect || l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect;
      const isCorrect = l.status === QuestionStatus.FullyCorrect || l.isCorrect === true;
      const isWrong = l.status === QuestionStatus.Wrong || (!isCorrect && isAttempted);

      // Time Telemetry
      const userTimeMs = l.userTimeSpent !== undefined ? l.userTimeSpent : (l.timeSpent ? l.timeSpent * 1000 : 0);
      const peerTimeMs = l.globalAvgTime !== undefined ? l.globalAvgTime : (l.peerTimeSpent ? l.peerTimeSpent * 1000 : 0);
      const userTimeSec = Math.round(userTimeMs / 1000);
      const peerTimeSec = Math.round(peerTimeMs / 1000);
      const deltaSec = userTimeSec - peerTimeSec;

      if (userTimeSec > 0) {
        totalUserTimeMs += userTimeMs;
        totalPeerTimeMs += peerTimeMs;
        timeLogCount++;

        if (deltaSec > 0) {
          totalSecondsWasted += deltaSec;
          if (deltaSec >= 30) {
            hesitationCount++;
          }
        }

        if (peerTimeSec > 0 && deltaSec > 15) {
          slowestCandidates.push({
            questionId: l.questionId,
            questionNumber: l.questionNumber,
            subject,
            topic: l.topic || 'General Topic',
            chapter: l.chapter,
            userTimeSec,
            peerTimeSec,
            deltaSec,
            status: l.status,
            marksAwarded: l.marksAwarded ?? (isCorrect ? (l.positiveMarks || 4) : isWrong ? -(l.negativeMarks || 1) : 0),
            difficulty: String(l.difficulty || 'Medium'),
            globalCorrectPct: l.globalCorrectPct ?? l.peerCorrectPercent,
            questionHtml: l.questionHtml
          });
        }
      }

      // Time Sink check
      if (l.isTimeSink || (peerTimeMs > 0 && userTimeMs > 1.8 * peerTimeMs)) {
        timeSinksCount++;
      }

      // Peer stats
      const globalCorrect = l.globalCorrectPct ?? l.peerCorrectPercent ?? 0;
      if (globalCorrect > 0) {
        subMap[subject].peerCorrectSum += globalCorrect;
        subMap[subject].peerCount++;
      }

      // Subject stats
      if (isAttempted) {
        subMap[subject].attempted++;
        if (isCorrect) {
          subMap[subject].correct++;
          subMap[subject].marksScored += (l.marksAwarded !== undefined ? l.marksAwarded : (l.positiveMarks || 4));
        } else {
          subMap[subject].wrong++;
          const negLoss = Math.abs(l.marksAwarded !== undefined && l.marksAwarded < 0 ? l.marksAwarded : (l.negativeMarks || 1));
          subMap[subject].marksLostNegative += negLoss;
          subMap[subject].marksScored -= negLoss;
        }
      } else {
        subMap[subject].unattempted++;
        const diff = String(l.difficulty || '').toLowerCase();
        if (diff === 'easy' || globalCorrect >= 65) {
          subMap[subject].unattemptedEasyMarks += (l.positiveMarks || 4);
        } else if (diff === 'medium' || (globalCorrect >= 40 && globalCorrect < 65)) {
          subMap[subject].unattemptedMediumMarks += (l.positiveMarks || 4);
        }
      }

      // Careless Leaks: Missed question where peers scored >= 70%
      const isCareless = (isWrong || l.status === QuestionStatus.PartiallyCorrect) && (globalCorrect >= 70 || l.isCarelessError === true);
      if (isCareless) {
        carelessList.push({
          questionId: l.questionId,
          questionNumber: l.questionNumber,
          subject,
          topic: l.topic || 'General Topic',
          userTimeSec,
          peerCorrectPct: globalCorrect,
          marksLost: (l.positiveMarks || 4) + (l.negativeMarks || 1),
          reasonForError: l.reasonForError || 'Silly Mistake'
        });
      }

      // Distractor Traps: Hit primary distractor
      const isDistractor = l.isDistractorTrap === true || (
        isWrong &&
        l.selectedIndex &&
        l.selectedIndex.length > 0 &&
        l.optionsDistribution &&
        Object.keys(l.optionsDistribution).length > 0
      );
      if (isDistractor) {
        distractorList.push({
          questionId: l.questionId,
          questionNumber: l.questionNumber,
          subject,
          topic: l.topic || 'General Topic',
          userAnswer: l.answered,
          correctAnswer: l.finalKey,
          peerDistribution: l.optionsDistribution
        });
      }

      // Track topic level impact for recommendations
      if (l.topic && l.topic !== 'N/A') {
        const tEntry = topicImpactMap.get(l.topic) || {
          subject,
          carelessCount: 0,
          timeWastedSec: 0,
          distractorCount: 0,
          unattemptedEasyCount: 0,
          totalErrors: 0
        };

        if (isCareless) tEntry.carelessCount++;
        if (deltaSec > 20) tEntry.timeWastedSec += deltaSec;
        if (isDistractor) tEntry.distractorCount++;
        if (!isAttempted && (String(l.difficulty).toLowerCase() === 'easy' || globalCorrect >= 65)) {
          tEntry.unattemptedEasyCount++;
        }
        if (isWrong) tEntry.totalErrors++;

        topicImpactMap.set(l.topic, tEntry);
      }
    });

    // Sort slowest questions descending by delta time
    const topSlowestQuestions = slowestCandidates
      .sort((a, b) => b.deltaSec - a.deltaSec)
      .slice(0, 5);

    // Aptitude vs Knowledge Split
    const carelessCount = carelessList.length;
    const distractorCount = distractorList.length;
    const carelessMarksLost = carelessList.reduce((acc, q) => acc + q.marksLost, 0);

    // Aptitude leaks: careless slips + severe time sinks + calculation slips
    const aptitudeLeakCount = carelessCount + Math.min(timeSinksCount, 10);
    // Knowledge deficit: conceptual distractor traps + remaining difficult errors
    const knowledgeDeficitCount = distractorCount + Math.max(0, filteredLogs.filter(l => l.status === QuestionStatus.Wrong).length - carelessCount);

    const totalDeficitPoints = aptitudeLeakCount + knowledgeDeficitCount;
    const aptitudeRatio = totalDeficitPoints > 0
      ? Math.round((aptitudeLeakCount / totalDeficitPoints) * 100)
      : 50;
    const knowledgeRatio = 100 - aptitudeRatio;

    // Compute Subject Gap Deltas
    const subjectDeltas: Record<'physics' | 'chemistry' | 'maths', SubjectGapDelta> = {
      physics: {
        subject: 'physics',
        attempted: subMap.physics.attempted,
        correct: subMap.physics.correct,
        wrong: subMap.physics.wrong,
        unattempted: subMap.physics.unattempted,
        userAccuracy: subMap.physics.attempted > 0 ? Math.round((subMap.physics.correct / subMap.physics.attempted) * 100) : 0,
        topTierBenchmarkAccuracy: subMap.physics.peerCount > 0 ? Math.min(96, Math.round(subMap.physics.peerCorrectSum / subMap.physics.peerCount) + 20) : 85,
        accuracyGap: 0,
        marksScored: subMap.physics.marksScored,
        marksLostNegative: subMap.physics.marksLostNegative,
        unattemptedEasyMarks: subMap.physics.unattemptedEasyMarks,
        unattemptedMediumMarks: subMap.physics.unattemptedMediumMarks,
        totalMarksOnTable: subMap.physics.marksLostNegative + subMap.physics.unattemptedEasyMarks + subMap.physics.unattemptedMediumMarks
      },
      chemistry: {
        subject: 'chemistry',
        attempted: subMap.chemistry.attempted,
        correct: subMap.chemistry.correct,
        wrong: subMap.chemistry.wrong,
        unattempted: subMap.chemistry.unattempted,
        userAccuracy: subMap.chemistry.attempted > 0 ? Math.round((subMap.chemistry.correct / subMap.chemistry.attempted) * 100) : 0,
        topTierBenchmarkAccuracy: subMap.chemistry.peerCount > 0 ? Math.min(96, Math.round(subMap.chemistry.peerCorrectSum / subMap.chemistry.peerCount) + 20) : 88,
        accuracyGap: 0,
        marksScored: subMap.chemistry.marksScored,
        marksLostNegative: subMap.chemistry.marksLostNegative,
        unattemptedEasyMarks: subMap.chemistry.unattemptedEasyMarks,
        unattemptedMediumMarks: subMap.chemistry.unattemptedMediumMarks,
        totalMarksOnTable: subMap.chemistry.marksLostNegative + subMap.chemistry.unattemptedEasyMarks + subMap.chemistry.unattemptedMediumMarks
      },
      maths: {
        subject: 'maths',
        attempted: subMap.maths.attempted,
        correct: subMap.maths.correct,
        wrong: subMap.maths.wrong,
        unattempted: subMap.maths.unattempted,
        userAccuracy: subMap.maths.attempted > 0 ? Math.round((subMap.maths.correct / subMap.maths.attempted) * 100) : 0,
        topTierBenchmarkAccuracy: subMap.maths.peerCount > 0 ? Math.min(92, Math.round(subMap.maths.peerCorrectSum / subMap.maths.peerCount) + 22) : 80,
        accuracyGap: 0,
        marksScored: subMap.maths.marksScored,
        marksLostNegative: subMap.maths.marksLostNegative,
        unattemptedEasyMarks: subMap.maths.unattemptedEasyMarks,
        unattemptedMediumMarks: subMap.maths.unattemptedMediumMarks,
        totalMarksOnTable: subMap.maths.marksLostNegative + subMap.maths.unattemptedEasyMarks + subMap.maths.unattemptedMediumMarks
      }
    };

    subjectDeltas.physics.accuracyGap = Math.max(0, subjectDeltas.physics.topTierBenchmarkAccuracy - subjectDeltas.physics.userAccuracy);
    subjectDeltas.chemistry.accuracyGap = Math.max(0, subjectDeltas.chemistry.topTierBenchmarkAccuracy - subjectDeltas.chemistry.userAccuracy);
    subjectDeltas.maths.accuracyGap = Math.max(0, subjectDeltas.maths.topTierBenchmarkAccuracy - subjectDeltas.maths.userAccuracy);

    // Overall metrics
    const totalAttempted = subMap.physics.attempted + subMap.chemistry.attempted + subMap.maths.attempted;
    const totalCorrect = subMap.physics.correct + subMap.chemistry.correct + subMap.maths.correct;
    const totalWrong = subMap.physics.wrong + subMap.chemistry.wrong + subMap.maths.wrong;
    const totalUnanswered = subMap.physics.unattempted + subMap.chemistry.unattempted + subMap.maths.unattempted;

    const userOverallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    const totalPeerCount = subMap.physics.peerCount + subMap.chemistry.peerCount + subMap.maths.peerCount;
    const peerOverallAccuracy = totalPeerCount > 0
      ? Math.round((subMap.physics.peerCorrectSum + subMap.chemistry.peerCorrectSum + subMap.maths.peerCorrectSum) / totalPeerCount)
      : 55;

    const totalMarksOnTable = subjectDeltas.physics.totalMarksOnTable + subjectDeltas.chemistry.totalMarksOnTable + subjectDeltas.maths.totalMarksOnTable;
    const totalNegativeMarks = subjectDeltas.physics.marksLostNegative + subjectDeltas.chemistry.marksLostNegative + subjectDeltas.maths.marksLostNegative;

    // 5. Deterministic Strategic Sprint Priorities (Top 3)
    const strategicPriorities: StrategicPriority[] = [];
    const topicEntries = Array.from(topicImpactMap.entries());

    // Priority 1: Top Careless Leak Topic
    const worstCarelessTopic = topicEntries
      .filter(([, data]) => data.carelessCount > 0)
      .sort((a, b) => b[1].carelessCount - a[1].carelessCount)[0];

    if (worstCarelessTopic) {
      strategicPriorities.push({
        id: 'priority-careless',
        rank: 1,
        title: `Plug Execution Leaks in ${worstCarelessTopic[0]}`,
        category: 'careless',
        subject: worstCarelessTopic[1].subject,
        topic: worstCarelessTopic[0],
        impactScore: worstCarelessTopic[1].carelessCount * 5,
        recommendation: `Recover up to +${worstCarelessTopic[1].carelessCount * 5} marks by reviewing ${worstCarelessTopic[1].carelessCount} high-percentage questions missed due to calculation or misread steps.`
      });
    }

    // Priority 2: Top Time Sink Topic
    const worstTimeTopic = topicEntries
      .filter(([topic]) => !strategicPriorities.some(p => p.topic === topic) && topicImpactMap.get(topic)!.timeWastedSec > 60)
      .sort((a, b) => b[1].timeWastedSec - a[1].timeWastedSec)[0];

    if (worstTimeTopic) {
      const minWasted = Math.round(worstTimeTopic[1].timeWastedSec / 60);
      strategicPriorities.push({
        id: 'priority-time',
        rank: strategicPriorities.length + 1,
        title: `Enforce Cut-Off Thresholds in ${worstTimeTopic[0]}`,
        category: 'time_sink',
        subject: worstTimeTopic[1].subject,
        topic: worstTimeTopic[0],
        impactScore: Math.min(20, minWasted * 2),
        recommendation: `Saved ~${minWasted} mins of hesitation by skipping questions that stall beyond 2.5 minutes in Round 1.`
      });
    }

    // Priority 3: Top Distractor Trap or Unattempted Easy Topic
    const worstTrapTopic = topicEntries
      .filter(([topic]) => !strategicPriorities.some(p => p.topic === topic))
      .sort((a, b) => (b[1].distractorCount * 4 + b[1].unattemptedEasyCount * 4) - (a[1].distractorCount * 4 + a[1].unattemptedEasyCount * 4))[0];

    if (worstTrapTopic && (worstTrapTopic[1].distractorCount > 0 || worstTrapTopic[1].unattemptedEasyCount > 0)) {
      const isTrap = worstTrapTopic[1].distractorCount >= worstTrapTopic[1].unattemptedEasyCount;
      strategicPriorities.push({
        id: 'priority-trap',
        rank: strategicPriorities.length + 1,
        title: isTrap ? `Neutralize Conceptual Traps in ${worstTrapTopic[0]}` : `Harvest Unattempted Easy Questions in ${worstTrapTopic[0]}`,
        category: isTrap ? 'distractor_trap' : 'unattempted_easy',
        subject: worstTrapTopic[1].subject,
        topic: worstTrapTopic[0],
        impactScore: isTrap ? worstTrapTopic[1].distractorCount * 4 : worstTrapTopic[1].unattemptedEasyCount * 4,
        recommendation: isTrap
          ? `Dissect the primary trap options where peers trick you into standard sign or boundary errors.`
          : `Ensure easy questions in this topic are attempted early during paper navigation.`
      });
    }

    // Fallback if no logs
    if (strategicPriorities.length === 0) {
      strategicPriorities.push({
        id: 'priority-default',
        rank: 1,
        title: 'Maintain Consistent Paper Navigation Order',
        category: 'careless',
        subject: 'all',
        topic: 'General Strategy',
        impactScore: 15,
        recommendation: 'Scan all 75 questions in Round 1 to harvest high-accuracy questions before attempting time-intensive problems.'
      });
    }

    return {
      timeLiabilities: {
        totalSecondsWasted,
        totalMinutesWasted: Math.round(totalSecondsWasted / 60),
        hesitationCount,
        slowestQuestions: topSlowestQuestions,
        avgUserTimeSec: timeLogCount > 0 ? Math.round((totalUserTimeMs / timeLogCount) / 1000) : 0,
        avgPeerTimeSec: timeLogCount > 0 ? Math.round((totalPeerTimeMs / timeLogCount) / 1000) : 0
      },
      leakBreakdown: {
        carelessLeaks: carelessList,
        carelessCount,
        carelessMarksLost,
        distractorTraps: distractorList,
        distractorCount,
        timeSinksCount,
        aptitudeLeakCount,
        knowledgeDeficitCount,
        aptitudeRatio,
        knowledgeRatio
      },
      subjectDeltas,
      overall: {
        totalQuestions: filteredLogs.length,
        totalAttempted,
        totalCorrect,
        totalWrong,
        totalUnanswered,
        userOverallAccuracy,
        peerOverallAccuracy,
        accuracyDelta: userOverallAccuracy - peerOverallAccuracy,
        totalMarksOnTable,
        totalNegativeMarks
      },
      strategicPriorities
    };
  }, [logs, subjectFilter]);
};