
export enum TaskType {
  StudySession = "Study Session",
  ProblemPractice = "Problem Practice",
  Revision = "Revision",
  MockTest = "Mock Test",
  Break = "Break",
}

export enum TaskEffort {
    Low = "Low (Chore)",
    Medium = "Medium (Standard)",
    High = "High (Deep Work)"
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
  linkedTopic?: string;
  taskType: TaskType;
  effort?: TaskEffort;
  estimatedTime: number;
  accomplishment?: string;
  scheduledTime?: string;
  isGhost?: boolean;
  dependsOnTaskId?: string;
  sqs?: number; // Session Quality Score 1-5
  isParked?: boolean;
  parkedDate?: string;
  parkCount?: number;
  priorityScore?: number;
  eisenhowerQuadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  rolloverCount?: number;
  originalDate?: string;
  sourceModule?: 'manual' | 'weak_zone' | 'formula_vault' | 'error_vaccinator' | 'burnout_recovery' | 'smart_plan';
}

export interface StudyGoal {
  id: string;
  text: string;
  completed: boolean;
  linkedTopic?: string;
}

export interface LongTermGoal {
    id: string;
    text: string;
    completed: boolean;
}

export interface SubjectData {
  marks: number;
  rank: number;
  percentile?: number;
  correct: number;
  wrong: number;
  unanswered: number;
  partial: number;
  maxMarks?: number;
}

export interface CalculatedMetrics {
  accuracy: number;
  attemptRate: number;
  cwRatio: number;
  spaq: number;
  unattemptedPercent: number;
  negativeMarkImpact: number;
  scorePotentialRealized: number;
}

export interface SubjectDataWithMetrics extends SubjectData, CalculatedMetrics {}

export enum TestType {
  FullSyllabusMock = 'Full Syllabus Mock',
  ChapterTest = 'Chapter Test',
  PreviousYearPaper = 'Previous Year Paper',
  PartTest = 'Part Test',
  SubjectTest = 'Subject Test',
}

export enum TestSubType {
  JEEMains = 'JEE Mains',
  JEEAdvanced = 'JEE Advanced',
}

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface GlobalFilter {
  type: TestType | 'all' | string[];
  subType: TestSubType | 'all' | string[];
  subjects?: ('physics' | 'chemistry' | 'maths')[];
  startDate?: string;
  endDate?: string;
}



export type ErrorCode = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7';

export enum ErrorCodeEnum {
  E1 = "E1: Conceptual Gap",
  E2 = "E2: Formula Recall",
  E3 = "E3: Calculation Slip",
  E4 = "E4: Reading Error",
  E5 = "E5: Time Panic",
  E6 = "E6: Silly Skip",
  E7 = "E7: Overconfidence",
}

export interface TestReport {
  id: string;
  testDate: string;
  testName: string;
  testStartTime?: string; // e.g. "09:00", "14:30" for timing correlation
  type?: TestType;
  subType?: TestSubType;
  difficulty?: DifficultyLevel; 
  topperScore?: number; 
  tags?: string[];

  physics: SubjectData;
  chemistry: SubjectData;
  maths: SubjectData;
  total: SubjectData;

  physicsMetrics?: CalculatedMetrics;
  chemistryMetrics?: CalculatedMetrics;
  mathsMetrics?: CalculatedMetrics;
  totalMetrics?: CalculatedMetrics;

  localScorecardImage?: string; // Stored as base64/dataURL locally only
}

export enum QuestionType {
  // Generic
  SingleCorrect = "Single Correct",
  MultipleCorrect = "Multiple Correct",
  Integer = "Integer",
  MatrixMatch = "Matrix Match",
  
  // Specific Schemes (Restored for Dropdowns)
  SingleCorrect31 = "Single Correct (+3, -1)",
  SingleCorrect41 = "Single Correct (+4, -1)",
  SingleCorrect40 = "Single Correct (+4, 0)",
  MultipleCorrect42 = "Multiple Correct (+4, -2)",
  MultipleCorrect41 = "Multiple Correct (+4, -1)",
  Integer30 = "Integer (+3, 0)",
  Integer40 = "Integer (+4, 0)",
  Integer41 = "Integer (+4, -1)"
}

