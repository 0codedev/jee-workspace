// ============================================================================
// Predictive Weak Zone & Retention Decay Service
// Mathematical Ebbinghaus Forgetting Curve, FSRS & Memory Half-Life Engine
// ============================================================================

import { RetentionScore, WeakZoneRadarPoint, UserProfile, QuestionLog, QuestionStatus, SyllabusStatus, DailyTask, TaskType, TaskEffort } from '../types';
import { JEE_SYLLABUS } from '../constants';

// Canonical JEE Exam Weightage Map (All 88+ Chapters)
const AUTHENTIC_CHAPTER_WEIGHTAGES: Record<string, 'Very High' | 'High' | 'Medium' | 'Low'> = {
    // --- PHYSICS (31 Chapters) ---
    'Math in Physics': 'Low',
    'Units & Dimensions': 'Low',
    'Motion in 1D': 'Low',
    'Motion in 2D': 'Medium',
    'Laws of Motion': 'High',
    'Work Power Energy': 'High',
    'COM & Collisions': 'High',
    'Rotational Motion': 'Very High',
    'Gravitation': 'Medium',
    'Properties of Solids': 'Low',
    'Properties of Fluids': 'Medium',
    'Oscillations': 'High',
    'Waves & Sound': 'Medium',
    'Thermal Properties': 'Medium',
    'Thermodynamics': 'Very High',
    'KTG': 'Medium',
    'Electrostatics': 'Very High',
    'Capacitance': 'High',
    'Current Electricity': 'Very High',
    'Magnetic Properties': 'Low',
    'Magnetism & Current': 'Very High',
    'EMI': 'High',
    'AC Circuits': 'High',
    'EM Waves': 'Medium',
    'Ray Optics': 'Very High',
    'Wave Optics': 'Medium',
    'Dual Nature': 'High',
    'Atomic Physics': 'High',
    'Nuclear Physics': 'High',
    'Semiconductors': 'Very High',
    'Experimental Physics': 'Medium',

    // --- CHEMISTRY (32 Chapters) ---
    'Mole Concept': 'Medium',
    'Atomic Structure': 'High',
    'States of Matter': 'Low',
    'Thermodynamics (C)': 'Very High',
    'Chemical Equilibrium': 'Medium',
    'Ionic Equilibrium': 'Very High',
    'Redox Reactions': 'Low',
    'Periodic Table': 'High',
    'Chemical Bonding': 'Very High',
    'Hydrogen': 'Low',
    's Block': 'Low',
    'p Block (G13-14)': 'Medium',
    'GOC': 'Very High',
    'Hydrocarbons': 'Very High',
    'Solid State': 'Low',
    'Solutions': 'High',
    'Electrochemistry': 'Very High',
    'Chemical Kinetics': 'High',
    'Surface Chemistry': 'Low',
    'Metallurgy': 'Low',
    'p Block (G15-18)': 'Very High',
    'd & f Block': 'High',
    'Coordination Compounds': 'Very High',
    'Practical Chemistry': 'Medium',
    'Haloalkanes & Haloarenes': 'High',
    'Alcohols, Phenols & Ethers': 'Very High',
    'Aldehydes & Ketones': 'Very High',
    'Carboxylic Acids': 'High',
    'Amines': 'High',
    'Biomolecules': 'High',
    'Polymers': 'Low',
    'Everyday Chemistry': 'Low',

    // --- MATHS (29 Chapters) ---
    'Quadratic Equations': 'High',
    'Complex Numbers': 'Very High',
    'P&C': 'High',
    'Sequences & Series': 'High',
    'Binomial Theorem': 'High',
    'Statistics': 'Medium',
    'Matrices': 'Very High',
    'Determinants': 'High',
    'Probability': 'Very High',
    'Limits': 'High',
    'Sets & Relations': 'Medium',
    'Functions': 'Very High',
    'C&D': 'High',
    'Differentiation': 'Medium',
    'AOD': 'Very High',
    'Indefinite Integration': 'High',
    'Definite Integration': 'Very High',
    'Area Under Curves': 'High',
    'Differential Eqns': 'Very High',
    'Straight Lines': 'High',
    'Circle': 'High',
    'Parabola': 'High',
    'Ellipse': 'Medium',
    'Hyperbola': 'Medium',
    'Trigonometry': 'Medium',
    'Trigonometric Functions': 'High',
    'ITF': 'Medium',
    'Vector Algebra': 'Very High',
    '3D Geometry': 'Very High'
};

// Map units to Class 11 vs Class 12
const CLASS_11_UNITS = new Set([
    'Mechanics 1', 'Mechanics 2', 'Oscillations & Waves', 'Thermodynamics',
    'Physical Chemistry 1', 'Inorganic Chemistry 1', 'Organic Chemistry 1',
    'Algebra', 'Coordinate Geometry', 'Trigonometry'
]);

/**
 * Computes Ebbinghaus memory retention score and half-life for a single chapter
 */
