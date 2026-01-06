// src/components/briefing/briefingStorage.ts
// Utility for tracking which briefings have been seen by the user (localStorage-based)

const STORAGE_KEY = 'stratfit_briefings_seen';

export function getBriefingsSeen(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isBriefingSeen(key: string): boolean {
  return !!getBriefingsSeen()[key];
}

export function setBriefingSeen(key: string): void {
  const seen = getBriefingsSeen();
  seen[key] = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {}
}

export function clearAllBriefingsSeen(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
