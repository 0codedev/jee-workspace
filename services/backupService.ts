import { 
    ref, 
    uploadString, 
    getDownloadURL, 
    getMetadata, 
    listAll, 
    deleteObject 
} from 'firebase/storage';
import { storage, auth } from './firebase';
import { INITIAL_REPORTS } from '../data/initialData';

const INITIAL_REPORT_IDS = new Set(INITIAL_REPORTS.map(r => r.id));

export interface CloudCheckpoint {
    id: string;
    fullPath: string;
    timestamp: number;
    formattedDate: string;
    isLatest: boolean;
    sizeBytes: number;
    metrics: {
        reportCount: number;
        logCount: number;
        streakCount: number;
        taskCount: number;
    };
}

export const isMockDataset = (data: any): boolean => {
    if (!data || !data.reports || !Array.isArray(data.reports)) return true;
    if (data.reports.length === 0) return true;
    const allAreMock = data.reports.every((r: any) => r && INITIAL_REPORT_IDS.has(r.id));
    return allAreMock;
};

export const hasCloudBackup = async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;
    try {
        const backupRef = ref(storage, `backups/${user.uid}/data_backup.json`);
        await getMetadata(backupRef);
        return true;
    } catch (e) {
        return false;
    }
};

// ==========================================
// 1. THE BACKUP PIPELINE (Upload & 5-Checkpoint Rotation)
// ==========================================
export const backupFullDataToFirebase = async (data: any, options: { isAutoBackup?: boolean } = {}) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Cannot backup data: No user logged in.");
    }

    // Safety Guard: In auto-backup mode, NEVER overwrite genuine cloud data with mock data
    if (options.isAutoBackup && isMockDataset(data)) {
        const cloudExists = await hasCloudBackup();
        if (cloudExists) {
            console.warn("[BackupService] Safeguard active: Blocked auto-backup because local state is mock data while cloud holds real student data.");
            return false;
        }
    }

    const timestamp = Date.now();
    const reportsList = Array.isArray(data.reports) ? data.reports : [];
    const logsList = Array.isArray(data.logs) ? data.logs : [];
    const streakCount = data.streakData?.count || 0;
    const tasksCount = Array.isArray(data.dailyTasks) ? data.dailyTasks.length : 0;

    // Strip heavy base64 image data so cloud payloads remain lightweight, and bundle streakData
    const sanitizedData = {
        ...data,
        _checkpointMeta: {
            timestamp,
            date: new Date(timestamp).toISOString(),
            reportCount: reportsList.length,
            logCount: logsList.length,
            streakCount,
            taskCount: tasksCount
        },
        streakData: data.streakData || null,
        reports: reportsList.map((report: any) => {
            if (!report || typeof report !== 'object') return report;
            const { localScorecardImage, ...rest } = report;
            return rest;
        }),
        reflections: Array.isArray(data.reflections)
            ? data.reflections.map((ref: any) => {
                if (!ref || typeof ref !== 'object') return ref;
                const { image, images, localImage, ...rest } = ref;
                return rest;
            })
            : data.reflections,
        userProfile: data.userProfile && data.userProfile.syllabus
            ? {
                ...data.userProfile,
                syllabus: Object.fromEntries(
                    Object.entries(data.userProfile.syllabus).map(([k, v]: [string, any]) => {
                        if (!v || typeof v !== 'object') return [k, v];
                        const { chapterImage, chapterImages, ...restChapter } = v;
                        return [k, restChapter];
                    })
                )
            }
            : data.userProfile
    };

    const backupDataString = JSON.stringify(sanitizedData);
    const metadataHeader = {
        contentType: 'application/json',
        customMetadata: {
            timestamp: String(timestamp),
            reportCount: String(reportsList.length),
            logCount: String(logsList.length),
            streakCount: String(streakCount),
            taskCount: String(tasksCount)
        }
    };

    try {
        console.log("Starting cloud sync & checkpointing...");
        
        // 1. Primary write to data_backup.json (maintains mentor view & single-device sync)
        const primaryRef = ref(storage, `backups/${user.uid}/data_backup.json`);
        await uploadString(primaryRef, backupDataString, 'raw', metadataHeader);

        // 2. Versioned checkpoint write to checkpoints/backup_<timestamp>.json
        const checkpointRef = ref(storage, `backups/${user.uid}/checkpoints/backup_${timestamp}.json`);
        await uploadString(checkpointRef, backupDataString, 'raw', metadataHeader);

        console.log(`SUCCESS: Primary backup and checkpoint backup_${timestamp}.json secured.`);

        // 3. Rolling Rotation: Keep only the 5 most recent checkpoints
        try {
            const checkpointsFolderRef = ref(storage, `backups/${user.uid}/checkpoints`);
            const listRes = await listAll(checkpointsFolderRef);
            
            if (listRes.items.length > 5) {
                // Sort ascending by file name (backup_<timestamp>.json)
                const sortedItems = [...listRes.items].sort((a, b) => a.name.localeCompare(b.name));
                const excessCount = sortedItems.length - 5;
                const itemsToDelete = sortedItems.slice(0, excessCount);
                
                await Promise.all(itemsToDelete.map(itemRef => deleteObject(itemRef).catch(e => {
                    console.warn(`[BackupService] Could not prune old checkpoint ${itemRef.name}:`, e);
                })));
                console.log(`[BackupService] Rotated checkpoints: pruned ${excessCount} old backup(s).`);
            }
        } catch (rotErr) {
            console.warn("[BackupService] Checkpoint rotation non-critical warning:", rotErr);
        }

        // Clear local unsaved warnings
        localStorage.setItem('unsaved_changes_count', '0');
        localStorage.setItem('last_auto_backup_time', new Date().toISOString());
        
        return true;
    } catch (error) {
        console.error("FATAL ERROR: Cloud sync failed:", error);
        throw error;
    }
};

