// src/components/KPISparklineSection.tsx
// STRATFIT — TITANIUM COMMAND BRIDGE
// Unified Telemetry Strip: Power Pips → Flux Wave → Hex-Core Reactor
// NEURAL BOOT — Sequential ignition startup sequence

import React, { useMemo, useEffect, useState, memo, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { useUIStore } from "@/state/uiStore";

// ============================================================================
// NEURAL BOOT — Audio System
// ============================================================================

const useBootAudio = (isVoiceEnabled: boolean, bootPhase: string) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const hasPlayedAnnouncementRef = useRef(false);
  
  // System Hum — Low frequency oscillator during boot
  const startSystemHum = useCallback(() => {
    if (!isVoiceEnabled) return;
    
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(55, ctx.currentTime); // Low A1
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
    } catch (e) {
      console.log('Audio not available');
    }
  }, [isVoiceEnabled]);
  
  const stopSystemHum = useCallback(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.5);
      setTimeout(() => {
        oscillatorRef.current?.stop();
        audioContextRef.current?.close();
        audioContextRef.current = null;
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      }, 600);
    }
  }, []);
  
  // Voice Announcement — "STRATFIT Systems Online"
  const playAnnouncement = useCallback(() => {
    if (!isVoiceEnabled || hasPlayedAnnouncementRef.current) return;
    hasPlayedAnnouncementRef.current = true;
    
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(
        "STRATFIT Systems Online. Baseline Trajectory Loaded."
      );
      utterance.rate = 1.1;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      
      // Find preferred female voice
      const voices = synth.getVoices();
      const preferredVoice = voices.find(v => 
        v.name === 'Google US English' || 
        v.name.includes('Microsoft Zira') || 
        v.name.includes('Samantha') || 
        v.name.includes('Victoria')
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      
      synth.speak(utterance);
    }
  }, [isVoiceEnabled]);
  
  // React to boot phases
  useEffect(() => {
    if (bootPhase === 'chassis') {
      startSystemHum();
    } else if (bootPhase === 'complete') {
      stopSystemHum();
      playAnnouncement();
    }
    
    return () => {
      if (bootPhase === 'complete') {
        stopSystemHum();
      }
    };
  }, [bootPhase, startSystemHum, stopSystemHum, playAnnouncement]);
  
  // Reset on unmount
  useEffect(() => {
    return () => {
      hasPlayedAnnouncementRef.current = false;
      stopSystemHum();
    };
  }, [stopSystemHum]);
};

// ============================================================================
// WIDGET: SEGMENTED POWER BAR — 12 vertical glowing pips
// ============================================================================

interface PowerPipsProps {
  value: number;      // 0-100 percentage
  isActive: boolean;
  isDragging: boolean;
  bootPhase?: string;  // NEURAL BOOT: 'resilience' triggers light wave
}

const PIP_COUNT = 12;

const PowerPips = memo(function PowerPips({ value, isActive, isDragging, bootPhase }: PowerPipsProps) {
  const [scanPos, setScanPos] = useState(0);
  const [bootWavePos, setBootWavePos] = useState(-1); // -1 = not started
  const [bootComplete, setBootComplete] = useState(false);
  
  // NEURAL BOOT — Light wave ignition sequence
  useEffect(() => {
    if (bootPhase === 'resilience' && bootWavePos === -1) {
      // Start the light wave
      setBootWavePos(0);
      const waveInterval = setInterval(() => {
        setBootWavePos(p => {
          if (p >= PIP_COUNT + 2) {
            clearInterval(waveInterval);
            setBootComplete(true);
            return p;
          }
          return p + 1;
        });
      }, 40); // Fast sweep
      return () => clearInterval(waveInterval);
    }
  }, [bootPhase, bootWavePos]);
  
  // Scanner beam animation — ripples through every 3 seconds (only after boot)
  useEffect(() => {
    if (!bootComplete && bootPhase !== 'complete') return;
    
    const speed = isDragging ? 50 : isActive ? 80 : 120;
    const interval = setInterval(() => {
      setScanPos(p => (p + 1) % (PIP_COUNT + 4));
    }, speed);
    return () => clearInterval(interval);
  }, [isActive, isDragging, bootComplete, bootPhase]);

  const filledPips = Math.round((value / 100) * PIP_COUNT);
  
  // Boot phase rendering — pips light up sequentially
  // Include 'chassis' so widgets show immediately (just dimmer during boot-up)
  const isBootActive = bootPhase === 'chassis' || bootPhase === 'resilience' || bootPhase === 'momentum' || bootPhase === 'stability' || bootPhase === 'complete';
  const isPostBoot = bootPhase === 'complete' || bootComplete;

  return (
    <div className="flex items-end gap-1 h-10">
      {Array.from({ length: PIP_COUNT }).map((_, i) => {
        const isFilled = i < filledPips;
        const isScanning = isPostBoot && scanPos >= i && scanPos <= i + 2;
        const isBootLit = bootWavePos >= i; // Light wave has passed this pip
        const isBright = isScanning || isDragging || (bootPhase === 'resilience' && bootWavePos === i);
        
        // Height varies for visual interest
        const baseHeight = 60 + (i % 3) * 15;
        const height = isFilled ? baseHeight : 25;
        
        // During boot, only show pips that the wave has passed
        const showPip = isPostBoot || (isBootActive && isBootLit);
        
        return (
          <div 
            key={i}
            className="rounded-sm transition-all"
            style={{
              width: '8px',
              height: `${height}%`,
              opacity: showPip ? 1 : 0.1,
              background: isFilled 
                ? isBright 
                  ? 'linear-gradient(180deg, #ffffff 0%, #67e8f9 50%, #22d3ee 100%)'
                  : 'linear-gradient(180deg, #22d3ee 0%, #0891b2 50%, #0e7490 100%)'
                : 'rgba(30, 41, 59, 0.6)',
              boxShadow: isFilled 
                ? isBright
                  ? '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(34,211,238,0.6)'
                  : '0 0 8px rgba(34,211,238,0.5)'
                : 'inset 0 0 4px rgba(0,0,0,0.5)',
              transitionDuration: isDragging ? '30ms' : '150ms',
              transform: bootPhase === 'resilience' && bootWavePos === i ? 'scaleY(1.2)' : 'scaleY(1)',
            }}
          />
        );
      })}
    </div>
  );
});

