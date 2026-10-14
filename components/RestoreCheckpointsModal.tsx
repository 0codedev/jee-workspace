import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Button } from './common/Button';
import { listCloudCheckpoints, CloudCheckpoint, restoreDataFromFirebase } from '../services/backupService';
import { storage } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

interface RestoreCheckpointsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRestoreSuccess: (data: any) => void;
    addToast: (toast: { title: string; message: string; icon?: string }) => void;
}

export const RestoreCheckpointsModal: React.FC<RestoreCheckpointsModalProps> = ({
    isOpen,
    onClose,
    onRestoreSuccess,
    addToast
}) => {
    const [checkpoints, setCheckpoints] = useState<CloudCheckpoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [restoringPath, setRestoringPath] = useState<string | null>(null);
    const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
    const [selectedForConfirm, setSelectedForConfirm] = useState<CloudCheckpoint | null>(null);

    const loadCheckpoints = async () => {
        setIsLoading(true);
        setSelectedForConfirm(null);
        try {
            const list = await listCloudCheckpoints();
            setCheckpoints(list);
        } catch (err: any) {
            console.error('Failed to load cloud checkpoints:', err);
            addToast({
                title: 'Checkpoints Error',
                message: err.message || 'Could not fetch cloud checkpoints list.',
                icon: '❌'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadCheckpoints();
        } else {
            setSelectedForConfirm(null);
            setRestoringPath(null);
            setDownloadingPath(null);
        }
    }, [isOpen]);

    const handleDownloadCheckpoint = async (checkpoint: CloudCheckpoint) => {
        try {
            setDownloadingPath(checkpoint.fullPath);
            const fileRef = ref(storage, checkpoint.fullPath);
            const url = await getDownloadURL(fileRef);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            const data = await res.json();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            const dateStr = new Date(checkpoint.timestamp).toISOString().split('T')[0];
            const filename = checkpoint.isLatest 
                ? `jee_backup_latest_${dateStr}.json` 
                : `jee_checkpoint_${dateStr}_${checkpoint.timestamp}.json`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);

            addToast({
                title: 'Downloaded',
                message: `Checkpoint exported as ${filename}`,
                icon: '📥'
            });
        } catch (err: any) {
            console.error('Download error:', err);
            addToast({
                title: 'Download Failed',
                message: err.message || 'Could not download checkpoint file.',
                icon: '❌'
            });
        } finally {
            setDownloadingPath(null);
        }
    };

    const handleConfirmRestore = async (checkpoint: CloudCheckpoint) => {
        try {
            setRestoringPath(checkpoint.fullPath);
            const restoredData = await restoreDataFromFirebase(checkpoint.fullPath);
            onRestoreSuccess(restoredData);
            addToast({
                title: 'Data Restored',
                message: `Successfully loaded backup from ${checkpoint.formattedDate}.`,
                icon: '✅'
            });
            onClose();
        } catch (err: any) {
            console.error('Restore error:', err);
            addToast({
                title: 'Restore Failed',
                message: err.message || 'Failed to restore checkpoint data.',
                icon: '❌'
            });
        } finally {
            setRestoringPath(null);
            setSelectedForConfirm(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cloud Backup & Checkpoint History" isInfo={false}>
            <div className="flex flex-col h-full space-y-4">
                {/* Header Information Banner */}
                <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/40 border border-cyan-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            <h4 className="text-sm font-bold text-white tracking-wide">
                                5-Checkpoint Rolling Protection
                            </h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                            Each backup creates a versioned snapshot. Your 5 most recent checkpoints are stored safely in Firebase Storage. Restoring retains your highest local streak and prevents text zoom distortion.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={loadCheckpoints}
                            disabled={isLoading || !!restoringPath}
                            className="text-xs border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    Scanning...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <span>🔄</span> Refresh
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Confirm Overlay Banner if user clicked restore on an item */}
                {selectedForConfirm && (
                    <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 animate-fadeIn space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-0.5">⚠️</span>
                            <div className="flex-1">
                                <h5 className="text-sm font-bold text-amber-300">
                                    Confirm Restore from {selectedForConfirm.formattedDate}?
                                </h5>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                    This will replace your current test reports, question logs, and study reflections with data from this checkpoint. Your active streak will be preserved safely.
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-amber-200/80">
                                    <span className="bg-amber-900/40 px-2 py-0.5 rounded border border-amber-600/30">
                                        📊 {selectedForConfirm.metrics.reportCount} Reports
                                    </span>
                                    <span className="bg-amber-900/40 px-2 py-0.5 rounded border border-amber-600/30">
                                        📝 {selectedForConfirm.metrics.logCount} Question Logs
                                    </span>
                                    <span className="bg-amber-900/40 px-2 py-0.5 rounded border border-amber-600/30">
                                        🔥 {selectedForConfirm.metrics.streakCount} Day Streak
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-2 pt-1 border-t border-amber-800/30">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setSelectedForConfirm(null)}
                                disabled={!!restoringPath}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleConfirmRestore(selectedForConfirm)}
                                disabled={!!restoringPath}
                                className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold"
                            >
                                {restoringPath ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Restoring Data...
                                    </span>
                                ) : (
                                    'Yes, Restore Checkpoint'
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Checkpoint Cards List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[220px]">
                    {isLoading && checkpoints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-slate-400 font-medium">Scanning Firebase Storage for checkpoints...</p>
                        </div>
                    ) : checkpoints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                            <span className="text-4xl mb-3 opacity-60">☁️</span>
                            <h5 className="text-sm font-semibold text-slate-300">No Cloud Backups Found</h5>
                            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                                Click "Backup to Cloud" in Settings to create your first secure checkpoint.
                            </p>
                        </div>
                    ) : (
                        checkpoints.map((cp, idx) => {
                            const isLatest = cp.isLatest || idx === 0;
                            const isRestoringThis = restoringPath === cp.fullPath;
                            const isDownloadingThis = downloadingPath === cp.fullPath;
                            const sizeKb = cp.sizeBytes > 0 ? (cp.sizeBytes / 1024).toFixed(1) + ' KB' : 'Optimized JSON';

                            return (
                                <div
                                    key={cp.id + '-' + idx}
                                    className={`relative p-4 rounded-2xl border transition-all duration-200 ${
                                        isLatest
                                            ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.08)]'
                                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {isLatest && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 tracking-wider uppercase">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                                        Active Pointer
                                                    </span>
                                                )}
                                                <span className="text-sm font-bold text-white truncate">
                                                    {cp.formattedDate}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    ({sizeKb})
                                                </span>
                                            </div>

                                            {/* Metrics row */}
                                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
                                                    <span>📊</span>
                                                    <span className="font-semibold text-white">{cp.metrics.reportCount}</span>
                                                    <span className="text-slate-400">Reports</span>
                                                </div>
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
                                                    <span>📝</span>
                                                    <span className="font-semibold text-white">{cp.metrics.logCount}</span>
                                                    <span className="text-slate-400">Logs</span>
                                                </div>
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-amber-300">
                                                    <span>🔥</span>
                                                    <span className="font-semibold text-white">{cp.metrics.streakCount}</span>
                                                    <span className="text-slate-400">Days</span>
                                                </div>
                                                {cp.metrics.taskCount > 0 && (
                                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
                                                        <span>📋</span>
                                                        <span className="font-semibold text-white">{cp.metrics.taskCount}</span>
                                                        <span className="text-slate-400">Tasks</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleDownloadCheckpoint(cp)}
                                                disabled={isDownloadingThis || !!restoringPath}
                                                className="text-xs px-3 py-1.5 border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white"
                                                title="Download this checkpoint as a JSON file to your device"
                                            >
                                                {isDownloadingThis ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                                                        Saving...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <span>📥</span> JSON
                                                    </span>
                                                )}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant={isLatest ? "primary" : "secondary"}
                                                onClick={() => setSelectedForConfirm(cp)}
                                                disabled={isRestoringThis || !!restoringPath}
                                                className={`text-xs px-3 py-1.5 font-bold ${
                                                    isLatest
                                                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                                        : 'border-slate-700 hover:border-cyan-500 text-cyan-400 hover:text-cyan-300'
                                                }`}
                                            >
                                                {isRestoringThis ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Restoring...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <span>⚡</span> Restore
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Notes */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
                    <span>Target user: Firebase authenticated account</span>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200 transition-colors font-medium px-2 py-1"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default RestoreCheckpointsModal;