// ============================================================================
// Rank Predictor & JoSAA College Probability Engine (Full-Page Component)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
    Award, TrendingUp, Sparkles, Building2, Search, 
    Filter, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, 
    Star, Compass, Sliders, ChevronDown, RefreshCw, BarChart2,
    MapPin, GraduationCap, DollarSign, ShieldCheck, X, RotateCcw,
    Layers, Check, Eye, History, TrendingDown, Minus, Info, ArrowRight, ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { TestReport, UserProfile, CollegeMatch, CollegeChance } from '../types';
import { INDIAN_STATES } from '../data/jeeRankData';
import { 
    generateRankPrediction, 
    getCollegeMatches, 
    calculateRankDelta,
    getHistoricalPercentileTrend,
    getHistoricalTrajectory,
    estimateAdvancedRank
} from '../services/rankPredictorService';
import { Modal } from './ui/Modal';

interface RankPredictorProps {
    reports: TestReport[];
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
    setView?: (view: any) => void;
}

export const RankPredictor: React.FC<RankPredictorProps> = ({
    reports,
    userProfile,
    onUpdateProfile,
    setView
}) => {
    // --- State ---
    const latestReport = reports && reports.length > 0 ? reports[reports.length - 1] : null;

    const [physicsMarks, setPhysicsMarks] = useState<number>(latestReport?.physics?.marks || 65);
    const [chemistryMarks, setChemistryMarks] = useState<number>(latestReport?.chemistry?.marks || 72);
    const [mathsMarks, setMathsMarks] = useState<number>(latestReport?.maths?.marks || 58);

    const [shiftDifficulty, setShiftDifficulty] = useState<'Easy' | 'Moderate' | 'Tough'>('Moderate');
    const [predictedYear, setPredictedYear] = useState<number>(2025);
    const [selectedCategory, setSelectedCategory] = useState<'GEN' | 'OBC-NCL' | 'EWS' | 'SC' | 'ST'>(
        userProfile.userCategory || 'GEN'
    );
    const [selectedState, setSelectedState] = useState<string>(
        userProfile.userState || 'Telangana'
    );

    // What-If Booster delta sliders
    const [boostPhysics, setBoostPhysics] = useState<number>(0);
    const [boostChemistry, setBoostChemistry] = useState<number>(0);
    const [boostMaths, setBoostMaths] = useState<number>(0);

    // College Matrix Filters & Search
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [chanceFilter, setChanceFilter] = useState<'all' | CollegeChance>('all');
    const [tierFilter, setTierFilter] = useState<'all' | 'Tier 1' | 'Tier 2' | 'Tier 3'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'IIT' | 'NIT' | 'IIIT'>('all');
    const [branchFilter, setBranchFilter] = useState<'all' | 'CSE' | 'AI' | 'ECE' | 'EE' | 'Mech' | 'Civil'>('all');
    const [quotaFilter, setQuotaFilter] = useState<'eligible' | 'all'>('eligible');
    const [sortBy, setSortBy] = useState<'closingRank' | 'package' | 'nirf' | 'openingRank'>('closingRank');
    const [wishlistOnly, setWishlistOnly] = useState<boolean>(false);
    const [selectedCollegeForTrend, setSelectedCollegeForTrend] = useState<CollegeMatch | null>(null);
    const [customAdvancedRank, setCustomAdvancedRank] = useState<number | undefined>(undefined);

    // --- Computed Prediction ---
    const prediction = useMemo(() => {
        return generateRankPrediction(
            physicsMarks,
            chemistryMarks,
            mathsMarks,
            shiftDifficulty,
            selectedCategory,
            predictedYear,
            selectedState
        );
    }, [physicsMarks, chemistryMarks, mathsMarks, shiftDifficulty, selectedCategory, predictedYear, selectedState]);

    // Estimated JEE Advanced rank for candidates targeting IITs
    const estimatedAdv = useMemo(() => {
        return estimateAdvancedRank(prediction.airMid);
    }, [prediction.airMid]);

    const activeAdvRank = customAdvancedRank !== undefined ? customAdvancedRank : estimatedAdv;

    // What-If Boosted Prediction
    const currentTotal = physicsMarks + chemistryMarks + mathsMarks;
    const boostedTotal = currentTotal + boostPhysics + boostChemistry + boostMaths;
    const boostDelta = useMemo(() => {
        return calculateRankDelta(currentTotal, boostedTotal, shiftDifficulty, predictedYear);
    }, [currentTotal, boostedTotal, shiftDifficulty, predictedYear]);

    // College Matches (Reacts to onlyEligibleQuota = quotaFilter === 'eligible' and activeAdvRank)
    const collegeMatches = useMemo(() => {
        const allMatches = getCollegeMatches(
            prediction.airMid, 
            selectedCategory, 
            selectedState, 
            'Gender-Neutral', 
            quotaFilter === 'eligible',
            activeAdvRank
        );
        return allMatches;
    }, [prediction.airMid, selectedCategory, selectedState, quotaFilter, activeAdvRank]);

    // Helper for branch classification
    const matchBranch = (prog: string, branch: string) => {
        const p = prog.toLowerCase();
        if (branch === 'all') return true;
        if (branch === 'CSE') return p.includes('computer') || p.includes('cse') || p.includes('information technology') || p.includes('software');
        if (branch === 'AI') return p.includes('artificial') || p.includes('data science') || p.includes('ai') || p.includes('machine learning');
        if (branch === 'ECE') return p.includes('electronics') || p.includes('communication') || p.includes('ece') || p.includes('telecommunication');
        if (branch === 'EE') return p.includes('electrical') || p.includes('ee');
        if (branch === 'Mech') return p.includes('mechanical') || p.includes('aerospace') || p.includes('production');
        if (branch === 'Civil') return p.includes('civil') || p.includes('metallurgy') || p.includes('mining') || p.includes('chemical') || p.includes('biotechnology');
        return true;
    };

    // Helper for search query matching with tokenization & exact type support
    const matchSearch = (c: CollegeMatch, query: string) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        
        // Exact institute type keywords
        if (q === 'nit' || q === 'nits') return c.type === 'NIT';
        if (q === 'iiit' || q === 'iiits') return c.type === 'IIIT';
        if (q === 'gfti' || q === 'gftis') return c.type === 'GFTI';

        // Match tokens
        const tokens = q.split(/\s+/).filter(Boolean);
        return tokens.every(token => {
            if (token === 'nit' || token === 'nits') return c.type === 'NIT' || c.institute.toLowerCase().includes('nit');
            if (token === 'iiit' || token === 'iiits') return c.type === 'IIIT' || c.institute.toLowerCase().includes('iiit');
            if (token === 'gfti' || token === 'gftis') return c.type === 'GFTI';
            if (token === 'cse' || token === 'cs') return matchBranch(c.academicProgram, 'CSE');
            if (token === 'ai' || token === 'ds') return matchBranch(c.academicProgram, 'AI');
            if (token === 'ece') return matchBranch(c.academicProgram, 'ECE');
            if (token === 'safe') return c.probability === 'safe';
            if (token === 'target' || token === 'border') return c.probability === 'border';
            if (token === 'reach') return c.probability === 'reach';
            
            return (
                c.institute.toLowerCase().includes(token) ||
                c.academicProgram.toLowerCase().includes(token) ||
                c.location.toLowerCase().includes(token) ||
                c.quota.toLowerCase().includes(token) ||
                c.tier.toLowerCase().includes(token)
            );
        });
    };

    // Dynamic Counts for Chance Filters
    const chanceCounts = useMemo(() => {
        const base = collegeMatches.filter(c => {
            if (!matchSearch(c, searchQuery)) return false;
            if (branchFilter !== 'all' && !matchBranch(c.academicProgram, branchFilter)) return false;
            if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
            if (typeFilter !== 'all' && c.type !== typeFilter) return false;
            if (wishlistOnly && (!userProfile.targetColleges || !userProfile.targetColleges.includes(c.id))) return false;
            return true;
        });

        return {
            all: base.length,
            safe: base.filter(c => c.probability === 'safe').length,
            border: base.filter(c => c.probability === 'border').length,
            reach: base.filter(c => c.probability === 'reach').length,
        };
    }, [collegeMatches, searchQuery, branchFilter, tierFilter, typeFilter, wishlistOnly, userProfile.targetColleges]);

    // Dynamic Counts for Type Filters
    const typeCounts = useMemo(() => {
        const base = collegeMatches.filter(c => {
            if (!matchSearch(c, searchQuery)) return false;
            if (branchFilter !== 'all' && !matchBranch(c.academicProgram, branchFilter)) return false;
            if (chanceFilter !== 'all' && c.probability !== chanceFilter) return false;
            if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
            if (wishlistOnly && (!userProfile.targetColleges || !userProfile.targetColleges.includes(c.id))) return false;
            return true;
        });

        return {
            all: base.length,
            IIT: base.filter(c => c.type === 'IIT').length,
            NIT: base.filter(c => c.type === 'NIT').length,
            IIIT: base.filter(c => c.type === 'IIIT').length,
        };
    }, [collegeMatches, searchQuery, branchFilter, chanceFilter, tierFilter, wishlistOnly, userProfile.targetColleges]);

    // Dynamic Counts for Branch Filters
    const branchCounts = useMemo(() => {
        const base = collegeMatches.filter(c => {
            if (!matchSearch(c, searchQuery)) return false;
            if (chanceFilter !== 'all' && c.probability !== chanceFilter) return false;
            if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
            if (typeFilter !== 'all' && c.type !== typeFilter) return false;
            if (wishlistOnly && (!userProfile.targetColleges || !userProfile.targetColleges.includes(c.id))) return false;
            return true;
        });

        return {
            all: base.length,
            CSE: base.filter(c => matchBranch(c.academicProgram, 'CSE')).length,
            AI: base.filter(c => matchBranch(c.academicProgram, 'AI')).length,
            ECE: base.filter(c => matchBranch(c.academicProgram, 'ECE')).length,
            EE: base.filter(c => matchBranch(c.academicProgram, 'EE')).length,
            Mech: base.filter(c => matchBranch(c.academicProgram, 'Mech')).length,
            Civil: base.filter(c => matchBranch(c.academicProgram, 'Civil')).length,
        };
    }, [collegeMatches, searchQuery, chanceFilter, tierFilter, typeFilter, wishlistOnly, userProfile.targetColleges]);

    // Filtered & Sorted Colleges
    const filteredColleges = useMemo(() => {
        return collegeMatches
            .filter(c => {
                if (!matchSearch(c, searchQuery)) return false;
                if (branchFilter !== 'all' && !matchBranch(c.academicProgram, branchFilter)) return false;
                if (chanceFilter !== 'all' && c.probability !== chanceFilter) return false;
                if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
                if (typeFilter !== 'all' && c.type !== typeFilter) return false;
                if (wishlistOnly && (!userProfile.targetColleges || !userProfile.targetColleges.includes(c.id))) return false;
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'closingRank') {
                    return a.closingRank - b.closingRank;
                }
                if (sortBy === 'openingRank') {
                    return a.openingRank - b.openingRank;
                }
                if (sortBy === 'package') {
                    return (b.avgPackageLpa || 0) - (a.avgPackageLpa || 0);
                }
                if (sortBy === 'nirf') {
                    return (a.nirfRank || 999) - (b.nirfRank || 999);
                }
                return 0;
            });
    }, [collegeMatches, searchQuery, branchFilter, chanceFilter, tierFilter, typeFilter, sortBy, wishlistOnly, userProfile.targetColleges]);

    const hasActiveFilters = searchQuery.trim() !== '' || chanceFilter !== 'all' || typeFilter !== 'all' || tierFilter !== 'all' || branchFilter !== 'all' || wishlistOnly || quotaFilter !== 'eligible';

    const handleResetFilters = () => {
        setSearchQuery('');
        setChanceFilter('all');
        setTypeFilter('all');
        setTierFilter('all');
        setBranchFilter('all');
        setWishlistOnly(false);
        setQuotaFilter('eligible');
        setSortBy('closingRank');
    };

    // Historical Trend Data
    const trendData = useMemo(() => {
        return getHistoricalPercentileTrend(reports, shiftDifficulty, predictedYear);
    }, [reports, shiftDifficulty, predictedYear]);

    // Handlers
    const handleAutofillFromLatest = () => {
        if (!latestReport) return;
        setPhysicsMarks(latestReport.physics?.marks || 0);
        setChemistryMarks(latestReport.chemistry?.marks || 0);
        setMathsMarks(latestReport.maths?.marks || 0);
    };

    const handleSync3MockAverage = () => {
        if (!reports || reports.length === 0) return;
        const recent = reports.slice(-3);
        const avgP = Math.round(recent.reduce((sum, r) => sum + (r.physics?.marks || 0), 0) / recent.length);
        const avgC = Math.round(recent.reduce((sum, r) => sum + (r.chemistry?.marks || 0), 0) / recent.length);
        const avgM = Math.round(recent.reduce((sum, r) => sum + (r.maths?.marks || 0), 0) / recent.length);
        setPhysicsMarks(avgP);
        setChemistryMarks(avgC);
        setMathsMarks(avgM);
    };

    const toggleWishlist = (collegeId: string) => {
        const currentList = userProfile.targetColleges || [];
        const updatedList = currentList.includes(collegeId)
            ? currentList.filter(id => id !== collegeId)
            : [...currentList, collegeId];
        
        onUpdateProfile(prev => ({
            ...prev,
            targetColleges: updatedList
        }));
    };

    const handleSaveCategoryAndState = (cat: 'GEN' | 'OBC-NCL' | 'EWS' | 'SC' | 'ST', st: string) => {
        setSelectedCategory(cat);
        setSelectedState(st);
        onUpdateProfile(prev => ({
            ...prev,
            userCategory: cat,
            userState: st
        }));
    };

    return (
        <div className="space-y-6">
            {/* 1. TOP HEADER & TELEMETRY STRIP */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
                            <span>Rank & College Predictor</span>
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap inline-flex items-center shrink-0">
                            JoSAA 2025
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                        Statistical normalization across 14.8L+ candidate sample with JoSAA seat probability matrix.
                    </p>
                </div>

                {/* Controls Bar: Shift, Year, Category & State */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Shift Selector */}
                    <div className="flex items-center rounded-xl bg-surface-2 border border-white/10 p-1 shrink-0">
                        {(['Easy', 'Moderate', 'Tough'] as const).map(shift => (
                            <button
                                key={shift}
                                onClick={() => setShiftDifficulty(shift)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    shiftDifficulty === shift
                                        ? shift === 'Easy' ? 'bg-amber-500 text-slate-950 shadow-md' :
                                          shift === 'Moderate' ? 'bg-cyan-500 text-slate-950 shadow-md' :
                                          'bg-rose-500 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {shift}
                            </button>
                        ))}
                    </div>

                    {/* Year Selector */}
                    <select
                        value={predictedYear}
                        onChange={e => setPredictedYear(Number(e.target.value))}
                        className="bg-surface-2 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500 shrink-0"
                    >
                        <option value={2025}>2025 (14.85L)</option>
                        <option value={2024}>2024 (14.15L)</option>
                        <option value={2023}>2023 (11.13L)</option>
                    </select>

                    {/* Category Selector */}
                    <select
                        value={selectedCategory}
                        onChange={e => handleSaveCategoryAndState(e.target.value as any, selectedState)}
                        className="bg-surface-2 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 shrink-0"
                    >
                        <option value="GEN">GEN (Open)</option>
                        <option value="OBC-NCL">OBC-NCL</option>
                        <option value="EWS">GEN-EWS</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                    </select>

                    {/* State Selector */}
                    <select
                        value={selectedState}
                        onChange={e => handleSaveCategoryAndState(selectedCategory, e.target.value)}
                        className="bg-surface-2 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500 max-w-[130px] shrink-0"
                    >
                        {INDIAN_STATES.map(st => (
                            <option key={st} value={st}>{st}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 2. TOP HERO ROW: SCORE INPUTS & BIG PREDICTION CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 2A: Score Input Box (5 Cols) */}
                <div className="lg:col-span-5 glass-panel border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-cyan-400" />
                                Subject Raw Scores
                            </h3>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {latestReport && (
                                    <button
                                        onClick={handleAutofillFromLatest}
                                        className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded-lg transition-colors"
                                        title={`Autofill with latest mock score (${latestReport.total?.marks || 0} marks)`}
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Latest Mock
                                    </button>
                                )}
                                {reports && reports.length >= 2 && (
                                    <button
                                        onClick={handleSync3MockAverage}
                                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2 py-1 rounded-lg transition-colors"
                                        title="Sync with 3-Mock Moving Average"
                                    >
                                        <BarChart2 className="w-3 h-3" />
                                        3-Mock Avg
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sliders */}
                        <div className="space-y-4">
                            {/* Physics */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-emerald-400 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Physics
                                    </span>
                                    <span className="text-white font-mono">{physicsMarks} / 100</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={physicsMarks}
                                    onChange={e => setPhysicsMarks(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                                />
                            </div>

                            {/* Chemistry */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-amber-400 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Chemistry
                                    </span>
                                    <span className="text-white font-mono">{chemistryMarks} / 100</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={chemistryMarks}
                                    onChange={e => setChemistryMarks(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                />
                            </div>

                            {/* Maths */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-rose-400 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-400"></span> Mathematics
                                    </span>
                                    <span className="text-white font-mono">{mathsMarks} / 100</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={mathsMarks}
                                    onChange={e => setMathsMarks(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Total Marks Pill */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Aggregated Total Score</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white font-mono tracking-tight">{prediction.rawMarks}</span>
                            <span className="text-xs text-slate-500 font-bold">/ 300</span>
                        </div>
                    </div>
                </div>

                {/* 2B: Hero Projected AIR & Percentile Display (7 Cols) */}
                <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                    {/* Background glow circle */}
                    <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
                                    <Award className="w-4 h-4" /> Estimated All India Rank (AIR)
                                </span>
                                <div className="flex items-baseline gap-3 mt-1">
                                    <span className="text-4xl md:text-5xl font-black text-white font-mono tracking-tight">
                                        #{prediction.airMid.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400 px-2 py-1 rounded bg-slate-800/80 border border-slate-700">
                                        Range: #{prediction.airLow.toLocaleString()} - #{prediction.airHigh.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Circular Percentile Indicator */}
                            <div className="text-right">
                                <span className="text-xs text-slate-400 font-bold block">NTA Percentile</span>
                                <span className="text-2xl md:text-3xl font-black text-cyan-300 font-mono">
                                    {prediction.percentile.toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        {/* Badges Strip */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            {selectedCategory !== 'GEN' && (
                                <div className="px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                                    <span>{selectedCategory} Category Rank:</span>
                                    <span className="font-mono font-black text-white">#{prediction.categoryRankMid.toLocaleString()}</span>
                                </div>
                            )}

                            {prediction.qualifiesForAdvanced ? (
                                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Eligible for JEE Advanced 2025</span>
                                </div>
                            ) : (
                                <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                    <span>Below {selectedCategory} Qualifying Cutoff</span>
                                </div>
                            )}

                            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-cyan-400" />
                                <span>{prediction.targetCollegeMatches} NIT/IIIT Seats within Safe Reach</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Quick Insight Banner */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>Based on {predictedYear} shift normalization with 14,85,000 candidate sample</span>
                        <span className="text-cyan-400 font-bold hover:underline cursor-pointer" onClick={() => {
                            const el = document.getElementById('college-table-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            View College Match List &darr;
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. WHAT-IF "RANK BOOSTER" DELTA SIMULATOR */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                        <span className="text-xs uppercase font-black tracking-widest text-indigo-400 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" /> What-If Performance Delta Simulator
                        </span>
                        <h3 className="text-lg font-black text-white mt-0.5">
                            Targeted Subject Improvements & AIR Jump Calculator
                        </h3>
                    </div>

                    {boostDelta.rankGain > 0 && (
                        <div className="px-4 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-lg animate-pulse">
                            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                            <span>+{boostDelta.marksDelta} Marks Gain</span>
                            <span className="text-white">➔ Jump ~{boostDelta.rankGain.toLocaleString()} Ranks!</span>
                        </div>
                    )}
                </div>

                {/* Booster Sliders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Boost Physics */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-emerald-300">+ Physics Marks</span>
                            <span className="font-mono text-white">+{boostPhysics} m</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            step="2"
                            value={boostPhysics}
                            onChange={e => setBoostPhysics(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                        />
                    </div>

                    {/* Boost Chemistry */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-amber-300">+ Chemistry Marks</span>
                            <span className="font-mono text-white">+{boostChemistry} m</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            step="2"
                            value={boostChemistry}
                            onChange={e => setBoostChemistry(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                    </div>

                    {/* Boost Maths */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-rose-300">+ Mathematics Marks</span>
                            <span className="font-mono text-white">+{boostMaths} m</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            step="2"
                            value={boostMaths}
                            onChange={e => setBoostMaths(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                        />
                    </div>
                </div>

                {/* Booster Summary */}
                {boostDelta.marksDelta > 0 && (
                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="text-slate-300">
                            Simulated Score: <span className="font-mono font-bold text-white">{boostedTotal} / 300</span> | 
                            Percentile Jump: <span className="font-mono font-bold text-cyan-300">+{boostDelta.percentileDelta.toFixed(2)}%</span> | 
                            Projected AIR: <span className="font-mono font-bold text-emerald-400">#{(prediction.airMid - boostDelta.rankGain).toLocaleString()}</span>
                        </div>
                        <button
                            onClick={() => {
                                setPhysicsMarks(prev => prev + boostPhysics);
                                setChemistryMarks(prev => prev + boostChemistry);
                                setMathsMarks(prev => prev + boostMaths);
                                setBoostPhysics(0);
                                setBoostChemistry(0);
                                setBoostMaths(0);
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs self-start md:self-auto transition-colors"
                        >
                            Apply As Base Score
                        </button>
                    </div>
                )}
            </div>

            {/* 4. HISTORICAL PERCENTILE & AIR PROGRESSION CHART */}
            {trendData.length > 1 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-cyan-400" />
                            Mock Test Percentile Trajectory
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">Across {trendData.length} Test Reports</span>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="testName" stroke="#64748b" fontSize={11} />
                                <YAxis domain={[40, 100]} stroke="#64748b" fontSize={11} unit="%" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                    formatter={(value: any, name: string) => {
                                        if (name === 'percentile') return [`${Number(value).toFixed(2)}%`, 'Percentile'];
                                        if (name === 'predictedAIR') return [`#${Number(value).toLocaleString()}`, 'Estimated AIR'];
                                        return [value, name];
                                    }}
                                />
                                <Line type="monotone" dataKey="percentile" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#22d3ee' }} name="percentile" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 5. JOSAA COLLEGE PROBABILITY MATRIX */}
            <div id="college-table-section" className="glass-panel border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4">
                {/* Header & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                JoSAA Official 9-Yr Archives (2016-2024)
                            </span>
                            <span className="text-xs text-slate-400 font-mono">Category: <strong className="text-slate-200">{selectedCategory}</strong> ({selectedState} HS)</span>
                            <span className="text-xs text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/80">
                                Mains AIR: #{prediction.airMid.toLocaleString()}
                            </span>
                            {prediction.qualifiesForAdvanced && (
                                <span className="text-xs text-purple-300 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/80 flex items-center gap-1.5">
                                    <span>Adv. AIR: #{activeAdvRank.toLocaleString()}</span>
                                    <button 
                                        onClick={() => {
                                            const val = prompt('Enter your estimated or target JEE Advanced AIR (used for IIT cutoffs):', activeAdvRank.toString());
                                            if (val && !isNaN(Number(val)) && Number(val) > 0) {
                                                setCustomAdvancedRank(Number(val));
                                            }
                                        }}
                                        className="text-[10px] underline text-purple-400 hover:text-white font-sans font-bold"
                                        title="Click to set custom target JEE Advanced Rank for IITs"
                                    >
                                        Edit
                                    </button>
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-cyan-400" />
                            Official JoSAA College Admission Engine
                        </h3>
                    </div>

                    {/* Search & Top Action Strip */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search Input */}
                        <div className="relative min-w-[220px] sm:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search NIT, IIIT, DTU, branch..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Sort Selector */}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-cyan-400 focus:outline-none cursor-pointer"
                        >
                            <option value="closingRank" className="bg-slate-900 text-slate-200">Sort: Best Rank</option>
                            <option value="openingRank" className="bg-slate-900 text-slate-200">Sort: Opening Rank</option>
                            <option value="package" className="bg-slate-900 text-slate-200">Sort: Top Package</option>
                            <option value="nirf" className="bg-slate-900 text-slate-200">Sort: NIRF Rank</option>
                        </select>

                        {/* Wishlist Button */}
                        <button
                            onClick={() => setWishlistOnly(!wishlistOnly)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                                wishlistOnly 
                                    ? 'bg-amber-500 text-slate-950 border-amber-400' 
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                        >
                            <Star className={`w-3.5 h-3.5 ${wishlistOnly ? 'fill-current' : ''}`} />
                            <span>Wishlist ({userProfile.targetColleges?.length || 0})</span>
                        </button>

                        {/* Reset Filters Shortcut */}
                        {hasActiveFilters && (
                            <button
                                onClick={handleResetFilters}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold flex items-center gap-1 border border-rose-500/30 transition-all"
                                title="Reset all filters"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Unified Single Filter Strip: Types, Chances, and Quotas */}
                <div className="flex items-center justify-between gap-3 flex-wrap border-y border-slate-800/80 py-2.5">
                    {/* Institute Types */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Type:</span>
                        {[
                            { id: 'all', label: `All (${typeCounts.all})` },
                            { id: 'IIT', label: `IITs (${typeCounts.IIT})` },
                            { id: 'NIT', label: `NITs (${typeCounts.NIT})` },
                            { id: 'IIIT', label: `IIITs (${typeCounts.IIIT})` },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTypeFilter(t.id as any)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    typeFilter === t.id
                                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                        : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Admission Probability Chances */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Zone:</span>
                        {[
                            { id: 'all', label: `All (${chanceCounts.all})`, activeCls: 'bg-slate-200 text-slate-950' },
                            { id: 'safe', label: `🟢 Safe (${chanceCounts.safe})`, activeCls: 'bg-emerald-500 text-slate-950' },
                            { id: 'border', label: `🟡 Target (${chanceCounts.border})`, activeCls: 'bg-amber-500 text-slate-950' },
                            { id: 'reach', label: `🔴 Reach (${chanceCounts.reach})`, activeCls: 'bg-rose-500 text-white' }
                        ].map(c => (
                            <button
                                key={c.id}
                                onClick={() => setChanceFilter(c.id as any)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    chanceFilter === c.id
                                        ? `${c.activeCls} shadow-sm`
                                        : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:text-white hover:bg-slate-900'
                                }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    {/* Quota Mode Switch */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Quota:</span>
                        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                            <button
                                onClick={() => setQuotaFilter('eligible')}
                                className={`px-2.5 py-0.5 rounded-md font-bold transition-all ${
                                    quotaFilter === 'eligible' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                                }`}
                                title="Show only quotas applicable to you (HS/OS/AI)"
                            >
                                Eligible Quota
                            </button>
                            <button
                                onClick={() => setQuotaFilter('all')}
                                className={`px-2.5 py-0.5 rounded-md font-bold transition-all ${
                                    quotaFilter === 'all' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                                }`}
                                title="Show all state quotas"
                            >
                                All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Branch Quick Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider shrink-0 mr-1">Branch:</span>
                    {[
                        { id: 'all', label: 'All Branches', count: branchCounts.all },
                        { id: 'CSE', label: '💻 Computer Science', count: branchCounts.CSE },
                        { id: 'AI', label: '🤖 AI / Data Science', count: branchCounts.AI },
                        { id: 'ECE', label: '⚡ Electronics (ECE)', count: branchCounts.ECE },
                        { id: 'EE', label: '🔌 Electrical (EE)', count: branchCounts.EE },
                        { id: 'Mech', label: '⚙️ Mechanical', count: branchCounts.Mech },
                        { id: 'Civil', label: '🏗️ Civil & Core', count: branchCounts.Civil }
                    ].map(b => (
                        <button
                            key={b.id}
                            onClick={() => setBranchFilter(b.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                                branchFilter === b.id
                                    ? 'bg-indigo-600 text-white border border-indigo-400 shadow-sm'
                                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                        >
                            {b.label} <span className="font-mono text-[10px] opacity-75">({b.count})</span>
                        </button>
                    ))}
                </div>

                {/* Active Results Summary */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div>
                        Showing <span className="font-bold text-white">{filteredColleges.length}</span> of <span className="font-mono text-cyan-300">{collegeMatches.length}</span> programs
                        {searchQuery && <span> matching &ldquo;<span className="text-white font-bold">{searchQuery}</span>&rdquo;</span>}
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={handleResetFilters}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* College Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredColleges.map((college) => {
                        const isWishlisted = userProfile.targetColleges?.includes(college.id);
                        const isSafe = college.probability === 'safe';
                        const isBorder = college.probability === 'border';
                        
                        // Calculate rank gap between student's evaluation rank and cutoff
                        const targetEvaluationRank = college.type === 'IIT'
                            ? (selectedCategory === 'OBC-NCL' ? Math.round(activeAdvRank * 0.35) : activeAdvRank)
                            : (selectedCategory === 'OBC-NCL' ? prediction.categoryRankMid : prediction.airMid);
                        const rankBuffer = college.closingRank - targetEvaluationRank;

                        return (
                            <div 
                                key={`${college.id}-${college.quota}-${college.seatType}`}
                                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-lg bg-slate-900/60 ${
                                    isSafe ? 'border-emerald-500/40 hover:border-emerald-500/80 shadow-emerald-950/20' :
                                    isBorder ? 'border-amber-500/40 hover:border-amber-500/80 shadow-amber-950/20' :
                                    'border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="space-y-2.5">
                                    {/* Top Card Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
                                                    {college.tier}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                                    college.type === 'IIT' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' :
                                                    college.type === 'NIT' ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60' :
                                                    'bg-purple-950/80 text-purple-300 border-purple-700/60'
                                                }`}>
                                                    {college.type}
                                                </span>
                                                {college.nirfRank && (
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        NIRF #{college.nirfRank}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-black text-white mt-1.5 line-clamp-1" title={college.institute}>
                                                {college.institute}
                                            </h4>
                                        </div>

                                        {/* Wishlist Star */}
                                        <button
                                            onClick={() => toggleWishlist(college.id)}
                                            className="p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                                            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                        >
                                            <Star className={`w-4 h-4 ${isWishlisted ? 'fill-amber-400 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`} />
                                        </button>
                                    </div>

                                    {/* Program / Branch */}
                                    <div className="text-xs font-semibold text-cyan-200 line-clamp-2" title={college.academicProgram}>
                                        {college.academicProgram}
                                    </div>

                                    {/* Location & Quota */}
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                        <span className="flex items-center gap-1 truncate">
                                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                            {college.location}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                            college.quota === 'HS' ? 'bg-blue-950/80 text-blue-300 border-blue-800/80' :
                                            college.quota === 'AI' ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80' :
                                            'bg-slate-950 text-slate-300 border-slate-800'
                                        }`}>
                                            {college.quota} Quota
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom Metadata & Probability Tag */}
                                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-mono text-slate-400">
                                                Cutoff: #{college.openingRank.toLocaleString()} - #{college.closingRank.toLocaleString()}
                                            </div>
                                            {rankBuffer > 0 ? (
                                                <div className="text-[10px] font-mono font-bold text-emerald-400 mt-0.5">
                                                    +{rankBuffer.toLocaleString()} rank safety buffer
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-mono font-bold text-rose-400 mt-0.5">
                                                    {Math.abs(rankBuffer).toLocaleString()} rank improvement needed
                                                </div>
                                            )}
                                            {college.avgPackageLpa && (
                                                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                                    <DollarSign className="w-3 h-3" />
                                                    Avg ₹{college.avgPackageLpa} LPA
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            {isSafe && (
                                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                    Safe (90%+)
                                                </span>
                                            )}
                                            {isBorder && (
                                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-sm">
                                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                                    Target (50-80%)
                                                </span>
                                            )}
                                            {!isSafe && !isBorder && (
                                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-950/60 text-rose-400 border border-rose-500/30">
                                                    Reach (&lt;50%)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 9-Year Historical Trend Button */}
                                    <button
                                        onClick={() => setSelectedCollegeForTrend(college)}
                                        className="w-full py-1.5 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm group"
                                    >
                                        <History className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-[-45deg] transition-transform" />
                                        <span>9-Year Cutoff Trend (2016-2024)</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Friendly Empty State */}
                {filteredColleges.length === 0 && (
                    <div className="py-10 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6">
                        <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                        <h4 className="text-sm font-bold text-white">No College Matches Found</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                            No institutions match all current filters ({typeFilter !== 'all' ? typeFilter : ''} {chanceFilter !== 'all' ? chanceFilter : ''} {branchFilter !== 'all' ? branchFilter : ''}).
                        </p>
                        <div className="flex justify-center gap-2 pt-1">
                            <button
                                onClick={handleResetFilters}
                                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 6. 9-YEAR HISTORICAL CUTOFF TREND MODAL */}
            {selectedCollegeForTrend && (
                <Modal
                    isOpen={Boolean(selectedCollegeForTrend)}
                    onClose={() => setSelectedCollegeForTrend(null)}
                    title="Official 9-Year JoSAA Cutoff Trajectory (2016 - 2024)"
                    maxWidth="5xl"
                >
                    <CollegeTrendContent
                        college={selectedCollegeForTrend}
                        studentRank={selectedCollegeForTrend.type === 'IIT' ? activeAdvRank : (selectedCategory === 'OBC-NCL' ? prediction.categoryRankMid : prediction.airMid)}
                        category={selectedCategory}
                        onClose={() => setSelectedCollegeForTrend(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

// ============================================================================
// 9-Year Historical Trajectory Component
// ============================================================================
interface CollegeTrendContentProps {
    college: CollegeMatch;
    studentRank: number;
    category: string;
    onClose: () => void;
}

const CollegeTrendContent: React.FC<CollegeTrendContentProps> = ({
    college,
    studentRank,
    category,
    onClose
}) => {
    const trajectory = useMemo(() => getHistoricalTrajectory(college), [college]);
    const { points, minRank, maxRank, trendDirection } = trajectory;
    const rankBuffer = college.closingRank - studentRank;
    const isSafe = rankBuffer > 0;

    return (
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
            {/* Top Info Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black border ${
                            college.type === 'IIT' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60' :
                            college.type === 'NIT' ? 'bg-cyan-950/90 text-cyan-300 border-cyan-700/60' :
                            'bg-purple-950/90 text-purple-300 border-purple-700/60'
                        }`}>
                            {college.type}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {college.tier}
                        </span>
                        {college.nirfRank && (
                            <span className="text-xs font-mono text-slate-400">
                                NIRF #{college.nirfRank}
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-950/80 text-blue-300 border border-blue-800/80">
                            {college.quota} Quota
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-950/80 text-amber-300 border border-amber-800/80">
                            {college.seatType}
                        </span>
                        <span className="text-xs text-slate-400">
                            {college.gender}
                        </span>
                    </div>
                    <h3 className="text-lg font-black text-white">{college.instituteFull || college.institute}</h3>
                    <p className="text-sm font-semibold text-cyan-300 mt-0.5">{college.academicProgram}</p>
                </div>

                <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block font-mono">2024 Closing Cutoff</span>
                    <span className="text-2xl font-black font-mono text-white">#{college.closingRank.toLocaleString()}</span>
                    <div className="mt-1">
                        {isSafe ? (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                +{rankBuffer.toLocaleString()} Safety Buffer
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-950/80 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                {Math.abs(rankBuffer).toLocaleString()} Rank Gap
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Metrics 4-Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-bold block">Your Predicted Rank</span>
                    <span className="text-base font-black font-mono text-cyan-300 mt-0.5 block">#{studentRank.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">{college.type === 'IIT' ? 'JEE Advanced AIR' : `${category} Rank`}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-bold block">9-Year Toughness Peak</span>
                    <span className="text-base font-black font-mono text-white mt-0.5 block">#{minRank.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">Most selective year</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-bold block">9-Year Lowest Cutoff</span>
                    <span className="text-base font-black font-mono text-white mt-0.5 block">#{maxRank.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">Most accessible year</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-bold block">Historical Trajectory</span>
                    <span className={`text-base font-black mt-0.5 flex items-center gap-1 ${
                        trendDirection === 'improving' ? 'text-amber-400' :
                        trendDirection === 'declining' ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                        {trendDirection === 'improving' && <TrendingUp className="w-4 h-4" />}
                        {trendDirection === 'declining' && <TrendingDown className="w-4 h-4" />}
                        {trendDirection === 'stable' && <Minus className="w-4 h-4" />}
                        {trendDirection === 'improving' ? 'Rising Demand' : trendDirection === 'declining' ? 'Easing Egress' : 'Stable'}
                    </span>
                    <span className="text-[10px] text-slate-500">Across {points.length} recorded years</span>
                </div>
            </div>

            {/* Recharts 9-Year Trajectory Line Chart */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-cyan-400" />
                        Historical Closing Rank Trend (2016 - 2024)
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                        Dashed Line = Your Predicted Rank (#{studentRank.toLocaleString()})
                    </span>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={points} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                            <YAxis 
                                stroke="#64748b" 
                                fontSize={11} 
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val}
                                domain={['dataMin - 500', 'dataMax + 500']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                formatter={(val: any, name: string) => {
                                    if (name === 'closingRank') return [`#${Number(val).toLocaleString()}`, 'Official Closing Cutoff'];
                                    return [val, name];
                                }}
                                labelFormatter={(label) => `JoSAA Final Round ${label}`}
                            />
                            <ReferenceLine 
                                y={studentRank} 
                                stroke="#22d3ee" 
                                strokeDasharray="5 5" 
                                strokeWidth={2}
                                label={{ value: `Your Rank: #${studentRank.toLocaleString()}`, position: 'top', fill: '#22d3ee', fontSize: 10 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="closingRank" 
                                stroke="#f59e0b" 
                                strokeWidth={3} 
                                dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#0f172a' }} 
                                activeDot={{ r: 7, fill: '#fbbf24' }}
                                name="closingRank" 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Year-by-Year Historical Breakdown Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                            <th className="py-2.5 px-4">Year</th>
                            <th className="py-2.5 px-4 font-mono">Official Closing Rank</th>
                            <th className="py-2.5 px-4">YoY Change</th>
                            <th className="py-2.5 px-4">Historical Verdict</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                        {points.map((p) => {
                            const cleared = studentRank <= p.closingRank;
                            const diff = p.closingRank - studentRank;
                            return (
                                <tr key={p.year} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="py-2.5 px-4 font-bold text-white font-mono">{p.year}</td>
                                    <td className="py-2.5 px-4 font-mono text-cyan-300 font-bold">#{p.closingRank.toLocaleString()}</td>
                                    <td className="py-2.5 px-4 font-mono text-slate-400">
                                        {p.changeYoY !== undefined ? (
                                            p.changeYoY > 0 ? (
                                                <span className="text-emerald-400 flex items-center gap-0.5">
                                                    +{p.changeYoY.toLocaleString()} (eased)
                                                </span>
                                            ) : p.changeYoY < 0 ? (
                                                <span className="text-amber-400 flex items-center gap-0.5">
                                                    {p.changeYoY.toLocaleString()} (harder)
                                                </span>
                                            ) : '0'
                                        ) : '--'}
                                    </td>
                                    <td className="py-2.5 px-4">
                                        {cleared ? (
                                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                                                <Check className="w-3 h-3 text-emerald-400" />
                                                Admitted (+{diff.toLocaleString()} buffer)
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
                                                <X className="w-3 h-3 text-rose-400" />
                                                Missed by {Math.abs(diff).toLocaleString()} ranks
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Official Verification Footer */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Verified Official NIC JoSAA Seat Allocation Database (2016 - 2024 Round 6)</span>
                </div>
                <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};