export enum QuestionStatus {
  FullyCorrect = "Fully Correct",
  PartiallyCorrect = "Partially Correct",
  Wrong = "Wrong",
  Unanswered = "Unanswered",
}

export enum ErrorReason {
  SillyMistake = "Silly Mistake",
  ConceptualGap = "Conceptual Gap",
  TimePressure = "Time Pressure",
  MisreadQuestion = "Misread Question",
  Guess = "Guess",
}

export interface QuestionLog {
  testId: string;
  subject: "physics" | "chemistry" | "maths";
  questionNumber: number;
  questionType: string; // Flexible string
  positiveMarks?: number; 
  negativeMarks?: number; 
  status: QuestionStatus;
  marksAwarded: number;
  chapter?: string;
  chapterGroup?: string;
  topic: string;
  reasonForError?: string; // Custom reasons
  errorCode?: ErrorCode | null; // E1 - E7 taxonomy
  answered?: string;
  finalKey?: string;
  timeSpent?: number;
  confidence?: number; // 0-100% for Dunning-Kruger Analysis
  timestamp?: number;
  
  // ExamGoal Telemetry & Rich Data
  questionId?: string;
  questionHtml?: string;
  explanationHtml?: string;
  optionsHtml?: Array<{ identifier: string; content: string }>;
  options?: Array<{ identifier: string; content: string }>;
  correctOptions?: string[];
  difficulty?: DifficultyLevel | string;
  tags?: string[];
  timeAllotted?: number;

  // Global Peer Benchmarks (from batch.json -> user_stats)
  globalAvgTime?: number;      // user_stats.timeSpent (ms)
  globalCorrectPct?: number;  // user_stats.correct (%)
  globalWrongPct?: number;    // user_stats.wrong (%)
  optionsDistribution?: Record<string, number>; // distractor selection map

  // Peer aliases for backward compatibility
  peerCorrectPercent?: number;
  peerWrongPercent?: number;
  peerTimeSpent?: number;

  // Granular User Telemetry (from attempt.json -> data.userState)
  userTimeSpent?: number;     // timeSpent (ms)
  userState?: 'seen' | 'attempted' | 'unattempted';
  isCorrect?: boolean;        // isRight
  selectedIndex?: number[];
  userInputValue?: string | null;
  position?: number;

  // Computed Telemetry Fields
  timeDelta?: number;         // userTimeSpent - globalAvgTime
  isCarelessError?: boolean;  // Wrong BUT globalCorrectPct >= 70%
  isTimeSink?: boolean;       // userTimeSpent > 1.8 * globalAvgTime
  isDistractorTrap?: boolean; // User selected most common wrong option

  // Reinforced Learning & Re-Attempt Tracking
  reattemptCount?: number;
  isMastered?: boolean;
  lastReattemptDate?: string;
  reattemptHistory?: Array<{ date: string; isCorrect: boolean; timeSpent: number; selectedAnswer: string }>;
}

// --- Advanced Analysis Types ---

export interface PanicEvent {
    testId: string;
    testName: string;
    startQuestion: number;
    endQuestion: number;
    length: number;
    lostMarks: number;
}

export interface PanicProfile {
    avgPanicStartMin: number;
    avgAccuracyDrop: number;
    typicalDuration: number;
    affectedSubjects: string[];
    riskSeverity: 'low' | 'moderate' | 'high';
}

export interface PanicAlert {
    message: string;
    severity: 'warning' | 'critical';
    triggerMinute: number;
}

export interface TestDebrief {
    timeSinkQuestions: number[];
    panicQuestions: number[];
    bestWindow: { startMin: number; endMin: number; accuracy: number };
    worstWindow: { startMin: number; endMin: number; accuracy: number };
    keyTip: string;
}

export interface GuessStats {
    totalGuesses: number;
    correctGuesses: number;
    efficiency: number; // Net Score / Potential Score
    netScoreImpact: number;
    
