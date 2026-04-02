// ============================================================================
// PYQ Intelligence & Trend Radar Service
// Historical Frequency Telemetry, 2024 NTA Pruning Engine & ROI Analysis
// ============================================================================

import { 
    PYQChapterMetadata, CoverageQuadrantItem, UserProfile, 
    SyllabusStatus, QuestionLog, QuestionStatus 
} from '../types';
import { JEE_MAINS_PYQ_DATA, JEE_ADVANCED_PYQ_DATA } from '../data/pyqMetadata';

/**
 * Retrieves PYQ chapter metadata sorted by question volume with student practice stats
 */
export function getChapterWeightages(
    subject?: 'Physics' | 'Chemistry' | 'Maths',
    examType: 'JEE Mains' | 'JEE Advanced' = 'JEE Mains',
    logs: QuestionLog[] = [],
    syllabusStatusFilter: 'All' | 'Active Core' | 'Pruned / Deleted by NTA' = 'All'
): Array<PYQChapterMetadata & { userSolvedCount: number; userAccuracy: number; coverageDepthPct: number }> {
    const dataset = examType === 'JEE Mains' ? JEE_MAINS_PYQ_DATA : JEE_ADVANCED_PYQ_DATA;
    let filtered = dataset;

    if (subject) {
        filtered = filtered.filter(d => d.subject === subject);
    }

    if (syllabusStatusFilter === 'Active Core') {
        filtered = filtered.filter(d => d.syllabusStatus !== 'Pruned / Deleted by NTA');
    } else if (syllabusStatusFilter === 'Pruned / Deleted by NTA') {
        filtered = filtered.filter(d => d.syllabusStatus === 'Pruned / Deleted by NTA');
    }

    return filtered.map(item => {
        const chapLogs = logs.filter(l => {
            const topic = (l.topic || '').toLowerCase();
            const ch = item.chapter.toLowerCase();
            return topic.includes(ch) || ch.includes(topic);
        });

        const userSolvedCount = chapLogs.length;
        const correct = chapLogs.filter(l => l.status === QuestionStatus.FullyCorrect).length;
        const userAccuracy = userSolvedCount > 0 ? Math.round((correct / userSolvedCount) * 100) : 0;
        
        // Target mastery quota: 25 questions for High-Yield, 15 for standard
        const targetQuota = item.avgQuestionsPerPaper >= 1.2 ? 25 : 15;
        const coverageDepthPct = Math.min(100, Math.round((userSolvedCount / targetQuota) * 100));

        return {
            ...item,
            userSolvedCount,
            userAccuracy,
            coverageDepthPct
        };
    }).sort((a, b) => b.totalQuestions - a.totalQuestions);
}

/**
 * Computes the 4-Quadrant High-Yield Coverage Matrix with depth percentage
 */
export function getCoverageQuadrantItems(
    userProfile: UserProfile,
    examType: 'JEE Mains' | 'JEE Advanced' = 'JEE Mains',
    logs: QuestionLog[] = []
): CoverageQuadrantItem[] {
    const dataset = examType === 'JEE Mains' ? JEE_MAINS_PYQ_DATA : JEE_ADVANCED_PYQ_DATA;
    
    // Threshold for High Frequency: >= 1.1 questions per paper
    const HIGH_FREQ_THRESHOLD = 1.1;

    return dataset.map(item => {
        const syllabusItem = userProfile.syllabus?.[item.chapter];
        const hasSyllabusComplete = syllabusItem?.status === SyllabusStatus.Completed;
        const chapLogs = logs.filter(l => {
            const topic = (l.topic || '').toLowerCase();
            const ch = item.chapter.toLowerCase();
            return topic.includes(ch) || ch.includes(topic);
        });
        
        const solvedCount = chapLogs.length;
        const targetCount = item.avgQuestionsPerPaper >= HIGH_FREQ_THRESHOLD ? 25 : 15;
        const coveragePercent = Math.min(100, Math.round((solvedCount / targetCount) * 100));
        
        // Chapter is considered covered if marked complete OR at least 60% of target PYQs solved
        const isCovered = hasSyllabusComplete || coveragePercent >= 60;
        const isHighFreq = item.avgQuestionsPerPaper >= HIGH_FREQ_THRESHOLD;

        let quadrant: CoverageQuadrantItem['quadrant'];
        if (isHighFreq && isCovered) {
            quadrant = 'High Freq + Covered';
        } else if (isHighFreq && !isCovered) {
            quadrant = 'High Freq + Uncovered';
        } else if (!isHighFreq && isCovered) {
            quadrant = 'Low Freq + Covered';
        } else {
            quadrant = 'Low Freq + Uncovered';
        }

        // Marks per question (4 in Mains, ~3.5 in Advanced)
        const markMultiplier = examType === 'JEE Advanced' ? 3.5 : 4.0;
        const avgMarksPerPaper = parseFloat((item.avgQuestionsPerPaper * markMultiplier).toFixed(1));

        return {
            chapter: item.chapter,
            subject: item.subject,
            frequencyScore: Math.min(100, Math.round((item.totalQuestions / 228) * 100)),
            isCovered,
            quadrant,
            avgMarksPerPaper,
            solvedCount,
            targetCount,
            coveragePercent,
            syllabusStatus: item.syllabusStatus
        };
    });
}

