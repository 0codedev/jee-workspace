// ============================================================================
// JEE Formula Vault Barrel Export & Search Utilities
// ============================================================================

import { Formula, FormulaCategory } from '../../types';
import { PHYSICS_FORMULAS } from './physics';
import { CHEMISTRY_FORMULAS } from './chemistry';
import { MATHS_FORMULAS } from './maths';

export const ALL_FORMULAS: Formula[] = [
    ...PHYSICS_FORMULAS,
    ...CHEMISTRY_FORMULAS,
    ...MATHS_FORMULAS
];

export { PHYSICS_FORMULAS, CHEMISTRY_FORMULAS, MATHS_FORMULAS };

/**
 * Searches formulas across name, chapter, topic, description, mnemonics, category, origin, and linked chapters
 */
export function searchFormulas(query: string, subject?: 'Physics' | 'Chemistry' | 'Maths', category?: FormulaCategory | 'All'): Formula[] {
    let pool = ALL_FORMULAS;
    if (subject && subject !== undefined) {
        pool = pool.filter(f => f.subject === subject);
    }
    if (category && category !== 'All') {
        pool = pool.filter(f => f.category === category);
    }

    if (!query || query.trim() === '') {
        return pool;
    }

    const q = query.toLowerCase().trim();
    return pool.filter(f => 
        f.name.toLowerCase().includes(q) ||
        f.chapter.toLowerCase().includes(q) ||
        f.topic.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.jeeYearOrigin && f.jeeYearOrigin.toLowerCase().includes(q)) ||
        (f.directApplicationContext && f.directApplicationContext.toLowerCase().includes(q)) ||
        (f.linkedChapters && f.linkedChapters.some(c => c.toLowerCase().includes(q))) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.mnemonics && f.mnemonics.toLowerCase().includes(q))
    );
}

/**
 * Filters formulas strictly by Category
 */
export function getFormulasByCategory(category: FormulaCategory | 'All', subject?: 'Physics' | 'Chemistry' | 'Maths'): Formula[] {
    let pool = ALL_FORMULAS;
    if (subject) {
        pool = pool.filter(f => f.subject === subject);
    }
    if (category === 'All') {
        return pool;
    }
    return pool.filter(f => f.category === category);
}

/**
 * Groups formulas by Subject and Chapter
 */
export function getFormulasByChapter(subject?: 'Physics' | 'Chemistry' | 'Maths'): Record<string, Formula[]> {
    let pool = ALL_FORMULAS;
    if (subject) {
        pool = pool.filter(f => f.subject === subject);
    }

    const grouped: Record<string, Formula[]> = {};
    pool.forEach(f => {
        if (!grouped[f.chapter]) {
            grouped[f.chapter] = [];
        }
        grouped[f.chapter].push(f);
    });

    return grouped;
}