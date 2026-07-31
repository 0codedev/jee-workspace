// ============================================================================
// Official JoSAA 9-Year Historical Trends Dictionary (2016 - 2024)
// ============================================================================

import rawTrends from './josaaHistoricalTrends.json';

export interface HistoricalTrajectory {
    institute: string;
    branchCode: string;
    quota: string;
    seatType: string;
    gender: string;
    history: Record<string, number>;
}

export const JOSAA_HISTORICAL_TRAJECTORIES = rawTrends as unknown as Record<string, HistoricalTrajectory>;
