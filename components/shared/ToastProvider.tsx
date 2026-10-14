import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  title?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  addedAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: {
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
    custom: (message: string, type?: ToastType, options?: ToastOptions) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const MAX_VISIBLE = 4;
const DEFAULT_DURATION = 4000;
const DEDUP_WINDOW_MS = 1500;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const now = Date.now();

    setToasts(prev => {
      // Dedup check
      const isDuplicate = prev.some(
        t => t.type === type && t.message === message && now - t.addedAt < DEDUP_WINDOW_MS
      );
      if (isDuplicate) return prev;

      const id = `${now}-${Math.random().toString(36).substring(2, 6)}`;
      const duration = options?.duration ?? DEFAULT_DURATION;

      const newToast: ToastItem = {
        id,
        message,
        title: options?.title,
        type,
        duration,
        action: options?.action,
        addedAt: now
      };

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return [newToast, ...prev].slice(0, MAX_VISIBLE);
    });
  }, [removeToast]);

  const toastHelpers = {
    success: (msg: string, opts?: ToastOptions) => addToast(msg, 'success', opts),
    error: (msg: string, opts?: ToastOptions) => addToast(msg, 'error', opts),
    warning: (msg: string, opts?: ToastOptions) => addToast(msg, 'warning', opts),
    info: (msg: string, opts?: ToastOptions) => addToast(msg, 'info', opts),
    custom: (msg: string, type?: ToastType, opts?: ToastOptions) => addToast(msg, type || 'info', opts)
  };

  return (
    <ToastContext.Provider value={{ toasts, toast: toastHelpers, removeToast }}>
      {children}
      <div 
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-md w-full pointer-events-none px-4"
        role="region" 
        aria-label="Notifications" 
        aria-live="polite"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden flex items-start justify-between p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-scale-in ${
              t.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100' :
              t.type === 'error' ? 'bg-rose-950/80 border-rose-500/40 text-rose-100' :
              t.type === 'warning' ? 'bg-amber-950/80 border-amber-500/40 text-amber-100' :
              'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
              </div>
              <div>
                {t.title && <div className="font-bold text-sm mb-0.5">{t.title}</div>}
                <div className="text-xs font-medium leading-relaxed">{t.message}</div>
                {t.action && (
                  <button
                    onClick={t.action.onClick}
                    className="mt-2 px-2.5 py-1 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 text-cyan-300 border border-white/15 transition-colors"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
            {t.duration > 0 && (
              <div 
                className="animate-toast-progress" 
                style={{ animationDuration: `${t.duration}ms` }} 
              />
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};