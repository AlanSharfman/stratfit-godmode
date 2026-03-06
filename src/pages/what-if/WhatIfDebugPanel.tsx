import React, { useState, useSyncExternalStore } from "react"
import {
  getWhatIfLog, clearWhatIfLog, subscribeWhatIfLog,
  type WhatIfLogEntry,
} from "@/engine/whatif"
import styles from "./WhatIfPage.module.css"

export default function WhatIfDebugPanel() {
  const log = useSyncExternalStore(subscribeWhatIfLog, getWhatIfLog)

  return (
    <div className={styles.debugPanel}>
      <div className={styles.debugHeader}>
        <span>What-If Debug Log ({log.length} entries)</span>
        <button onClick={clearWhatIfLog} className={styles.debugClearBtn}>Clear</button>
      </div>
      <div className={styles.debugScroll}>
        {log.length === 0 && (
          <div style={{ padding: 16, color: "rgba(200,220,240,0.3)", fontSize: 11, textAlign: "center" }}>
            No what-if calls recorded yet.
          </div>
        )}
        {[...log].reverse().map((entry) => (
          <WhatIfDebugEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function WhatIfDebugEntry({ entry }: { entry: WhatIfLogEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.debugEntry}>
      <div className={styles.debugEntryHeader} onClick={() => setExpanded((v) => !v)}>
        <span className={entry.parseSuccess ? styles.debugSuccess : styles.debugFail}>
          {entry.parseSuccess ? "OK" : "FAIL"}
        </span>
        <span className={styles.debugQuestion}>{entry.question}</span>
        <span className={styles.debugMeta}>
          {entry.latencyMs.toFixed(0)}ms · {entry.model} · retry {entry.retryCount}
          {entry.tokenUsage && ` · ${entry.tokenUsage.total_tokens ?? "?"} tok`}
        </span>
        <span style={{ fontSize: 10, opacity: 0.3 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div className={styles.debugBody}>
          <div className={styles.debugSection}>
            <div className={styles.debugSectionTitle}>System Prompt</div>
            <pre className={styles.debugPre}>{entry.systemPrompt}</pre>
          </div>
          <div className={styles.debugSection}>
            <div className={styles.debugSectionTitle}>User Message</div>
            <pre className={styles.debugPre}>{entry.userMessage}</pre>
          </div>
          <div className={styles.debugSection}>
            <div className={styles.debugSectionTitle}>Raw Response</div>
            <pre className={styles.debugPre}>{entry.rawResponse ?? "(null)"}</pre>
          </div>
          {entry.parseErrors.length > 0 && (
            <div className={styles.debugSection}>
              <div className={styles.debugSectionTitle} style={{ color: "#f87171" }}>Errors</div>
              <pre className={styles.debugPre} style={{ color: "#f87171" }}>{entry.parseErrors.join("\n")}</pre>
            </div>
          )}
          {entry.parsedAnswer && (
            <div className={styles.debugSection}>
              <div className={styles.debugSectionTitle}>Parsed Answer</div>
              <pre className={styles.debugPre}>{JSON.stringify(entry.parsedAnswer, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
