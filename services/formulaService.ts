// ============================================================================
// Formula & Concept Vault Service Layer
// Spaced Repetition (SM-2), Active Recall & Error Telemetry Cross-Referencing
// ============================================================================

import { Formula, QuestionLog, UserProfile, FormulaNote } from '../types';
import { ALL_FORMULAS } from '../data/formulaVault';

/**
 * Cross-references question logs (especially Wrong / Partially Correct) with formulas
 */
export function getLinkedFormulas(logs: QuestionLog[]): Array<Formula & { errorCount: number }> {
    if (!logs || logs.length === 0) return [];

    const topicErrorCounts: Record<string, number> = {};
    logs.forEach(l => {
        if (l.status === 'Wrong' || l.status === 'Partially Correct') {
            const t = (l.topic || '').toLowerCase().trim();
            if (t) {
                topicErrorCounts[t] = (topicErrorCounts[t] || 0) + 1;
            }
        }
    });

    const results: Array<Formula & { errorCount: number }> = [];

    ALL_FORMULAS.forEach(formula => {
        const formulaTopic = formula.topic.toLowerCase().trim();
        const formulaChapter = formula.chapter.toLowerCase().trim();

        let count = 0;
        Object.entries(topicErrorCounts).forEach(([topic, errCount]) => {
            if (topic.includes(formulaTopic) || formulaTopic.includes(topic) ||
                topic.includes(formulaChapter) || formulaChapter.includes(topic)) {
                count += errCount;
            }
        });

        if (count > 0) {
            results.push({ ...formula, errorCount: count });
        }
    });

    return results.sort((a, b) => b.errorCount - a.errorCount);
}

/**
 * Returns list of formulas currently marked as Weak by the student
 */
export function getWeakFormulas(weakIds: string[] = []): Formula[] {
    const set = new Set(weakIds);
    return ALL_FORMULAS.filter(f => set.has(f.id));
}

/**
 * Returns Top N high-frequency formulas for JEE
 */
export function getFrequentFormulas(subject?: 'Physics' | 'Chemistry' | 'Maths', topN: number = 20): Formula[] {
    let pool = ALL_FORMULAS;
    if (subject) {
        pool = pool.filter(f => f.subject === subject);
    }

    const priorityMap: Record<string, number> = {
        'Very High': 4,
        'High': 3,
        'Medium': 2,
        'Concept': 1
    };

    return [...pool]
        .sort((a, b) => (priorityMap[b.jeeFrequency] || 0) - (priorityMap[a.jeeFrequency] || 0))
        .slice(0, topN);
}

/**
 * Toggles a formula in/out of the user's Weak List
 */
export function toggleFormulaWeakStatus(
    formulaId: string,
    userProfile: UserProfile,
    onUpdateProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void
): boolean {
    const currentList = userProfile.formulaWeakList || [];
    const isCurrentlyWeak = currentList.includes(formulaId);

    const updatedList = isCurrentlyWeak
        ? currentList.filter(id => id !== formulaId)
        : [...currentList, formulaId];

    const currentNotes = userProfile.formulaNotes || {};
    const existingNote = currentNotes[formulaId] || { formulaId, isWeak: false };

    const updatedNotes = {
        ...currentNotes,
        [formulaId]: {
            ...existingNote,
            isWeak: !isCurrentlyWeak,
            lastReviewedAt: Date.now()
        }
    };

    onUpdateProfile(prev => ({
        ...prev,
        formulaWeakList: updatedList,
        formulaNotes: updatedNotes
    }));

    return !isCurrentlyWeak;
}

/**
 * Records Active Recall flashcard test result (Legacy binary pass/fail)
 */
export function recordRecallResult(
    formulaId: string,
    passed: boolean,
    userProfile: UserProfile,
    onUpdateProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void
): void {
    recordSpacedRecallResult(formulaId, passed ? 'good' : 'again', userProfile, onUpdateProfile);
}

/**
 * Records Active Recall flashcard result using 4-tier SM-2 Spaced Repetition
 */
