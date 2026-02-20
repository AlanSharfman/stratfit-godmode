/**
 * CommandCentrePanel — Docked panel for Position right rail.
 * Renders NARRATIVE / FIELDS / TOPOGRAPHY as full-width row toggles.
 * No collapse — rail-mode switching is handled by PositionPage.
 */
import React from "react";
import styles from "./CommandCentrePanel.module.css";

interface ToggleItem {
  id: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  visible?: boolean;
}

interface ToggleGroup {
  heading: string;
  items: ToggleItem[];
}

interface Props {
  groups: ToggleGroup[];
  title?: string;
}

export default function CommandCentrePanel({
  groups,
  title = "Command Centre",
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.panelTitle}>{title}</div>
      <div className={styles.body}>
        {groups.map((group) => {
          const visibleItems = group.items.filter((i) => i.visible !== false);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.heading} className={styles.group}>
              <div className={styles.groupHeading}>{group.heading}</div>
              <div className={styles.toggleList}>
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.onChange(!item.value)}
                    className={`${styles.toggleRow} ${item.value ? styles.toggleRowOn : ""}`}
                  >
                    <span className={styles.rowLabel}>{item.label}</span>
                    <span
                      className={`${styles.toggleState} ${item.value ? styles.toggleStateOn : ""}`}
                    >
                      {item.value ? "ON" : "OFF"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
