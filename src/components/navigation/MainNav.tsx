'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Mountain,
  Zap,
  GitCompare,
  DollarSign,
  CheckCircle,
  Activity,
  Compass,
  Save,
  FolderOpen,
  Download,
  Share2,
  ChevronDown,
  Layers,
  HelpCircle,
  Target,
  AlertTriangle,
  BarChart3,
  Shield,
  MonitorPlay,
} from 'lucide-react'
import { useUIStore } from "@/state/uiStore";
import { useShallow } from "zustand/react/shallow";
import styles from "./MainNav.module.css";
import SimStatusChip from "./SimStatusChip";

function MountainStatusPill() {
  const { mountainMode, mountainRenderer, mountainDprCap, lastReason } = useUIStore(
    useShallow((s) => ({
      mountainMode: s.mountainMode,
      mountainRenderer: s.mountainRenderer,
      mountainDprCap: s.mountainDprCap,
      lastReason: s.lastMountainFallbackReason,
    }))
  );

  // Only show when it’s meaningful (degraded / fallback) in the protective modes.
  const inProtectiveMode = mountainMode === "auto" || mountainMode === "locked";
  const isSafeFallback = mountainRenderer === "25d" && (lastReason === "fps" || lastReason === "context_lost");
  const isDegraded = mountainRenderer === "3d" && mountainDprCap < 2;

  if (!inProtectiveMode) return null;
  if (!isSafeFallback && !isDegraded) return null;

  const label = isSafeFallback ? "FALLBACK: SAFE" : `DPR ${mountainDprCap}`;
  const tone =
    isSafeFallback ? "border-amber-500/35 bg-amber-500/10 text-amber-200" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";

  return (
    <div className={`hidden xl:inline-flex items-center h-8 px-3 rounded-full border text-[10px] font-mono ${tone}`}>
      {label}
    </div>
  );
}

