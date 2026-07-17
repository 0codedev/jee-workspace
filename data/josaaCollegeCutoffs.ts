// ============================================================================
// Official JoSAA Cutoffs Database (Active 2024 Final Round)
// Extracted from official NIC JoSAA servers: 23 IITs, 31 NITs, 26 IIITs
// ============================================================================

import rawCutoffs from './josaaCollegeCutoffs.json';

export interface CollegeCutoffRecord {
    id: string;
    institute: string;
    instituteFull: string;
    academicProgram: string;
    branchCode: 'CSE' | 'AI/DS' | 'ECE' | 'EEE' | 'MECH' | 'CIVIL' | 'CHEM' | 'OTHER' | string;
    quota: 'HS' | 'OS' | 'AI' | 'GO' | 'JK' | 'LA' | string;
    seatType: 'OPEN' | 'OBC-NCL' | string;
    gender: 'Gender-Neutral' | 'Female-only (including Supernumerary)' | string;
    openingRank: number;
    closingRank: number;
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
    location: string;
    state: string;
    type: 'IIT' | 'NIT' | 'IIIT';
    avgPackageLpa: number;
    nirfRank?: number;
    year: number;
    round: number;
}

export const JOSAA_COLLEGE_CUTOFFS = rawCutoffs as CollegeCutoffRecord[];
