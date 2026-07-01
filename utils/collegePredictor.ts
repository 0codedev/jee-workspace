// JEE Mains Historical Cutoff & College Benchmark Dataset (2019-2024)

export interface CutoffEntry {
    category: 'General' | 'OBC' | 'EWS' | 'SC' | 'ST';
    year: number;
    cutoffPercentile: number;
    cutoffMarks: number;
}

export interface CollegeOption {
    college: string;
    branch: string;
    closingRank: number;
    minMarks: number;
}

export const JEE_CUTOFFS: CutoffEntry[] = [
    { category: 'General', year: 2024, cutoffPercentile: 93.2, cutoffMarks: 112 },
    { category: 'General', year: 2023, cutoffPercentile: 90.7, cutoffMarks: 104 },
    { category: 'General', year: 2022, cutoffPercentile: 88.4, cutoffMarks: 94 },
    { category: 'OBC', year: 2024, cutoffPercentile: 79.6, cutoffMarks: 82 },
    { category: 'OBC', year: 2023, cutoffPercentile: 73.6, cutoffMarks: 74 },
    { category: 'EWS', year: 2024, cutoffPercentile: 81.3, cutoffMarks: 86 },
    { category: 'SC', year: 2024, cutoffPercentile: 60.1, cutoffMarks: 52 },
    { category: 'ST', year: 2024, cutoffPercentile: 46.7, cutoffMarks: 40 },
];

export const TOP_COLLEGES: CollegeOption[] = [
    { college: 'NIT Trichy', branch: 'Computer Science', closingRank: 1200, minMarks: 240 },
    { college: 'NIT Surathkal', branch: 'Computer Science', closingRank: 1800, minMarks: 230 },
    { college: 'NIT Warangal', branch: 'Electronics & Comm.', closingRank: 4500, minMarks: 210 },
    { college: 'NIT Rourkela', branch: 'Mechanical Eng.', closingRank: 12000, minMarks: 175 },
    { college: 'IIIT Hyderabad', branch: 'Computer Science', closingRank: 1000, minMarks: 250 },
    { college: 'MNNIT Allahabad', branch: 'Electrical Eng.', closingRank: 9000, minMarks: 185 },
    { college: 'VNIT Nagpur', branch: 'Civil Eng.', closingRank: 22000, minMarks: 145 },
    { college: 'BIT Mesra', branch: 'Computer Science', closingRank: 16000, minMarks: 160 },
];

export const getPredictedColleges = (userMarks: number): CollegeOption[] => {
    return TOP_COLLEGES.filter(c => userMarks >= c.minMarks - 20);
};