// ============================================================================
// WIDGET: STARSHIP TELEMETRY — 3D Navigation Compass
// "Elon Musk Rocket" aesthetic — Machined Telemetry with Physical Feedback
// ============================================================================

interface StarshipTelemetryProps {
  value: number;        // Growth percentage (e.g., 12 for +12%)
  isActive: boolean;
  isDragging: boolean;
  bootPhase?: string;   // NEURAL BOOT: 'momentum' triggers chevron deploy
  onStreamPulse?: (intensity: number) => void; // Callback for wet glass sync
}

// ═══════════════════════════════════════════════════════════════════════════
// DYNAMIC PARTICLE ENGINE — Density and speed tied to momentum
// ═══════════════════════════════════════════════════════════════════════════
const getParticleConfig = (value: number) => {
  if (value > 2) {
    // HIGH THRUST — Maximum particles, blazing speed
    return {
      count: 30,
      baseSpeed: 12,        // Very fast
      intervalMs: 16,       // 60fps feeling
      mode: 'thrust' as const,
      glowIntensity: 1.5,
      tailGlow: true,
    };
  } else if (value < -2) {
    // LOW DRAG / STALLING — Sparse, slow, flickering
    return {
      count: 8,
      baseSpeed: 0.5,       // Very slow
      intervalMs: 80,       // Sluggish updates
      mode: 'stall' as const,
      glowIntensity: 0.4,
      tailGlow: false,
    };
  } else {
    // CRUISE — Normal operation
    return {
      count: 15,
      baseSpeed: 2,
      intervalMs: 50,
      mode: 'cruise' as const,
      glowIntensity: 0.8,
      tailGlow: false,
    };
  }
};