export function computeChapterRetention(
    chapter: string,
    subject: 'Physics' | 'Chemistry' | 'Maths',
    unitName: string,
    userProfile: UserProfile,
    logs: QuestionLog[] = []
): RetentionScore {
    const chapterLogs = logs.filter(l => {
        const topic = (l.topic || '').toLowerCase();
        const ch = chapter.toLowerCase();
        return topic.includes(ch) || ch.includes(topic);
    });

    const totalAttempts = chapterLogs.length;
    const correctAttempts = chapterLogs.filter(l => l.status === QuestionStatus.FullyCorrect).length;
    const errorCount = totalAttempts - correctAttempts;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 60;

    // Check syllabus progress in profile
    const syllabusItem = userProfile.syllabus?.[chapter];
    const isCompleted = syllabusItem?.status === SyllabusStatus.Completed;

    // Find most recent practice date
    let lastPracticeTimestamp = 0;
    chapterLogs.forEach(l => {
        const t = l.timestamp || 0;
        if (t > lastPracticeTimestamp) {
            lastPracticeTimestamp = t;
        }
    });

    // Check if user set lastRevised date in syllabus
    if (syllabusItem?.lastRevised) {
        const revisedTime = new Date(syllabusItem.lastRevised).getTime();
        if (revisedTime > lastPracticeTimestamp) {
            lastPracticeTimestamp = revisedTime;
        }
    }

    const now = Date.now();
    let daysSinceLastPractice = 14; // Baseline if unattempted

    if (lastPracticeTimestamp > 0) {
        daysSinceLastPractice = Math.max(0, Math.floor((now - lastPracticeTimestamp) / (1000 * 60 * 60 * 24)));
    } else if (isCompleted) {
        daysSinceLastPractice = 21; // Marked complete in syllabus but no recent test logs
    } else {
        daysSinceLastPractice = 30; // Not yet practiced
    }

    // Memory Stability Factor (S in days): Base 14 days
    // Boosted by spaced revision count, accuracy & practice volume
    const baseStability = 14;
    const revisionCount = syllabusItem?.revisionCount || 0;
    
    // Spaced repetition stability scaling: each revision expands memory stability
    const spacedRevisionMultiplier = 1.0 + (0.5 * Math.min(5, revisionCount)); 
    // Accuracy multiplier: High accuracy means stronger neural traces
    const accuracyMultiplier = 0.5 + (accuracy / 100) * 0.8; // 0.5 to 1.3
    // Volume multiplier: Practiced problems reinforce retrieval cues
    const volumeMultiplier = Math.min(1.8, 1.0 + (totalAttempts / 25)); 

    const stabilityS = Math.max(4, baseStability * spacedRevisionMultiplier * accuracyMultiplier * volumeMultiplier);

    // Ebbinghaus exponential decay formula: R(t) = e^(-t / S)
    const decayFraction = Math.exp(-daysSinceLastPractice / stabilityS);
    const retentionPercentage = Math.max(5, Math.min(100, Math.round(decayFraction * 100)));

    // Memory Half-Life (days until retention drops to 50%): t_1/2 = S * ln(2)
    const halfLifeDays = Math.round(stabilityS * 0.6931);

    // Optimal Spaced Review Window (target 70% retention threshold): t_70 = S * ln(1 / 0.70)
    const optimalThresholdDays = Math.round(stabilityS * 0.3567);
    const optimalReviewDays = Math.max(0, optimalThresholdDays - daysSinceLastPractice);

    // Project days until critical amnesia threshold (<45% retention): t_crit = S * ln(1 / 0.45)
    const criticalThresholdDays = Math.round(stabilityS * 0.7985);
    const daysUntilCritical = Math.max(0, criticalThresholdDays - daysSinceLastPractice);

    let status: 'Fresh' | 'Fading' | 'Critical Decay' | 'Unstudied' = 'Fresh';
    if (totalAttempts === 0 && !isCompleted && revisionCount === 0) {
        status = 'Unstudied';
    } else if (retentionPercentage >= 70) {
        status = 'Fresh';
    } else if (retentionPercentage >= 45) {
        status = 'Fading';
    } else {
        status = 'Critical Decay';
    }

    const jeeWeightage = AUTHENTIC_CHAPTER_WEIGHTAGES[chapter] || 'Medium';
    const classLevel: 'Class 11' | 'Class 12' = CLASS_11_UNITS.has(unitName) ? 'Class 11' : 'Class 12';

    return {
        chapter,
        subject,
        retentionPercentage,
        status,
        daysSinceLastPractice,
        totalAttempts,
        accuracy,
        errorCount,
        daysUntilCritical,
        jeeWeightage,
        decayFactor: parseFloat(decayFraction.toFixed(2)),
        halfLifeDays,
        optimalReviewDays,
        unit: unitName,
        classLevel
    };
}

/**
 * Computes Retention Scores for all Chapters across all 3 subjects from syllabus
 */
export function getAllChapterRetentionScores(
    userProfile: UserProfile,
    logs: QuestionLog[] = []
): RetentionScore[] {
    const results: RetentionScore[] = [];
    const subjects: Array<'Physics' | 'Chemistry' | 'Maths'> = ['Physics', 'Chemistry', 'Maths'];

    subjects.forEach(subject => {
        const units = (JEE_SYLLABUS as any)[subject.toLowerCase()] || [];
        units.forEach((unitObj: any) => {
            const unitName = unitObj.unit || 'General';
            const chapters = unitObj.chapters || [];

            chapters.forEach((c: any) => {
                const chapterName = c.name;
                const score = computeChapterRetention(chapterName, subject, unitName, userProfile, logs);
                results.push(score);
            });
        });
    });

    return results;
}

