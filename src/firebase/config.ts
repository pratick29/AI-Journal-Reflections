import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType, FirestoreErrorInfo } from '../types';

// Initialize Firebase App instance safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * CRITICAL: getFirestore must use the explicit database ID provided in config
 */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence safely
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline persistence skipped (multiple tabs open).');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline persistence unsupported by browser.');
    }
  });
}

export const auth = getAuth(app);

/**
 * Test server-side connection to Firestore on initialization
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or configuration needs verification.');
      return false;
    }
    // Permissions error on test doc is expected and indicates server reachability
    return true;
  }
}

// Run connectivity check
testConnection().catch((err) => console.debug('Firestore ping notice:', err));

/**
 * Standard Firestore error handler conforming to FirestoreErrorInfo spec
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const current = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid ?? null,
      email: current?.email ?? null,
      emailVerified: current?.emailVerified ?? null,
      isAnonymous: current?.isAnonymous ?? null,
      tenantId: current?.tenantId ?? null,
      providerInfo: current?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Eliminates undefined values before passing payloads to Firestore SDK
 */
export function sanitizePayload<T>(payload: T): T {
  return JSON.parse(
    JSON.stringify(payload, (_key, value) => (value === undefined ? null : value))
  );
}
