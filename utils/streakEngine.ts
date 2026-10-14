import { dbService } from '../services/dbService';

export interface StreakRecord {
    count: number;
    date: string; // YYYY-MM-DD in IST timezone
}

/**
 * Returns current date formatted as YYYY-MM-DD in Indian Standard Time (Asia/Kolkata).
 */
export const getISTDateString = (date: Date = new Date()): string => {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(date);
    } catch (e) {
        // Fallback to local date string if Intl timezone is unsupported
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

/**
 * Returns yesterday's date formatted as YYYY-MM-DD in IST.
 */
export const getISTYesterdayDateString = (currentDate: Date = new Date()): string => {
    const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    return getISTDateString(yesterday);
};

/**
 * Calculates the active streak count for UI display.
 * If the streak was completed today or yesterday, count is active.
 * If more than 1 day was missed, active streak is 0.
 */
export const getActiveStreakCount = (record: StreakRecord, todayStr: string = getISTDateString()): number => {
    if (!record || !record.date || record.count <= 0) return 0;
    if (record.date === todayStr) return record.count;
    
    // Check if record.date was yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getISTDateString(yesterdayDate);
    
    if (record.date === yesterdayStr) return record.count;
    
    return 0;
};

/**
 * Evaluates the new streak state when daily tasks are completed today.
 * Pure function: does not mutate storage or state.
 */
export const evaluateStreakOnCompletion = (
    currentRecord: StreakRecord,
    todayStr: string = getISTDateString()
): StreakRecord => {
    // If already completed today, preserve current count and date
    if (currentRecord.date === todayStr) {
        return currentRecord;
    }

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getISTDateString(yesterdayDate);

    // If last completed yesterday, increment streak
    if (currentRecord.date === yesterdayStr) {
        return {
            count: Math.max(1, currentRecord.count + 1),
            date: todayStr
        };
    }

    // Otherwise streak was broken or brand new, reset to 1 day
    return {
        count: 1,
        date: todayStr
    };
};

/**
 * Persists streak record to both IndexedDB ('appState' store) and localStorage backup.
 */
export const saveStreak = async (record: StreakRecord): Promise<void> => {
    try {
        // 1. IndexedDB primary save
        await dbService.put('appState', record, 'streakData');
    } catch (e) {
        console.error('[StreakEngine] Failed to save streak to IndexedDB:', e);
    }

    try {
        // 2. LocalStorage secondary backup save
        localStorage.setItem('streakData_v1', JSON.stringify(record));
    } catch (e) {
        console.error('[StreakEngine] Failed to save streak to localStorage:', e);
    }
};

/**
 * Loads streak record from IndexedDB first, with localStorage fallback.
 * Takes the record with the higher count / most recent validity to avoid data loss.
 */
export const loadStreak = async (): Promise<StreakRecord> => {
    let idbRecord: StreakRecord | undefined;
    let localRecord: StreakRecord | undefined;

    // Load from IndexedDB
    try {
        idbRecord = await dbService.get<StreakRecord>('appState', 'streakData');
    } catch (e) {
        console.error('[StreakEngine] Failed to load streak from IndexedDB:', e);
    }

    // Load from localStorage
    try {
        const raw = localStorage.getItem('streakData_v1');
        if (raw) {
            localRecord = JSON.parse(raw);
        }
    } catch (e) {
        console.error('[StreakEngine] Failed to load streak from localStorage:', e);
    }

    const defaultRecord: StreakRecord = { count: 0, date: '' };

    // Resolve best record
    if (idbRecord && localRecord) {
        // If counts differ, prefer higher count
        if (idbRecord.count > localRecord.count) return idbRecord;
        if (localRecord.count > idbRecord.count) return localRecord;
        // If counts equal, prefer IndexedDB
        return idbRecord;
    }

    const best = idbRecord || localRecord || defaultRecord;
    
    // Ensure both stores are in sync with the best record found
    if (best.count > 0) {
        await saveStreak(best);
    }

    return best;
};