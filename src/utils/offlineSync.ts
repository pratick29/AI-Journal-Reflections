import { Interaction } from '../types';

const DB_NAME = 'mindscribe_offline_vault';
const DB_VERSION = 1;
const STORE_INTERACTIONS = 'interactions';
const STORE_SYNC_QUEUE = 'sync_queue';
const LOCAL_STORAGE_QUEUE_KEY = 'mindscribe_pending_sync_queue';
const LOCAL_STORAGE_CACHE_KEY = 'mindscribe_offline_cache';

export interface PendingSyncItem {
  id: string;
  userId: string;
  interaction: Interaction;
  enqueuedAt: string;
  retryCount: number;
}

// IndexedDB Helper
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_INTERACTIONS)) {
        db.createObjectStore(STORE_INTERACTIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('userId', 'userId', { unique: false });
        queueStore.createIndex('enqueuedAt', 'enqueuedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache an interaction locally so it can be browsed and loaded offline
 */
export async function cacheInteractionOffline(interaction: Interaction): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_INTERACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_INTERACTIONS);
      store.put(interaction);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // LocalStorage fallback
    try {
      const cached = getLocalStorageCache();
      cached[interaction.id] = interaction;
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(cached));
    } catch {
      // Storage quota exceeded or unavailable
    }
  }
}

/**
 * Enqueue an interaction that needs to be synced to Cloud Firestore
 */
export async function enqueueOfflineSync(userId: string, interaction: Interaction): Promise<void> {
  // Always update offline cache first
  await cacheInteractionOffline(interaction);

  const syncItem: PendingSyncItem = {
    id: interaction.id,
    userId,
    interaction,
    enqueuedAt: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      store.put(syncItem);
      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('mindscribe:offline-queue-updated'));
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // LocalStorage fallback
    try {
      const queue = getLocalStorageQueue();
      const existingIdx = queue.findIndex((q) => q.id === interaction.id);
      if (existingIdx >= 0) {
        queue[existingIdx] = syncItem;
      } else {
        queue.push(syncItem);
      }
      localStorage.setItem(LOCAL_STORAGE_QUEUE_KEY, JSON.stringify(queue));
      window.dispatchEvent(new CustomEvent('mindscribe:offline-queue-updated'));
    } catch {
      // ignore
    }
  }
}

/**
 * Retrieve all offline cached interactions for a user
 */
export async function getOfflineInteractions(userId: string): Promise<Interaction[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_INTERACTIONS, 'readonly');
      const store = tx.objectStore(STORE_INTERACTIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as Interaction[]).filter((item) => item.userId === userId);
        resolve(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const cached = getLocalStorageCache();
    return Object.values(cached)
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

/**
 * Count pending sync mutations for the given user
 */
export async function getPendingSyncCount(userId: string): Promise<number> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as PendingSyncItem[]).filter((q) => q.userId === userId);
        resolve(items.length);
      };
      req.onerror = () => resolve(0);
    });
  } catch {
    const queue = getLocalStorageQueue();
    return queue.filter((q) => q.userId === userId).length;
  }
}

/**
 * Flush all pending offline entries to Firestore when connectivity is restored
 */
export async function flushOfflineQueue(
  userId: string,
  saveRemote: (interaction: Interaction) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  let itemsToSync: PendingSyncItem[] = [];

  try {
    const db = await openDatabase();
    itemsToSync = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve((req.result as PendingSyncItem[]).filter((q) => q.userId === userId));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    itemsToSync = getLocalStorageQueue().filter((q) => q.userId === userId);
  }

  if (itemsToSync.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const item of itemsToSync) {
    try {
      await saveRemote(item.interaction);
      await removePendingSyncItem(item.id);
      synced++;
    } catch (err) {
      console.warn('[Offline Sync] Failed to synchronize interaction ' + item.id + ':', err);
      failed++;
    }
  }

  window.dispatchEvent(new CustomEvent('mindscribe:offline-queue-updated'));
  return { synced, failed };
}

/**
 * Remove an item from the pending sync queue once committed remotely
 */
export async function removePendingSyncItem(interactionId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      store.delete(interactionId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const queue = getLocalStorageQueue().filter((q) => q.id !== interactionId);
    try {
      localStorage.setItem(LOCAL_STORAGE_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // ignore
    }
  }
}

// LocalStorage helpers
function getLocalStorageCache(): Record<string, Interaction> {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function getLocalStorageQueue(): PendingSyncItem[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
