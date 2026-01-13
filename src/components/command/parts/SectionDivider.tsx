import React from "react";
import styles from "./SectionDivider.module.css";

export function SectionDivider({ title }: { title: string }) {
  return (
    <div className={styles.row}>
      <div className={styles.title}>{title}</div>
      <div className={styles.line} />
    </div>
  );
}

export function SectionSpacer() {
  return <div className={styles.spacer} />;
}