    // New Detailed Metrics
    intuitionScore: number; // % of guesses that were correct (ignoring marking scheme)
    safeGuesses: number; // Guesses on questions with 0 negative marks
    riskyGuesses: number; // Guesses on questions with negative marks
    riskyMisses: number; // Risky guesses that went wrong
}

export interface DependencyAlert {
    topic: string;
    rootCauseTopic: string;
    errorCount: number;
}

// --- Feature D: Competitors ---
export interface CompetitorData {
    name: string;
    type: 'benchmark' | 'bot' | 'cohort';
    score: number;
    accuracy: number;
    timeTaken: number; // minutes
}

// --- Feature E: Flashcards ---
export interface Flashcard {
    id: string;
    topic: string;
    front: string; // The Question/Context + Error
    back: string;  // The Solution/Rule of Thumb
    nextReview: string; // ISO Date
    interval: number; // Days
    easeFactor: number;
    reviews: number;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    cardType?: 'standard' | 'cloze' | 'occlusion';
    clozeText?: string;
    occlusionImage?: string;
    occlusionBoxes?: { x: number; y: number; w: number; h: number }[];
    // Active Reconstruction Features
    mutation?: {
        question: string;
        answer: string;
        options?: Record<string, string>;
    };
    userDiagnosis?: string;
    // Multimodal Features
    visual_aid?: {
        svg: string;
        description: string;
    };

    // --- Flashcard 2.0 Fields ---
    track?: 'A' | 'B';                    // A=rich (has HTML), B=inferred
    sourceLogId?: string;                 // `${testId}-${questionNumber}`
    groupId?: string;                     // For topic-grouped master cards
    isGroupMaster?: boolean;              // True for the "5 errors on X topic" card
    childCardIds?: string[];              // Sub-cards unlocked after master

    // Rich content (Track A)
    questionHtml?: string;
    explanationHtml?: string;
    optionsHtml?: Array<{ identifier: string; content: string }>;
    correctOptions?: string[];
    studentAnswer?: string;
    
    // Smart metadata
    errorCode?: ErrorCode;               // E1-E7
    subject?: 'physics' | 'chemistry' | 'maths';
    chapter?: string;
    peerCorrectPct?: number;
    isCarelessError?: boolean;
    isTimeSink?: boolean;
    
    // Prerequisite chain
    prerequisiteTopics?: string[];
    prerequisitesMet?: boolean;
    
    // Difficulty ladder
    ladderLevel?: 1 | 2 | 3 | 4;         // 1=recall, 2=apply, 3=analyze, 4=PYP
    consecutiveCorrect?: number;
    masteredAt?: string;
    
    // Syllabus & AI
    linkedSyllabusChapter?: string;
    keyFormula?: string;
    mnemonic?: string;
    aiEnhanced?: boolean;
    shareCode?: string;
}

export interface FlashcardPreferences {
    flashcardGroupingMode: 'separate' | 'grouped' | 'auto';
    defaultCardViewer: 'flip' | 'split';
}

export interface StudentMemory {
    weakTopics: string[];
    strongTopics: string[];
    errorPatterns: string[];
    behaviorNotes: string[];
    coachCommitments: string[];
    lastUpdated?: string;
}

export interface FlashcardSession {
    currentCardIndex: number;
    streak: number;
    masteredCards: number;
    deck: Flashcard[];
    startTime: number;

    // --- Flashcard 2.0 Session Intelligence ---
    sessionMode?: 'rescue' | 'review' | 'blitz' | 'prerequisite' | 'exam_sim' | 'weak_subject';
    sessionTopic?: string;
    sessionSubject?: 'physics' | 'chemistry' | 'maths';
    carelessSaves?: number;
    timeSinksRedeemed?: number;
    errorCodesEncountered?: ErrorCode[];
    prerequisiteBlockedCount?: number;
    againCount?: number;
    totalRated?: number;
}


// --- AI Assistant & Filter Types ---

export type AiFilter = Partial<Pick<QuestionLog, 'subject' | 'reasonForError' | 'status' | 'topic'>> & { testId?: string };

export type GenUIToolType = 'chart' | 'checklist' | 'syllabus_node' | 'none';

