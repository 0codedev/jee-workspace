import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div 
      className={`animate-shimmer rounded-xl bg-slate-800/80 ${className}`} 
      style={style}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-4 w-full" />
  </div>
);

export const SkeletonRow: React.FC = () => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/40">
    <div className="flex items-center gap-3 w-full">
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <div className="space-y-2 w-full max-w-sm">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-6 w-20 rounded-full" />
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
    <Skeleton className="h-6 w-1/4" />
    <div className="h-48 flex items-end justify-between gap-2 pt-8">
      {[40, 65, 30, 85, 50, 75, 90].map((h, i) => (
        <Skeleton key={i} className={`w-full rounded-t-lg`} style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);
