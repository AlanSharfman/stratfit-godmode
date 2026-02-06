// src/components/Decision/DecisionTab.tsx
// STRATFIT — THE ULTIMATE DECISION INTELLIGENCE
// God Mode Full-Width Layout

import { useState, useMemo, useEffect } from 'react'
import type { ViewMode, SharedProps } from './types'
import {
  generateCompanyState,
  generateThreats,
  generateOpportunities,
  generateActions,
  generateBlindSpots,
  generateDecisions,
  generateBoardQuestions,
  calculateHealthScore,
} from './mockData'
import { CommandCenter } from './CommandCenter'
import { ThreatRadarView } from './ThreatRadarView'
import { OpportunityScanner } from './OpportunityScanner'
import { ActionMatrix } from './ActionMatrixView'
import { BlindSpotsView } from './BlindSpotsView'
import { DecisionLogView } from './DecisionLogView'
import { ReadinessCheck } from './ReadinessCheck'
import './DecisionStyles.css'

// Icons (inline SVG for simplicity)
const icons = {
  command: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
  threats: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  opportunities: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  actions: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  blindspots: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  decisions: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  readiness: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  brain: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  zap: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
}

const views: { id: ViewMode; label: string; icon: keyof typeof icons; description: string }[] = [
  { id: 'command', label: 'COMMAND', icon: 'command', description: 'Strategic overview' },
  { id: 'threats', label: 'THREATS', icon: 'threats', description: 'What could hurt you' },
  { id: 'opportunities', label: 'OPPORTUNITIES', icon: 'opportunities', description: 'Upside to capture' },
  { id: 'actions', label: 'ACTIONS', icon: 'actions', description: 'What to do' },
  { id: 'blindspots', label: 'BLIND SPOTS', icon: 'blindspots', description: "What you're missing" },
  { id: 'decisions', label: 'DECISIONS', icon: 'decisions', description: 'Learning from yourself' },
  { id: 'readiness', label: 'READINESS', icon: 'readiness', description: 'Board preparation' },
]

export default function DecisionTab() {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<ViewMode>('command')

  // Generate all data
  const companyState = useMemo(() => generateCompanyState(), [])
  const threats = useMemo(() => generateThreats(companyState), [companyState])
  const opportunities = useMemo(() => generateOpportunities(companyState), [companyState])
  const actions = useMemo(() => generateActions(), [])
  const blindSpots = useMemo(() => generateBlindSpots(), [])
  const decisions = useMemo(() => generateDecisions(), [])
  const boardQuestions = useMemo(() => generateBoardQuestions(), [])

  // Calculate health score
  const healthScore = useMemo(() => {
    return calculateHealthScore(companyState, threats)
  }, [companyState, threats])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="decision-tab decision-tab--godmode" />
  }

  const sharedProps: SharedProps = {
    companyState,
    threats,
    opportunities,
    actions,
    blindSpots,
    decisions,
    boardQuestions,
    healthScore,
  }

  const criticalThreats = threats.filter(t => t.severity === 'critical' || t.severity === 'high').length
  const highBlindSpots = blindSpots.filter(b => b.severity === 'high').length

  return (
    <div className="decision-tab decision-tab--godmode">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* COMMAND STRIP */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <header className="dec-command-strip">
        <div className="command-left">
          <div className="command-badge">
            {icons.brain}
            <span className="badge-label">DECISION INTELLIGENCE</span>
          </div>
        </div>

        <div className="command-center">
          <div className="health-indicator">
            <div className={`health-dot ${
              healthScore >= 70 ? 'health-good' :
              healthScore >= 50 ? 'health-warning' : 'health-critical'
            }`} />
            <span className="health-label">HEALTH: {healthScore}/100</span>
          </div>
        </div>

        <div className="command-right">
          <div className="copilot-badge">
            {icons.zap}
            <span>AI CO-PILOT ACTIVE</span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* NAV TABS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <nav className="dec-nav-tabs">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`nav-tab ${view === v.id ? 'active' : ''}`}
          >
            {icons[v.icon]}
            <span>{v.label}</span>
            {v.id === 'threats' && criticalThreats > 0 && (
              <span className="tab-badge tab-badge--critical">{criticalThreats}</span>
            )}
            {v.id === 'opportunities' && (
              <span className="tab-badge tab-badge--success">{opportunities.length}</span>
            )}
            {v.id === 'blindspots' && highBlindSpots > 0 && (
              <span className="tab-badge tab-badge--warning">{highBlindSpots}</span>
            )}
          </button>
        ))}
        
        <div className="nav-description">
          {views.find(v => v.id === view)?.description}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <main className="dec-main">
        {view === 'command' && <CommandCenter {...sharedProps} />}
        {view === 'threats' && <ThreatRadarView {...sharedProps} />}
        {view === 'opportunities' && <OpportunityScanner {...sharedProps} />}
        {view === 'actions' && <ActionMatrix {...sharedProps} />}
        {view === 'blindspots' && <BlindSpotsView {...sharedProps} />}
        {view === 'decisions' && <DecisionLogView {...sharedProps} />}
        {view === 'readiness' && <ReadinessCheck {...sharedProps} />}
      </main>
    </div>
  )
}