export interface GenUIComponentData {
    type: GenUIToolType;
    data: any; 
    id: string;
}

export type ChatMessageContent =
  | string
  | { type: 'testReport'; data: TestReport }
  | { type: 'testComparison'; data: { testA: TestReport; testB: TestReport } }
  | { type: 'genUI'; component: GenUIComponentData };

export interface ChatMessage {
  role: 'user' | 'model';
  content: ChatMessageContent;
  timestamp?: number;
  isThinking?: boolean; 
  thinkingContent?: string;
}

export interface RootCauseFilter {
    subject?: string | null;
    reason?: ErrorReason | null;
    topic?: string | null;
}

export interface ModelInfo {
    id: string;
    displayName: string;
    description: string;
    provider?: 'google' | 'groq' | 'openrouter';
}

// Granular Task Categories for Advanced Routing
export type LlmTaskCategory = 
  | 'chat_general'          // General Chat
  | 'analysis_deep'         // Full Performance Report
  | 'analysis_root_cause'   // 5-Whys Drill Down
  | 'analysis_briefing'     // Executive Briefing Summary
  | 'planning_routine'      // Daily Task / Study Plan Gen
  | 'planning_sorting'      // Smart Task Sorting
  | 'creative_writing'      // Quotes, Personas
  | 'stem_core'             // Math, Physics, Chemistry solving
  | 'flashcard_gen'         // Error Vaccinator Synthesis
  | 'technical_ops'         // Data Parsing
  | 'ocr_extraction';       // OCR Image Processing

export type PersonaLockMode = 'auto' | 'coach' | 'tutor' | 'feynman' | 'therapist' | 'strategist';

export interface StudentMemoryItem {
  id: string;
  category: 'academic_goal' | 'weak_spot' | 'learning_preference' | 'active_commitment';
  fact: string;
  createdAt: number;
  updatedAt: number;
}

export interface AiAssistantPreferences {
  model: string; // The primary model ID (default)
  responseLength: 'short' | 'medium' | 'long';
  tone: 'encouraging' | 'neutral' | 'direct';
  customInstructions?: string; 
  socraticMode?: boolean;
  
  // Persona lock preference ('auto' or specific locked persona)
  personaLock?: PersonaLockMode;

  // New: Advanced Multi-Provider Config
  groqApiKey?: string;
  openRouterApiKey?: string;
  googleDriveClientId?: string;
  
  // Per-task model overrides
  modelOverrides?: Partial<Record<LlmTaskCategory, string>>;
  
  // Test Layout Mode preference ('nta' | 'examgoal')
  testLayoutMode?: 'nta' | 'examgoal';
  
  // Voice Mode preference for oral flashcards
  voiceStudyMode?: boolean;
}

export interface NotificationPreferences {
  achievements: boolean;
  proactiveInsights: boolean;
  proactiveInsightSensitivity: 'high' | 'medium' | 'low';
  flashcardReminders: boolean;
  bioCheckReminders: boolean;
}

export interface AppearancePreferences {
  disableParticles: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  dyslexicFont: boolean;
  liteMode: boolean;
}

export enum TargetExam {
    JEEMains = "JEE Mains",
    JEEAdvanced = "JEE Advanced",
    BITSAT = "BITSAT",
    NEET = "NEET",
    Other = "Other"
}

export enum SyllabusStatus {
    NotStarted = "Not Started",
    InProgress = "In Progress",
    Completed = "Completed",
    Revising = "Revising"
}

export type PriorityQuadrant = 'Critical Focus' | 'Sharpen Sword' | 'Opportunity' | 'Stronghold';

export interface ChapterProgress {
    status: SyllabusStatus;
    strength: 'strength' | 'weakness' | null;
    subTopicStatus?: Record<string, boolean>;
    revisionCount: number;
    aiSuggestedStrength?: 'strength' | 'weakness' | 'dismissed' | null;
    lastRevised?: string; 
    nextRevisionDate?: string; 
    lectureCompleted?: boolean;
    notesCompleted?: boolean;
    completionDate?: string; 
    flashcard?: string; // Stores the AI-generated explanation for Quick Review
    notes?: string; // Chapter-specific study notes / reflections
    chapterImage?: string; // Legacy single Base64 image attachment
    chapterImages?: string[]; // Multiple Base64 image attachments for chapter notes
    practice?: {
        mains?: boolean;
        advanced?: boolean;
        module?: boolean;
        books?: boolean;
    };
}

