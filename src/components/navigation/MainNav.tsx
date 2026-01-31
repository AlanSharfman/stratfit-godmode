import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Mountain,
  Zap,
  GitCompare,
  DollarSign,
  CheckCircle,
  Activity,
  Save,
  FolderOpen,
  Download,
  Share2,
  ChevronDown,
  Layers,
  HelpCircle,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  description: string
}

interface ActiveScenario {
  name: string
  lastModified: string
}

interface MainNavProps {
  activeScenario?: ActiveScenario
  /** Optional: controlled navigation (no react-router required) */
  activeItemId?: string
  onNavigate?: (id: string) => void
  onSave?: () => void
  onLoad?: () => void
  onExport?: () => void
  onShare?: () => void
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAV CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const primaryNav: NavItem[] = [
  {
    id: 'terrain',
    label: 'TERRAIN',
    href: '/terrain',
    icon: <Mountain className="w-4 h-4" />,
    description: 'Build & test your strategy',
  },
  {
    id: 'simulate',
    label: 'SIMULATE',
    href: '/simulate',
    icon: <Zap className="w-4 h-4" />,
    description: 'Run 10,000 simulations',
  },
  {
    id: 'compare',
    label: 'COMPARE',
    href: '/compare',
    icon: <GitCompare className="w-4 h-4" />,
    description: 'Compare two futures',
  },
  {
    id: 'impact',
    label: 'IMPACT',
    href: '/impact',
    icon: <Activity className="w-4 h-4" />,
    description: 'Analyze what matters most',
  },
  {
    id: 'valuation',
    label: 'VALUATION',
    href: '/valuation',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Calculate your worth',
  },
  {
    id: 'decision',
    label: 'DECISION',
    href: '/decision',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Make your decision',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// LOGO
// ═══════════════════════════════════════════════════════════════════════════════

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <img
        src="/stratfit-logo.svg"
        alt="STRATFIT"
        className="h-10 w-auto select-none"
        style={{
          filter: "drop-shadow(0 6px 18px rgba(34, 211, 238, 0.10)) drop-shadow(0 12px 28px rgba(0,0,0,0.55))",
        }}
        draggable={false}
      />
    </Link>
  )
}

function LogoButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 group">
      <img
        src="/stratfit-logo.svg"
        alt="STRATFIT"
        className="h-10 w-auto select-none"
        style={{
          filter: "drop-shadow(0 6px 18px rgba(34, 211, 238, 0.10)) drop-shadow(0 12px 28px rgba(0,0,0,0.55))",
        }}
        draggable={false}
      />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE SCENARIO BADGE
// ═══════════════════════════════════════════════════════════════════════════════

function ActiveScenarioBadge({ scenario, onClick }: { scenario: ActiveScenario; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-all group"
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <div className="text-left">
        <div className="text-emerald-400 text-xs font-medium">{scenario.name}</div>
        <div className="text-[9px] text-white/40">Active Scenario</div>
      </div>
      <ChevronDown className="w-3 h-3 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIMARY NAV ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function PrimaryNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      to={item.href}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs tracking-wide transition-all group ${
        isActive
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-white/40 group-hover:text-white/70'}`}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      
      {/* Hover tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {item.description}
      </div>
      
      {/* Active indicator line */}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 rounded-full" />
      )}
    </Link>
  )
}

function PrimaryNavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs tracking-wide transition-all group ${
        isActive
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-white/40 group-hover:text-white/70'}`}>
        {item.icon}
      </span>
      <span>{item.label}</span>

      {/* Hover tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {item.description}
      </div>

      {/* Active indicator line */}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400 rounded-full" />
      )}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

