// ============================================================================
// JEE Chemistry Formula & Concept Vault Database
// Physical Constants, Rate Laws, Nernst, Equilibrium, Thermodynamics & Mechanisms
// ============================================================================

import { Formula } from '../../types';

export const CHEMISTRY_FORMULAS: Formula[] = [
    // ---------------------------------------------------------
    // 1. THERMODYNAMICS & THERMOCHEMISTRY
    // ---------------------------------------------------------
    {
        id: 'chem-thermo-001',
        subject: 'Chemistry',
        chapter: 'Thermodynamics',
        topic: 'Gibbs Free Energy & Equilibrium',
        name: 'Gibbs-Helmholtz Equation & Equilibrium Constant',
        latex: '\\Delta G^{\\circ} = \\Delta H^{\\circ} - T\\Delta S^{\\circ} = -2.303 R T \\log_{10} K_{\\text{eq}}',
        description: 'Fundamental thermodynamic criterion for spontaneity and relationship to equilibrium constant.',
        derivationSteps: [
            'From definition of Gibbs Free Energy: G = H - TS.',
            'At constant T: \\Delta G = \\Delta H - T\\Delta S.',
            'Under standard state equilibrium: \\Delta G = \\Delta G^{\\circ} + RT \\ln Q = 0 \\implies \\Delta G^{\\circ} = -RT \\ln K.',
            'Convert natural log to base 10: \\Delta G^{\\circ} = -2.303 R T \\log_{10} K.'
        ],
        commonTraps: [
            'Ensure consistent units: \\Delta H is usually given in kJ/mol while \\Delta S is in J/(mol·K). Always convert!',
            'Reaction is spontaneous at all temperatures only if \\Delta H < 0 and \\Delta S > 0.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Delta G standard = -2.303 RT log K; Watch kJ vs Joules',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'chem-thermo-002',
        subject: 'Chemistry',
        chapter: 'Thermodynamics',
        topic: 'van\'t Hoff Equation',
        name: 'van\'t Hoff Isochore (Temperature Dependence of K)',
        latex: '\\log_{10}\\left(\\frac{K_2}{K_1}\\right) = \\frac{\\Delta H^{\\circ}}{2.303 R} \\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right) = \\frac{\\Delta H^{\\circ}(T_2 - T_1)}{2.303 R T_1 T_2}',
        description: 'Predicts change in equilibrium constant with temperature based on reaction enthalpy.',
        derivationSteps: [
            'Differentiate \\ln K = -\\frac{\\Delta H^{\\circ}}{RT} + \\frac{\\Delta S^{\\circ}}{R} with respect to T.',
            '\\frac{d \\ln K}{dT} = \\frac{\\Delta H^{\\circ}}{R T^2}.',
            'Integrate from T_1 to T_2 assuming \\Delta H^{\\circ} is constant over the temperature range.',
            '\\ln(K_2 / K_1) = -\\frac{\\Delta H^{\\circ}}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right) = \\frac{\\Delta H^{\\circ}}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right).'
        ],
        commonTraps: [
            'For endothermic reactions (\\Delta H > 0), K increases as T increases.',
            'For exothermic reactions (\\Delta H < 0), K decreases as T increases.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'log(K2/K1) = Delta H / 2.303R * (T2 - T1) / (T1 * T2)',
        linkedErrorCodes: ['E3', 'E1']
    },

    // ---------------------------------------------------------
    // 2. ELECTROCHEMISTRY
    // ---------------------------------------------------------
    {
        id: 'chem-elec-001',
        subject: 'Chemistry',
        chapter: 'Electrochemistry',
        topic: 'Electrode Potentials & Cells',
        name: 'Nernst Equation for Galvanic Cell',
        latex: 'E_{\\text{cell}} = E^{\\circ}_{\\text{cell}} - \\frac{2.303 R T}{n F} \\log_{10} Q = E^{\\circ}_{\\text{cell}} - \\frac{0.0591}{n} \\log_{10}\\left(\\frac{[\\text{Anode}]^a}{[\\text{Cathode}]^c}\\right)',
        description: 'Calculates non-standard electromotive force (EMF) of an electrochemical cell at 298 K.',
        derivationSteps: [
            '\\Delta G = \\Delta G^{\\circ} + R T \\ln Q.',
            'Substitute \\Delta G = -n F E_{\\text{cell}} and \\Delta G^{\\circ} = -n F E^{\\circ}_{\\text{cell}}.',
            '-n F E_{\\text{cell}} = -n F E^{\\circ}_{\\text{cell}} + R T \\ln Q.',
            'Divide by -nF: E_{\\text{cell}} = E^{\\circ}_{\\text{cell}} - \\frac{2.303 RT}{nF} \\log_{10} Q.',
            'At T = 298 K, \\frac{2.303 R (298)}{F} \\approx 0.0591.'
        ],
        commonTraps: [
            'Pure solids and pure liquids have activity = 1 (do NOT include solid metals in reaction quotient Q).',
            'Make sure n is the exact total number of moles of electrons transferred in the balanced overall cell redox equation.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'E_cell = E0 - 0.0591/n log Q (Products over Reactants)',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'chem-elec-002',
        subject: 'Chemistry',
        chapter: 'Electrochemistry',
        topic: 'Conductance & Molar Conductivity',
        name: 'Kohlrausch\'s Law of Independent Migration of Ions',
        latex: '\\Lambda_m^{\\circ} = \\nu_+ \\lambda_+^{\\circ} + \\nu_- \\lambda_-^{\\circ}, \\quad \\alpha = \\frac{\\Lambda_m^c}{\\Lambda_m^{\\circ}}, \\quad K_a = \\frac{c \\alpha^2}{1 - \\alpha}',
        description: 'Molar conductivity at infinite dilution and degree of dissociation for weak electrolytes.',
        derivationSteps: [
            'At infinite dilution, interionic attractions become negligible.',
            'Each ion migrates independently and makes a definite individual contribution to molar conductivity.',
            'Degree of dissociation \\alpha = \\Lambda_m^c / \\Lambda_m^{\\circ}.',
            'Ostwald\'s Dilution Law: K_a = c \\alpha^2 / (1 - \\alpha).'
        ],
        commonTraps: [
            'Kohlrausch applies directly at infinite dilution; for weak acids, calculate \\alpha first before finding pH or dissociation constant K_a.',
            'Watch units of conductivity \\kappa (S cm^{-1}) vs molar conductivity \\Lambda_m (S cm^2 mol^{-1}): \\Lambda_m = \\frac{1000 \\kappa}{M}.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Lambda = 1000 kappa over Molarity; alpha = Lambda / Lambda0',
        linkedErrorCodes: ['E3', 'E1']
    },

    // ---------------------------------------------------------
    // 3. CHEMICAL KINETICS
    // ---------------------------------------------------------
    {
        id: 'chem-kin-001',
        subject: 'Chemistry',
        chapter: 'Chemical Kinetics',
        topic: 'First Order Kinetics',
        name: 'Integrated Rate Law & Half-Life',
        latex: 'k = \\frac{2.303}{t} \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right), \\quad t_{1/2} = \\frac{\\ln 2}{k} = \\frac{0.693}{k}',
        description: 'Time concentration relationship and constant half life characteristic of first order reactions.',
        derivationSteps: [
            'Differential rate law: -\\frac{d[A]}{dt} = k[A].',
            'Integrate: \\int_{[A]_0}^{[A]_t} \\frac{d[A]}{[A]} = -k \\int_0^t dt.',
            '\\ln\\left(\\frac{[A]_t}{[A]_0}\\right) = -kt \\implies [A]_t = [A]_0 e^{-kt}.',
            'At half-life [A]_t = [A]_0/2: t_{1/2} = \\frac{\\ln 2}{k} = \\frac{0.693}{k}.'
        ],
        commonTraps: [
            'Half-life of first-order reaction is completely independent of initial concentration [A]_0.',
            'For nth order reaction: t_{1/2} \\propto \\frac{1}{[A]_0^{n-1}}.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 't_half = 0.693 / k; 99.9% completion takes 10 half-lives',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'chem-kin-002',
        subject: 'Chemistry',
        chapter: 'Chemical Kinetics',
        topic: 'Arrhenius Equation',
        name: 'Temperature Dependence of Rate Constant',
        latex: 'k = A e^{-E_a / R T} \\implies \\log_{10}\\left(\\frac{k_2}{k_1}\\right) = \\frac{E_a}{2.303 R}\\left(\\frac{T_2 - T_1}{T_1 T_2}\\right)',
        description: 'Quantifies activation energy barrier and reaction rate acceleration with temperature.',
        derivationSteps: [
            'Arrhenius equation: k = A e^{-E_a / RT}.',
            'Take natural log: \\ln k = \\ln A - \\frac{E_a}{RT}.',
            'At two temperatures T_1, T_2: \\ln(k_2/k_1) = -\\frac{E_a}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right) = \\frac{E_a}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right).',
            'Convert to base 10 log.'
        ],
        commonTraps: [
            'Slope of \\ln k vs 1/T plot is -E_a / R. Slope of \\log_{10} k vs 1/T is -E_a / 2.303R.',
            'A catalyst lowers E_a by creating an alternative pathway with lower barrier, increasing k exponentially.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'log(k2/k1) = Ea / 2.303R * delta T / (T1 * T2)',
        linkedErrorCodes: ['E3', 'E1']
    },

    // ---------------------------------------------------------
    // 4. SOLUTIONS & COLLIGATIVE PROPERTIES
    // ---------------------------------------------------------
    {
        id: 'chem-sol-001',
        subject: 'Chemistry',
        chapter: 'Solutions',
        topic: 'Colligative Properties',
        name: 'van\'t Hoff Factor & Colligative Equations',
        latex: 'i = 1 + (n - 1)\\alpha, \\quad \\Delta T_b = i K_b m, \\quad \\Delta T_f = i K_f m, \\quad \\pi = i C R T',
        description: 'van\'t Hoff factor modification for dissociation/association in colligative properties.',
        derivationSteps: [
            'For dissociation: A_n \\rightleftharpoons n A. Total particles = 1 - \\alpha + n\\alpha = 1 + (n - 1)\\alpha.',
            'For association: n A \\rightleftharpoons A_n. Total particles = 1 - \\alpha + \\alpha/n = 1 + (1/n - 1)\\alpha.',
            'All colligative properties scale proportionally by i.'
        ],
        commonTraps: [
            'Do not forget van\'t Hoff factor i for ionic salts (e.g. i = 3 for CaCl_2, i = 2 for NaCl).',
            'Elevation in boiling point and depression in freezing point use Molality (m, mol/kg solvent), NOT Molarity.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'i = 1 + (n-1)alpha; m is molality (kg of solvent)',
        linkedErrorCodes: ['E3', 'E4']
    },

    // ---------------------------------------------------------
    // 5. INORGANIC & COORDINATION CHEMISTRY
    // ---------------------------------------------------------
    {
        id: 'chem-coord-001',
        subject: 'Chemistry',
        chapter: 'Coordination Compounds',
        topic: 'Crystal Field Theory',
        name: 'Crystal Field Splitting & Spin-Only Magnetic Moment',
        latex: '\\Delta_t = \\frac{4}{9}\\Delta_o, \\quad \\mu_s = \\sqrt{n(n + 2)} \\text{ B.M.}',
        description: 'Splitting parameter relation between tetrahedral and octahedral complexes and magnetic moment.',
        derivationSteps: [
            'In tetrahedral geometry, ligands do not point directly along d-orbitals, reducing electrostatic repulsion.',
            'Geometric calculation gives \\Delta_t = \\frac{4}{9} \\Delta_o.',
            'Spin-only formula: \\mu = \\sqrt{4S(S + 1)} = \\sqrt{n(n + 2)} \\text{ Bohr Magnetons (B.M.)} where n = number of unpaired electrons.'
        ],
        commonTraps: [
            'Strong field ligands (CN^-, CO, en, NH_3) cause pairing if \\Delta_o > P (pairing energy), leading to low-spin complexes.',
            'Tetrahedral complexes are almost always high-spin because \\Delta_t is always smaller than pairing energy P.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Tetrahedral is 4/9 Octahedral; root n(n+2) BM',
        linkedErrorCodes: ['E1', 'E3']
    },

    // ---------------------------------------------------------
    // 6. MULTI-DOMAIN BRIDGES & JEE ADVANCED DIRECT CUT RESULTS
    // ---------------------------------------------------------
    {
        id: 'chem-adv-001',
        subject: 'Chemistry',
        chapter: 'Electrochemistry',
        topic: 'Thermodynamics of Galvanic Cells',
        name: 'Temperature Coefficient of Cell EMF & Enthalpy/Entropy',
        latex: '\\Delta S = n F \\left(\\frac{\\partial E_{\\text{cell}}}{\\partial T}\\right)_P, \\quad \\Delta H = -n F E_{\\text{cell}} + n F T \\left(\\frac{\\partial E_{\\text{cell}}}{\\partial T}\\right)_P, \\quad q_{\\text{rev}} = n F T \\left(\\frac{\\partial E}{\\partial T}\\right)_P',
        description: 'Exact thermodynamic relations between the temperature variation of cell potential (\\partial E / \\partial T)_P and the reaction entropy \\Delta S and enthalpy \\Delta H.',
        category: 'Multi-Domain Bridge',
        linkedChapters: ['Electrochemistry', 'Thermodynamics'],
        jeeYearOrigin: 'IIT-JEE 2003 / 2011 Subjective',
        directApplicationContext: 'Deploy immediately when given dE/dT of a galvanic cell. Bypasses setting up Maxwell thermodynamic differential relations in the exam.',
        derivationSteps: [
            'From fundamental thermodynamics: dG = V dP - S dT. At constant pressure: (\\partial G / \\partial T)_P = -\\Delta S.',
            'Since \\Delta G = -n F E_{\\text{cell}}, differentiate with respect to T: -n F (\\partial E_{\\text{cell}} / \\partial T)_P = -\\Delta S \\implies \\Delta S = n F (\\partial E / \\partial T)_P.',
            'Substitute \\Delta G and \\Delta S into Gibbs-Helmholtz equation \\Delta H = \\Delta G + T \\Delta S.',
            '\\Delta H = -n F E_{\\text{cell}} + n F T (\\partial E_{\\text{cell}} / \\partial T)_P.',
            'Reversible heat absorbed: q_{\\text{rev}} = T \\Delta S = n F T (\\partial E / \\partial T)_P.'
        ],
        commonTraps: [
            'Watch signs: If (\\partial E/\\partial T)_P > 0, cell absorbs heat from surroundings (q_rev > 0) upon operation.',
            'F = 96,500 C/mol; answer is in Joules. Convert to kJ by dividing by 1,000!'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Delta S is n F (dE/dT); Delta H is -nFE + nFT(dE/dT)',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'chem-adv-002',
        subject: 'Chemistry',
        chapter: 'Chemical Kinetics',
        topic: 'Parallel & Branching Reactions',
        name: 'Parallel First-Order Kinetics & Effective Activation Energy',
        latex: 'k_{\\text{eff}} = k_1 + k_2, \\quad \\% \\text{Yield of } B = \\frac{k_1}{k_1 + k_2} \\times 100\\%, \\quad E_{a,\\text{eff}} = \\frac{k_1 E_{a1} + k_2 E_{a2}}{k_1 + k_2}',
        description: 'Decomposition of reactant A simultaneously into products B and C via parallel rate constants k_1 and k_2. Composite overall activation energy is a weighted harmonic average.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Chemical Kinetics', 'Thermodynamics'],
        jeeYearOrigin: 'IIT-JEE 2002 / 2016',
        directApplicationContext: 'Solve competitive parallel pathway yields and combined temperature sensitivity in under 30 seconds.',
        derivationSteps: [
            'Differential rate: -\\frac{d[A]}{dt} = k_1 [A] + k_2 [A] = (k_1 + k_2)[A] = k_{\\text{eff}}[A].',
            'Product formation ratio: \\frac{d[B]/dt}{d[C]/dt} = \\frac{k_1 [A]}{k_2 [A]} = \\frac{k_1}{k_2} \\implies [B]/[C] = k_1 / k_2 at all times.',
            'Differentiate Arrhenius form \\ln k_{\\text{eff}} = \\ln(k_1 + k_2) with respect to T.',
            '\\frac{E_{a,\\text{eff}}}{R T^2} = \\frac{1}{k_1 + k_2} \\left(k_1 \\frac{E_{a1}}{R T^2} + k_2 \\frac{E_{a2}}{R T^2}\\right).',
            'Canceling R T^2 yields E_{a,\\text{eff}} = \\frac{k_1 E_{a1} + k_2 E_{a2}}{k_1 + k_2}.'
        ],
        commonTraps: [
            'Ratio of products [B]/[C] is strictly independent of time, but DOES depend on temperature if E_a1 != E_a2.',
            'The pathway with higher activation energy becomes increasingly dominant at higher temperatures.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'k_eff is sum of k\'s; Ea_eff is weighted average by rate constants',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'chem-adv-003',
        subject: 'Chemistry',
        chapter: 'Chemical Kinetics',
        topic: 'Consecutive & Sequential Reactions',
        name: 'Consecutive First-Order Peak Intermediate Time & Concentration',
        latex: 't_{\\max} = \\frac{\\ln(k_1 / k_2)}{k_1 - k_2} = \\frac{2.303 \\log_{10}(k_1/k_2)}{k_1 - k_2}, \\quad [B]_{\\max} = [A]_0 \\left(\\frac{k_2}{k_1}\\right)^{\\frac{k_2}{k_1 - k_2}}',
        description: 'Exact time and maximum concentration reached by intermediate B in the consecutive first-order reaction sequence A -> B -> C.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Chemical Kinetics'],
        jeeYearOrigin: 'IIT-JEE 1998 / 2007 Subjective',
        directApplicationContext: 'Direct calculation of peak radioactive daughter nuclide buildup or chemical intermediate concentration without solving the differential equation.',
        derivationSteps: [
            'Differential rate for intermediate: \\frac{d[B]}{dt} = k_1 [A] - k_2 [B] = k_1 [A]_0 e^{-k_1 t} - k_2 [B].',
            'Solving integrating factor differential equation gives [B](t) = \\frac{k_1 [A]_0}{k_2 - k_1}(e^{-k_1 t} - e^{-k_2 t}).',
            'To find maximum, set d[B]/dt = 0 \\implies k_1 e^{-k_1 t_{\\max}} = k_2 e^{-k_2 t_{\\max}}.',
            'Taking natural log: \\ln k_1 - k_1 t_{\\max} = \\ln k_2 - k_2 t_{\\max} \\implies t_{\\max} = \\frac{\\ln(k_1/k_2)}{k_1 - k_2}.',
            'Substituting t_max back into [B](t) yields [B]_{\\max} = [A]_0 (k_2 / k_1)^{k_2 / (k_1 - k_2)}.'
        ],
        commonTraps: [
            'Notice symmetry: formula gives identical positive t_max regardless of whether k_1 > k_2 or k_2 > k_1.',
            'If k_2 >> k_1 (Steady State Approximation), intermediate [B] is very small and reaches steady state rapidly.'
        ],
        jeeFrequency: 'High',
        mnemonics: 't_max = ln(k1/k2) / (k1 - k2); B_max depends only on ratio of k2 over k1',
        linkedErrorCodes: ['E2', 'E4']
    },
    {
        id: 'chem-adv-004',
        subject: 'Chemistry',
        chapter: 'Ionic Equilibrium',
        topic: 'Polyprotic Salts & Amphiprotic Species',
        name: 'pH of Amphiprotic Anion Solutions (Concentration Invariant)',
        latex: '\\text{pH} = \\frac{\\text{pK}_{a1} + \\text{pK}_{a2}}{2} \\quad \\text{(For } HA^- \\text{ such as } \\text{HCO}_3^-, \\text{HS}^-, \\text{H}_2\\text{PO}_4^-\\text{)}',
        description: 'Closed-form pH equation for amphiprotic salt solutions where the anion can both donate and accept protons. Strictly independent of salt concentration at moderate dilutions.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Ionic Equilibrium'],
        jeeYearOrigin: 'Classic IIT-JEE / Advanced',
        directApplicationContext: 'Use directly whenever asked for pH of NaHCO3, NaHS, NaH2PO4, or amino acid isoelectric point. Salt concentration cancels out completely!',
        derivationSteps: [
            'Equilibria: HA^- + H_2O <=> H_3O^+ + A^{2-} (K_{a2} = [H^+][A^{2-}] / [HA^-]).',
            'HA^- + H_2O <=> H_2A + OH^- (K_b = K_w / K_{a1} = [H_2A][OH^-] / [HA^-]).',
            'Charge and mass balance shows [H_2A] \\approx [A^{2-}].',
            'Multiply equilibria: [H^+]^2 = K_{a1} K_{a2} \\frac{[HA^-] + K_{a1}}{[HA^-] + K_{a1} K_w / (K_{a2} [HA^-])}.',
            'At moderate concentrations ([HA^-] >> K_a1): [H^+] = \\sqrt{K_{a1} K_{a2}} \\implies \\text{pH} = \\frac{1}{2}(\\text{pK}_{a1} + \\text{pK}_{a2}).'
        ],
        commonTraps: [
            'For H2PO4^-, use pKa1 and pKa2. For HPO4^(2-), use pKa2 and pKa3!',
            'Fails only at extreme dilutions (< 10^-5 M) where water autoionization term becomes non-negligible.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Amphiprotic pH is simply the average of the two straddling pKa values',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'chem-adv-005',
        subject: 'Chemistry',
        chapter: 'Ionic Equilibrium',
        topic: 'Simultaneous Solubility with Common Ion',
        name: 'Simultaneous Solubility of Two Sparingly Soluble Salts',
        latex: '[\\text{Ag}^+] = \\sqrt{K_{sp1} + K_{sp2}}, \\quad s_1 = \\frac{K_{sp1}}{\\sqrt{K_{sp1} + K_{sp2}}}, \\quad s_2 = \\frac{K_{sp2}}{\\sqrt{K_{sp1} + K_{sp2}}}',
        description: 'Simultaneous solubilities s_1 and s_2 of two salts having a common cation (e.g. AgCl and AgBr in pure water). Mutual common ion effect suppresses both solubilities.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Ionic Equilibrium'],
        jeeYearOrigin: 'IIT-JEE 2000 Subjective',
        directApplicationContext: 'Direct calculation when AgCl and AgBr, or CaSO4 and Ca(OH)2 are shaken together in water.',
        derivationSteps: [
            'Let s_1 be solubility of AgCl and s_2 be solubility of AgBr.',
            'Total [Ag^+] = s_1 + s_2; [Cl^-] = s_1; [Br^-] = s_2.',
            'K_{sp1} = (s_1 + s_2) s_1, \\quad K_{sp2} = (s_1 + s_2) s_2.',
            'Adding equations: K_{sp1} + K_{sp2} = (s_1 + s_2)^2 \\implies [Ag^+] = s_1 + s_2 = \\sqrt{K_{sp1} + K_{sp2}}.',
            'Dividing gives s_1 = K_{sp1} / [Ag^+] and s_2 = K_{sp2} / [Ag^+].'
        ],
        commonTraps: [
            'Do not calculate s_1 = sqrt(K_sp1) independently; mutual suppression reduces both!',
            'Ratio of dissolved anions [Cl^-]/[Br^-] is exactly K_sp1 / K_sp2.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'Common ion concentration is root of sum of K_sp values',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'chem-adv-006',
        subject: 'Chemistry',
        chapter: 'General Organic Chemistry',
        topic: 'Structure Elucidation & DBE',
        name: 'Double Bond Equivalent (Degree of Unsaturation / IHD)',
        latex: '\\text{DBE} = C + 1 - \\frac{H}{2} - \\frac{X}{2} + \\frac{N}{2} = \\frac{2C + 2 - H - X + N}{2}',
        description: 'Universal formula for the total number of rings and pi bonds in any neutral organic molecule with molecular formula C_c H_h N_n O_o X_x.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['General Organic Chemistry', 'Hydrocarbons'],
        jeeYearOrigin: 'Universal JEE Advanced Structural Elucidation',
        directApplicationContext: 'First step in solving ANY organic unknown molecular formula question in JEE Advanced. Oxygen and Sulfur atoms are completely ignored in DBE.',
        derivationSteps: [
            'Fully saturated acyclic alkane with C carbons and N nitrogens has H_{\\max} = 2C + 2 + N hydrogens.',
            'Halogens X count as hydrogens (1 monovalent bond each).',
            'Divalent oxygen and sulfur do not alter the required hydrogen count.',
            'Each ring or pi bond reduces the hydrogen count by 2.',
            'DBE = (H_{\\max} - H_{\\text{actual}} - X) / 2 = C + 1 - H/2 - X/2 + N/2.'
        ],
        commonTraps: [
            'Benzene ring has DBE = 4 (1 ring + 3 pi bonds). Always suspect benzene if DBE >= 4.',
            'Ignore Oxygen and Sulfur completely; Nitrogen increases DBE calculation (+N/2).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Carbons plus 1, minus half hydrogens and halogens, plus half nitrogens; ignore oxygens',
        linkedErrorCodes: ['E1', 'E2']
    },

    // ---------------------------------------------------------
    // 7. HIGH-PITFALL FORMULAS & STUDENT TRAP ANCHORS
    // ---------------------------------------------------------
    {
        id: 'chem-trap-001',
        subject: 'Chemistry',
        chapter: 'Electrochemistry',
        topic: 'Nernst Equation',
        name: 'Nernst Equation Master Form (The Stoichiometric Exponent & Sign Trap)',
        latex: 'E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n} \\log_{10} Q = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n} \\log_{10}\\left(\\frac{[\\text{Products}]^p}{[\\text{Reactants}]^r}\\right)',
        description: 'Dependence of cell potential on reaction quotient Q, temperature (at 298 K), and stoichiometric coefficients.',
        category: 'Standard',
        linkedChapters: ['Electrochemistry', 'Chemical Equilibrium'],
        jeeYearOrigin: 'Universal JEE Main & Advanced High-Yield',
        directApplicationContext: 'Evaluate cell potential under non-standard conditions. Pure solids (like Cu, Zn electrodes) and pure liquids have activity = 1 and are excluded from Q.',
        derivationSteps: [
            'From thermodynamics: \\Delta G = \\Delta G^\\circ + R T \\ln Q.',
            'Substitute \\Delta G = -n F E_{\\text{cell}} and \\Delta G^\\circ = -n F E^\\circ_{\\text{cell}}.',
            '-n F E_{\\text{cell}} = -n F E^\\circ_{\\text{cell}} + R T \\ln Q.',
            'Dividing by -n F gives E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{R T}{n F} \\ln Q = E^\\circ_{\\text{cell}} - \\frac{2.303 R T}{n F} \\log_{10} Q.',
            'At T = 298 K, \\frac{2.303 R (298)}{F} = 0.05916 \\text{ V}.'
        ],
        commonTraps: [
            'FATAL EXPONENT TRAP: In reaction 2Al + 3Cu^(2+) -> 2Al^(3+) + 3Cu, n = 6 electrons (LCM of 2 and 3!). Q = [Al^(3+)]^2 / [Cu^(2+)]^3. Students constantly forget to square and cube concentrations!',
            'FATAL SIGN TRAP: If using MINUS sign (- 0.0591/n), the argument inside log is Products / Reactants. If using PLUS sign (+ 0.0591/n), the argument is Reactants / Products.',
            'Concentration cells (E^\\circ = 0): E_{\\text{cell}} = -\\frac{0.0591}{n} \\log(C_1 / C_2); for spontaneity, anode concentration C_1 must be less than cathode C_2.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'E = E0 minus 0.0591/n log(Products/Reactants); n is total electrons in balanced equation',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'chem-trap-002',
        subject: 'Chemistry',
        chapter: 'Chemical Kinetics',
        topic: 'Arrhenius Equation',
        name: 'Arrhenius Temperature Ratio (T1 vs T2 Inversion Trap)',
        latex: '\\log_{10}\\left(\\frac{k_2}{k_1}\\right) = \\frac{E_a}{2.303 R} \\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right) = \\frac{E_a (T_2 - T_1)}{2.303 R T_1 T_2}',
        description: 'Quantifies rate constant sensitivity to temperature based on activation energy E_a.',
        category: 'Standard',
        linkedChapters: ['Chemical Kinetics'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Find activation energy E_a when rate doubles with a 10 K rise in temperature (temperature coefficient).',
        derivationSteps: [
            'Arrhenius form: k = A e^{-E_a / (RT)} \\implies \\ln k = \\ln A - \\frac{E_a}{R T}.',
            'Subtracting equations for T_2 and T_1: \\ln(k_2 / k_1) = -\\frac{E_a}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right) = \\frac{E_a}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right).',
            'Convert natural log to base 10: \\log_{10}(k_2 / k_1) = \\frac{E_a}{2.303 R} \\left(\\frac{T_2 - T_1}{T_1 T_2}\\right).'
        ],
        commonTraps: [
            'FATAL ORDER TRAP: If T_2 > T_1, then k_2 > k_1, so log(k_2/k_1) > 0. In the parenthesis with reciprocal temperatures, 1/T_1 comes FIRST (since 1/T_1 > 1/T_2)! In the difference form, (T_2 - T_1) is on top.',
            'UNITS TRAP: R = 8.314 J/(mol K). If E_a is asked in kJ/mol, divide by 1000!',
            'Temperatures T_1 and T_2 MUST ALWAYS be in Kelvin (K = °C + 273.15).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'log(k2/k1) = Ea / 2.303R times (T2 - T1) / (T1 * T2); Higher T always gives higher rate',
        linkedErrorCodes: ['E1', 'E2']
    },
    {
        id: 'chem-trap-003',
        subject: 'Chemistry',
        chapter: 'Solutions',
        topic: 'Colligative Properties & Raoult\'s Law',
        name: 'Raoult\'s Law: Solution Pressure vs Pure Solvent Denominator Trap',
        latex: '\\frac{P^\\circ - P_s}{P^\\circ} = X_{\\text{solute}} = \\frac{n}{n + N} \\iff \\frac{P^\\circ - P_s}{P_s} = \\frac{n}{N} = \\frac{m \\times M_{\\text{solvent}}}{1000}',
        description: 'Exact relative lowering of vapor pressure. Using solution pressure P_s in denominator directly eliminates solute moles in denominator, converting directly to Molality m.',
        category: 'Standard',
        linkedChapters: ['Solutions'],
        jeeYearOrigin: 'JEE Main & Advanced Classic Shortcut',
        directApplicationContext: 'Use (P^\\circ - P_s) / P_s = m * M_solvent / 1000 to solve molality and molar mass questions WITHOUT making dilute solution approximations.',
        derivationSteps: [
            'From Raoult\'s law: P_s = X_{\\text{solvent}} P^\\circ = (1 - X_{\\text{solute}}) P^\\circ.',
            'Rearranging gives \\frac{P^\\circ - P_s}{P^\\circ} = X_{\\text{solute}} = \\frac{n}{n + N}.',
            'Invert both sides: \\frac{P^\\circ}{P^\\circ - P_s} = \\frac{n + N}{n} = 1 + \\frac{N}{n}.',
            'Subtract 1 from both sides: \\frac{P^\\circ - (P^\\circ - P_s)}{P^\\circ - P_s} = \\frac{P_s}{P^\\circ - P_s} = \\frac{N}{n}.',
            'Inverting back yields \\frac{P^\\circ - P_s}{P_s} = \\frac{n}{N} = \\frac{m \\times M_{\\text{solvent}}}{1000}.'
        ],
        commonTraps: [
            'FATAL DENOMINATOR TRAP: Standard Raoult\'s law has P^\\circ in denominator and equals mole fraction X_solute = n / (n + N).',
            'The shortcut formula has P_s (solution vapor pressure) in denominator and equals n / N = m * M_solvent / 1000.',
            'For electrolyte solutions: multiply right-hand side by van \'t Hoff factor i!'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Divide by P0 gives mole fraction n/(n+N); Divide by Ps gives pure ratio n/N = molality shortcut',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'chem-trap-004',
        subject: 'Chemistry',
        chapter: 'Ionic Equilibrium',
        topic: 'Salt Hydrolysis',
        name: 'Salt Hydrolysis pH Triad (The Concentration Independence Trap)',
        latex: '\\begin{cases} \\text{Weak Acid + Strong Base: } & \\text{pH} = 7 + \\frac{1}{2}\\text{pK}_a + \\frac{1}{2}\\log_{10} c \\\\[6pt] \\text{Strong Acid + Weak Base: } & \\text{pH} = 7 - \\frac{1}{2}\\text{pK}_b - \\frac{1}{2}\\log_{10} c \\\\[6pt] \\text{Weak Acid + Weak Base: } & \\text{pH} = 7 + \\frac{1}{2}(\\text{pK}_a - \\text{pK}_b) \\quad (\\text{Concentration Independent!}) \\end{cases}',
        description: 'Complete pH formulas for all three classes of hydrolyzing salts at 25 °C.',
        category: 'Standard',
        linkedChapters: ['Ionic Equilibrium'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Instant pH calculation for salts like CH3COONa, NH4Cl, and CH3COONH4.',
        derivationSteps: [
            'For WA + SB (e.g. CH3COONa): Anion hydrolysis A^- + H2O <=> HA + OH^- (K_h = K_w / K_a).',
            '[OH^-] = c h = \\sqrt{K_h c} = \\sqrt{\\frac{K_w c}{K_a}} \\implies [H^+] = \\sqrt{\\frac{K_w K_a}{c}}.',
            'Taking negative log gives pH = 1/2 [pK_w + pK_a + log c] = 7 + 1/2 pK_a + 1/2 log c.',
            'For WA + WB (e.g. CH3COONH4): K_h = K_w / (K_a K_b). [H^+] = \\sqrt{\\frac{K_w K_a}{K_b}}.',
            'pH = 7 + 1/2 (pK_a - pK_b). Concentration c cancels out completely!'
        ],
        commonTraps: [
            'FATAL SIGN TRAP: For WA + SB (basic salt), pH MUST be > 7, so it has PLUS (+ 1/2 pKa + 1/2 log c). For SA + WB (acidic salt), pH MUST be < 7, so it has MINUS (- 1/2 pKb - 1/2 log c).',
            'FATAL CONCENTRATION TRAP: Salt of Weak Acid + Weak Base has NO log c term! Diluting the solution does NOT change its pH at all.',
            'Salt of Strong Acid + Strong Base (NaCl) does NOT hydrolyze; pH = 7.00.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Basic salt has PLUS pKa; Acidic salt has MINUS pKb; Weak-Weak salt is strictly concentration-independent',
        linkedErrorCodes: ['E1', 'E2']
    },
    {
        id: 'chem-trap-005',
        subject: 'Chemistry',
        chapter: 'Atomic Structure',
        topic: 'Bohr Model of Hydrogen-Like Atoms',
        name: 'Bohr Orbit Triad: Radius vs Velocity vs Energy (The n/Z Inversion Trap)',
        latex: 'r_n = 0.529 \\frac{n^2}{Z}\\,\\text{\\AA}, \\quad v_n = 2.18 \\times 10^6 \\frac{Z}{n}\\,\\text{m/s}, \\quad E_n = -13.6 \\frac{Z^2}{n^2}\\,\\text{eV/atom}',
        description: 'Dependence of radius, orbital velocity, and total electronic energy on principal quantum number n and atomic number Z for single-electron species (H, He+, Li2+, Be3+).',
        category: 'Standard',
        linkedChapters: ['Atomic Structure', 'Modern Physics'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Instant comparison of spectral transitions, ionization energies, and orbital time periods T \\propto n^3 / Z^2.',
        derivationSteps: [
            'Quantization of angular momentum: m v r = \\frac{n h}{2\\pi}.',
            'Coulomb centripetal balance: \\frac{m v^2}{r} = \\frac{1}{4\\pi \\varepsilon_0} \\frac{Z e^2}{r^2}.',
            'Solving for radius: r_n = \\frac{\\varepsilon_0 n^2 h^2}{\\pi m Z e^2} = 0.529 \\frac{n^2}{Z}\\,\\text{\\AA}.',
            'Solving for velocity: v_n = \\frac{Z e^2}{2 \\varepsilon_0 n h} = 2.18 \\times 10^6 \\frac{Z}{n}\\,\\text{m/s}.',
            'Total energy: E = K + U = \\frac{1}{2}U = -K = -13.6 \\frac{Z^2}{n^2}\\,\\text{eV}.'
        ],
        commonTraps: [
            'FATAL POWER FLIP TRAP: Radius is n^2 / Z (n in numerator, Z in denominator). Energy is Z^2 / n^2 (Z in numerator, n in denominator).',
            'Velocity is Z / n (linear power, NOT squared!).',
            'Potential Energy U = 2 x Total Energy E; Kinetic Energy K = - Total Energy E (K is strictly positive).',
            'Orbital period: T = 2pi r / v \\propto (n^2/Z) / (Z/n) = n^3 / Z^2.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Radius grows with n squared (n^2/Z); Energy drops with n squared (Z^2/n^2); Time period goes as n cubed',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'chem-trap-006',
        subject: 'Chemistry',
        chapter: 'Solid State',
        topic: 'Cubic Crystal Systems & Voids',
        name: 'Cubic Lattice Geometries & Void Ratio (SC vs BCC vs FCC)',
        latex: '\\text{SC: } a = 2r, \\quad \\text{BCC: } a\\sqrt{3} = 4r, \\quad \\text{FCC: } a\\sqrt{2} = 4r \\quad (a = 2\\sqrt{2}r)',
        description: 'Fundamental geometrical relations between unit cell edge length a and sphere radius r, packing efficiencies, and coordination numbers.',
        category: 'Standard',
        linkedChapters: ['Solid State'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Density of unit cell: \\rho = \\frac{Z_{\\text{eff}} \\cdot M}{N_A \\cdot a^3}.',
        derivationSteps: [
            'SC: Spheres touch along edge \\implies a = 2r. Z = 1, P.E. = \\pi/6 \\approx 52.4\\%, CN = 6.',
            'BCC: Spheres touch along body diagonal \\implies a\\sqrt{3} = 4r. Z = 2, P.E. = \\pi\\sqrt{3}/8 \\approx 68\\%, CN = 8.',
            'FCC / CCP: Spheres touch along face diagonal \\implies a\\sqrt{2} = 4r. Z = 4, P.E. = \\pi\\sqrt{2}/6 \\approx 74\\%, CN = 12.',
            'For FCC containing N atoms: Number of Octahedral Voids = N (at edge centers + body center); Number of Tetrahedral Voids = 2N (2 per body diagonal).'
        ],
        commonTraps: [
            'FATAL TOUCHING AXIS TRAP: BCC touches along BODY diagonal (sqrt(3) a = 4r). FCC touches along FACE diagonal (sqrt(2) a = 4r).',
            'Void count: Tetrahedral voids are TWICE the number of atoms (2N); Octahedral voids EQUAL the number of atoms (N).',
            'Radius of void: r_{octahedral} = 0.414 R_{atom}; r_{tetrahedral} = 0.225 R_{atom}.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'BCC has body diagonal (sqrt 3 a = 4r); FCC has face diagonal (sqrt 2 a = 4r); Tetra voids = 2N, Octa voids = N',
        linkedErrorCodes: ['E2', 'E4']
    },
    {
        id: 'chem-trap-007',
        subject: 'Chemistry',
        chapter: 'Thermodynamics',
        topic: 'Gibbs Free Energy & Equilibrium',
        name: 'Gibbs-Helmholtz & Equilibrium Constant (The Factor of 1000 Unit Trap)',
        latex: '\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ = -RT \\ln K_{\\text{eq}} = -2.303 RT \\log_{10} K_{\\text{eq}}',
        description: 'Fundamental thermodynamic criterion for spontaneity and equilibrium constant connection.',
        category: 'Standard',
        linkedChapters: ['Thermodynamics', 'Chemical Equilibrium'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Predicting equilibrium constants from standard enthalpy and entropy changes at any temperature.',
        derivationSteps: [
            'At equilibrium: \\Delta G = 0 and Q = K_{\\text{eq}}.',
            'From \\Delta G = \\Delta G^\\circ + RT \\ln Q \\implies 0 = \\Delta G^\\circ + RT \\ln K_{\\text{eq}}.',
            'Therefore \\Delta G^\\circ = -RT \\ln K_{\\text{eq}} = -2.303 RT \\log_{10} K_{\\text{eq}}.',
            'Equating to enthalpy-entropy: \\ln K_{\\text{eq}} = -\\frac{\\Delta H^\\circ}{RT} + \\frac{\\Delta S^\\circ}{R}.'
        ],
        commonTraps: [
            'FATAL UNIT TRAP (Factor of 1000): \\Delta H^\\circ is almost always given in KILOJOULES (kJ/mol), while \\Delta S^\\circ and R are in JOULES (J/mol-K). You MUST multiply \\Delta H by 1000 or divide \\Delta S by 1000 before subtracting!',
            'FATAL TEMPERATURE UNIT: T MUST be in Kelvin (T_K = T_C + 273.15). Never plug Celsius.',
            'Spontaneity: \\Delta G^\\circ < 0 implies K > 1 (products favored at standard state), NOT that reaction proceeds instantaneously (kinetics depends on E_a).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Delta H is in kJ, Delta S is in Joules: Always convert to same units! Delta G standard = -2.303 RT log K',
        linkedErrorCodes: ['E1', 'E3']
    }
];
