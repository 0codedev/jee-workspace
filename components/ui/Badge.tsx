import React from 'react';

export type BadgeVariant = 'physics' | 'chemistry' | 'maths' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  physics: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  chemistry: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  maths: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  neutral: 'bg-slate-700/50 text-slate-300 border-slate-600/50'
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'md'
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
