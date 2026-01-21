import React, { useEffect, useState } from 'react';
import { Search, LayoutDashboard, Calendar, FileText, Target, BookOpen, Sparkles, Brain, Award, Settings, Layers, X } from 'lucide-react';
import type { View } from '../../types';

interface CommandPaletteProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  view: View;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard Overview', category: 'Navigation', icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />, view: 'dashboard' },
    { id: 'daily-planner', label: 'Daily Planner & Task Engine', category: 'Navigation', icon: <Calendar className="w-4 h-4 text-indigo-400" />, view: 'daily-planner' },
    { id: 'detailed-reports', label: 'Detailed Test Reports', category: 'Navigation', icon: <FileText className="w-4 h-4 text-emerald-400" />, view: 'detailed-reports' },
    { id: 'deep-analysis', label: 'Deep Performance Analytics', category: 'Navigation', icon: <Target className="w-4 h-4 text-amber-400" />, view: 'deep-analysis' },
    { id: 'root-cause', label: '5-Whys Root Cause Analysis', category: 'Navigation', icon: <Brain className="w-4 h-4 text-rose-400" />, view: 'root-cause' },
    { id: 'syllabus', label: 'Syllabus Coverage Tracker', category: 'Navigation', icon: <BookOpen className="w-4 h-4 text-purple-400" />, view: 'syllabus' },
    { id: 'flashcards', label: 'Error Vaccinator & Flashcards', category: 'Navigation', icon: <Layers className="w-4 h-4 text-teal-400" />, view: 'flashcards' },
    { id: 'ai-assistant', label: 'Jarvis AI Tutor & Assistant', category: 'Navigation', icon: <Sparkles className="w-4 h-4 text-blue-400" />, view: 'ai-assistant' },
    { id: 'achievements', label: 'Achievements & Mastery XP', category: 'Navigation', icon: <Award className="w-4 h-4 text-yellow-400" />, view: 'achievements' },
    { id: 'settings', label: 'System Settings & Integrations', category: 'Navigation', icon: <Settings className="w-4 h-4 text-slate-400" />, view: 'settings' },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (view: View) => {
    onNavigate(view);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-start justify-center z-[150] pt-20 p-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or navigate... (e.g. Planner, Reports, AI)"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm font-medium"
            autoFocus
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No matching commands found</div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd.view)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all ${
                  idx === selectedIndex ? 'bg-cyan-950/50 text-cyan-200 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                    {cmd.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{cmd.label}</div>
                    <div className="text-xs text-slate-500">{cmd.category}</div>
                  </div>
                </div>
                <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">Jump</span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">K</kbd> anywhere</span>
          <span>JEE OS Pro v2.0</span>
        </div>
      </div>
    </div>
  );
};
