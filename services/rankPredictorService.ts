// ============================================================================
// JEE Rank Predictor & JoSAA College Probability Engine Service
// Accurate statistical normalization, AIR estimation, and cutoffs matching
// ============================================================================

import { TestReport, CollegeMatch, RankPrediction, PercentileTrendPoint, CollegeChance } from '../types';
import { JEE_YEAR_STATS, SHIFT_DIFFICULTY_MODELS, YearStats } from '../data/jeeRankData';
import { JOSAA_COLLEGE_CUTOFFS, CollegeCutoffRecord } from '../data/josaaCollegeCutoffs';
import { JOSAA_HISTORICAL_TRAJECTORIES, HistoricalTrajectory } from '../data/josaaHistoricalTrends';

/**
 * Calculates NTA Percentile from raw score (0-300) using piecewise monotonic interpolation
 */
export function calculatePercentileFromMarks(
    rawMarks: number,
    shift: 'Easy' | 'Moderate' | 'Tough' = 'Moderate'
): number {
    const clampedMarks = Math.max(0, Math.min(300, rawMarks));
    const model = SHIFT_DIFFICULTY_MODELS[shift];
    const bands = model.percentileMarks;

    // Fixed anchors sorted descending by percentile
    const sortedThresholds: Array<{ p: number; m: number }> = [
        { p: 100.0, m: 300 },
        { p: 99.9, m: bands[99.9] },
        { p: 99.5, m: bands[99.5] },
        { p: 99.0, m: bands[99.0] },
        { p: 98.0, m: bands[98.0] },
        { p: 97.0, m: bands[97.0] },
        { p: 96.0, m: bands[96.0] },
        { p: 95.0, m: bands[95.0] },
        { p: 93.0, m: bands[93.0] },
        { p: 90.0, m: bands[90.0] },
        { p: 85.0, m: bands[85.0] },
        { p: 80.0, m: bands[80.0] },
        { p: 75.0, m: bands[75.0] },
        { p: 70.0, m: bands[70.0] },
        { p: 60.0, m: bands[60.0] },
        { p: 50.0, m: bands[50.0] },
        { p: 40.0, m: bands[40.0] },
        { p: 0.0, m: 0 }
    ];

    // Find the bounding segment
    for (let i = 0; i < sortedThresholds.length - 1; i++) {
        const upper = sortedThresholds[i];
        const lower = sortedThresholds[i + 1];

        if (clampedMarks >= lower.m) {
            if (upper.m === lower.m) return upper.p;
            const fraction = (clampedMarks - lower.m) / (upper.m - lower.m);
            const interpolated = lower.p + fraction * (upper.p - lower.p);
            return parseFloat(interpolated.toFixed(4));
        }
    }

    return 0.0;
}

/**
 * Estimates All India Rank (AIR) with confidence bounds
 */
export function estimateAIR(
    percentile: number,
    year: number = 2025
): { mid: number; low: number; high: number } {
    const stats: YearStats = JEE_YEAR_STATS[year] || JEE_YEAR_STATS[2025];
    const totalAppeared = stats.totalAppeared;

    const unroundedRank = Math.max(1, Math.round(((100 - percentile) / 100) * totalAppeared));
    
    // Confidence intervals (based on shift-to-shift variances of ~3-5%)
    const varianceFactor = percentile >= 99 ? 0.04 : (percentile >= 95 ? 0.06 : 0.08);
    const delta = Math.max(25, Math.round(unroundedRank * varianceFactor));

    return {
        mid: unroundedRank,
        low: Math.max(1, unroundedRank - delta),
        high: unroundedRank + delta
    };
}

/**
 * Estimates Category Rank (OBC-NCL, EWS, SC, ST)
 */
export function estimateCategoryRank(
    airMid: number,
    category: 'GEN' | 'OBC-NCL' | 'EWS' | 'SC' | 'ST' = 'GEN',
    year: number = 2025
): number {
    if (category === 'GEN') return airMid;
    const stats = JEE_YEAR_STATS[year] || JEE_YEAR_STATS[2025];
    const share = stats.categoryShare[category] || 0.35;
    return Math.max(1, Math.round(airMid * share));
}

/**
 * Generates Full Rank Prediction Object
 */
