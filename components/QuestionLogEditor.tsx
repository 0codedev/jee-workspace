
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { QuestionLog, TestReport, AiFilter, ErrorCode } from '../types';
import { QuestionType, QuestionStatus, ErrorReason } from '../types';
import { exportLogsToCsv } from '../services/sheetParser';
import { getMarkingScheme, calculateMarks } from '../utils/metrics';
import { ReattemptModal } from './ReattemptModal';
import { db } from '../database';
import { RangeSlider } from './common/RangeSlider';
import { 
    ClipboardPaste, 
    Keyboard, 
    Zap, 
    Check, 
    CheckCircle2, 
    AlertTriangle, 
    X, 
    RotateCcw, 
    RotateCw, 
    Download, 
    Filter, 
    Tag, 
    Sparkles, 
    Search,
    ChevronDown,
    SlidersHorizontal,
    Table
} from 'lucide-react';

export const E_CODES = [
    { code: 'E1', label: 'E1: Concept Gap', reason: ErrorReason.ConceptualGap, color: 'bg-amber-950/80 text-amber-300 border-amber-600/50 hover:bg-amber-900' },
    { code: 'E2', label: 'E2: Formula Recall', reason: ErrorReason.ConceptualGap, color: 'bg-yellow-950/80 text-yellow-300 border-yellow-600/50 hover:bg-yellow-900' },
    { code: 'E3', label: 'E3: Calc Slip', reason: ErrorReason.SillyMistake, color: 'bg-rose-950/80 text-rose-300 border-rose-600/50 hover:bg-rose-900' },
    { code: 'E4', label: 'E4: Reading Trap', reason: ErrorReason.MisreadQuestion, color: 'bg-orange-950/80 text-orange-300 border-orange-600/50 hover:bg-orange-900' },
    { code: 'E5', label: 'E5: Time Panic', reason: ErrorReason.TimePressure, color: 'bg-indigo-950/80 text-indigo-300 border-indigo-600/50 hover:bg-indigo-900' },
    { code: 'E6', label: 'E6: Silly Skip', reason: ErrorReason.Guess, color: 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700' },
    { code: 'E7', label: 'E7: Trap Choice', reason: ErrorReason.MisreadQuestion, color: 'bg-purple-950/80 text-purple-300 border-purple-600/50 hover:bg-purple-900' },
];

export const parsePastedTable = (rawText: string, targetTestId: string): { validLogs: QuestionLog[]; errors: string[] } => {
    const lines = rawText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { validLogs: [], errors: ['No data provided.'] };

    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(',') ? ',' : /\s{2,}|\t/);
    
    // Check if first line is a header
    const firstTokens = firstLine.split(delimiter).map(t => t.trim().toLowerCase());
    const isHeader = firstTokens.some(t => /q(\.|\s)?no|question|subject|status|marks?|time|topic|chapter|error/.test(t));
    
    const dataLines = isHeader ? lines.slice(1) : lines;
    
    let qIdx = 0, subIdx = 1, statusIdx = 2, marksIdx = 3, timeIdx = 4, topicIdx = 5, errIdx = 6;
    if (isHeader) {
        firstTokens.forEach((col, idx) => {
            if (/q(\.|\s)?no|question|number|^no$/.test(col)) qIdx = idx;
            else if (/sub|subject/.test(col)) subIdx = idx;
            else if (/stat|status|result|outcome/.test(col)) statusIdx = idx;
            else if (/mark|score/.test(col)) marksIdx = idx;
            else if (/time|sec/.test(col)) timeIdx = idx;
            else if (/top|topic|chap|chapter/.test(col)) topicIdx = idx;
            else if (/error|reason|code|ecode/.test(col)) errIdx = idx;
        });
    }

    const validLogs: QuestionLog[] = [];
    const errors: string[] = [];

    dataLines.forEach((line, rowIdx) => {
        const tokens = line.split(delimiter).map(t => t.trim());
        if (tokens.length < 2) return;

        const qRaw = tokens[qIdx] || `${rowIdx + 1}`;
        const qNum = parseInt(qRaw.replace(/\D/g, ''), 10) || (rowIdx + 1);

        const subRaw = (tokens[subIdx] || '').toLowerCase();
        let subject: 'physics' | 'chemistry' | 'maths' = 'physics';
        if (/chem/.test(subRaw) || subRaw === 'c') subject = 'chemistry';
        else if (/math/.test(subRaw) || subRaw === 'm') subject = 'maths';
        else if (/phy/.test(subRaw) || subRaw === 'p') subject = 'physics';
        else {
            if (qNum <= 25) subject = 'physics';
            else if (qNum <= 50) subject = 'chemistry';
            else subject = 'maths';
        }

        const statusRaw = (tokens[statusIdx] || '').toLowerCase();
        let status = QuestionStatus.FullyCorrect;
        if (/wrong|incorrect|-1|^w$/.test(statusRaw)) status = QuestionStatus.Wrong;
        else if (/unans|unatt|blank|skip|0|^u$/.test(statusRaw)) status = QuestionStatus.Unanswered;
        else if (/part|partial/.test(statusRaw)) status = QuestionStatus.PartiallyCorrect;
        else if (/correct|right|1|\+4|^c$/.test(statusRaw)) status = QuestionStatus.FullyCorrect;

        let marksAwarded = 0;
        if (tokens[marksIdx] !== undefined && tokens[marksIdx] !== '') {
            marksAwarded = parseFloat(tokens[marksIdx]) || 0;
        } else {
            marksAwarded = status === QuestionStatus.FullyCorrect ? 4 : (status === QuestionStatus.Wrong ? -1 : 0);
        }

        const timeSpent = parseInt(tokens[timeIdx] || '60', 10) || 60;
        const topic = tokens[topicIdx] || 'General';
        const errRaw = (tokens[errIdx] || '').toUpperCase();
        let errorCode: ErrorCode | undefined = undefined;
        let reasonForError: ErrorReason | undefined = undefined;

        if (/E[1-7]/.test(errRaw)) {
            const match = errRaw.match(/E[1-7]/);
            if (match) {
                errorCode = match[0] as ErrorCode;
                const matchedMeta = E_CODES.find(e => e.code === errorCode);
                if (matchedMeta) reasonForError = matchedMeta.reason;
            }
        }

        validLogs.push({
            testId: targetTestId,
            subject,
            questionNumber: qNum,
            questionType: QuestionType.SingleCorrect,
            status,
            marksAwarded,
            positiveMarks: 4,
            negativeMarks: -1,
            timeSpent,
            topic,
            chapter: topic,
            errorCode,
            reasonForError
        });
    });

    return { validLogs, errors };
};

const QuickImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (logs: QuestionLog[], mode: 'merge' | 'append') => void;
    defaultTestId: string;
    reports: TestReport[];
}> = ({ isOpen, onClose, onImport, defaultTestId, reports }) => {
    const [rawText, setRawText] = useState('');
    const [targetTestId, setTargetTestId] = useState(defaultTestId !== 'all' ? defaultTestId : (reports[0]?.id || 'custom-test'));
    const [importMode, setImportMode] = useState<'merge' | 'append'>('merge');

    useEffect(() => {
        if (defaultTestId !== 'all') setTargetTestId(defaultTestId);
        else if (reports.length > 0) setTargetTestId(reports[0].id);
    }, [defaultTestId, reports]);

    const { validLogs, errors } = useMemo(() => {
        if (!rawText.trim()) return { validLogs: [], errors: [] };
        return parsePastedTable(rawText, targetTestId);
    }, [rawText, targetTestId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in" onClick={onClose}>
            <div 
                className="w-full max-w-2xl max-h-[90vh] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-scale-in relative z-10"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center text-lg">
                            📋
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-wide">Quick Paste Table (TSV / CSV)</h3>
                            <p className="text-xs text-slate-400">Copy table from Excel, Google Sheets, or coaching result and paste below</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-xs flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-300 font-semibold mb-1">Target Test:</label>
                            <select 
                                value={targetTestId} 
                                onChange={e => setTargetTestId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-500"
                            >
                                {reports.map(r => (
                                    <option key={r.id} value={r.id}>{r.testName}</option>
                                ))}
                                {reports.length === 0 && <option value="test-1">Mock Exam 1</option>}
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-300 font-semibold mb-1">Import Mode:</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setImportMode('merge')}
                                    className={`flex-1 py-2 rounded-xl font-semibold border transition-all ${
                                        importMode === 'merge'
                                            ? 'bg-cyan-600 border-cyan-500 text-white shadow-md'
                                            : 'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}
                                >
                                    Merge / Update
                                </button>
                                <button
                                    onClick={() => setImportMode('append')}
                                    className={`flex-1 py-2 rounded-xl font-semibold border transition-all ${
                                        importMode === 'append'
                                            ? 'bg-cyan-600 border-cyan-500 text-white shadow-md'
                                            : 'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}
                                >
                                    Append New
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-slate-300 font-semibold">Paste Raw Rows (Tab or Comma Separated):</label>
                            <span className="text-[11px] text-slate-400 font-mono">Columns: Q.No, Subject, Status, Marks, Time(s), Topic, E-Code</span>
                        </div>
                        <textarea
                            rows={6}
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            placeholder={`Example:\n1\tPhysics\tCorrect\t4\t80\tKinematics\n2\tPhysics\tWrong\t-1\t120\tDynamics\tE3\n3\tPhysics\tUnanswered\t0\t15\tWork Energy\tE6`}
                            className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed"
                        />
                    </div>

                    {validLogs.length > 0 && (
                        <div className="space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    Detected {validLogs.length} questions ready to import
                                </span>
                                {errors.length > 0 && (
                                    <span className="text-rose-400 font-medium text-[11px] flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {errors.length} warnings
                                    </span>
                                )}
                            </div>

                            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/60">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-800 text-slate-400 sticky top-0">
                                        <tr>
                                            <th className="p-2">Q#</th>
                                            <th className="p-2">Subject</th>
                                            <th className="p-2">Status</th>
                                            <th className="p-2">Marks</th>
                                            <th className="p-2">Time</th>
                                            <th className="p-2">Topic</th>
                                            <th className="p-2">E-Code</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {validLogs.slice(0, 10).map((l, i) => (
                                            <tr key={i} className="hover:bg-slate-800/40">
                                                <td className="p-2 font-mono font-bold text-white">Q{l.questionNumber}</td>
                                                <td className="p-2 capitalize">{l.subject}</td>
                                                <td className="p-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                        l.status === QuestionStatus.FullyCorrect ? 'bg-emerald-950 text-emerald-300' :
                                                        l.status === QuestionStatus.Wrong ? 'bg-rose-950 text-rose-300' :
                                                        'bg-slate-800 text-slate-400'
                                                    }`}>
                                                        {l.status}
                                                    </span>
                                                </td>
                                                <td className="p-2 font-mono">{l.marksAwarded > 0 ? `+${l.marksAwarded}` : l.marksAwarded}</td>
                                                <td className="p-2 font-mono">{l.timeSpent}s</td>
                                                <td className="p-2 truncate max-w-[120px]">{l.topic}</td>
                                                <td className="p-2 font-mono font-bold text-amber-300">{l.errorCode || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {validLogs.length > 10 && (
                                    <div className="p-2 text-center text-slate-500 text-[10px] bg-slate-900/60 border-t border-slate-800">
                                        + {validLogs.length - 10} more questions
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={validLogs.length === 0}
                        onClick={() => {
                            onImport(validLogs, importMode);
                            onClose();
                        }}
                        className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 transition-all"
                    >
                        <Zap className="w-4 h-4" />
                        <span>Commit {validLogs.length} Questions</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const KeyboardShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    const shortcuts = [
        { key: 'Ctrl + Z', desc: 'Undo last edit, status change, or bulk update' },
        { key: 'Ctrl + Y / Ctrl + Shift + Z', desc: 'Redo previously undone change' },
        { key: 'Shift + Click', desc: 'Select a continuous range of question rows' },
        { key: 'Ctrl + A (on checkbox)', desc: 'Select / deselect all questions on current page' },
        { key: 'E1 - E7', desc: 'Rapid error tagging in floating bulk toolbar' },
        { key: 'Escape', desc: 'Deselect all rows or dismiss open modal' },
        { key: '?', desc: 'Open / close this keyboard shortcuts cheatsheet' },
    ];

    return (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Keyboard className="w-4 h-4 text-cyan-400" />
                        <span>Keyboard Shortcuts</span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="space-y-2.5">
                    {shortcuts.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
                            <span className="text-slate-300">{s.desc}</span>
                            <kbd className="px-2 py-1 rounded-md bg-slate-950 border border-slate-700 font-mono text-[11px] font-bold text-cyan-300 shrink-0 ml-3">{s.key}</kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface QuestionLogEditorProps {
  logs: QuestionLog[];
  reports: TestReport[];
  setLogs: React.Dispatch<React.SetStateAction<QuestionLog[]>>;
  activeLogFilter: AiFilter | null;
  setActiveLogFilter: (filter: AiFilter | null) => void;
}

// --- Helper Components ---

const MarksBar: React.FC<{ marks: number; type: string; log: QuestionLog }> = ({ marks, type, log }) => {
    const scheme = getMarkingScheme(type, log);
    const maxPositive = scheme.correct;
    const maxNegative = Math.abs(scheme.wrong);

    let width = 0;
    let colorClass = 'bg-slate-600';
    let justification = 'justify-center';

    if (marks > 0) {
        width = (marks / maxPositive) * 100;
        colorClass = 'bg-correct';
        justification = 'justify-start';
    } else if (marks < 0) {
        width = (Math.abs(marks) / maxNegative) * 100;
        colorClass = 'bg-wrong';
        justification = 'justify-end';
    }

    return (
        <div className={`w-full h-2 bg-slate-600 rounded-full flex overflow-hidden ${justification}`}>
            <div className={`${colorClass} h-full rounded-full`} style={{ width: `${width}%` }}></div>
        </div>
    );
};

const ConfidenceSlider: React.FC<{ value: number; onChange: (val: number) => void }> = ({ value, onChange }) => {
    return (
        <div className="w-full min-w-[120px]">
            <RangeSlider
                min={0}
                max={100}
                step={10}
                unit="%"
                value={value || 0}
                accentColor="dynamic"
                onChange={onChange}
                showInput={true}
            />
        </div>
    );
};

const EditableCell: React.FC<{
    value: string | number;
    onChange: (value: any) => void;
    type?: 'text' | 'number';
    className?: string;
    isInvalid?: boolean;
}> = ({ value, onChange, type = 'text', className, isInvalid }) => {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className={`w-full bg-transparent p-1 border ${isInvalid ? 'border-red-500/80' : 'border-transparent'} focus:border-cyan-500 focus:bg-slate-700 rounded-md focus:outline-none text-center ${className}`}
        />
    );
};

const SelectCell: React.FC<{
    value: string;
    onChange: (value: any) => void;
    options: readonly string[];
}> = ({ value, onChange, options }) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
            className="w-full bg-transparent p-1 border border-transparent focus:border-cyan-500 focus:bg-slate-700 rounded-md focus:outline-none text-center"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    );
};

// Replaces SelectCell for fields that allow custom entry (Type, Reason)
const DataListInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    className?: string;
}> = ({ value, onChange, options, placeholder, className }) => {
    const listId = useMemo(() => `list-${Math.random().toString(36).substr(2, 9)}`, []);
    
    return (
        <>
            <input
                list={listId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-transparent p-1 border border-transparent focus:border-cyan-500 focus:bg-slate-700 rounded-md focus:outline-none text-center ${className}`}
            />
            <datalist id={listId}>
                {options.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
        </>
    );
};

type SortKey = keyof QuestionLog | 'testName' | 'date';
type SortDirection = 'ascending' | 'descending';

// --- Advanced Header Component ---

interface AdvancedHeaderProps {
    title: string;
    field: SortKey;
    currentSort: { key: SortKey; direction: SortDirection } | null;
    onSort: (key: SortKey) => void;
    onFilter: (field: string, values: Set<string>) => void;
    uniqueValues: string[];
    activeFilters: Set<string>;
    width?: string;
}

const AdvancedHeader: React.FC<AdvancedHeaderProps> = ({ title, field, currentSort, onSort, onFilter, uniqueValues, activeFilters, width }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [tempSelected, setTempSelected] = useState<Set<string>>(new Set(activeFilters));
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTempSelected(new Set(activeFilters));
    }, [activeFilters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        if (isFilterOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFilterOpen]);

    const isSorted = currentSort?.key === field;
    const sortIcon = isSorted ? (currentSort?.direction === 'ascending' ? '▲' : '▼') : '';
    const hasActiveFilter = activeFilters.size > 0;

    const filteredValues = uniqueValues.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleApply = () => {
        onFilter(String(field), tempSelected);
        setIsFilterOpen(false);
    };

    const toggleValue = (val: string) => {
        const next = new Set(tempSelected);
        if (next.has(val)) next.delete(val);
        else next.add(val);
        setTempSelected(next);
    };

    const handleSelectAll = () => {
        if (tempSelected.size === uniqueValues.length) setTempSelected(new Set());
        else setTempSelected(new Set(uniqueValues));
    };

    return (
        <th className={`p-3 font-semibold text-gray-300 uppercase tracking-wider relative group select-none text-center ${width}`}>
            <div className="flex items-center justify-center gap-2">
                <span 
                    className={`cursor-pointer hover:text-white flex items-center gap-1 transition-colors ${isSorted ? 'text-cyan-400' : ''}`}
                    onClick={() => onSort(field)}
                >
                    {title}
                    {sortIcon && <span className="text-[10px]">{sortIcon}</span>}
                </span>
                <button 
                    className={`p-1 rounded hover:bg-slate-700 transition-all ${hasActiveFilter ? 'text-cyan-400 opacity-100' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {isFilterOpen && (
                <div ref={menuRef} className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 flex flex-col text-xs font-normal text-gray-300 animate-scale-in text-left">
                    <div className="p-2 border-b border-slate-700 space-y-2">
                        <input 
                            type="text" 
                            placeholder={`Search ${title}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 focus:ring-1 focus:ring-cyan-500 outline-none"
                            autoFocus
                        />
                        <button 
                            onClick={() => onSort(field)}
                            className="w-full text-left px-2 py-1 hover:bg-slate-700 rounded text-gray-400 hover:text-white flex items-center gap-2"
                        >
                            <span>↕</span> Toggle Sort
                        </button>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1.5 rounded transition-colors">
                            <input 
                                type="checkbox" 
                                checked={tempSelected.size === uniqueValues.length && uniqueValues.length > 0} 
                                onChange={handleSelectAll}
                                className="rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                            />
                            <span className="font-bold">(Select All)</span>
                        </label>
                        {filteredValues.map(val => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1.5 rounded transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={tempSelected.has(val)} 
                                    onChange={() => toggleValue(val)}
                                    className="rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                                />
                                <span className="truncate">{val || '(Empty)'}</span>
                            </label>
                        ))}
                        {filteredValues.length === 0 && <p className="text-gray-500 text-center py-2">No matches</p>}
                    </div>

                    <div className="p-2 border-t border-slate-700 flex justify-between gap-2 bg-slate-900/50 rounded-b-lg">
                        <button 
                            onClick={() => { setTempSelected(new Set()); onFilter(String(field), new Set()); setIsFilterOpen(false); }}
                            className="px-3 py-1.5 hover:text-white transition-colors text-gray-400"
                        >
                            Clear
                        </button>
                        <button 
                            onClick={handleApply}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium shadow-lg shadow-cyan-500/20"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </th>
    );
};

// --- Intelligent Quick Stats Sidebar (Floating Panel) ---
const QuickStatsSidebar: React.FC<{ selectedLogs: Set<string>; logs: QuestionLog[]; onClose: () => void }> = ({ selectedLogs, logs, onClose }) => {
    if (selectedLogs.size === 0) return null;

    const stats = useMemo(() => {
        const selected = logs.filter(l => selectedLogs.has(`${l.testId}-${l.questionNumber}`));
        const count = selected.length;
        const marks = selected.reduce((acc, l) => acc + l.marksAwarded, 0);
        
        const correct = selected.filter(l => l.status === QuestionStatus.FullyCorrect).length;
        const wrong = selected.filter(l => l.status === QuestionStatus.Wrong).length;
        const accuracy = (correct + wrong) > 0 ? (correct / (correct + wrong)) * 100 : 0;

        const reasons: Record<string, number> = {};
        selected.forEach(l => {
            if (l.reasonForError) reasons[l.reasonForError] = (reasons[l.reasonForError] || 0) + 1;
        });
        const topReasonEntry = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
        
        const subjects: Record<string, number> = { physics: 0, chemistry: 0, maths: 0 };
        selected.forEach(l => { if(subjects[l.subject] !== undefined) subjects[l.subject]++; });

        return { count, marks, accuracy, topReason: topReasonEntry, subjects };
    }, [selectedLogs, logs]);

    return (
        <div 
            className="fixed right-2 sm:right-6 top-20 sm:top-24 bottom-20 sm:bottom-24 w-[calc(100vw-1rem)] sm:w-80 max-w-[360px] bg-slate-800/95 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-2xl transform transition-all duration-300 ease-in-out z-40 overflow-hidden animate-scale-in"
        >
            {stats && (
                <div className="flex flex-col h-full relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-50 p-1 bg-slate-700/50 rounded-full hover:bg-slate-600"
                        title="Deselect All"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>

                    <div className="p-5 border-b border-slate-700 bg-slate-900/50">
                        <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-2">
                            <span className="text-lg">⚡</span> Selection Analysis
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-1">{stats.count} items selected</p>
                    </div>
                    
                    <div className="p-5 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700 text-center">
                                <p className="text-[10px] text-gray-400 uppercase">Net Score</p>
                                <p className={`text-2xl font-mono font-bold ${stats.marks >= 0 ? 'text-white' : 'text-red-400'}`}>
                                    {stats.marks > 0 ? '+' : ''}{stats.marks}
                                </p>
                            </div>
                            <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700 text-center">
                                <p className="text-[10px] text-gray-400 uppercase">Accuracy</p>
                                <p className="text-2xl font-mono font-bold text-white">{stats.accuracy.toFixed(0)}%</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-gray-400 font-bold uppercase text-center">Dominant Error</p>
                            <div className="bg-red-900/20 p-3 rounded-lg border border-red-900/30 flex items-center justify-between">
                                <span className="text-sm font-medium text-red-200 truncate">{stats.topReason ? stats.topReason[0] : 'None'}</span>
                                {stats.topReason && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded-full">{stats.topReason[1]}</span>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-gray-400 font-bold uppercase text-center">Subject Mix</p>
                            <div className="flex h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full" style={{width: `${(stats.subjects.physics / stats.count)*100}%`}}></div>
                                <div className="bg-yellow-500 h-full" style={{width: `${(stats.subjects.chemistry / stats.count)*100}%`}}></div>
                                <div className="bg-red-500 h-full" style={{width: `${(stats.subjects.maths / stats.count)*100}%`}}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 px-1">
                                <span className="text-green-400">P: {stats.subjects.physics}</span>
                                <span className="text-yellow-400">C: {stats.subjects.chemistry}</span>
                                <span className="text-red-400">M: {stats.subjects.maths}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main Component ---

export const QuestionLogEditor: React.FC<QuestionLogEditorProps> = ({ logs, reports, setLogs, activeLogFilter, setActiveLogFilter }) => {
    const [selectedTest, setSelectedTest] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'date', direction: 'descending' });
    const [smartFilter, setSmartFilter] = useState<string | null>(null);
    
    const DEFAULT_COLUMNS = [
        'date', 'testName', 'subject', 'questionNumber', 'questionType', 'difficulty',
        'status', 'marksAwarded', 'timeSpent', 'peerTimeSpent', 'confidence',
        'chapter', 'topic', 'reasonForError', 'answered', 'correctOptions', 'peerCorrectPercent'
    ];

    const HEADER_DEFS: Record<string, { title: string; key: SortKey; width?: string }> = {
        date: { title: 'Date', key: 'date' },
        testName: { title: 'Test Name', key: 'testName' },
        subject: { title: 'Subject', key: 'subject' },
        questionNumber: { title: 'Q. No.', key: 'questionNumber' },
        questionType: { title: 'Question Type', key: 'questionType' },
        difficulty: { title: 'Difficulty', key: 'difficulty' as SortKey },
        status: { title: 'Status', key: 'status' },
        marksAwarded: { title: 'Marks Awarded', key: 'marksAwarded' },
        timeSpent: { title: 'Time (s)', key: 'timeSpent' as SortKey, width: 'w-20' },
        peerTimeSpent: { title: 'Peer Time (s)', key: 'peerTimeSpent' as SortKey, width: 'w-20' },
        confidence: { title: 'Confidence', key: 'confidence' as SortKey, width: 'w-20' },
        chapter: { title: 'Chapter', key: 'chapter' as SortKey },
        topic: { title: 'Topic', key: 'topic' },
        reasonForError: { title: 'Reason for Error', key: 'reasonForError' },
        answered: { title: 'Answered', key: 'answered' as SortKey },
        correctOptions: { title: 'Correct', key: 'correctOptions' as SortKey },
        peerCorrectPercent: { title: 'Peer Correct %', key: 'peerCorrectPercent' as SortKey },
    };

    const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMNS);
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);

    const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
    const lastSelectedId = useRef<string | null>(null);

    // Bulk edit state
    const [bulkTopic, setBulkTopic] = useState('');
    const [bulkErrorReason, setBulkErrorReason] = useState('');
    const [bulkStatus, setBulkStatus] = useState<QuestionStatus | ''>('');
    const [bulkQuestionType, setBulkQuestionType] = useState('');
    const [bulkSubject, setBulkSubject] = useState<'physics' | 'chemistry' | 'maths' | ''>('');
    const [bulkTestId, setBulkTestId] = useState<string>('');
    const [bulkConfidence, setBulkConfidence] = useState<number>(0);

    const [history, setHistory] = useState<QuestionLog[][]>([]);
    const [future, setFuture] = useState<QuestionLog[][]>([]);

    const [reattemptingLog, setReattemptingLog] = useState<QuestionLog | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

    const pushToHistory = useCallback((currentLogs: QuestionLog[]) => {
        setHistory(prev => [...prev.slice(-9), currentLogs]); 
        setFuture([]);
    }, []);

    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        setFuture(prev => [logs, ...prev]);
        setLogs(previousState);
        setHistory(prev => prev.slice(0, -1));
    }, [history, logs, setLogs]);

    const handleRedo = useCallback(() => {
        if (future.length === 0) return;
        const nextState = future[0];
        setHistory(prev => [...prev, logs]);
        setLogs(nextState);
        setFuture(prev => prev.slice(1));
    }, [future, logs, setLogs]);

    const handleQuickTagErrorCode = useCallback((code: string) => {
        if (selectedLogs.size === 0) return;
        const eMeta = E_CODES.find(e => e.code === code);
        if (!eMeta) return;

        pushToHistory(logs);
        setLogs(prev => prev.map(log => {
            const logId = `${log.testId}-${log.questionNumber}`;
            if (selectedLogs.has(logId)) {
                return {
                    ...log,
                    errorCode: code as ErrorCode,
                    reasonForError: eMeta.reason
                };
            }
            return log;
        }));

        setToastMessage(`⚡ Tagged ${selectedLogs.size} questions as ${eMeta.label}`);
        setTimeout(() => setToastMessage(null), 3000);
    }, [selectedLogs, logs, pushToHistory, setLogs]);

    const handleImportLogs = useCallback((importedLogs: QuestionLog[], mode: 'merge' | 'append') => {
        pushToHistory(logs);
        if (mode === 'merge') {
            setLogs(prev => {
                const map = new Map<string, QuestionLog>();
                prev.forEach(l => map.set(`${l.testId}-${l.questionNumber}`, l));
                importedLogs.forEach(l => {
                    const key = `${l.testId}-${l.questionNumber}`;
                    const existing = map.get(key);
                    if (existing) {
                        map.set(key, { ...existing, ...l });
                    } else {
                        map.set(key, l);
                    }
                });
                return Array.from(map.values());
            });
            setToastMessage(`⚡ Successfully merged ${importedLogs.length} questions into logs!`);
        } else {
            setLogs(prev => [...prev, ...importedLogs]);
            setToastMessage(`⚡ Successfully appended ${importedLogs.length} new questions!`);
        }
        setTimeout(() => setToastMessage(null), 3000);
    }, [logs, pushToHistory, setLogs]);

    const filterCounts = useMemo(() => {
        let negCount = 0;
        let timeSinkCount = 0;
        let sillyCount = 0;
        let unansCount = 0;
        let lowConfCount = 0;
        let reattemptCount = 0;

        logs.forEach(l => {
            if (l.marksAwarded < 0) negCount++;
            if ((l.timeSpent || 0) > 180 || (l.userTimeSpent || 0) > 180000) timeSinkCount++;
            if (l.errorCode === 'E3' || l.errorCode === 'E4' || l.reasonForError === ErrorReason.SillyMistake || l.reasonForError === ErrorReason.MisreadQuestion) sillyCount++;
            if (l.status === QuestionStatus.Unanswered) unansCount++;
            if (l.confidence !== undefined && l.confidence > 0 && l.confidence < 50) lowConfCount++;
            if (l.isCarelessError || l.isDistractorTrap || l.status === QuestionStatus.Wrong) reattemptCount++;
        });

        return { negCount, timeSinkCount, sillyCount, unansCount, lowConfCount, reattemptCount };
    }, [logs]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (document.activeElement?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
            } else if (e.key === 'Escape') {
                if (selectedLogs.size > 0) {
                    setSelectedLogs(new Set());
                }
            } else if (e.key === '?') {
                setIsShortcutsModalOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, selectedLogs]);

    const handleLogUpdateFromReattempt = (updatedLog: QuestionLog) => {
        setLogs(prev => prev.map(l => (l.testId === updatedLog.testId && l.questionNumber === updatedLog.questionNumber ? updatedLog : l)));
    };

    const handleQuickFlashcard = async (log: QuestionLog) => {
        try {
            const flashcardId = `fc-${log.testId}-Q${log.questionNumber}-${Date.now()}`;
            
            let frontNotice = '';
            if (log.isDistractorTrap) {
                frontNotice = `<div class="p-2.5 my-2 bg-purple-950/60 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-center gap-2"><span>🪤</span><b>Distractor Trap Warning:</b> High percentage of peers fell for this trap choice. Identify the conceptual error before flipping!</div>`;
            } else if (log.isCarelessError) {
                frontNotice = `<div class="p-2.5 my-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center gap-2"><span>⚠️</span><b>Careless Leak Alert:</b> Peer accuracy is ${log.globalCorrectPct || 70}%. Watch out for calculation or units mistakes!</div>`;
            } else if (log.isTimeSink) {
                frontNotice = `<div class="p-2.5 my-2 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2"><span>⏳</span><b>Time Sink Warning:</b> Took ${Math.round((log.userTimeSpent || 0) / 1000)}s (Peer Avg: ${Math.round((log.globalAvgTime || 0) / 1000)}s). Practice faster execution!</div>`;
            }

            const questionText = log.questionHtml 
                ? `${frontNotice}<div>${log.questionHtml}</div>`
                : `${frontNotice}<p><b>Q${log.questionNumber} (${log.subject.toUpperCase()})</b> - ${log.topic || log.chapter || 'JEE Problem'}</p>`;

            const solutionText = log.explanationHtml
                ? `<div class="space-y-2"><p class="text-xs font-bold text-emerald-400 uppercase tracking-widest">Official Solution & Key (${log.finalKey || log.correctOptions?.join(', ') || 'N/A'})</p><div>${log.explanationHtml}</div></div>`
                : `<p>Official Answer Key: <b>${log.finalKey || log.correctOptions?.join(', ') || 'N/A'}</b></p>`;

            await db.flashcards.put({
                id: flashcardId,
                topic: log.topic || log.chapter || 'JEE Review',
                front: questionText,
                back: solutionText,
                nextReview: new Date(Date.now() + 3 * 86400000).toISOString(),
                interval: 3,
                easeFactor: 2.5,
                reviews: 0,
                difficulty: (log.difficulty as any) || 'Medium'
            });

            setToastMessage(`⚡ Q${log.questionNumber} saved to Flashcards!`);
            setTimeout(() => setToastMessage(null), 3000);
        } catch (e) {
            console.error("Failed to save flashcard:", e);
        }
    };

    // Dynamic Lists for Dropdowns
    const uniqueQuestionTypes = useMemo(() => {
        const types = new Set(Object.values(QuestionType)); // Standard values from Enum
        logs.forEach(l => { if (l.questionType) types.add(l.questionType as any); });
        return Array.from(types).sort();
    }, [logs]);

    const uniqueErrorReasons = useMemo(() => {
        const reasons = new Set(Object.values(ErrorReason)); // Standard values
        logs.forEach(l => { if (l.reasonForError) reasons.add(l.reasonForError as any); });
        return Array.from(reasons).sort();
    }, [logs]);

    const handleRecalculateMarks = () => {
        pushToHistory(logs);
        setLogs(prevLogs => prevLogs.map(log => {
            const updatedLog = { ...log };
            
            // Backfill marking scheme if explicit fields are missing
            if (updatedLog.positiveMarks === undefined || updatedLog.negativeMarks === undefined) {
                const scheme = getMarkingScheme(updatedLog.questionType, updatedLog);
                updatedLog.positiveMarks = scheme.correct;
                updatedLog.negativeMarks = scheme.wrong;
            }

            // Calculate marks using new/existing scheme
            const newMarks = calculateMarks(updatedLog.status, updatedLog.questionType, updatedLog);
            if (newMarks !== null) updatedLog.marksAwarded = newMarks;
            
            return updatedLog;
        }));
    };

    const handleExport = () => { exportLogsToCsv(logs, reports); };

    const reportInfoMap = useMemo(() => {
        const map = new Map<string, { name: string, date: string }>();
        reports.forEach(r => map.set(r.id, { name: r.testName, date: r.testDate }));
        return map;
    }, [reports]);

    const getTestInfo = useCallback((testId: string) => {
        return reportInfoMap.get(testId) || { name: 'Unknown Test', date: '' };
    }, [reportInfoMap]);

    const getUniqueValues = useCallback((key: SortKey) => {
        const set = new Set<string>();
        logs.forEach(log => {
            let val: any;
            if (key === 'testName' || key === 'date') {
                const info = getTestInfo(log.testId);
                val = key === 'testName' ? info.name : info.date;
            } else {
                val = log[key as keyof QuestionLog];
            }
            if (val !== undefined && val !== null) set.add(String(val));
        });
        return Array.from(set).sort();
    }, [logs, getTestInfo]);

    const handleColumnFilter = (field: string, values: Set<string>) => {
        setColumnFilters(prev => {
            const next = { ...prev };
            if (values.size === 0) delete next[field];
            else next[field] = values;
            return next;
        });
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedTest('all');
        setSmartFilter(null);
        setColumnFilters({});
        setActiveLogFilter(null);
        setCurrentPage(1);
    };

    const hasActiveFilters = useMemo(() => {
        return searchTerm !== '' || selectedTest !== 'all' || smartFilter !== null || Object.keys(columnFilters).length > 0 || activeLogFilter !== null;
    }, [searchTerm, selectedTest, smartFilter, columnFilters, activeLogFilter]);

    const filteredLogs = useMemo(() => {
        let logsToFilter = logs;
        if (activeLogFilter) {
            logsToFilter = logsToFilter.filter(log => {
                return Object.entries(activeLogFilter).every(([key, value]) => {
                    if (!value) return true;
                    return String(log[key as keyof QuestionLog]).toLowerCase() === String(value).toLowerCase();
                });
            });
        }
        if (smartFilter) {
            if (smartFilter === 'highImpact' || smartFilter === 'negative') logsToFilter = logsToFilter.filter(log => log.marksAwarded < 0);
            else if (smartFilter === 'careless' || smartFilter === 'silly') logsToFilter = logsToFilter.filter(log => log.errorCode === 'E3' || log.errorCode === 'E4' || log.reasonForError === ErrorReason.SillyMistake || log.reasonForError === ErrorReason.MisreadQuestion);
            else if (smartFilter === 'timeSink') logsToFilter = logsToFilter.filter(log => (log.timeSpent || 0) > 180 || (log.userTimeSpent || 0) > 180000 || log.isTimeSink);
            else if (smartFilter === 'unanswered') logsToFilter = logsToFilter.filter(log => log.status === QuestionStatus.Unanswered);
            else if (smartFilter === 'lowConfidence') logsToFilter = logsToFilter.filter(log => log.confidence !== undefined && log.confidence > 0 && log.confidence < 50);
            else if (smartFilter === 'reattemptQueue') logsToFilter = logsToFilter.filter(log => log.isCarelessError || log.isDistractorTrap || log.status === QuestionStatus.Wrong);
        }
        const lowercasedSearch = searchTerm.toLowerCase();
        logsToFilter = logsToFilter.filter(log => 
            (selectedTest === 'all' || log.testId === selectedTest) &&
            (searchTerm.trim() === '' ||
             log.questionNumber.toString().includes(lowercasedSearch) ||
             log.topic.toLowerCase().includes(lowercasedSearch))
        );
        if (Object.keys(columnFilters).length > 0) {
            logsToFilter = logsToFilter.filter(log => {
                return Object.entries(columnFilters).every(([key, selectedValues]) => {
                    const values = selectedValues as Set<string>;
                    if (values.size === 0) return true;
                    let val: any;
                    if (key === 'testName' || key === 'date') {
                        const info = getTestInfo(log.testId);
                        val = key === 'testName' ? info.name : info.date;
                    } else {
                        val = log[key as keyof QuestionLog];
                    }
                    return values.has(String(val ?? ''));
                });
            });
        }
        return logsToFilter;
    }, [logs, selectedTest, searchTerm, activeLogFilter, smartFilter, columnFilters, getTestInfo]);
    
    const sortedLogs = useMemo(() => {
        const dataToSort = [...filteredLogs];
        if (!sortConfig) return dataToSort;
        return dataToSort.sort((a, b) => {
            let aValue: any, bValue: any;
            if (sortConfig.key === 'testName' || sortConfig.key === 'date') {
                const infoA = getTestInfo(a.testId);
                const infoB = getTestInfo(b.testId);
                aValue = sortConfig.key === 'testName' ? infoA.name : infoA.date;
                bValue = sortConfig.key === 'testName' ? infoB.name : infoB.date;
            } else {
                aValue = a[sortConfig.key as keyof QuestionLog];
                bValue = b[sortConfig.key as keyof QuestionLog];
            }
            if (sortConfig.key === 'date') {
                const diff = sortConfig.direction === 'ascending' ? new Date(aValue).getTime() - new Date(bValue).getTime() : new Date(bValue).getTime() - new Date(aValue).getTime();
                if (diff === 0) return (a.questionNumber || 0) - (b.questionNumber || 0);
                return diff;
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                const diff = sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                if (diff === 0) return (a.questionNumber || 0) - (b.questionNumber || 0);
                return diff;
            }
            const strDiff = sortConfig.direction === 'ascending' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
            if (strDiff === 0) return (a.questionNumber || 0) - (b.questionNumber || 0);
            return strDiff;
        });
    }, [filteredLogs, sortConfig, getTestInfo]);
    
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedLogs, currentPage, itemsPerPage]);
    
    const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);

    const requestSort = (key: SortKey) => {
        setSortConfig(prev => {
            if (prev?.key === key && prev.direction === 'ascending') return { key, direction: 'descending' };
            if (prev?.key === key && prev.direction === 'descending') return null;
            return { key, direction: 'ascending' };
        });
    };

    const handleUpdate = (qNumber: number, testId: string, field: keyof QuestionLog, value: any) => {
        pushToHistory(logs);
        setLogs(prevLogs =>
            prevLogs.map(log => {
                if (log.questionNumber === qNumber && log.testId === testId) {
                    const updatedLog = { ...log, [field]: value };
                    if (field === 'status' || field === 'questionType' || field === 'positiveMarks' || field === 'negativeMarks') {
                        // If questionType string has markings like "Type (+4, -1)", 
                        // marksAwarded will recalculate automatically via calculateMarks utility
                        // AND/OR if positive/negativeMarks are set explicitly.
                        const newMarks = calculateMarks(updatedLog.status, updatedLog.questionType, updatedLog);
                        if (newMarks !== null) updatedLog.marksAwarded = newMarks;
                    }
                    return updatedLog;
                }
                return log;
            })
        );
    };

    const toggleSelectLog = (logId: string, event: React.MouseEvent<HTMLInputElement>) => {
        setSelectedLogs(prev => {
            const newSet = new Set(prev);
            if (event.shiftKey && lastSelectedId.current) {
                const allIds = paginatedLogs.map(l => `${l.testId}-${l.questionNumber}`);
                const startIdx = allIds.indexOf(lastSelectedId.current);
                const endIdx = allIds.indexOf(logId);
                if (startIdx !== -1 && endIdx !== -1) {
                    const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
                    const rangeIds = allIds.slice(min, max + 1);
                    const shouldSelect = !newSet.has(logId);
                    rangeIds.forEach(id => { if (shouldSelect) newSet.add(id); else newSet.delete(id); });
                }
            } else {
                if (newSet.has(logId)) newSet.delete(logId); else newSet.add(logId);
            }
            lastSelectedId.current = logId;
            return newSet;
        });
    };
    
    const toggleSelectAllOnPage = () => {
        const allPageIds = paginatedLogs.map(log => `${log.testId}-${log.questionNumber}`);
        const allSelected = allPageIds.every(id => selectedLogs.has(id));
        setSelectedLogs(prev => {
            const next = new Set(prev);
            allPageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
            return next;
        });
    };

    const handleBulkUpdate = () => {
        if (selectedLogs.size === 0) return;
        pushToHistory(logs);
        setLogs(prevLogs =>
            prevLogs.map(log => {
                if (selectedLogs.has(`${log.testId}-${log.questionNumber}`)) {
                    const updatedLog = { ...log };
                    if (bulkTopic.trim()) updatedLog.topic = bulkTopic.trim();
                    if (bulkErrorReason) updatedLog.reasonForError = bulkErrorReason;
                    if (bulkStatus) updatedLog.status = bulkStatus;
                    if (bulkSubject) updatedLog.subject = bulkSubject;
                    if (bulkTestId) updatedLog.testId = bulkTestId;
                    if (bulkConfidence > 0) updatedLog.confidence = bulkConfidence;
                    
                    if (bulkQuestionType) {
                        updatedLog.questionType = bulkQuestionType;
                        // Parse if type string contains marks e.g. "Custom (+10, -2)"
                        const scheme = getMarkingScheme(bulkQuestionType); 
                        // Note: getMarkingScheme extracts from string if defined there
                        // We can optionally force update explicit positive/negative fields if matched
                        // But getMarkingScheme only returns {correct, wrong}.
                        // We should check if the string matches pattern to update explicit fields
                        const match = bulkQuestionType.match(/\(\s*\+(\d+)\s*,\s*(-?\d+)\s*\)/);
                        if (match) {
                            updatedLog.positiveMarks = parseInt(match[1], 10);
                            updatedLog.negativeMarks = parseInt(match[2], 10);
                        }
                    }

                    // Recalculate marks if status or type changed
                    if (bulkStatus || bulkQuestionType) {
                        const newMarks = calculateMarks(updatedLog.status, updatedLog.questionType, updatedLog);
                        if (newMarks !== null) updatedLog.marksAwarded = newMarks;
                    }
                    return updatedLog;
                }
                return log;
            })
        );
        handleBulkCancel();
    };

    const handleBulkCancel = () => {
        setSelectedLogs(new Set());
        setBulkTopic(''); setBulkErrorReason(''); setBulkStatus(''); setBulkQuestionType(''); setBulkSubject(''); setBulkTestId(''); setBulkConfidence(0);
    };

    const isRowValid = (log: QuestionLog) => {
        if (log.status === QuestionStatus.Wrong && log.marksAwarded > 0) return false;
        if (log.status === QuestionStatus.Unanswered && log.marksAwarded !== 0) return false;
        return true;
    };

    const visibleColumns = columnOrder.filter(key => !hiddenColumns.has(key));

    return (
        <div className="glass-panel p-4 rounded-2xl relative w-full min-w-0 max-w-full">
            <datalist id="topic-suggestions">
                {useMemo(() => {
                    const topics = new Set<string>();
                    logs.forEach(l => { if (l.topic && l.topic !== 'N/A') topics.add(l.topic); });
                    return Array.from(topics).sort().map(t => <option key={t} value={t} />);
                }, [logs])}
            </datalist>
            <datalist id="chapter-suggestions">
                {useMemo(() => {
                    const chapters = new Set<string>();
                    logs.forEach(l => { if (l.chapter && l.chapter !== 'N/A') chapters.add(l.chapter); });
                    return Array.from(chapters).sort().map(c => <option key={c} value={c} />);
                }, [logs])}
            </datalist>

            <h2 className="text-2xl font-bold mb-4 text-cyan-300">Question Log Editor</h2>
            
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 border border-cyan-500 text-cyan-300 font-mono text-xs px-4 py-2.5 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2">
                    <span>{toastMessage}</span>
                </div>
            )}

            {activeLogFilter && (
                <div className="bg-indigo-900/50 p-3 rounded-lg mb-4 flex justify-between items-center">
                    <p className="text-indigo-200 text-sm">Filtered by AI Assistant.</p>
                    <button onClick={() => setActiveLogFilter(null)} className="bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-3 rounded text-sm">Clear Filter</button>
                </div>
            )}
            
            <div className="p-3 bg-slate-800/60 rounded-md mb-4 flex flex-wrap gap-4 items-center text-sm">
                 <span className="font-semibold text-gray-300">Smart Filters:</span>
                 <div className="flex flex-wrap gap-2">
                     <button onClick={() => setSmartFilter(null)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${!smartFilter ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>All ({logs.length})</button>
                     <button onClick={() => setSmartFilter('negative')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${smartFilter === 'negative' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' : 'bg-slate-700 hover:bg-slate-600 text-rose-300'}`}>Negative Marks ({filterCounts.negCount})</button>
                     <button onClick={() => setSmartFilter('silly')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${smartFilter === 'silly' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'bg-slate-700 hover:bg-slate-600 text-amber-300'}`}>Silly Mistakes ({filterCounts.sillyCount})</button>
                     <button onClick={() => setSmartFilter('timeSink')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${smartFilter === 'timeSink' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'bg-slate-700 hover:bg-slate-600 text-orange-300'}`}>Time Sinks ({filterCounts.timeSinkCount})</button>
                     <button onClick={() => setSmartFilter('unanswered')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${smartFilter === 'unanswered' ? 'bg-slate-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Unanswered ({filterCounts.unansCount})</button>
                     <button onClick={() => setSmartFilter('lowConfidence')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${smartFilter === 'lowConfidence' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-700 hover:bg-slate-600 text-blue-300'}`}>Low Confidence ({filterCounts.lowConfCount})</button>
                     <button onClick={() => setSmartFilter('reattemptQueue')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${smartFilter === 'reattemptQueue' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-slate-700 hover:bg-slate-600 text-purple-300'}`}>🎯 Re-Attempt Queue ({filterCounts.reattemptCount})</button>
                 </div>
            </div>

            <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
                <div className="flex flex-wrap gap-2 sm:gap-4 items-center w-full sm:w-auto">
                     <div className="w-full sm:w-auto">
                        <select value={selectedTest} onChange={e => setSelectedTest(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md p-2 focus:outline-none w-full sm:w-auto">
                            <option value="all">All Tests</option>
                            {[...new Set(logs.map(l => l.testId))].map(id => <option key={id} value={id}>{getTestInfo(id).name}</option>)}
                        </select>
                    </div>
                     <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md p-2 focus:outline-none w-full sm:w-64" />
                     <button 
                         onClick={() => {
                             const speech = new (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                             if (!speech) { alert('Speech Recognition API not supported in this browser.'); return; }
                             const recog = new speech();
                             recog.onresult = (e: any) => {
                                 const text = e.results[0][0].transcript;
                                 setSearchTerm(text);
                             };
                             recog.start();
                         }}
                         className="bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-500/50 px-3 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors"
                         title="Dictate Question Log search/command"
                     >
                         <span>🎙️ Voice Dictate</span>
                     </button>
                     {hasActiveFilters && (
                        <button onClick={clearAllFilters} className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded border border-red-800/50 transition-colors" title="Clear All Filters">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                     )}
                </div>
                <div className="flex flex-wrap gap-2 relative">
                    <button onClick={() => setIsColumnEditorOpen(!isColumnEditorOpen)} className="p-2 bg-slate-700 hover:bg-cyan-600 text-gray-400 hover:text-white rounded border border-slate-600 flex items-center gap-1" title="Edit Columns">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                        <span className="text-xs font-bold hidden sm:inline">Columns</span>
                    </button>
                    {isColumnEditorOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-200">Edit Columns</h3>
                                <button onClick={() => setIsColumnEditorOpen(false)} className="text-gray-400 hover:text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {columnOrder.map((key, index) => (
                                    <div key={key} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                checked={!hiddenColumns.has(key)} 
                                                onChange={() => {
                                                    const newHidden = new Set(hiddenColumns);
                                                    if (newHidden.has(key)) newHidden.delete(key);
                                                    else newHidden.add(key);
                                                    setHiddenColumns(newHidden);
                                                }}
                                                className="form-checkbox h-3 w-3 bg-slate-600 border-slate-500 text-cyan-500 rounded focus:ring-cyan-500 cursor-pointer"
                                            />
                                            <span className="text-xs text-gray-300">{HEADER_DEFS[key].title}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                disabled={index === 0}
                                                onClick={() => {
                                                    const newOrder = [...columnOrder];
                                                    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                                                    setColumnOrder(newOrder);
                                                }}
                                                className="text-gray-400 hover:text-white disabled:opacity-30"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                            </button>
                                            <button 
                                                disabled={index === columnOrder.length - 1}
                                                onClick={() => {
                                                    const newOrder = [...columnOrder];
                                                    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
                                                    setColumnOrder(newOrder);
                                                }}
                                                className="text-gray-400 hover:text-white disabled:opacity-30"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button onClick={handleRecalculateMarks} className="p-2 bg-slate-700 hover:bg-cyan-600 text-gray-400 hover:text-white rounded border border-slate-600 flex items-center gap-1" title="Recalculate Marks & Auto-fill Missing">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        <span className="text-xs font-bold hidden sm:inline">Recalculate</span>
                    </button>
                    <button onClick={handleUndo} disabled={history.length === 0} className="p-2 bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white rounded disabled:opacity-30" title="Undo">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button onClick={handleRedo} disabled={future.length === 0} className="p-2 bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white rounded disabled:opacity-30" title="Redo">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                    </button>
                    <button onClick={() => setIsPasteModalOpen(true)} className="p-2 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 rounded flex items-center gap-1.5 transition-colors text-xs font-bold" title="Paste TSV/CSV spreadsheet table">
                        <ClipboardPaste className="w-4 h-4 text-cyan-400" />
                        <span className="hidden sm:inline">Paste Table</span>
                    </button>
                    <button onClick={() => setIsShortcutsModalOpen(true)} className="p-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded border border-slate-600 flex items-center gap-1.5 transition-colors text-xs font-bold" title="View Keyboard Shortcuts (?)">
                        <Keyboard className="w-4 h-4 text-cyan-400" />
                        <span className="hidden sm:inline">Shortcuts</span>
                    </button>
                    <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex gap-2">Export CSV</button>
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-700 w-full min-w-0 max-w-full">
                <table className="min-w-full bg-slate-800 text-sm">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th className="p-3 w-10 text-center">
                                <input 
                                    type="checkbox" 
                                    onChange={toggleSelectAllOnPage} 
                                    checked={paginatedLogs.length > 0 && paginatedLogs.every(l => selectedLogs.has(`${l.testId}-${l.questionNumber}`))} 
                                    className="form-checkbox h-4 w-4 bg-slate-600 border-slate-500 text-cyan-500 rounded focus:ring-cyan-500"
                                />
                            </th>
                           {visibleColumns.map(key => {
                               const header = HEADER_DEFS[key];
                               return (
                               <AdvancedHeader
                                    key={header.key}
                                    title={header.title}
                                    field={header.key}
                                    currentSort={sortConfig}
                                    onSort={requestSort}
                                    onFilter={handleColumnFilter}
                                    uniqueValues={getUniqueValues(header.key)}
                                    activeFilters={columnFilters[header.key] || new Set()}
                                    width={header.width}
                               />
                               );
                           })}
                           <th className="p-3 font-semibold text-gray-300 text-center w-14" title="Positive Marks">+ve</th>
                           <th className="p-3 font-semibold text-gray-300 text-center w-14" title="Negative Marks">-ve</th>
                           <th className="p-3 font-semibold text-gray-300 text-center w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLogs.map((log, index) => {
                            const testInfo = getTestInfo(log.testId);
                            const logId = `${log.testId}-${log.questionNumber}`;
                            const isSelected = selectedLogs.has(logId);
                            const isValid = isRowValid(log);

                            const renderCell = (key: string) => {
                                switch (key) {
                                    case 'date': return <td key={key} className="p-2 whitespace-nowrap text-center">{testInfo.date ? new Date(testInfo.date).toLocaleDateString() : ''}</td>;
                                    case 'testName': return <td key={key} className="p-2 whitespace-nowrap text-center">{testInfo.name}</td>;
                                    case 'subject': return <td key={key} className="p-2 capitalize text-center">{log.subject}</td>;
                                    case 'questionNumber': return <td key={key} className="p-2 text-center">{log.questionNumber}</td>;
                                    case 'questionType': return (
                                        <td key={key} className="p-1 min-w-[180px]">
                                            <DataListInput value={log.questionType || ''} onChange={v => handleUpdate(log.questionNumber, log.testId, 'questionType', v)} options={uniqueQuestionTypes} />
                                        </td>
                                    );
                                    case 'difficulty': return (
                                        <td key={key} className="p-2 text-center text-xs">
                                            <span className={`px-2 py-1 rounded-full ${log.difficulty === 'Hard' ? 'bg-red-900/50 text-red-300' : log.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' : log.difficulty === 'Easy' ? 'bg-green-900/50 text-green-300' : 'bg-slate-700 text-gray-400'}`}>
                                                {log.difficulty || '-'}
                                            </span>
                                        </td>
                                    );
                                    case 'status': return (
                                        <td key={key} className="p-1 min-w-[150px]">
                                             <SelectCell value={log.status} onChange={v => handleUpdate(log.questionNumber, log.testId, 'status', v)} options={Object.values(QuestionStatus)} />
                                        </td>
                                    );
                                    case 'marksAwarded': return (
                                        <td key={key} className="p-1 w-40">
                                            <div className="flex items-center gap-2 justify-center">
                                                <div className="w-12 flex-shrink-0">
                                                    <EditableCell value={log.marksAwarded} onChange={v => handleUpdate(log.questionNumber, log.testId, 'marksAwarded', v)} type="number" isInvalid={!isValid} />
                                                </div>
                                                <div className="flex-grow max-w-[80px]"><MarksBar marks={log.marksAwarded} type={log.questionType} log={log} /></div>
                                            </div>
                                        </td>
                                    );
                                    case 'timeSpent': return (
                                        <td key={key} className="p-1 min-w-[80px]">
                                            <EditableCell value={log.timeSpent ?? ''} onChange={v => handleUpdate(log.questionNumber, log.testId, 'timeSpent', v)} type="number" />
                                        </td>
                                    );
                                    case 'peerTimeSpent': return <td key={key} className="p-2 text-center text-gray-400">{log.peerTimeSpent ?? '-'}</td>;
                                    case 'confidence': return (
                                        <td key={key} className="p-1 min-w-[80px]">
                                            <ConfidenceSlider value={log.confidence || 0} onChange={(val) => handleUpdate(log.questionNumber, log.testId, 'confidence', val)} />
                                        </td>
                                    );
                                    case 'chapter': return (
                                        <td key={key} className="p-1 min-w-[180px]">
                                            <input type="text" value={log.chapter || ''} onChange={e => handleUpdate(log.questionNumber, log.testId, 'chapter', e.target.value)} list="chapter-suggestions" className="w-full bg-transparent p-1 border border-transparent focus:border-cyan-500 focus:bg-slate-700 rounded-md focus:outline-none text-center" />
                                        </td>
                                    );
                                    case 'topic': return (
                                        <td key={key} className="p-1 min-w-[180px]">
                                            <input type="text" value={log.topic || ''} onChange={e => handleUpdate(log.questionNumber, log.testId, 'topic', e.target.value)} list="topic-suggestions" className="w-full bg-transparent p-1 border border-transparent focus:border-cyan-500 focus:bg-slate-700 rounded-md focus:outline-none text-center" />
                                        </td>
                                    );
                                    case 'reasonForError': return (
                                        <td key={key} className="p-1 min-w-[150px]">
                                            <DataListInput value={log.reasonForError || ''} onChange={v => handleUpdate(log.questionNumber, log.testId, 'reasonForError', v)} options={uniqueErrorReasons} />
                                        </td>
                                    );
                                    case 'answered': return <td key={key} className="p-2 text-center text-gray-300 font-mono text-xs">{log.answered || '-'}</td>;
                                    case 'correctOptions': return <td key={key} className="p-2 text-center text-green-400 font-mono text-xs">{log.correctOptions || '-'}</td>;
                                    case 'peerCorrectPercent': return <td key={key} className="p-2 text-center text-gray-400">{log.peerCorrectPercent !== undefined ? `${log.peerCorrectPercent}%` : '-'}</td>;
                                    default: return <td key={key}></td>;
                                }
                            };

                            return (
                                <tr key={`${log.testId}-${log.subject}-${log.questionNumber}-${index}`} className={`border-b border-slate-700 ${isSelected ? 'bg-cyan-900/20' : 'hover:bg-slate-700/50'}`}>
                                    <td className="p-2 text-center">
                                        <input type="checkbox" checked={isSelected} onClick={(e) => toggleSelectLog(logId, e)} className="form-checkbox h-4 w-4 bg-slate-600 border-slate-500 text-cyan-500 rounded focus:ring-cyan-500 cursor-pointer" readOnly />
                                    </td>
                                    {visibleColumns.map(key => renderCell(key))}
                                    <td className="p-1 w-14">
                                        <EditableCell 
                                            value={log.positiveMarks ?? ''} 
                                            onChange={v => handleUpdate(log.questionNumber, log.testId, 'positiveMarks', v)} 
                                            type="number"
                                            className="text-green-400 font-bold"
                                        />
                                    </td>
                                    <td className="p-1 w-14">
                                        <EditableCell 
                                            value={log.negativeMarks ?? ''} 
                                            onChange={v => handleUpdate(log.questionNumber, log.testId, 'negativeMarks', v)} 
                                            type="number" 
                                            className="text-red-400 font-bold"
                                        />
                                    </td>
                                    <td className="p-1 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => setReattemptingLog(log)}
                                                title="Interactive Re-Attempt"
                                                className="p-1 px-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 transition-colors flex items-center gap-1"
                                            >
                                                🎯 Re-Try
                                            </button>
                                            <button
                                                onClick={() => handleQuickFlashcard(log)}
                                                title="Convert to Flashcard"
                                                className="p-1 px-2 rounded bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-[10px] font-bold text-amber-300 transition-colors"
                                            >
                                                ⚡ Card
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-4 flex justify-between items-center text-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50">Previous</button>
                    <span className="text-gray-400">Page {currentPage} of {totalPages || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50">Next</button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">Rows per page:</span>
                    <input 
                        type="number" 
                        min="1"
                        max="500"
                        value={itemsPerPage} 
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            if (val > 0) {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }
                        }}
                        className="w-16 bg-slate-700 border border-slate-600 rounded p-1 text-center focus:outline-none focus:border-cyan-500 text-white"
                    />
                </div>
            </div>

            {/* Floating Bulk Edit Bar (Glassmorphism) */}
            <div className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out ${selectedLogs.size > 0 ? 'translate-y-0' : 'hidden'}`}>
                <div className="container mx-auto px-4 pb-4">
                    <div className="bg-slate-800/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-600/50 flex flex-wrap gap-4 items-center justify-between ring-1 ring-white/10">
                        <p className="font-semibold text-cyan-200 flex items-center gap-2"><span className="bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-700/50">{selectedLogs.size}</span> logs selected</p>
                        <div className="flex flex-wrap gap-2 items-center">
                             <input type="text" list="topic-suggestions" placeholder="Set Topic" value={bulkTopic} onChange={e => setBulkTopic(e.target.value)} className="bg-slate-700/50 border border-slate-600 rounded p-2 text-sm focus:ring-cyan-500 w-32 text-white placeholder-gray-400" />
                            
                            <DataListInput 
                                value={bulkErrorReason} 
                                onChange={setBulkErrorReason} 
                                options={uniqueErrorReasons} 
                                placeholder="Set Reason"
                                className="bg-slate-700/50 border-slate-600 w-32 text-left px-2"
                            />

                            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as QuestionStatus)} className="bg-slate-700/50 border border-slate-600 rounded p-2 text-sm w-28 text-white"><option value="">Set Status</option>{Object.values(QuestionStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                            
                            <div className="flex items-center gap-2 px-2 bg-slate-700/50 rounded border border-slate-600" title="Set Bulk Confidence">
                                <span className="text-xs text-gray-400">Conf:</span>
                                <input type="range" min="0" max="100" step="10" value={bulkConfidence} onChange={e => setBulkConfidence(parseInt(e.target.value))} className="w-16 h-1 bg-slate-500 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                <span className="text-xs w-6">{bulkConfidence}%</span>
                            </div>

                            <DataListInput 
                                value={bulkQuestionType} 
                                onChange={setBulkQuestionType} 
                                options={uniqueQuestionTypes} 
                                placeholder="Set Type (+4,-1)"
                                className="bg-slate-700/50 border-slate-600 w-40 text-left px-2"
                            />

                             <select value={bulkSubject} onChange={e => setBulkSubject(e.target.value as any)} className="bg-slate-700/50 border border-slate-600 rounded p-2 text-sm w-24 text-white"><option value="">Subject</option><option value="physics">Physics</option><option value="chemistry">Chemistry</option><option value="maths">Maths</option></select>
                            
                             <div className="h-8 w-px bg-slate-600 mx-2"></div>
                            
                            <button onClick={handleBulkCancel} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded text-sm border border-slate-600 transition-colors">Cancel</button>
                            <button onClick={handleBulkUpdate} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded text-sm shadow-lg shadow-cyan-500/20 border border-cyan-500 transition-all transform hover:scale-105">Apply All</button>
                        </div>

                        {/* Rapid E1-E7 Error Code Tagging Strip */}
                        <div className="w-full flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-700/80 mt-2 gap-2">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                Rapid Error Code:
                            </span>
                            <div className="flex flex-wrap gap-1.5 items-center">
                                {E_CODES.map(ec => (
                                    <button
                                        key={ec.code}
                                        type="button"
                                        onClick={() => handleQuickTagErrorCode(ec.code)}
                                        title={`${ec.label}: ${ec.reason}`}
                                        className="px-2 py-1 rounded bg-slate-700/90 hover:bg-cyan-600 hover:text-white text-slate-300 border border-slate-600/70 text-xs font-mono font-bold transition-all flex items-center gap-1"
                                    >
                                        <span className="text-cyan-400 font-extrabold">{ec.code}</span>
                                        <span className="hidden sm:inline font-sans font-normal text-[11px] text-slate-300">{ec.label.split(': ')[1] || ec.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Sidebar */}
            <QuickStatsSidebar selectedLogs={selectedLogs} logs={logs} onClose={() => setSelectedLogs(new Set())} />

            {/* Interactive Re-Attempt Engine Modal */}
            {reattemptingLog && (
                <ReattemptModal 
                    log={reattemptingLog} 
                    isOpen={!!reattemptingLog} 
                    onClose={() => setReattemptingLog(null)} 
                    onUpdateLog={handleLogUpdateFromReattempt} 
                    allLogs={logs}
                    onSelectLog={(selectedLog) => setReattemptingLog(selectedLog)}
                />
            )}

            {/* Quick Import Modal (Clipboard TSV / CSV) */}
            <QuickImportModal 
                isOpen={isPasteModalOpen}
                onClose={() => setIsPasteModalOpen(false)}
                onImport={handleImportLogs}
                defaultTestId={selectedTest !== 'all' ? selectedTest : (reports[0]?.id || '')}
                reports={reports}
            />

            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal 
                isOpen={isShortcutsModalOpen}
                onClose={() => setIsShortcutsModalOpen(false)}
            />
        </div>
    );
};