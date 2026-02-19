export function createSeed(str: string): number {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
}

type AnyBaseline = Record<string, unknown> | null | undefined;

function num(v: unknown): number | null {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
}

function pickString(b: AnyBaseline, keys: string[]): string | null {
    if (!b) return null;
    for (const k of keys) {
        const v = (b as any)[k];
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
}

function pickNumber(b: AnyBaseline, keys: string[]): number | null {
    if (!b) return null;
    for (const k of keys) {
        const n = num((b as any)[k]);
        if (n !== null) return n;
    }
    return null;
}

/**
 * Deterministic seed string derived from the baseline snapshot.
 * Goal: same company => same terrain; different company => different terrain.
 * This does NOT change architecture; it only changes the seed input string.
 */
export function baselineSeedString(baseline: AnyBaseline): string {
    const name =
        pickString(baseline, ["companyName", "name", "businessName", "title"]) ?? "baseline";

    const cash = pickNumber(baseline, ["cash", "cashBalance", "startingCash", "cash_on_hand"]);
    const burn = pickNumber(baseline, ["burn", "burnRate", "netBurn", "monthlyBurn"]);
    const runway = pickNumber(baseline, ["runwayMonths", "runway_months", "runway"]);

    // Normalize to coarse buckets so tiny edits don’t wildly reshape terrain
    const cashBucket = cash === null ? "na" : String(Math.round(cash / 50000) * 50000);
    const burnBucket = burn === null ? "na" : String(Math.round(burn / 10000) * 10000);
    const runwayBucket = runway === null ? "na" : String(Math.round(runway));

    return `baseline:${name}|cash:${cashBucket}|burn:${burnBucket}|runway:${runwayBucket}`;
}

/**
 * Relief scalar from baseline (0.6 .. 1.6).
 * Higher runway/cash => cleaner “higher ground”; higher burn => rougher relief.
 */
export function baselineReliefScalar(baseline: AnyBaseline): number {
    const cash = pickNumber(baseline, ["cash", "cashBalance", "startingCash", "cash_on_hand"]);
    const burn = pickNumber(baseline, ["burn", "burnRate", "netBurn", "monthlyBurn"]);
    const runway = pickNumber(baseline, ["runwayMonths", "runway_months", "runway"]);

    // Defaults if we don’t have the data yet
    let s = 1.0;

    if (runway !== null) {
        // 0..36 months => 0.8..1.25
        const r = Math.max(0, Math.min(36, runway));
        s *= 0.8 + (r / 36) * 0.45;
    }

    if (cash !== null) {
        // 0..2m => 0.9..1.15
        const c = Math.max(0, Math.min(2_000_000, cash));
        s *= 0.9 + (c / 2_000_000) * 0.25;
    }

    if (burn !== null) {
        // Higher burn => more jagged terrain => bump relief slightly
        const b = Math.max(0, Math.min(300_000, burn));
        s *= 0.95 + (b / 300_000) * 0.25;
    }

    return Math.max(0.6, Math.min(1.6, s));
}
