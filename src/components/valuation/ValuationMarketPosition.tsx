// src/components/valuation/ValuationMarketPosition.tsx
// STRATFIT — Layer 5: Market Position Bar
// Explicitly shows: Your multiple, Median seed SaaS, Upper quartile.
// No ambiguous color band.

import styles from "./ValuationPage.module.css";

interface ValuationMarketPositionProps {
  yourMultiple: number;
  medianMultiple: number;
  upperQuartile: number;
  maxScale?: number;
}

export default function ValuationMarketPosition({
  yourMultiple,
  medianMultiple,
  upperQuartile,
  maxScale = 20,
}: ValuationMarketPositionProps) {
  const pct = (v: number) => Math.min(95, Math.max(5, (v / maxScale) * 100));

  return (
    <div className={styles.marketPanel}>
      <div className={styles.panelTitle}>Market Position</div>

      <div className={styles.marketBarWrap}>
        <div className={styles.marketBarTrack} />

        {/* Median marker */}
        <div className={styles.marketMarker} style={{ left: `${pct(medianMultiple)}%` }}>
          <div className={styles.marketMarkerLine} />
        </div>

        {/* Upper quartile marker */}
        <div className={styles.marketMarker} style={{ left: `${pct(upperQuartile)}%` }}>
          <div className={styles.marketMarkerLine} />
        </div>

        {/* Your position */}
        <div className={styles.marketYou} style={{ left: `${pct(yourMultiple)}%` }}>
          <div className={styles.marketYouDot} />
        </div>
      </div>

      {/* Legend row */}
      <div className={styles.marketLegendRow}>
        <div className={styles.marketLegendItem}>
          <span className={styles.marketLegendDot} style={{ background: "#00E0FF" }} />
          Your multiple: {yourMultiple.toFixed(1)}x
        </div>
        <div className={styles.marketLegendItem}>
          <span
            className={styles.marketLegendDot}
            style={{ background: "rgba(255,255,255,0.3)" }}
          />
          Median Seed SaaS: {medianMultiple.toFixed(1)}x
        </div>
        <div className={styles.marketLegendItem}>
          <span
            className={styles.marketLegendDot}
            style={{ background: "rgba(255,255,255,0.5)" }}
          />
          Upper quartile: {upperQuartile.toFixed(1)}x
        </div>
      </div>
    </div>
  );
}





