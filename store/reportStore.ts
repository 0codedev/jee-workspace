import { create } from 'zustand';
import { TestReport, QuestionLog, GlobalFilter } from '../types';

interface ReportState {
  testReports: TestReport[];
  questionLogs: QuestionLog[];
  globalFilter: GlobalFilter;
  setTestReports: (reports: TestReport[]) => void;
  addTestReport: (report: TestReport) => void;
  deleteTestReport: (id: string) => void;
  setQuestionLogs: (logs: QuestionLog[]) => void;
  setGlobalFilter: (filter: GlobalFilter) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  testReports: [],
  questionLogs: [],
  globalFilter: {
    type: 'all',
    subType: 'all'
  },
  setTestReports: (reports) => set({ testReports: reports }),
  addTestReport: (report) => set((state) => ({ testReports: [...state.testReports, report] })),
  deleteTestReport: (id) => set((state) => ({ testReports: state.testReports.filter(r => r.id !== id) })),
  setQuestionLogs: (logs) => set({ questionLogs: logs }),
  setGlobalFilter: (filter) => set({ globalFilter: filter })
}));
