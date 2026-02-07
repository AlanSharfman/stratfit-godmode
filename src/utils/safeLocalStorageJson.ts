// src/utils/safeLocalStorageJson.ts
// Shared: safe JSON read/write to localStorage.
// If JSON is corrupt, we clear that key to prevent persistent crash loops.

export function safeJsonRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

export function safeJsonWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (quota/private mode)
  }
}


