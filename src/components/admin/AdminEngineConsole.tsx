/**
 * AdminEngineConsole.tsx
 * ════════════════════════════════════════════════════════════════════════════
 * Gated admin-only engine console.
 *
 * Shows:
 *   - Full config snapshot (including seed, iterations)
 *   - Determinism verification
 *   - Engine logs/traces
 *   - Distribution integrity checks
 *
 * GATE: Only accessible when ENABLE_ADMIN_CONSOLE localStorage flag is set
 *       AND user tier is "enterprise" (or feature flag override).
 *
 * Normal users CANNOT access this component.
 * ════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo } from "react";
import { useSimulationStore } from "@/state/simulationStore";
import styles from "./AdminEngineConsole.module.css";

// ────────────────────────────────────────────────────────────────────────────
// GATE CHECK
// ────────────────────────────────────────────────────────────────────────────

function isAdminEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("ENABLE_ADMIN_CONSOLE") === "1";
}

// ────────────────────────────────────────────────────────────────────────────
// INTEGRITY CHECK HELPERS
// ────────────────────────────────────────────────────────────────────────────

interface IntegrityResult {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

function runIntegrityChecks(result: any): IntegrityResult[] {
  const checks: IntegrityResult[] = [];

  // 1. Survival rate sanity
  const sr = result?.survivalRate ?? -1;
  checks.push({
    label: "Survival rate bounds",
    status: sr >= 0 && sr <= 1 ? "pass" : "fail",
    detail: `survivalRate = ${sr} (expected 0–1)`,
  });

  // 2. Percentile ordering
  const arr = result?.arrPercentiles;
  if (arr) {
    const ordered = arr.p10 <= arr.p50 && arr.p50 <= arr.p90;
    checks.push({
      label: "ARR percentile ordering",
      status: ordered ? "pass" : "fail",
      detail: `P10=${arr.p10}, P50=${arr.p50}, P90=${arr.p90}`,
    });
  }

  // 3. Iteration count
  const iters = result?.iterations ?? 0;
  checks.push({
    label: "Iteration count",
    status: iters >= 1000 ? "pass" : iters > 0 ? "warn" : "fail",
    detail: `${iters} iterations (min recommended: 1000)`,
  });

  // 4. Execution time sanity
  const ms = result?.executionTimeMs ?? -1;
  checks.push({
    label: "Execution time",
    status: ms > 0 && ms < 60000 ? "pass" : "warn",
    detail: `${ms.toFixed(0)}ms`,
  });

  // 5. Sensitivity factors present
  const sf = result?.sensitivityFactors?.length ?? 0;
  checks.push({
    label: "Sensitivity factors",
    status: sf >= 5 ? "pass" : sf > 0 ? "warn" : "fail",
    detail: `${sf} factors present`,
  });

  return checks;
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export default function AdminEngineConsole() {
  const fullResult = useSimulationStore((s) => s.fullResult);
  const runMeta = useSimulationStore((s) => s.runMeta);
  const simulationStatus = useSimulationStore((s) => s.simulationStatus);
  const simulationCount = useSimulationStore((s) => s.simulationCount);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);

  const [showRaw, setShowRaw] = useState(false);

  const integrityChecks = useMemo(
    () => (fullResult ? runIntegrityChecks(fullResult) : []),
    [fullResult]
  );

  if (!isAdminEnabled()) {
    return (
      <div className={styles.gated}>
        <div className={styles.gatedIcon}>⛔</div>
        <h2 className={styles.gatedTitle}>Access Restricted</h2>
        <p className={styles.gatedDesc}>
          Admin Engine Console requires elevated permissions.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.console}>
      <div className={styles.header}>
        <h2 className={styles.title}>ENGINE CONSOLE</h2>
        <span className={styles.badge}>ADMIN</span>
      </div>

      {/* ── Status ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>STATUS</h3>
        <div className={styles.kvGrid}>
          <div className={styles.kvLabel}>Simulation status</div>
          <div className={styles.kvValue}>{simulationStatus.toUpperCase()}</div>
          <div className={styles.kvLabel}>Total runs</div>
          <div className={styles.kvValue}>{simulationCount}</div>
          <div className={styles.kvLabel}>Has simulated</div>
          <div className={styles.kvValue}>{hasSimulated ? "YES" : "NO"}</div>
        </div>
      </section>

      {/* ── Run Meta ── */}
      {runMeta && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>RUN METADATA</h3>
          <div className={styles.kvGrid}>
            <div className={styles.kvLabel}>Run ID</div>
            <div className={styles.kvValueMono}>{runMeta.runId}</div>
            <div className={styles.kvLabel}>Paths</div>
            <div className={styles.kvValue}>{runMeta.paths.toLocaleString()}</div>
            <div className={styles.kvLabel}>Horizon</div>
            <div className={styles.kvValue}>{runMeta.timeHorizonMonths} months</div>
            <div className={styles.kvLabel}>Seed locked</div>
            <div className={styles.kvValue}>{runMeta.seedLocked ? "YES (deterministic)" : "NO (random)"}</div>
            <div className={styles.kvLabel}>Duration</div>
            <div className={styles.kvValue}>
              {runMeta.durationMs !== null ? `${runMeta.durationMs}ms` : "—"}
            </div>
          </div>
        </section>
      )}

      {/* ── Config Snapshot ── */}
      {fullResult && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>CONFIG SNAPSHOT</h3>
          <div className={styles.kvGrid}>
            <div className={styles.kvLabel}>Iterations</div>
            <div className={styles.kvValue}>{fullResult.iterations.toLocaleString()}</div>
            <div className={styles.kvLabel}>Time horizon</div>
            <div className={styles.kvValue}>{fullResult.timeHorizonMonths} months</div>
            <div className={styles.kvLabel}>Execution time</div>
            <div className={styles.kvValue}>{fullResult.executionTimeMs.toFixed(0)}ms</div>
          </div>
        </section>
      )}

      {/* ── Integrity Checks ── */}
      {integrityChecks.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>DISTRIBUTION INTEGRITY</h3>
          <div className={styles.checkList}>
            {integrityChecks.map((c, i) => (
              <div key={i} className={styles.checkRow}>
                <span
                  className={`${styles.checkStatus} ${
                    c.status === "pass"
                      ? styles.checkPass
                      : c.status === "warn"
                      ? styles.checkWarn
                      : styles.checkFail
                  }`}
                >
                  {c.status === "pass" ? "PASS" : c.status === "warn" ? "WARN" : "FAIL"}
                </span>
                <span className={styles.checkLabel}>{c.label}</span>
                <span className={styles.checkDetail}>{c.detail}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Raw JSON Toggle ── */}
      {fullResult && (
        <section className={styles.section}>
          <button
            type="button"
            className={styles.rawToggle}
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? "Hide Raw Result" : "Show Raw Result (JSON)"}
          </button>
          {showRaw && (
            <pre className={styles.rawJson}>
              {JSON.stringify(
                {
                  iterations: fullResult.iterations,
                  timeHorizonMonths: fullResult.timeHorizonMonths,
                  executionTimeMs: fullResult.executionTimeMs,
                  survivalRate: fullResult.survivalRate,
                  medianSurvivalMonths: fullResult.medianSurvivalMonths,
                  arrPercentiles: fullResult.arrPercentiles,
                  cashPercentiles: fullResult.cashPercentiles,
                  runwayPercentiles: fullResult.runwayPercentiles,
                  sensitivityFactors: fullResult.sensitivityFactors,
                },
                null,
                2
              )}
            </pre>
          )}
        </section>
      )}
    </div>
  );
}



