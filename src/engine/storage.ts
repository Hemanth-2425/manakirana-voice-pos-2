import { INITIAL_STATE } from './seedData';
import { AppState } from './types';

const LS_KEY = 'manakirana_state_v1';
const IDB_NAME = 'ManaKiranaOfflineDB';
const IDB_STORE = 'shopState';
const IDB_RECORD_KEY = 'current';

function openKiranaDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function loadStateSync(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      return INITIAL_STATE;
    }
    return {
      ...INITIAL_STATE,
      ...parsed,
      shopProfile: {
        ...INITIAL_STATE.shopProfile,
        ...(parsed.shopProfile ?? {}),
      },
      voiceOutput: {
        ...INITIAL_STATE.voiceOutput,
        ...(parsed.voiceOutput ?? {}),
      },
      lastVoiceStatus: 'idle',
    };
  } catch {
    return INITIAL_STATE;
  }
}

export async function loadStateFromIndexedDB(): Promise<AppState | null> {
  const db = await openKiranaDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_RECORD_KEY);
      req.onsuccess = () => {
        const val = req.result as Partial<AppState> | undefined;
        if (val && Array.isArray(val.items) && val.items.length > 0) {
          resolve({
            ...INITIAL_STATE,
            ...val,
            shopProfile: {
              ...INITIAL_STATE.shopProfile,
              ...(val.shopProfile ?? {}),
            },
            voiceOutput: {
              ...INITIAL_STATE.voiceOutput,
              ...(val.voiceOutput ?? {}),
            },
            lastVoiceStatus: 'idle',
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function persistState(state: AppState): void {
  try {
    const serializable: AppState = {
      ...state,
      lastVoiceStatus: state.pendingDisambiguation ? 'disambiguate' : 'idle',
    };
    localStorage.setItem(LS_KEY, JSON.stringify(serializable));
    void openKiranaDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(serializable, IDB_RECORD_KEY);
      } catch {
        // Ignore IndexedDB quota or private browsing errors; localStorage already succeeded
      }
    });
  } catch {
    // Ignore storage failures in restricted contexts
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(LS_KEY);
    void openKiranaDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(IDB_RECORD_KEY);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

const SESSION_LS_KEY = 'manakirana_session_v1';

export function loadSessionSync(): import('./types').ShopSession {
  try {
    const raw = localStorage.getItem(SESSION_LS_KEY);
    if (!raw) {
      return { isLoggedIn: false, hasCompletedSlides: false };
    }
    const parsed = JSON.parse(raw) as Partial<import('./types').ShopSession>;
    return {
      isLoggedIn: Boolean(parsed.isLoggedIn),
      hasCompletedSlides: Boolean(parsed.hasCompletedSlides),
    };
  } catch {
    return { isLoggedIn: false, hasCompletedSlides: false };
  }
}

export function persistSession(session: import('./types').ShopSession): void {
  try {
    localStorage.setItem(SESSION_LS_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_LS_KEY);
  } catch {
    // ignore
  }
}

