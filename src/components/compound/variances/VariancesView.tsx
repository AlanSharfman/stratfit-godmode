import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";
import { useScenarioStore } from "@/state/scenarioStore";
import styles from "./VariancesView.module.css";

export default function VariancesView() {
  const engineResults = useScenarioStore((s) => s.engineResults);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);

  const base = engineResults?.base;
  const baseHasKpis = !!base?.kpis && Object.keys(base.kpis).length > 0;

  const hasAnyScenarioResults =
    !!engineResults &&
    Object.entries(engineResults).some(([id, res]) => {
      if (id === "base") return false;
      return !!res?.kpis && Object.keys(res.kpis).length > 0;
    });

  let notice: string | null = null;
  if (!baseHasKpis) {
    notice = "No engine results available. Run a scenario to populate comparisons.";
  } else if (!hasAnyScenarioResults) {
    notice = "Base case loaded. Run another scenario (Upside/Downside/Extreme) to see variances.";
  } else if (activeScenarioId === "base") {
    notice = "Select a scenario (not Base) to compare against the Base Case.";
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.kicker}>Cross-scenario KPI comparison</div>
          <div className={styles.titleRow}>
            <h1 className={styles.h1}>Scenario Variances</h1>
            <div className={styles.badge}>VARIANCES</div>
          </div>

          {notice ? (
            <div className={styles.notice}>
              <div className={styles.noticeDot} />
              <div className={styles.noticeText}>{notice}</div>
            </div>
          ) : null}
        </header>

        {baseHasKpis ? (
          <section className={styles.content}>
            <ScenarioDeltaSnapshot />
          </section>
        ) : (
          <section className={styles.empty}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyTitle}>Awaiting scenario output</div>
              <div className={styles.emptyBody}>
                Run Upside / Downside / Extreme to generate a variance table and profile.
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
