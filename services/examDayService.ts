// ============================================================================
// Exam Day Command Center Service
// Day-of Strategy Blueprints, Emergency Checklist & Score Estimator
// ============================================================================

import { 
    QuestionLog, QuestionStatus, UserProfile, AttemptStrategyCard, 
    PreExamProtocol, Reflection 
} from '../types';
import { computeAllChapterEfficiencies } from './efficiencyOptimizer';
import { calculatePercentileFromMarks, estimateAIR } from './rankPredictorService';

/**
 * Checks if current date is within +/- 36 hours of target exam date
 */
export function isExamDay(targetExamDateStr?: string): boolean {
    if (!targetExamDateStr) return false;
    const examTime = new Date(targetExamDateStr).getTime();
    if (isNaN(examTime)) return false;

    const now = Date.now();
    const diffHours = Math.abs(examTime - now) / (1000 * 60 * 60);
    return diffHours <= 36;
}

/**
 * Identifies the top 3 highest-accuracy chapters to attempt first for early momentum
 */
export function getConfidenceStarters(logs: QuestionLog[] = []): string[] {
    const chapterEfficiencies = computeAllChapterEfficiencies(logs);
    const sorted = chapterEfficiencies
        .filter(c => c.totalAttempts >= 3)
        .sort((a, b) => b.accuracy - a.accuracy || b.marksPerMinute - a.marksPerMinute);

    if (sorted.length >= 3) {
        return sorted.slice(0, 3).map(c => `${c.chapter} (${c.subject} - ${c.accuracy}% Acc)`);
    }

    // Default high-confidence fallback chapters
    return [
        'Modern Physics (Physics - 88% Acc)',
        'Coordination Compounds (Chemistry - 84% Acc)',
        'Matrices & Determinants (Maths - 78% Acc)'
    ];
}

/**
 * Discovers the top 5 recurring error traps from historical question logs
 */
export function getTop5MistakesToAvoid(logs: QuestionLog[] = []): string[] {
    const errorMap: Record<string, number> = {};

    logs.forEach(l => {
        if (l.status === QuestionStatus.Wrong) {
            const reason = l.reasonForError || (l.errorCode ? `Error ${l.errorCode}` : 'Calculation Slip');
            const key = `${reason} in ${l.topic || l.chapter || 'Problem Practice'}`;
            errorMap[key] = (errorMap[key] || 0) + 1;
        }
    });

    const sorted = Object.entries(errorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, count]) => `${k} (Repeated ${count}x in Mocks)`);

    if (sorted.length >= 3) {
        return sorted;
    }

    return [
        'Calculation Slip in Factor of 2 / Signs (Check final arithmetic before clicking Save)',
        'Misreading "Incorrect Statement" as "Correct Statement" in Multi-choice Questions',
        'Over-investing >160s on long Integration questions (Enforce 90-second skip rule)',
        'Silly unit conversion error between cm, m, and Angstrom in Modern Physics',
        'Second-guessing first intuitive response on Chemistry Organic mechanisms'
    ];
}

/**
 * Generates personalized Exam Day Strategy Blueprint with 3-Pass pacing
 */