const StarshipTelemetry = memo(function StarshipTelemetry({ value, isActive, isDragging, bootPhase, onStreamPulse }: StarshipTelemetryProps) {
  const [tick, setTick] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [deployed, setDeployed] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [flickerPhase, setFlickerPhase] = useState(0);
  
  // DYNAMIC PARTICLE CONFIG based on momentum
  const particleConfig = useMemo(() => getParticleConfig(value), [value]);
  
  // Dynamic pip positions array — resizes based on particle count
  const [pipPositions, setPipPositions] = useState<number[]>(() => 
    Array.from({ length: 30 }, (_, i) => (i / 30) * 100) // Start with max capacity
  );
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NEURAL BOOT — Chevron deploys at T+800ms, stream starts after
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (bootPhase === 'momentum') {
      // Deploy chevron with spring bounce
      setDeployed(true);
      // Start particle stream 200ms after chevron deploys
      const streamTimer = setTimeout(() => setStreamActive(true), 200);
      return () => clearTimeout(streamTimer);
    } else if (bootPhase === 'complete') {
      setDeployed(true);
      setStreamActive(true);
    }
  }, [bootPhase]);
  
  // Animation loop — DYNAMIC speed based on momentum
  useEffect(() => {
    if (!streamActive && bootPhase !== 'complete') return;
    
    // Speed scales with dragging AND momentum
    const dragMultiplier = isDragging ? 2 : isActive ? 1.2 : 1;
    const effectiveSpeed = particleConfig.baseSpeed * dragMultiplier;
    
    const interval = setInterval(() => {
      setTick(t => t + 1);
      setPulsePhase(p => p + (particleConfig.mode === 'thrust' ? 0.2 : 0.08));
      setFlickerPhase(f => f + 0.3); // For stall mode flickering
      
      // Move pips with momentum-aware speed
      setPipPositions(prev => prev.map(pos => {
        const newPos = pos + effectiveSpeed;
        return newPos > 100 ? -10 + (Math.random() * 5) : newPos;
      }));
      
      // Notify parent for wet glass sync (pulse intensity 0-1)
      if (onStreamPulse && particleConfig.mode === 'thrust') {
        const pulseValue = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        onStreamPulse(pulseValue);
      }
    }, particleConfig.intervalMs);
    
    return () => clearInterval(interval);
  }, [isActive, isDragging, streamActive, bootPhase, particleConfig, onStreamPulse]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FLIGHT LOGIC — Chevron lift/drop based on growth
  // ═══════════════════════════════════════════════════════════════════════════
  const getFlightState = () => {
    if (value > 0) return 'climb';      // CLIMB: Lift up, tilt up
    if (value < 0) return 'descent';    // DESCENT: Drop down, tilt down
    return 'cruise';                     // CRUISE: Neutral on horizon
  };
  
  const flightState = getFlightState();
  const isHighThrust = particleConfig.mode === 'thrust';
  const isStalling = particleConfig.mode === 'stall';
  
  // Chevron Y position (lift/drop from horizon)
  const chevronY = flightState === 'climb' ? 40 : flightState === 'descent' ? 60 : 50;
  
  // Chevron rotation (tilt angle)
  const chevronRotation = flightState === 'climb' ? -30 : flightState === 'descent' ? 30 : 0;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COLOR SYSTEM — Aerospace telemetry colors
  // ═══════════════════════════════════════════════════════════════════════════
  const colors = {
    climb: { 
      primary: '#00D9FF',      // Neon Cyan
      glow: 'rgba(0, 217, 255, 0.9)',
      pip: '#00D9FF',
      horizon: 'rgba(0, 217, 255, 0.3)',
    },
    cruise: { 
      primary: '#FFFFFF',      // Pure White
      glow: 'rgba(255, 255, 255, 0.6)',
      pip: '#94a3b8',
      horizon: 'rgba(255, 255, 255, 0.15)',
    },
    descent: { 
      primary: '#F59E0B',      // Warning Amber
      glow: 'rgba(245, 158, 11, 0.9)',
      pip: '#F59E0B',
      horizon: 'rgba(245, 158, 11, 0.3)',
    },
  };
  
  const { primary, glow, pip, horizon } = colors[flightState];
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DYNAMIC INTENSITY — Glow scales with stream speed
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Pulse intensity — MORE intense during high thrust
  const basePulse = 0.7 + Math.sin(pulsePhase) * 0.3;
  const pulseIntensity = basePulse * particleConfig.glowIntensity;
  
  // CHEVRON MICRO-JITTER — Only during HIGH THRUST (engine vibration)
  const thrustJitterX = isHighThrust ? (Math.random() - 0.5) * 1.5 : 0;
  const thrustJitterY = isHighThrust ? (Math.random() - 0.5) * 1.5 : 0;
  
  // Standard jitter for dragging
  const jitterX = isDragging ? (Math.random() - 0.5) * 2 + thrustJitterX : thrustJitterX;
  const jitterY = isDragging ? (Math.random() - 0.5) * 2 + thrustJitterY : thrustJitterY;
  
  // Horizon line vibration
  const horizonJitter = isDragging 
    ? (Math.random() - 0.5) * 3 
    : isHighThrust 
      ? (Math.random() - 0.5) * 2 
      : isActive ? (Math.random() - 0.5) * 1 : 0;
  
  // STALL FLICKER — Opacity fluctuates when stalling
  const stallFlicker = isStalling ? 0.3 + Math.sin(flickerPhase * 3) * 0.4 : 1;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — Starship Telemetry Display
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative flex-1 h-20 flex items-center overflow-hidden">
      <svg 
        className="w-full h-full" 
        viewBox="0 0 200 100" 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Chevron glow filter */}
          <filter id="starshipGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={isDragging ? '5' : '3'} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Pip glow filter */}
          <filter id="pipGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Horizon gradient */}
          <linearGradient id="horizonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={horizon} stopOpacity="0" />
            <stop offset="20%" stopColor={horizon} stopOpacity="0.8" />
            <stop offset="80%" stopColor={horizon} stopOpacity="0.8" />
            <stop offset="100%" stopColor={horizon} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* ═══════════════════════════════════════════════════════════════════
            THE HORIZON LINE — Razor-thin vibrating static reference
           ═══════════════════════════════════════════════════════════════════ */}
        <line 
          x1="10" 
          y1={50 + horizonJitter} 
          x2="190" 
          y2={50 + horizonJitter}
          stroke="url(#horizonGrad)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        
        {/* Horizon tick marks */}
        {[40, 80, 120, 160].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={48}
            x2={x}
            y2={52}
            stroke={horizon}
            strokeWidth="0.5"
            opacity={0.5}
          />
        ))}
        
        {/* ═══════════════════════════════════════════════════════════════════
            THE KINETIC ENGINE — DYNAMIC Particle Stream
            Count: 30 (Thrust) / 15 (Cruise) / 8 (Stall)
           ═══════════════════════════════════════════════════════════════════ */}
        {streamActive && pipPositions.slice(0, particleConfig.count).map((pos, i) => {
          // Pips accelerate towards the chevron
          const baseOpacity = Math.min(1, pos / 30) * (isDragging ? 1 : 0.7);
          // Apply stall flicker to opacity
          const opacity = isStalling ? baseOpacity * stallFlicker : baseOpacity;
          
          // Size scales with thrust mode
          const size = isHighThrust 
            ? (isDragging ? 4 : 3.5) 
            : (isDragging ? 3 : isActive ? 2.5 : 2);
          
          // Wave amplitude — tighter for thrust, looser for stall
          const waveAmp = isHighThrust ? 3 : isStalling ? 6 : 4;
          const yOffset = Math.sin(pos * 0.1 + i) * waveAmp;
          
          return (
            <circle
              key={i}
              cx={20 + pos * 1.2}
              cy={50 + yOffset}
              r={size}
              fill={pip}
              opacity={opacity}
              filter="url(#pipGlow)"
              style={{
                transition: isStalling ? 'none' : 'opacity 0.1s ease',
              }}
            />
          );
        })}
        
        {/* HIGH THRUST TAIL GLOW — Blazing trail behind particles */}
        {particleConfig.tailGlow && streamActive && pipPositions.slice(0, particleConfig.count).map((pos, i) => (
          <circle
            key={`glow-${i}`}
            cx={20 + pos * 1.2 - 8}
            cy={50 + Math.sin(pos * 0.1 + i) * 3}
            r={6}
            fill={pip}
            opacity={0.35}
            style={{ 
              filter: 'blur(6px)',
            }}
          />
        ))}
        
        {/* Pip trail blur when dragging */}
        {isDragging && streamActive && pipPositions.slice(0, Math.min(8, particleConfig.count)).map((pos, i) => (
          <circle
            key={`blur-${i}`}
            cx={20 + pos * 1.2 - 5}
            cy={50 + Math.sin(pos * 0.1 + i) * 8}
            r={4}
            fill={pip}
            opacity={0.2}
            style={{ filter: 'blur(4px)' }}
          />
        ))}
        
        {/* ═══════════════════════════════════════════════════════════════════
            THE VECTOR HUB — Dual-Stroke 3D Chevron
            MICRO-JITTER: Vibrates during High Thrust mode
           ═══════════════════════════════════════════════════════════════════ */}
        <g 
          transform={`translate(${150 + jitterX}, ${chevronY + jitterY}) rotate(${chevronRotation})`}
          style={{ 
            transition: deployed && !isHighThrust
              ? 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' 
              : 'none', // No transition during thrust to allow micro-jitter
            transformOrigin: 'center',
          }}
        >
          {/* Deployment scale wrapper */}
          <g style={{
            transform: deployed ? 'scale(1)' : 'scale(0)',
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformOrigin: 'center',
          }}>
            
            {/* OUTER GLOW RING — Heartbeat pulse (INTENSIFIED during High Thrust) */}
            <circle 
              cx="0" cy="0" 
              r={isHighThrust ? 32 : isDragging ? 28 : 25}
              fill="none"
              stroke={primary}
              strokeWidth={isHighThrust ? '2' : '1'}
              opacity={pulseIntensity * (isHighThrust ? 0.7 : 0.4)}
              style={{ 
                filter: `drop-shadow(0 0 ${isHighThrust ? 25 : isDragging ? 15 : 8}px ${glow})`,
                transition: isHighThrust ? 'none' : 'r 0.3s ease',
              }}
            />
            
            {/* HIGH THRUST SECONDARY GLOW — Extra ring for thrust mode */}
            {isHighThrust && (
              <circle 
                cx="0" cy="0" 
                r={38}
                fill="none"
                stroke={primary}
                strokeWidth="0.5"
                opacity={0.3 + Math.sin(pulsePhase * 2) * 0.2}
                style={{ 
                  filter: `drop-shadow(0 0 15px ${glow})`,
                }}
              />
            )}
            
            {/* TARGETING RETICLE — Mounting ring */}
            <circle 
              cx="0" cy="0" r="20"
              fill="rgba(11, 18, 33, 0.9)"
              stroke={primary}
              strokeWidth={isHighThrust ? '3' : isDragging ? '2.5' : '1.5'}
              opacity={isActive ? 1 : 0.7}
              style={{
                filter: isHighThrust ? `drop-shadow(0 0 10px ${glow})` : 'none',
              }}
            />
            
            {/* Reticle crosshairs */}
            <line x1="-8" y1="0" x2="-14" y2="0" stroke={primary} strokeWidth="1" opacity="0.5" />
            <line x1="8" y1="0" x2="14" y2="0" stroke={primary} strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="-8" x2="0" y2="-14" stroke={primary} strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="8" x2="0" y2="14" stroke={primary} strokeWidth="1" opacity="0.5" />
            
            {/* THE DUAL-STROKE CHEVRON — Outer edge */}
            <path 
              d="M -10 -12 L 12 0 L -10 12"
              fill="none"
              stroke={primary}
              strokeWidth={isDragging ? '4' : '3'}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#starshipGlow)"
              style={{
                filter: isDragging 
                  ? `drop-shadow(0 0 12px ${primary}) drop-shadow(0 0 24px ${glow})`
                  : `drop-shadow(0 0 8px ${glow})`,
              }}
            />
            
            {/* THE DUAL-STROKE CHEVRON — Inner accent */}
            <path 
              d="M -5 -7 L 7 0 L -5 7"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isDragging ? 1 : 0.8}
            />
            
            {/* THRUST CORE — Center point */}
            <circle 
              cx="0" cy="0" 
              r={isDragging ? 4 : 3}
              fill="#FFFFFF"
              style={{
                filter: `drop-shadow(0 0 8px ${primary})`,
                transition: 'r 0.2s ease',
              }}
            />
            
            {/* Inner core dot */}
            <circle 
              cx="0" cy="0" r="1.5"
              fill={primary}
            />
          </g>
        </g>
        
        {/* Flight state indicators */}
        {flightState === 'climb' && (
          <text x="170" y="25" fill={primary} fontSize="8" fontFamily="monospace" opacity="0.8">
            ▲ CLIMB
          </text>
        )}
        {flightState === 'descent' && (
          <text x="165" y="85" fill={primary} fontSize="8" fontFamily="monospace" opacity="0.8">
            ▼ DESCENT
          </text>
        )}
      </svg>
      
      {/* TOP "WET GLASS" REFLECTION — Color-matched to chevron */}
      <div 
        className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, 
            transparent 5%, 
            ${horizon} 20%, 
            ${flightState === 'climb' ? 'rgba(0,217,255,0.6)' : flightState === 'descent' ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.3)'} 50%, 
            ${horizon} 80%, 
            transparent 95%
          )`,
          boxShadow: isActive ? `0 0 10px ${glow}` : 'none',
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* BOTTOM THRUST GLOW — Reflects chevron state */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${primary} 50%, transparent 90%)`,
          opacity: isDragging ? 1 : isActive ? pulseIntensity * 0.8 : 0.4,
          boxShadow: isDragging ? `0 0 20px ${glow}, 0 0 40px ${glow}` : isActive ? `0 0 10px ${glow}` : 'none',
          transition: 'all 0.2s ease',
        }}
      />
    </div>
  );
});

