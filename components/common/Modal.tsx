import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const useFocusTrap = (ref: React.RefObject<HTMLElement>, isOpen: boolean) => {
    useEffect(() => {
        if (!isOpen || !ref.current) return;

        const focusableElements = Array.from(ref.current.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);

    }, [isOpen, ref]);
};


const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    isInfo?: boolean;
}> = ({ isOpen, onClose, title, children, isInfo = false }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<Element | null>(null);
    const titleId = `modal-title-${React.useId()}`;

    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement;
            setTimeout(() => {
                const focusableElements = modalRef.current?.querySelectorAll(FOCUSABLE_SELECTORS);
                if (focusableElements && focusableElements.length > 0) {
                    (focusableElements[0] as HTMLElement).focus();
                } else {
                    modalRef.current?.focus();
                }
            }, 100); // Delay to allow animation
        } else if (triggerRef.current) {
            (triggerRef.current as HTMLElement).focus();
            triggerRef.current = null;
        }
    }, [isOpen]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in" 
            onClick={onClose}
            onKeyDown={handleKeyDown}
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-5 md:p-6 flex flex-col animate-scale-in focus:outline-none max-h-[86vh] md:max-h-[88vh] overflow-hidden relative z-10 ${isInfo ? 'w-full max-w-lg' : 'w-full max-w-6xl h-[86vh]'}`} 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/80 shrink-0">
                    <h2 id={titleId} className="text-lg font-bold text-cyan-300">{title}</h2>
                    <button onClick={onClose} aria-label="Close dialog" className="w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all text-xs font-bold shadow backdrop-blur-md">&times;</button>
                </div>
                <div className="flex flex-col flex-grow w-full overflow-y-auto min-h-0 hide-scrollbar">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;