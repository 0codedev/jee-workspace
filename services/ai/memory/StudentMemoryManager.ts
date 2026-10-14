import { StudentMemoryItem } from '../../../types';

export class StudentMemoryManager {
    private static STORAGE_KEY = 'jee_student_cross_session_memory_v1';

    /**
     * Retrieve all persistent student memories from local storage
     */
    public static getMemories(): StudentMemoryItem[] {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Failed to load student memories", e);
        }
        return this.getDefaultMemories();
    }

    /**
     * Persist memories to local storage
     */
    public static saveMemories(items: StudentMemoryItem[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.error("Failed to save student memories", e);
        }
    }

    /**
     * Add a single new memory item
     */
    public static addMemory(category: StudentMemoryItem['category'], fact: string): StudentMemoryItem {
        const cleanFact = fact.trim();
        const items = this.getMemories();
        
        // Prevent exact duplicates
        const existing = items.find(m => m.fact.toLowerCase() === cleanFact.toLowerCase());
        if (existing) {
            existing.updatedAt = Date.now();
            this.saveMemories(items);
            return existing;
        }

        const newItem: StudentMemoryItem = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            category,
            fact: cleanFact,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        items.unshift(newItem);
        this.saveMemories(items);
        return newItem;
    }

    /**
     * Update an existing memory item
     */
    public static updateMemory(id: string, fact: string, category?: StudentMemoryItem['category']): void {
        const items = this.getMemories().map(m => {
            if (m.id === id) {
                return {
                    ...m,
                    fact: fact.trim(),
                    category: category || m.category,
                    updatedAt: Date.now()
                };
            }
            return m;
        });
        this.saveMemories(items);
    }

    /**
     * Delete a single memory item by id
     */
    public static deleteMemory(id: string): void {
        const items = this.getMemories().filter(m => m.id !== id);
        this.saveMemories(items);
    }

    /**
     * Clear all student memories
     */
    public static clearAllMemories(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch {}
    }

    /**
     * Format memory bank into a compact, high-impact system prompt block
     */
    public static formatForPrompt(): string {
        const items = this.getMemories();
        if (items.length === 0) return '';

        const grouped: Record<StudentMemoryItem['category'], string[]> = {
            academic_goal: [],
            weak_spot: [],
            learning_preference: [],
            active_commitment: []
        };

        for (const item of items) {
            if (grouped[item.category]) {
                grouped[item.category].push(item.fact);
            }
        }

        const sections: string[] = [];

        if (grouped.academic_goal.length > 0) {
            sections.push(`- TARGETS & GOALS: ${grouped.academic_goal.join(' | ')}`);
        }
        if (grouped.weak_spot.length > 0) {
            sections.push(`- CHRONIC WEAKNESSES: ${grouped.weak_spot.join(' | ')}`);
        }
        if (grouped.learning_preference.length > 0) {
            sections.push(`- LEARNING PREFERENCES: ${grouped.learning_preference.join(' | ')}`);
        }
        if (grouped.active_commitment.length > 0) {
            sections.push(`- CURRENT REMEDIATION: ${grouped.active_commitment.join(' | ')}`);
        }

        if (sections.length === 0) return '';

        return `\n<STUDENT_CROSS_SESSION_MEMORY>\n(The following are verified facts remembered about this student across past sessions. Factor these seamlessly into your advice without repeating them verbatim):\n${sections.join('\n')}\n</STUDENT_CROSS_SESSION_MEMORY>\n`;
    }

    /**
     * Autonomous heuristic detector to capture durable student statements in real time
     */
    public static inspectAndExtractFromQuery(query: string): StudentMemoryItem | null {
        if (!query || query.length < 10) return null;
        const lower = query.toLowerCase();

        // 1. Weakness statements
        if (/i am (really |very )?(weak|struggling|bad) (at|in)/i.test(lower) || /i always (mess up|lose marks|forget) (in|on|with)/i.test(lower)) {
            const match = query.match(/(?:weak|struggling|bad|mess up|lose marks|forget)\s+(?:at|in|on|with)?\s+([^.,;?!]+)/i);
            if (match && match[1] && match[1].trim().length > 3) {
                return this.addMemory('weak_spot', `Student struggles with ${match[1].trim()}`);
            }
        }

        // 2. Goal statements
        if (/my (target|goal|dream) is/i.test(lower) || /i want to get into/i.test(lower) || /aiming for/i.test(lower)) {
            const match = query.match(/(?:target|goal|dream|get into|aiming for)\s+(?:is|to)?\s+([^.,;?!]+)/i);
            if (match && match[1] && match[1].trim().length > 3) {
                return this.addMemory('academic_goal', `Target: ${match[1].trim()}`);
            }
        }

        // 3. Learning preference
        if (/i prefer/i.test(lower) || /explain (using|with) feynman/i.test(lower) || /give me (only |concise )?bullet/i.test(lower)) {
            if (/feynman/i.test(lower)) {
                return this.addMemory('learning_preference', 'Prefers Feynman intuitive explanations and thought experiments');
            }
            if (/bullet/i.test(lower)) {
                return this.addMemory('learning_preference', 'Prefers concise bulleted explanations over lengthy paragraphs');
            }
        }

        return null;
    }

    /**
     * Default starter memories based on JEE War Room profile defaults
     */
    private static getDefaultMemories(): StudentMemoryItem[] {
        return [
            {
                id: 'mem_default_target',
                category: 'academic_goal',
                fact: 'Target: 99.5+ Percentile in JEE Main and Top 2000 Rank in JEE Advanced',
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'mem_default_style',
                category: 'learning_preference',
                fact: 'Prefers deep conceptual clarity and step-by-step mathematical reasoning over pure memorization',
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'mem_default_weakness',
                category: 'weak_spot',
                fact: 'Prone to calculation blunders under time pressure in multi-step physics problems',
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];
    }
}