import { Prospect, UserStatus } from "../types";
import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc,
  updateDoc, 
  query, 
  orderBy,
  onSnapshot
} from "firebase/firestore";

const COLLECTION_NAME = "prospects";
const STORAGE_KEY = "maps_prospector_db";

// Helper to check if Firebase is effectively configured
const isFirebaseConfigured = () => {
    return process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== "mock-project";
};

/**
 * Save a new prospect to Firestore.
 * Uses setDoc (upsert) to prevent duplicates if saved multiple times.
 */
export const saveProspect = async (prospect: Prospect): Promise<void> => {
  if (isFirebaseConfigured()) {
    try {
        // Use setDoc with the prospect's ID to ensure idempotency
        await setDoc(doc(db, COLLECTION_NAME, prospect.id), {
            ...prospect,
            timestamp: Date.now() // Update timestamp on re-save
        });
        console.log("Document successfully written/updated:", prospect.id);
        return;
    } catch (e) {
        console.error("Error writing document to Firestore: ", e);
        // Fallback to local
    }
  }

  // LocalStorage Fallback
  const list = await getProspects();
  const index = list.findIndex(p => p.id === prospect.id);
  if (index >= 0) {
    list[index] = prospect;
  } else {
    list.push(prospect);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

/**
 * Get all prospects (One-time fetch)
 */
export const getProspects = async (): Promise<Prospect[]> => {
  if (isFirebaseConfigured()) {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const prospects: Prospect[] = [];
        querySnapshot.forEach((doc) => {
            prospects.push({ ...doc.data(), id: doc.id } as Prospect);
        });
        return prospects;
    } catch (e) {
        console.error("Error fetching from Firestore", e);
    }
  }

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Delete a prospect
 */
export const deleteProspect = async (id: string): Promise<void> => {
    if (isFirebaseConfigured()) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
            return;
        } catch (e) {
            console.error("Error deleting from Firestore", e);
        }
    }

    const list = await getProspects();
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Update prospect status
 */
export const updateProspectStatus = async (id: string, status: UserStatus): Promise<void> => {
    if (isFirebaseConfigured()) {
        try {
            const prospectRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(prospectRef, { user_status: status });
            return;
        } catch (e) {
            console.error("Error updating Firestore", e);
        }
    }

    const list = await getProspects();
    const item = list.find(p => p.id === id);
    if (item) {
        item.user_status = status;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
}

/**
 * Subscribe to real-time updates (Firestore specific)
 */
export const subscribeToProspects = (callback: (prospects: Prospect[]) => void) => {
    if (isFirebaseConfigured()) {
        // Order by timestamp to show newest leads first
        const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
        return onSnapshot(q, (snapshot) => {
            const prospects: Prospect[] = [];
            snapshot.forEach((doc) => {
                prospects.push({ ...doc.data(), id: doc.id } as Prospect);
            });
            callback(prospects);
        });
    } else {
        // Mock subscription for local storage
        getProspects().then(callback);
        return () => {}; // No-op unsubscribe
    }
}