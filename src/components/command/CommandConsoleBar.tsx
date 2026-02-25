import React, { useCallback, useMemo, useState } from "react";
import styles from "./CommandConsoleBar.module.css";
import { useTypewriterHint } from "./useTypewriterHint";

type Props = {
  modeLabel?: string;
  onSubmit: (question: string) => Promise<void> | void;
  disabled?: boolean;
};

export default function CommandConsoleBar({ modeLabel = "Decision Console", onSubmit, disabled }: Props) {
  const phrases = useMemo(
    () => [
      "What happens if we slow hiring for 90 days?",
      "Can we extend runway by 6 months without raising?",
      "Should we raise now or wait until Q3?",
      "What if we cut burn 15% and increase price 5%?",
    ],
    []
  );

  const hint = useTypewriterHint({ phrases });

  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<null | string>(null);

  const fireTerrainRipple = useCallback(() => {
    window.dispatchEvent(new CustomEvent("sf:terrain-ripple", { detail: { strength: 1 } }));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const submit = useCallback(async () => {
    const q = value.trim();
    if (!q || isLoading || disabled) return;

    setIsLoading(true);
    fireTerrainRipple();
    showToast("Scenario seed created");

    try {
      await onSubmit(q);
      showToast("Opening Studio…");
      setValue("");
    } finally {
      setIsLoading(false);
    }
  }, [disabled, fireTerrainRipple, isLoading, onSubmit, showToast, value]);

  return (
    <div className={styles.wrap}>
      <div className={styles.shell}>
        {value.length === 0 && (
          <div className={styles.hintRow} aria-hidden="true">
            <span className={styles.hintSys}>SYS</span>
            <span className={styles.hintText}>{hint}</span>
          </div>
        )}

        <div className={styles.modePill}>{modeLabel}</div>

        <input
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Ask a strategic decision…"
          disabled={disabled || isLoading}
        />

        <button className={styles.askBtn} onClick={submit} disabled={disabled || isLoading || !value.trim()}>
          ASK
        </button>

        <div className={`${styles.progress} ${isLoading ? styles.progressActive : ""}`} />
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast ?? ""}</div>
    </div>
  );
}
