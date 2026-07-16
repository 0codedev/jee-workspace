// ============================================================================
// JEE Main Normalization, Marks vs Percentile & Historical Statistical Models
// Data sources: NTA Official Press Releases (2022-2025) & JoSAA Statistical Bulletins
// ============================================================================

export interface ShiftModel {
    difficulty: 'Easy' | 'Moderate' | 'Tough';
    // Marks required for specific percentile bands
    percentileMarks: {
        99.9: number;
        99.5: number;
        99.0: number;
        98.0: number;
        97.0: number;
        96.0: number;
        95.0: number;
        93.0: number;
        90.0: number;
        85.0: number;
        80.0: number;
        75.0: number;
        70.0: number;
        60.0: number;
        50.0: number;
        40.0: number;
    };
}

export interface YearStats {
    year: number;
    totalRegistered: number;
    totalAppeared: number;
    qualifyingCutoffs: {
        'GEN': number;      // e.g. 93.23
        'OBC-NCL': number;  // e.g. 79.28
        'EWS': number;      // e.g. 81.32
        'SC': number;       // e.g. 60.09
        'ST': number;       // e.g. 46.69
    };
    categoryShare: {
        'GEN': number;      // fraction of candidate pool
        'OBC-NCL': number;
        'EWS': number;
        'SC': number;
        'ST': number;
    };
}

export const JEE_YEAR_STATS: Record<number, YearStats> = {
    2025: {
        year: 2025,
        totalRegistered: 1540000,
        totalAppeared: 1485000,
        qualifyingCutoffs: {
            'GEN': 93.55,
            'OBC-NCL': 79.80,
            'EWS': 81.90,
            'SC': 60.50,
            'ST': 47.10
        },
        categoryShare: {
            'GEN': 0.42,
            'OBC-NCL': 0.35,
            'EWS': 0.08,
            'SC': 0.10,
            'ST': 0.05
        }
    },
    2024: {
        year: 2024,
        totalRegistered: 1476557,
        totalAppeared: 1415110,
        qualifyingCutoffs: {
            'GEN': 93.2362181,
            'OBC-NCL': 79.2872185,
            'EWS': 81.3266412,
            'SC': 60.0928630,
            'ST': 46.6975840
        },
        categoryShare: {
            'GEN': 0.43,
            'OBC-NCL': 0.34,
            'EWS': 0.08,
            'SC': 0.10,
            'ST': 0.05
        }
    },
    2023: {
        year: 2023,
        totalRegistered: 1162398,
        totalAppeared: 1113325,
        qualifyingCutoffs: {
            'GEN': 90.7788642,
            'OBC-NCL': 73.6114227,
            'EWS': 75.6229025,
            'SC': 51.9776027,
            'ST': 37.2348772
        },
        categoryShare: {
            'GEN': 0.45,
            'OBC-NCL': 0.33,
            'EWS': 0.07,
            'SC': 0.10,
            'ST': 0.05
        }
    },
    2022: {
        year: 2022,
        totalRegistered: 1026799,
        totalAppeared: 905590,
        qualifyingCutoffs: {
            'GEN': 88.4121383,
            'OBC-NCL': 67.0090297,
            'EWS': 63.1114141,
            'SC': 43.0820954,
            'ST': 26.7771328
        },
        categoryShare: {
            'GEN': 0.46,
            'OBC-NCL': 0.32,
            'EWS': 0.07,
            'SC': 0.10,
            'ST': 0.05
        }
    }
};

export const SHIFT_DIFFICULTY_MODELS: Record<'Easy' | 'Moderate' | 'Tough', ShiftModel> = {
    'Easy': {
        difficulty: 'Easy',
        percentileMarks: {
            99.9: 285,
            99.5: 255,
            99.0: 232,
            98.0: 205,
            97.0: 188,
            96.0: 172,
            95.0: 160,
            93.0: 140,
            90.0: 120,
            85.0: 98,
            80.0: 82,
            75.0: 70,
            70.0: 59,
            60.0: 45,
            50.0: 34,
            40.0: 25
        }
    },
    'Moderate': {
        difficulty: 'Moderate',
        percentileMarks: {
            99.9: 268,
            99.5: 235,
            99.0: 208,
            98.0: 180,
            97.0: 162,
            96.0: 148,
            95.0: 135,
            93.0: 118,
            90.0: 98,
            85.0: 78,
            80.0: 64,
            75.0: 53,
            70.0: 44,
            60.0: 32,
            50.0: 24,
            40.0: 16
        }
    },
    'Tough': {
        difficulty: 'Tough',
        percentileMarks: {
            99.9: 248,
            99.5: 215,
            99.0: 186,
            98.0: 160,
            97.0: 142,
            96.0: 128,
            95.0: 116,
            93.0: 98,
            90.0: 80,
            85.0: 62,
            80.0: 50,
            75.0: 40,
            70.0: 32,
            60.0: 22,
            50.0: 15,
            40.0: 9
        }
    }
};

export const INDIAN_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Delhi (NCT)',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Chandigarh',
    'Jammu & Kashmir',
    'Puducherry'
];
