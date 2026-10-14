
import React from 'react';

export const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (!active || !payload?.length) return null;

    return (
        <div className="p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-xs z-50 animate-fade-in">
            {label && <p className="font-semibold text-slate-300 mb-1.5 border-b border-slate-800 pb-1">{label}</p>}
            <div className="space-y-1">
                {payload.map((p: any, i: number) => {
                    if (p.name?.includes('Band')) return null; 
                    if (Array.isArray(p.value)) return null;
                    if (p.value === null || p.value === undefined) return null;
                    
                    const color = p.color || p.fill || 'var(--accent)';
                    const formattedValue = formatter ? formatter(p.value, p.name, p) : p.value;

                    return (
                        <div key={i} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                {p.name}:
                            </span>
                            <span className="text-white font-bold font-mono">{formattedValue}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomTooltip;