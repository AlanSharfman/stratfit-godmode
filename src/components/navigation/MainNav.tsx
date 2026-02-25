import { Link, NavLink } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"
import styles from "./MainNav.module.css"

function MainNav() {
  return (
    <header className={styles.header}>
      <Link to={ROUTES.POSITION} className={styles.brand}>
        <img
          src="/logo.svg"
          alt="STRATFIT"
          width={64}
          height={64}
        />
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
