import { create } from 'zustand';
import { DailyTask, StudyGoal } from '../types';

export interface BioStats {
  sleepHours: number;
  energyLevel: number;
  stressLevel: number;
  focusScore: number;
}

export interface DailyQuote {
  quote: string;
  author: string;
}

export interface StreakData {
  count: number;
  date: string;
}

export interface EndOfDaySummary {
  date: string;
  completedCount: number;
  totalCount: number;
  notes?: string;
}

export interface DailyPlanHistoryItem {
  date: string;
  tasks: DailyTask[];
}

interface PlannerState {
  dailyTasks: DailyTask[];
  setDailyTasks: (tasks: DailyTask[]) => void;
  addTask: (task: DailyTask) => void;
  updateTask: (task: DailyTask) => void;
  deleteTask: (id: string) => void;
  bioStats: BioStats;
  setBioStats: (stats: BioStats) => void;
  dailyQuote: DailyQuote | null;
  setDailyQuote: (quote: DailyQuote | null) => void;
  streakData: StreakData;
  setStreakData: (streak: StreakData) => void;
  studyGoals: StudyGoal[];
  setStudyGoals: (goals: StudyGoal[]) => void;
  endOfDaySummaries: EndOfDaySummary[];
  setEndOfDaySummaries: (summaries: EndOfDaySummary[]) => void;
  dailyPlansHistory: DailyPlanHistoryItem[];
  setDailyPlansHistory: (history: DailyPlanHistoryItem[]) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  dailyTasks: [],
  setDailyTasks: (tasks) => set({ dailyTasks: tasks }),
  addTask: (task) => set((state) => ({ dailyTasks: [...state.dailyTasks, task] })),
  updateTask: (task) => set((state) => ({
    dailyTasks: state.dailyTasks.map(t => t.id === task.id ? task : t)
  })),
  deleteTask: (id) => set((state) => ({
    dailyTasks: state.dailyTasks.filter(t => t.id !== id)
  })),
  bioStats: { sleepHours: 7, energyLevel: 8, stressLevel: 3, focusScore: 85 },
  setBioStats: (stats) => set({ bioStats: stats }),
  dailyQuote: null,
  setDailyQuote: (quote) => set({ dailyQuote: quote }),
  streakData: { count: 0, date: '' },
  setStreakData: (streak) => set({ streakData: streak }),
  studyGoals: [],
  setStudyGoals: (goals) => set({ studyGoals: goals }),
  endOfDaySummaries: [],
  setEndOfDaySummaries: (summaries) => set({ endOfDaySummaries: summaries }),
  dailyPlansHistory: [],
  setDailyPlansHistory: (history) => set({ dailyPlansHistory: history })
}));
