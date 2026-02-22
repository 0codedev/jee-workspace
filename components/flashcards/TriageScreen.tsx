import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { QuestionLog, Flashcard, TestReport, QuestionStatus } from '../../types';
import { GroupingMode, groupErrorsByTopic, inferTopic } from '../../services/flashcardEngine';
import { Button } from '../common/Button';
import { ShieldAlert, Zap, Layers, AlertCircle, CheckCircle2, Sliders, X } from 'lucide-react';

interface TriageScreenProps {
  logs: QuestionLog[];
  existingCards: Flashcard[];
  groupingMode: GroupingMode;
  onProcessAll: (mode: GroupingMode) => void;
  onOpenBulkTagger: () => void;
}

export const TriageScreen: React.FC<TriageScreenProps> = ({
  logs,
  existingCards,
  groupingMode,
  onProcessAll,
  onOpenBulkTagger,
}) => {
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [selectedGroupingMode, setSelectedGroupingMode] = useState<GroupingMode>(groupingMode);

  // Filter new unprocessed errors
  const existingSourceIds = useMemo(() => new Set(existingCards.map(c => c.sourceLogId || c.id)), [existingCards]);

  const newErrors = useMemo(() => {
    return logs.filter(l => 
      (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect) &&
      !existingSourceIds.has(`${l.testId}-${l.questionNumber}`)
    );
  }, [logs, existingSourceIds]);

  // Breakdown statistics
  const stats = useMemo(() => {
    let physics = 0, chemistry = 0, maths = 0;
    let needsTagging = 0;
    let careless = 0;

    newErrors.forEach(err => {
      if (err.subject === 'physics') physics++;
      if (err.subject === 'chemistry') chemistry++;
      if (err.subject === 'maths') maths++;

      const topic = inferTopic(err);
      if (topic === '__NEEDS_TAGGING__') needsTagging++;
      if (err.isCarelessError) careless++;
    });

    const groups = groupErrorsByTopic(newErrors, selectedGroupingMode);
    const qualifyingGroups = groups.filter(g => g.shouldGroup);

    return {
      total: newErrors.length,
      physics,
      chemistry,
      maths,
      needsTagging,
      careless,
      groupsCount: qualifyingGroups.length,
      qualifyingGroups
    };
  }, [newErrors, selectedGroupingMode]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/20 via-slate-900/90 to-slate-900 shadow-2xl relative overflow-hidden animate-fade-in mb-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{stats.total} Unprocessed Error Logs Detected</span>
              </h3>
              <p className="text-xs text-slate-400">
                Found recent exam mistakes ready for isolation and Flashcard 2.0 vaccine synthesis.
              </p>
            </div>
          </div>

          {/* Stat Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
              P: <strong className="text-emerald-400">{stats.physics}</strong> | C: <strong className="text-amber-400">{stats.chemistry}</strong> | M: <strong className="text-rose-400">{stats.maths}</strong>
            </span>

            {stats.careless > 0 && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-950/40 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                <Zap className="w-3 h-3" /> {stats.careless} Careless Leaks
              </span>
            )}

            {stats.groupsCount > 0 && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                <Layers className="w-3 h-3" /> {stats.groupsCount} Topic Groups Found
              </span>
            )}

            {stats.needsTagging > 0 && (
              <button 
                onClick={onOpenBulkTagger}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-900/50 border border-red-500 text-red-300 hover:bg-red-800 transition-colors flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {stats.needsTagging} Offline Errors Need Tagging →
              </button>
            )}
          </div>

          {/* Grouping Insight Banner */}
          {stats.qualifyingGroups.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-slate-800/80 border border-cyan-500/30 text-xs text-slate-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Grouping Suggestion:</strong> Found {stats.qualifyingGroups.map(g => `"${g.topic}" (${g.logs.length}x)`).join(', ')}. Group into Master Cards?
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <Button 
            onClick={() => setShowConfigDrawer(true)} 
            variant="secondary" 
            size="sm" 
            className="border-slate-700 hover:border-slate-500 text-slate-300 flex items-center justify-center gap-2"
          >
            <Sliders className="w-4 h-4" /> Configure
          </Button>
          <Button 
            onClick={() => onProcessAll(selectedGroupingMode)} 
            size="sm" 
            className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30 border-0 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
          >
            ⚡ Process All ({stats.total})
          </Button>
        </div>
      </div>

      {/* Slide-over Configuration Drawer (Portaled to document.body) */}
      {showConfigDrawer && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" /> Triage Configuration
                </h4>
                <button onClick={() => setShowConfigDrawer(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Topic Grouping Mode
                  </label>
                  <div className="space-y-2">
                    {(['auto', 'grouped', 'separate'] as const).map(mode => (
                      <label 
                        key={mode} 
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedGroupingMode === mode ? 'bg-cyan-950/40 border-cyan-500 text-white' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}
                      >
                        <div>
                          <div className="text-sm font-semibold capitalize">{mode}</div>
                          <div className="text-[11px] text-slate-400">
                            {mode === 'auto' && 'Group errors when ≥3 mistakes on same topic'}
                            {mode === 'grouped' && 'Always group when ≥2 mistakes on same topic'}
                            {mode === 'separate' && 'Keep 1 individual card per error log'}
                          </div>
                        </div>
                        <input 
                          type="radio" 
                          name="groupingMode" 
                          checked={selectedGroupingMode === mode} 
                          onChange={() => setSelectedGroupingMode(mode)}
                          className="accent-cyan-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Target Error Batches ({stats.total})
                  </label>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Physics Errors:</span>
                      <span className="font-mono font-bold text-emerald-400">{stats.physics}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Chemistry Errors:</span>
                      <span className="font-mono font-bold text-amber-400">{stats.chemistry}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Maths Errors:</span>
                      <span className="font-mono font-bold text-rose-400">{stats.maths}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex gap-3">
              <Button 
                onClick={() => {
                  setShowConfigDrawer(false);
                  onProcessAll(selectedGroupingMode);
                }} 
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                Apply & Process All
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