export interface QuizQuestion {
  question: string;
  options: { [key: string]: string };
  answer: string; 
  explanation: string;
}

export interface ExamStrategy {
    timeAlloc: { physics: number; chemistry: number; maths: number };
    attemptTarget: { physics: number; chemistry: number; maths: number };
    confidence: { physics: number; chemistry: number; maths: number };
    examType: 'mains' | 'advanced';
    subjectOrder: ('physics' | 'chemistry' | 'maths')[];
}

export interface UserProfile {
  name: string;
  targetExams: TargetExam[];
  studyTimes: {
      morning: string;
      afternoon: string;
      evening: string;
  };
  syllabus: Record<string, Partial<ChapterProgress>>; 
  cohortSizes: {
      [TestSubType.JEEMains]: number;
      [TestSubType.JEEAdvanced]: number;
  };
  targetTimePerQuestion: { 
      physics: number;
      chemistry: number;
      maths: number;
  };
  targetExamDate?: string; 
  syllabusCompletionBufferDays?: number;
  examStrategy?: ExamStrategy;
  flashcardPreferences?: FlashcardPreferences;
  
  // Rank Predictor & College Engine Profiles
  userCategory?: 'GEN' | 'OBC-NCL' | 'EWS' | 'SC' | 'ST';
  userState?: string;
  userGender?: 'Gender-Neutral' | 'Female-Only';
  targetColleges?: string[];

  // Burnout & Wellbeing Log
  weeklyMoodLog?: Array<{ date: string; mood: 1 | 2 | 3 | 4 | 5; note?: string; timestamp?: number }>;

  // Formula & Concept Vault
  formulaWeakList?: string[];
  formulaNotes?: Record<string, FormulaNote>;
}


export type Theme = 'cyan' | 'indigo' | 'green' | 'red';

// --- Rank Predictor & JoSAA College Types ---

export type CollegeChance = 'safe' | 'border' | 'reach';

export interface CollegeMatch {
  id: string;
  institute: string;
  instituteFull?: string;
  academicProgram: string;
  branchCode?: 'CSE' | 'AI/DS' | 'ECE' | 'EEE' | 'MECH' | 'CIVIL' | 'CHEM' | 'OTHER' | string;
  quota: 'HS' | 'OS' | 'AI' | 'GO' | 'JK' | 'LA' | string;
  seatType: 'OPEN' | 'OBC-NCL' | 'GEN-EWS' | 'SC' | 'ST' | string;
  gender: 'Gender-Neutral' | 'Female-only (including Supernumerary)' | 'Female-Only' | string;
  openingRank: number;
  closingRank: number;
  probability: CollegeChance;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  location: string;
  type: 'IIT' | 'NIT' | 'IIIT' | 'GFTI';
  avgPackageLpa?: number;
  nirfRank?: number;
}

export interface RankPrediction {
  rawMarks: number;
  physicsMarks: number;
  chemistryMarks: number;
  mathsMarks: number;
  percentile: number;
  airMid: number;
  airLow: number;
  airHigh: number;
  categoryRankMid: number;
  predictedYear: number;
  shiftDifficulty: 'Easy' | 'Moderate' | 'Tough';
  qualifiesForAdvanced: boolean;
  targetCollegeMatches: number;
}

export interface PercentileTrendPoint {
  testId: string;
  testName: string;
  testDate: string;
  marks: number;
  percentile: number;
  predictedAIR: number;
}

// --- Burnout & Recovery Intelligence Types ---

export interface BurnoutInputs {
  studyHoursLast7: number;
  sqsTrend: number[]; // Session Quality Scores (1-5) over last 7-14 sessions
  accuracyDelta: number; // Current accuracy vs. 14-day rolling baseline
  taskCompletionRate: number; // 0 to 1
  peakHourAccuracy?: number;
}

