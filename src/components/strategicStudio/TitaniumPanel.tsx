import React from "react";
import styles from "./TitaniumPanel.module.css";

export function TitaniumPanel(props: {
  kicker?: string;
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const { kicker, title, rightSlot, children, footer, className } = props;
  return (
    <section className={`${styles.panel} ${className ?? ""}`}>
      <div className={styles.inner}>
        {kicker ? <div className={styles.kicker}>{kicker}</div> : null}
        <div className={styles.titleRow}>
          <div className={styles.title}>{title}</div>
          {rightSlot ? <div>{rightSlot}</div> : null}
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </section>
  );
}

export default TitaniumPanel;


