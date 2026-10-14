/**
 * Historical NTA JEE Mains Score vs Percentile Conversion Data (2019 - 2024 Aggregate)
 * Marks out of 300
 */

export interface ScorePercentileMapping {
    minScore: number;
    maxScore: number;
    percentile: number;
    approxRank: number;
}

export const NTA_SCORE_PERCENTILE_TABLE: ScorePercentileMapping[] = [
    { minScore: 280, maxScore: 300, percentile: 99.99, approxRank: 150 },
    { minScore: 260, maxScore: 279, percentile: 99.95, approxRank: 600 },
    { minScore: 240, maxScore: 259, percentile: 99.85, approxRank: 1800 },
    { minScore: 220, maxScore: 239, percentile: 99.65, approxRank: 4200 },
    { minScore: 200, maxScore: 219, percentile: 99.30, approxRank: 8500 },
    { minScore: 180, maxScore: 199, percentile: 98.80, approxRank: 14500 },
    { minScore: 160, maxScore: 179, percentile: 98.00, approxRank: 24000 },
    { minScore: 140, maxScore: 159, percentile: 96.80, approxRank: 38000 },
    { minScore: 120, maxScore: 139, percentile: 95.00, approxRank: 60000 },
    { minScore: 100, maxScore: 119, percentile: 92.50, approxRank: 90000 },
    { minScore: 80,  maxScore: 99,  percentile: 88.00, approxRank: 145000 },
    { minScore: 60,  maxScore: 79,  percentile: 80.00, approxRank: 240000 },
    { minScore: 40,  maxScore: 59,  percentile: 68.00, approxRank: 380000 },
    { minScore: 0,   maxScore: 39,  percentile: 45.00, approxRank: 650000 }
];

/**
 * Converts a raw test score (out of 300) into estimated percentile and rank.
 */
export function getPercentileFromScore(score: number): { percentile: number; rank: number; rangeText: string } {
    const clampedScore = Math.max(0, Math.min(300, score));
    const entry = NTA_SCORE_PERCENTILE_TABLE.find(row => clampedScore >= row.minScore && clampedScore <= row.maxScore) || NTA_SCORE_PERCENTILE_TABLE[NTA_SCORE_PERCENTILE_TABLE.length - 1];

    // Linear interpolation within bucket
    const span = entry.maxScore - entry.minScore || 1;
    const offset = clampedScore - entry.minScore;
    const interpolatedPercentile = entry.percentile + (offset / span) * 0.15;

    return {
        percentile: Number(Math.min(100, interpolatedPercentile).toFixed(2)),
        rank: entry.approxRank,
        rangeText: `AIR ~${entry.approxRank.toLocaleString()}`
    };
}

/**
 * Month-adjustment factor: September mock test scores are typically 8-12% lower than January exam scores due to incomplete syllabus revision.
 */
export function getMonthAdjustedScore(score: number, currentMonthIndex: number = new Date().getMonth()): { adjustedScore: number; note: string } {
    // Current month 0-indexed: Sep = 8, Oct = 9, Nov = 10, Dec = 11, Jan = 0
    let multiplier = 1.0;
    let note = "Syllabus completed, peak performance phase.";

    if (currentMonthIndex === 8) { // September
        multiplier = 1.10;
        note = "September mock scores typically surge by +10% by January exam after full syllabus consolidation.";
    } else if (currentMonthIndex === 9) { // October
        multiplier = 1.08;
        note = "October scores typically increase by +8% before January exam.";
    } else if (currentMonthIndex === 10) { // November
        multiplier = 1.05;
        note = "November scores typically increase by +5% after test series calibration.";
    } else if (currentMonthIndex === 11) { // December
        multiplier = 1.02;
        note = "December final mock scores closely align with actual January Mains percentile.";
    }

    const adjustedScore = Math.min(300, Math.round(score * multiplier));

    return {
        adjustedScore,
        note
    };
}