export type BurnoutRiskLevel = 'optimal' | 'moderate' | 'high' | 'critical';

export interface BurnoutForecast {
  daysToRisk: number; // Estimated days until fatigue crisis
  riskLevel: BurnoutRiskLevel;
  clsScore: number; // 0-100 (100 = full battery, <40 = fatigue debt)
  recommendation: string;
  primaryStressDriver: string;
}

export interface RecoveryProtocol {
  id: string;
  type: 'light' | 'medium' | 'deep_recharge';
  title: string;
  description: string;
  recommendedDurationMinutes: number;
  suggestedTasks: Array<{ task: string; time: number; topic: string; effort: TaskEffort }>;
  mindsetShift: string;
}

export interface EnergyBucketData {
  avgAccuracy: number;
  avgTimeSpentSeconds: number;
  sampleSize: number;
  performanceGrade: 'Peak' | 'Good' | 'Fatigued' | 'Low Data';
}

export interface EnergyHeatmapData {
  morning: EnergyBucketData;   // 6 AM - 12 PM
  afternoon: EnergyBucketData; // 12 PM - 5 PM
  evening: EnergyBucketData;   // 5 PM - 10 PM
  night: EnergyBucketData;     // 10 PM - 3 AM
  peakSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
}

export interface CognitiveLoadReport {
  currentCls: number;
  forecast: BurnoutForecast;
  energyHeatmap: EnergyHeatmapData;
  recoveryProtocol?: RecoveryProtocol;
  clsHistory: Array<{ date: string; score: number; sleepDebtHours?: number; studyHours?: number }>;
  sleepDebtHours?: number;
  moodAccuracyCorrelation?: {
    peakAccuracy: number;
    exhaustedAccuracy: number;
    accuracyDelta: number;
    sampleCount: number;
  };
}

// --- Formula & Concept Vault Types ---

export type FormulaCategory = 'Standard' | 'Multi-Domain Bridge' | 'JEE Advanced Direct Result';

export interface Formula {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Maths';
  chapter: string;
  topic: string;
  name: string;
  latex: string;
  description?: string;
  derivationSteps?: string[];
  commonTraps?: string[];
  jeeFrequency: 'Very High' | 'High' | 'Medium' | 'Concept';
  mnemonics?: string;
  linkedErrorCodes?: string[];
  // --- Multi-Domain & JEE Advanced Provenance Fields ---
  category?: FormulaCategory;
  linkedChapters?: string[];
  jeeYearOrigin?: string;
  directApplicationContext?: string;
}

export interface FormulaNote {
  formulaId: string;
  userNote?: string;
  isWeak: boolean;
  recallSuccessCount?: number;
  lastReviewedAt?: number;
  masteredAt?: number;
  intervalDays?: number;
  nextReviewDate?: number;
  easeFactor?: number;
  streak?: number;
  lastRating?: 'again' | 'hard' | 'good' | 'easy';
}

// --- Gamification Types ---

export type AchievementId =
  | 'firstSteps'
  | 'taskMaster'
  | 'streakKeeper'
  | 'testVeteran'
  | 'accuracyAce'
  | 'rankRipper'
  | 'comebackKid'
  | 'sillyMistakeSlayer'
  | 'deepDiver';


export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  category: 'Performance' | 'Consistency' | 'Diligence';
  tiers?: { count: number; title: string }[];
  progress?: number;
  goal?: number;
  tier?: number;
  unlockedAt?: string;
}

export interface GamificationState {
  level: number;
  xp: number;
  unlockedAchievements: Record<AchievementId, { unlockedAt: string; tier?: number }>;
  completedTasks: number; 
  streakData: { count: number; date: string }; 
  events: Record<string, boolean>; 
}

export interface Toast {
  id: number;
  title: string;
  message: string;
  icon: string;
}

export interface Reflection {
  id: string;
  timestamp: number;
  content: string;
  tags: string[];
  aiSummary?: string;
  actionItems?: string[];
  relatedTopics?: string[];
  mood?: 'eureka' | 'frustrated' | 'neutral' | 'confident' | 'confused';
  image?: string; // Legacy Local Base64 DataURL (stripped before cloud backup)
  images?: string[]; // Multiple Local Base64 DataURLs
}

