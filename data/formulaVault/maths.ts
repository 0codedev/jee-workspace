// ============================================================================
// JEE Mathematics Formula & Concept Vault Database
// Curated High-Frequency JEE Main & Advanced Formulas with KaTeX LaTeX notation
// ============================================================================

import { Formula } from '../../types';

export const MATHS_FORMULAS: Formula[] = [
    // ---------------------------------------------------------
    // 1. CALCULUS & INTEGRATION
    // ---------------------------------------------------------
    {
        id: 'math-calc-001',
        subject: 'Maths',
        chapter: 'Definite Integration',
        topic: 'Properties of Definite Integrals',
        name: 'King\'s Property & Queen\'s Property',
        latex: '\\int_a^b f(x)\\,dx = \\int_a^b f(a + b - x)\\,dx, \\quad \\int_0^{2a} f(x)\\,dx = \\begin{cases} 2\\int_0^a f(x)\\,dx & \\text{if } f(2a-x) = f(x) \\\\ 0 & \\text{if } f(2a-x) = -f(x) \\end{cases}',
        description: 'Most powerful algebraic transformation tools for evaluating symmetric and trigonometric integrals.',
        derivationSteps: [
            'Substitute t = a + b - x \\implies dt = -dx.',
            'When x = a, t = b; when x = b, t = a.',
            '\\int_a^b f(x) dx = -\\int_b^a f(a+b-t) dt = \\int_a^b f(a+b-t) dt = \\int_a^b f(a+b-x) dx.',
            'Adding original integral I to transformed integral I gives 2I = \\int_a^b [f(x) + f(a+b-x)] dx.'
        ],
        commonTraps: [
            'Always add the original I to transformed I; if f(x) + f(a+b-x) is constant, integral evaluates instantly in 1 step.',
            'Do not forget to divide by 2 at the end (2I = result \\implies I = result / 2).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Replace x with (lower + upper - x); Add equations and divide by 2',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'math-calc-002',
        subject: 'Maths',
        chapter: 'Definite Integration',
        topic: 'Leibniz Integral Rule',
        name: 'Differentiation Under the Integral Sign (Leibniz Rule)',
        latex: '\\frac{d}{dx}\\left[\\int_{u(x)}^{v(x)} f(t)\\,dt\\right] = f(v(x)) \\cdot v\'(x) - f(u(x)) \\cdot u\'(x)',
        description: 'Derivative of an integral with variable limits with respect to x.',
        derivationSteps: [
            'Let F(t) be the antiderivative of f(t) such that F\'(t) = f(t).',
            '\\int_{u(x)}^{v(x)} f(t) dt = F(v(x)) - F(u(x)).',
            'Differentiate with respect to x using the Chain Rule: \\frac{d}{dx}[F(v(x)) - F(u(x))] = F\'(v(x))v\'(x) - F\'(u(x))u\'(x).',
            'Substitute F\' = f: f(v(x))v\'(x) - f(u(x))u\'(x).'
        ],
        commonTraps: [
            'Always multiply by the derivative of the limits (v\'(x) and u\'(x)). Missing this is an extremely common silly mistake!',
            'If integrand contains both x and t, use complete Leibniz formula with partial derivative \\int \\frac{\\partial f}{\\partial x} dt.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Upper limit in function times upper derivative minus Lower limit in function times lower derivative',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'math-calc-003',
        subject: 'Maths',
        chapter: 'Differential Equations',
        topic: 'Linear Differential Equations',
        name: 'Integrating Factor for First-Order Linear ODE',
        latex: '\\frac{dy}{dx} + P(x)y = Q(x) \\implies \\text{I.F.} = e^{\\int P(x)\\,dx}, \\quad y \\cdot (\\text{I.F.}) = \\int Q(x) \\cdot (\\text{I.F.})\\,dx + C',
        description: 'General solution of first-order linear ordinary differential equations in standard form.',
        derivationSteps: [
            'Multiply entire ODE by I(x): I(x)\\frac{dy}{dx} + I(x)P(x)y = I(x)Q(x).',
            'Require LHS to be product derivative \\frac{d}{dx}[y I(x)] = I(x)\\frac{dy}{dx} + I\'(x)y.',
            'Comparing coefficients: I\'(x) = I(x)P(x) \\implies \\frac{dI}{I} = P(x)dx \\implies \\ln I = \\int P(x)dx \\implies I = e^{\\int P(x)dx}.',
            'Integrate both sides: y \\cdot I(x) = \\int Q(x)I(x)dx + C.'
        ],
        commonTraps: [
            'Coefficient of dy/dx must be strictly 1 before extracting P(x) and Q(x).',
            'Remember e^{\\ln f(x)} = f(x) and e^{n \\ln f(x)} = (f(x))^n.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'I.F. = e to the integral P dx; y times I.F. = integral Q times I.F. dx + C',
        linkedErrorCodes: ['E3', 'E2']
    },

    // ---------------------------------------------------------
    // 2. COORDINATE GEOMETRY & CONICS
    // ---------------------------------------------------------
    {
        id: 'math-conic-001',
        subject: 'Maths',
        chapter: 'Coordinate Geometry',
        topic: 'Conic Sections',
        name: 'Condition of Tangency for Conics',
        latex: 'y = mx + c \\text{ is tangent to } \\begin{cases} y^2 = 4ax & \\implies c = \\frac{a}{m} \\\\ \\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1 & \\implies c^2 = a^2 m^2 + b^2 \\\\ \\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1 & \\implies c^2 = a^2 m^2 - b^2 \\\\ x^2 + y^2 = r^2 & \\implies c^2 = r^2(1 + m^2) \\end{cases}',
        description: 'Essential condition of tangency for line y = mx + c across all four standard conics.',
        derivationSteps: [
            'Substitute y = mx + c into conic equation.',
            'Form quadratic equation in x: Ax^2 + Bx + C = 0.',
            'For tangency, line must touch at exactly 1 point, so Discriminant \\Delta = B^2 - 4AC = 0.',
            'Solving \\Delta = 0 gives the respective condition for c in terms of m.'
        ],
        commonTraps: [
            'For hyperbola, real tangents exist only when a^2 m^2 > b^2 (c^2 must be positive).',
            'Point of contact for parabola y^2 = 4ax in slope form is (a/m^2, 2a/m).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Parabola: a/m | Ellipse: a^2m^2 + b^2 | Hyperbola: a^2m^2 - b^2',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'math-conic-002',
        subject: 'Maths',
        chapter: 'Coordinate Geometry',
        topic: 'Conic Sections',
        name: 'Director Circle & Pair of Perpendicular Tangents',
        latex: 'x^2 + y^2 = a^2 + b^2 \\quad (\\text{Ellipse}), \\quad x^2 + y^2 = a^2 - b^2 \\quad (\\text{Hyperbola, if } a > b)',
        description: 'Locus of intersection point of two mutually perpendicular tangents to a conic.',
        derivationSteps: [
            'Tangent equation: y = mx \\pm \\sqrt{a^2 m^2 + b^2}.',
            'Rearrange: (y - mx)^2 = a^2 m^2 + b^2 \\implies m^2(x^2 - a^2) - 2mxy + (y^2 - b^2) = 0.',
            'Let m_1, m_2 be the roots (slopes of tangents). For perpendicular tangents: m_1 m_2 = -1.',
            'Product of roots: \\frac{y^2 - b^2}{x^2 - a^2} = -1 \\implies x^2 + y^2 = a^2 + b^2.'
        ],
        commonTraps: [
            'Director circle of a parabola is its Directrix x = -a (angle between tangents from any point on directrix is 90°).',
            'For hyperbola with a < b, no perpendicular tangents can be drawn (director circle is imaginary).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Director circle: x^2 + y^2 = a^2 +/- b^2; Parabola director circle is Directrix',
        linkedErrorCodes: ['E1', 'E3']
    },

    // ---------------------------------------------------------
    // 3. VECTORS & 3D GEOMETRY
    // ---------------------------------------------------------
    {
        id: 'math-vec-001',
        subject: 'Maths',
        chapter: '3D Geometry',
        topic: 'Lines in Space',
        name: 'Shortest Distance Between Two Skew Lines',
        latex: 'd = \\frac{|(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2)|}{|\\vec{b}_1 \\times \\vec{b}_2|}',
        description: 'Exact perpendicular distance between two non-parallel, non-intersecting lines in 3D space.',
        derivationSteps: [
            'Line 1: \\vec{r} = \\vec{a}_1 + \\lambda \\vec{b}_1; Line 2: \\vec{r} = \\vec{a}_2 + \\mu \\vec{b}_2.',
            'Unit normal vector perpendicular to both lines: \\hat{n} = \\frac{\\vec{b}_1 \\times \\vec{b}_2}{|\\vec{b}_1 \\times \\vec{b}_2|}.',
            'Shortest distance is scalar projection of vector (\\vec{a}_2 - \\vec{a}_1) along common normal \\hat{n}.',
            'd = |(\\vec{a}_2 - \\vec{a}_1) \\cdot \\hat{n}| = \\frac{|(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2)|}{|\\vec{b}_1 \\times \\vec{b}_2|}.'
        ],
        commonTraps: [
            'If lines intersect, numerator is zero: [(\\vec{a}_2 - \\vec{a}_1) \\; \\vec{b}_1 \\; \\vec{b}_2] = 0 (Coplanarity condition).',
            'If lines are parallel (\\vec{b}_1 \\parallel \\vec{b}_2), use formula d = \\frac{|(\\vec{a}_2 - \\vec{a}_1) \\times \\vec{b}|}{|\\vec{b}|}.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Box product of (a2 - a1, b1, b2) over magnitude of (b1 x b2)',
        linkedErrorCodes: ['E3', 'E4']
    },

    // ---------------------------------------------------------
    // 4. ALGEBRA & COMPLEX NUMBERS
    // ---------------------------------------------------------
    {
        id: 'math-alg-001',
        subject: 'Maths',
        chapter: 'Complex Numbers',
        topic: 'Roots of Unity & Geometry',
        name: 'Cube Roots of Unity & Geometry of Circle',
        latex: '1 + \\omega + \\omega^2 = 0, \\quad \\omega^3 = 1, \\quad \\left|\\frac{z - z_1}{z - z_2}\\right| = k \\implies \\begin{cases} \\text{Perpendicular Bisector} & \\text{if } k = 1 \\\\ \\text{Circle (Apollonius)} & \\text{if } k \\ne 1 \\end{cases}',
        description: 'Fundamental cube root relations and complex locus equation for circles and perpendicular bisectors.',
        derivationSteps: [
            'z^3 = 1 \\implies (z - 1)(z^2 + z + 1) = 0.',
            'Roots are 1, \\omega = e^{i 2\\pi/3} = -\\frac{1}{2} + i\\frac{\\sqrt{3}}{2}, \\omega^2 = e^{i 4\\pi/3} = -\\frac{1}{2} - i\\frac{\\sqrt{3}}{2}.',
            'Sum of roots: 1 + \\omega + \\omega^2 = 0.',
            'For locus |z - z_1| / |z - z_2| = k: if k = 1, distance from z_1 equals distance from z_2 (perpendicular bisector).'
        ],
        commonTraps: [
            '\\omega^2 = \\bar{\\omega} = 1/\\omega.',
            '1 + \\omega^r + \\omega^{2r} = 3 if r is a multiple of 3, and 0 if r is not a multiple of 3.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: '1 + omega + omega^2 = 0; k = 1 is bisector, k != 1 is Apollonius Circle',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'math-alg-002',
        subject: 'Maths',
        chapter: 'Matrices and Determinants',
        topic: 'Matrix Properties',
        name: 'Determinant & Adjoint Properties',
        latex: '|\\text{adj}(A)| = |A|^{n-1}, \\quad |\\text{adj}(\\text{adj}(A))| = |A|^{(n-1)^2}, \\quad \\text{adj}(\\text{adj}(A)) = |A|^{n-2} A',
        description: 'Standard determinant and nested adjoint relations for an n x n square matrix.',
        derivationSteps: [
            'Fundamental identity: A \\cdot \\text{adj}(A) = |A| I_n.',
            'Take determinant of both sides: |A| \\cdot |\\text{adj}(A)| = ||A| I_n| = |A|^n |I_n| = |A|^n.',
            'Divide by |A|: |\\text{adj}(A)| = |A|^{n-1}.',
            'Applying iteratively gives |\\text{adj}(\\text{adj}(A))| = (|A|^{n-1})^{n-1} = |A|^{(n-1)^2}.'
        ],
        commonTraps: [
            'For 3x3 matrix (n = 3): |\\text{adj}(A)| = |A|^2 and |\\text{adj}(\\text{adj}(A))| = |A|^4.',
            '|kA| = k^n |A| (do not forget the power n of the scalar!).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: '|adj A| = |A|^(n-1); |adj adj A| = |A|^((n-1)^2); |kA| = k^n |A|',
        linkedErrorCodes: ['E3', 'E4']
    },

    // ---------------------------------------------------------
    // 5. MULTI-DOMAIN BRIDGES & JEE ADVANCED DIRECT CUT RESULTS
    // ---------------------------------------------------------
    {
        id: 'math-adv-001',
        subject: 'Maths',
        chapter: 'Integral Calculus',
        topic: 'Area Under Curves & Conics',
        name: 'Archimedes Parabola-Chord Area Shortcut',
        latex: '\\text{Area} = \\frac{8 a^2}{3 m^3} = \\frac{2}{3} \\times (\\text{Area of circumscribed triangle})',
        description: 'Exact closed-form area enclosed between the parabola y^2 = 4ax and the intersecting chord y = mx + c. Can be evaluated in 5 seconds without setting up definite integration.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Integral Calculus', 'Conic Sections'],
        jeeYearOrigin: 'Classic IIT-JEE 1995 / 2011',
        directApplicationContext: 'Instantaneous evaluation when finding area bounded by y^2 = 4ax and y = mx + c. Fails for vertical chords.',
        derivationSteps: [
            'Intersection points: (mx + c)^2 = 4ax \\implies m^2 x^2 + (2mc - 4a)x + c^2 = 0.',
            'Difference of roots: |y_2 - y_1| = \\frac{\\sqrt{(4a - 2mc)^2 - 4m^2 c^2}}{m} = \\frac{4\\sqrt{a(a - mc)}}{m}.',
            'Integrating \\int_{y_1}^{y_2} \\left(\\frac{y - c}{m} - \\frac{y^2}{4a}\\right) dy.',
            'Carrying out integration gives \\frac{1}{6am} (y_2 - y_1)^3.',
            'For chord through focus (c = -am^2): Area = \\frac{8 a^2}{3 m^3}.'
        ],
        commonTraps: [
            'Formula 8a^2 / (3m^3) is specifically for the focal chord or origin-intercepting chord.',
            'For general chord: Area = \\frac{1}{6am} |y_2 - y_1|^3.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Parabola chord area is 8 a squared over 3 m cubed; two thirds base times height',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'math-adv-002',
        subject: 'Maths',
        chapter: 'Conic Sections',
        topic: 'Loci of Perpendicular Tangents',
        name: 'Director Circles of Conic Sections',
        latex: '\\begin{cases} \\text{Circle } x^2 + y^2 = a^2 & \\implies x^2 + y^2 = 2a^2 \\\\[6pt] \\text{Ellipse } \\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1 & \\implies x^2 + y^2 = a^2 + b^2 \\\\[6pt] \\text{Hyperbola } \\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1 & \\implies x^2 + y^2 = a^2 - b^2 \\quad (a > b) \\\\[6pt] \\text{Parabola } y^2 = 4ax & \\implies x = -a \\quad (\\text{Directrix}) \\end{cases}',
        description: 'Locus of the point of intersection of two mutually perpendicular tangents to any standard conic section.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Conic Sections', 'Circles'],
        jeeYearOrigin: 'IIT-JEE 1993 / 2017',
        directApplicationContext: 'Any problem mentioning perpendicular tangents intersecting at (h, k) lies on the director circle or directrix.',
        derivationSteps: [
            'Equation of tangent to ellipse with slope m: y = mx \\pm \\sqrt{a^2 m^2 + b^2}.',
            'Pass through point (h, k): (k - mh)^2 = a^2 m^2 + b^2 \\implies m^2 (h^2 - a^2) - 2mhk + (k^2 - b^2) = 0.',
            'Since tangents are perpendicular, product of roots m_1 m_2 = -1.',
            'By Vieta\'s formulas: \\frac{k^2 - b^2}{h^2 - a^2} = -1 \\implies k^2 - b^2 = -(h^2 - a^2) \\implies h^2 + k^2 = a^2 + b^2.',
            'Locus is x^2 + y^2 = a^2 + b^2.'
        ],
        commonTraps: [
            'For hyperbola, director circle exists ONLY if a > b. If a = b (rectangular hyperbola), director circle collapses to point (0, 0). If a < b, it is imaginary.',
            'For parabola, the director circle is a straight line: the Directrix x = -a!'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Ellipse director circle is a squared plus b squared; Parabola is its directrix',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'math-adv-003',
        subject: 'Maths',
        chapter: 'Differential Calculus',
        topic: 'Tangents & Normals Projections',
        name: 'Lengths of Subtangent, Subnormal, Tangent & Normal',
        latex: '\\text{Subtangent} = \\left|\\frac{y}{y\'}\\right|, \\quad \\text{Subnormal} = |y \\cdot y\'|, \\quad \\text{Tangent} = \\left|\\frac{y \\sqrt{1 + (y\')^2}}{y\'}\\right|, \\quad \\text{Normal} = |y| \\sqrt{1 + (y\')^2}',
        description: 'Fundamental geometric lengths intercepted on coordinate axes by the tangent and normal lines drawn to any smooth curve y = f(x) at point P(x, y).',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Differential Calculus'],
        jeeYearOrigin: 'IIT-JEE 1989 / 2005',
        directApplicationContext: 'Forming differential equations where subnormal is proportional to abscissa (parabola) or subtangent is constant (exponential curve).',
        derivationSteps: [
            'Tangent line equation at (x, y): Y - y = y\' (X - x). Setting Y = 0 gives X-intercept = x - y/y\'.',
            'Subtangent length is distance from X-intercept to foot of ordinate (x, 0): |x - (x - y/y\')| = |y / y\'|.',
            'Normal line equation at (x, y): Y - y = -\\frac{1}{y\'} (X - x). Setting Y = 0 gives X-intercept = x + y y\'.',
            'Subnormal length is distance from X-intercept to foot of ordinate: |(x + y y\') - x| = |y y\'|.',
            'Using Pythagoras theorem gives full tangent and normal lengths.'
        ],
        commonTraps: [
            'Subnormal and subtangent are HORIZONTAL projections on the x-axis, not along the tangent itself.',
            'If subnormal is constant k, y y\' = k \\implies y^2 = 2kx + c (Parabola).'
        ],
        jeeFrequency: 'High',
        mnemonics: 'Subtangent divides by y prime; Subnormal multiplies by y prime',
        linkedErrorCodes: ['E1', 'E2']
    },
    {
        id: 'math-adv-004',
        subject: 'Maths',
        chapter: 'Integral Calculus',
        topic: 'Reduction & Definite Integrals',
        name: 'Wallis Reduction Formula for Powers of Trig Functions',
        latex: '\\int_0^{\\pi/2} \\sin^n x\\,dx = \\int_0^{\\pi/2} \\cos^n x\\,dx = \\frac{n-1}{n} \\cdot \\frac{n-3}{n-2} \\cdots \\begin{cases} \\frac{1}{2} \\cdot \\frac{\\pi}{2} & \\text{if } n \\text{ is even} \\\\[4pt] \\frac{2}{3} \\cdot 1 & \\text{if } n \\text{ is odd} \\end{cases}',
        description: 'Immediate closed-form formula for the definite integral of sin^n(x) or cos^n(x) from 0 to pi/2 without repeated integration by parts.',
        category: 'JEE Advanced Direct Result',
        linkedChapters: ['Integral Calculus'],
        jeeYearOrigin: 'IIT-JEE 2000 / 2014',
        directApplicationContext: 'Evaluate integrals of high powers of sine and cosine in 5 seconds in physics and calculus problems.',
        derivationSteps: [
            'Integration by parts: I_n = \\int_0^{\\pi/2} \\sin^{n-1} x \\sin x dx.',
            'I_n = [-\\sin^{n-1} x \\cos x]_0^{\\pi/2} + (n-1) \\int_0^{\\pi/2} \\sin^{n-2} x \\cos^2 x dx.',
            'Boundary term vanishes. Replace \\cos^2 x with 1 - \\sin^2 x: I_n = (n-1) I_{n-2} - (n-1) I_n.',
            'n I_n = (n-1) I_{n-2} \\implies I_n = \\frac{n-1}{n} I_{n-2}.',
            'Iterating down to I_0 = \\pi/2 (if even) or I_1 = 1 (if odd) yields the result.'
        ],
        commonTraps: [
            'Do NOT forget to multiply by \\pi/2 at the end if n is EVEN.',
            'For product \\int_0^{\\pi/2} \\sin^p x \\cos^q x dx, multiply by \\pi/2 ONLY if BOTH p and q are even.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Subtract 1 in numerator, step down by 2; append pi/2 if even',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'math-adv-005',
        subject: 'Maths',
        chapter: 'Integral Calculus',
        topic: 'Riemann Sums & Series Limits',
        name: 'Limit of Riemann Sum as Definite Integral',
        latex: '\\lim_{n \\to \\infty} \\sum_{r=1}^{k n} \\frac{1}{n} f\\left(\\frac{r}{n}\\right) = \\int_0^k f(x)\\,dx, \\quad \\lim_{n \\to \\infty} \\left[\\prod_{r=1}^n \\left(1 + \\frac{r}{n}\\right)\\right]^{1/n} = e^{\\int_0^1 \\ln(1+x)\\,dx} = \\frac{4}{e}',
        description: 'Transformation of infinite series and product limits into definite integrals by substituting r/n -> x and 1/n -> dx.',
        category: 'Multi-Domain Bridge',
        linkedChapters: ['Integral Calculus', 'Limits & Derivatives', 'Sequences and Series'],
        jeeYearOrigin: 'IIT-JEE 2004 / 2017',
        directApplicationContext: 'Mandatory standard technique for JEE Advanced limit-series questions. Take natural log for infinite products.',
        derivationSteps: [
            'Divide interval [0, k] into k*n subintervals of width \\Delta x = 1/n.',
            'Sample points x_r = r/n. The sum is the right Riemann sum \\sum f(x_r) \\Delta x.',
            'As n -> \\infty, \\Delta x -> 0, the sum converges to \\int_0^k f(x) dx by definition of Riemann integral.',
            'For product P_n: take \\ln P_n = \\frac{1}{n} \\sum \\ln(1 + r/n) -> \\int_0^1 \\ln(1+x) dx.',
            '\\int_0^1 \\ln(1+x) dx = [(1+x)\\ln(1+x) - x]_0^1 = 2\\ln 2 - 1 = \\ln(4/e). P_n -> 4/e.'
        ],
        commonTraps: [
            'Limits of integration are \\lim (r_{\\min}/n) to \\lim (r_{\\max}/n); do not blindly assume 0 to 1.',
            'Factor out 1/n explicitly before identifying f(r/n).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'r/n becomes x, 1/n becomes dx, sum becomes integral with limits r_min/n to r_max/n',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'math-adv-006',
        subject: 'Maths',
        chapter: 'Vectors',
        topic: 'Gram Determinant & Scalar Triple Product',
        name: 'Gram Determinant for Parallelopiped Volume via Dot Products',
        latex: 'V^2 = [\\vec{a}\\ \\vec{b}\\ \\vec{c}]^2 = \\begin{vmatrix} \\vec{a}\\cdot\\vec{a} & \\vec{a}\\cdot\\vec{b} & \\vec{a}\\cdot\\vec{c} \\\\[3pt] \\vec{b}\\cdot\\vec{a} & \\vec{b}\\cdot\\vec{b} & \\vec{b}\\cdot\\vec{c} \\\\[3pt] \\vec{c}\\cdot\\vec{a} & \\vec{c}\\cdot\\vec{b} & \\vec{c}\\cdot\\vec{c} \\end{vmatrix}',
        description: 'Calculates the volume of a parallelopiped formed by three vectors solely using their lengths and mutual angles (dot products) without setting up Cartesian i, j, k components.',
        category: 'Multi-Domain Bridge',
        linkedChapters: ['Vectors', 'Matrices and Determinants'],
        jeeYearOrigin: 'IIT-JEE 2008 / 2020',
        directApplicationContext: 'Crucial when given lengths |a|, |b|, |c| and pairwise angles alpha, beta, gamma and asked for volume of parallelopiped or tetrahedron (V/6).',
        derivationSteps: [
            'Let matrix M = [\\vec{a}\\ \\vec{b}\\ \\vec{c}] with components in any orthonormal basis.',
            'Volume V = \\det(M) = [\\vec{a}\\ \\vec{b}\\ \\vec{c}].',
            'Consider matrix product M^T M: the (i, j) element is the dot product of the i-th and j-th vectors.',
            'Taking determinants: \\det(M^T M) = \\det(M^T) \\det(M) = (\\det M)^2 = V^2.',
            'Thus V^2 is exactly the determinant of the dot product matrix.'
        ],
        commonTraps: [
            'Volume of TETRAHEDRON is V / 6, not V / 2 or V / 3.',
            'If the Gram determinant is zero, the three vectors are coplanar.'
        ],
        jeeFrequency: 'High',
        mnemonics: 'Squared volume of parallelopiped is determinant of mutual dot products matrix',
        linkedErrorCodes: ['E3', 'E4']
    },
    {
        id: 'math-adv-007',
        subject: 'Maths',
        chapter: 'Complex Numbers',
        topic: 'Geometry of Complex Plane',
        name: 'Equilateral Triangle Criterion in Argand Plane',
        latex: 'z_1^2 + z_2^2 + z_3^2 = z_1 z_2 + z_2 z_3 + z_3 z_1 \\iff \\frac{1}{z_1 - z_2} + \\frac{1}{z_2 - z_3} + \\frac{1}{z_3 - z_1} = 0',
        description: 'Necessary and sufficient algebraic condition for vertices z_1, z_2, z_3 in the complex plane to form an equilateral triangle.',
        category: 'Multi-Domain Bridge',
        linkedChapters: ['Complex Numbers', 'Coordinate Geometry'],
        jeeYearOrigin: 'IIT-JEE 2001 Subjective',
        directApplicationContext: 'Solve complex number geometry questions involving equilateral triangles, circumcenters, and cube roots of unity in 1 step.',
        derivationSteps: [
            'In equilateral triangle, side (z_3 - z_1) is obtained by rotating (z_2 - z_1) by 60 degrees (e^{i\\pi/3}).',
            '\\frac{z_3 - z_1}{z_2 - z_1} = e^{i\\pi/3} = \\frac{1 + i\\sqrt{3}}{2} = -\\omega^2.',
            'Cross multiplying and squaring gives (z_3 - z_1)^2 + (z_2 - z_1)^2 - (z_3 - z_1)(z_2 - z_1) = 0.',
            'Expanding and collecting terms yields z_1^2 + z_2^2 + z_3^2 = z_1 z_2 + z_2 z_3 + z_3 z_1.',
            'Dividing through by (z_1 - z_2)(z_2 - z_3)(z_3 - z_1) gives \\sum \\frac{1}{z_1 - z_2} = 0.'
        ],
        commonTraps: [
            'If origin is the circumcenter/centroid: z_1 + z_2 + z_3 = 0, which reduces the formula to z_1^2 + z_2^2 + z_3^2 = 0.',
            'Do not confuse with isosceles triangle: this formula holds ONLY for equilateral triangles.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Sum of squares equals sum of pairwise products for equilateral triangle',
        linkedErrorCodes: ['E1', 'E3']
    },

    // ---------------------------------------------------------
    // 6. HIGH-PITFALL FORMULAS & STUDENT TRAP ANCHORS
    // ---------------------------------------------------------
    {
        id: 'math-trap-001',
        subject: 'Maths',
        chapter: 'Conic Sections',
        topic: 'Tangents in Slope Form',
        name: 'Conic Tangents in Slope Form (Horizontal vs Vertical Parabola & Sign Trap)',
        latex: '\\begin{cases} y^2 = 4ax & \\implies y = mx + \\frac{a}{m} \\\\[6pt] x^2 = 4ay & \\implies y = mx - a m^2 \\quad (\\text{Minus sign, } m^2!) \\\\[6pt] \\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1 & \\implies y = mx \\pm \\sqrt{a^2 m^2 + b^2} \\\\[6pt] \\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1 & \\implies y = mx \\pm \\sqrt{a^2 m^2 - b^2} \\quad (m^2 \\ge b^2/a^2) \\end{cases}',
        description: 'Equations of tangents with given slope m to all four standard conic sections.',
        category: 'Standard',
        linkedChapters: ['Conic Sections'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Find common tangents between two conics (e.g. circle and parabola, or ellipse and parabola) by equating their c(m) expressions.',
        derivationSteps: [
            'For y^2 = 4ax: Substitute y = mx + c \\implies (mx + c)^2 = 4ax \\implies m^2 x^2 + 2(mc - 2a)x + c^2 = 0.',
            'Condition of tangency: Discriminant D = 0 \\implies 4(mc - 2a)^2 - 4m^2 c^2 = 0.',
            '-16amc + 16a^2 = 0 \\implies c = a / m \\implies y = mx + a/m.',
            'For x^2 = 4ay: Tangent is x = m\' y + a/m\' or converting back gives y = mx - a m^2.',
            'For hyperbola: c^2 = a^2 m^2 - b^2.'
        ],
        commonTraps: [
            'FATAL VERTICAL PARABOLA TRAP: For x^2 = 4ay, tangent in terms of slope m is y = mx - a m^2 (has MINUS sign and m is SQUARED in numerator!). Students almost always write y = mx + a/m.',
            'FATAL HYPERBOLA TRAP: Under the square root, it is a^2 m^2 - b^2 (MINUS, not plus). Tangents are real only if |m| >= b/a.',
            'Point of contact for y^2 = 4ax: (a/m^2, 2a/m).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'y2=4ax is +a/m; x2=4ay is -am^2; Ellipse is +b^2; Hyperbola is -b^2',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'math-trap-002',
        subject: 'Maths',
        chapter: 'Coordinate Geometry',
        topic: 'Straight Lines',
        name: 'Distance Between Parallel Lines (The Equal Coefficient Trap)',
        latex: 'd = \\frac{|c_1 - c_2|}{\\sqrt{a^2 + b^2}} \\quad \\text{for } \\begin{cases} ax + by + c_1 = 0 \\\\ ax + by + c_2 = 0 \\end{cases}',
        description: 'Perpendicular clearance distance between two parallel lines in Cartesian 2D plane.',
        category: 'Standard',
        linkedChapters: ['Coordinate Geometry'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Find distance between parallel tangents, sides of a rhombus/square, or diameter of parallel strip.',
        derivationSteps: [
            'Distance from origin to line 1: p_1 = |c_1| / \\sqrt{a^2 + b^2}.',
            'Distance from origin to line 2: p_2 = |c_2| / \\sqrt{a^2 + b^2}.',
            'Relative distance between the two lines: d = |c_1 - c_2| / \\sqrt{a^2 + b^2}.'
        ],
        commonTraps: [
            'FATAL COEFFICIENT TRAP: Formula is strictly valid ONLY when coefficients of x and y are EXACTLY EQUAL in both equations!',
            'Example: If lines are 2x + 3y + 4 = 0 and 4x + 6y + 1 = 0, you CANNOT do |4 - 1|! First divide the 2nd line by 2: 2x + 3y + 0.5 = 0, then d = |4 - 0.5| / sqrt(2^2 + 3^2) = 3.5 / sqrt(13).',
            'In denominator it is \\sqrt{a^2 + b^2}, NOT a + b!'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Make coefficients identical BEFORE subtracting constant terms |c1 - c2| / root(a^2 + b^2)',
        linkedErrorCodes: ['E1', 'E2']
    },
    {
        id: 'math-trap-003',
        subject: 'Maths',
        chapter: 'Integral Calculus',
        topic: 'Indefinite Integration Standards',
        name: 'Standard Inverse Trig Integrals: Missing 1/a Trap',
        latex: '\\int \\frac{dx}{\\sqrt{a^2 - x^2}} = \\sin^{-1}\\left(\\frac{x}{a}\\right) + C \\quad \\text{vs} \\quad \\int \\frac{dx}{a^2 + x^2} = \\frac{1}{a} \\tan^{-1}\\left(\\frac{x}{a}\\right) + C',
        description: 'Comparison of elementary algebraic integrals yielding arcsine and arctangent functions.',
        category: 'Standard',
        linkedChapters: ['Integral Calculus'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Elementary evaluation of rational and irrational algebraic integrals.',
        derivationSteps: [
            'For \\int \\frac{dx}{\\sqrt{a^2 - x^2}}: Substitute x = a \\sin\\theta \\implies dx = a \\cos\\theta d\\theta.',
            '\\int \\frac{a \\cos\\theta d\\theta}{a \\cos\\theta} = \\int d\\theta = \\theta + C = \\sin^{-1}(x/a) + C (NO 1/a factor!).',
            'For \\int \\frac{dx}{a^2 + x^2}: Substitute x = a \\tan\\theta \\implies dx = a \\sec^2\\theta d\\theta.',
            '\\int \\frac{a \\sec^2\\theta d\\theta}{a^2 \\sec^2\\theta} = \\frac{1}{a} \\int d\\theta = \\frac{1}{a} \\tan^{-1}(x/a) + C (HAS 1/a factor!).'
        ],
        commonTraps: [
            'FATAL 1/a PRE-FACTOR TRAP: \\sin^{-1}(x/a) has NO 1/a pre-factor! \\tan^{-1}(x/a) and \\sec^{-1}(x/a) DO have the 1/a pre-factor.',
            'Students lose millions of marks in definite integration by adding a rogue 1/a in front of arcsin.',
            '\\int \\frac{dx}{\\sqrt{x^2 \\pm a^2}} = \\ln|x + \\sqrt{x^2 \\pm a^2}| + C (also has NO 1/a pre-factor).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Arcsin has NO 1/a in front; Arctan HAS 1/a in front',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'math-trap-004',
        subject: 'Maths',
        chapter: 'Vectors',
        topic: 'Vector Triple Product',
        name: 'Vector Triple Product (BAC-CAB Rule & Non-Associativity)',
        latex: '\\vec{a} \\times (\\vec{b} \\times \\vec{c}) = \\vec{b}(\\vec{a} \\cdot \\vec{c}) - \\vec{c}(\\vec{a} \\cdot \\vec{b}) \\neq (\\vec{a} \\times \\vec{b}) \\times \\vec{c}',
        description: 'Vector expansion expressing a vector triple product as a linear combination of the two inner vectors.',
        category: 'Standard',
        linkedChapters: ['Vectors'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Simplifying vector equations where a vector product appears inside another cross product.',
        derivationSteps: [
            'The vector \\vec{a} \\times (\\vec{b} \\times \\vec{c}) is perpendicular to \\vec{a} and perpendicular to (\\vec{b} \\times \\vec{c}).',
            'Being perpendicular to the normal of plane containing \\vec{b} and \\vec{c}, it lies in the plane of \\vec{b} and \\vec{c}.',
            'Therefore \\vec{a} \\times (\\vec{b} \\times \\vec{c}) = x \\vec{b} + y \\vec{c}.',
            'Taking dot product with \\vec{a} gives 0 (since it is perpendicular to \\vec{a}): x(\\vec{a} \\cdot \\vec{b}) + y(\\vec{a} \\cdot \\vec{c}) = 0.',
            'Hence x = \\lambda(\\vec{a} \\cdot \\vec{c}) and y = -\\lambda(\\vec{a} \\cdot \\vec{b}). Evaluating along standard basis gives \\lambda = 1.'
        ],
        commonTraps: [
            'FATAL ORDER TRAP: Middle vector \\vec{b} comes first with PLUS sign: \\vec{b}(\\vec{a} \\cdot \\vec{c}). The far vector \\vec{c} comes second with MINUS sign: -\\vec{c}(\\vec{a} \\cdot \\vec{b}). Mnemonic: BAC minus CAB.',
            'FATAL NON-ASSOCIATIVE TRAP: (\\vec{a} \\times \\vec{b}) \\times \\vec{c} = -\\vec{c} \\times (\\vec{a} \\times \\vec{b}) = \\vec{b}(\\vec{a} \\cdot \\vec{c}) - \\vec{a}(\\vec{b} \\cdot \\vec{c}) \\neq \\vec{a} \\times (\\vec{b} \\times \\vec{c})!',
            'Parentheses determine everything: cross product is NOT associative.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'BAC minus CAB: b times (a dot c) minus c times (a dot b)',
        linkedErrorCodes: ['E1', 'E2']
    },
    {
        id: 'math-trap-005',
        subject: 'Maths',
        chapter: 'Definite Integration',
        topic: 'King\'s Property & Periodic Limits',
        name: 'King\'s Property of Definite Integrals & Periodic Reduction',
        latex: '\\int_a^b f(x)\\,dx = \\int_a^b f(a + b - x)\\,dx, \\quad \\int_0^{nT} f(x)\\,dx = n \\int_0^T f(x)\\,dx \\quad (f(x+T) = f(x))',
        description: 'King\'s reflection symmetry property and periodic function integration rules in definite integrals.',
        category: 'Standard',
        linkedChapters: ['Definite Integration'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Add I to itself (2I = \\int [f(x) + f(a+b-x)] dx) whenever integrand contains sin^n(x) / (sin^n(x) + cos^n(x)) or ln(1 + tan(x)).',
        derivationSteps: [
            'Substitute t = a + b - x \\implies dt = -dx.',
            'When x = a, t = b; when x = b, t = a.',
            '\\int_a^b f(x)\\,dx = -\\int_b^a f(a + b - t)\\,dt = \\int_a^b f(a + b - t)\\,dt = \\int_a^b f(a + b - x)\\,dx.',
            'For periodic function with period T: \\int_{a}^{a + nT} f(x)\\,dx = n \\int_0^T f(x)\\,dx (independent of lower limit a!).'
        ],
        commonTraps: [
            'FATAL LIMIT SUM TRAP: In King\'s property, replace x with (a + b - x). For integral from 0 to \\pi/2, replace x with (\\pi/2 - x). Do NOT just replace with (b - x)!',
            'FATAL PERIODIC LOWER LIMIT TRAP: \\int_a^{a + nT} f(x) dx is strictly independent of a. Never compute separate integrals across each period interval.',
            'Fractional part function: \\int_0^n \\{x\\} dx = n \\int_0^1 x dx = n \\times \\frac{1}{2} = \\frac{n}{2}.'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'King Property replaces x with lower plus upper minus x (a + b - x); 2I addition collapses denominator',
        linkedErrorCodes: ['E1', 'E3']
    },
    {
        id: 'math-trap-006',
        subject: 'Maths',
        chapter: 'Circles',
        topic: 'Radical Axis & Common Chord',
        name: 'Radical Axis & Common Chord (The Coefficient Normalization Trap)',
        latex: 'S_1 - S_2 = 0 \\iff (x^2 + y^2 + 2g_1 x + 2f_1 y + c_1) - (x^2 + y^2 + 2g_2 x + 2f_2 y + c_2) = 0',
        description: 'Locus of points from which lengths of tangents drawn to two non-concentric circles are equal. Equation of common chord if circles intersect.',
        category: 'Standard',
        linkedChapters: ['Circles', 'Straight Lines'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Finding line containing points of intersection of two circles, or radical center of three circles (radical axes concurrent!).',
        derivationSteps: [
            'Length of tangent from point P(x, y) to circle S is L = \\sqrt{S}.',
            'Equating lengths: \\sqrt{S_1} = \\sqrt{S_2} \\implies S_1 = S_2 \\implies S_1 - S_2 = 0.',
            'Quadratic terms x^2 and y^2 cancel out identically, leaving linear equation: 2(g_1 - g_2)x + 2(f_1 - f_2)y + (c_1 - c_2) = 0.',
            'Radical axis is perpendicular to line joining centers C_1 and C_2.'
        ],
        commonTraps: [
            'FATAL NORMALIZATION TRAP: S_1 - S_2 = 0 ONLY works if coefficients of x^2 and y^2 in BOTH circles are unity (+1)! If given 2x^2 + 2y^2 + ... you MUST divide by 2 first.',
            'If circles touch externally or internally, radical axis is their COMMON TANGENT at point of contact.',
            'Radical axis does NOT exist for concentric circles (centers coincide, so coefficients of x and y vanish).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Normalize x^2 and y^2 coefficients to 1 before writing S1 - S2 = 0; Radical axis is perpendicular to line of centers',
        linkedErrorCodes: ['E1', 'E2']
    },
    {
        id: 'math-trap-007',
        subject: 'Maths',
        chapter: 'Permutations & Combinations',
        topic: 'Multinomial Theorem & Number of Terms',
        name: 'Number of Non-Negative Integer Solutions & Multinomial Terms',
        latex: 'N = \\binom{n + r - 1}{r - 1} \\quad \\text{(Non-negative: } x_i \\ge 0\\text{)}, \\quad N\' = \\binom{n - 1}{r - 1} \\quad \\text{(Positive integers: } x_i \\ge 1\\text{)}',
        description: 'Total number of terms in polynomial expansion (x_1 + x_2 + ... + x_r)^n and distribution of n identical items into r distinct boxes.',
        category: 'Standard',
        linkedChapters: ['Permutations & Combinations', 'Binomial Theorem'],
        jeeYearOrigin: 'Universal JEE Fundamental',
        directApplicationContext: 'Number of terms in (a + b + c + d)^10 is C(10 + 4 - 1, 4 - 1) = C(13, 3) = 286.',
        derivationSteps: [
            'Partitioning n identical items into r groups requires inserting (r - 1) dividers/bars.',
            'Total positions to arrange n items and (r - 1) dividers = n + r - 1.',
            'Choosing positions for dividers: \\binom{n + r - 1}{r - 1}.',
            'For strictly positive integers (x_i >= 1): give 1 item to each of r boxes first (leaving n - r items): \\binom{(n - r) + r - 1}{r - 1} = \\binom{n - 1}{r - 1}.'
        ],
        commonTraps: [
            'FATAL COMBINATION TRAP: For non-negative integers (>= 0), use \\binom{n + r - 1}{r - 1}. For positive integers (>= 1), use \\binom{n - 1}{r - 1}.',
            'In trinomial (x + y + z)^n, number of terms is \\frac{(n+1)(n+2)}{2} = \\binom{n+2}{2}.',
            'This formula assumes variables x_1, x_2, ..., x_r are INDEPENDENT (no like-term cancellations like in (1 + x + x^2)^n!).'
        ],
        jeeFrequency: 'Very High',
        mnemonics: 'Non-negative: C(n + r - 1, r - 1); Positive: C(n - 1, r - 1); Dividers = r - 1',
        linkedErrorCodes: ['E1', 'E4']
    }
];