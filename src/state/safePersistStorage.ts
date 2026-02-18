import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * A PersistStorage implementation that is resilient to corrupted JSON in localStorage.
 *
 * If parsing fails (e.g. "bad unicode" from invalid escape sequences), it clears the
 * offending key and returns null so the store can fall back to its defaults.
 */
export function safeLocalStoragePersist(): PersistStorage<any> | undefined {
  if (typeof window === 'undefined') return undefined;

  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }

  if (!storage) return undefined;

  return {
    getItem: (name) => {
      const raw = storage.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<any>;
      } catch {
        try {
          storage.removeItem(name);
        } catch {
          // ignore
        }
        return null;
      }
    },
    setItem: (name, value) => {
      storage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name) => {
      storage.removeItem(name);
    },
  };
}