/**
 * Computes Overall Syllabus Alignment with JEE Distribution (0 - 100)
 */
export function computeCoverageGapScore(
    userProfile: UserProfile,
    examType: 'JEE Mains' | 'JEE Advanced' = 'JEE Mains',
    logs: QuestionLog[] = []
): number {
    const items = getCoverageQuadrantItems(userProfile, examType, logs);
    if (items.length === 0) return 75;

    // Filter only active syllabus items (exclude pruned topics from penalizing score)
    const activeItems = items.filter(i => i.syllabusStatus !== 'Pruned / Deleted by NTA');
    const highFreqItems = activeItems.filter(i => i.quadrant === 'High Freq + Covered' || i.quadrant === 'High Freq + Uncovered');
    
    if (highFreqItems.length === 0) return 80;

    const coveredHighFreq = highFreqItems.filter(i => i.isCovered).length;
    return Math.round((coveredHighFreq / highFreqItems.length) * 100);
}

/**
 * Retrieves Trending Topics for exam preparation
 */
export function getTrendingTopics(
    examType: 'JEE Mains' | 'JEE Advanced' = 'JEE Mains',
    limit: number = 88
): PYQChapterMetadata[] {
    const dataset = examType === 'JEE Mains' ? JEE_MAINS_PYQ_DATA : JEE_ADVANCED_PYQ_DATA;
    return dataset
        .filter(d => d.syllabusStatus !== 'Pruned / Deleted by NTA')
        .sort((a, b) => b.predictedNextShiftProb - a.predictedNextShiftProb)
        .slice(0, limit);
}

/**
 * Returns Summary Statistics for NTA 2024-2026 Syllabus Reduction
 */
export function getSyllabusPruningSummary(examType: 'JEE Mains' | 'JEE Advanced' = 'JEE Mains') {
    const dataset = examType === 'JEE Mains' ? JEE_MAINS_PYQ_DATA : JEE_ADVANCED_PYQ_DATA;
    const prunedList = dataset.filter(d => d.syllabusStatus === 'Pruned / Deleted by NTA');
    const modifiedList = dataset.filter(d => d.syllabusStatus === 'Partially Modified');
    const activeList = dataset.filter(d => d.syllabusStatus === 'Active Core');

    return {
        totalChapters: dataset.length,
        prunedChaptersCount: prunedList.length,
        modifiedChaptersCount: modifiedList.length,
        activeCoreChaptersCount: activeList.length,
        prunedChapters: prunedList.map(p => ({
            chapter: p.chapter,
            subject: p.subject,
            historicalQuestions: p.totalQuestions,
            note: p.prunedTopics?.join(', ') || 'Entire chapter pruned'
        })),
        modifiedChapters: modifiedList.map(m => ({
            chapter: m.chapter,
            subject: m.subject,
            prunedSubtopics: m.prunedTopics || []
        }))
    };
}
