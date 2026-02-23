import { NavLink } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 text-sm font-medium transition ${
    isActive ? "text-cyan-300" : "text-slate-400 hover:text-white"
  }`

function MainNav() {
  return (
    <nav className="flex gap-2 border-b border-slate-800 px-6 py-3 bg-[#05070a]">
      <NavLink to={ROUTES.POSITION} className={linkClass}>Position</NavLink>
      <NavLink to={ROUTES.STUDIO} className={linkClass}>Studio</NavLink>
      <NavLink to={ROUTES.COMPARE} className={linkClass}>Compare</NavLink>
      <NavLink to={ROUTES.ASSESSMENT} className={linkClass}>Assessment</NavLink>
      <NavLink to={ROUTES.ROADMAP} className={linkClass}>Roadmap</NavLink>
    </nav>
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
