import type { BaselineV1 } from "@/onboard/baseline";

// ── Risk signal extraction from BaselineV1 ─────────────────────────────

interface RiskSignal {
    /** Position along corridor t ∈ [0,1] */
    center: number;
    /** Risk intensity 0→1 */
    amplitude: number;
    /** Gaussian width (higher = sharper peak) */
    sharpness: number;
}

/**
 * Map BaselineV1 financial/operating data to risk signals along the corridor.
 *
 * Corridor layout (t = 0 → 1):
 *   0.00–0.18  Revenue risk zone       (ARR scale, growth, concentration)
 *   0.22–0.38  Burn / margin zone      (burn rate, margin, runway)
 *   0.42–0.58  Operating risk zone     (churn, key-person, sales cycle)
 *   0.62–0.78  Capital structure zone  (debt, interest, debt service)
 *   0.82–1.00  Unit-economics zone    (LTV/CAC, NRR, expansion)
 */
function extractRiskSignals(b: BaselineV1): RiskSignal[] {
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const signals: RiskSignal[] = [];

    // ── 1. Revenue risk (t ≈ 0.12) ──────────────────────────────────────
    // Low ARR + low growth + high concentration = high risk
    const arrScale = b.financial.arr > 0 ? clamp01(1 - b.financial.arr / 10_000_000) : 0.9;
    const growthRisk = clamp01(1 - b.financial.growthRatePct / 100);
    const concRisk = clamp01(b.financial.revenueConcentrationPct / 100);
    const revenueRisk = clamp01(arrScale * 0.3 + growthRisk * 0.35 + concRisk * 0.35);
    signals.push({ center: 0.12, amplitude: revenueRisk, sharpness: 50 });

    // ── 2. Burn / Runway risk (t ≈ 0.30) ────────────────────────────────
    // High burn relative to cash = high risk. Runway < 12mo = danger.
    const runwayMonths = b.financial.monthlyBurn > 0
        ? b.financial.cashOnHand / b.financial.monthlyBurn
        : 60; // no burn = infinite runway → low risk
    const runwayRisk = clamp01(1 - runwayMonths / 36);
    const burnToArr = b.financial.arr > 0
        ? clamp01((b.financial.monthlyBurn * 12) / b.financial.arr)
        : 0.5;
    const burnRisk = clamp01(runwayRisk * 0.5 + burnToArr * 0.5);
    signals.push({ center: 0.30, amplitude: burnRisk, sharpness: 45 });

    // ── 3. Margin risk (t ≈ 0.42) ───────────────────────────────────────
    // Gross margin < 50% is weak, < 30% is dangerous
    const marginRisk = clamp01(1 - b.financial.grossMarginPct / 80);
    signals.push({ center: 0.42, amplitude: marginRisk, sharpness: 55 });

    // ── 4. Operating risk (t ≈ 0.55) ────────────────────────────────────
    // Churn, key-person dependency, customer concentration + sales cycle
    const churnRisk = clamp01(b.operating.churnPct / 15);
    const triToNum = (v: string) => v === "High" ? 0.9 : v === "Medium" ? 0.5 : 0.15;
    const keyPersonRisk = triToNum(b.operating.keyPersonDependency);
    const custConcRisk = triToNum(b.operating.customerConcentrationRisk);
    const opsRisk = clamp01(churnRisk * 0.35 + keyPersonRisk * 0.3 + custConcRisk * 0.35);
    signals.push({ center: 0.55, amplitude: opsRisk, sharpness: 40 });

    // ── 5. Capital structure risk (t ≈ 0.70) ────────────────────────────
    // Total debt relative to ARR, debt service burden
    const debtToArr = b.financial.arr > 0
        ? clamp01(b.capital.totalDebt / b.financial.arr)
        : (b.capital.totalDebt > 0 ? 0.9 : 0.1);
    const debtServiceBurden = b.financial.monthlyBurn > 0
        ? clamp01(b.capital.monthlyDebtService / b.financial.monthlyBurn)
        : 0.1;
    const capitalRisk = clamp01(debtToArr * 0.5 + debtServiceBurden * 0.3 + clamp01(b.capital.interestRatePct / 20) * 0.2);
    signals.push({ center: 0.70, amplitude: capitalRisk, sharpness: 50 });

    // ── 6. Unit economics risk (t ≈ 0.85) ──────────────────────────────
    // LTV / CAC < 3 = weak, payback > 18mo = slow, NRR < 100 = contraction
    const ltvCacRatio = b.customerEngine.cac > 0
        ? b.customerEngine.ltv / b.customerEngine.cac
        : 3;
    const unitEconRisk = clamp01(1 - ltvCacRatio / 6);
    const nrrRisk = clamp01(1 - b.financial.nrrPct / 130);
    const paybackRisk = clamp01(b.customerEngine.paybackPeriodMonths / 36);
    const econRisk = clamp01(unitEconRisk * 0.4 + nrrRisk * 0.35 + paybackRisk * 0.25);
    signals.push({ center: 0.85, amplitude: econRisk, sharpness: 45 });

    // ── 7. Regulatory / compliance tail risk (t ≈ 0.95) ─────────────────
    const regRisk = triToNum(b.operating.regulatoryExposure);
    signals.push({ center: 0.95, amplitude: regRisk * 0.7, sharpness: 60 });

    return signals;
}

// ── Fallback demo signals (dramatic peaks for visual presence) ──────────

function demoRiskSignals(): RiskSignal[] {
    return [
        { center: 0.10, amplitude: 0.72, sharpness: 55 },  // revenue uncertainty
        { center: 0.28, amplitude: 0.85, sharpness: 40 },  // burn acceleration
        { center: 0.45, amplitude: 0.40, sharpness: 50 },  // margin pressure
        { center: 0.58, amplitude: 0.65, sharpness: 35 },  // operational complexity
        { center: 0.72, amplitude: 0.50, sharpness: 45 },  // capital dependency
        { center: 0.88, amplitude: 0.78, sharpness: 50 },  // unit econ stress
    ];
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Generate a deterministic baseline risk curve from actual BaselineV1 data.
 *
 * Each financial/operating metric maps to a risk zone along the corridor.
 * Higher risk → terrain troughs (inverted through structure curve).
 * Lower risk → terrain peaks (structural integrity).
 *
 * When no baseline data is available (demo mode), uses dramatic demo signals
 * to produce visually meaningful terrain.
 *
 * API: Float32Array of length `samples`, values in [0..1].
 */
export function generateBaselineRiskCurve(
    samples: number = 256,
    baseline?: BaselineV1 | null,
): Float32Array {
    const signals = baseline ? extractRiskSignals(baseline) : demoRiskSignals();
    const values = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);

        // Base floor — minimum ambient risk (no zone is ever true-zero)
        let risk = 0.08 + 0.06 * (1.0 - Math.sin(t * Math.PI));

        // Accumulate Gaussian bumps from each risk signal
        for (const sig of signals) {
            risk += sig.amplitude * Math.exp(-((t - sig.center) ** 2) * sig.sharpness);
        }

        // Deterministic micro-texture (visual grain, not noise)
        risk += 0.025 * Math.sin(t * 47.1) * Math.cos(t * 23.7);

        values[i] = Math.max(0, Math.min(1, risk));
    }

    return values;
}
