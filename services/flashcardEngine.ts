import { QuestionLog, Flashcard, QuestionStatus, ErrorCode, TestReport } from '../types';
import { TOPIC_DEPENDENCIES, TOPIC_WEIGHTAGE } from '../constants';
import { dbService } from './dbService';

export interface GroupedErrors {
  topic: string;
  subject: 'physics' | 'chemistry' | 'maths';
  logs: QuestionLog[];
  shouldGroup: boolean;
}

export type GroupingMode = 'separate' | 'grouped' | 'auto';
export type SessionMode = 'rescue' | 'review' | 'blitz' | 'prerequisite' | 'exam_sim' | 'weak_subject';

/**
 * Fallback chain to infer topic for a QuestionLog when topic is 'N/A' or missing
 */
export function inferTopic(log: QuestionLog): string {
  if (log.topic && log.topic !== 'N/A' && log.topic.trim() !== '') {
    return log.topic.trim();
  }
  if (log.chapter && log.chapter !== 'N/A' && log.chapter.trim() !== '') {
    return `${log.chapter.trim()} (General)`;
  }
  if (log.chapterGroup && log.chapterGroup !== 'N/A' && log.chapterGroup.trim() !== '') {
    return `${log.chapterGroup.trim()} (Broad)`;
  }
  return '__NEEDS_TAGGING__';
}

/**
 * Check if all prerequisite topics for a given topic are mastered
 */
export function checkPrerequisites(
  topic: string,
  masteredTopics: string[] = []
): { met: boolean; missing: string[] } {
  // Normalize topic name by stripping fallback suffixes
  const cleanTopic = topic.replace(/\s+\((General|Broad)\)$/, '');
  const prereqs = TOPIC_DEPENDENCIES[cleanTopic] || TOPIC_DEPENDENCIES[topic] || [];
  
  if (prereqs.length === 0) {
    return { met: true, missing: [] };
  }

  const masteredSet = new Set(masteredTopics.map(t => t.toLowerCase()));
  const missing = prereqs.filter(p => !masteredSet.has(p.toLowerCase()));

  return {
    met: missing.length === 0,
    missing
  };
}

/**
 * Group error logs by resolved topic based on grouping mode
 */
export function groupErrorsByTopic(
  logs: QuestionLog[],
  mode: GroupingMode = 'auto'
): GroupedErrors[] {
  const errorLogs = logs.filter(
    l => l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect
  );

  const map = new Map<string, { subject: 'physics' | 'chemistry' | 'maths'; logs: QuestionLog[] }>();

  errorLogs.forEach(log => {
    const resolvedTopic = inferTopic(log);
    const key = `${log.subject || 'physics'}:::${resolvedTopic}`;
    if (!map.has(key)) {
      map.set(key, { subject: log.subject || 'physics', logs: [] });
    }
    map.get(key)!.logs.push(log);
  });

  const result: GroupedErrors[] = [];

  map.forEach((data, key) => {
    const [_, topic] = key.split(':::');
    let shouldGroup = false;
    if (mode === 'grouped' && data.logs.length > 1) {
      shouldGroup = true;
    } else if (mode === 'auto' && data.logs.length >= 3) {
      shouldGroup = true;
    }

    result.push({
      topic,
      subject: data.subject,
      logs: data.logs,
      shouldGroup
    });
  });

  return result;
}

/**
 * Build a Track A flashcard (Rich content from ExamGoal questionHtml)
 */
