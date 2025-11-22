import Dexie, { type Table } from 'dexie';
import type { 
  TestReport, 
  QuestionLog, 
  DailyTask, 
  Flashcard, 
  Reflection, 
  ChapterProgress, 
  GamificationState,
  AiAssistantPreferences 
} from './types';

export const EXPECTED_SCHEMA_VERSION = 3;

export interface DBTestReport extends TestReport {}

export interface DBQuestionLog extends QuestionLog {
  id?: number;
}

export interface DBDailyTask extends DailyTask {}

export interface DBFlashcard extends Flashcard {}

export interface DBReflection extends Reflection {}

export interface DBSyllabusChapter {
  id?: number;
  subject: string;
  chapterName: string;
  progress: Partial<ChapterProgress>;
  lastUpdated: string;
}

export interface DBGamification {
  id: string; // 'current'
  state: GamificationState;
}

export interface DBSettings {
  id: string; // 'user_preferences'
  preferences: AiAssistantPreferences;
}

export class JeeDashboardDatabase extends Dexie {
  testReports!: Table<DBTestReport, string>;
  questionLogs!: Table<DBQuestionLog, number>;
  dailyTasks!: Table<DBDailyTask, string>;
  flashcards!: Table<DBFlashcard, string>;
  reflections!: Table<DBReflection, string>;
  syllabusChapters!: Table<DBSyllabusChapter, number>;
  gamification!: Table<DBGamification, string>;
  userSettings!: Table<DBSettings, string>;

  constructor() {
    super('JeeDashboardDB_v2');

    this.version(1).stores({
      testReports: 'id, testDate, testName, type, subType',
      questionLogs: '++id, testId, subject, status, topic, reasonForError',
      dailyTasks: 'id, completed, taskType, effort',
      flashcards: 'id, topic, nextReview, difficulty',
      reflections: 'id, timestamp',
      syllabusChapters: '++id, [subject+chapterName], subject, chapterName',
      gamification: 'id',
      userSettings: 'id'
    });

    this.version(2).stores({
      testReports: 'id, testDate, testName, type, subType',
      questionLogs: '++id, testId, subject, status, topic, reasonForError',
      dailyTasks: 'id, completed, taskType, effort',
      flashcards: 'id, topic, nextReview, difficulty',
      reflections: 'id, timestamp',
      syllabusChapters: '++id, [subject+chapterName], subject, chapterName',
      gamification: 'id',
      userSettings: 'id'
    });

    this.version(3).stores({
      testReports: 'id, testDate, testName, type, subType',
      questionLogs: '++id, testId, subject, status, topic, reasonForError, questionId, userState, isCarelessError, isTimeSink',
      dailyTasks: 'id, completed, taskType, effort',
      flashcards: 'id, topic, nextReview, difficulty',
      reflections: 'id, timestamp',
      syllabusChapters: '++id, [subject+chapterName], subject, chapterName',
      gamification: 'id',
      userSettings: 'id'
    });
  }
}

export const db = new JeeDashboardDatabase();
