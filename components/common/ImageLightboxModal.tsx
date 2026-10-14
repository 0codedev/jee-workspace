import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, ExternalLink, Shield, RotateCcw, Plus, Minus } from 'lucide-react';

interface ImageLightboxModalProps {
    src: string | null;
    title?: string;
    onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ src, title = "Scorecard / Note Reference", onClose }) => {
    const [zoomPercent, setZoomPercent] = useState<number>(100);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset zoom when src changes
    useEffect(() => {
        setZoomPercent(100);
    }, [src]);

    // Handle Wheel (Ctrl + Wheel or Mouse Wheel scroll) for smooth zooming
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !src) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            // Scroll up = Zoom in (+5%), Scroll down = Zoom out (-5%)
            const step = e.ctrlKey ? 10 : 5;
            const delta = e.deltaY < 0 ? step : -step;
            setZoomPercent(prev => Math.min(500, Math.max(25, prev + delta)));
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [src]);

    // Keyboard navigation (+, -, 0, Esc)
    useEffect(() => {
        if (!src) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                setZoomPercent(prev => Math.min(500, prev + 5));
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                setZoomPercent(prev => Math.max(25, prev - 5));
            } else if (e.key === '0') {
                e.preventDefault();
                setZoomPercent(100);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [src, onClose]);

    if (!src) return null;

    const handleDownloadAndOpen = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const zoomIn = () => setZoomPercent(prev => Math.min(500, prev + 5));
    const zoomOut = () => setZoomPercent(prev => Math.max(25, prev - 5));
    const resetZoom = () => setZoomPercent(100);

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-5"
            >
                {/* Header Control Bar */}
                <div 
                    className="w-full max-w-6xl flex flex-wrap justify-between items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 px-5 shadow-2xl backdrop-blur-md z-10 gap-3"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📸</span>
                        <div>
                            <h3 className="text-sm font-bold text-white leading-none">{title}</h3>
                            <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 mt-1">
                                <Shield className="w-3 h-3 text-cyan-400" /> Saved 100% Locally in IndexedDB
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* Custom Granular Zoom Controls (+5% / -5%) */}
                        <div className="flex items-center bg-slate-950/80 border border-slate-700 rounded-xl p-1 shadow-inner">
                            <button
                                onClick={zoomOut}
                                disabled={zoomPercent <= 25}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                                title="Zoom Out (-5% or Wheel Down)"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>

                            <button
                                onClick={resetZoom}
                                className="px-2.5 py-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors min-w-[52px] text-center"
                                title="Click to Reset to 100%"
                            >
                                {zoomPercent}%
                            </button>

                            <button
                                onClick={zoomIn}
                                disabled={zoomPercent >= 500}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                                title="Zoom In (+5% or Wheel Up)"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Reset Zoom Button */}
                        {zoomPercent !== 100 && (
                            <button 
                                onClick={resetZoom}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                title="Reset scale to 100%"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="hidden sm:inline">Reset</span>
                            </button>
                        )}

                        {/* Open/Save Original File Button */}
                        <button 
                            onClick={handleDownloadAndOpen}
                            className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
                            title="Download & Open in Windows Photos"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Open in Windows Photos</span>
                            <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                        </button>

                        {/* Close Modal Button */}
                        <button 
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700 transition-colors ml-1"
                            title="Close Preview (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main High-Res Image Container with Wheel Zoom Support */}
                <div 
                    ref={containerRef}
                    className="flex-1 w-full max-w-7xl flex items-center justify-center overflow-auto p-2 sm:p-4 my-2 custom-scrollbar select-none cursor-grab active:cursor-grabbing"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="relative flex items-center justify-center min-h-[50vh]">
                        <img 
                            src={src} 
                            alt={title} 
                            style={{ 
                                transform: `scale(${zoomPercent / 100})`,
                                transition: 'transform 0.1s ease-out'
                            }}
                            className="rounded-2xl border border-slate-800 shadow-2xl bg-slate-950/80 max-h-[76vh] max-w-full object-contain origin-center"
                        />
                    </div>
                </div>

                {/* Bottom Instruction Bar */}
                <div 
                    className="bg-slate-900/80 border border-slate-800 rounded-full px-4 py-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-3 shadow-lg"
                    onClick={e => e.stopPropagation()}
                >
                    <span className="text-cyan-400 font-bold">Zoom: {zoomPercent}%</span>
                    <span>•</span>
                    <span>Use mouse wheel or <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl + Wheel</kbd> to zoom</span>
                    <span>•</span>
                    <span>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">+</kbd> / <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">-</kbd> keys</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};