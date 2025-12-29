import { create } from 'zustand';
import { 
    TestReport,
    QuestionLog,
    StudyGoal,
    LongTermGoal,
    DailyTask,
    FlashcardSession,
    Flashcard,
    Reflection
} from '../types';
import { dbService } from '../services/dbService';
import { db } from '../database';
import { saveStreak } from '../utils/streakEngine';

interface DataState {
    testReports: TestReport[];
    questionLogs: QuestionLog[];
    studyGoals: StudyGoal[];
    longTermGoals: LongTermGoal[];
    dailyTasks: DailyTask[];
    flashcardSession: FlashcardSession;
    reflections: Reflection[];
    
    // DailyPlanner specific state
    bioStats: { sleep: number; stress: number; energy: number; date: string; skipped?: boolean } | null;
    dailyQuote: { text: string; date: string } | null;
    streakData: { count: number; date: string };
    endOfDaySummaries: Record<string, string>;
    dailyPlansHistory: Record<string, DailyTask[]>;
}

interface DataActions {
    addTestReport: (report: TestReport, logs: QuestionLog[]) => void;
    setTestReports: (reports: TestReport[] | ((prev: TestReport[]) => TestReport[])) => void;
    setQuestionLogs: (logs: QuestionLog[] | ((prev: QuestionLog[]) => QuestionLog[])) => void;
    setDailyTasks: (tasks: DailyTask[] | ((prev: DailyTask[]) => DailyTask[])) => void;
    setStudyGoals: (goals: StudyGoal[] | ((prev: StudyGoal[]) => StudyGoal[])) => void;
    setLongTermGoals: (goals: LongTermGoal[] | ((prev: LongTermGoal[]) => LongTermGoal[])) => void;
    setReflections: (reflections: Reflection[] | ((prev: Reflection[]) => Reflection[])) => void;
    
