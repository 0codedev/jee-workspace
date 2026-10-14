import React from 'react';
import { WidgetInfoData } from '../components/common/WidgetInfoModal';

export const WIDGET_HELP_DATA: Record<string, WidgetInfoData> = {
    scoreTrend: {
        title: 'Score Trend Chart',
        summary: 'Tracks your raw test scores over time alongside your regression line and target score.',
        meaning: 'Shows whether your performance is systematically improving, plateauing, or fluctuating wildly due to sleep or exam stress.',
        howToImprove: [
            'Log every mock test -- good or bad -- to keep the trajectory line accurate.',
            'Focus on the slope of the dotted regression line rather than single-day score jumps.',
            'If the line is flat for 3+ weeks, switch from studying theory to fixing Error DNA.'
        ],
        redFlags: [
            'Flat regression line for more than 21 days indicates a systemic strategy failure.',
            'High zigzag variance indicates performance is heavily dependent on exam day anxiety or sleep.'
        ],
        learnMoreId: 'what-is-this-app'
    },
    performanceTrend: {
        title: 'Performance Trend (Total Score)',
        summary: 'Tracks your total score across all tests, showing your overall performance trend over time.',
        meaning: 'Reveals whether your preparation is steadily raising your baseline score across full syllabus papers.',
        howToImprove: [
            'Compare scores across similar test types (e.g. Full Mock vs Full Mock).',
            'Look at the 3-test moving average to filter out single-paper difficulty spikes.',
            'Focus on raising your minimum score floor, not just peak scores.'
        ],
        redFlags: [
            'A downward slope across 3 consecutive tests is an urgent signal to review sleep & burnout risk.'
        ],
        learnMoreId: 'what-is-this-app'
    },
    masteryRings: {
        title: 'Subject Mastery Rings',
        summary: 'Three daily activity rings for Physics, Chemistry, and Mathematics (Apple Fitness style).',
        meaning: 'Fills based on questions attempted, difficulty weighting, and accuracy to ensure balanced daily study output across all 3 subjects.',
        howToImprove: [
            'Try to close all 3 rings every day before ending your study session.',
            'If one ring is consistently low, you are avoiding that subject -- which is costing you marks.',
            'Quick Log DPP practice sessions or complete SRS card reviews to fill rings.'
        ],
        redFlags: [
            'Leaving a subject ring below 30% for 3 consecutive days creates subject imbalance.'
        ],
        learnMoreId: 'what-is-this-app'
    },
    subjectMasteryRings: {
        title: 'Subject Mastery Rings',
        summary: 'Three daily activity rings for Physics, Chemistry, and Mathematics (Apple Fitness style).',
        meaning: 'Fills based on questions attempted, difficulty weighting, and accuracy to ensure balanced daily study output across all 3 subjects.',
        howToImprove: [
            'Try to close all 3 rings every day before ending your study session.',
            'If one ring is consistently low, you are avoiding that subject -- which is costing you marks.',
            'Quick Log DPP practice sessions or complete SRS card reviews to fill rings.'
        ],
        redFlags: [
            'Leaving a subject ring below 30% for 3 consecutive days creates subject imbalance.'
        ],
        learnMoreId: 'what-is-this-app'
    },
    rankPredictor: {
        title: 'JEE Rank & Percentile Predictor',
        summary: 'Statistical model calibrated on 2019-2024 NTA score-to-percentile data.',
        meaning: 'Projects your January score and percentile range based on your current score average and improvement rate (+marks/week).',
        howToImprove: [
            'Focus on increasing your weekly score trajectory (+2 to +3 marks/week).',
            'Eliminate E3 (calculation) and E5 (time panic) errors to narrow the confidence band.',
            'Check JoSAA college cutoffs in Deep Analysis to see your live seat buffer.'
        ],
        redFlags: [
            'If your target score gap is > 20 marks with under 8 weeks left, re-prioritize high-ROI chapters immediately.'
        ],
        learnMoreId: 'rank-predictor-explained'
    },
    percentilePredictor: {
        title: 'Percentile Predictor',
        summary: 'Projects your NTA percentile based on historical score-to-percentile distributions.',
        meaning: 'Helps you understand what raw score you need in January to hit 95%, 98%, or 99%ile.',
        howToImprove: [
            'Target +15 marks in Chemistry for the fastest percentile gain.',
            'Focus on accuracy (>80%) on easy/medium questions.'
        ],
        redFlags: [
            'Scoring high in mocks with relaxed timing does not translate to test day percentile. Enforce exam timers.'
        ],
        learnMoreId: 'rank-predictor-explained'
    },
    burnoutRisk: {
        title: 'Burnout Risk Monitor',
        summary: '14-day rolling index measuring study intensity, stress levels, error spikes, and rest gaps.',
        meaning: 'Warns when high study hours cause cognitive fatigue, increasing calculation (E3) and reading (E4) errors.',
        howToImprove: [
            'Take a lighter day when Burnout Risk enters Yellow (45-69) or Orange (70-84).',
            'Fill your 30-second daily wellness check-in honestly every morning.',
            'Remember: Resting when flagged increases your score on the next mock paper.'
        ],
        redFlags: [
            'Burnout Risk > 80 (Red Zone): Mandatory rest day required. Force-studying increases error rate by 35%.'
        ],
        learnMoreId: 'burnout-risk-explained'
    },
    todaysPlan: {
        title: "Today's AI-Generated Plan",
        summary: 'Time-blocked daily study plan generated by AI from your error history and syllabus gaps.',
        meaning: 'Eliminates decision fatigue by telling you exactly what chapter and topic to study during each hour.',
        howToImprove: [
            'Follow the plan in sequence, prioritizing high-ROI chapters first.',
            'Use Pomodoro timer with ambient sounds for deep work blocks.',
            'Regenerate the plan via AI Coach if your available hours change.'
        ],
        redFlags: [
            'Deviating from the AI plan to re-read easy topics you already know.'
        ],
        learnMoreId: 'what-is-this-app'
    },
    srsStatus: {
        title: 'Spaced Repetition (SRS) Engine',
        summary: 'SM-2 flashcard scheduler that queues weak questions right before memory decay occurs.',
        meaning: 'Converts mock test wrong answers into long-term memory cards automatically.',
        howToImprove: [
            'Review overdue cards daily -- hands-free via Voice SRS mode if commuting.',
            'Rate cards accurately (Got it / Almost / Wrong) to let the SM-2 algorithm schedule review dates.',
            'Clear overdue cards before starting new chapter study.'
        ],
        redFlags: [
            'Overdue queue > 40 cards: You are forgetting material faster than learning new topics.'
        ],
        learnMoreId: 'srs-boss-questions'
    },
    rootCause: {
        title: 'Root Cause & Error DNA Analysis',
        summary: '7-level micro-error classification system (E1 to E7) diagnosing why marks were lost.',
        meaning: 'Separates knowledge gaps (E1/E2) from execution slips (E3/E4/E5/E7) so you fix the true problem.',
        howToImprove: [
            'Tag every wrong question with E1-E7 code during test logging.',
            'Review your dominant error code every Sunday to drive next week strategy.',
            'If E3 (calculation) dominates, practice step-by-step arithmetic discipline.'
        ],
        redFlags: [
            'E7 (Overconfidence) errors rising: You are falling into trap attractors in papers.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    },
    recidivismTracker: {
        title: 'Error Recidivism Tracker',
        summary: 'Tracks topics and concepts where you make the SAME error code 3 or more times consecutively.',
        meaning: 'Identifies chronic bad habits (e.g. repeatedly getting Lenz\'s Law wrong due to E1, or repeatedly making sign errors in Definite Integrals due to E3).',
        howToImprove: [
            'Pick your top chronic recidivism item and run a 3-part Feynman session on it.',
            'Create 3 targeted Cloze SRS cards for that specific formula or rule.',
            'Do 10 practice questions on that topic with ZERO time pressure.'
        ],
        redFlags: [
            'Recidivism items staying in "Chronic" status for > 14 days mean your current practice method is not working.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    },
    chapterErrorHeatmap: {
        title: 'Chapter Error Heatmap (60 Chapters × E1-E7)',
        summary: 'Heatmap grid mapping syllabus chapters against E1-E7 error taxonomy codes.',
        meaning: 'Visually shows which chapters suffer from conceptual gaps (E1/E2) vs execution mistakes (E3/E4/E5). Darker red/purple cells indicate high error density.',
        howToImprove: [
            'Look for dark columns: If E3 (calculation) is dark across 5 chapters, fix intermediate step discipline.',
            'Look for dark rows: If a single chapter is dark across E1 and E2, re-learn that chapter from first principles.',
            'Click on any dark cell to filter Question Logs directly.'
        ],
        redFlags: [
            'High-ROI chapters with dark E1/E2 cells less than 60 days before exam day require immediate intervention.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    },
    conceptualKnowledgeGraph: {
        title: 'Dynamic Knowledge Graph',
        summary: 'Physics-simulated node map linking your weak topics against JEE syllabus prerequisite dependencies.',
        meaning: 'Reveals hidden prerequisite cascades -- e.g. showing that failing Rotational Dynamics is caused by an unresolved 52% score in Vectors & Kinematics.',
        howToImprove: [
            'Find glowing red nodes at the BOTTOM of a dependency line and fix those first.',
            'Fixing a root prerequisite automatically resolves downstream weak chapters.',
            'Drag nodes to organize topics by subject or difficulty.'
        ],
        redFlags: [
            'Studying advanced chapters while root prerequisite nodes are broken is a 3x waste of time.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    },
    dependencyAlerts: {
        title: 'Dependency Cascade Alerts',
        summary: 'Uses graph theory to detect weak chapters whose prerequisites are also broken.',
        meaning: 'Flags exact prerequisite traps where studying chapter B without fixing chapter A will yield zero improvement.',
        howToImprove: [
            'Always clear the foundational prerequisite flagged in the alert first.',
            'Spend 1 hour on first-principles theory of the prerequisite before touching the advanced topic.'
        ],
        redFlags: [
            'Ignoring dependency alerts leads to repeated E1 (Conceptual Gap) errors in mock tests.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    },
    weakestTopics: {
        title: 'Weakest Topics Analysis',
        summary: 'Ranks syllabus topics by total count of incorrect or partially correct question attempts.',
        meaning: 'Highlights your biggest mark-drainers across all logged test reports.',
        howToImprove: [
            'Target the top 3 topics on this list for your daily study plan.',
            'Solve the Boss Question for each of these topics to validate recovery.'
        ],
        redFlags: [
            'Topics remaining at the top of the list for > 3 weeks indicate ineffective study methods.'
        ],
        learnMoreId: 'srs-boss-questions'
    },
    speedVsAccuracy: {
        title: 'Speed vs. Accuracy Quadrant',
        summary: '4-quadrant scatter plot mapping your solving pace against your accuracy rate per topic.',
        meaning: 'Categorizes topics into: Mastery (Fast & Accurate), Conceptual Gaps (Slow & Wrong), Rushing/Guesses (Fast & Wrong), Needs Speed (Slow & Accurate).',
        howToImprove: [
            'For Slow & Accurate: Apply timed practice sets to build speed.',
            'For Fast & Wrong: Slow down by 15% to eliminate silly mistakes (E3/E4).',
            'For Slow & Wrong: Re-learn core concepts from scratch (E1).'
        ],
        redFlags: [
            'High concentration in Fast & Wrong quadrant indicates wild guessing under exam stress.'
        ],
        learnMoreId: 'radar-8d-explained'
    },
    errorFlowSankey: {
        title: 'Flow of Failure (Sankey Diagram)',
        summary: 'Visual flow diagram connecting Subject → Weak Chapter → Error Code (E1-E7).',
        meaning: 'Traces the exact "Path of Failure" showing where marks leak out of your paper.',
        howToImprove: [
            'Follow the thickest flow stream from left to right.',
            'If the thickest stream leads to E3 (calculation), focus on step-by-step arithmetic discipline.',
            'If it leads to E5 (time panic), adjust your section order in Paper Strategy.'
        ],
        redFlags: [
            'Thick streams flowing into E5 (Time Panic) mean you are spending >3 minutes on hard questions.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    },
    paretoAnalysis: {
        title: '80/20 Rule (Pareto Error Analysis)',
        summary: 'Ranks error counts by topic (bars) alongside cumulative impact percentage (line).',
        meaning: 'Applies the Pareto Principle: 80% of your lost marks come from 20% of your weak topics.',
        howToImprove: [
            'Focus exclusively on the 3-5 topics on the left side of the chart.',
            'Fixing those few topics will eliminate 80% of your overall mark losses.'
        ],
        redFlags: [
            'Spreading effort across 20+ topics instead of fixing the top 3 Pareto topics.'
        ],
        learnMoreId: 'what-is-this-app'
    },
    lostMarksWaterfall: {
        title: 'Lost Marks Waterfall Breakdown',
        summary: 'Visualizes the gap between your Potential Score (100% correct) and Actual Score.',
        meaning: 'Deconstructs your lost marks into exact buckets: Silly Mistakes, Conceptual Gaps, Time Panic, Unattempted, Negative Penalties.',
        howToImprove: [
            'Look at the largest bar drop. If "Silly Mistakes" is larger than "Conceptual Gaps", execution discipline gives an immediate +15-20 marks.',
            'Eliminate negative marks by improving question Selectivity.'
        ],
        redFlags: [
            'Negative marking penalty > 15 marks per test means your skip decisions need fixing.'
        ],
        learnMoreId: 'radar-8d-explained'
    },
    fatigueAnalysis: {
        title: 'Exam Fatigue Analysis (Question 1 to 90)',
        summary: 'Correlates question position (Q1-15, Q16-30... Q75-90) with Error Rate.',
        meaning: 'Measures psychological stamina and focus degradation over the 3-hour exam window.',
        howToImprove: [
            'If error rate spikes in Q60-90: take a 10-second deep breath break at the 90-minute mark.',
            'Hydrate and consume light glucose during pre-exam prep.',
            'Front-load your strongest subject when mental energy is at 100%.'
        ],
        redFlags: [
            'Error rate > 60% in final 30 minutes indicates mental burnout mid-exam.'
        ],
        learnMoreId: 'burnout-risk-explained'
    },
    panicAnalysis: {
        title: 'Panic Cascades (Death Spirals)',
        summary: 'Detects sequences where you got 3 or more questions wrong/unanswered in a row.',
        meaning: 'Identifies emotional "death spirals" where 1 hard question causes frustration, ruining the next 3 easy questions.',
        howToImprove: [
            'Apply the "Reset Breathing Rule": If you get stuck or make a mistake, take 2 deep breaths before reading the next question.',
            'Never carry frustration from question N to question N+1.'
        ],
        redFlags: [
            '3+ panic cascades in a single test paper can cost 25+ marks.'
        ],
        learnMoreId: 'score-dropped-troubleshoot'
    },
    guessingGame: {
        title: 'Guessing Efficiency Analysis',
        summary: 'Evaluates your accuracy on guessed questions (Safe Bets vs Risky Gambles).',
        meaning: 'Distinguishes between educated intuition (high accuracy) and blind guessing (negative mark trap).',
        howToImprove: [
            'Only guess when you can confidently eliminate 2 of 4 option choices.',
            'Never blind-guess in single-correct sections with negative marking.'
        ],
        redFlags: [
            'Negative marks from guesses exceeding total marks gained from guesses.'
        ],
        learnMoreId: 'radar-8d-explained'
    },
    scoreSimulator: {
        title: 'Bayesian Score & Rank Simulator',
        summary: 'Interactive what-if engine projecting score gains if specific error codes are reduced.',
        meaning: 'Shows how much your score improves if you reduce E3 calculation errors by 50% or fix E5 time panic.',
        howToImprove: [
            'Adjust sliders to see the highest-leverage error code for your score.',
            'Use the simulation results to set your next 7-day preparation targets.'
        ],
        redFlags: [
            'Expecting score gains without changing error DNA habits.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    },
    topperGap: {
        title: 'Topper Gap Analysis (AIR 100 Benchmark)',
        summary: 'Compares your accuracy, speed, and section scores against 99%ile JEE Mains benchmarks.',
        meaning: 'Shows exact gap in marks and time efficiency needed to reach elite top-1000 rank.',
        howToImprove: [
            'Close the gap in Chemistry first (topper benchmark = 85+ marks in 45 minutes).',
            'Reduce negative marks to under 8 marks total per paper.'
        ],
        redFlags: [
            'Maths time allocation exceeding 90 minutes leaves Chemistry under-resourced.'
        ],
        learnMoreId: 'rank-predictor-explained'
    },
    errorDna: {
        title: 'Error DNA Taxonomy',
        summary: 'Displays the percentage distribution of your error codes (E1 to E7).',
        meaning: 'Provides a clear breakdown of whether your marks are lost to knowledge gaps or operational slips.',
        howToImprove: [
            'Tag every wrong question with E1-E7 code during test logging.',
            'Work on reducing your dominant error code first.'
        ],
        redFlags: [
            'Primary Error DNA = E3 (Calculation) + E5 (Time Panic): Focus on test execution, not re-reading theory.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    },
    radar8D: {
        title: '8-Dimension Performance Radar',
        summary: 'Evaluates Speed, Accuracy, Selectivity, Confidence, Consistency, Endurance, Adaptability, and Recovery.',
        meaning: 'Provides a 360-degree blueprint of your test-taking strengths and execution bottlenecks.',
        howToImprove: [
            'Improve Selectivity score by applying the strict 3-minute question skip rule.',
            'Boost Endurance by managing energy and taking light snacks before 3-hour tests.',
            'Use Paper Strategy Optimizer to fix section order.'
        ],
        redFlags: [
            'Selectivity < 50: You are attempting bad questions and losing marks to negative penalties.'
        ],
        learnMoreId: 'radar-8d-explained'
    },
    syllabus: {
        title: 'Syllabus Mastery & Boss Questions',
        summary: 'Track chapter completion, mastery percentage, ROI rating, and Boss Question challenges.',
        meaning: 'Shows which chapters are exam-ready (Green) vs high-ROI blind spots (Grey/Red).',
        howToImprove: [
            'Focus on high-ROI chapters first before touching low-frequency topics.',
            'Challenge yourself with chapter Boss Questions to validate true mastery.',
            'Fix prerequisite gaps highlighted by the Knowledge Graph.'
        ],
        redFlags: [
            'High-ROI chapter in Grey/Red status within 60 days of JEE Mains.'
        ],
        learnMoreId: 'srs-boss-questions'
    },
    aiCoach: {
        title: 'AI Coach with Persistent Memory',
        summary: 'Personalized AI assistant that remembers your past test scores, weak topics, and commitments.',
        meaning: 'Acts as your 24/7 strategist, providing data-backed answers and custom GenUI study widgets.',
        howToImprove: [
            'Use Feynman Mode to explain concepts back and reveal hidden logic gaps.',
            'Use Debate Mode for E7 trap questions to reinforce first-principles reasoning.',
            'Ask specific questions about your Error DNA rather than generic study advice.'
        ],
        redFlags: [
            'Asking generic questions ("Explain Physics") instead of data-driven inquiries.'
        ],
        learnMoreId: 'ai-coach-guide'
    },
    achievements: {
        title: 'Awards & XP Economy',
        summary: 'Gamified achievement system with XP earnings, streaks, rank titles, and decay mechanics.',
        meaning: 'Makes your daily effort visible, rewarding consistency and milestone breakthroughs.',
        howToImprove: [
            'Maintain daily study streaks to earn bonus XP.',
            'Solve Boss Questions and complete Feynman sessions for maximum XP.',
            'Unlock hidden easter egg achievements by testing at key times.'
        ],
        redFlags: [
            '3+ days of inactivity triggers 5%/day XP decay.'
        ],
        learnMoreId: 'what-is-this-app'
    },
    reflections: {
        title: 'Reflections Journal & Sealed Vault',
        summary: 'Daily emotional journal and sealed Letter to Future Self for exam day morning.',
        meaning: 'Protects mental well-being and allows the AI to understand your psychological state.',
        howToImprove: [
            'Write 3-5 honest lines in your journal every evening.',
            'Write your Letter to Future Self now to open on JEE exam morning.',
            'Review past journal entries when feeling unmotivated.'
        ],
        redFlags: [
            'Suppressing stress and skipping reflections when anxiety is high.'
        ],
        learnMoreId: 'feel-like-giving-up'
    }
};

/**
 * Robust fallback getter that ensures EVERY widget ID returns comprehensive, rich Help Data!
 */
export function getWidgetHelpData(widgetId: string, fallbackTitle?: string, fallbackInfo?: React.ReactNode): WidgetInfoData {
    if (WIDGET_HELP_DATA[widgetId]) {
        return WIDGET_HELP_DATA[widgetId];
    }

    const titleStr = typeof fallbackTitle === 'string' ? fallbackTitle : (widgetId.replace(/([A-Z])/g, ' $1').trim());
    const infoStr = typeof fallbackInfo === 'string' ? fallbackInfo : 'Analyzes your performance data to uncover key insights and actionable improvement steps.';

    return {
        title: titleStr,
        summary: infoStr,
        meaning: `This widget evaluates your test performance in ${titleStr} to help you identify patterns, strengths, and failure points.`,
        howToImprove: [
            'Log your test reports consistently to feed accurate data into this analysis.',
            'Review the underlying Error DNA taxonomy codes (E1-E7) associated with this widget.',
            'Ask the AI Coach for a targeted 7-day study plan focused on this area.'
        ],
        redFlags: [
            'Ignoring persistent weak signals in this widget for more than 2 consecutive test papers.'
        ],
        learnMoreId: 'error-codes-e1-e7'
    };
}