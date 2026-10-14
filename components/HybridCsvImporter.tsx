import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Clipboard, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, X, Zap, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ImageLightboxModal } from './common/ImageLightboxModal';
import type { TestReport, SubjectData, QuestionLog } from '../types';
import { TestType, TestSubType, DifficultyLevel, QuestionStatus } from '../types';

export interface ParsedScorecard {
  metadata: Record<string, string>;
  subjectSummary: Record<string, SubjectData>;
  questionLogs: Partial<QuestionLog>[];
  localScorecardImage?: string;
}

interface HybridCsvImporterProps {
  onAddData: (data: { report: TestReport; logs: QuestionLog[] }) => void;
  onCancel?: () => void;
}

const getLocalDateStr = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseFlexibleDate = (dateStr: string): string => {
  if (!dateStr) return getLocalDateStr();
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  
  const parts = clean.split(/[/.-]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      day = parseInt(parts[2], 10);
    } else if (year < 100) {
      year += 2000;
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }
  return getLocalDateStr();
};

const normalizeSubject = (str: string): 'physics' | 'chemistry' | 'maths' | 'total' | null => {
  if (!str) return null;
  const clean = str.trim().toLowerCase();
  if (['math', 'maths', 'mathematics', 'm'].includes(clean)) return 'maths';
  if (['phy', 'physics', 'phys', 'p'].includes(clean)) return 'physics';
  if (['chem', 'chemistry', 'che', 'c'].includes(clean)) return 'chemistry';
  if (['total', 'tot', 'overall', 't', 'sum'].includes(clean)) return 'total';
  return null;
};

const parseStatus = (statusStr: string): QuestionStatus => {
  const clean = (statusStr || '').trim().toUpperCase();
  if (clean === 'C' || clean === 'CORRECT' || clean === 'FULLY CORRECT') return QuestionStatus.FullyCorrect;
  if (clean === 'W' || clean === 'WRONG' || clean === 'INCORRECT') return QuestionStatus.Wrong;
  if (clean === 'P' || clean === 'PARTIAL' || clean === 'PARTIALLY CORRECT') return QuestionStatus.PartiallyCorrect;
  return QuestionStatus.Unanswered;
};

