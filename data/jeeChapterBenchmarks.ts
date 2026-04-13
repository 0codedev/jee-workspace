// ============================================================================
// Authentic JEE Chapter Velocity & Efficiency Benchmarks (88 Chapters)
// Empirical calibration for JEE Mains & JEE Advanced speed telemetry
// ============================================================================

export interface ChapterBenchmark {
    chapter: string;
    subject: 'Physics' | 'Chemistry' | 'Maths';
    unit: string;
    mainsTimeSec: number;
    mainsAccuracy: number;
    mainsMpm: number;
    advTimeSec: number;
    advAccuracy: number;
    advMpm: number;
    difficultyTier: 'Direct Speed' | 'Moderate Calculation' | 'High Depth & Multi-Concept';
    defaultQuadrant: 'goldmine' | 'time_eater' | 'guess_trap' | 'disaster';
    tacticalRule: string;
}

export const JEE_CHAPTER_BENCHMARKS: Record<string, ChapterBenchmark> = {
    // =========================================================================
    // PHYSICS (31 Chapters)
    // =========================================================================
    'Math in Physics': {
        chapter: 'Math in Physics',
        subject: 'Physics',
        unit: 'Mechanics 1',
        mainsTimeSec: 65, mainsAccuracy: 88, mainsMpm: 3.14,
        advTimeSec: 90, advAccuracy: 80, advMpm: 2.0,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Direct tool question. Solve immediately in Pass 1 (< 60s).'
    },
    'Units & Dimensions': {
        chapter: 'Units & Dimensions',
        subject: 'Physics',
        unit: 'Mechanics 1',
        mainsTimeSec: 60, mainsAccuracy: 92, mainsMpm: 3.6,
        advTimeSec: 95, advAccuracy: 82, advMpm: 1.96,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Dimension checking is guaranteed marks. Execute within first 15 mins.'
    },
    'Motion in 1D': {
        chapter: 'Motion in 1D',
        subject: 'Physics',
        unit: 'Mechanics 1',
        mainsTimeSec: 90, mainsAccuracy: 82, mainsMpm: 2.07,
        advTimeSec: 140, advAccuracy: 70, advMpm: 1.07,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Graph / calculus problems: solve in Pass 1 if single-stage.'
    },
    'Motion in 2D': {
        chapter: 'Motion in 2D',
        subject: 'Physics',
        unit: 'Mechanics 1',
        mainsTimeSec: 115, mainsAccuracy: 74, mainsMpm: 1.41,
        advTimeSec: 165, advAccuracy: 62, advMpm: 0.76,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Inclined plane projectile: verify angles quickly; if formula unclear, defer to Pass 2.'
    },
    'Laws of Motion': {
        chapter: 'Laws of Motion',
        subject: 'Physics',
        unit: 'Mechanics 1',
        mainsTimeSec: 130, mainsAccuracy: 68, mainsMpm: 1.11,
        advTimeSec: 190, advAccuracy: 54, advMpm: 0.54,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Multi-block friction: draw FBD cleanly. If friction direction is ambiguous, skip.'
    },
    'Work Power Energy': {
        chapter: 'Work Power Energy',
        subject: 'Physics',
        unit: 'Mechanics 1',
        mainsTimeSec: 110, mainsAccuracy: 78, mainsMpm: 1.58,
        advTimeSec: 160, advAccuracy: 64, advMpm: 0.83,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Use Work-Energy Theorem directly instead of kinematics integration.'
    },
    'COM & Collisions': {
        chapter: 'COM & Collisions',
        subject: 'Physics',
        unit: 'Mechanics 2',
        mainsTimeSec: 140, mainsAccuracy: 62, mainsMpm: 0.9,
        advTimeSec: 210, advAccuracy: 48, advMpm: 0.4,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Oblique collision with coefficient e: high calculation trap. Mark for Pass 2.'
    },
    'Rotational Motion': {
        chapter: 'Rotational Motion',
        subject: 'Physics',
        unit: 'Mechanics 2',
        mainsTimeSec: 195, mainsAccuracy: 44, mainsMpm: 0.37,
        advTimeSec: 270, advAccuracy: 32, advMpm: 0.13,
        difficultyTier: 'High Depth & Multi-Concept',
        defaultQuadrant: 'disaster',
        tacticalRule: 'Combined rotation & translation: high slip rate. Strictly leave for Pass 3.'
    },
    'Gravitation': {
        chapter: 'Gravitation',
        subject: 'Physics',
        unit: 'Mechanics 2',
        mainsTimeSec: 85, mainsAccuracy: 84, mainsMpm: 2.26,
        advTimeSec: 125, advAccuracy: 72, advMpm: 1.25,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Orbital velocity & potential: high yield, direct formulas. Priority Pass 1.'
    },
    'Properties of Solids': {
        chapter: 'Properties of Solids',
        subject: 'Physics',
        unit: 'Mechanics 2',
        mainsTimeSec: 75, mainsAccuracy: 86, mainsMpm: 2.64,
        advTimeSec: 110, advAccuracy: 75, advMpm: 1.5,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Young modulus elongation: single-formula calculation. Guaranteed speed marks.'
    },
    'Properties of Fluids': {
        chapter: 'Properties of Fluids',
        subject: 'Physics',
        unit: 'Mechanics 2',
        mainsTimeSec: 145, mainsAccuracy: 60, mainsMpm: 0.83,
        advTimeSec: 210, advAccuracy: 48, advMpm: 0.4,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Surface tension bubble excess pressure: solve; heavy Bernoulli setups: Pass 2.'
    },
    'Oscillations': {
        chapter: 'Oscillations',
        subject: 'Physics',
        unit: 'Oscillations & Waves',
        mainsTimeSec: 120, mainsAccuracy: 70, mainsMpm: 1.25,
        advTimeSec: 180, advAccuracy: 58, advMpm: 0.63,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Spring combination & SHM frequency: solve early using phasor diagram.'
    },
    'Waves & Sound': {
        chapter: 'Waves & Sound',
        subject: 'Physics',
        unit: 'Oscillations & Waves',
        mainsTimeSec: 135, mainsAccuracy: 64, mainsMpm: 0.98,
        advTimeSec: 195, advAccuracy: 52, advMpm: 0.49,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Doppler / Organ pipes: verify end-corrections. If multi-medium wave, skip.'
    },
    'Thermal Properties': {
        chapter: 'Thermal Properties',
        subject: 'Physics',
        unit: 'Thermodynamics',
        mainsTimeSec: 85, mainsAccuracy: 82, mainsMpm: 2.19,
        advTimeSec: 130, advAccuracy: 70, advMpm: 1.15,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Radiation Stefan law & calorimetry: quick and high accuracy. Pass 1.'
    },
    'Thermodynamics': {
        chapter: 'Thermodynamics',
        subject: 'Physics',
        unit: 'Thermodynamics',
        mainsTimeSec: 95, mainsAccuracy: 84, mainsMpm: 2.02,
        advTimeSec: 145, advAccuracy: 72, advMpm: 1.08,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'PV diagram work done: calculate area enclosed directly. Very high velocity.'
    },
    'KTG': {
        chapter: 'KTG',
        subject: 'Physics',
        unit: 'Thermodynamics',
        mainsTimeSec: 70, mainsAccuracy: 88, mainsMpm: 2.91,
        advTimeSec: 105, advAccuracy: 78, advMpm: 1.66,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'V_rms and degrees of freedom: direct ratio questions. Solve in < 60s.'
    },
    'Electrostatics': {
        chapter: 'Electrostatics',
        subject: 'Physics',
        unit: 'Electromagnetism 1',
        mainsTimeSec: 135, mainsAccuracy: 66, mainsMpm: 1.02,
        advTimeSec: 210, advAccuracy: 52, advMpm: 0.46,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Gauss Law flux: Pass 1; Multi-charge potential energy integration: Pass 2.'
    },
    'Capacitance': {
        chapter: 'Capacitance',
        subject: 'Physics',
        unit: 'Electromagnetism 1',
        mainsTimeSec: 110, mainsAccuracy: 75, mainsMpm: 1.5,
        advTimeSec: 165, advAccuracy: 60, advMpm: 0.73,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Dielectric insertion & circuit reduction: high score rate. Priority solve.'
    },
    'Current Electricity': {
        chapter: 'Current Electricity',
        subject: 'Physics',
        unit: 'Electromagnetism 2',
        mainsTimeSec: 105, mainsAccuracy: 80, mainsMpm: 1.71,
        advTimeSec: 155, advAccuracy: 68, advMpm: 0.93,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Meter bridge & potentiometer ratios: guaranteed marks. Pass 1.'
    },
    'Magnetic Properties': {
        chapter: 'Magnetic Properties',
        subject: 'Physics',
        unit: 'Electromagnetism 2',
        mainsTimeSec: 60, mainsAccuracy: 88, mainsMpm: 3.4,
        advTimeSec: 85, advAccuracy: 78, advMpm: 2.05,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Dia/Para/Ferro facts & earth magnetism: pure factual recall. 30-45s solve.'
    },
    'Magnetism & Current': {
        chapter: 'Magnetism & Current',
        subject: 'Physics',
        unit: 'Electromagnetism 2',
        mainsTimeSec: 125, mainsAccuracy: 70, mainsMpm: 1.2,
        advTimeSec: 185, advAccuracy: 56, advMpm: 0.58,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Biot-Savart circular loop & Lorentz force: direct formula application.'
    },
    'EMI': {
        chapter: 'EMI',
        subject: 'Physics',
        unit: 'Electromagnetism 2',
        mainsTimeSec: 115, mainsAccuracy: 72, mainsMpm: 1.36,
        advTimeSec: 175, advAccuracy: 58, advMpm: 0.65,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Motional EMF Blv and Lenz law: quick direction checks. Solve in Pass 1.'
    },
    'AC Circuits': {
        chapter: 'AC Circuits',
        subject: 'Physics',
        unit: 'Electromagnetism 2',
        mainsTimeSec: 100, mainsAccuracy: 78, mainsMpm: 1.74,
        advTimeSec: 150, advAccuracy: 65, advMpm: 0.9,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Resonance condition & Q-factor: plug and chug formula. High velocity.'
    },
    'EM Waves': {
        chapter: 'EM Waves',
        subject: 'Physics',
        unit: 'Electromagnetism 2',
        mainsTimeSec: 55, mainsAccuracy: 90, mainsMpm: 3.82,
        advTimeSec: 80, advAccuracy: 82, advMpm: 2.33,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'E0/B0 = c and Poynting vector: easiest marks in JEE Physics. Must solve.'
    },
    'Ray Optics': {
        chapter: 'Ray Optics',
        subject: 'Physics',
        unit: 'Optics',
        mainsTimeSec: 135, mainsAccuracy: 66, mainsMpm: 1.02,
        advTimeSec: 200, advAccuracy: 50, advMpm: 0.45,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Sign convention traps: write standard lens maker equation; don\'t skip steps.'
    },
    'Wave Optics': {
        chapter: 'Wave Optics',
        subject: 'Physics',
        unit: 'Optics',
        mainsTimeSec: 110, mainsAccuracy: 76, mainsMpm: 1.53,
        advTimeSec: 160, advAccuracy: 62, advMpm: 0.79,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'YDSE fringe shift: direct formula beta = lambda*D/d. High yield.'
    },
    'Dual Nature': {
        chapter: 'Dual Nature',
        subject: 'Physics',
        unit: 'Modern Physics',
        mainsTimeSec: 70, mainsAccuracy: 88, mainsMpm: 2.91,
        advTimeSec: 100, advAccuracy: 80, advMpm: 1.8,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Photoelectric cut-off voltage & de Broglie: instant marks. Pass 1 priority.'
    },
    'Atomic Physics': {
        chapter: 'Atomic Physics',
        subject: 'Physics',
        unit: 'Modern Physics',
        mainsTimeSec: 75, mainsAccuracy: 86, mainsMpm: 2.64,
        advTimeSec: 110, advAccuracy: 76, advMpm: 1.53,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Bohr energy levels & Lyman/Balmer transitions: simple arithmetic. Pass 1.'
    },
    'Nuclear Physics': {
        chapter: 'Nuclear Physics',
        subject: 'Physics',
        unit: 'Modern Physics',
        mainsTimeSec: 80, mainsAccuracy: 84, mainsMpm: 2.4,
        advTimeSec: 120, advAccuracy: 74, advMpm: 1.35,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Half-life law: use powers of 2 (t/T1/2); avoid natural log calculations.'
    },
    'Semiconductors': {
        chapter: 'Semiconductors',
        subject: 'Physics',
        unit: 'Modern Physics',
        mainsTimeSec: 65, mainsAccuracy: 90, mainsMpm: 3.23,
        advTimeSec: 95, advAccuracy: 80, advMpm: 1.89,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Zener diode voltage regulator & logic gates truth table: 100% must attempt.'
    },
    'Experimental Physics': {
        chapter: 'Experimental Physics',
        subject: 'Physics',
        unit: 'Experimental',
        mainsTimeSec: 85, mainsAccuracy: 80, mainsMpm: 2.12,
        advTimeSec: 125, advAccuracy: 70, advMpm: 1.2,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Least count & zero error of vernier/screw gauge: solve carefully in Pass 1.'
    },

    // =========================================================================
    // CHEMISTRY (30 Chapters)
    // =========================================================================
    'Mole Concept': {
        chapter: 'Mole Concept',
        subject: 'Chemistry',
        unit: 'Class 11 - Physical',
        mainsTimeSec: 100, mainsAccuracy: 76, mainsMpm: 1.68,
        advTimeSec: 150, advAccuracy: 64, advMpm: 0.88,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Redox n-factor titration: write equivalence equation directly.'
    },
    'Atomic Structure': {
        chapter: 'Atomic Structure',
        subject: 'Chemistry',
        unit: 'Class 11 - Physical',
        mainsTimeSec: 75, mainsAccuracy: 86, mainsMpm: 2.64,
        advTimeSec: 110, advAccuracy: 76, advMpm: 1.53,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Quantum numbers & nodal surfaces: fast, unambiguous points.'
    },
    'States of Matter': {
        chapter: 'States of Matter',
        subject: 'Chemistry',
        unit: 'Class 11 - Physical',
        mainsTimeSec: 80, mainsAccuracy: 82, mainsMpm: 2.33,
        advTimeSec: 125, advAccuracy: 70, advMpm: 1.2,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Van der Waals correction units & Graham law: direct plug-in.'
    },
    'Thermodynamics (C)': {
        chapter: 'Thermodynamics (C)',
        subject: 'Chemistry',
        unit: 'Class 11 - Physical',
        mainsTimeSec: 90, mainsAccuracy: 80, mainsMpm: 2.0,
        advTimeSec: 140, advAccuracy: 68, advMpm: 1.03,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Hess law delta-H and Gibbs energy delta-G = -nFE: highly predictable.'
    },
    'Chemical Equilibrium': {
        chapter: 'Chemical Equilibrium',
        subject: 'Chemistry',
        unit: 'Class 11 - Physical',
        mainsTimeSec: 95, mainsAccuracy: 78, mainsMpm: 1.83,
        advTimeSec: 145, advAccuracy: 65, advMpm: 0.93,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Le Chatelier principle & Kp/Kc expressions: solve in Pass 1.'
    },
    'Ionic Equilibrium': {
        chapter: 'Ionic Equilibrium',
        subject: 'Chemistry',
        unit: 'Class 11 - Physical',
        mainsTimeSec: 150, mainsAccuracy: 58, mainsMpm: 0.76,
        advTimeSec: 220, advAccuracy: 44, advMpm: 0.33,
        difficultyTier: 'High Depth & Multi-Concept',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Buffer & salt hydrolysis: check quadratic approximation! If cubic, leave.'
    },
    'Redox Reactions': {
        chapter: 'Redox Reactions',
        subject: 'Chemistry',
        unit: 'Class 11 - Physical',
        mainsTimeSec: 70, mainsAccuracy: 88, mainsMpm: 2.91,
        advTimeSec: 100, advAccuracy: 80, advMpm: 1.8,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Oxidation numbers & ion-electron balancing: simple algebraic verification.'
    },
    'Periodic Table': {
        chapter: 'Periodic Table',
        subject: 'Chemistry',
        unit: 'Class 11 - Inorganic',
        mainsTimeSec: 50, mainsAccuracy: 92, mainsMpm: 4.32,
        advTimeSec: 75, advAccuracy: 84, advMpm: 2.56,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Ionization energy anomalies (Be>B, N>O) & electron gain: 20-30s solve.'
    },
    'Chemical Bonding': {
        chapter: 'Chemical Bonding',
        subject: 'Chemistry',
        unit: 'Class 11 - Inorganic',
        mainsTimeSec: 60, mainsAccuracy: 90, mainsMpm: 3.5,
        advTimeSec: 90, advAccuracy: 80, advMpm: 2.0,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'VSEPR shape, MOT bond order & dipole moments: maximum speed ROI in exam.'
    },
    'Hydrogen': {
        chapter: 'Hydrogen',
        subject: 'Chemistry',
        unit: 'Class 11 - Inorganic',
        mainsTimeSec: 45, mainsAccuracy: 90, mainsMpm: 4.67,
        advTimeSec: 70, advAccuracy: 80, advMpm: 2.57,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Heavy water and hydrides facts: pure memory check. Solve instantly.'
    },
    's Block': {
        chapter: 's Block',
        subject: 'Chemistry',
        unit: 'Class 11 - Inorganic',
        mainsTimeSec: 50, mainsAccuracy: 88, mainsMpm: 4.08,
        advTimeSec: 75, advAccuracy: 78, advMpm: 2.32,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Solubility & thermal stability trends (carbonates/sulfates): rapid marks.'
    },
    'p Block (G13-14)': {
        chapter: 'p Block (G13-14)',
        subject: 'Chemistry',
        unit: 'Class 11 - Inorganic',
        mainsTimeSec: 55, mainsAccuracy: 86, mainsMpm: 3.6,
        advTimeSec: 85, advAccuracy: 75, advMpm: 1.94,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Inert pair effect and borax bead test: high speed conversion.'
    },
    'GOC': {
        chapter: 'GOC',
        subject: 'Chemistry',
        unit: 'Class 11 - Organic',
        mainsTimeSec: 65, mainsAccuracy: 88, mainsMpm: 3.14,
        advTimeSec: 95, advAccuracy: 78, advMpm: 1.83,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Acidic strength (phenols/carboxylic) and carbocation stability: top yield.'
    },
    'Hydrocarbons': {
        chapter: 'Hydrocarbons',
        subject: 'Chemistry',
        unit: 'Class 11 - Organic',
        mainsTimeSec: 75, mainsAccuracy: 84, mainsMpm: 2.56,
        advTimeSec: 115, advAccuracy: 72, advMpm: 1.36,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Ozonolysis products & Markovnikov addition: easy visual inspection.'
    },
    'Solid State': {
        chapter: 'Solid State',
        subject: 'Chemistry',
        unit: 'Class 12 - Physical',
        mainsTimeSec: 85, mainsAccuracy: 82, mainsMpm: 2.19,
        advTimeSec: 130, advAccuracy: 70, advMpm: 1.15,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'FCC/BCC packing fraction & density formula: standard calculation.'
    },
    'Solutions': {
        chapter: 'Solutions',
        subject: 'Chemistry',
        unit: 'Class 12 - Physical',
        mainsTimeSec: 90, mainsAccuracy: 80, mainsMpm: 2.0,
        advTimeSec: 135, advAccuracy: 68, advMpm: 1.07,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Van\'t Hoff factor i and Raoult\'s law: verify dissociation percentage.'
    },
    'Electrochemistry': {
        chapter: 'Electrochemistry',
        subject: 'Chemistry',
        unit: 'Class 12 - Physical',
        mainsTimeSec: 105, mainsAccuracy: 76, mainsMpm: 1.6,
        advTimeSec: 160, advAccuracy: 62, advMpm: 0.79,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Nernst equation E = E0 - (0.059/n)logQ: watch standard state sign.'
    },
    'Chemical Kinetics': {
        chapter: 'Chemical Kinetics',
        subject: 'Chemistry',
        unit: 'Class 12 - Physical',
        mainsTimeSec: 85, mainsAccuracy: 85, mainsMpm: 2.33,
        advTimeSec: 130, advAccuracy: 74, advMpm: 1.25,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'First order half-life t1/2 = 0.693/k & Arrhenius equation: high speed.'
    },
    'Surface Chemistry': {
        chapter: 'Surface Chemistry',
        subject: 'Chemistry',
        unit: 'Class 12 - Physical',
        mainsTimeSec: 45, mainsAccuracy: 92, mainsMpm: 4.8,
        advTimeSec: 70, advAccuracy: 84, advMpm: 2.74,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Hardy-Schulze rule & Freundlich isotherm: solve in < 30s.'
    },
    'Metallurgy': {
        chapter: 'Metallurgy',
        subject: 'Chemistry',
        unit: 'Class 12 - Inorganic',
        mainsTimeSec: 45, mainsAccuracy: 88, mainsMpm: 4.53,
        advTimeSec: 70, advAccuracy: 78, advMpm: 2.49,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Zone refining & Ellingham diagram facts: direct knowledge check.'
    },
    'p Block (G15-18)': {
        chapter: 'p Block (G15-18)',
        subject: 'Chemistry',
        unit: 'Class 12 - Inorganic',
        mainsTimeSec: 55, mainsAccuracy: 85, mainsMpm: 3.6,
        advTimeSec: 85, advAccuracy: 74, advMpm: 1.91,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Xenon fluorides structure & oxoacids of P and S: fast marks.'
    },
    'd & f Block': {
        chapter: 'd & f Block',
        subject: 'Chemistry',
        unit: 'Class 12 - Inorganic',
        mainsTimeSec: 50, mainsAccuracy: 88, mainsMpm: 4.08,
        advTimeSec: 75, advAccuracy: 78, advMpm: 2.32,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Lanthanoid contraction & KMnO4/K2Cr2O7 redox equations: priority.'
    },
    'Coordination Compounds': {
        chapter: 'Coordination Compounds',
        subject: 'Chemistry',
        unit: 'Class 12 - Inorganic',
        mainsTimeSec: 65, mainsAccuracy: 90, mainsMpm: 3.23,
        advTimeSec: 95, advAccuracy: 80, advMpm: 1.89,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'CFT hybridisation, magnetic moment & isomerism: 100% must attempt.'
    },
    'Practical Chemistry': {
        chapter: 'Practical Chemistry',
        subject: 'Chemistry',
        unit: 'Class 12 - Inorganic',
        mainsTimeSec: 55, mainsAccuracy: 82, mainsMpm: 3.38,
        advTimeSec: 85, advAccuracy: 72, advMpm: 1.84,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Flame test & salt analysis cation group reagents: quick recall.'
    },
    'Haloalkanes & Haloarenes': {
        chapter: 'Haloalkanes & Haloarenes',
        subject: 'Chemistry',
        unit: 'Class 12 - Organic',
        mainsTimeSec: 70, mainsAccuracy: 84, mainsMpm: 2.74,
        advTimeSec: 105, advAccuracy: 72, advMpm: 1.49,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'SN1 vs SN2 inversion of configuration: standard textbook mechanism.'
    },
    'Alcohols, Phenols & Ethers': {
        chapter: 'Alcohols, Phenols & Ethers',
        subject: 'Chemistry',
        unit: 'Class 12 - Organic',
        mainsTimeSec: 75, mainsAccuracy: 84, mainsMpm: 2.56,
        advTimeSec: 110, advAccuracy: 72, advMpm: 1.42,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Reimer-Tiemann & Kolbe reactions: instant recognition. Pass 1.'
    },
    'Aldehydes & Ketones': {
        chapter: 'Aldehydes & Ketones',
        subject: 'Chemistry',
        unit: 'Class 12 - Organic',
        mainsTimeSec: 80, mainsAccuracy: 82, mainsMpm: 2.33,
        advTimeSec: 120, advAccuracy: 70, advMpm: 1.25,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Aldol condensation & Cannizzaro: check for alpha-hydrogen presence.'
    },
    'Carboxylic Acids': {
        chapter: 'Carboxylic Acids',
        subject: 'Chemistry',
        unit: 'Class 12 - Organic',
        mainsTimeSec: 65, mainsAccuracy: 86, mainsMpm: 3.05,
        advTimeSec: 95, advAccuracy: 75, advMpm: 1.74,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'HVZ reaction and esterification: fast and reliable.'
    },
    'Amines': {
        chapter: 'Amines',
        subject: 'Chemistry',
        unit: 'Class 12 - Organic',
        mainsTimeSec: 65, mainsAccuracy: 86, mainsMpm: 3.05,
        advTimeSec: 95, advAccuracy: 75, advMpm: 1.74,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Diazonium coupling & Hinsberg test: unambiguous identification.'
    },
    'Biomolecules': {
        chapter: 'Biomolecules',
        subject: 'Chemistry',
        unit: 'Class 12 - Organic',
        mainsTimeSec: 45, mainsAccuracy: 92, mainsMpm: 4.8,
        advTimeSec: 65, advAccuracy: 85, advMpm: 2.95,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Reducing sugars, amino acid isoelectric point: fastest marks in JEE.'
    },

    // =========================================================================
    // MATHEMATICS (27 Chapters)
    // =========================================================================
    'Quadratic Equations': {
        chapter: 'Quadratic Equations',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 110, mainsAccuracy: 78, mainsMpm: 1.58,
        advTimeSec: 165, advAccuracy: 64, advMpm: 0.8,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Location of roots: draw parabolic sketch before setting inequalities.'
    },
    'Complex Numbers': {
        chapter: 'Complex Numbers',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 180, mainsAccuracy: 48, mainsMpm: 0.47,
        advTimeSec: 250, advAccuracy: 34, advMpm: 0.17,
        difficultyTier: 'High Depth & Multi-Concept',
        defaultQuadrant: 'disaster',
        tacticalRule: 'Geometric locus / rotation theorem: high time drain. Strictly Pass 2 or 3.'
    },
    'P&C': {
        chapter: 'P&C',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 160, mainsAccuracy: 52, mainsMpm: 0.6,
        advTimeSec: 230, advAccuracy: 40, advMpm: 0.26,
        difficultyTier: 'High Depth & Multi-Concept',
        defaultQuadrant: 'guess_trap',
        tacticalRule: 'Case-formation traps: double-count risk is extreme. If cases > 4, skip.'
    },
    'Sequences & Series': {
        chapter: 'Sequences & Series',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 100, mainsAccuracy: 80, mainsMpm: 1.8,
        advTimeSec: 150, advAccuracy: 66, advMpm: 0.92,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'AGP & Telescopic sigma: standard algebra manipulation. Pass 1.'
    },
    'Binomial Theorem': {
        chapter: 'Binomial Theorem',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 125, mainsAccuracy: 74, mainsMpm: 1.3,
        advTimeSec: 180, advAccuracy: 58, advMpm: 0.63,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'General term & divisibility remainder: reliable method. Solve in Pass 1.'
    },
    'Statistics': {
        chapter: 'Statistics',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 115, mainsAccuracy: 84, mainsMpm: 1.67,
        advTimeSec: 140, advAccuracy: 80, advMpm: 1.29,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Variance formula Var = E[X^2] - (E[X])^2: guaranteed 4 marks. Pass 1.'
    },
    'Matrices': {
        chapter: 'Matrices',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 95, mainsAccuracy: 82, mainsMpm: 1.96,
        advTimeSec: 145, advAccuracy: 70, advMpm: 1.03,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Matrix powers (A^n) & adjoint properties: high velocity marks.'
    },
    'Determinants': {
        chapter: 'Determinants',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 110, mainsAccuracy: 78, mainsMpm: 1.58,
        advTimeSec: 160, advAccuracy: 65, advMpm: 0.84,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Cramer rule consistency: clean determinants calculation. Priority solve.'
    },
    'Probability': {
        chapter: 'Probability',
        subject: 'Maths',
        unit: 'Algebra',
        mainsTimeSec: 175, mainsAccuracy: 50, mainsMpm: 0.51,
        advTimeSec: 240, advAccuracy: 38, advMpm: 0.23,
        difficultyTier: 'High Depth & Multi-Concept',
        defaultQuadrant: 'guess_trap',
        tacticalRule: 'Bayes theorem: solve if partition is simple; if nested conditionals, skip.'
    },
    'Limits': {
        chapter: 'Limits',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 85, mainsAccuracy: 84, mainsMpm: 2.26,
        advTimeSec: 125, advAccuracy: 72, advMpm: 1.25,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'L\'Hospital & series expansion: high speed conversion. Solve early.'
    },
    'Sets & Relations': {
        chapter: 'Sets & Relations',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 70, mainsAccuracy: 88, mainsMpm: 2.91,
        advTimeSec: 105, advAccuracy: 78, advMpm: 1.66,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Equivalence relation checking: direct verification. Solve in first 30 mins.'
    },
    'Functions': {
        chapter: 'Functions',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 120, mainsAccuracy: 72, mainsMpm: 1.3,
        advTimeSec: 175, advAccuracy: 58, advMpm: 0.65,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Domain, range and periodicity: check endpoints carefully.'
    },
    'C&D': {
        chapter: 'C&D',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 105, mainsAccuracy: 76, mainsMpm: 1.6,
        advTimeSec: 155, advAccuracy: 64, advMpm: 0.85,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Continuity & differentiability at split points: check LHD and RHD.'
    },
    'Differentiation': {
        chapter: 'Differentiation',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 90, mainsAccuracy: 82, mainsMpm: 2.07,
        advTimeSec: 135, advAccuracy: 70, advMpm: 1.11,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Logarithmic & parametric differentiation: direct mechanical steps.'
    },
    'AOD': {
        chapter: 'AOD',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 135, mainsAccuracy: 68, mainsMpm: 1.07,
        advTimeSec: 195, advAccuracy: 54, advMpm: 0.52,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Increasing/decreasing intervals: solve in Pass 1; geometric optimization: Pass 2.'
    },
    'Indefinite Integration': {
        chapter: 'Indefinite Integration',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 155, mainsAccuracy: 60, mainsMpm: 0.77,
        advTimeSec: 220, advAccuracy: 48, advMpm: 0.38,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'time_eater',
        tacticalRule: 'Check if differentiating the 4 options is faster than integrating!'
    },
    'Definite Integration': {
        chapter: 'Definite Integration',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 140, mainsAccuracy: 70, mainsMpm: 1.07,
        advTimeSec: 200, advAccuracy: 56, advMpm: 0.54,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'King\'s property integral f(a+b-x): top yield in JEE calculus. Priority solve.'
    },
    'Area Under Curves': {
        chapter: 'Area Under Curves',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 125, mainsAccuracy: 72, mainsMpm: 1.25,
        advTimeSec: 180, advAccuracy: 60, advMpm: 0.67,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Parabola and line standard area 8/3*(a^2/m^3): memorize shortcut formulas.'
    },
    'Differential Eqns': {
        chapter: 'Differential Eqns',
        subject: 'Maths',
        unit: 'Calculus',
        mainsTimeSec: 110, mainsAccuracy: 80, mainsMpm: 1.64,
        advTimeSec: 165, advAccuracy: 68, advMpm: 0.87,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Linear differential equation (IF = e^int P dx): guaranteed standard marks.'
    },
    'Straight Lines': {
        chapter: 'Straight Lines',
        subject: 'Maths',
        unit: 'Coordinate Geometry',
        mainsTimeSec: 95, mainsAccuracy: 82, mainsMpm: 1.96,
        advTimeSec: 140, advAccuracy: 70, advMpm: 1.07,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Distance between parallel lines & angle bisectors: mechanical solve.'
    },
    'Circle': {
        chapter: 'Circle',
        subject: 'Maths',
        unit: 'Coordinate Geometry',
        mainsTimeSec: 130, mainsAccuracy: 70, mainsMpm: 1.15,
        advTimeSec: 185, advAccuracy: 58, advMpm: 0.62,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Common tangents & orthogonality: write standard condition c^2 = a^2(1+m^2).'
    },
    'Parabola': {
        chapter: 'Parabola',
        subject: 'Maths',
        unit: 'Coordinate Geometry',
        mainsTimeSec: 125, mainsAccuracy: 72, mainsMpm: 1.25,
        advTimeSec: 180, advAccuracy: 60, advMpm: 0.67,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Focal chord & parametric coordinates (at^2, 2at): use standard properties.'
    },
    'Ellipse': {
        chapter: 'Ellipse',
        subject: 'Maths',
        unit: 'Coordinate Geometry',
        mainsTimeSec: 130, mainsAccuracy: 70, mainsMpm: 1.15,
        advTimeSec: 190, advAccuracy: 56, advMpm: 0.57,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Eccentricity and auxiliary circle: clean standard equations.'
    },
    'Hyperbola': {
        chapter: 'Hyperbola',
        subject: 'Maths',
        unit: 'Coordinate Geometry',
        mainsTimeSec: 120, mainsAccuracy: 72, mainsMpm: 1.3,
        advTimeSec: 180, advAccuracy: 58, advMpm: 0.63,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Rectangular hyperbola xy = c^2 and asymptotes: solve in Pass 1.'
    },
    'Vectors': {
        chapter: 'Vectors',
        subject: 'Maths',
        unit: 'Vectors & 3D',
        mainsTimeSec: 90, mainsAccuracy: 84, mainsMpm: 2.13,
        advTimeSec: 135, advAccuracy: 72, advMpm: 1.16,
        difficultyTier: 'Direct Speed',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Scalar triple product [a b c] & vector triple product: top yield in JEE.'
    },
    '3D Geometry': {
        chapter: '3D Geometry',
        subject: 'Maths',
        unit: 'Vectors & 3D',
        mainsTimeSec: 110, mainsAccuracy: 80, mainsMpm: 1.64,
        advTimeSec: 160, advAccuracy: 68, advMpm: 0.9,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Shortest distance between skew lines: guaranteed 4 marks every single shift.'
    },
    'Trigonometry': {
        chapter: 'Trigonometry',
        subject: 'Maths',
        unit: 'Trigonometry',
        mainsTimeSec: 120, mainsAccuracy: 70, mainsMpm: 1.25,
        advTimeSec: 175, advAccuracy: 58, advMpm: 0.65,
        difficultyTier: 'Moderate Calculation',
        defaultQuadrant: 'goldmine',
        tacticalRule: 'Test standard angle values (0, 30, 45, 90) to eliminate incorrect options fast!'
    }
};

/**
 * Normalizes input chapter name to find closest benchmark key
 */
export function getChapterBenchmark(name: string): ChapterBenchmark | undefined {
    if (!name) return undefined;
    const clean = name.trim().toLowerCase();

    // Direct match
    for (const [key, b] of Object.entries(JEE_CHAPTER_BENCHMARKS)) {
        if (key.toLowerCase() === clean) return b;
    }

    // Substring / partial match
    for (const [key, b] of Object.entries(JEE_CHAPTER_BENCHMARKS)) {
        const kClean = key.toLowerCase();
        if (clean.includes(kClean) || kClean.includes(clean)) return b;
    }

    return undefined;
}
