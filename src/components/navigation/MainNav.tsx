'use client'

import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Mountain,
  Zap,
  GitCompare,
  DollarSign,
  Activity,
  FileText,
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
    id: 'initialize',
    label: 'SYSTEM CALIBRATION',
    href: '/initialize',
    icon: <Layers className="w-4 h-4" />,
    description: 'Financial baseline calibration',
  },
  {
    id: 'terrain',
    label: 'BASELINE',
    href: '/terrain',
    icon: <Mountain className="w-4 h-4" />,
    description: 'Terrain visualization & baseline analysis',
  },
  {
    id: 'simulate',
    label: 'STRATEGY STUDIO',
    href: '/simulate',
    icon: <Zap className="w-4 h-4" />,
    description: 'Strategy configuration & simulation',
  },
  {
    id: 'compare',
    label: 'COMPARE',
    href: '/compare',
    icon: <GitCompare className="w-4 h-4" />,
    description: 'Compare two futures',
  },
  {
    id: 'risk',
    label: 'RISK',
    href: '/risk',
    icon: <Activity className="w-4 h-4" />,
    description: 'Risk assessment & threat analysis',
  },
  {
    id: 'valuation',
    label: 'VALUATION',
    href: '/valuation',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Calculate your worth',
  },
  {
    id: 'assessment',
    label: 'STRATEGIC ASSESSMENT',
    href: '/assessment',
    icon: <FileText className="w-4 h-4" />,
    description: 'Strengths, vulnerabilities & priority focus',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// LOGO
// ═══════════════════════════════════════════════════════════════════════════════

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative w-8 h-8">
        {/* Mountain icon with glow */}
        <div className="absolute inset-0 bg-linear-to-br from-cyan-500 to-violet-600 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Mountain className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
      <div>
        <div className="text-white font-semibold tracking-wide">STRATFIT</div>
        <div className="text-[9px] text-white/55 tracking-[0.2em]">SCENARIO INTELLIGENCE</div>
      </div>
    </Link>
  )
}

function LogoButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 group">
      <div className="relative w-8 h-8">
        {/* Mountain icon with glow */}
        <div className="absolute inset-0 bg-linear-to-br from-cyan-500 to-violet-600 rounded-lg opacity-20 group-hover:opacity-30 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Mountain className="w-5 h-5 text-cyan-400" />
        </div>
      </div>
      <div>
        <div className="text-white font-semibold tracking-wide">STRATFIT</div>
        <div className="text-[9px] text-white/55 tracking-[0.2em]">SCENARIO INTELLIGENCE</div>
      </div>
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
        <div className="text-[9px] text-white/55">Active Scenario</div>
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
      className={`relative px-3 py-2.5 transition-all group ${
        isActive
          ? 'text-cyan-400'
          : 'text-white/70 hover:text-white/95'
      }`}
      style={{
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
      }}
    >
      <span>{item.label}</span>

      {/* Active cyan underline */}
      {isActive && (
        <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-400" style={{ borderRadius: '1px' }} />
      )}

      {/* Hover tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {item.description}
      </div>
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
      className={`relative px-3 py-2.5 transition-all group ${
        isActive
          ? 'text-cyan-400'
          : 'text-white/70 hover:text-white/95'
      }`}
      style={{
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
      }}
    >
      <span>{item.label}</span>

      {/* Active cyan underline */}
      {isActive && (
        <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-400" style={{ borderRadius: '1px' }} />
      )}

      {/* Hover tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {item.description}
      </div>
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
}: { 
  icon: React.ReactNode
  label: string
  onClick?: () => void
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-white/55 hover:text-white/85 transition-all"
      style={{
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
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
  onSave,
  onLoad,
  onExport,
  onShare,
  className = '',
}: MainNavProps) {
  const location = useLocation()
  const pathname = location.pathname

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
    <header
      className={className}
      style={{
        height: 56,
        background: 'linear-gradient(180deg, rgba(8, 12, 18, 0.98), rgba(4, 8, 14, 0.96))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        <Logo />
      </div>

      {/* Center: Primary Navigation with separators */}
      <nav className="flex items-center">
        {primaryNav.map((item, i) => (
          <React.Fragment key={item.id}>
            <PrimaryNavItem
              item={item}
              isActive={activeItem === item.id}
            />
            {i < primaryNav.length - 1 && (
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right: Ghost Utility Actions */}
      <div className="flex items-center gap-1.5">
        <UtilityButton icon={<Save className="w-3.5 h-3.5" />} label="SAVE" onClick={onSave} />
        <UtilityButton icon={<FolderOpen className="w-3.5 h-3.5" />} label="LOAD" onClick={onLoad} />
        <UtilityButton icon={<Download className="w-3.5 h-3.5" />} label="EXPORT" onClick={onExport} />
        <UtilityButton icon={<Share2 className="w-3.5 h-3.5" />} label="SHARE" onClick={onShare} />
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
  const activeItem = activeItemId || 'terrain'

  return (
    <header
      className={className}
      style={{
        height: 56,
        background: 'linear-gradient(180deg, rgba(8, 12, 18, 0.98), rgba(4, 8, 14, 0.96))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        <LogoButton onClick={() => onNavigate?.('terrain')} />
      </div>

      {/* Center: Primary Navigation with separators */}
      <nav className="flex items-center">
        {primaryNav.map((item, i) => (
          <React.Fragment key={item.id}>
            <PrimaryNavButton
              item={item}
              isActive={activeItem === item.id}
              onClick={() => onNavigate?.(item.id)}
            />
            {i < primaryNav.length - 1 && (
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right: Ghost Utility Actions */}
      <div className="flex items-center gap-1.5">
        <UtilityButton icon={<Save className="w-3.5 h-3.5" />} label="SAVE" onClick={onSave} />
        <UtilityButton icon={<FolderOpen className="w-3.5 h-3.5" />} label="LOAD" onClick={onLoad} />
        <UtilityButton icon={<Download className="w-3.5 h-3.5" />} label="EXPORT" onClick={onExport} />
        <UtilityButton icon={<Share2 className="w-3.5 h-3.5" />} label="SHARE" onClick={onShare} />
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
          <Mountain className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-semibold">STRATFIT</span>
        </Link>

        {/* Center: Current page */}
        <div className="text-sm text-white/80 font-mono">
          {primaryNav.find(item => pathname.startsWith(item.href))?.label || 'TERRAIN'}
        </div>

        {/* Menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/65 hover:text-white hover:bg-white/5 transition-all"
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
                    : 'text-white/75 hover:bg-white/5'
                }`}
              >
                {item.icon}
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[10px] text-white/55">{item.description}</div>
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
              <div className="text-[11px] text-white/55">{subtitle}</div>
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
                  : 'text-white/60 hover:text-white/85 hover:bg-white/5'
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