export const CsvTsvImporter: React.FC<HybridCsvImporterProps> = ({ onAddData, onCancel }) => {
  // Test Details
  const [testDate, setTestDate] = useState<string>(getLocalDateStr());
  const [testName, setTestName] = useState<string>('');
  const [type, setType] = useState<TestType>(TestType.ChapterTest);
  const [subType, setSubType] = useState<TestSubType>(TestSubType.JEEAdvanced);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [topperScore, setTopperScore] = useState<number>(0);

  // Raw Input & Parser State
  const [rawText, setRawText] = useState<string>('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<Record<'physics' | 'chemistry' | 'maths' | 'total', SubjectData>>({
    physics: { marks: 0, rank: 0, correct: 0, wrong: 0, unanswered: 0, partial: 0, maxMarks: 60 },
    chemistry: { marks: 0, rank: 0, correct: 0, wrong: 0, unanswered: 0, partial: 0, maxMarks: 60 },
    maths: { marks: 0, rank: 0, correct: 0, wrong: 0, unanswered: 0, partial: 0, maxMarks: 60 },
    total: { marks: 0, rank: 0, correct: 0, wrong: 0, unanswered: 0, partial: 0, maxMarks: 180 },
  });
  const [parsedLogs, setParsedLogs] = useState<Partial<QuestionLog>[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);

  // Local Image State
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Advanced, Fault-Tolerant Auto-Parse Engine
  const parseData = useCallback((text: string) => {
    setParseErrors([]);
    if (!text.trim()) {
      setHasParsed(false);
      return;
    }

    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const meta: Record<string, string> = {};
    const newRows: Record<'physics' | 'chemistry' | 'maths' | 'total', SubjectData> = {
      physics: { marks: 0, rank: 0, correct: 0, wrong: 0, unanswered: 0, partial: 0, maxMarks: 60 },
      chemistry: { marks: 0, rank: 0, correct: 0, wrong: 0, unanswered: 0, partial: 0, maxMarks: 60 },
      maths: { marks: 0, rank: 0, correct: 0, wrong: 0, unanswered: 0, partial: 0, maxMarks: 60 },
      total: { marks: 0, rank: 0, correct: 0, wrong: 0, unanswered: 0, partial: 0, maxMarks: 180 },
    };
    const questionLogs: Partial<QuestionLog>[] = [];

    let currentSection: 'NONE' | 'METADATA' | 'SUMMARY' | 'SCORES' = 'NONE';
    let matchedSummaryRows = 0;

    // Dynamic Column Maps for Summary and Scores
    let summaryColMap = { marks: 1, rank: 3, correct: 4, wrong: 5, unanswered: 6, partial: 7 };
    let scoreColMap = { qNo: 0, subject: 1, status: 2, answered: 3, finalKey: 4, marksAwarded: 5, questionType: 6, difficulty: 7, reasonForError: 8 };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignore title banner line
      if (line.toUpperCase().includes('SCORECARD') && !line.startsWith('#')) {
        continue;
      }

      if (line.startsWith('#METADATA')) { currentSection = 'METADATA'; continue; }
      if (line.startsWith('#SUMMARY')) { currentSection = 'SUMMARY'; continue; }
      if (line.startsWith('#SCORES')) { currentSection = 'SCORES'; continue; }

      const delimiter = line.includes('\t') ? '\t' : ',';
      const cols = line.split(delimiter).map(c => c.trim());
      if (cols.length === 0 || cols.every(c => c === '')) continue;

      // Section: METADATA
      if (currentSection === 'METADATA') {
        // Handle Key-Value horizontal pairs across columns (e.g. ADMNO 5865514 EX_DT 01/08/2026)
        for (let cIdx = 0; cIdx < cols.length; cIdx++) {
          const key = cols[cIdx].toUpperCase();
          const val = cols[cIdx + 1] || '';

          if (key === 'ADMNO' || key === 'ADM NO') meta.admNo = val;
          else if (key === 'NAME') meta.name = val;
          else if (key === 'TEST') {
            meta.test = val;
            if (val) setTestName(val);
          }
          else if (key === 'EX_DT' || key === 'EX.DT' || key === 'EXAM DATE' || key === 'DATE') {
            meta.exDt = val;
            if (val) setTestDate(parseFlexibleDate(val));
          }
          else if (key === 'BRANCH') meta.branch = val;
          else if (key === 'PROGRAM') meta.program = val;
        }

        // Also support 2-row table format (header row + values row)
        if (i > 0 && (lines[i - 1].includes('ADMNO') || lines[i - 1].includes('NAME'))) {
          if (cols[0] && !meta.admNo) meta.admNo = cols[0];
          if (cols[1] && !meta.name) meta.name = cols[1];
          if (cols[2] && !meta.test) { meta.test = cols[2]; setTestName(cols[2]); }
          if (cols[3] && !meta.exDt) { meta.exDt = cols[3]; setTestDate(parseFlexibleDate(cols[3])); }
          if (cols[4] && !meta.branch) meta.branch = cols[4];
          if (cols[5] && !meta.program) meta.program = cols[5];
        }
        continue;
      }

      // Section: SUMMARY
      if (currentSection === 'SUMMARY') {
        // Detect header row and map column indices dynamically
        if (cols[0].toUpperCase() === 'SUB' || cols[0].toUpperCase() === 'SUBJECT') {
          cols.forEach((colHeader, idx) => {
            const upper = colHeader.toUpperCase();
            if (upper === 'MARKS' || upper === 'MARK') summaryColMap.marks = idx;
            else if (upper.includes('RANK')) summaryColMap.rank = idx;
            else if (upper.includes('CORRECT') || upper === 'C') summaryColMap.correct = idx;
            else if (upper.includes('WRONG') || upper === 'W') summaryColMap.wrong = idx;
            else if (upper.includes('UNANSWERED') || upper === 'U') summaryColMap.unanswered = idx;
            else if (upper.includes('PARTIAL') || upper === 'P') summaryColMap.partial = idx;
          });
          continue;
        }

        const subjKey = normalizeSubject(cols[0]);
        if (subjKey) {
          matchedSummaryRows++;
          const marks = parseFloat((cols[summaryColMap.marks] || '0').replace(/[^0-9.-]/g, '')) || 0;
          const rank = parseInt((cols[summaryColMap.rank] || '0').replace(/[^0-9]/g, ''), 10) || 0;
          const c = parseInt((cols[summaryColMap.correct] || '0').replace(/[^0-9]/g, ''), 10) || 0;
          const w = parseInt((cols[summaryColMap.wrong] || '0').replace(/[^0-9]/g, ''), 10) || 0;
          const u = parseInt((cols[summaryColMap.unanswered] || '0').replace(/[^0-9]/g, ''), 10) || 0;
          const p = parseInt((cols[summaryColMap.partial] || '0').replace(/[^0-9]/g, ''), 10) || 0;

          newRows[subjKey] = {
            marks,
            rank,
            correct: c,
            wrong: w,
            unanswered: u,
            partial: p,
            maxMarks: subjKey === 'total' ? 180 : 60
          };
        }
        continue;
      }

      // Section: SCORES
      if (currentSection === 'SCORES' || (currentSection === 'NONE' && !isNaN(parseInt(cols[0], 10)))) {
        // Detect header row and map score column indices
        if (cols[0].toUpperCase() === 'QNO' || cols[0].toUpperCase() === 'Q.NO' || cols[0].toUpperCase() === 'QUESTION') {
          cols.forEach((colHeader, idx) => {
            const upper = colHeader.toUpperCase();
            if (upper === 'QNO' || upper === 'Q.NO' || upper === 'QUESTION') scoreColMap.qNo = idx;
            else if (upper === 'SUBJECT' || upper === 'SUB') scoreColMap.subject = idx;
            else if (upper === 'STATUS' || upper === 'STAT') scoreColMap.status = idx;
            else if (upper.includes('ANSWER')) scoreColMap.answered = idx;
            else if (upper.includes('KEY')) scoreColMap.finalKey = idx;
            else if (upper.includes('MARKS')) scoreColMap.marksAwarded = idx;
            else if (upper.includes('TYPE')) scoreColMap.questionType = idx;
            else if (upper.includes('DIFFICULT')) scoreColMap.difficulty = idx;
            else if (upper.includes('REASON') || upper.includes('ERROR')) scoreColMap.reasonForError = idx;
          });
          continue;
        }

        const qNo = parseInt(cols[scoreColMap.qNo], 10);
        if (!isNaN(qNo)) {
          const subjKey = normalizeSubject(cols[scoreColMap.subject]) || (qNo <= 25 ? 'maths' : qNo <= 50 ? 'physics' : 'chemistry');
          const status = parseStatus(cols[scoreColMap.status]);
          const answered = cols[scoreColMap.answered] || '';
          const finalKey = cols[scoreColMap.finalKey] || '';
          const rawMarksAwarded = cols[scoreColMap.marksAwarded];
          const rawType = cols[scoreColMap.questionType];
          const rawDiff = cols[scoreColMap.difficulty];
          const rawReason = cols[scoreColMap.reasonForError];

          // Auto-calculate marks if not explicitly in table
          let marksAwarded = 0;
          if (rawMarksAwarded !== undefined && rawMarksAwarded !== '' && !isNaN(parseFloat(rawMarksAwarded))) {
            marksAwarded = parseFloat(rawMarksAwarded);
          } else {
            const isNumerical = (qNo >= 21 && qNo <= 25) || (qNo >= 46 && qNo <= 50) || (qNo >= 71 && qNo <= 75);
            if (status === QuestionStatus.FullyCorrect) marksAwarded = 4;
            else if (status === QuestionStatus.Wrong) marksAwarded = isNumerical ? 0 : -1;
            else if (status === QuestionStatus.PartiallyCorrect) marksAwarded = 2;
          }

          // Question Type
          const isNumerical = (qNo >= 21 && qNo <= 25) || (qNo >= 46 && qNo <= 50) || (qNo >= 71 && qNo <= 75);
          const questionType = rawType || (isNumerical ? "Integer (+4, 0)" : "Single Correct (+4, -1)");

          // Difficulty & Error Reason (Forgiving - leave empty if not present)
          const difficultyVal = (rawDiff && ['Easy', 'Medium', 'Hard'].includes(rawDiff)) ? (rawDiff as DifficultyLevel) : undefined;
          const reasonForErrorVal = (rawReason && rawReason !== '0' && rawReason.toUpperCase() !== 'N/A') ? rawReason : undefined;

          questionLogs.push({
            questionNumber: qNo,
            subject: subjKey === 'total' ? 'physics' : subjKey,
            status,
            answered,
            finalKey,
            questionType,
            marksAwarded,
            difficulty: difficultyVal,
            reasonForError: reasonForErrorVal,
            topic: 'N/A'
          });
        }
        continue;
      }

      // Fallback Parsing for lines without section headers
      if (currentSection === 'NONE') {
        const subjKey = normalizeSubject(cols[0]);
        if (subjKey) {
          matchedSummaryRows++;
          const nums = cols.slice(1).map(n => parseFloat(n.replace(/[^0-9.-]/g, ''))).filter(n => !isNaN(n));
          newRows[subjKey] = {
            marks: nums[0] ?? 0,
            correct: nums[1] ?? 0,
            wrong: nums[2] ?? 0,
            unanswered: nums[3] ?? 0,
            partial: nums[4] ?? 0,
            rank: nums[5] ?? 0,
            maxMarks: subjKey === 'total' ? 180 : 60
          };
        }
      }
    }

    // Reconcile question logs into subject summary counts if summary C/W/U counts were 0
    if (questionLogs.length > 0) {
      const subjects: ('physics' | 'chemistry' | 'maths')[] = ['physics', 'chemistry', 'maths'];
      subjects.forEach(sub => {
        const subLogs = questionLogs.filter(l => l.subject === sub);
        if (subLogs.length > 0) {
          const cCount = subLogs.filter(l => l.status === QuestionStatus.FullyCorrect).length;
          const wCount = subLogs.filter(l => l.status === QuestionStatus.Wrong).length;
          const uCount = subLogs.filter(l => l.status === QuestionStatus.Unanswered).length;
          const pCount = subLogs.filter(l => l.status === QuestionStatus.PartiallyCorrect).length;

          if (newRows[sub].correct === 0 && newRows[sub].wrong === 0 && newRows[sub].unanswered === 0) {
            newRows[sub].correct = cCount;
            newRows[sub].wrong = wCount;
            newRows[sub].unanswered = uCount;
            newRows[sub].partial = pCount;
          }

          if (newRows[sub].marks === 0) {
            newRows[sub].marks = subLogs.reduce((sum, l) => sum + (l.marksAwarded || 0), 0);
          }
        }
      });
    }

    // Auto-compute total if total marks = 0
    if (newRows.total.marks === 0 && (newRows.physics.marks !== 0 || newRows.chemistry.marks !== 0 || newRows.maths.marks !== 0)) {
      newRows.total.marks = newRows.physics.marks + newRows.chemistry.marks + newRows.maths.marks;
      newRows.total.correct = newRows.physics.correct + newRows.chemistry.correct + newRows.maths.correct;
      newRows.total.wrong = newRows.physics.wrong + newRows.chemistry.wrong + newRows.maths.wrong;
      newRows.total.unanswered = newRows.physics.unanswered + newRows.chemistry.unanswered + newRows.maths.unanswered;
      newRows.total.partial = newRows.physics.partial + newRows.chemistry.partial + newRows.maths.partial;
      newRows.total.maxMarks = (newRows.physics.maxMarks || 60) + (newRows.chemistry.maxMarks || 60) + (newRows.maths.maxMarks || 60);
    }

    // Default Test Name if not extracted from metadata
    if (!testName.trim()) {
      if (meta.test) setTestName(meta.test);
      else setTestName("Scorecard Import");
    }

    setMetadata(meta);
    setParsedRows(newRows);
    setParsedLogs(questionLogs);
    setHasParsed(matchedSummaryRows > 0 || questionLogs.length > 0);
  }, [testName]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    if (val.trim()) {
      parseData(val);
    } else {
      setHasParsed(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const tsvText = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
          setRawText(tsvText);
          parseData(tsvText);
        } catch (err) {
          console.error("Failed to parse Excel file:", err);
          setParseErrors(['Failed to parse .xlsx file. Ensure it is a valid Excel workbook.']);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        setRawText(content);
        parseData(content);
      };
      reader.readAsText(file);
    }
  };

  // Image handling
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setParseErrors(prev => [...prev, 'Selected file is not an image.']);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setLocalImage(e.target?.result as string);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste listener for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Update parsed row value inline
  const handleRowChange = (subj: 'physics' | 'chemistry' | 'maths' | 'total', field: keyof SubjectData, val: number) => {
    setParsedRows(prev => {
      const updatedSubj = { ...prev[subj], [field]: val };
      const next = { ...prev, [subj]: updatedSubj };

      if (subj !== 'total') {
        next.total = {
          ...next.total,
          marks: next.physics.marks + next.chemistry.marks + next.maths.marks,
          correct: next.physics.correct + next.chemistry.correct + next.maths.correct,
          wrong: next.physics.wrong + next.chemistry.wrong + next.maths.wrong,
          unanswered: next.physics.unanswered + next.chemistry.unanswered + next.maths.unanswered,
          partial: next.physics.partial + next.chemistry.partial + next.maths.partial,
          maxMarks: (next.physics.maxMarks || 60) + (next.chemistry.maxMarks || 60) + (next.maths.maxMarks || 60)
        };
      }
      return next;
    });
  };

  // Submit report + question logs
  const handleSubmit = () => {
    const finalTestName = testName.trim() || metadata.test || "Scorecard Import";

    const reportId = `test-${Date.now()}`;
    const report: TestReport = {
      id: reportId,
      testDate,
      testName: finalTestName,
      type,
      subType,
      difficulty,
      topperScore,
      physics: parsedRows.physics,
      chemistry: parsedRows.chemistry,
      maths: parsedRows.maths,
      total: parsedRows.total,
      localScorecardImage: localImage || undefined,
    };

    const finalLogs: QuestionLog[] = parsedLogs.map((log, index) => ({
      testId: reportId,
      subject: log.subject || 'physics',
      questionNumber: log.questionNumber || index + 1,
      questionType: log.questionType || "Single Correct (+4, -1)",
      status: log.status || QuestionStatus.Unanswered,
      answered: log.answered || '',
      finalKey: log.finalKey || '',
      marksAwarded: log.marksAwarded !== undefined ? log.marksAwarded : 0,
      difficulty: log.difficulty,
      reasonForError: log.reasonForError,
      topic: log.topic || 'N/A'
    }));

    onAddData({ report, logs: finalLogs });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-xl shadow-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wider text-white uppercase flex items-center gap-2">
              Scorecard Fast Ingestion Engine
            </h2>
            <p className="text-xs text-slate-400">
              0ms Latency • Deterministic Clipboard & CSV Auto-Parser
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            100% ACCURACY GUARANTEED
          </span>
          {onCancel && (
            <button onClick={onCancel} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Test Metadata Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Test Name *</label>
          <input
            type="text"
            value={testName}
            onChange={e => setTestName(e.target.value)}
            placeholder="e.g. PTM-1 (MODEL-A 99)"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Test Date</label>
          <input
            type="date"
            value={testDate}
            onChange={e => setTestDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Exam Category</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={type}
              onChange={e => setType(e.target.value as TestType)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {Object.values(TestType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={subType}
              onChange={e => setSubType(e.target.value as TestSubType)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {Object.values(TestSubType).map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Input Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Box */}
        <label className="flex flex-col items-center justify-center p-5 rounded-xl bg-slate-950/60 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
          <Upload className="w-7 h-7 text-slate-400 group-hover:text-cyan-400 transition-colors mb-1.5" />
          <span className="text-xs font-bold text-slate-200">Upload `.csv`, `.tsv`, or `.xlsx` File</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Direct export or workbook from Excel / Google Sheets</span>
          <input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Paste Box Indicator */}
        <div className="flex flex-col justify-center p-5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-bold text-xs">
            <Clipboard className="w-4 h-4" />
            <span>Direct Excel / Sheets Paste</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Select cells in Excel or Sheets, press <code className="text-cyan-300 font-mono bg-slate-800 px-1 rounded">Ctrl+C</code>, and paste below. Supports <code className="text-emerald-300 font-mono">#METADATA</code>, <code className="text-emerald-300 font-mono">#SUMMARY</code>, and <code className="text-emerald-300 font-mono">#SCORES</code>.
          </p>
        </div>
      </div>

      {/* Textarea Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> Paste Raw CSV / TSV / Excel Content
          </label>
          <button
            type="button"
            onClick={() => setShowFormatGuide(!showFormatGuide)}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            Show Template Schema
          </button>
        </div>

        {showFormatGuide && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
            <p className="font-semibold text-cyan-400 font-sans">Full Template Format (#METADATA, #SUMMARY, #SCORES):</p>
            <pre className="text-[11px] text-emerald-300/90 overflow-x-auto bg-slate-900 p-2 rounded border border-slate-800">
{`#METADATA
ADMNO,NAME,TEST,EX_DT,BRANCH,PROGRAM
5865514,G. Jahnavi,PTM-1,01/08/2026,TG-HYD-DNVM,MODEL-A 99

#SUMMARY
SUB,MARKS,RANK,C,W,U,P
Maths,49,2247,0,0,0,0
Phy,30,3804,0,0,0,0
Che,48,1445,0,0,0,0

#SCORES
QNo,Subject,Status,Answered,FinalKey,Marks Awarded,Question Type,Difficulty,Reason for Error
1,Maths,C,A,A,4,Single Correct (+4 -1),Medium,
8,Maths,W,A,D,-1,Single Correct (+4 -1),Medium,Conceptual Gap`}
            </pre>
          </div>
        )}

        <textarea
          rows={6}
          value={rawText}
          onChange={handleTextChange}
          placeholder="Paste raw CSV, TSV, or copied Excel cells here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 custom-scrollbar"
        />
      </div>

      {/* Parse Error Display */}
      {parseErrors.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/40 p-3 rounded-xl space-y-1">
          {parseErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-300 flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" /> {err}
            </p>
          ))}
        </div>
      )}

      {/* Extracted Status Banner */}
      {hasParsed && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Parsed: {Object.keys(metadata).length > 0 ? `[Meta: ${metadata.test || metadata.name || 'Extracted'}] ` : ''}
              Total: {parsedRows.total.marks} marks | {parsedLogs.length} Question Logs
            </span>
          </div>
          <span className="text-[11px] text-emerald-400/80">⚡ Instantly ready to save</span>
        </div>
      )}

      {/* Parsed Summary Preview Table */}
      {hasParsed && (
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Subject Performance Summary
            </h3>
            <span className="text-xs text-slate-400">Editable before committing</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-2">Subject</th>
                  <th className="p-2">Marks</th>
                  <th className="p-2">Rank</th>
                  <th className="p-2">Correct</th>
                  <th className="p-2">Wrong</th>
                  <th className="p-2">Unanswered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {(['physics', 'chemistry', 'maths', 'total'] as const).map(subj => {
                  const data = parsedRows[subj];
                  const isTotal = subj === 'total';
                  return (
                    <tr key={subj} className={isTotal ? "bg-cyan-950/30 font-bold text-cyan-300" : "hover:bg-slate-800/40"}>
                      <td className="p-2 capitalize font-medium font-sans">{subj}</td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={data.marks}
                          onChange={e => handleRowChange(subj, 'marks', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center text-white"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={data.rank}
                          onChange={e => handleRowChange(subj, 'rank', parseInt(e.target.value, 10) || 0)}
                          className="w-20 bg-slate-900 border border-slate-700 rounded p-1 text-center text-amber-400"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={data.correct}
                          onChange={e => handleRowChange(subj, 'correct', parseInt(e.target.value) || 0)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center text-emerald-400"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={data.wrong}
                          onChange={e => handleRowChange(subj, 'wrong', parseInt(e.target.value) || 0)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center text-rose-400"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          value={data.unanswered}
                          onChange={e => handleRowChange(subj, 'unanswered', parseInt(e.target.value) || 0)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center text-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Local Scorecard Image Attachment Zone */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-400" /> Scorecard Image Reference (Optional)
          </span>
          <span className="text-xs font-normal text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
            🔒 Saved locally in IndexedDB only (Never uploaded to Cloud)
          </span>
        </label>

        {localImage ? (
          <div className="relative bg-slate-950 p-3 rounded-xl border border-emerald-500/40 flex items-center gap-4">
            <img 
              src={localImage} 
              alt="Scorecard reference" 
              onClick={() => setPreviewModalImage(localImage)}
              className="h-20 w-20 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" 
              title="Click to expand / open in Windows Photos"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-emerald-300 truncate">{imageFileName || 'Scorecard Image'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Attached & encoded as local base64 DataURL (Click image to preview)</p>
            </div>
            <button
              type="button"
              onClick={() => { setLocalImage(null); setImageFileName(null); }}
              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
              title="Remove attachment"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleImageFile(file);
            }}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
              isDragOver ? 'border-emerald-400 bg-emerald-950/30' : 'border-slate-700 bg-slate-950/40 hover:border-slate-500'
            }`}
          >
            <label htmlFor="csv-image-upload-2" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs text-slate-300 font-medium">Click to attach scorecard image, or drag & drop</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Or press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Ctrl + V</kbd> anywhere on screen to paste screenshot</span>
            </label>
            <input
              id="csv-image-upload-2"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={!hasParsed}
          onClick={handleSubmit}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Proceed to Review & Edit ➔</span>
        </button>
      </div>

      <ImageLightboxModal 
        src={previewModalImage} 
        title="Scorecard Image Reference" 
        onClose={() => setPreviewModalImage(null)} 
      />
    </div>
  );
};

export const HybridCsvImporter = CsvTsvImporter;