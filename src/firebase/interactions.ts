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
  } catch (error) {
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
    return snap.data() as Interaction;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Fetch all past interactions for the authenticated user
 */
export async function getUserInteractions(userId: string): Promise<Interaction[]> {
  const path = getCollectionPath(userId);
  try {
    const colRef = collection(db, 'users', userId, 'interactions');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Interaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Real-time listener for user interactions
 */
export function subscribeUserInteractions(
  userId: string,
  onData: (interactions: Interaction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const path = getCollectionPath(userId);
  const colRef = collection(db, 'users', userId, 'interactions');
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as Interaction);
      onData(list);
    },
    (error) => {
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
