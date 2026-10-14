import { create } from 'zustand';
import { GamificationState } from '../types';

interface GamificationStoreState {
  gamificationState: GamificationState;
  setGamificationState: (state: GamificationState) => void;
  addXp: (amount: number) => void;
}

export const useGamificationStore = create<GamificationStoreState>((set) => ({
  gamificationState: {
    level: 1,
    xp: 0,
    unlockedAchievements: {
      firstSteps: { unlockedAt: new Date().toISOString() }
    } as any,
    completedTasks: 0,
    streakData: { count: 0, date: new Date().toISOString() },
    events: {}
  },
  setGamificationState: (state) => set({ gamificationState: state }),
  addXp: (amount) => set((prev) => {
    const newXp = prev.gamificationState.xp + amount;
    let level = prev.gamificationState.level;

    if (newXp >= level * 1000) {
      level += 1;
    }

    return {
      gamificationState: {
        ...prev.gamificationState,
        level,
        xp: newXp
      }
    };
  })
}));