export function buildTrackACard(log: QuestionLog): Flashcard {
  const topic = inferTopic(log);
  const logId = `${log.testId}-${log.questionNumber}`;

  return {
    id: logId,
    sourceLogId: logId,
    track: 'A',
    topic,
    subject: log.subject,
    chapter: log.chapter,
    errorCode: log.errorCode || undefined,
    
    // Rich ExamGoal content
    questionHtml: log.questionHtml,
    explanationHtml: log.explanationHtml,
    optionsHtml: log.optionsHtml || log.options,
    correctOptions: log.correctOptions,
    studentAnswer: log.answered,
    
    // Smart metadata
    peerCorrectPct: log.globalCorrectPct,
    isCarelessError: log.isCarelessError,
    isTimeSink: log.isTimeSink,
    
    front: `**Error Analysis:**\n${log.reasonForError || 'Incorrect Answer'}\n\n**Question Type:** ${log.questionType}`,
    back: '__TRACK_A__',
    
    nextReview: new Date().toISOString(),
    interval: 0,
    easeFactor: 2.5,
    reviews: 0,
    ladderLevel: 1,
    consecutiveCorrect: 0,
    aiEnhanced: false,
    linkedSyllabusChapter: log.chapter
  };
}

/**
 * Build a Track B flashcard (Inferred question via AI synthesis)
 */
export function buildTrackBCard(log: QuestionLog): Flashcard {
  const topic = inferTopic(log);
  const logId = `${log.testId}-${log.questionNumber}`;

  return {
    id: logId,
    sourceLogId: logId,
    track: 'B',
    topic,
    subject: log.subject,
    chapter: log.chapter,
    errorCode: log.errorCode || undefined,
    
    front: `**Topic:** ${topic}\n**Chapter:** ${log.chapter || 'N/A'}\n**Error Analysis:** ${log.reasonForError || 'Incorrect Answer'}\n**Context:** ${log.questionType}`,
    back: '__STUB__',
    
    nextReview: new Date().toISOString(),
    interval: 0,
    easeFactor: 2.5,
    reviews: 0,
    ladderLevel: 1,
    consecutiveCorrect: 0,
    aiEnhanced: false,
    linkedSyllabusChapter: log.chapter
  };
}

/**
 * Build a Master Card for grouped errors on a single topic
 */
export function buildMasterCard(group: GroupedErrors): Flashcard {
  const topicSlug = group.topic.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const groupId = `group-${group.subject}-${topicSlug}`;
  const masterId = `master-${group.subject}-${topicSlug}-${Date.now()}`;

  return {
    id: masterId,
    groupId,
    isGroupMaster: true,
    topic: group.topic,
    subject: group.subject,
    childCardIds: group.logs.map(l => `${l.testId}-${l.questionNumber}`),
    
    front: `**Topic Master Card: ${group.topic}**\n\nYou have ${group.logs.length} error logs in this topic.\nMaster this foundational pattern to unlock targeted practice sub-cards.`,
    back: `__GROUPED_STUB__`,
    
    nextReview: new Date().toISOString(),
    interval: 0,
    easeFactor: 2.5,
    reviews: 0,
    ladderLevel: 1,
    consecutiveCorrect: 0,
    aiEnhanced: false
  };
}

/**
 * Enrich cards array with computed prerequisite status
 */
export function enrichCardsWithPrerequisites(
  cards: Flashcard[],
  masteredTopics: string[] = []
): Flashcard[] {
  return cards.map(card => {
    const cleanTopic = card.topic.replace(/\s+\((General|Broad)\)$/, '');
    const prereqs = TOPIC_DEPENDENCIES[cleanTopic] || TOPIC_DEPENDENCIES[card.topic] || [];
    const check = checkPrerequisites(card.topic, masteredTopics);

    return {
      ...card,
      prerequisiteTopics: prereqs,
      prerequisitesMet: check.met
    };
  });
}

/**
 * Build a session deck based on session mode and options
 */