export function generateRankPrediction(
    physicsMarks: number,
    chemistryMarks: number,
    mathsMarks: number,
    shift: 'Easy' | 'Moderate' | 'Tough' = 'Moderate',
    category: 'GEN' | 'OBC-NCL' | 'EWS' | 'SC' | 'ST' = 'GEN',
    year: number = 2025,
    userState?: string
): RankPrediction {
    const rawMarks = physicsMarks + chemistryMarks + mathsMarks;
    const percentile = calculatePercentileFromMarks(rawMarks, shift);
    const airEstimates = estimateAIR(percentile, year);
    const categoryRank = estimateCategoryRank(airEstimates.mid, category, year);

    const stats = JEE_YEAR_STATS[year] || JEE_YEAR_STATS[2025];
    const cutoff = stats.qualifyingCutoffs[category] || 90.0;
    const qualifies = percentile >= cutoff;

    const matchedColleges = getCollegeMatches(airEstimates.mid, category, userState);

    return {
        rawMarks,
        physicsMarks,
        chemistryMarks,
        mathsMarks,
        percentile,
        airMid: airEstimates.mid,
        airLow: airEstimates.low,
        airHigh: airEstimates.high,
        categoryRankMid: categoryRank,
        predictedYear: year,
        shiftDifficulty: shift,
        qualifiesForAdvanced: qualifies,
        targetCollegeMatches: matchedColleges.filter(c => c.probability === 'safe' || c.probability === 'border').length
    };
}

/**
 * Estimates JEE Advanced Rank from JEE Mains Rank for students qualifying for Advanced
 */
export function estimateAdvancedRank(mainsRank: number): number {
    if (mainsRank <= 1000) return Math.max(1, Math.round(mainsRank * 0.9));
    if (mainsRank <= 5000) return Math.max(1, Math.round(mainsRank * 0.8));
    if (mainsRank <= 15000) return Math.max(1, Math.round(mainsRank * 0.7));
    if (mainsRank <= 30000) return Math.max(1, Math.round(mainsRank * 0.65));
    return Math.round(mainsRank * 0.6);
}

/**
 * Matches AIR & Category against JoSAA Cutoff database
 */
export function getCollegeMatches(
    airRank: number,
    category: 'GEN' | 'OBC-NCL' | 'EWS' | 'SC' | 'ST' = 'GEN',
    userState?: string,
    gender: 'Gender-Neutral' | 'Female-Only' = 'Gender-Neutral',
    onlyEligibleQuota: boolean = true,
    customAdvancedRank?: number
): CollegeMatch[] {
    const targetSeatType = category === 'OBC-NCL' ? 'OBC-NCL' : 'OPEN';
    const isObc = category === 'OBC-NCL';
    const evaluationRankMains = isObc ? estimateCategoryRank(airRank, 'OBC-NCL') : airRank;

    const baseAdvRank = customAdvancedRank || estimateAdvancedRank(airRank);
    const evaluationRankAdv = isObc ? estimateCategoryRank(baseAdvRank, 'OBC-NCL') : baseAdvRank;

    const seenIds = new Set<string>();
    return JOSAA_COLLEGE_CUTOFFS
        .filter((rec: CollegeCutoffRecord) => {
            if (seenIds.has(rec.id)) return false;
            seenIds.add(rec.id);

            // 1. Seat Type matching: match exact category or fallback to OPEN
            if (rec.seatType !== targetSeatType && !(category !== 'OBC-NCL' && rec.seatType === 'OPEN')) {
                return false;
            }

            // 2. Gender filtering
            if (gender === 'Gender-Neutral') {
                if (rec.gender.includes('Female-only')) return false;
            }

            // 3. Quota eligibility filtering
            if (!onlyEligibleQuota || !userState) return true;
            const isHomeState = rec.state.toLowerCase().trim() === userState.toLowerCase().trim();
            if (rec.quota === 'AI') return true;
            if (rec.quota === 'HS') return isHomeState;
            if (rec.quota === 'OS') return !isHomeState;
            return true;
        })
        .map((rec: CollegeCutoffRecord): CollegeMatch => {
            const isHomeState = userState && rec.state.toLowerCase().trim() === userState.toLowerCase().trim();
            const targetCutoff = rec.closingRank;
            const evaluationRank = rec.type === 'IIT' ? evaluationRankAdv : evaluationRankMains;

            let probability: CollegeChance = 'reach';
            if (evaluationRank <= targetCutoff * 0.85) {
                probability = 'safe';
            } else if (evaluationRank <= targetCutoff * 1.05) {
                probability = 'border';
            } else {
                probability = 'reach';
            }

            // Ineligible HS quota flag
            if (rec.quota === 'HS' && !isHomeState) {
                probability = 'reach';
            }

            return {
                id: rec.id,
                institute: rec.institute,
                instituteFull: rec.instituteFull,
                academicProgram: rec.academicProgram,
                branchCode: rec.branchCode,
                quota: rec.quota,
                seatType: rec.seatType,
                gender: rec.gender,
                openingRank: rec.openingRank,
                closingRank: rec.closingRank,
                probability,
                tier: rec.tier,
                location: rec.location,
                type: rec.type,
                avgPackageLpa: rec.avgPackageLpa,
                nirfRank: rec.nirfRank
            };
        });
}