// ==========================================
// 2. LIST ALL AVAILABLE CHECKPOINTS
// ==========================================
export const listCloudCheckpoints = async (): Promise<CloudCheckpoint[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    const checkpoints: CloudCheckpoint[] = [];

    // 1. Check primary latest backup
    try {
        const primaryRef = ref(storage, `backups/${user.uid}/data_backup.json`);
        const meta = await getMetadata(primaryRef);
        const time = meta.customMetadata?.timestamp ? parseInt(meta.customMetadata.timestamp, 10) : new Date(meta.timeCreated).getTime();
        checkpoints.push({
            id: 'latest',
            fullPath: primaryRef.fullPath,
            timestamp: time,
            formattedDate: new Date(time).toLocaleString(undefined, { 
                month: 'short', day: 'numeric', year: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            }),
            isLatest: true,
            sizeBytes: meta.size || 0,
            metrics: {
                reportCount: parseInt(meta.customMetadata?.reportCount || '0', 10),
                logCount: parseInt(meta.customMetadata?.logCount || '0', 10),
                streakCount: parseInt(meta.customMetadata?.streakCount || '0', 10),
                taskCount: parseInt(meta.customMetadata?.taskCount || '0', 10)
            }
        });
    } catch (e) {
        // No primary backup yet
    }

    // 2. Check historical checkpoints folder
    try {
        const checkpointsFolderRef = ref(storage, `backups/${user.uid}/checkpoints`);
        const listRes = await listAll(checkpointsFolderRef);
        
        const checkpointItems = await Promise.all(
            listRes.items.map(async (itemRef) => {
                try {
                    const meta = await getMetadata(itemRef);
                    const time = meta.customMetadata?.timestamp ? parseInt(meta.customMetadata.timestamp, 10) : new Date(meta.timeCreated).getTime();
                    return {
                        id: itemRef.name,
                        fullPath: itemRef.fullPath,
                        timestamp: time,
                        formattedDate: new Date(time).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                        }),
                        isLatest: false,
                        sizeBytes: meta.size || 0,
                        metrics: {
                            reportCount: parseInt(meta.customMetadata?.reportCount || '0', 10),
                            logCount: parseInt(meta.customMetadata?.logCount || '0', 10),
                            streakCount: parseInt(meta.customMetadata?.streakCount || '0', 10),
                            taskCount: parseInt(meta.customMetadata?.taskCount || '0', 10)
                        }
                    } as CloudCheckpoint;
                } catch (err) {
                    return null;
                }
            })
        );

        for (const item of checkpointItems) {
            if (item) checkpoints.push(item);
        }
    } catch (e) {
        console.warn("[BackupService] Error listing checkpoints folder:", e);
    }

    // Sort descending by timestamp
    return checkpoints.sort((a, b) => b.timestamp - a.timestamp);
};

// ==========================================
// 3. THE RESTORE PIPELINE (Targeted or Latest)
// ==========================================
export const restoreDataFromFirebase = async (targetPath?: string) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Cannot restore data: No user logged in.");
    }

    const path = targetPath || `backups/${user.uid}/data_backup.json`;
    const targetRef = ref(storage, path);

    try {
        console.log(`Fetching backup from cloud (${path})...`);
        const downloadUrl = await getDownloadURL(targetRef);
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch file from cloud (${response.statusText}).`);
        }

        const restoredData = await response.json();
        console.log("SUCCESS: Data downloaded and parsed successfully.");
        return restoredData;
    } catch (error) {
        console.error("RESTORE ERROR: Could not pull data from Firebase:", error);
        throw error;
    }
};
