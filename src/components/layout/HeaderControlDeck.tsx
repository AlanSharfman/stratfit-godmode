// src/components/layout/HeaderControlDeck.tsx
// STRATFIT — Command Deck (God Mode Header Controls)
// Grouped tactical buttons with hardware bezel styling

import React from 'react';
import { MonitorPlay, Download, UploadCloud, Save, Share2, HelpCircle } from 'lucide-react';

interface HeaderControlDeckProps {
  pitchMode: boolean;
  onPitchModeToggle: () => void;
  onExport: () => void;
  onLoad: () => void;
  onSave: () => void;
  onShare: () => void;
  onHelp?: () => void;
}

export default function HeaderControlDeck({
  pitchMode,
  onPitchModeToggle,
  onExport,
  onLoad,
  onSave,
  onShare,
  onHelp,
}: HeaderControlDeckProps) {
  return (
    <div className="flex items-center">
      {/* THE CONTAINER: A 'machined' glass capsule */}
      <div 
        className="flex items-center bg-[#0f172a]/80 backdrop-blur-md border border-white/10 rounded-full px-1 py-1 shadow-lg"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* GROUP 1: PRESENTATION (The Action Items) */}
        <div className="flex items-center px-2 gap-1">
          <ControlButton 
            icon={MonitorPlay} 
            label="PITCH_MODE" 
            active={pitchMode}
            onClick={onPitchModeToggle}
          />
          <ControlButton 
            icon={Download} 
            label="EXPORT"
            onClick={onExport}
          />
        </div>

        {/* DIVIDER: A vertical etched line */}
        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* GROUP 2: DATA STATE (The Utility Items) */}
        <div className="flex items-center px-2 gap-1">
          <ControlButton 
            icon={UploadCloud} 
            label="LOAD"
            onClick={onLoad}
          />
          <ControlButton 
            icon={Save} 
            label="SAVE"
            onClick={onSave}
          />
          <ControlButton 
            icon={Share2} 
            label="SHARE"
            onClick={onShare}
          />
        </div>

        {/* DIVIDER */}
        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* GROUP 3: SYSTEM (Subtle) */}
        <div className="flex items-center px-2">
          {/* Replaced big "Take Tour" button with a subtle help icon */}
          <button 
            className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/5"
            title="Take the tour"
            onClick={onHelp}
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: The Tactical Button ---
interface ControlButtonProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const ControlButton: React.FC<ControlButtonProps> = ({ 
  icon: Icon, 
  label, 
  active = false,
  onClick 
}) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 group
      ${active 
        ? 'bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
        : 'border border-transparent hover:bg-white/5 hover:border-white/10 text-slate-400 hover:text-white'
      }
    `}
  >
    <Icon 
      size={12} 
      className={active ? "text-cyan-400" : "group-hover:text-cyan-200"} 
    />
    {/* MONOSPACE IS KEY HERE */}
    <span className="font-mono text-[10px] font-bold tracking-wider uppercase">
      {label}
    </span>
  </button>
);