/**
 * Calculates Rank Delta when student improves in specific subjects
 */
export function calculateRankDelta(
    currentMarks: number,
    improvedMarks: number,
    shift: 'Easy' | 'Moderate' | 'Tough' = 'Moderate',
    year: number = 2025
): { marksDelta: number; percentileDelta: number; rankGain: number } {
    const p1 = calculatePercentileFromMarks(currentMarks, shift);
    const p2 = calculatePercentileFromMarks(improvedMarks, shift);

    const r1 = estimateAIR(p1, year).mid;
    const r2 = estimateAIR(p2, year).mid;

    return {
        marksDelta: improvedMarks - currentMarks,
        percentileDelta: parseFloat((p2 - p1).toFixed(4)),
        rankGain: Math.max(0, r1 - r2)
    };
}

/**
 * Extracts historical test score progression and maps to estimated Percentile & AIR trend
 */
export function getHistoricalPercentileTrend(
    reports: TestReport[],
    shift: 'Easy' | 'Moderate' | 'Tough' = 'Moderate',
    year: number = 2025
): PercentileTrendPoint[] {
    if (!reports || reports.length === 0) return [];

    return [...reports]
        .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
        .map((r) => {
            const marks = r.total?.marks || 0;
            const percentile = calculatePercentileFromMarks(marks, shift);
            const air = estimateAIR(percentile, year).mid;

            return {
                testId: r.id,
                testName: r.testName,
                testDate: r.testDate,
                marks,
                percentile,
                predictedAIR: air
            };
        });
}

export interface TrajectoryPoint {
    year: number;
    closingRank: number;
    changeYoY?: number;
}

export interface HistoricalTrajectoryResult {
    points: TrajectoryPoint[];
    minRank: number;
    maxRank: number;
    trendDirection: 'improving' | 'declining' | 'stable';
    sourceCount: number;
}

/**
 * Extracts 9-Year Historical Cutoff Trajectory for any matched college program
 */
export function getHistoricalTrajectory(college: CollegeMatch): HistoricalTrajectoryResult {
    const isFemale = college.gender.toLowerCase().includes('female');
    const genderKey = isFemale ? 'Female-only (including Supernumerary)' : 'Gender-Neutral';

    // 1. Direct primary key lookup: "IIT Bombay::CSE::AI::OPEN::Gender-Neutral"
    const primaryKey = `${college.institute}::${college.branchCode || 'OTHER'}::${college.quota}::${college.seatType}::${genderKey}`;
    let entry = JOSAA_HISTORICAL_TRAJECTORIES[primaryKey];

    // 2. Relaxed fallbacks if specific branch or gender differs
    if (!entry) {
        const keys = Object.keys(JOSAA_HISTORICAL_TRAJECTORIES);
        const prefix = `${college.institute}::${college.branchCode || ''}`;
        const match = keys.find(k => k.startsWith(prefix) && k.includes(`::${college.quota}::`) && k.includes(`::${college.seatType}::`));
        if (match) {
            entry = JOSAA_HISTORICAL_TRAJECTORIES[match];
        }
    }

    if (!entry || !entry.history || Object.keys(entry.history).length === 0) {
        return {
            points: [{ year: 2024, closingRank: college.closingRank }],
            minRank: college.closingRank,
            maxRank: college.closingRank,
            trendDirection: 'stable',
            sourceCount: 1
        };
    }

    const years = Object.keys(entry.history).map(Number).sort((a, b) => a - b);
    const points: TrajectoryPoint[] = [];

    for (let i = 0; i < years.length; i++) {
        const yr = years[i];
        const rank = entry.history[yr.toString()];
        const prevRank = i > 0 ? entry.history[years[i - 1].toString()] : undefined;
        const changeYoY = prevRank ? rank - prevRank : undefined;
        points.push({ year: yr, closingRank: rank, changeYoY });
    }

    const ranks = points.map(p => p.closingRank);
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);

    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    if (points.length >= 2) {
        const first = points[0].closingRank;
        const last = points[points.length - 1].closingRank;
        if (last < first * 0.95) {
            trendDirection = 'improving'; // Closing rank decreased = higher competitiveness
        } else if (last > first * 1.05) {
            trendDirection = 'declining'; // Closing rank increased = eased competitiveness
        }
    }

    return {
        points,
        minRank,
        maxRank,
        trendDirection,
        sourceCount: points.length
    };
}