export function generateAttemptStrategyCard(logs: QuestionLog[] = []): AttemptStrategyCard {
    const confidenceStarters = getConfidenceStarters(logs);
    const topMistakes = getTop5MistakesToAvoid(logs);

    return {
        subjectOrder: ['Chemistry', 'Physics', 'Maths'],
        timeBudget: {
            Chemistry: 45,
            Physics: 55,
            Maths: 65,
            ReviewBuffer: 15
        },
        skipRules: [
            'Rule 1: If question takes >75 seconds to set up equations, mark for Pass II immediately.',
            'Rule 2: Never do tedious numerical calculation in Pass I; harvest all single-correct theory first.',
            'Rule 3: If 2 consecutive questions are difficult, jump to Chemistry speed pillars to reset cognitive flow.'
        ],
        confidenceStarters,
        topMistakesToAvoid: topMistakes,
        passBreakdown: {
            pass1: {
                minutes: 60,
                label: 'Pass 1: Speed Harvest',
                focus: 'Single-concept direct recall, factual theory & formula substitution. Skip anything requiring >60s algebra.',
                targetYield: '30-35 Questions | 110-130 Marks',
                skipRule: 'Skip instantly if question premise requires drawing complex geometry or setting up 3+ linear equations.'
            },
            pass2: {
                minutes: 80,
                label: 'Pass 2: Calculated Grind',
                focus: 'Moderate multi-step problems, standard mechanics, coordinate geometry & Section B numericals (pick best 5 of 10).',
                targetYield: '18-22 Questions | 60-80 Marks',
                skipRule: 'If algebra reaches a dead end after 2 minutes, abandon and move to next question. Protect remaining time.'
            },
            pass3: {
                minutes: 40,
                label: 'Pass 3: Audit & Negative Prevention',
                focus: 'Re-evaluating arithmetic signs, units verification, eliminating negative marks. Zero blind guessing.',
                targetYield: 'Review 10-15 Flagged Questions | +8 to +16 Net Delta',
                skipRule: 'Unless 2 options are definitively ruled out, NEVER take a 50/50 gamble in the final 10 minutes.'
            }
        },
        sectionBStrategy: 'Scan all 10 numerical problems in each subject before solving any. Solve only the 5 cleanest arithmetic problems (e.g. Modern Physics, Mole Concept, Matrices). Avoid tedious coordinate geometry or thermodynamics integrals.',
        negativeMarkControl: [
            'Avoid guessing in numerical Section B (negative marking applies even with no options).',
            'Double-check negative signs in work-energy and electrostatic potential problems.',
            'Verify standard units (e.g., Joules vs Calories, cm vs meters, degrees vs radians) before submitting.'
        ]
    };
}

/**
 * Returns comprehensive pre-exam protocols, categorized checklists, and anxiety resets
 */