export function buildSession(
  cards: Flashcard[],
  mode: SessionMode,
  options?: {
    topic?: string;
    subject?: 'physics' | 'chemistry' | 'maths';
    masteredTopics?: string[];
  }
): Flashcard[] {
  const now = new Date();
  const enriched = enrichCardsWithPrerequisites(cards, options?.masteredTopics || []);

  switch (mode) {
    case 'rescue': {
      // Recent or unreviewed errors, prioritizing careless and time sinks
      return enriched
        .filter(c => c.reviews === 0 || c.back === '__STUB__' || c.isCarelessError || c.isTimeSink)
        .sort((a, b) => {
          if (a.isCarelessError && !b.isCarelessError) return -1;
          if (!a.isCarelessError && b.isCarelessError) return 1;
          return a.reviews - b.reviews;
        })
        .slice(0, 15);
    }

    case 'review': {
      // SM-2 due cards
      return enriched
        .filter(c => new Date(c.nextReview) <= now && c.back !== '__STUB__' && c.back !== '__GROUPED_STUB__')
        .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
        .slice(0, 20);
    }

    case 'blitz': {
      // Single topic deep dive ordered by difficulty ladder
      if (!options?.topic) return enriched.slice(0, 20);
      return enriched
        .filter(c => c.topic.toLowerCase() === options.topic!.toLowerCase())
        .sort((a, b) => (a.ladderLevel || 1) - (b.ladderLevel || 1));
    }

    case 'prerequisite': {
      // Surface cards where prerequisites are NOT met first to fix foundational gaps
      return enriched
        .filter(c => c.prerequisitesMet === false || (c.prerequisiteTopics && c.prerequisiteTopics.length > 0))
        .sort((a, b) => (a.prerequisitesMet ? 1 : -1))
        .slice(0, 20);
    }

    case 'weak_subject': {
      // Cards in specified weak subject ordered by lowest easeFactor
      if (!options?.subject) return enriched.slice(0, 20);
      return enriched
        .filter(c => c.subject === options.subject)
        .sort((a, b) => a.easeFactor - b.easeFactor)
        .slice(0, 20);
    }

    case 'exam_sim': {
      // Weighted random selection based on topic weightage
      const weightOrder = { High: 3, Medium: 2, Low: 1 };
      return [...enriched]
        .sort((a, b) => {
          const wA = weightOrder[TOPIC_WEIGHTAGE[a.topic] || 'Medium'];
          const wB = weightOrder[TOPIC_WEIGHTAGE[b.topic] || 'Medium'];
          return wB - wA;
        })
        .slice(0, 20);
    }

    default:
      return enriched.slice(0, 20);
  }
}

/**
 * Generate and save batch cards (Track A / Track B / Master cards) from error logs
 */
export async function generateBatchCards(
  logs: QuestionLog[],
  groupingMode: GroupingMode = 'auto',
  reports?: TestReport[]
): Promise<Flashcard[]> {
  const existingCards = await dbService.getFlashcards();
  const existingSourceIds = new Set(existingCards.map(c => c.sourceLogId || c.id));

  // Filter error logs not yet processed
  const newErrors = logs.filter(l => 
    (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect) &&
    !existingSourceIds.has(`${l.testId}-${l.questionNumber}`)
  );

  if (newErrors.length === 0) {
    return existingCards;
  }

  const groups = groupErrorsByTopic(newErrors, groupingMode);
  const generatedCards: Flashcard[] = [];

  for (const group of groups) {
    let masterCard: Flashcard | null = null;

    if (group.shouldGroup) {
      masterCard = buildMasterCard(group);
      generatedCards.push(masterCard);
    }

    const childIds: string[] = [];

    for (const log of group.logs) {
      let card: Flashcard;
      // Track A if questionHtml is present (ExamGoal imported test)
      if (log.questionHtml && log.questionHtml.trim().length > 0) {
        card = buildTrackACard(log);
      } else {
        card = buildTrackBCard(log);
      }

      if (masterCard) {
        card.groupId = masterCard.groupId;
        childIds.push(card.id);
      }

      generatedCards.push(card);
    }

    if (masterCard) {
      masterCard.childCardIds = childIds;
    }
  }

  // Batch save to IndexedDB
  await dbService.upsertFlashcards(generatedCards);

  const allCards = await dbService.getFlashcards();
  return allCards;
}

