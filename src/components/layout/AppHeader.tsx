import React from "react"
import { NavLink } from "react-router-dom"
import styles from "./AppHeader.module.css"

type NavItem = { to: string; label: string }

const NAV: NavItem[] = [
  { to: "/position", label: "Position" },
  { to: "/studio", label: "Studio" },
  { to: "/compare", label: "Compare" },
  { to: "/assessment", label: "Assessment" },
  { to: "/roadmap", label: "Roadmap" },
]

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>STRATFIT</div>
          <div className={styles.sub}>Scenario Intelligence</div>
        </div>

        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                [styles.link, isActive ? styles.active : ""].filter(Boolean).join(" ")
              }
              end
            >
              {n.label}
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
