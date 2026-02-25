import { Link, NavLink } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"
import styles from "./MainNav.module.css"

function MainNav() {
  return (
    <header className={styles.header}>
      <Link to={ROUTES.POSITION} className={styles.brand}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="36" height="36" style={{ display: "block" }} aria-hidden="true">
          <defs>
            <linearGradient id="topGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFFF" />
              <stop offset="100%" stopColor="#0077FF" />
            </linearGradient>
            <filter id="neonAura" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00FFFF" floodOpacity="0.5" />
            </filter>
          </defs>
          <polygon points="15,35 50,55 50,95 15,75" fill="#0D2C4C" stroke="#1A4A7C" strokeWidth="1" />
          <polygon points="50,55 85,35 85,75 50,95" fill="#061626" stroke="#0D2C4C" strokeWidth="1" />
          <polygon points="50,15 85,35 50,55 15,35" fill="url(#topGlow)" filter="url(#neonAura)" />
          <polyline points="15,35 50,55 85,35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
          <line x1="50" y1="55" x2="50" y2="95" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5" />
        </svg>
        <div className={styles.brandText}>
          <div className={styles.brandName}>STRATFIT</div>
          <div className={styles.brandSub}>SCENARIO INTELLIGENCE</div>
        </div>
      </Link>

      <nav className={styles.nav}>
        <NavLink
          to={ROUTES.POSITION}
          className={({ isActive }) => `${styles.navItem}${isActive ? " " + styles.active : ""}`}
        >
          Position
        </NavLink>
        <NavLink
          to={ROUTES.STUDIO}
          className={({ isActive }) => `${styles.navItem}${isActive ? " " + styles.active : ""}`}
        >
          Studio
        </NavLink>
        <NavLink
          to={ROUTES.COMPARE}
          className={({ isActive }) => `${styles.navItem}${isActive ? " " + styles.active : ""}`}
        >
          Compare
        </NavLink>
        <NavLink
          to={ROUTES.ASSESSMENT}
          className={({ isActive }) => `${styles.navItem}${isActive ? " " + styles.active : ""}`}
        >
          Assessment
        </NavLink>
        <NavLink
          to={ROUTES.ROADMAP}
          className={({ isActive }) => `${styles.navItem}${isActive ? " " + styles.active : ""}`}
        >
          Roadmap
        </NavLink>
      </nav>
    </header>
  )
}

export default MainNav
export { MainNav }

export function MainNavCompact() {
  return <MainNav />
}

export function PageHeader() {
  return null
}
