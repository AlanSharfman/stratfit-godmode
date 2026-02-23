import React from "react"
import { NavLink } from "react-router-dom"
import styles from "./AppHeader.module.css"
import { LIVE_NAV } from "@/navigation/liveNav"

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>STRATFIT</div>
          <div className={styles.sub}>Scenario Intelligence</div>
        </div>

        <nav className={styles.nav} aria-label="Primary navigation">
          {LIVE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.right}>
          <div className={styles.pill} title="Engine status">
            <span className={styles.dot} />
            ENGINE: LIVE
          </div>
        </div>
      </div>
    </header>
  )
}
