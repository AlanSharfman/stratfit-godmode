/**
 * CommandCentrePanel — Docked panel for Position right rail.
 * Four-tier hierarchy: DEMO MODE / SCENARIO LAYERS / ANALYSIS / TERRAIN.
 * ANALYSIS + TERRAIN are collapsible accordions (collapsed by default).
 */
import React, { useState } from "react";
import styles from "./CommandCentrePanel.module.css";

interface ToggleItem {
  id: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  visible?: boolean;
  /** Optional CSS-module class key for special item styling (e.g. "videoPulse") */
  className?: string;
}

interface ToggleGroup {
  heading: string;
  items: ToggleItem[];
  /** If true, section renders as a collapsed accordion by default */
  collapsed?: boolean;
}

interface Props {
  groups: ToggleGroup[];
  title?: string;
  onClose?: () => void;
}

/** Renders a list of toggle rows */
function ToggleRows({ items }: { items: ToggleItem[] }) {
  return (
    <div className={styles.toggleList}>
      {items.map((item) => {
        const extraCls = item.className && (styles as Record<string, string>)[item.className];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => item.onChange(!item.value)}
            className={[
              styles.toggleRow,
              item.value ? styles.toggleRowOn : "",
              extraCls || "",
            ].filter(Boolean).join(" ")}
          >
            <span className={styles.rowLabel}>{item.label}</span>
            <span
              className={`${styles.toggleState} ${item.value ? styles.toggleStateOn : ""}`}
            >
              {item.value ? "ON" : "OFF"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Accordion section — collapsed by default */
function AccordionGroup({ heading, items }: { heading: string; items: ToggleItem[] }) {
  const [open, setOpen] = useState(false);
  const visibleItems = items.filter((i) => i.visible !== false);
  if (visibleItems.length === 0) return null;

  const activeCount = visibleItems.filter((i) => i.value).length;

  return (
    <div className={styles.group}>
      <button
        type="button"
        className={styles.accordionHeading}
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span className={styles.accordionChevron} data-open={open}>
          ‹
        </span>
        <span>{heading}</span>
        {!open && activeCount > 0 && (
          <span className={styles.accordionBadge}>{activeCount}</span>
        )}
      </button>
      {open && <ToggleRows items={visibleItems} />}
    </div>
  );
}

export default function CommandCentrePanel({
  groups,
  title = "Command Centre",
  onClose,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.panelTitle}>
        <span>{title}</span>
        {onClose && (
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>
      <div className={styles.body}>
        {groups.map((group) => {
          const visibleItems = group.items.filter((i) => i.visible !== false);
          if (visibleItems.length === 0) return null;

          // Accordion sections
          if (group.collapsed) {
            return <AccordionGroup key={group.heading} heading={group.heading} items={group.items} />;
          }

          // Standard flat section
          return (
            <div key={group.heading} className={styles.group}>
              <div className={styles.groupHeading}>{group.heading}</div>
              <ToggleRows items={visibleItems} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