/**
 * Gets Top Chapters in Immediate Danger Zone (Critical Decay or Fading with High JEE Weightage)
 */
export function getTopDecayingChapters(
    allScores: RetentionScore[],
    limit: number = 6
): RetentionScore[] {
    const priorityWeight: Record<string, number> = {
        'Very High': 4,
        'High': 3,
        'Medium': 2,
        'Low': 1
    };

    return [...allScores]
        .filter(s => s.status === 'Critical Decay' || (s.status === 'Fading' && (s.jeeWeightage === 'Very High' || s.jeeWeightage === 'High')))
        .sort((a, b) => {
            const aSeverity = (100 - a.retentionPercentage) * (priorityWeight[a.jeeWeightage] || 1);
            const bSeverity = (100 - b.retentionPercentage) * (priorityWeight[b.jeeWeightage] || 1);
            return bSeverity - aSeverity;
        })
        .slice(0, limit);
}

/**
 * Formats data for Recharts Radar visualization (calibrated to prevent text crowding)
 */
export function getRadarChartData(
    scores: RetentionScore[],
    subject?: 'Physics' | 'Chemistry' | 'Maths'
): WeakZoneRadarPoint[] {
    let pool = scores;
    if (subject && subject !== undefined) {
        pool = pool.filter(s => s.subject === subject);
    }

    const priorityWeight: Record<string, number> = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    
    // Pick the most critical 8 chapters to keep radar readable and crisp
    const sorted = [...pool]
        .sort((a, b) => {
            const aScore = (100 - a.retentionPercentage) * (priorityWeight[a.jeeWeightage] || 1);
            const bScore = (100 - b.retentionPercentage) * (priorityWeight[b.jeeWeightage] || 1);
            return bScore - aScore;
        })
        .slice(0, 8);

    return sorted.map(s => ({
        subject: s.subject,
        chapter: s.chapter.length > 15 ? s.chapter.slice(0, 14) + '..' : s.chapter,
        retention: s.retentionPercentage,
        accuracy: s.accuracy,
        importance: (priorityWeight[s.jeeWeightage] || 2) * 25 // 25 to 100
    }));
}

/**
 * Generates a structured 15-minute quick diagnostic drill capsule for a decaying chapter
 */
export function generateMicroRevisionCapsule(chapter: RetentionScore) {
    const drillProtocols: Record<string, { duration: number; focus: string; questions: number; gain: number }> = {
        Physics: {
            duration: 15,
            focus: "Formula sheet recall + 5 standard PYQ direct application checks",
            questions: 5,
            gain: 35
        },
        Chemistry: {
            duration: 15,
            focus: "Reagent mechanisms / exception tables + 5 rapid fact-retrieval questions",
            questions: 6,
            gain: 40
        },
        Maths: {
            duration: 20,
            focus: "Standard substitution tricks + 4 multi-step calculation verification problems",
            questions: 4,
            gain: 30
        }
    };

    const proto = drillProtocols[chapter.subject] || drillProtocols.Physics;

    return {
        chapterName: chapter.chapter,
        subject: chapter.subject,
        durationMinutes: proto.duration,
        targetQuestions: proto.questions,
        focusStrategy: proto.focus,
        currentRetention: chapter.retentionPercentage,
        projectedRetention: Math.min(95, chapter.retentionPercentage + proto.gain),
        halfLifeExtendedDays: (chapter.halfLifeDays || 10) + 7
    };
}

/**
 * Builds a structured 3-Day Emergency Recovery Revision Schedule for the top decaying chapters
 */
export function generate3DayEmergencyRecoverySchedule(decayingChapters: RetentionScore[]): DailyTask[] {
    const today = new Date();
    const day1Str = new Date(today.getTime()).toISOString().split('T')[0];
    const day2Str = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const day3Str = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const days = [day1Str, day2Str, day3Str];
    const recoveryTasks: DailyTask[] = [];

    const top6 = decayingChapters.slice(0, 6);

    top6.forEach((chap, idx) => {
        const assignedDay = days[idx % 3];
        const dayLabel = idx % 3 === 0 ? 'Day 1 (Today)' : idx % 3 === 1 ? 'Day 2 (Tomorrow)' : 'Day 3';
        
        recoveryTasks.push({
            id: `retention-rescue-${chap.chapter.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${idx}`,
            text: `🚨 [Retention Reset] ${dayLabel}: 35m targeted drill on ${chap.chapter} (${chap.subject}) [${chap.retentionPercentage}% Retention]`,
            completed: false,
            estimatedTime: 35,
            taskType: TaskType.Revision,
            effort: TaskEffort.High,
            linkedTopic: chap.chapter,
            scheduledTime: dayLabel,
            isGhost: false
        });
    });

    return recoveryTasks;
}