/**
 * Automatically syncs and enriches flashcards with QuestionLogs:
 * 1. Enriches existing flashcards with full ExamGoal questionHtml/options/explanation from matching logs.
 * 2. Auto-generates Track A cards for any ExamGoal error logs that don't have flashcards yet.
 */
export async function syncAndEnrichFlashcards(
  existingCards: Flashcard[],
  logs: QuestionLog[]
): Promise<Flashcard[]> {
  if (!logs || logs.length === 0) return existingCards;

  // Build high-speed lookup maps for logs
  const logByTestAndQNum = new Map<string, QuestionLog>();
  const logById = new Map<string, QuestionLog>();

  logs.forEach(l => {
    if (l.testId && l.questionNumber) {
      logByTestAndQNum.set(`${l.testId}-${l.questionNumber}`, l);
    }
    if (l.questionId) {
      logById.set(l.questionId, l);
    }
  });

  const cardsToSave: Flashcard[] = [];
  const existingSourceIds = new Set<string>();

  // 1. Enrich existing cards if matching log has rich Track A ExamGoal content
  const enrichedCards = existingCards.map(card => {
    const sourceKey = card.sourceLogId || card.id;
    existingSourceIds.add(sourceKey);
    existingSourceIds.add(card.id);

    const matchingLog = logByTestAndQNum.get(sourceKey) || logById.get(card.id) || logById.get(card.sourceLogId || '');

    if (matchingLog && matchingLog.questionHtml && matchingLog.questionHtml.trim().length > 0) {
      const needsUpdate = card.track !== 'A' || !card.questionHtml || !card.optionsHtml;

      const updatedCard: Flashcard = {
        ...card,
        track: 'A',
        questionHtml: matchingLog.questionHtml,
        explanationHtml: matchingLog.explanationHtml || card.explanationHtml,
        optionsHtml: matchingLog.optionsHtml || matchingLog.options || card.optionsHtml,
        correctOptions: matchingLog.correctOptions || card.correctOptions,
        studentAnswer: matchingLog.answered || matchingLog.userInputValue || card.studentAnswer,
        isCarelessError: matchingLog.isCarelessError ?? card.isCarelessError,
        isTimeSink: matchingLog.isTimeSink ?? card.isTimeSink,
        peerCorrectPct: matchingLog.globalCorrectPct || matchingLog.peerCorrectPercent || card.peerCorrectPct,
        subject: matchingLog.subject || card.subject,
        chapter: matchingLog.chapter || card.chapter,
      };

      if (needsUpdate) {
        cardsToSave.push(updatedCard);
      }
      return updatedCard;
    }
    return card;
  });

  // 2. Auto-generate Track A cards for any ExamGoal error logs (e.g. from EGM tests) not yet in the deck
  const newTrackACards: Flashcard[] = [];
  logs.forEach(l => {
    const isErrorOrUnattempted = l.status === QuestionStatus.Wrong || 
                                l.status === QuestionStatus.PartiallyCorrect || 
                                l.status === QuestionStatus.Unanswered;
    const hasRichHtml = l.questionHtml && l.questionHtml.trim().length > 0;
    const key = `${l.testId}-${l.questionNumber}`;

    if (isErrorOrUnattempted && hasRichHtml && !existingSourceIds.has(key) && !existingSourceIds.has(l.questionId || '')) {
      const newCard = buildTrackACard(l);
      newTrackACards.push(newCard);
      existingSourceIds.add(key);
      if (l.questionId) existingSourceIds.add(l.questionId);
    }
  });

  if (newTrackACards.length > 0) {
    cardsToSave.push(...newTrackACards);
  }

  // Persist all enriched & new cards in background
  if (cardsToSave.length > 0) {
    await dbService.upsertFlashcards(cardsToSave);
  }

  return [...enrichedCards, ...newTrackACards];
}
