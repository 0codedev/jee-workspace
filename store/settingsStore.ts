import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AiAssistantPreferences, NotificationPreferences, AppearancePreferences } from '../types';

interface SettingsState {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  aiPreferences: AiAssistantPreferences;
  setAiPreferences: (prefs: AiAssistantPreferences) => void;
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (prefs: NotificationPreferences) => void;
  appearancePreferences: AppearancePreferences;
  setAppearancePreferences: (prefs: AppearancePreferences) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: '' }),
      aiPreferences: {
        model: 'gemini-3.8-flash',
        responseLength: 'medium',
        tone: 'balanced' as any,
        socraticMode: false,
        modelOverrides: {}
      },
      setAiPreferences: (prefs) => set({ aiPreferences: prefs }),
      notificationPreferences: {
        achievements: true,
        proactiveInsights: true,
        proactiveInsightSensitivity: 'medium',
        flashcardReminders: true,
        bioCheckReminders: true
      },
      setNotificationPreferences: (prefs) => set({ notificationPreferences: prefs }),
      appearancePreferences: {
        disableParticles: false,
        reduceMotion: false,
        highContrast: false,
        largeText: false,
        dyslexicFont: false,
        liteMode: false
      },
      setAppearancePreferences: (prefs) => set({ appearancePreferences: prefs }),
      theme: 'theme-sentinel-dark',
      setTheme: (theme) => set({ theme })
    }),
    {
      name: 'jee-settings-storage'
    }
  )
);