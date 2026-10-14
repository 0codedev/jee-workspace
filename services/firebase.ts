import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    initializeAuth, 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    browserLocalPersistence, 
    indexedDBLocalPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_MOCK_JEE_FIREBASE_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jee-workspace.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jee-workspace",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jee-workspace.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "387782597642",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:387782597642:web:jee-workspace",
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Lock in multi-layer local persistence (IndexedDB with LocalStorage fallback)
// at auth instantiation time to permanently prevent unexpected logouts across reloads
let authInstance: ReturnType<typeof getAuth>;
try {
    authInstance = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence]
    });
} catch (e) {
    authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user && typeof window !== 'undefined') {
            localStorage.setItem('jee_cached_user', JSON.stringify({
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL
            }));
            localStorage.removeItem('jee_offline_mode');
        }
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('jee_cached_user');
            localStorage.removeItem('jee_offline_mode');
        }
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
};
