/**
 * SuperMemo 2 (SM-2) Spaced Repetition Algorithm
 */

export interface SM2Input {
    repetitions: number; // Number of consecutive correct reviews
    easeFactor: number;  // Default: 2.5
    interval: number;    // Days until next review
    quality: number;     // 0-5 rating (0-2 fail, 3-5 pass)
}

export interface SM2Output {
    repetitions: number;
    easeFactor: number;
    interval: number;
    nextReviewDate: string; // ISO date string
}

export function calculateNextReview(input: SM2Input): SM2Output {
    let { repetitions, easeFactor, interval, quality } = input;

    // Quality clamp (0 to 5)
    quality = Math.max(0, Math.min(5, Math.round(quality)));

    // Ease Factor calculation: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    if (quality < 3) {
        // Failed review - reset repetitions
        repetitions = 0;
        interval = 1;
    } else {
        // Successful review
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    return {
        repetitions,
        easeFactor: Number(easeFactor.toFixed(2)),
        interval,
        nextReviewDate: nextDate.toISOString().split('T')[0]
    };
}
