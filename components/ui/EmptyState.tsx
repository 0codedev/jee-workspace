import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionNode?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionNode,
  className = ''
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md ${className}`}
    >
      <div className="p-4 mb-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 shadow-xl shadow-cyan-950/30">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-white mb-1 tracking-tight">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>}
      {actionNode ? actionNode : (actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-accent btn-sm shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      ))}
    </motion.div>
  );
};