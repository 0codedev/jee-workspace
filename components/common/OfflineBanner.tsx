import React, { useState } from 'react';
import { WifiOff, Download, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isInstallable, isUpdateAvailable, installPwa, updateApp } = usePWA();
  const [dismissInstall, setDismissInstall] = useState<boolean>(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
      {/* 1. Offline Indicator Alert */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-950/90 text-amber-200 border border-amber-500/40 shadow-2xl backdrop-blur-xl animate-fade-in text-xs font-semibold">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div>
            <span className="font-black text-amber-300">Offline Mode Active</span>
            <span className="text-amber-200/80 ml-1 hidden sm:inline">- All local data, tests, formulas & predictor available.</span>
          </div>
        </div>
      )}

      {/* 2. Update Available Toast */}
      {isUpdateAvailable && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-cyan-950/90 text-cyan-200 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-scale-in text-xs">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="font-bold text-white">New version available!</span>
          </div>
          <button
            onClick={updateApp}
            className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] transition-all shadow-md"
          >
            Update Now
          </button>
        </div>
      )}

      {/* 3. Install App Prompt (if browser supports install and user hasn't dismissed) */}
      {isInstallable && !dismissInstall && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-slate-200 border border-indigo-500/40 shadow-2xl backdrop-blur-xl animate-slide-up text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/50 flex items-center justify-center text-indigo-400 text-sm">
              📲
            </div>
            <div>
              <p className="font-black text-white text-[11px]">Install JEE Dashboard</p>
              <p className="text-[10px] text-slate-400">Fast, standalone & works offline</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={installPwa}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shadow-md flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setDismissInstall(true)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