export function getPreExamProtocol(reflections: Reflection[] = []): PreExamProtocol {
    return {
        breathingStepSeconds: {
            inhale: 4,
            hold: 7,
            exhale: 8
        },
        affirmations: [
            'I have solved thousands of problems. My intuition is calibrated and sharp.',
            'Hard questions are hard for all 1.2 million aspirants. Rank is won on easy accuracy.',
            'I will protect my marks by disciplined skipping without emotional attachment.',
            'Calm, steady execution always beats frantic rushing.',
            'Every correct easy question carries the exact same 4 marks as a 10-minute monster problem.'
        ],
        morningChecklist: [
            { item: 'NTA Admit Card with printed passport photo pasted & left thumb impression', mandatory: true },
            { item: 'Original Government Photo ID (Aadhaar Card / Passport / Voter ID)', mandatory: true },
            { item: '1 Additional Passport Size Photograph for Attendance Sheet', mandatory: true },
            { item: 'Transparent Ballpoint Pen (Blue/Black)', mandatory: true },
            { item: 'Transparent 500ml Water Bottle without labels', mandatory: false },
            { item: 'Simple wrist watch (analog only, no smartwatches or digital dials)', mandatory: false }
        ],
        centerArrivalGuide: [
            'Reach exam venue 90 minutes before gate closure (Morning Shift: 7:30 AM / Afternoon Shift: 1:30 PM).',
            'Complete biometric fingerprint and iris scanning smoothly at verification counters.',
            'Ensure mouse clicks and virtual keyboard responsiveness immediately upon terminal allocation.',
            'Write down key constants (h, c, R, e, eps_0) and trig values on rough sheet during the 15-minute instruction reading window.'
        ],
        categorizedChecklist: {
            mandatoryDocs: [
                {
                    id: 'admit_card',
                    item: 'NTA Admit Card Printout',
                    detail: 'All pages in clear printout with self-declaration undertaking filled, candidate photo pasted, and left thumb impression stamped. DO NOT sign beforehand (must sign in presence of invigilator).',
                    mandatory: true
                },
                {
                    id: 'original_id',
                    item: 'Original Government Photo ID',
                    detail: 'Original Aadhaar Card with photo, Passport, PAN Card, Voter ID, or 12th Board Admit Card with photo. Scanned copies or phone photos are STRICTLY REJECTED.',
                    mandatory: true
                },
                {
                    id: 'extra_photo',
                    item: 'Additional Passport Size Photograph',
                    detail: 'Exact same photograph as uploaded on application form, to be pasted onto the attendance sheet in the examination hall.',
                    mandatory: true
                },
                {
                    id: 'pwd_cert',
                    item: 'PwD / Scribe Certificate (if applicable)',
                    detail: 'Original certificate issued by competent authority along with letter of undertaking regarding scribe if utilizing a scribe.',
                    mandatory: false
                }
            ],
            permittedItems: [
                {
                    id: 'transparent_pen',
                    item: 'Transparent Ballpoint Pen',
                    detail: 'Simple blue or black ballpoint pen with transparent casing. Gel pens or fountain pens are prohibited.',
                    mandatory: true
                },
                {
                    id: 'water_bottle',
                    item: 'Transparent Water Bottle (500ml)',
                    detail: 'Clear transparent water bottle with all commercial brand stickers and labels completely peeled off.',
                    mandatory: false
                },
                {
                    id: 'sanitizer',
                    item: 'Transparent Hand Sanitizer (50ml)',
                    detail: 'Small personal bottle in clear plastic bottle.',
                    mandatory: false
                }
            ],
            prohibitedItems: [
                {
                    id: 'electronics',
                    item: 'Smartwatches, Digital Watches & Gadgets',
                    risk: 'Immediate disqualification and debarment under NTA unfair means regulations.'
                },
                {
                    id: 'comm_devices',
                    item: 'Mobile Phones, Bluetooth & Earphones',
                    risk: 'Confiscation and police reporting under anti-cheating protocols.'
                },
                {
                    id: 'stationery_pouches',
                    item: 'Pencil Pouches, Geometry Boxes & Paper',
                    risk: 'Entry refusal at security frisking checkpoint.'
                },
                {
                    id: 'metallic_items',
                    item: 'Belts with Large Metal Buckles & Keychains',
                    risk: 'Metal detector alarm triggers delay at security gate.'
                }
            ],
            dressCodeRules: [
                {
                    id: 'sleeves',
                    rule: 'Light Clothes with Half Sleeves Only',
                    rationale: 'Long sleeves, hoodies, sweat-jackets, or jackets with heavy pockets are strictly disallowed to prevent concealment.'
                },
                {
                    id: 'buttons',
                    rule: 'No Large Buttons, Badges, or Heavy Embroidery',
                    rationale: 'Plain, simple shirts or t-shirts with normal buttons. Garments with large metallic badges will be rejected at gate.'
                },
                {
                    id: 'footwear',
                    rule: 'Slippers or Sandals with Low Heels (NO Shoes)',
                    rationale: 'Shoes with thick rubber soles or closed boots are strictly barred. Wear open slippers or thin-sole sandals.'
                }
            ]
        },
        panicResetProtocol: [
            {
                step: 1,
                title: 'Physical Disengagement (15 Seconds)',
                action: 'Drop the mouse, take both hands off the table, sit back upright and close your eyes.',
                mentalScript: 'Stop fighting the screen. Lowering cortisol takes 15 seconds of sensory rest.'
            },
            {
                step: 2,
                title: 'Diaphragmatic 4-7-8 Breathwork (30 Seconds)',
                action: 'Inhale deeply through nose for 4s -> Hold for 7s -> Exhale slowly through mouth for 8s. Repeat twice.',
                mentalScript: 'Vagus nerve stimulation manually slows heart rate and returns blood to prefrontal cortex.'
            },
            {
                step: 3,
                title: 'Objective Cutoff Reframing (15 Seconds)',
                action: 'Acknowledge: "If these opening 3 questions are brutal, they are brutal for all 1.2 million students."',
                mentalScript: 'Tough paper = lower percentile cutoffs. 135 marks today achieves what 180 did in an easy shift.'
            },
            {
                step: 4,
                title: 'Strategic Pivot to Confidence Anchor (Instant)',
                action: 'Do not continue on this question. Open Question Palette and click directly to your strongest chapter (e.g. Modern Physics or Inorganic Chemistry).',
                mentalScript: 'Solve 2 easy questions to restore dopamine momentum, then return later with clear vision.'
            }
        ],
        shiftTimeline: {
            morning: [
                { time: '07:30 AM', event: 'Reporting opens at Exam Centre (Biometric registration begins)' },
                { time: '08:30 AM', event: 'STRICT GATE CLOSURE - No candidate allowed under any circumstance', isCritical: true },
                { time: '08:45 AM', event: 'Seating at designated terminal & reading instructions on screen' },
                { time: '09:00 AM', event: 'Examination commences (Start Pass 1: Speed Harvest)', isCritical: true },
                { time: '10:00 AM', event: 'Transition to Pass 2: Calculated Grind & Section B Selection' },
                { time: '11:20 AM', event: 'Transition to Pass 3: Audit, Calculation Verification & Tie-breakers' },
                { time: '12:00 PM', event: 'Examination concludes (Test automatically saves and submits)' }
            ],
            afternoon: [
                { time: '01:30 PM', event: 'Reporting opens at Exam Centre (Security verification begins)' },
                { time: '02:30 PM', event: 'STRICT GATE CLOSURE - Gate locks strictly at 02:30 PM', isCritical: true },
                { time: '02:45 PM', event: 'Terminal allocated, checking mouse responsiveness & instructions' },
                { time: '03:00 PM', event: 'Examination commences (Start Pass 1: Speed Harvest)', isCritical: true },
                { time: '04:00 PM', event: 'Transition to Pass 2: Calculated Grind & Section B Selection' },
                { time: '05:20 PM', event: 'Transition to Pass 3: Verification, Sign Checks & Review' },
                { time: '06:00 PM', event: 'Examination concludes (Automatic submission)' }
            ]
        }
    };
}