// ============================================================================
// WIDGET: STABILITY COMMAND DIAL — God-Mode Concentric Ring Gauge
// Premium aerospace-grade stability indicator with multi-zone arc display
// ============================================================================

interface StabilityDialProps {
  value: number;
  isActive: boolean;
  isDragging: boolean;
  bootPhase?: string;
  onIgnitionComplete?: () => void;
}

// Damped spring physics constants
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 18;

const StabilityDial = memo(function StabilityDial({ 
  value, 
  isActive, 
  isDragging, 
  bootPhase, 
  onIgnitionComplete 
}: StabilityDialProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [bootActive, setBootActive] = useState(false);
  const velocityRef = useRef(0);
  const targetValueRef = useRef(value);
  const animationRef = useRef<number | null>(null);
  const [scanAngle, setScanAngle] = useState(0);
  
  // NEURAL BOOT — Sweep animation at T+1200ms
  useEffect(() => {
    if (bootPhase === 'stability') {
      setBootActive(true);
      targetValueRef.current = value;
      velocityRef.current = 0;
      
      const startTime = Date.now();
      let currentValue = 0;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const target = value;
        const displacement = target - currentValue;
        const springForce = displacement * (SPRING_STIFFNESS / 1000);
        const dampingForce = velocityRef.current * (SPRING_DAMPING / 100);
        const acceleration = springForce - dampingForce;
        
        velocityRef.current += acceleration;
        currentValue += velocityRef.current;
        
        setDisplayValue(Math.max(0, Math.min(100, currentValue)));
        
        if (Math.abs(velocityRef.current) < 0.01 && Math.abs(displacement) < 0.1) {
          setDisplayValue(target);
          onIgnitionComplete?.();
          return;
        }
        
        if (elapsed < 2000) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(target);
          onIgnitionComplete?.();
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    } else if (bootPhase === 'complete') {
      setBootActive(true);
      setDisplayValue(value);
    }
  }, [bootPhase, value, onIgnitionComplete]);
  
  // Damped spring physics for value transitions
  useEffect(() => {
    if (!bootActive) return;
    targetValueRef.current = value;
    
    const animate = () => {
      setDisplayValue(prev => {
        const target = targetValueRef.current;
        const displacement = target - prev;
        const springForce = displacement * (SPRING_STIFFNESS / 1000);
        const dampingForce = velocityRef.current * (SPRING_DAMPING / 100);
        const acceleration = springForce - dampingForce;
        
        velocityRef.current += acceleration;
        const newValue = prev + velocityRef.current;
        
        if (Math.abs(velocityRef.current) < 0.005 && Math.abs(displacement) < 0.05) {
          velocityRef.current = 0;
          return target;
        }
        return Math.max(0, Math.min(100, newValue));
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, bootActive]);

  // Scan line animation when active
  useEffect(() => {
    if (!isActive && !isDragging) return;
    const interval = setInterval(() => {
      setScanAngle(prev => (prev + 3) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isActive, isDragging]);

  // Status zones and colors
  const isCritical = displayValue < 25;
  const isWarning = displayValue >= 25 && displayValue < 50;
  const isNominal = displayValue >= 50 && displayValue < 75;
  const isOptimal = displayValue >= 75;
  
  const statusColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : isNominal ? '#22D3EE' : '#10B981';
  const statusLabel = isCritical ? 'CRITICAL' : isWarning ? 'CAUTION' : isNominal ? 'NOMINAL' : 'OPTIMAL';
  
  // Arc calculations (270° sweep from 135° to 405°/45°)
  const startAngle = 135;
  const sweepAngle = 270;
  const radius = 38;
  const centerX = 48;
  const centerY = 48;
  
  const valueAngle = startAngle + (displayValue / 100) * sweepAngle;
  
  // Convert angle to SVG arc coordinates
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };
  
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const angle = startAngle + (i / 10) * sweepAngle;
    const isMajor = i % 5 === 0;
    const innerR = isMajor ? 28 : 32;
    const outerR = 36;
    const inner = polarToCartesian(centerX, centerY, innerR, angle);
    const outer = polarToCartesian(centerX, centerY, outerR, angle);
    ticks.push({ inner, outer, isMajor, angle, value: i * 10 });
  }

  return (
    <div className="flex items-center gap-2 h-full">
      {/* THE STABILITY DIAL */}
      <div className="relative" style={{ width: 96, height: 96 }}>
        <svg viewBox="0 0 96 96" className="w-full h-full">
          <defs>
            {/* Gradient for the value arc */}
            <linearGradient id="stabilityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="25%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            
            {/* Glow filter */}
            <filter id="stabilityGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Scan line gradient */}
            <linearGradient id="scanGradient" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor={statusColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          
          {/* Background ring */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={radius} 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="8"
          />
          
          {/* Zone indicator arcs (background) */}
          <path
            d={describeArc(centerX, centerY, radius, startAngle, startAngle + sweepAngle * 0.25)}
            fill="none"
            stroke="rgba(239, 68, 68, 0.15)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={describeArc(centerX, centerY, radius, startAngle + sweepAngle * 0.25, startAngle + sweepAngle * 0.5)}
            fill="none"
            stroke="rgba(245, 158, 11, 0.15)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={describeArc(centerX, centerY, radius, startAngle + sweepAngle * 0.5, startAngle + sweepAngle * 0.75)}
            fill="none"
            stroke="rgba(34, 211, 238, 0.15)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={describeArc(centerX, centerY, radius, startAngle + sweepAngle * 0.75, startAngle + sweepAngle)}
            fill="none"
            stroke="rgba(16, 185, 129, 0.15)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Value arc (filled portion) */}
          {displayValue > 0 && (
            <path
              d={describeArc(centerX, centerY, radius, startAngle, valueAngle)}
              fill="none"
              stroke={statusColor}
              strokeWidth="6"
              strokeLinecap="round"
              filter={isActive || isDragging ? "url(#stabilityGlow)" : undefined}
              style={{
                transition: 'stroke 0.3s ease',
              }}
            />
          )}
          
          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.inner.x}
                y1={tick.inner.y}
                x2={tick.outer.x}
                y2={tick.outer.y}
                stroke={tick.isMajor ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}
                strokeWidth={tick.isMajor ? 1.5 : 0.75}
              />
              {tick.isMajor && (
                <text
                  x={polarToCartesian(centerX, centerY, 22, tick.angle).x}
                  y={polarToCartesian(centerX, centerY, 22, tick.angle).y}
                  fill="rgba(255,255,255,0.35)"
                  fontSize="6"
                  fontFamily="monospace"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {tick.value}
                </text>
              )}
            </g>
          ))}
          
          {/* Needle indicator */}
          <g transform={`rotate(${valueAngle - 90}, ${centerX}, ${centerY})`}>
            {/* Needle body */}
            <line
              x1={centerX}
              y1={centerY + 8}
              x2={centerX}
              y2={centerY - 30}
              stroke={statusColor}
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#stabilityGlow)"
            />
            {/* Needle tip */}
            <polygon
              points={`${centerX},${centerY - 32} ${centerX - 3},${centerY - 26} ${centerX + 3},${centerY - 26}`}
              fill={statusColor}
              filter="url(#stabilityGlow)"
            />
          </g>
          
          {/* Center hub */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r="8" 
            fill="rgba(10, 15, 30, 0.95)"
            stroke={statusColor}
            strokeWidth="1.5"
          />
          <circle 
            cx={centerX} 
            cy={centerY} 
            r="3" 
            fill={statusColor}
            style={{ opacity: 0.8 }}
          />
          
          {/* Scan line when active */}
          {(isActive || isDragging) && (
            <line
              x1={centerX}
              y1={centerY}
              x2={polarToCartesian(centerX, centerY, radius + 4, scanAngle).x}
              y2={polarToCartesian(centerX, centerY, radius + 4, scanAngle).y}
              stroke={statusColor}
              strokeWidth="1"
              opacity="0.4"
            />
          )}
        </svg>
        
        {/* Center value display */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingTop: '28px' }}
        >
          <span 
            className="text-lg font-bold tabular-nums tracking-tight"
            style={{ 
              color: statusColor,
              textShadow: `0 0 8px ${statusColor}40`,
              lineHeight: 1,
            }}
          >
            {Math.round(displayValue)}
          </span>
        </div>
      </div>
      
      {/* Status readout */}
      <div className="flex flex-col items-start justify-center gap-0.5">
        <span 
          className="text-[8px] font-mono font-bold tracking-[0.15em] uppercase"
          style={{ 
            color: statusColor,
            textShadow: `0 0 6px ${statusColor}30`,
          }}
        >
          {statusLabel}
        </span>
        <div className="flex items-center gap-1">
          {/* Status LED */}
          <div 
            className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'animate-pulse' : ''}`}
            style={{
              background: statusColor,
              boxShadow: `0 0 4px ${statusColor}`,
            }}
          />
          <span 
            className="text-[9px] font-mono tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            SYS
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT — TITANIUM COMMAND BRIDGE
// ============================================================================

export default function KPISparklineSection() {
  const { activeScenarioId, engineResults } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );
  
  const { activeGroup, isDragging, isVoiceEnabled, bootPhase, setBootPhase, setNeuralBootComplete } = useUIStore(
    useShallow((s) => ({
      activeGroup: s.activeGroup,
      isDragging: s.isDragging,
      isVoiceEnabled: s.isVoiceEnabled,
      bootPhase: s.bootPhase,
      setBootPhase: s.setBootPhase,
      setNeuralBootComplete: s.setNeuralBootComplete,
    }))
  );
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NEURAL BOOT — Sequential Ignition Sequence
  // GOD MODE RULE: Always start at full opacity - never greyed out
  // ═══════════════════════════════════════════════════════════════════════════
  const [bridgeOpacity, setBridgeOpacity] = useState(1); // ALWAYS FULL OPACITY
  
  // WET GLASS SYNC — Pulse intensity from particle stream (0-1)
  const [wetGlassPulse, setWetGlassPulse] = useState(0);
  
  // Callback for particle stream to sync wet glass highlight
  const handleStreamPulse = useCallback((intensity: number) => {
    setWetGlassPulse(intensity);
  }, []);
  
  // Audio hook
  useBootAudio(isVoiceEnabled, bootPhase);
  
  // Boot sequence orchestration — runs ONCE on mount
  // Using a ref to track if boot has started to prevent timer clearing on state changes
  const bootStartedRef = useRef(false);
  
  useEffect(() => {
    // Only run once, and only if we haven't booted
    if (bootStartedRef.current || bootPhase !== 'idle') {
      return;
    }
    bootStartedRef.current = true;
    
    // T+0ms: Start chassis - widgets are ALWAYS at full brightness
    setBootPhase('chassis');
    // Note: bridgeOpacity starts at 1, so no need to set it
    
    // T+400ms: Resilience ignition
    const resilienceTimer = setTimeout(() => {
      setBootPhase('resilience');
    }, 400);
    
    // T+800ms: Momentum ignition
    const momentumTimer = setTimeout(() => {
      setBootPhase('momentum');
    }, 800);
    
    // T+1200ms: Stability ignition
    const stabilityTimer = setTimeout(() => {
      setBootPhase('stability');
    }, 1200);
    
    // T+3000ms: Safety fallback — force complete if PrecisionCalibrator callback fails
    const safetyTimer = setTimeout(() => {
      const currentPhase = useUIStore.getState().bootPhase;
      if (currentPhase !== 'complete') {
        setBootPhase('complete');
        setNeuralBootComplete(true);
        setTimeout(() => setNeuralBootComplete(false), 2000);
      }
    }, 3000);
    
    // Cleanup only on unmount
    return () => {
      clearTimeout(resilienceTimer);
      clearTimeout(momentumTimer);
      clearTimeout(stabilityTimer);
      clearTimeout(safetyTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only on mount
  
  // Handle stability ignition completion → signal mountain pulse
  const handleIgnitionComplete = useCallback(() => {
    setBootPhase('complete');
    setNeuralBootComplete(true);
    
    // Reset after mountain pulse (2 seconds)
    setTimeout(() => {
      setNeuralBootComplete(false);
    }, 2000);
  }, [setBootPhase, setNeuralBootComplete]);

  // KPI values from engine
  const kpis = engineResults?.[activeScenarioId ?? "base"]?.kpis ?? {};
  
  // Active states — ALWAYS 100% lit, just brighter when active
  const isResilienceActive = activeGroup === 'efficiency' || activeGroup === 'risk';
  const isMomentumActive = activeGroup === 'growth';
  const isStabilityActive = activeGroup === 'risk';
  
  // Extract values
  const cash = kpis.cashPosition?.display ?? "$4.2M";
  const runway = kpis.runway?.display ?? "82 mo";
  const runwayValue = kpis.runway?.value ?? 82;
  const runwayPct = Math.min(100, (runwayValue / 36) * 100);
  
  const momentum = kpis.momentum?.display ?? "$5.1M";
  const growth = kpis.arrGrowthPct?.display ?? "+12%";
  const growthValue = kpis.arrGrowthPct?.value ?? 12; // Raw percentage for Vector Thrust
  
  const riskScore = kpis.riskIndex?.value ?? 30;
  const stabilityPct = Math.round(100 - riskScore);
  
  // Vector Thrust color for wet glass highlight
  const vectorColor = growthValue > 2 ? '#00D9FF' : growthValue < -2 ? '#F59E0B' : '#FFFFFF';

  return (
    <div className="kpi-sparkline-section">
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 999999,
          background: "#0B1220",
          color: "#37D4FF",
          border: "1px solid #37D4FF",
          padding: "6px 10px",
          fontSize: 12,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        KPISparklineSection LIVE: {new Date().toISOString()}
      </div>
      {/* ═══════════════════════════════════════════════════════════════════
          TITANIUM COMMAND BRIDGE — Unified Telemetry Strip
          NEURAL BOOT — Sequential ignition with opacity fade-in
         ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="relative w-full h-28 flex items-stretch"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #0b1221 50%, #020617 100%)',
          borderRadius: '8px',
          overflow: 'hidden',
          opacity: bridgeOpacity,
          transition: 'opacity 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}
      >
        {/* TOP EDGE — "Wet Glass" Highlight — SYNCED to Particle Stream */}
        <div 
          className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
          style={{
            // Base white highlight + dynamic intensity from particle stream
            background: `linear-gradient(90deg, 
              transparent 5%, 
              rgba(255,255,255,${0.4 + wetGlassPulse * 0.3}) 30%, 
              rgba(255,255,255,${0.5 + wetGlassPulse * 0.4}) 50%, 
              rgba(255,255,255,${0.4 + wetGlassPulse * 0.3}) 70%, 
              transparent 95%
            )`,
            // Glow intensifies during high thrust
            boxShadow: wetGlassPulse > 0.3 
              ? `0 0 ${8 + wetGlassPulse * 10}px rgba(0, 217, 255, ${wetGlassPulse * 0.5})` 
              : 'none',
            transition: 'box-shadow 0.1s ease',
          }}
        />
        
        {/* Bottom shadow */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-black/60" />
        
        {/* Left/Right subtle borders */}
        <div className="absolute inset-y-0 left-0 w-[1px] bg-white/5" />
        <div className="absolute inset-y-0 right-0 w-[1px] bg-white/5" />

        {/* ════════════════════════════════════════════════════════════════
            ZONE 1: RESILIENCE — Segmented Power
           ════════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-1 flex items-center px-6 py-4 relative"
          style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Text Block */}
          <div className="flex flex-col mr-6">
            <div className={`text-[11px] font-mono font-bold tracking-[0.3em] uppercase mb-1 transition-all duration-300 ${isResilienceActive ? 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,1)]' : 'text-slate-300'}`}>
              R E S I L I E N C E
            </div>
            <div className={`text-4xl font-bold tracking-tight transition-all duration-300 ${isResilienceActive ? 'text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'text-white'}`}>
              {cash}
            </div>
            <div className={`text-[10px] font-mono mt-1 transition-colors duration-300 ${isResilienceActive ? 'text-cyan-400' : 'text-slate-400'}`}>
              RUNWAY: {runway}
            </div>
          </div>
          
          {/* Power Pips */}
          <PowerPips 
            value={runwayPct} 
            isActive={isResilienceActive} 
            isDragging={isDragging && isResilienceActive}
            bootPhase={bootPhase}
          />
          
          {/* Active bottom glow */}
          {isResilienceActive && (
            <div 
              className="absolute bottom-0 left-4 right-4 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)',
                boxShadow: '0 0 15px #22d3ee, 0 0 30px rgba(34,211,238,0.5)',
              }}
            />
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ZONE 2: MOMENTUM — Vector Thrust Indicator
           ════════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-1 flex items-center px-6 py-4 relative"
          style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Color-reactive top highlight — SYNCED to Particle Stream Pulse */}
          <div 
            className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
            style={{
              // High thrust = more intense color bleeding
              background: isMomentumActive 
                ? `linear-gradient(90deg, 
                    transparent 5%, 
                    ${vectorColor}${Math.round(40 + wetGlassPulse * 40).toString(16).padStart(2, '0')} 30%, 
                    ${vectorColor}${Math.round(128 + wetGlassPulse * 127).toString(16).padStart(2, '0')} 50%, 
                    ${vectorColor}${Math.round(40 + wetGlassPulse * 40).toString(16).padStart(2, '0')} 70%, 
                    transparent 95%
                  )`
                : 'transparent',
              boxShadow: isMomentumActive 
                ? `0 0 ${8 + wetGlassPulse * 15}px ${vectorColor}` 
                : 'none',
              transition: 'none', // No transition for real-time pulse sync
            }}
          />
          
          {/* Text Block */}
          <div className="flex flex-col mr-4 min-w-[100px]">
            <div 
              className="text-[11px] font-mono font-bold tracking-[0.3em] uppercase mb-1 transition-all duration-300"
              style={{
                color: isMomentumActive ? vectorColor : 'rgb(203, 213, 225)',
                textShadow: isMomentumActive ? `0 0 10px ${vectorColor}` : 'none',
              }}
            >
              M O M E N T U M
            </div>
            <div className={`text-4xl font-bold tracking-tight transition-all duration-300 ${isMomentumActive ? 'text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'text-white'}`}>
              {momentum}
            </div>
            <div 
              className="text-[10px] font-mono mt-1 transition-colors duration-300"
              style={{
                color: isMomentumActive ? vectorColor : 'rgb(148, 163, 184)',
              }}
            >
              GROWTH: {growth}
            </div>
          </div>
          
          {/* Starship Telemetry Compass — Linked to Particle Engine */}
          <StarshipTelemetry 
            value={growthValue} 
            isActive={isMomentumActive} 
            isDragging={isDragging && isMomentumActive}
            bootPhase={bootPhase}
            onStreamPulse={handleStreamPulse}
          />
          
          {/* Active bottom glow — color matches vector state */}
          {isMomentumActive && (
            <div 
              className="absolute bottom-0 left-4 right-4 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${vectorColor}, transparent)`,
                boxShadow: `0 0 15px ${vectorColor}, 0 0 30px ${vectorColor}60`,
              }}
            />
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ZONE 3: SYSTEM STABILITY — Aerospace Command Dial
           ════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center justify-center px-3 py-2 relative" style={{ minWidth: 180 }}>
          {/* Stability Command Dial — Premium aerospace gauge */}
          <StabilityDial 
            value={stabilityPct} 
            isActive={isStabilityActive} 
            isDragging={isDragging && isStabilityActive}
            bootPhase={bootPhase}
            onIgnitionComplete={handleIgnitionComplete}
          />
          
          {/* Subtle active indicator line */}
          {isStabilityActive && (
            <div 
              className="absolute bottom-0 left-4 right-4 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${stabilityPct >= 75 ? '#10B981' : stabilityPct >= 50 ? '#22D3EE' : stabilityPct >= 25 ? '#F59E0B' : '#EF4444'}, transparent)`,
                boxShadow: `0 0 10px ${stabilityPct >= 75 ? '#10B981' : stabilityPct >= 50 ? '#22D3EE' : stabilityPct >= 25 ? '#F59E0B' : '#EF4444'}60`,
              }}
            />
          )}
        </div>
        
      </div>
    </div>
  );
}
