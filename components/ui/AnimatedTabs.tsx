import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-1 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-x-auto hide-scrollbar ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap z-10 ${
              isActive ? 'text-cyan-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute inset-0 bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border border-cyan-500/40 rounded-lg -z-10 shadow-lg shadow-cyan-950/50"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono ${
                isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