// --- Predictive Weak Zone & Retention Decay Types ---

export interface RetentionScore {
  chapter: string;
  subject: 'Physics' | 'Chemistry' | 'Maths';
  retentionPercentage: number; // 0-100%
  status: 'Fresh' | 'Fading' | 'Critical Decay' | 'Unstudied';
  daysSinceLastPractice: number;
  totalAttempts: number;
  accuracy: number;
  errorCount: number;
  daysUntilCritical: number;
  jeeWeightage: 'Very High' | 'High' | 'Medium' | 'Low';
  decayFactor: number; // calculated ebbinghaus coefficient
  halfLifeDays?: number; // Memory half-life (days until 50% retention)
  optimalReviewDays?: number; // Days until retention drops below 70%
  unit?: string; // Syllabus unit (e.g. Mechanics, Calculus, Organic)
  classLevel?: 'Class 11' | 'Class 12';
}

export interface WeakZoneRadarPoint {
  subject: string;
  chapter: string;
  retention: number;
  accuracy: number;
  importance: number;
}

// --- PYQ Intelligence Lab Types ---

export interface PYQYearAppearance {
  year: number;
  questionCount: number;
  avgDifficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface PYQChapterMetadata {
  id: string;
  chapter: string;
  subject: 'Physics' | 'Chemistry' | 'Maths';
  examType: 'JEE Mains' | 'JEE Advanced';
  totalQuestions: number;
  avgQuestionsPerPaper: number;
  consecutiveYearsCount: number; // e.g. 5 consecutive years
  yearAppearances: Record<number, number>; // e.g. { 2020: 3, 2021: 4, 2022: 4, 2023: 5, 2024: 6, 2025: 5 }
  dominantTopics: string[];
  trendingStatus: 'Surging' | 'Stable High' | 'Moderate' | 'Occasional';
  predictedNextShiftProb: number; // 0-100%
  syllabusStatus?: 'Active Core' | 'Pruned / Deleted by NTA' | 'Partially Modified';
  prunedTopics?: string[];
  estimatedStudyHours?: number;
  roiCategory?: 'Quick Win' | 'Heavy Grind' | 'Niche' | 'Low ROI';
  marksPerStudyHour?: number;
}

export interface CoverageQuadrantItem {
  chapter: string;
  subject: 'Physics' | 'Chemistry' | 'Maths';
  frequencyScore: number; // 0-100
  isCovered: boolean;
  quadrant: 'High Freq + Uncovered' | 'High Freq + Covered' | 'Low Freq + Uncovered' | 'Low Freq + Covered';
  avgMarksPerPaper: number;
  solvedCount?: number;
  targetCount?: number;
  coveragePercent?: number;
  syllabusStatus?: 'Active Core' | 'Pruned / Deleted by NTA' | 'Partially Modified';
}

export type EfficiencyQuadrant = 'goldmine' | 'time_eater' | 'guess_trap' | 'disaster';

export interface ChapterEfficiency {
  chapter: string;
  subject: 'Physics' | 'Chemistry' | 'Maths';
  marksPerMinute: number; // e.g. 1.8 MPM vs 0.2 MPM
  avgTimeSeconds: number; // Average seconds per question
  accuracy: number; // 0-100%
  totalAttempts: number;
  isTimeSink: boolean; // low MPM + high time
  strategicVerdict: 'Speed Pillar' | 'High Yield Solid' | 'Borderline Drain' | 'Strategic Skip / Leave It';
  quadrant?: EfficiencyQuadrant;
  tacticalAdvice?: string;
  isEmpirical?: boolean;
  difficultyTier?: string;
}

export interface ExamStrategyCard {
  examType: 'JEE Mains' | 'JEE Advanced';
  recommendedSubjectOrder: Array<'Physics' | 'Chemistry' | 'Maths'>;
  timeBudgetMinutes: {
    Physics: number;
    Chemistry: number;
    Maths: number;
    ReviewBuffer: number;
  };
  topSkipRules: string[];
  speedPillars: string[];
  timeSinkAlerts: string[];
  expectedYieldScore: number;
  passBreakdown?: {
    pass1: { minutes: number; focus: string; targetQuestions: number };
    pass2: { minutes: number; focus: string; targetQuestions: number };
    pass3: { minutes: number; focus: string; targetQuestions: number };
  };
}

export interface TimeLeakageReport {
  totalExamTimeMinutes: number;
  productiveTimeMinutes: number;
  leakedTimeMinutes: number; // Wasted on wrong/overspent questions
  topLeakingChapters: Array<{ chapter: string; timeLostMinutes: number; marksLost: number }>;
  timeEfficiencyScore: number; // 0-100%
}

// --- Social Cohort & Blind Peer Benchmarking Types ---

export interface CohortBenchmark {
  percentileRange: '99+ Percentile' | '95-99 Percentile' | '90-95 Percentile' | '80-90 Percentile';
  avgAccuracy: number; // e.g. 84%
  avgCarelessErrorPct: number; // e.g. 8%
  avgTimePerQuestionSec: number; // e.g. 88s
  avgPhysicsScore: number;
  avgChemistryScore: number;
  avgMathsScore: number;
  totalParticipants: number;
}

export interface CohortComparison {
  metric: string;
  userValue: number;
  cohortValue: number;
  percentileRank: number; // e.g. Top 8%
  verdict: 'Superior to Cohort' | 'On Par' | 'Needs Optimization';
  deltaExplanation: string;
}

export interface SharedDeckPayload {
  shareCode: string;
  title: string;
  description: string;
  authorAlias: string;
  subject: 'Physics' | 'Chemistry' | 'Maths' | 'Mixed';
  cardCount: number;
  createdAt: number;
  cards: Flashcard[];
}

// --- Exam Day Command Center Types ---

export interface AttemptStrategyCard {
  subjectOrder: ('Physics' | 'Chemistry' | 'Maths')[];
  timeBudget: {
    Chemistry: number;
    Physics: number;
    Maths: number;
    ReviewBuffer: number;
  };
  skipRules: string[];
  confidenceStarters: string[];
  topMistakesToAvoid: string[];
  passBreakdown?: {
    pass1: { minutes: number; label: string; focus: string; targetYield: string; skipRule: string };
    pass2: { minutes: number; label: string; focus: string; targetYield: string; skipRule: string };
    pass3: { minutes: number; label: string; focus: string; targetYield: string; skipRule: string };
  };
  sectionBStrategy?: string;
  negativeMarkControl?: string[];
}

export interface PreExamProtocol {
  breathingStepSeconds: { inhale: number; hold: number; exhale: number };
  affirmations: string[];
  morningChecklist: Array<{ item: string; mandatory: boolean; checked?: boolean }>;
  centerArrivalGuide: string[];
  categorizedChecklist?: {
    mandatoryDocs: Array<{ id: string; item: string; detail: string; mandatory: boolean }>;
    permittedItems: Array<{ id: string; item: string; detail: string; mandatory: boolean }>;
    prohibitedItems: Array<{ id: string; item: string; risk: string }>;
    dressCodeRules: Array<{ id: string; rule: string; rationale: string }>;
  };
  panicResetProtocol?: Array<{
    step: number;
    title: string;
    action: string;
    mentalScript: string;
  }>;
  shiftTimeline?: {
    morning: Array<{ time: string; event: string; isCritical?: boolean }>;
    afternoon: Array<{ time: string; event: string; isCritical?: boolean }>;
  };
}

export type View = 'daily-planner' | 'dashboard' | 'detailed-reports' | 'deep-analysis' | 'root-cause' | 'data-entry' | 'ai-assistant' | 'question-log-editor' | 'settings' | 'achievements' | 'syllabus' | 'competitors' | 'flashcards' | 'new-ai-features' | 'reflections' | 'launchpad' | 'rank-predictor' | 'burnout-dashboard' | 'formula-vault' | 'weak-zone-radar' | 'pyq-lab' | 'efficiency-optimizer' | 'exam-day-center';