export function recordSpacedRecallResult(
    formulaId: string,
    grade: 'again' | 'hard' | 'good' | 'easy',
    userProfile: UserProfile,
    onUpdateProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void
): void {
    const currentNotes = userProfile.formulaNotes || {};
    const existingNote: FormulaNote = currentNotes[formulaId] || { 
        formulaId, 
        isWeak: false, 
        recallSuccessCount: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        streak: 0
    };

    let intervalDays = 1;
    let nextReviewDate = Date.now();
    let isWeak = existingNote.isWeak;
    let isMastered = false;
    let newStreak = existingNote.streak || 0;
    let easeFactor = existingNote.easeFactor || 2.5;

    const DAY_MS = 24 * 60 * 60 * 1000;

    switch (grade) {
        case 'again': // Forgot
            intervalDays = 1;
            nextReviewDate = Date.now() + 1 * DAY_MS;
            newStreak = 0;
            isWeak = true;
            easeFactor = Math.max(1.3, easeFactor - 0.2);
            break;

        case 'hard': // Recalled with difficulty
            intervalDays = Math.max(2, Math.round((existingNote.intervalDays || 1) * 1.2));
            nextReviewDate = Date.now() + intervalDays * DAY_MS;
            newStreak += 1;
            isWeak = false;
            easeFactor = Math.max(1.3, easeFactor - 0.15);
            break;

        case 'good': // Solid recall
            intervalDays = Math.max(5, Math.round((existingNote.intervalDays || 1) * easeFactor));
            nextReviewDate = Date.now() + intervalDays * DAY_MS;
            newStreak += 1;
            isWeak = false;
            if (newStreak >= 3) isMastered = true;
            break;

        case 'easy': // Instant effortless recall
            intervalDays = Math.max(12, Math.round((existingNote.intervalDays || 1) * easeFactor * 1.3));
            nextReviewDate = Date.now() + intervalDays * DAY_MS;
            newStreak += 2;
            isWeak = false;
            isMastered = true;
            easeFactor = Math.min(3.0, easeFactor + 0.15);
            break;
    }

    // Update Weak List
    let updatedWeakList = userProfile.formulaWeakList || [];
    if (isMastered && updatedWeakList.includes(formulaId)) {
        updatedWeakList = updatedWeakList.filter(id => id !== formulaId);
    } else if (isWeak && !updatedWeakList.includes(formulaId)) {
        updatedWeakList = [...updatedWeakList, formulaId];
    }

    const updatedNotes = {
        ...currentNotes,
        [formulaId]: {
            ...existingNote,
            recallSuccessCount: grade === 'again' ? 0 : (existingNote.recallSuccessCount || 0) + 1,
            lastReviewedAt: Date.now(),
            nextReviewDate,
            intervalDays,
            easeFactor,
            streak: newStreak,
            lastRating: grade,
            isWeak,
            masteredAt: isMastered ? Date.now() : existingNote.masteredAt
        }
    };

    onUpdateProfile(prev => ({
        ...prev,
        formulaWeakList: updatedWeakList,
        formulaNotes: updatedNotes
    }));
}

/**
 * Returns formulas that are due for review today or overdue based on SM-2 intervals
 */
export function getDueFormulas(userProfile: UserProfile, subject?: 'Physics' | 'Chemistry' | 'Maths'): Formula[] {
    const notes = userProfile.formulaNotes || {};
    const now = Date.now();
    let pool = ALL_FORMULAS;

    if (subject) {
        pool = pool.filter(f => f.subject === subject);
    }

    return pool.filter(f => {
        const note = notes[f.id];
        // If note has a scheduled nextReviewDate and it is due
        if (note && note.nextReviewDate && note.nextReviewDate <= now) {
            return true;
        }
        // If marked weak and unreviewed in last 2 days
        if (note && note.isWeak && (!note.lastReviewedAt || (now - note.lastReviewedAt > 2 * 24 * 60 * 60 * 1000))) {
            return true;
        }
        return false;
    });
}

/**
 * Returns formulas bridging two domains (Multi-Domain Bridges)
 */
export function getMultiDomainBridges(subject?: 'Physics' | 'Chemistry' | 'Maths'): Formula[] {
    let pool = ALL_FORMULAS.filter(f => f.category === 'Multi-Domain Bridge');
    if (subject) {
        pool = pool.filter(f => f.subject === subject);
    }
    return pool;
}

/**
 * Returns JEE Advanced direct results & shortcuts
 */
export function getJeeAdvancedDirectResults(subject?: 'Physics' | 'Chemistry' | 'Maths'): Formula[] {
    let pool = ALL_FORMULAS.filter(f => f.category === 'JEE Advanced Direct Result');
    if (subject) {
        pool = pool.filter(f => f.subject === subject);
    }
    return pool;
}