    setBioStats: (stats: DataState['bioStats']) => void;
    setDailyQuote: (quote: DataState['dailyQuote']) => void;
    setStreakData: (data: DataState['streakData']) => void;
    setEndOfDaySummaries: (summaries: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    setDailyPlansHistory: (history: Record<string, DailyTask[]> | ((prev: Record<string, DailyTask[]>) => Record<string, DailyTask[]>)) => void;
    
    clearReportsAndLogs: () => Promise<void>;
    
    startFlashcardSession: (cards: Flashcard[]) => void;
    rateCurrentCard: (quality: number) => void;
    getSessionResults: () => Flashcard[];
    
    hydrateData: (data: Partial<DataState>) => void;
}

const initialFlashcardSession: FlashcardSession = {
    currentCardIndex: 0,
    streak: 0,
    masteredCards: 0,
    deck: [],
    startTime: 0
};

// --- SM-2 Logic ---
const calculateNextReview = (card: Flashcard, quality: number) => {
    let interval = card.interval;
    let easeFactor = card.easeFactor;
    let reviews = card.reviews;
    let consecutiveCorrect = card.consecutiveCorrect || 0;
    let ladderLevel = card.ladderLevel || 1;
    let masteredAt = card.masteredAt;

    if (quality < 3) {
        reviews = 0;
        interval = 1; 
        easeFactor = Math.max(1.3, easeFactor - 0.2); 
        consecutiveCorrect = 0;
        if (quality === 1 && ladderLevel > 1) {
            ladderLevel = (ladderLevel - 1) as 1 | 2 | 3 | 4;
        }
    } else {
        reviews += 1;
        if (interval === 0) interval = 1;
        else if (interval === 1) interval = 3;
        else interval = Math.round(interval * easeFactor);

        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        consecutiveCorrect += 1;
        if (consecutiveCorrect >= 2 && ladderLevel < 4) {
            ladderLevel = (ladderLevel + 1) as 1 | 2 | 3 | 4;
            consecutiveCorrect = 0;
        }
        if (ladderLevel === 4 && consecutiveCorrect >= 3 && !masteredAt) {
            masteredAt = new Date().toISOString();
        }
    }
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    const updatedCard: Flashcard = {
        ...card,
        interval,
        easeFactor,
        reviews,
        nextReview: nextReviewDate.toISOString(),
        consecutiveCorrect,
        ladderLevel,
        masteredAt
    };

    dbService.upsertFlashcard(updatedCard).catch(e => console.error("Error upserting rated flashcard:", e));

    return updatedCard;
};

export const useDataStore = create<DataState & DataActions>((set, get) => ({
    testReports: [],
    questionLogs: [],
    studyGoals: [],
    longTermGoals: [],
    dailyTasks: [],
    flashcardSession: initialFlashcardSession,
    reflections: [],
    bioStats: null,
    dailyQuote: null,
    streakData: { count: 0, date: '' },
    endOfDaySummaries: {},
    dailyPlansHistory: {},

    addTestReport: (report, logs) => {
        set(state => {
            const newReports = [...state.testReports.filter(r => r.id !== report.id), report];
            const newLogs = [...state.questionLogs.filter(l => l.testId !== report.id), ...logs];
            
            dbService.put('testReports', report);
            dbService.putBulk('questionLogs', logs);

            // Also persist to Dexie db (JeeDashboardDB_v2) for 100% offline query integrity
            db.testReports.put(report).catch(e => console.error("Dexie put report error:", e));
            db.questionLogs.bulkPut(logs).catch(e => console.error("Dexie bulkPut logs error:", e));
            
            return { testReports: newReports, questionLogs: newLogs };
        });
    },

    setTestReports: (reportsOrFn) => {
        set(state => {
            const newReports = typeof reportsOrFn === 'function' ? reportsOrFn(state.testReports) : reportsOrFn;
            dbService.syncStore('testReports', newReports);
            return { testReports: newReports };
        });
    },

    setQuestionLogs: (logsOrFn) => {
        set(state => {
            const newLogs = typeof logsOrFn === 'function' ? logsOrFn(state.questionLogs) : logsOrFn;
            dbService.syncStore('questionLogs', newLogs);
            return { questionLogs: newLogs };
        });
    },

    setDailyTasks: (tasksOrFn) => {
        set(state => {
            const newTasks = typeof tasksOrFn === 'function' ? tasksOrFn(state.dailyTasks) : tasksOrFn;
            dbService.syncStore('dailyTasks', newTasks);
            const getLocalDateStr = (date: Date = new Date()) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            dbService.put('appState', getLocalDateStr(), 'dailyTasksDate');
            return { dailyTasks: newTasks };
        });
    },

    setStudyGoals: (goalsOrFn) => {
        set(state => {
            const newGoals = typeof goalsOrFn === 'function' ? goalsOrFn(state.studyGoals) : goalsOrFn;
            dbService.syncStore('studyGoals', newGoals);
            return { studyGoals: newGoals };
        });
    },

    setLongTermGoals: (goalsOrFn) => {
        set(state => {
            const newGoals = typeof goalsOrFn === 'function' ? goalsOrFn(state.longTermGoals) : goalsOrFn;
            dbService.syncStore('longTermGoals', newGoals);
            return { longTermGoals: newGoals };
        });
    },

    setReflections: (reflectionsOrFn) => {
        set(state => {
            const newReflections = typeof reflectionsOrFn === 'function' ? reflectionsOrFn(state.reflections) : reflectionsOrFn;
            dbService.syncStore('reflections', newReflections);
            return { reflections: newReflections };
        });
    },

    setBioStats: (stats) => {
        set({ bioStats: stats });
        if (stats) localStorage.setItem(`bioLog_${stats.date}`, JSON.stringify(stats));
    },
    setDailyQuote: (quote) => {
        set({ dailyQuote: quote });
        if (quote) localStorage.setItem('dailyQuote', JSON.stringify(quote));
    },
    setStreakData: (data) => {
        set({ streakData: data });
        saveStreak(data);
    },
    setEndOfDaySummaries: (summariesOrFn) => {
        set(state => {
            const newSummaries = typeof summariesOrFn === 'function' ? summariesOrFn(state.endOfDaySummaries) : summariesOrFn;
            localStorage.setItem('endOfDaySummaries_v1', JSON.stringify(newSummaries));
            return { endOfDaySummaries: newSummaries };
        });
    },
    setDailyPlansHistory: (historyOrFn) => {
        set(state => {
            const newHistory = typeof historyOrFn === 'function' ? historyOrFn(state.dailyPlansHistory) : historyOrFn;
            localStorage.setItem('dailyPlansHistory_v1', JSON.stringify(newHistory));
            return { dailyPlansHistory: newHistory };
        });
    },

    clearReportsAndLogs: async () => {
        await dbService.clearStore('testReports');
        await dbService.clearStore('questionLogs');
        set({ testReports: [], questionLogs: [] });
    },

    startFlashcardSession: (cards) => set({
        flashcardSession: {
            currentCardIndex: 0,
            streak: 0,
            masteredCards: 0,
            deck: cards,
            startTime: Date.now()
        }
    }),

    rateCurrentCard: (quality) => set((state) => {
        const session = state.flashcardSession;
        const currentCard = session.deck[session.currentCardIndex];
        
        if (!currentCard) return state;

        const updatedCard = calculateNextReview(currentCard, quality);
        const newDeck = [...session.deck];
        newDeck[session.currentCardIndex] = updatedCard;
        const isCorrect = quality >= 3;

        let carelessSaves = session.carelessSaves || 0;
        if (currentCard.isCarelessError && quality >= 4) {
            carelessSaves += 1;
        }

        let timeSinksRedeemed = session.timeSinksRedeemed || 0;
        if (currentCard.isTimeSink && quality >= 3) {
            timeSinksRedeemed += 1;
        }

        const errorCodesEncountered = [...(session.errorCodesEncountered || [])];
        if (currentCard.errorCode && !errorCodesEncountered.includes(currentCard.errorCode)) {
            errorCodesEncountered.push(currentCard.errorCode);
        }

        const againCount = (session.againCount || 0) + (quality < 3 ? 1 : 0);
        const totalRated = (session.totalRated || 0) + 1;

        return {
            flashcardSession: {
                ...session,
                deck: newDeck,
                currentCardIndex: session.currentCardIndex + 1,
                streak: isCorrect ? session.streak + 1 : 0,
                masteredCards: isCorrect ? session.masteredCards + 1 : session.masteredCards,
                carelessSaves,
                timeSinksRedeemed,
                errorCodesEncountered,
                againCount,
                totalRated
            }
        };
    }),

    getSessionResults: () => get().flashcardSession.deck,

    hydrateData: (data) => set(state => {
        let reports = data.testReports || state.testReports;
        const logs = data.questionLogs || state.questionLogs;

        // Auto-backfill estimated ranks for past uploaded test reports where rank is 0
        if (reports && reports.length > 0 && logs && logs.length > 0) {
            reports = reports.map(report => {
                if (report.total && report.total.rank > 0 && report.total.rank <= 50000 && report.physics?.rank > 0 && report.physics.rank <= 50000) {
                    return report;
                }

                const testLogs = logs.filter(l => l.testId === report.id);
                if (testLogs.length === 0) return report;

                let physPeerExp = 0, chemPeerExp = 0, mathPeerExp = 0;
                let physMax = 0, chemMax = 0, mathMax = 0;

                testLogs.forEach(l => {
                    const posMarks = l.positiveMarks || 4;
                    const negMarks = l.negativeMarks || 1;
                    const corrPct = l.globalCorrectPct || (l as any).peerCorrectPercent || 0;
                    const wrongPct = l.globalWrongPct || (l as any).peerWrongPercent || 0;
                    const expMarks = (posMarks * (corrPct / 100)) - (negMarks * (wrongPct / 100));

                    const subj = (l.subject || '').toLowerCase();
                    if (subj.includes('physic')) {
                        physPeerExp += expMarks;
                        physMax += posMarks;
                    } else if (subj.includes('chemist')) {
                        chemPeerExp += expMarks;
                        chemMax += posMarks;
                    } else if (subj.includes('math')) {
                        mathPeerExp += expMarks;
                        mathMax += posMarks;
                    }
                });

                const estimateRank = (userMarks: number, peerAvg: number, maxScore: number) => {
                    if (maxScore <= 0) return { rank: 1, percentile: 50 };
                    const diff = userMarks - peerAvg;
                    const spread = Math.max(10, maxScore * 0.25);
                    const z = diff / spread;
                    let percentile = 100 / (1 + Math.exp(-z * 1.6));
                    percentile = Math.min(99.99, Math.max(1, Math.round(percentile * 100) / 100));
                    const totalCandidates = 50000; // ExamGOAL Active Peer Batch Pool Standard (50k Test-takers)
                    const rank = Math.max(1, Math.round(((100 - percentile) / 100) * totalCandidates));
                    return { rank, percentile };
                };

                const physPeer = estimateRank(report.physics?.marks || 0, physPeerExp, physMax || 100);
                const chemPeer = estimateRank(report.chemistry?.marks || 0, chemPeerExp, chemMax || 100);
                const mathPeer = estimateRank(report.maths?.marks || 0, mathPeerExp, mathMax || 100);
                const totalPeer = estimateRank(report.total?.marks || 0, physPeerExp + chemPeerExp + mathPeerExp, (physMax + chemMax + mathMax) || 300);

                const updatedReport: TestReport = {
                    ...report,
                    physics: { ...report.physics, rank: physPeer.rank, percentile: physPeer.percentile },
                    chemistry: { ...report.chemistry, rank: chemPeer.rank, percentile: chemPeer.percentile },
                    maths: { ...report.maths, rank: mathPeer.rank, percentile: mathPeer.percentile },
                    total: { ...report.total, rank: totalPeer.rank, percentile: totalPeer.percentile }
                };

                // Persist updated report back to IndexedDB
                dbService.put('testReports', updatedReport);
                db.testReports.put(updatedReport).catch(() => {});

                return updatedReport;
            });
        }

        return {
            ...data,
            testReports: reports
        };
    })
}));
