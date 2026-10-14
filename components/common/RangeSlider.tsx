import React from 'react';

interface RangeSliderProps {
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    label?: string;
    sublabel?: string;
    accentColor?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'dynamic';
    className?: string;
    showInput?: boolean;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    value = 0,
    onChange,
    min,
    max,
    step = 1,
    unit = '',
    label,
    sublabel,
    accentColor = 'cyan',
    className = '',
    showInput = true
}) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    const getDynamicColor = (val: number) => {
        if (val < 40) return 'rose';
        if (val < 75) return 'amber';
        return 'emerald';
    };

    const effectiveColor = accentColor === 'dynamic' ? getDynamicColor(value) : accentColor;

    const colorMap = {
        cyan: {
            fill: 'from-cyan-600 via-cyan-500 to-blue-500',
            thumb: 'bg-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]',
            text: 'text-cyan-400',
            border: 'focus-within:border-cyan-500/80 focus-within:ring-cyan-500/30'
        },
        emerald: {
            fill: 'from-emerald-600 via-emerald-500 to-teal-500',
            thumb: 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.8)]',
            text: 'text-emerald-400',
            border: 'focus-within:border-emerald-500/80 focus-within:ring-emerald-500/30'
        },
        rose: {
            fill: 'from-rose-600 via-rose-500 to-pink-500',
            thumb: 'bg-rose-400 border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.8)]',
            text: 'text-rose-400',
            border: 'focus-within:border-rose-500/80 focus-within:ring-rose-500/30'
        },
        amber: {
            fill: 'from-amber-600 via-amber-500 to-orange-500',
            thumb: 'bg-amber-400 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
            text: 'text-amber-400',
            border: 'focus-within:border-amber-500/80 focus-within:ring-amber-500/30'
        },
        indigo: {
            fill: 'from-indigo-600 via-indigo-500 to-purple-500',
            thumb: 'bg-indigo-400 border-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.8)]',
            text: 'text-indigo-400',
            border: 'focus-within:border-indigo-500/80 focus-within:ring-indigo-500/30'
        }
    };

    const colors = colorMap[effectiveColor as keyof typeof colorMap] || colorMap.cyan;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? min : Number(e.target.value);
        if (!isNaN(val)) {
            const clamped = Math.min(max, Math.max(min, val));
            onChange(clamped);
        }
    };

    return (
        <div className={`space-y-1.5 w-full ${className}`}>
            {(label || sublabel) && (
                <div className="flex items-center justify-between">
                    <div>
                        {label && <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{label}</span>}
                        {sublabel && <span className="text-[10px] text-slate-500 ml-2">{sublabel}</span>}
                    </div>
                </div>
            )}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 flex items-center h-6">
                    {/* Background Track */}
                    <div className="absolute inset-x-0 h-2 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden shadow-inner">
                        {/* Filled Gradient Track */}
                        <div 
                            className={`h-full bg-gradient-to-r ${colors.fill} transition-all duration-75`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    {/* Native Range Input overlay */}
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {/* Custom Animated Glow Thumb */}
                    <div 
                        className={`absolute w-4 h-4 rounded-full border-2 transition-all duration-75 pointer-events-none ${colors.thumb}`}
                        style={{ left: `calc(${percentage}% - 8px)` }}
                    />
                </div>

                {showInput && (
                    <div className={`flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 shrink-0 ${colors.border} focus-within:ring-1 focus-within:ring-offset-0 transition-all`}>
                        <input
                            type="number"
                            min={min}
                            max={max}
                            step={step}
                            value={value}
                            onChange={handleInputChange}
                            className="w-12 bg-transparent text-right font-mono text-xs font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {unit && <span className={`text-xs font-mono font-semibold ${colors.text}`}>{unit}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RangeSlider;