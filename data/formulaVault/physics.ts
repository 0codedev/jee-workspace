// ============================================================================
// JEE Physics Formula & Concept Vault Database
// Curated High-Frequency JEE Main & Advanced Formulas with KaTeX LaTeX notation
// ============================================================================

import { Formula } from '../../types';

export const PHYSICS_FORMULAS: Formula[] = [
    // ---------------------------------------------------------
    // 1. KINEMATICS & 1D/2D MOTION
    // ---------------------------------------------------------
    {
        id: 'phy-kin-001',
        subject: 'Physics',
        chapter: 'Kinematics',
        topic: '1D Motion with Constant Acceleration',
        name: 'Displacement in nth Second',
        latex: 'S_n = u + \\frac{a}{2}(2n - 1)',
        description: 'Distance traversed specifically during the nth single second under uniform acceleration.',
        derivationSteps: [
            'S_n = S(n) - S(n-1)',
            'S(n) = un + \\frac{1}{2}an^2',
            'S(n-1) = u(n-1) + \\frac{1}{2}a(n-1)^2',
            'Subtracting gives S_n = u + \\frac{a}{2}(2n - 1)'
        ],
        commonTraps: [
            'Formula is dimensionally inhomogeneous unless multiplied by 1 second unit [T].',
            'Fails if acceleration is velocity-dependent or non-uniform.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'u plus half-a times odd number (2n-1)',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'phy-kin-002',
        subject: 'Physics',
        chapter: 'Kinematics',
        topic: 'Projectile Motion',
        name: 'Trajectory Equation in terms of Range',
        latex: 'y = x \\tan\\theta \\left(1 - \\frac{x}{R}\\right)',
        description: 'Parabolic trajectory equation expressed directly with Horizontal Range R.',
        derivationSteps: [
            'y = x \\tan\\theta - \\frac{g x^2}{2 u^2 \\cos^2\\theta}',
            'Factor out x \\tan\\theta: y = x \\tan\\theta \\left(1 - \\frac{g x}{2 u^2 \\sin\\theta \\cos\\theta}\\right)',
            'Recall R = \\frac{u^2 \\sin 2\\theta}{g} = \\frac{2 u^2 \\sin\\theta \\cos\\theta}{g}',
            'Substituting R gives y = x \\tan\\theta (1 - x/R)'
        ],
        commonTraps: [
            'Only valid when the landing plane is horizontal at y = 0.',
            'x cannot exceed R in physical forward projectile path.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'y = x tan theta (1 minus x over Range)',
        linkedErrorCodes: ['E3', 'E1']
    },
    {
        id: 'phy-kin-003',
        subject: 'Physics',
        chapter: 'Kinematics',
        topic: 'Relative Motion',
        name: 'Shortest Distance Between Moving Particles',
        latex: 'd_{\\min} = \\frac{|\\vec{r}_{21} \\times \\vec{v}_{21}|}{|\\vec{v}_{21}|}',
        description: 'Minimum geometric clearance distance between two moving bodies in relative velocity frame.',
        derivationSteps: [
            'Fix frame of particle 1: particle 2 moves along line with velocity \\vec{v}_{21} = \\vec{v}_2 - \\vec{v}_1.',
            'Perpendicular distance from origin to line of velocity vector is d_{\\min} = |\\vec{r}_{21}| \\sin\\phi.',
            'Using vector cross product magnitude: |\\vec{r}_{21} \\times \\vec{v}_{21}| = r_{21} v_{21} \\sin\\phi.',
            'Dividing by |\\vec{v}_{21}| yields d_{\\min}.'
        ],
        commonTraps: [
            'Ensure consistent sign convention when subtracting velocity vectors.',
            'Check if collision occurs (d_min = 0).'
        ],
        jeeFrequency: 'High',
        mnemonics: 'Cross product of relative position and relative velocity over speed',
        linkedErrorCodes: ['E1', 'E4']
    },

    // ---------------------------------------------------------
    // 2. LAWS OF MOTION & WORK POWER ENERGY
    // ---------------------------------------------------------
    {
        id: 'phy-nlm-001',
        subject: 'Physics',
        chapter: 'Laws of Motion',
        topic: 'Friction',
        name: 'Two-Block System Maximum Acceleration Without Slipping',
        latex: 'a_{\\max} = \\mu_s g \\left(\\frac{m_1 + m_2}{m_1}\\right)',
        description: 'Maximum external force/acceleration for bottom block before upper block starts relative sliding.',
        derivationSteps: [
            'Maximum static friction on upper block: f_{\\max} = \\mu_s m_1 g.',
            'Maximum acceleration of upper block: a_{\\max} = f_{\\max}/m_1 = \\mu_s g.',
            'For both blocks moving together: F_{\\max} = (m_1 + m_2) a_{\\max} = \\mu_s g (m_1 + m_2).'
        ],
        commonTraps: [
            'Distinguish clearly whether external force F is applied on bottom block or top block.',
            'Use static friction coefficient \\mu_s for threshold, then kinetic \\mu_k once relative sliding occurs.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Top block limit is always mu * g regardless of bottom mass',
        linkedErrorCodes: ['E1', 'E2']
    },
    {
        id: 'phy-wpe-001',
        subject: 'Physics',
        chapter: 'Work, Power and Energy',
        topic: 'Vertical Circular Motion',
        name: 'Critical Velocity at Lowest & Highest Point',
        latex: 'v_{\\text{bottom}} = \\sqrt{5 g R}, \\quad v_{\\text{top}} = \\sqrt{g R}',
        description: 'Minimum speed at lowest point for a string-bound mass to complete a full vertical circle.',
        derivationSteps: [
            'At top: Tension T \\ge 0 \\implies \\frac{m v_{\\text{top}}^2}{R} = m g \\implies v_{\\text{top}} = \\sqrt{g R}.',
            'Conservation of Mechanical Energy between bottom and top: \\frac{1}{2}m v_{\\text{bottom}}^2 = \\frac{1}{2}m v_{\\text{top}}^2 + m g (2R).',
            'v_{\\text{bottom}}^2 = g R + 4 g R = 5 g R \\implies v_{\\text{bottom}} = \\sqrt{5 g R}.'
        ],
        commonTraps: [
            'For a light rigid rod, critical speed at bottom is \\sqrt{4 g R} since speed at top can be 0 (no slack tension constraint).',
            'Tension difference T_{bottom} - T_{top} = 6mg always.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Root 5gR at bottom, Root gR at top, Tension delta is 6mg',
        linkedErrorCodes: ['E1', 'E3']
    },

    // ---------------------------------------------------------
    // 3. ROTATIONAL DYNAMICS
    // ---------------------------------------------------------
    {
        id: 'phy-rot-001',
        subject: 'Physics',
        chapter: 'Rotational Motion',
        topic: 'Pure Rolling on Inclined Plane',
        name: 'Linear Acceleration in Pure Rolling',
        latex: 'a = \\frac{g \\sin\\theta}{1 + \\frac{k^2}{R^2}} = \\frac{g \\sin\\theta}{1 + \\frac{I_{\\text{cm}}}{m R^2}}',
        description: 'Linear acceleration of a rigid symmetrical body rolling down a rough incline without slipping.',
        derivationSteps: [
            'Force equation down incline: m g \\sin\\theta - f = m a.',
            'Torque about COM: f R = I_{\\text{cm}} \\alpha = I_{\\text{cm}} \\frac{a}{R} \\implies f = I_{\\text{cm}} \\frac{a}{R^2}.',
            'Substitute f: m g \\sin\\theta = m a + I_{\\text{cm}} \\frac{a}{R^2} = m a \\left(1 + \\frac{k^2}{R^2}\\right).',
            'Solve for a: a = \\frac{g \\sin\\theta}{1 + \\frac{k^2}{R^2}}.'
        ],
        commonTraps: [
            'Remember $k^2/R^2$ values: Solid Sphere = $2/5$ ($0.4$), Disc = $1/2$ ($0.5$), Hollow Sphere = $2/3$ ($0.67$), Ring = $1$ ($1.0$).',
            'Smaller $k^2/R^2$ reaches the bottom fastest: Solid Sphere > Disc > Hollow Sphere > Ring.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'g sin theta over (1 + shape factor)',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-rot-002',
        subject: 'Physics',
        chapter: 'Rotational Motion',
        topic: 'Angular Momentum',
        name: 'Total Angular Momentum in Rolling Motion',
        latex: '\\vec{L}_O = \\vec{r}_{\\text{cm}} \\times m \\vec{v}_{\\text{cm}} + I_{\\text{cm}} \\vec{\\omega}',
        description: 'Angular momentum about an arbitrary fixed point O decomposed into orbital and spin terms.',
        derivationSteps: [
            '\\vec{L}_O = \\sum \\vec{r}_i \\times m_i \\vec{v}_i.',
            'Write \\vec{r}_i = \\vec{r}_{\\text{cm}} + \\vec{r}_i\' and \\vec{v}_i = \\vec{v}_{\\text{cm}} + \\vec{v}_i\'.',
            'Cross terms vanish due to definition of center of mass \\sum m_i \\vec{r}_i\' = 0.',
            'Result: \\vec{L}_O = \\vec{r}_{\\text{cm}} \\times m \\vec{v}_{\\text{cm}} + I_{\\text{cm}} \\vec{\\omega}.'
        ],
        commonTraps: [
            'Watch the sign of spin angular momentum relative to orbital angular momentum (parallel vs antiparallel).',
            'If point O is on the contact line, torque of normal and friction about O is zero, so L_O is conserved.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'Orbital (r x mv) plus Spin (I omega)',
        linkedErrorCodes: ['E1', 'E2']
    },

    // ---------------------------------------------------------
    // 4. GRAVITATION & SHM
    // ---------------------------------------------------------
    {
        id: 'phy-grav-001',
        subject: 'Physics',
        chapter: 'Gravitation',
        topic: 'Orbital Mechanics & Escape Velocity',
        name: 'Escape Velocity vs Orbital Velocity (The Root 2 Factor)',
        latex: 'v_e = \\sqrt{\\frac{2GM}{R}} = \\sqrt{2gR} = \\sqrt{2} v_o \\approx 1.414 v_o \\quad (v_o = \\sqrt{\\frac{GM}{R}} = \\sqrt{gR})',
        description: 'Relationship between escape velocity from surface and orbital velocity in near-surface orbit. Minimum projection speed required from surface of celestial body of mass M and radius R to escape to infinity.',
        category: 'Standard',
        linkedChapters: ['Gravitation', 'Work Power Energy'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Instantaneous relation: to escape from low circular orbit, kinetic energy must be doubled (speed multiplied by sqrt(2) or boosted by 41.4%).',
        derivationSteps: [
            'Orbital speed by centripetal force: \\frac{m v_o^2}{R} = \\frac{G M m}{R^2} \\implies v_o = \\sqrt{\\frac{GM}{R}}.',
            'Escape condition by energy conservation: E_{\\text{total}} = \\frac{1}{2} m v_e^2 - \\frac{G M m}{R} = 0.',
            'Solving for v_e gives v_e = \\sqrt{\\frac{2GM}{R}} = \\sqrt{2} \\sqrt{\\frac{GM}{R}} = \\sqrt{2} v_o.',
            'Ratio: v_e / v_o = \\sqrt{2} \\approx 1.414.'
        ],
        commonTraps: [
            'FATAL FACTOR TRAP: Escape speed has \\sqrt{2} (factor of 2 inside root); orbital speed has NO 2 inside root.',
            'Fractional speed boost to escape from orbit: \\frac{v_e - v_o}{v_o} = \\sqrt{2} - 1 \\approx 41.4\\%.',
            'Kinetic energy to escape is exactly twice the circular orbital kinetic energy: K_e = 2 K_o.',
            'Escape velocity is independent of projection angle (as long as it does not hit the Earth) and mass of the escaping body.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Escape is Root 2 times Orbital; requires doubling the orbital kinetic energy',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'phy-shm-001',
        subject: 'Physics',
        chapter: 'Oscillations',
        topic: 'Simple Harmonic Motion',
        name: 'Time Period of Compound (Physical) Pendulum',
        latex: 'T = 2\\pi \\sqrt{\\frac{I}{m g d}} = 2\\pi \\sqrt{\\frac{k^2 + d^2}{g d}} = 2\\pi \\sqrt{\\frac{L_{\\text{eq}}}{g}}',
        description: 'Oscillation period of an extended rigid body suspended at distance d from its center of mass.',
        derivationSteps: [
            'Restoring torque about hinge: \\tau = -m g d \\sin\\theta \\approx -m g d \\theta.',
            'Torque equation: I \\alpha = -m g d \\theta \\implies \\alpha = -\\frac{m g d}{I} \\theta.',
            'Angular frequency: \\omega = \\sqrt{\\frac{m g d}{I}}.',
            'Parallel axis theorem: I = I_{\\text{cm}} + m d^2 = m (k^2 + d^2).',
            'Time period: T = 2\\pi \\sqrt{\\frac{k^2 + d^2}{g d}}.'
        ],
        commonTraps: [
            'Minimum time period occurs when d = k (radius of gyration about COM), where T_{\\min} = 2\\pi \\sqrt{2k/g}.',
            'Do not confuse moment of inertia about pivot I with moment of inertia about COM I_cm.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: '2 pi root (I / mgd)',
        linkedErrorCodes: ['E1', 'E4']
    },

    // ---------------------------------------------------------
    // 5. THERMODYNAMICS & KINETIC THEORY
    // ---------------------------------------------------------
    {
        id: 'phy-thermo-001',
        subject: 'Physics',
        chapter: 'Thermodynamics',
        topic: 'Adiabatic Process',
        name: 'Work Done in Reversible Adiabatic Expansion',
        latex: 'W = \\frac{P_1 V_1 - P_2 V_2}{\\gamma - 1} = \\frac{n R (T_1 - T_2)}{\\gamma - 1} = -\\Delta U',
        description: 'Exact mechanical work done by an ideal gas during reversible adiabatic state transition.',
        derivationSteps: [
            'First law: dQ = dU + dW = 0 \\implies dW = -dU.',
            'dU = n C_v dT = n \\left(\\frac{R}{\\gamma - 1}\\right) (T_2 - T_1).',
            'dW = -dU = \\frac{n R (T_1 - T_2)}{\\gamma - 1} = \\frac{P_1 V_1 - P_2 V_2}{\\gamma - 1}.'
        ],
        commonTraps: [
            'Notice numerator is (T_1 - T_2) for gas work done, not (T_2 - T_1).',
            'Adiabatic slope on P-V diagram is \\gamma times steeper than isothermal slope.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: '(P1V1 minus P2V2) over (gamma minus 1)',
        linkedErrorCodes: ['E3', 'E2']
    },

    // ---------------------------------------------------------
    // 6. ELECTROSTATICS & MAGNETISM
    // ---------------------------------------------------------
    {
        id: 'phy-elec-001',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Electric Field & Potential',
        name: 'Electric Field of Uniformly Charged Ring on Axis',
        latex: 'E(x) = \\frac{1}{4\\pi\\varepsilon_0} \\frac{Q x}{(R^2 + x^2)^{3/2}}',
        description: 'Axial electric field intensity of a ring of charge Q and radius R at distance x.',
        derivationSteps: [
            'Element dQ produces dE = \\frac{1}{4\\pi\\varepsilon_0} \\frac{dQ}{r^2} where r^2 = R^2 + x^2.',
            'Axial component dE_x = dE \\cos\\theta = dE \\frac{x}{\\sqrt{R^2 + x^2}}.',
            'Perpendicular components cancel by symmetry.',
            'Integrate over ring: E_x = \\frac{1}{4\\pi\\varepsilon_0} \\frac{x}{(R^2 + x^2)^{3/2}} \\int dQ = \\frac{Q x}{4\\pi\\varepsilon_0 (R^2 + x^2)^{3/2}}.'
        ],
        commonTraps: [
            'Electric field reaches absolute maximum at x = \\pm R/\\sqrt{2}, where E_{\\max} = \\frac{Q}{6\\sqrt{3}\\pi\\varepsilon_0 R^2}.',
            'Field at center x = 0 is exactly 0.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Qx over (R squared plus x squared) to the 3/2; Max at R over root 2',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-mag-001',
        subject: 'Physics',
        chapter: 'Magnetic Effects of Current',
        topic: 'Biot-Savart Law',
        name: 'Magnetic Field on Axis of Circular Current Loop',
        latex: 'B(x) = \\frac{\\mu_0 N I R^2}{2 (R^2 + x^2)^{3/2}}',
        description: 'Magnetic flux density along the central symmetry axis of an N-turn circular coil.',
        derivationSteps: [
            'Biot-Savart element: dB = \\frac{\\mu_0 I dl}{4\\pi r^2}.',
            'Axial component: dB_x = dB \\sin\\phi = dB \\frac{R}{\\sqrt{R^2 + x^2}}.',
            'Integrate over circular perimeter \\int dl = 2\\pi R.',
            'B_x = \\frac{\\mu_0 I (2\\pi R) R}{4\\pi (R^2 + x^2)^{3/2}} = \\frac{\\mu_0 I R^2}{2 (R^2 + x^2)^{3/2}}.'
        ],
        commonTraps: [
            'At center x = 0, formula simplifies to B = \\frac{\\mu_0 N I}{2 R}.',
            'For large distances x \\gg R, B \\approx \\frac{\\mu_0 (N I \\pi R^2)}{2\\pi x^3} = \\frac{\\mu_0 M}{2\\pi x^3} (magnetic dipole form).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'mu0 N I R squared over 2 (R squared plus x squared) to the 3/2',
        linkedErrorCodes: ['E3', 'E4']
    },

    // ---------------------------------------------------------
    // 7. OPTICS & MODERN PHYSICS
    // ---------------------------------------------------------
    {
        id: 'phy-opt-001',
        subject: 'Physics',
        chapter: 'Ray Optics',
        topic: 'Refraction at Spherical Surfaces',
        name: 'Lens Maker\'s Formula & Equiconvex Lens (The Factor of 2)',
        latex: '\\frac{1}{f} = \\left(\\frac{\\mu_L}{\\mu_M} - 1\\right)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right) \\implies f_{\\text{equiconvex}} = \\frac{R}{2(\\mu - 1)} \\quad \\text{(In air, } \\mu = 1.5 \\implies f = R\\text{)}',
        description: 'Calculates focal length of a thin lens given refractive indices and radii of curvature of both faces.',
        category: 'Standard',
        linkedChapters: ['Ray Optics'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Immediate focal length calculation when a lens is cut symmetrically, silvered, or immersed in liquid of refractive index mu_m: mu_rel = mu_lens / mu_medium.',
        derivationSteps: [
            'Refraction at first surface: \\frac{\\mu_L}{v_1} - \\frac{\\mu_M}{u} = \\frac{\\mu_L - \\mu_M}{R_1}.',
            'Refraction at second surface: \\frac{\\mu_M}{v} - \\frac{\\mu_L}{v_1} = \\frac{\\mu_M - \\mu_L}{R_2}.',
            'Adding equations: \\mu_M \\left(\\frac{1}{v} - \\frac{1}{u}\\right) = (\\mu_L - \\mu_M)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right) = \\frac{\\mu_M}{f}.',
            'For equiconvex lens in air: R_1 = +R, R_2 = -R \\implies \\frac{1}{R_1} - \\frac{1}{R_2} = \\frac{1}{R} - \\left(-\\frac{1}{R}\\right) = +\\frac{2}{R}.',
            'Thus 1/f = (\\mu - 1)(2/R) \\implies f = R / [2(\\mu - 1)].'
        ],
        commonTraps: [
            'FATAL SIGN TRAP: For biconvex lens, R_2 is negative (-R). The minus sign makes it 1/R - (-1/R) = +2/R (factor of 2 in numerator).',
            'Do NOT write f = R/(\\mu - 1); the factor of 2 in denominator f = R/[2(mu - 1)] is critical!',
            'If equiconvex lens is cut vertically in half: f\' = 2f (focal length doubles). If cut horizontally: f\' = f.',
            'If lens is placed in a denser medium (\\mu_M > \\mu_L), a converging convex lens becomes diverging.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Equiconvex in air: f = R / 2(mu - 1); for glass (mu = 1.5), f is exactly equal to R',
        linkedErrorCodes: ['E1', 'E2', 'E3']
    },
    {
        id: 'phy-mod-001',
        subject: 'Physics',
        chapter: 'Modern Physics',
        topic: 'Photoelectric Effect',
        name: 'Einstein Photoelectric Equation & de Broglie Wavelength',
        latex: 'K_{\\max} = e V_s = h\\nu - \\phi = \\frac{hc}{\\lambda} - \\phi, \\quad \\lambda_{\\text{dB}} = \\frac{h}{p} = \\frac{h}{\\sqrt{2 m q V}} = \\frac{12.27}{\\sqrt{V}}\\text{ \\AA}',
        description: 'Maximum kinetic energy of photoelectrons and de Broglie matter wavelength of accelerated electron.',
        derivationSteps: [
            'Conservation of energy: Energy of incident photon = Work Function + Max Kinetic Energy of ejected electron.',
            'h\\nu = \\phi + K_{\\max} \\implies K_{\\max} = h\\nu - \\phi.',
            'Stopping potential: e V_s = K_{\\max}.',
            'de Broglie: p = \\sqrt{2 m K} = \\sqrt{2 m q V} \\implies \\lambda = h / \\sqrt{2 m q V}.'
        ],
        commonTraps: [
            'Work function \\phi is an intrinsic material property; stopping potential depends only on incident frequency, not intensity.',
            '12.27 / \\sqrt{V} \\AA applies ONLY to electrons (mass m_e, charge e).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'hc over lambda minus work function; 12.27 over root V Angstroms',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'phy-mod-002',
        subject: 'Physics',
        chapter: 'Modern Physics',
        topic: 'Bohr Hydrogen Model',
        name: 'Bohr Orbital Radii and Energy Quantization',
        latex: 'r_n = 0.529 \\frac{n^2}{Z} \\text{ \\AA}, \\quad E_n = -13.6 \\frac{Z^2}{n^2} \\text{ eV}, \\quad \\frac{1}{\\lambda} = R Z^2 \\left(\\frac{1}{n_1^2} - \\frac{1}{n_2^2}\\right)',
        description: 'Quantized electron orbits, total binding energy, and Rydberg spectral emission lines for hydrogenic atoms.',
        derivationSteps: [
            'Centripetal balance: \\frac{m v^2}{r} = \\frac{k Z e^2}{r^2}.',
            'Bohr angular momentum quantization: m v r = \\frac{n h}{2\\pi}.',
            'Solving for r gives r_n = \\frac{n^2 h^2}{4\\pi^2 m k Z e^2} \\propto \\frac{n^2}{Z}.',
            'Total Energy E = K + U = \\frac{1}{2}U = -\\frac{k Z e^2}{2 r} = -13.6 \\frac{Z^2}{n^2} \\text{ eV}.'
        ],
        commonTraps: [
            'Only valid for single-electron species (H, He+, Li2+, Be3+).',
            'Total energy is negative; ionization potential is positive (+13.6 Z^2/n^2 eV).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Radius n squared over Z, Energy minus 13.6 Z squared over n squared',
        linkedErrorCodes: ['E3', 'E1']
    },
    {
        id: 'phy-mag-002',
        subject: 'Physics',
        chapter: 'Magnetic Effects of Current',
        topic: 'Biot-Savart Law',
        name: 'Magnetic Field on Axis of Circular Current Loop',
        latex: 'B_{\\text{axis}} = \\frac{\\mu_0 i R^2}{2(R^2 + x^2)^{3/2}}, \\quad B_{\\text{center}} = \\frac{\\mu_0 i}{2 R}',
        description: 'Axial and central magnetic flux density produced by a circular coil of radius R carrying current i.',
        derivationSteps: [
            'Elemental field dB = \\frac{\\mu_0}{4\\pi} \\frac{i dl \\sin 90^\\circ}{r^2} where r = \\sqrt{R^2 + x^2}.',
            'Axial component dB_x = dB \\cos\\theta = dB \\frac{R}{r}.',
            'Integrate over circular perimeter \\int dl = 2\\pi R gives B_x = \\frac{\\mu_0 i R^2}{2(R^2 + x^2)^{3/2}}.'
        ],
        commonTraps: [
            'Do not confuse 2 in denominator with 4pi; for full circle center it is mu_0 i / 2R.',
            'For N turns, multiply entire numerator by N.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'mu zero i R squared over 2 (R squared plus x squared) to the three halves',
        linkedErrorCodes: ['E3', 'E2']
    },
    {
        id: 'phy-emi-001',
        subject: 'Physics',
        chapter: 'Electromagnetic Induction',
        topic: 'AC Circuits & Resonance',
        name: 'LCR Series Resonance & Quality Factor (Q)',
        latex: '\\omega_0 = \\frac{1}{\\sqrt{LC}}, \\quad Z = \\sqrt{R^2 + (\\omega L - \\frac{1}{\\omega C})^2}, \\quad Q = \\frac{\\omega_0 L}{R} = \\frac{1}{R}\\sqrt{\\frac{L}{C}} = \\frac{f_0}{\\Delta f}',
        description: 'Resonance angular frequency, impedance minimum (Z = R), and sharpness of resonance (Quality Factor).',
        derivationSteps: [
            'At resonance X_L = X_C \\implies \\omega L = \\frac{1}{\\omega C} \\implies \\omega_0 = \\frac{1}{\\sqrt{LC}}.',
            'Current amplitude is maximized: I_0 = V_0 / R.',
            'Quality factor Q = \\frac{V_L}{V_R} = \\frac{I_0 \\omega_0 L}{I_0 R} = \\frac{\\omega_0 L}{R} = \\frac{1}{R}\\sqrt{\\frac{L}{C}}.'
        ],
        commonTraps: [
            'Bandwidth \\Delta \\omega = R/L, so Q = \\omega_0 / \\Delta \\omega.',
            'Voltage across L or C at resonance can be Q times higher than source voltage (voltage magnification).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'omega zero is 1 over root LC, Q factor is 1/R root L/C',
        linkedErrorCodes: ['E3', 'E4']
    },

    // ---------------------------------------------------------
    // 6. MULTI-DOMAIN BRIDGES & JEE ADVANCED DIRECT CUT RESULTS
    // ---------------------------------------------------------
    {
        id: 'phy-adv-001',
        subject: 'Physics',
        chapter: 'Rotational Motion',
        topic: 'Rolling with Small Oscillations',
        name: 'Body Rolling Without Slipping in Concave Cylindrical Surface',
        latex: 'T = 2\\pi \\sqrt{\\frac{(R - r)(1 + k^2/r^2)}{g}} = \\begin{cases} 2\\pi \\sqrt{\\frac{3(R - r)}{2g}} & \\text{(Solid Cylinder)} \\\\[8pt] 2\\pi \\sqrt{\\frac{7(R - r)}{5g}} & \\text{(Solid Sphere)} \\end{cases}',
        description: 'Time period of small oscillations for a cylindrical or spherical body of radius r rolling without slipping inside a concave cylindrical track of radius R.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Rotational Motion', 'Oscillations & SHM'],
        jeeYearOrigin: 'IIT-JEE 2000 / 2009 Subjective',
        directApplicationContext: 'Deploy directly whenever a rolling body oscillates inside a curved bowl/trough. Avoid setting up 4-step energy differentiation in the exam.',
        derivationSteps: [
            'Angular displacement of center of mass: \\theta, rotation about own axis: \\phi.',
            'No-slip rolling condition: (R - r)\\theta = r \\phi \\implies \\phi = \\frac{R - r}{r}\\theta.',
            'Total Mechanical Energy: E = \\frac{1}{2} M (R - r)^2 \\dot{\\theta}^2 + \\frac{1}{2} I_{\\text{cm}} (\\dot{\\theta} + \\dot{\\phi})^2 + M g (R - r)(1 - \\cos\\theta).',
            'Since \\dot{\\theta} + \\dot{\\phi} = \\frac{R - r}{r}\\dot{\\theta}, E = \\frac{1}{2} M (R - r)^2 \\left(1 + \\frac{k^2}{r^2}\\right) \\dot{\\theta}^2 + \\frac{1}{2} M g (R - r) \\theta^2.',
            'Differentiating dE/dt = 0 gives \\omega = \\sqrt{\\frac{g}{(R - r)(1 + k^2/r^2)}}.'
        ],
        commonTraps: [
            'Do not forget the term (R - r) instead of R; r is the body\'s own radius.',
            'Ensure to use (1 + k^2/r^2): 3/2 for cylinder, 7/5 for solid sphere, 5/3 for hollow sphere.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: '2 pi root (R minus r) times (1 + I_cm / mr^2) over g',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-adv-002',
        subject: 'Physics',
        chapter: 'Fluid Mechanics',
        topic: 'Floating Body Stability & SHM',
        name: 'Vertical Oscillations of a Floating Hydrometer / Cylinder',
        latex: '\\omega = \\sqrt{\\frac{A \\rho_L g}{m}} = \\sqrt{\\frac{\\rho_L g}{\\rho_s L}} = \\sqrt{\\frac{g}{h_{\\text{sub}}}}, \\quad T = 2\\pi \\sqrt{\\frac{h_{\\text{sub}}}{g}}',
        description: 'Exact natural angular frequency for vertical bobbing of a floating body in liquid of density \\rho_L, expressed solely via submerged depth h_sub.',
        category: 'Multi-Domain Bridge',
        linkedChapters: ['Fluid Mechanics', 'Oscillations & SHM'],
        jeeYearOrigin: 'IIT-JEE 1996 Subjective',
        directApplicationContext: 'Instantaneous evaluation when a floating hydrometer, log, or spar buoy is given a slight vertical displacement x. T is simply identical to a simple pendulum of length equal to submerged depth!',
        derivationSteps: [
            'At equilibrium: Buoyant Force F_b = A h_{\\text{sub}} \\rho_L g = m g.',
            'When depressed by small displacement x: Extra restoring buoyant force F_{\\text{restoring}} = - A x \\rho_L g.',
            'Equation of motion: m \\ddot{x} = - (A \\rho_L g) x \\implies \\omega = \\sqrt{\\frac{A \\rho_L g}{m}}.',
            'Substitute m = A h_{\\text{sub}} \\rho_L gives \\omega = \\sqrt{\\frac{g}{h_{\\text{sub}}}}.'
        ],
        commonTraps: [
            'Formula assumes cylinder walls are vertical (constant cross-sectional area A). Fails for cones or spheres.',
            'h_sub is submerged depth, NOT total height L of cylinder.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'Floating bobbing period = Simple pendulum period with length equal to submerged depth',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'phy-adv-003',
        subject: 'Physics',
        chapter: 'Rotational Motion',
        topic: 'Center of Percussion',
        name: 'Center of Percussion (Hinge Reaction Invariance)',
        latex: 'x_{\\text{cop}} = \\frac{I_{\\text{hinge}}}{M r_{\\text{cm}}} = \\frac{\\frac{1}{3} M L^2}{M (L/2)} = \\frac{2}{3}L \\quad \\text{(Uniform Rod Pinned at Tip)}',
        description: 'The sweet spot distance along a pivoted rigid body where an impulsive blow creates zero instantaneous reaction force/impulse at the pivot hinge.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Rotational Motion', 'Work Power Energy'],
        jeeYearOrigin: 'IIT-JEE 1991 / 2012 Subjective',
        directApplicationContext: 'Used in cricket bat sweet spot problems and pivoted rod collision questions to find where the hinge experiences zero impulsive shock.',
        derivationSteps: [
            'Let impulse J be applied at distance x from hinge. Linear impulse equation: J + R_h = M v_{\\text{cm}} = M (\\omega r_{\\text{cm}}).',
            'Angular impulse equation about hinge: J \\cdot x = I_{\\text{hinge}} \\omega \\implies \\omega = \\frac{J x}{I_{\\text{hinge}}}.',
            'Substitute \\omega into linear impulse: J + R_h = M r_{\\text{cm}} \\left(\\frac{J x}{I_{\\text{hinge}}}\\right).',
            'Setting hinge reaction R_h = 0 gives J = J \\frac{M r_{\\text{cm}} x}{I_{\\text{hinge}}} \\implies x_{\\text{cop}} = \\frac{I_{\\text{hinge}}}{M r_{\\text{cm}}}.'
        ],
        commonTraps: [
            'Distance x is measured from the hinge, not from the center of mass.',
            'If impulse is applied below 2/3 L, hinge reaction is in direction of blow; if above, reaction is opposite.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'Sweet spot of uniform rod is always at two-thirds L from the hinge',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-adv-004',
        subject: 'Physics',
        chapter: 'Rotational Motion',
        topic: 'Toppling vs Sliding',
        name: 'Critical Incline Angle for Toppling Before Sliding',
        latex: '\\tan\\theta_{\\text{topple}} = \\frac{b}{h}, \\quad \\begin{cases} \\text{Topples First} & \\text{if } \\mu > \\frac{b}{h} \\\\[4pt] \\text{Slides First} & \\text{if } \\mu < \\frac{b}{h} \\end{cases}',
        description: 'Criterion for whether a rectangular block of base width b and height h resting on an inclined plane begins to topple over or slide down first.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Laws of Motion', 'Rotational Motion'],
        jeeYearOrigin: 'IIT-JEE 1998 / 2004 Subjective',
        directApplicationContext: 'Essential for stability questions of crates, cylinders, and vehicles on slopes.',
        derivationSteps: [
            'Sliding condition: Component of gravity along incline exceeds maximum static friction: M g \\sin\\theta > \\mu M g \\cos\\theta \\implies \\tan\\theta > \\mu.',
            'Toppling condition: Normal force shifts to the lowest corner edge. Torque about edge shifts clockwise when M g \\sin\\theta (h/2) > M g \\cos\\theta (b/2).',
            'Canceling M g gives \\tan\\theta > \\frac{b}{h}.',
            'Comparing thresholds: if \\mu > b/h, toppling angle is reached before sliding angle.'
        ],
        commonTraps: [
            'b is the full base dimension; distance from CM to edge is b/2.',
            'h is total height; distance from CM to base is h/2.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Topple threshold tan theta = base over height; high friction causes topple first',
        linkedErrorCodes: ['E2', 'E4']
    },
    {
        id: 'phy-adv-005',
        subject: 'Physics',
        chapter: 'Thermodynamics',
        topic: 'Gas Processes with Elastic Boundaries',
        name: 'Polytropic Molar Heat Capacity for Spring-Loaded Piston',
        latex: 'P = P_0 + \\frac{k}{A^2}(V - V_0), \\quad C = C_v + \\frac{R}{2} \\quad \\text{(For initially relaxed spring, } P \\propto V\\text{)}',
        description: 'Thermodynamic process where gas expands against a linear elastic spring. For spring initially relaxed, the process is polytropic with PV^(-1) = const and effective molar heat capacity C = Cv + R/2.',
        category: 'Multi-Domain Bridge',
        linkedChapters: ['Thermodynamics', 'Laws of Motion'],
        jeeYearOrigin: 'IIT-JEE 1999 / 2006 Subjective',
        directApplicationContext: 'Instantly write heat supplied Q = n C \\Delta T without separately computing work done W = 1/2 k x^2 + P_0 A x.',
        derivationSteps: [
            'Equilibrium of piston of area A: P A = P_0 A + k x. Since V - V_0 = A x, P = P_0 + \\frac{k}{A^2}(V - V_0).',
            'If initially relaxed and P_0 = 0: P = c V \\implies P V^{-1} = \\text{constant}. Polytropic index x = -1.',
            'General polytropic heat capacity: C = C_v + \\frac{R}{1 - x}.',
            'Substituting x = -1: C = C_v + \\frac{R}{1 - (-1)} = C_v + \\frac{R}{2}.'
        ],
        commonTraps: [
            'Only holds if initial spring elongation is zero and external pressure is zero or balanced at start.',
            'If spring has initial compression x_0, integrate W = \\int P dV directly.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'P proportional to V gives polytropic index -1, so C is Cv plus R over 2',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-adv-006',
        subject: 'Physics',
        chapter: 'Electromagnetic Induction',
        topic: 'Motional EMF & Effective Mass',
        name: 'Conducting Rod on Rails with Capacitor (Effective Inertia)',
        latex: 'a = \\frac{mg}{m + C B^2 L^2}, \\quad m_{\\text{eff}} = m + C B^2 L^2 = m(1 + \\beta)',
        description: 'Constant downward acceleration of a conducting rod of mass m falling on vertical rails under gravity in a transverse magnetic field B connected across capacitor C.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Electromagnetic Induction', 'Laws of Motion', 'Electrostatics'],
        jeeYearOrigin: 'IIT-JEE 1994 / 2013',
        directApplicationContext: 'A capacitor on rails does NOT create a terminal velocity like a resistor! It adds constant effective mass C B^2 L^2, keeping acceleration constant forever.',
        derivationSteps: [
            'Motional EMF across moving rod: \\mathcal{E} = B v L.',
            'Charge on capacitor: q = C \\mathcal{E} = C B L v.',
            'Circuit current: i = \\frac{dq}{dt} = C B L \\frac{dv}{dt} = C B L a.',
            'Magnetic braking force upwards: F_B = i L B = (C B L a) L B = (C B^2 L^2) a.',
            'Newton\'s 2nd Law: m g - F_B = m a \\implies m g - (C B^2 L^2) a = m a.',
            'Rearranging gives a = \\frac{mg}{m + C B^2 L^2}.'
        ],
        commonTraps: [
            'Resistor on rails leads to terminal velocity v_t; Capacitor on rails leads to CONSTANT ACCELERATION.',
            'Do not confuse energy stored: Half the work done by gravity goes to kinetic energy, half to capacitor electric field.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Capacitor on rails acts as inertial mass increment C B squared L squared',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'phy-adv-007',
        subject: 'Physics',
        chapter: 'Electromagnetic Induction',
        topic: 'Flux Invariance & Induced Charge',
        name: 'Net Induced Charge Transfer Through a Circuit',
        latex: '\\Delta q = \\frac{|\\Delta \\Phi|}{R_{\\text{total}}} = \\frac{|\\Phi_2 - \\Phi_1|}{R_{\\text{total}}}',
        description: 'Total electric charge passing through any cross-section of a closed coil when magnetic flux changes is strictly independent of the speed or duration of flux variation.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Electromagnetic Induction', 'Current Electricity'],
        jeeYearOrigin: 'IIT-JEE 2003 / 2015',
        directApplicationContext: 'Use directly when finding total charge flown when a loop is flipped 180 degrees, pulled out of magnetic field, or field is switched off.',
        derivationSteps: [
            'By Faraday\'s law: \\mathcal{E}(t) = -\\frac{d\\Phi}{dt}.',
            'Instantaneous current: i(t) = \\frac{\\mathcal{E}(t)}{R} = -\\frac{1}{R}\\frac{d\\Phi}{dt}.',
            'Total charge flown: \\Delta q = \\int_{t_1}^{t_2} i(t)\\,dt = -\\frac{1}{R} \\int_{\\Phi_1}^{\\Phi_2} d\\Phi.',
            'Evaluating integral gives \\Delta q = \\frac{\\Phi_1 - \\Phi_2}{R} \\implies |\\Delta q| = \\frac{|\\Delta \\Phi|}{R}.'
        ],
        commonTraps: [
            'When flipping a coil 180 degrees, \\Delta \\Phi = B A - (-B A) = 2 B A, so \\Delta q = 2 B A / R.',
            'Rate of heat produced DOES depend on time, only total charge is time-independent.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Charge is change in flux over total resistance; speed of pulling loop is irrelevant',
        linkedErrorCodes: ['E1', 'E2']
    },
    {
        id: 'phy-adv-008',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Electrostatic Pressure & Surface Tension',
        name: 'Charged Soap Bubble Equilibrium & Critical Potential',
        latex: 'P_{\\text{excess}} = \\frac{4T}{R} - \\frac{\\sigma^2}{2\\epsilon_0} = 0 \\implies \\sigma = \\sqrt{\\frac{8 T \\epsilon_0}{R}}, \\quad V = \\sqrt{\\frac{8 T R}{\\epsilon_0}}',
        description: 'Outward electrostatic pressure \\sigma^2 / (2\\epsilon_0) opposing inward surface tension Laplace pressure 4T/R. Critical voltage at which excess internal air pressure vanishes.',
        category: 'Multi-Domain Bridge',
        linkedChapters: ['Electrostatics', 'Fluid Mechanics'],
        jeeYearOrigin: 'IIT-JEE 2001 Subjective',
        directApplicationContext: 'Direct calculation when a soap bubble is charged until its internal pressure equals atmospheric pressure, or radius change upon charging is required.',
        derivationSteps: [
            'Inward capillary pressure due to 2 surfaces: P_{\\text{surface}} = \\frac{4T}{R}.',
            'Outward electrostatic repulsion pressure: P_{\\text{elec}} = \\frac{\\sigma^2}{2\\epsilon_0}.',
            'Net excess pressure inside bubble: P_{\\text{excess}} = P_{\\text{in}} - P_{\\text{out}} = \\frac{4T}{R} - \\frac{\\sigma^2}{2\\epsilon_0}.',
            'When internal pressure equals atmospheric pressure (P_excess = 0): \\sigma = \\sqrt{\\frac{8 T \\epsilon_0}{R}}.',
            'Electric potential at surface: V = \\frac{\\sigma R}{\\epsilon_0} = \\sqrt{\\frac{8 T R}{\\epsilon_0}}.'
        ],
        commonTraps: [
            'Remember 4T/R for soap bubble (2 surfaces), whereas liquid drop has only 1 surface: 2T/R.',
            'Electrostatic pressure formula \\sigma^2/(2\\epsilon_0) uses permittivity \\epsilon_0, not 4pi.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'Electrostatic outward pressure sigma squared over 2 epsilon zero balances 4T over R',
        linkedErrorCodes: ['E3', 'E4']
    },

    // ---------------------------------------------------------
    // 7. HIGH-PITFALL FORMULAS & STUDENT TRAP ANCHORS
    // ---------------------------------------------------------
    {
        id: 'phy-opt-ydse-001',
        subject: 'Physics',
        chapter: 'Wave Optics',
        topic: 'Young\'s Double Slit Experiment (YDSE)',
        name: 'YDSE Fringe Width & Angular Fringe Width (The D vs d Pitfall)',
        latex: '\\beta = \\frac{\\lambda D}{d}, \\quad \\theta = \\frac{\\beta}{D} = \\frac{\\lambda}{d}, \\quad y_n = n \\frac{\\lambda D}{d} \\text{ (Bright)}, \\quad y_n\' = \\left(n - \\frac{1}{2}\\right) \\frac{\\lambda D}{d} \\text{ (Dark)}',
        description: 'Linear and angular separation between two successive maxima or minima in YDSE interference.',
        category: 'Standard',
        linkedChapters: ['Wave Optics'],
        jeeYearOrigin: 'JEE Main & Advanced High-Frequency Classic',
        directApplicationContext: 'Use to find spacing between fringes on screen. When apparatus is immersed in liquid of refractive index mu: beta\' = beta / mu.',
        derivationSteps: [
            'Path difference \\Delta x = d \\sin\\theta \\approx d \\tan\\theta = d \\frac{y}{D}.',
            'Constructive interference condition: \\Delta x = n \\lambda \\implies y_n = \\frac{n \\lambda D}{d}.',
            'Fringe width is separation between consecutive bright fringes: \\beta = y_{n} - y_{n-1} = \\frac{\\lambda D}{d}.',
            'Angular fringe width: \\theta = \\frac{y_n - y_{n-1}}{D} = \\frac{\\lambda}{d} \\text{ (strictly independent of screen distance D!)}.'
        ],
        commonTraps: [
            'FATAL PITFALL (D vs d): Capital D (screen distance, ~1-2 meters, BIG) is in NUMERATOR; small d (slit separation, ~0.1-1 mm, SMALL) is in DENOMINATOR.',
            'Angular fringe width theta = lambda / d has NO D at all! Moving the screen changes linear width beta, but angular width theta remains CONSTANT.',
            'If central fringe shifts due to mica sheet of thickness t: shift \\Delta y = \\frac{D}{d}(\\mu - 1)t.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Big D on top (meters), small d on bottom (millimeters); beta = lambda * Big D / little d',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-snd-001',
        subject: 'Physics',
        chapter: 'Wave Motion & Sound',
        topic: 'Doppler Effect in Sound',
        name: 'Doppler Effect Master Shift (Observer vs Source / Top vs Bottom)',
        latex: 'f\' = f_0 \\left(\\frac{v \\pm v_o}{v \\mp v_s}\\right) = f_0 \\left(\\frac{v + v_o}{v - v_s}\\right) \\quad \\text{(When Observer & Source approach each other)}',
        description: 'Apparent frequency of sound perceived when observer and source move along the line joining them relative to medium with sound speed v.',
        category: 'Standard',
        linkedChapters: ['Wave Motion & Sound'],
        jeeYearOrigin: 'JEE Main & Advanced High-Yield',
        directApplicationContext: 'Calculate apparent pitch heard when car honks approaching a wall, moving train whistling, or echolocation reflection.',
        derivationSteps: [
            'When source moves with v_s toward observer, apparent wavelength contracts: \\lambda\' = \\frac{v - v_s}{f_0}.',
            'Observer moving with v_o toward source intercepts waves with relative speed v + v_o.',
            'Apparent frequency: f\' = \\frac{v + v_o}{\\lambda\'} = f_0 \\left(\\frac{v + v_o}{v - v_s}\\right).'
        ],
        commonTraps: [
            'FATAL PLACEMENT TRAP (Top vs Bottom): Observer velocity v_o is ALWAYS in the NUMERATOR; Source velocity v_s is ALWAYS in the DENOMINATOR (Mnemonic: "O over S" like Operating System).',
            'When approaching: frequency MUST increase, so numerator must have PLUS sign (+ v_o) and denominator must have MINUS sign (- v_s).',
            'For wind blowing with speed w in direction of sound: replace v with (v + w).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'O over S (Observer on Top, Source on Bottom); Approach means Bigger Pitch (Plus on top, Minus on bottom)',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-fl-001',
        subject: 'Physics',
        chapter: 'Fluid Mechanics',
        topic: 'Surface Tension & Capillarity',
        name: 'Laplace Excess Pressure: Drop vs Soap Bubble vs Cylindrical Jet (1 vs 2 vs 4)',
        latex: '\\Delta P_{\\text{drop}} = \\frac{2T}{R}, \\quad \\Delta P_{\\text{soap bubble}} = \\frac{4T}{R}, \\quad \\Delta P_{\\text{cylindrical jet}} = \\frac{T}{R}',
        description: 'Pressure difference between convex and concave sides of curved liquid surfaces due to surface tension T.',
        category: 'Standard',
        linkedChapters: ['Fluid Mechanics'],
        jeeYearOrigin: 'JEE Main & Advanced Classic',
        directApplicationContext: 'Calculate excess internal pressure for drops, bubbles, and capillary meniscus height: h = 2T cos(theta) / (rho g r).',
        derivationSteps: [
            'Work done in expanding spherical drop by dR: dW = \\Delta P \\cdot (4\\pi R^2 dR).',
            'Increase in surface area for 1 surface (drop): dA = 8\\pi R dR \\implies dU = T (8\\pi R dR).',
            'Equating dW = dU gives \\Delta P = \\frac{2T}{R}.',
            'For soap bubble: 2 independent liquid-air surfaces (inner + outer) \\implies dA = 16\\pi R dR \\implies \\Delta P = \\frac{4T}{R}.'
        ],
        commonTraps: [
            'FATAL FACTOR OF 2 TRAP: Air bubble INSIDE water has only 1 surface: \\Delta P = 2T/R (NOT 4T/R!).',
            'Soap bubble in air has 2 surfaces: \\Delta P = 4T/R.',
            'Cylindrical liquid column has only 1 principal radius of curvature (R_1 = R, R_2 = \\infty): \\Delta P = T/R.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Drop = 2T/R (1 surface); Soap Bubble = 4T/R (2 surfaces); Bubble in Liquid = 2T/R (1 surface)',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-mag-003',
        subject: 'Physics',
        chapter: 'Magnetic Effects of Current',
        topic: 'Biot-Savart Law',
        name: 'Magnetic Field: Circular Arc vs Full Loop vs Straight Wire (The Pi Trap)',
        latex: 'B_{\\text{arc}} = \\frac{\\mu_0 I}{4\\pi R} \\theta, \\quad B_{\\text{full loop center}} = \\frac{\\mu_0 I}{2R}, \\quad B_{\\text{semi-circle}} = \\frac{\\mu_0 I}{4R}, \\quad B_{\\text{infinite wire}} = \\frac{\\mu_0 I}{2\\pi d}',
        description: 'Magnetic field generated by circular arcs of angle \\theta and comparison with long straight wires.',
        category: 'Standard',
        linkedChapters: ['Magnetic Effects of Current'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Solve composite wire circuits containing combinations of arcs and straight segments.',
        derivationSteps: [
            'From Biot-Savart law: dB = \\frac{\\mu_0 I dl}{4\\pi R^2}. Since dl = R d\\theta, dB = \\frac{\\mu_0 I d\\theta}{4\\pi R}.',
            'Integrating over angle \\theta: B = \\frac{\\mu_0 I \\theta}{4\\pi R}.',
            'For complete circular loop: \\theta = 2\\pi \\implies B = \\frac{\\mu_0 I (2\\pi)}{4\\pi R} = \\frac{\\mu_0 I}{2R}.'
        ],
        commonTraps: [
            'FATAL PI TRAP: Center of full circle has NO \\pi in denominator: \\mu_0 I / (2R). Students frequently mistakenly write \\mu_0 I / (2\\pi R)!',
            'Straight infinite wire DOES have \\pi in denominator: \\mu_0 I / (2\\pi d).',
            'Semi-circle is \\mu_0 I / (4R) (no \\pi).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Circular loops have NO pi in denominator (mu_0 I / 2R); Straight wires HAVE pi in denominator (mu_0 I / 2 pi d)',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'phy-trap-001',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Capacitance with Dielectric Slab',
        name: 'Capacitor with Partially Filled Dielectric Slab (The d - t + t/K Formula)',
        latex: 'C = \\frac{\\varepsilon_0 A}{d - t + \\frac{t}{K}} = \\frac{\\varepsilon_0 A}{d - t\\left(1 - \\frac{1}{K}\\right)} \\quad (t < d)',
        description: 'Capacitance of a parallel plate capacitor when a dielectric slab of thickness t and dielectric constant K is inserted between plates separated by distance d.',
        category: 'Standard',
        linkedChapters: ['Electrostatics'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Direct calculation when dielectric slab does not completely fill plate separation, or when a conducting slab (K = infty) of thickness t is inserted.',
        derivationSteps: [
            'Electric field in air space: E_0 = \\frac{\\sigma}{\\varepsilon_0} over distance (d - t).',
            'Electric field inside dielectric slab: E = \\frac{E_0}{K} = \\frac{\\sigma}{K \\varepsilon_0} over thickness t.',
            'Total potential difference: V = E_0 (d - t) + E t = \\frac{\\sigma}{\\varepsilon_0}\\left[(d - t) + \\frac{t}{K}\\right].',
            'Since \\sigma = Q / A: C = \\frac{Q}{V} = \\frac{\\varepsilon_0 A}{d - t + \\frac{t}{K}} = \\frac{\\varepsilon_0 A}{d - t(1 - 1/K)}.'
        ],
        commonTraps: [
            'FATAL SIGN TRAP: The denominator is d - t(1 - 1/K), NOT d + t(1 - 1/K). Inserting a dielectric always INCREASES capacitance (denominator must decrease).',
            'For a conducting/metal slab (K = \\infty): C = \\frac{\\varepsilon_0 A}{d - t}. Thickness t reduces effective plate separation.',
            'Dielectric slab position: Capacitance is STRICTLY INDEPENDENT of where the slab is placed between the plates (as long as faces remain parallel).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'd minus t times (1 minus 1/K); metal slab reduces d to (d - t)',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'phy-trap-002',
        subject: 'Physics',
        chapter: 'Rotational Motion',
        topic: 'Moment of Inertia Standards',
        name: 'Moment of Inertia Hierarchy: Disc vs Solid Sphere vs Hollow Shell (The 1/2 vs 2/5 vs 2/3 Trap)',
        latex: 'I_{\\text{solid sphere}} = \\frac{2}{5}MR^2 \\quad < \\quad I_{\\text{disc}} = \\frac{1}{2}MR^2 \\quad < \\quad I_{\\text{hollow sphere}} = \\frac{2}{3}MR^2 \\quad < \\quad I_{\\text{ring}} = MR^2',
        description: 'Comparative standard moments of inertia about central symmetry axes for fundamental round bodies of equal mass M and radius R.',
        category: 'Standard',
        linkedChapters: ['Rotational Motion'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Instantaneous determination of rolling acceleration a = g sin(theta) / (1 + I / MR^2) and speed race down an inclined plane (solid sphere reaches bottom fastest!).',
        derivationSteps: [
            'Solid sphere: Mass concentrated closer to core \\implies \\frac{2}{5} = 0.40 M R^2.',
            'Solid cylinder / disc: Uniform radial spread \\implies \\frac{1}{2} = 0.50 M R^2.',
            'Hollow spherical shell: Mass on spherical boundary \\implies \\frac{2}{3} \\approx 0.67 M R^2.',
            'Hollow cylinder / ring / hoop: All mass at maximum radius R \\implies 1.00 M R^2.',
            'Rolling acceleration: a = \\frac{g \\sin\\theta}{1 + k^2/R^2}. Smaller k^2/R^2 means larger acceleration.'
        ],
        commonTraps: [
            'FATAL FRACTION TRAP: Solid sphere is 2/5 (0.4), NOT 2/3! Hollow sphere is 2/3 (0.67), NOT 2/5! (Solid sphere has more mass near center, so smaller I).',
            'Rolling down incline race order: Solid Sphere (1st) > Disc (2nd) > Hollow Sphere (3rd) > Ring (4th / last).',
            'Tangent axis shift: For solid sphere about tangent, I = 2/5 MR^2 + MR^2 = 7/5 MR^2.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: '2/5 (Solid) < 1/2 (Disc) < 2/3 (Hollow) < 1 (Ring); lowest inertia wins the rolling race',
        linkedErrorCodes: ['E2', 'E4']
    },
    {
        id: 'phy-trap-003',
        subject: 'Physics',
        chapter: 'Dual Nature of Matter',
        topic: 'De Broglie Wavelength of Particles',
        name: 'De Broglie Wavelength: Accelerated Charged Particles vs Thermal Neutrons',
        latex: '\\lambda_e = \\frac{12.27}{\\sqrt{V}}\\,\\text{\\AA}, \\quad \\lambda_p = \\frac{0.286}{\\sqrt{V}}\\,\\text{\\AA}, \\quad \\lambda_\\alpha = \\frac{0.101}{\\sqrt{V}}\\,\\text{\\AA}, \\quad \\lambda_{\\text{thermal}} = \\frac{h}{\\sqrt{3 m k_B T}}',
        description: 'De Broglie wavelength of fundamental particles accelerated through potential difference V in volts, and gas particles at absolute temperature T.',
        category: 'Standard',
        linkedChapters: ['Dual Nature of Matter', 'Modern Physics'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Instantaneous calculation in photoelectric effect and matter wave diffraction without plugging h, m, and e repeatedly.',
        derivationSteps: [
            'De Broglie relation: \\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2 m q V}}.',
            'For electron: m_e = 9.1 \\times 10^{-31} kg, q = e \\implies \\lambda_e = \\sqrt{\\frac{150}{V}}\\,\\text{\\AA} = \\frac{12.27}{\\sqrt{V}}\\,\\text{\\AA}.',
            'For proton: m_p \\approx 1836 m_e, q = e \\implies \\lambda_p = \\frac{0.286}{\\sqrt{V}}\\,\\text{\\AA}.',
            'For alpha particle: m_\\alpha \\approx 4 m_p, q = 2e \\implies \\lambda_\\alpha = \\frac{0.101}{\\sqrt{V}}\\,\\text{\\AA}.',
            'For gas molecule at temp T: Kinetic energy E = \\frac{3}{2} k_B T \\implies \\lambda = \\frac{h}{\\sqrt{2 m (3/2 k_B T)}} = \\frac{h}{\\sqrt{3 m k_B T}}.'
        ],
        commonTraps: [
            'FATAL CONSTANT TRAP: Electron is 12.27 / sqrt(V) Angstroms, NOT 1.227 nm (note the factor of 10 if working in nm: 1.227 / sqrt(V) nm).',
            'Thermal neutron formula uses 3 k_B T (from average 3D kinetic energy 3/2 k_B T), NOT 2 or 1/2.',
            'Uncharged particles (neutrons) CANNOT be accelerated by electric potential V; use thermal T formula or p = mv.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Electron = 12.27 / sqrt(V) A; Thermal neutron has 3 m k_B T under square root',
        linkedErrorCodes: ['E1', 'E3']
    }
];