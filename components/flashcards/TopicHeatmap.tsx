import React, { useMemo } from 'react';
import { QuestionLog, QuestionStatus } from '../../types';
import { inferTopic } from '../../services/flashcardEngine';
import { TOPIC_WEIGHTAGE } from '../../constants';
import { CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface TopicHeatmapProps {
  logs: QuestionLog[];
  onSelectTopicFilter: (topic: string) => void;
}

export const TopicHeatmap: React.FC<TopicHeatmapProps> = ({ logs, onSelectTopicFilter }) => {
  // Aggregate error count by topic per subject
  const heatmapData = useMemo(() => {
    const errorMap = new Map<string, number>();

    logs.forEach(l => {
      if (l.status === QuestionStatus.Wrong || l.status === QuestionStatus.PartiallyCorrect) {
        const topic = inferTopic(l);
        if (topic !== '__NEEDS_TAGGING__') {
          errorMap.set(topic, (errorMap.get(topic) || 0) + 1);
        }
      }
    });

    const subjects: ('physics' | 'chemistry' | 'maths')[] = ['physics', 'chemistry', 'maths'];

    const result = subjects.map(subject => {
      // Find all topics belonging to this subject from TOPIC_WEIGHTAGE or logs
      const subjectLogs = logs.filter(l => l.subject === subject);
      const logTopics = Array.from(new Set(subjectLogs.map(l => inferTopic(l)).filter(t => t !== '__NEEDS_TAGGING__')));

      const items = logTopics.map(topic => {
        const errorCount = errorMap.get(topic) || 0;
        let density: 'clean' | 'moderate' | 'critical' = 'clean';
        if (errorCount >= 3) density = 'critical';
        else if (errorCount >= 1) density = 'moderate';

        return {
          topic,
          errorCount,
          density
        };
      }).sort((a, b) => b.errorCount - a.errorCount);

      return {
        subject,
        items,
        totalErrors: items.reduce((s, i) => s + i.errorCount, 0)
      };
    });

    return result;
  }, [logs]);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" /> Topic Error Density Heatmap
          </h3>
          <p className="text-xs text-slate-400">Visual infection map across syllabus topics. Click any topic to blitz review.</p>
        </div>
      </div>

      <div className="space-y-6">
        {heatmapData.map(group => (
          <div key={group.subject} className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${group.subject === 'physics' ? 'bg-emerald-400' : group.subject === 'chemistry' ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
                {group.subject} ({group.totalErrors} errors)
              </span>
              {group.totalErrors === 0 && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Clean Sector
                </span>
              )}
            </div>

            {group.items.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No error logs logged for this subject yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.items.map(item => {
                  let pillStyle = 'bg-emerald-950/30 border-emerald-700/30 text-emerald-300 hover:bg-emerald-900/50';
                  if (item.density === 'critical') {
                    pillStyle = 'bg-red-950/60 border-red-500/50 text-red-300 hover:bg-red-900 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse';
                  } else if (item.density === 'moderate') {
                    pillStyle = 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50';
                  }

                  return (
                    <button
                      key={item.topic}
                      onClick={() => onSelectTopicFilter(item.topic)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 ${pillStyle}`}
                    >
                      <span>{item.topic}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-black/40 font-mono text-[10px]">
                        {item.errorCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