function MountainFallbackToast() {
  const lastShownRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const { mountainMode, mountainRenderer, lastReason, setMountainMode, retryMountain3d } = useUIStore(
    useShallow((s) => ({
      mountainMode: s.mountainMode,
      mountainRenderer: s.mountainRenderer,
      lastReason: s.lastMountainFallbackReason,
      setMountainMode: s.setMountainMode,
      retryMountain3d: s.retryMountain3d,
    }))
  );

  useEffect(() => {
    const key = `${mountainRenderer}:${lastReason ?? ""}:${mountainMode}`;
    if (key === lastShownRef.current) return;

    const shouldShow =
      (mountainMode === "auto" || mountainMode === "locked") &&
      mountainRenderer === "25d" &&
      (lastReason === "fps" || lastReason === "context_lost");

    if (shouldShow) {
      setOpen(true);
      lastShownRef.current = key;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setOpen(false), 12000);
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [mountainMode, mountainRenderer, lastReason]);

  if (!open) return null;

  const title = lastReason === "context_lost" ? "Graphics context reset" : "Performance protection enabled";
  const body =
    lastReason === "context_lost"
      ? "WebGL was lost by the browser/driver. Switched to SAFE (2.5D) to keep STRATFIT stable."
      : "Frame-rate dropped. Switched to SAFE (2.5D) to prevent stutter/overheating.";

  return (
    <div className="fixed bottom-5 right-5 z-9999 w-[360px] rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-[0_18px_70px_rgba(0,0,0,0.55)] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="text-xs font-mono text-white/80">{title}</div>
        <button
          className="text-white/50 hover:text-white/80 transition-colors text-xs font-mono"
          onClick={() => setOpen(false)}
        >
          CLOSE
        </button>
      </div>
      <div className="px-4 py-3 text-[12px] leading-relaxed text-white/70">
        {body}
      </div>
      <div className="px-4 pb-4 flex items-center gap-2">
        <button
          className="flex-1 h-10 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-xs font-mono hover:bg-cyan-500/15 transition-all"
          onClick={() => {
            setMountainMode("auto");
            setOpen(false);
          }}
        >
          RETURN TO AUTO
        </button>
        <button
          className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5 text-white/75 text-xs font-mono hover:bg-white/10 transition-all"
          onClick={() => {
            setMountainMode("locked");
            setOpen(false);
          }}
        >
          USE LOCKED
        </button>
        <button
          className="h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white/75 text-xs font-mono hover:bg-white/10 transition-all"
          onClick={() => {
            retryMountain3d();
            setOpen(false);
          }}
          title="Attempt to restore WebGL immediately"
        >
          RETRY 3D
        </button>
      </div>
    </div>
  );
}

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

// Execution Mode: the top nav must present ONLY these 7 tabs in the center.
// We keep routes/IDs compatible with the rest of the app by using existing IDs
// (e.g. "initiate" alias is handled by App.tsx).
const primaryNav: NavItem[] = [
  { id: "onboard", label: "INITIATE", href: "/onboard", icon: <Compass className="w-4 h-4" />, description: "Baseline inputs" },
  { id: "terrain", label: "TERRAIN", href: "/terrain", icon: <Mountain className="w-4 h-4" />, description: "Terrain view" },
  { id: "strategy", label: "STRATEGIC STUDIO", href: "/strategy", icon: <Target className="w-4 h-4" />, description: "Scenario builder" },
  { id: "compare", label: "COMPARE", href: "/compare", icon: <GitCompare className="w-4 h-4" />, description: "Compare" },
  { id: "risk", label: "RISK", href: "/risk", icon: <Shield className="w-4 h-4" />, description: "Risk" },
  { id: "valuation", label: "VALUATION", href: "/valuation", icon: <DollarSign className="w-4 h-4" />, description: "Valuation" },
  { id: "decision", label: "DECISION", href: "/decision", icon: <CheckCircle className="w-4 h-4" />, description: "Decision" },
];

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
        <div className="text-[9px] text-white/40 tracking-[0.2em]">SCENARIO INTELLIGENCE</div>
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
        <div className="text-[9px] text-white/40 tracking-[0.2em]">SCENARIO INTELLIGENCE</div>
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
      className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span>{item.label}</span>
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
      className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span>{item.label}</span>
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
  variant = "default",
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary";
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${variant === "primary" ? styles.shareButton : styles.systemButton} ${className}`}
      aria-label={label}
    >
      <span aria-hidden="true" className="inline-flex">{icon}</span>
      <span>{label}</span>
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
  const [showRenderMenu, setShowRenderMenu] = useState(false)
  const renderMenuRef = useRef<HTMLDivElement | null>(null)

  const { mountainMode, mountainDprCap, mountainRenderer, lastReason, setMountainMode, setMountainDprCap, retryMountain3d } =
    useUIStore(
      useShallow((s) => ({
        mountainMode: s.mountainMode,
        mountainDprCap: s.mountainDprCap,
        mountainRenderer: s.mountainRenderer,
        lastReason: s.lastMountainFallbackReason,
        setMountainMode: s.setMountainMode,
        setMountainDprCap: s.setMountainDprCap,
        retryMountain3d: s.retryMountain3d,
      }))
    )

  // Close renderer menu on outside click / ESC
  useEffect(() => {
    if (!showRenderMenu) return;
    const onDown = (e: MouseEvent) => {
      const el = renderMenuRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setShowRenderMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowRenderMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showRenderMenu]);

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
    <>
      <header className={`${styles.header} ${className}`}>
        <div className={styles.inner}>
          {/* Left: Logo + Active Scenario */}
          <div className={styles.left}>
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

          {/* Center: Primary Navigation (7 pill tabs) */}
          <div className={styles.center}>
            <nav className={styles.tabs} aria-label="Primary navigation">
              {primaryNav.map((item) => (
                <PrimaryNavItem key={item.id} item={item} isActive={activeItem === item.id} />
              ))}
            </nav>
          </div>

          {/* Right: Utility Actions */}
          <div className={styles.right}>
            {/* Renderer safety control (kept; styled as system button) */}
            <div className="relative" ref={renderMenuRef}>
              <div className="flex items-center gap-2">
                <UtilityButton
                  icon={<MonitorPlay className="w-4 h-4" />}
                  label={
                    mountainMode === "auto"
                      ? "AUTO"
                      : mountainMode === "safe"
                        ? "SAFE"
                        : mountainMode === "locked"
                          ? "LOCK"
                          : "3D"
                  }
                  onClick={() => setShowRenderMenu((v) => !v)}
                />
                <MountainStatusPill />
              </div>
            {showRenderMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] z-50 overflow-hidden">
                <button
                  className={`w-full px-4 py-3 text-left text-xs font-mono transition-all ${
                    mountainMode === "auto" ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => { setMountainMode("auto"); setShowRenderMenu(false); }}
                >
                  AUTO (3D w/ protection)
                </button>
                <button
                  className={`w-full px-4 py-3 text-left text-xs font-mono transition-all ${
                    mountainMode === "locked" ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => { setMountainMode("locked"); setShowRenderMenu(false); }}
                >
                  LOCKED (2.5D WebGL)
                </button>
                <button
                  className={`w-full px-4 py-3 text-left text-xs font-mono transition-all ${
                    mountainMode === "3d" ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => { setMountainMode("3d"); setShowRenderMenu(false); }}
                >
                  3D (max quality)
                </button>
                <button
                  className={`w-full px-4 py-3 text-left text-xs font-mono transition-all ${
                    mountainMode === "safe" ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => { setMountainMode("safe"); setShowRenderMenu(false); }}
                >
                  SAFE (2.5D no WebGL)
                </button>
                <div className="px-4 py-3 border-t border-white/10 text-[11px] text-white/45 font-mono space-y-1">
                  <div>Renderer: {mountainRenderer.toUpperCase()}</div>
                  <div>DPR cap: {mountainDprCap}</div>
                  {lastReason ? <div>Last fallback: {lastReason.replace("_", " ")}</div> : null}
                  {mountainRenderer === "25d" && (mountainMode === "auto" || mountainMode === "locked") ? (
                    <button
                      className="mt-2 w-full h-9 rounded-lg border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/15 transition-all text-cyan-200"
                      onClick={() => {
                        retryMountain3d();
                        setShowRenderMenu(false);
                      }}
                    >
                      RETRY 3D NOW
                    </button>
                  ) : null}
                  <button
                    className="mt-2 w-full h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white/70"
                    onClick={() => {
                      setMountainDprCap(2);
                      if (mountainMode === "auto") setMountainMode("auto");
                      if (mountainMode === "locked") setMountainMode("locked");
                      setShowRenderMenu(false);
                    }}
                  >
                    RESET QUALITY
                  </button>
                </div>
              </div>
            )}
          </div>

            {/* SAVE / LOAD / EXPORT grouped */}
            <div className={styles.utilityGroup} role="group" aria-label="Utility actions">
              <UtilityButton className={styles.utilityGroupButton} icon={<Save className="w-4 h-4" />} label="SAVE" onClick={onSave} />
              <UtilityButton className={styles.utilityGroupButton} icon={<FolderOpen className="w-4 h-4" />} label="LOAD" onClick={onLoad} />
              <UtilityButton className={styles.utilityGroupButton} icon={<Download className="w-4 h-4" />} label="EXPORT" onClick={onExport} />
            </div>

            <SimStatusChip />

            {/* Primary SHARE */}
            <UtilityButton icon={<Share2 className="w-4 h-4" />} label="SHARE" onClick={onShare} variant="primary" />

            <button type="button" className={styles.helpIcon} aria-label="Help">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <MountainFallbackToast />
    </>
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
  const [showRenderMenu, setShowRenderMenu] = useState(false)
  const renderMenuRef = useRef<HTMLDivElement | null>(null)

  const { mountainMode, mountainDprCap, mountainRenderer, lastReason, setMountainMode, setMountainDprCap, retryMountain3d } =
    useUIStore(
      useShallow((s) => ({
        mountainMode: s.mountainMode,
        mountainDprCap: s.mountainDprCap,
        mountainRenderer: s.mountainRenderer,
        lastReason: s.lastMountainFallbackReason,
        setMountainMode: s.setMountainMode,
        setMountainDprCap: s.setMountainDprCap,
        retryMountain3d: s.retryMountain3d,
      }))
    )

  useEffect(() => {
    if (!showRenderMenu) return;
    const onDown = (e: MouseEvent) => {
      const el = renderMenuRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setShowRenderMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowRenderMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showRenderMenu]);

  return (
    <>
      <header className={`${styles.header} ${className}`}>
        <div className={styles.inner}>
          {/* Left: Logo + Active Scenario */}
          <div className={styles.left}>
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

          {/* Center: Primary Navigation (7 pill tabs) */}
          <div className={styles.center}>
            <nav className={styles.tabs} aria-label="Primary navigation">
              {primaryNav.map((item) => (
                <PrimaryNavButton key={item.id} item={item} isActive={activeItem === item.id} onClick={() => onNavigate?.(item.id)} />
              ))}
            </nav>
          </div>

          {/* Right: Utility Actions */}
          <div className={styles.right}>
            {/* Renderer safety control (kept; styled as system button) */}
            <div className="relative" ref={renderMenuRef}>
              <div className="flex items-center gap-2">
                <UtilityButton
                  icon={<MonitorPlay className="w-4 h-4" />}
                  label={
                    mountainMode === "auto"
                      ? "AUTO"
                      : mountainMode === "safe"
                        ? "SAFE"
                        : mountainMode === "locked"
                          ? "LOCK"
                          : "3D"
                  }
                  onClick={() => setShowRenderMenu((v) => !v)}
                />
                <MountainStatusPill />
              </div>
            {showRenderMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] z-50 overflow-hidden">
                <button
                  className={`w-full px-4 py-3 text-left text-xs font-mono transition-all ${
                    mountainMode === "auto" ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => { setMountainMode("auto"); setShowRenderMenu(false); }}
                >
                  AUTO (3D w/ protection)
                </button>
                <button
                  className={`w-full px-4 py-3 text-left text-xs font-mono transition-all ${
                    mountainMode === "locked" ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => { setMountainMode("locked"); setShowRenderMenu(false); }}
                >
                  LOCKED (2.5D WebGL)
                </button>
                <button
                  className={`w-full px-4 py-3 text-left text-xs font-mono transition-all ${
                    mountainMode === "3d" ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => { setMountainMode("3d"); setShowRenderMenu(false); }}
                >
                  3D (max quality)
                </button>
                <button
                  className={`w-full px-4 py-3 text-left text-xs font-mono transition-all ${
                    mountainMode === "safe" ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
                  }`}
                  onClick={() => { setMountainMode("safe"); setShowRenderMenu(false); }}
                >
                  SAFE (2.5D no WebGL)
                </button>
                <div className="px-4 py-3 border-t border-white/10 text-[11px] text-white/45 font-mono space-y-1">
                  <div>Renderer: {mountainRenderer.toUpperCase()}</div>
                  <div>DPR cap: {mountainDprCap}</div>
                  {lastReason ? <div>Last fallback: {lastReason.replace("_", " ")}</div> : null}
                  {mountainRenderer === "25d" && (mountainMode === "auto" || mountainMode === "locked") ? (
                    <button
                      className="mt-2 w-full h-9 rounded-lg border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/15 transition-all text-cyan-200"
                      onClick={() => {
                        retryMountain3d();
                        setShowRenderMenu(false);
                      }}
                    >
                      RETRY 3D NOW
                    </button>
                  ) : null}
                  <button
                    className="mt-2 w-full h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white/70"
                    onClick={() => {
                      setMountainDprCap(2);
                      if (mountainMode === "auto") setMountainMode("auto");
                      if (mountainMode === "locked") setMountainMode("locked");
                      setShowRenderMenu(false);
                    }}
                  >
                    RESET QUALITY
                  </button>
                </div>
              </div>
            )}
          </div>

            {/* SAVE / LOAD / EXPORT grouped */}
            <div className={styles.utilityGroup} role="group" aria-label="Utility actions">
              <UtilityButton className={styles.utilityGroupButton} icon={<Save className="w-4 h-4" />} label="SAVE" onClick={onSave} />
              <UtilityButton className={styles.utilityGroupButton} icon={<FolderOpen className="w-4 h-4" />} label="LOAD" onClick={onLoad} />
              <UtilityButton className={styles.utilityGroupButton} icon={<Download className="w-4 h-4" />} label="EXPORT" onClick={onExport} />
            </div>

            <SimStatusChip />

            {/* Primary SHARE */}
            <UtilityButton icon={<Share2 className="w-4 h-4" />} label="SHARE" onClick={onShare} variant="primary" />

            <button type="button" className={styles.helpIcon} aria-label="Help">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <MountainFallbackToast />
    </>
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
        <div className="text-sm text-white/60 font-mono">
          {primaryNav.find(item => pathname.startsWith(item.href))?.label || 'BASELINE'}
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


