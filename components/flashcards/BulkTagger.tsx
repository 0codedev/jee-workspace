import React, { useState, useMemo } from 'react';
import { QuestionLog } from '../../types';
import { TOPIC_WEIGHTAGE } from '../../constants';
import { Button } from '../common/Button';
import { Tag, Check, X, Sparkles, Filter } from 'lucide-react';
import { inferTopic } from '../../services/flashcardEngine';

interface BulkTaggerProps {
  logs: QuestionLog[];
  isOpen: boolean;
  onClose: () => void;
  onSaveTags: (updatedTopicMap: Record<string, string>) => void;
}

export const BulkTagger: React.FC<BulkTaggerProps> = ({
  logs,
  isOpen,
  onClose,
  onSaveTags,
}) => {
  // Filter untagged errors
  const untaggedLogs = useMemo(() => {
    return logs.filter(l => inferTopic(l) === '__NEEDS_TAGGING__');
  }, [logs]);

  // Topic edits map: `${testId}-${questionNumber}` -> string
  const [topicMap, setTopicMap] = useState<Record<string, string>>({});

  const availableTopics = useMemo(() => Object.keys(TOPIC_WEIGHTAGE), []);

  if (!isOpen) return null;

  const handleTopicChange = (logKey: string, value: string) => {
    setTopicMap(prev => ({ ...prev, [logKey]: value }));
  };

  const handleApplyChapterToAll = (chapterName: string, targetTopic: string) => {
    if (!targetTopic) return;
    const newMap = { ...topicMap };
    untaggedLogs.forEach(l => {
      if (l.chapter === chapterName) {
        newMap[`${l.testId}-${l.questionNumber}`] = targetTopic;
      }
    });
    setTopicMap(newMap);
  };

  const handleSave = () => {
    onSaveTags(topicMap);
    onClose();
  };

  // Group untagged logs by chapter for shortcut suggestions
  const chapterGroups = useMemo(() => {
    const map = new Map<string, QuestionLog[]>();
    untaggedLogs.forEach(l => {
      const ch = l.chapter || 'Unspecified Chapter';
      if (!map.has(ch)) map.set(ch, []);
      map.get(ch)!.push(l);
    });
    return map;
  }, [untaggedLogs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Tag className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Offline Test Topic Tagger
              </h3>
              <p className="text-xs text-slate-400">
                {untaggedLogs.length} questions from paper tests need topic tags before generating Flashcard 2.0 cards.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Bar */}
        {chapterGroups.size > 0 && (
          <div className="px-6 py-3 bg-cyan-950/20 border-b border-cyan-500/20 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Batch Apply Shortcuts:
            </span>
            {Array.from(chapterGroups.entries()).map(([ch, items]) => (
              <div key={ch} className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                <span className="text-slate-300 font-medium">{ch} ({items.length} Qs)</span>
                <select 
                  onChange={(e) => handleApplyChapterToAll(ch, e.target.value)}
                  defaultValue=""
                  className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded px-1.5 py-0.5 outline-none"
                >
                  <option value="" disabled>Select topic to apply all...</option>
                  {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Content Table */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-3">
          {untaggedLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              All error logs have topics assigned! You can proceed directly.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider">
                    <th className="p-3">Q#</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Chapter</th>
                    <th className="p-3">Error Reason</th>
                    <th className="p-3">Target Topic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {untaggedLogs.map(log => {
                    const logKey = `${log.testId}-${log.questionNumber}`;
                    const currentTopic = topicMap[logKey] || '';

                    return (
                      <tr key={logKey} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-white">Q.{log.questionNumber}</td>
                        <td className="p-3 uppercase font-bold text-slate-400">{log.subject}</td>
                        <td className="p-3 text-slate-300">{log.chapter || 'N/A'}</td>
                        <td className="p-3 text-amber-400">{log.reasonForError || 'Incorrect'}</td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            list={`topic-list-${logKey}`}
                            value={currentTopic}
                            onChange={(e) => handleTopicChange(logKey, e.target.value)}
                            placeholder="Type or select topic..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                          />
                          <datalist id={`topic-list-${logKey}`}>
                            {availableTopics.map(t => <option key={t} value={t} />)}
                          </datalist>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <Button onClick={onClose} variant="secondary" size="sm" className="border-slate-700 text-slate-400">
            Skip for Now
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2">
            <Check className="w-4 h-4" /> Save Topic Tags & Proceed
          </Button>
        </div>
      </div>
    </div>
  );
};