/**
 * Quick score estimator for day-of unofficial verification
 */
export function estimateDayOfScore(
    userAnswers: Record<number, string>,
    officialKey: Record<number, string>
): {
    totalMarks: number;
    correctCount: number;
    wrongCount: number;
    unattemptedCount: number;
    accuracy: number;
} {
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    const totalQuestions = 75; // Standard JEE Mains (25 per subject)

    for (let q = 1; q <= totalQuestions; q++) {
        const userAns = (userAnswers[q] || '').trim().toUpperCase();
        const correctAns = (officialKey[q] || '').trim().toUpperCase();

        if (!userAns) {
            unattempted++;
        } else if (userAns === correctAns) {
            correct++;
        } else {
            wrong++;
        }
    }

    const totalMarks = (correct * 4) - (wrong * 1);
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    return {
        totalMarks,
        correctCount: correct,
        wrongCount: wrong,
        unattemptedCount: unattempted,
        accuracy
    };
}

/**
 * Estimates projected percentile, AIR, and qualifying tier from raw score
 */
export function estimateExamPerformance(
    rawMarks: number,
    shift: 'Easy' | 'Moderate' | 'Tough' = 'Moderate'
): {
    percentile: number;
    airEstimate: { mid: number; low: number; high: number };
    topCollegeTier: 'Tier 1 Top NIT/IIIT CSE' | 'Tier 1 Core Engineering' | 'Tier 2 NIT/IIIT' | 'Qualifying Adv Frontier' | 'Needs Foundation Boost';
    qualifiesForAdvanced: boolean;
} {
    const percentile = calculatePercentileFromMarks(rawMarks, shift);
    const airEstimate = estimateAIR(percentile, 2025);
    const qualifiesForAdvanced = percentile >= 93.2;

    let topCollegeTier: 'Tier 1 Top NIT/IIIT CSE' | 'Tier 1 Core Engineering' | 'Tier 2 NIT/IIIT' | 'Qualifying Adv Frontier' | 'Needs Foundation Boost' = 'Needs Foundation Boost';

    if (percentile >= 99.3) {
        topCollegeTier = 'Tier 1 Top NIT/IIIT CSE';
    } else if (percentile >= 97.5) {
        topCollegeTier = 'Tier 1 Core Engineering';
    } else if (percentile >= 94.0) {
        topCollegeTier = 'Tier 2 NIT/IIIT';
    } else if (qualifiesForAdvanced) {
        topCollegeTier = 'Qualifying Adv Frontier';
    }

    return {
        percentile,
        airEstimate,
        topCollegeTier,
        qualifiesForAdvanced
    };
}