function UtilityButton({ 
  icon, 
  label, 
  onClick,
  variant = 'default' 
}: { 
  icon: React.ReactNode
  label: string
  onClick?: () => void
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
        variant === 'primary'
          ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30'
          : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN NAVIGATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function MainNav(props: MainNavProps) {
  // If the caller provides an onNavigate handler, we render a controlled nav
  // that does not depend on react-router context.
  if (props.onNavigate) {
    return <ControlledMainNav {...props} />
  }
  return <RouterMainNav {...props} />
}

function RouterMainNav({
  activeScenario,
  onSave,
  onLoad,
  onExport,
  onShare,
  className = '',
}: MainNavProps) {
  const location = useLocation()
  const pathname = location.pathname
  const [showScenarioMenu, setShowScenarioMenu] = useState(false)

  // Determine active nav item
  const getActiveItem = () => {
    for (const item of primaryNav) {
      if (pathname.startsWith(item.href)) {
        return item.id
      }
    }
    return 'terrain' // default
  }

  const activeItem = getActiveItem()

  return (
    <header className={`h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 ${className}`}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo + Active Scenario */}
        <div className="flex items-center gap-6">
          <Logo />
          
          {activeScenario && (
            <>
              <div className="w-px h-8 bg-white/10" />
              <ActiveScenarioBadge 
                scenario={activeScenario} 
                onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              />
            </>
          )}
        </div>

        {/* Center: Primary Navigation */}
        <nav className="flex items-center gap-1">
          {primaryNav.map((item) => (
            <PrimaryNavItem
              key={item.id}
              item={item}
              isActive={activeItem === item.id}
            />
          ))}
        </nav>

        {/* Right: Utility Actions */}
        <div className="flex items-center gap-2">
          <UtilityButton
            icon={<Save className="w-4 h-4" />}
            label="SAVE"
            onClick={onSave}
          />
          <UtilityButton
            icon={<FolderOpen className="w-4 h-4" />}
            label="LOAD"
            onClick={onLoad}
          />
          <UtilityButton
            icon={<Download className="w-4 h-4" />}
            label="EXPORT"
            onClick={onExport}
          />
          <UtilityButton
            icon={<Share2 className="w-4 h-4" />}
            label="SHARE"
            onClick={onShare}
            variant="primary"
          />
          
          <div className="w-px h-6 bg-white/10 mx-2" />
          
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

function ControlledMainNav({
  activeScenario,
  activeItemId,
  onNavigate,
  onSave,
  onLoad,
  onExport,
  onShare,
  className = '',
}: MainNavProps) {
  const [showScenarioMenu, setShowScenarioMenu] = useState(false)
  const activeItem = activeItemId || 'terrain'

  return (
    <header className={`h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 ${className}`}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo + Active Scenario */}
        <div className="flex items-center gap-6">
          <LogoButton onClick={() => onNavigate?.('terrain')} />

          {activeScenario && (
            <>
              <div className="w-px h-8 bg-white/10" />
              <ActiveScenarioBadge
                scenario={activeScenario}
                onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              />
            </>
          )}
        </div>

        {/* Center: Primary Navigation */}
        <nav className="flex items-center gap-1">
          {primaryNav.map((item) => (
            <PrimaryNavButton
              key={item.id}
              item={item}
              isActive={activeItem === item.id}
              onClick={() => onNavigate?.(item.id)}
            />
          ))}
        </nav>

        {/* Right: Utility Actions */}
        <div className="flex items-center gap-2">
          <UtilityButton icon={<Save className="w-4 h-4" />} label="SAVE" onClick={onSave} />
          <UtilityButton icon={<FolderOpen className="w-4 h-4" />} label="LOAD" onClick={onLoad} />
          <UtilityButton icon={<Download className="w-4 h-4" />} label="EXPORT" onClick={onExport} />
          <UtilityButton
            icon={<Share2 className="w-4 h-4" />}
            label="SHARE"
            onClick={onShare}
            variant="primary"
          />
        </div>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT NAV (for mobile or smaller screens)
// ═══════════════════════════════════════════════════════════════════════════════

export function MainNavCompact({ className = '' }: { className?: string }) {
  const location = useLocation()
  const pathname = location.pathname
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className={`h-14 bg-black/80 backdrop-blur-xl border-b border-white/10 ${className}`}>
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/stratfit-logo.svg"
            alt="STRATFIT"
            className="h-8 w-auto select-none"
            style={{
              filter: "drop-shadow(0 6px 18px rgba(34, 211, 238, 0.10)) drop-shadow(0 12px 28px rgba(0,0,0,0.55))",
            }}
            draggable={false}
          />
        </Link>

        {/* Center: Current page */}
        <div className="text-sm text-white/60 font-mono">
          {primaryNav.find(item => pathname.startsWith(item.href))?.label || 'TERRAIN'}
        </div>

        {/* Menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-black/95 border-b border-white/10 p-4 z-50">
          <nav className="grid grid-cols-2 gap-2">
            {primaryNav.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  pathname.startsWith(item.href)
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-white/60 hover:bg-white/5'
                }`}
              >
                {item.icon}
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[10px] text-white/40">{item.description}</div>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE HEADER (for sub-navigation within pages)
// ═══════════════════════════════════════════════════════════════════════════════

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  tabs?: { id: string; label: string; icon?: React.ReactNode }[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: PageHeaderProps) {
  return (
    <div className="border-b border-white/10">
      {/* Title row */}
      <div className="h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-medium">{title}</h1>
              {badge}
            </div>
            {subtitle && (
              <div className="text-[11px] text-white/40">{subtitle}</div>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Tabs row (if provided) */}
      {tabs && tabs.length > 0 && (
        <div className="h-12 px-6 flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


