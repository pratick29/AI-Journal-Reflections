import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, sanitizePayload } from './config';
import { Interaction, OperationType } from '../types';
import { cacheInteractionOffline, getOfflineInteractions } from '../utils/offlineSync';

const getCollectionPath = (userId: string) => `users/${userId}/interactions`;
const getDocPath = (userId: string, interactionId: string) => `users/${userId}/interactions/${interactionId}`;

/**
 * Persist or update an interaction in the user's isolated Firestore subcollection
 */
export async function saveInteraction(userId: string, interaction: Interaction): Promise<void> {
  const path = getDocPath(userId, interaction.id);
  try {
    const cleanData = sanitizePayload(interaction);
    const docRef = doc(db, 'users', userId, 'interactions', interaction.id);
    await setDoc(docRef, cleanData, { merge: true });
    // Also update offline cache
    await cacheInteractionOffline(interaction);
  } catch (error) {
    // Cache offline even if Firestore fails
    await cacheInteractionOffline(interaction);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch a single interaction by ID
 */
export async function getInteraction(userId: string, interactionId: string): Promise<Interaction | null> {
  const path = getDocPath(userId, interactionId);
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interactionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as Interaction;
    await cacheInteractionOffline(data);
    return data;
  } catch (error) {
    // Attempt reading from offline cache
    const offlineList = await getOfflineInteractions(userId);
    const found = offlineList.find((i) => i.id === interactionId);
    if (found) return found;
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Fetch all past interactions for the authenticated user (with offline cache fallback)
 */
export async function getUserInteractions(userId: string): Promise<Interaction[]> {
  const path = getCollectionPath(userId);
  try {
    const colRef = collection(db, 'users', userId, 'interactions');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data() as Interaction);
    // Cache all fetched items locally
    items.forEach((item) => cacheInteractionOffline(item));
    return items;
  } catch (error) {
    // If offline or request fails, return cached interactions
    const offlineItems = await getOfflineInteractions(userId);
    if (offlineItems.length > 0) {
      return offlineItems;
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Real-time listener for user interactions (with offline cache fallback)
 */
export function subscribeUserInteractions(
  userId: string,
  onData: (interactions: Interaction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const path = getCollectionPath(userId);
  const colRef = collection(db, 'users', userId, 'interactions');
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  // Pre-load from offline cache immediately for instantaneous rendering
  getOfflineInteractions(userId).then((cached) => {
    if (cached.length > 0) {
      onData(cached);
    }
  }).catch(() => {});

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as Interaction);
      list.forEach((item) => cacheInteractionOffline(item));
      onData(list);
    },
    async (error) => {
      // If network offline, read cached interactions
      try {
        const offlineList = await getOfflineInteractions(userId);
        if (offlineList.length > 0) {
          onData(offlineList);
          return;
        }
      } catch {
        // ignore
      }
      onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(userId: string, interactionId: string): Promise<void> {
  const path = getDocPath(userId, interactionId);
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interactionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
