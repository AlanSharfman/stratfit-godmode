import { Link, NavLink } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "relative px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase transition",
    isActive ? "text-cyan-300" : "text-slate-300/80 hover:text-white",
  ].join(" ")

function MainNav() {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="h-full px-6 flex items-center justify-between">
        <Link to={ROUTES.POSITION} className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="STRATFIT"
            width={32}
            height={32}
            className="block"
          />
          <div className="leading-tight">
            <div className="text-white font-semibold tracking-wide">STRATFIT</div>
            <div className="text-[9px] text-white/55 tracking-[0.2em]">SCENARIO INTELLIGENCE</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink to={ROUTES.POSITION} className={linkClass}>
            {({ isActive }) => (
              <>
                <span>Position</span>
                {isActive && <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-cyan-300" />}
              </>
            )}
          </NavLink>
          <NavLink to={ROUTES.STUDIO} className={linkClass}>
            {({ isActive }) => (
              <>
                <span>Studio</span>
                {isActive && <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-cyan-300" />}
              </>
            )}
          </NavLink>
          <NavLink to={ROUTES.COMPARE} className={linkClass}>
            {({ isActive }) => (
              <>
                <span>Compare</span>
                {isActive && <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-cyan-300" />}
              </>
            )}
          </NavLink>
          <NavLink to={ROUTES.ASSESSMENT} className={linkClass}>
            {({ isActive }) => (
              <>
                <span>Assessment</span>
                {isActive && <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-cyan-300" />}
              </>
            )}
          </NavLink>
          <NavLink to={ROUTES.ROADMAP} className={linkClass}>
            {({ isActive }) => (
              <>
                <span>Roadmap</span>
                {isActive && <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-cyan-300" />}
              </>
            )}
          </NavLink>
        </nav>
      </div>
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
