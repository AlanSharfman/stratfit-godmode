// ============================================================================
// SCENARIO COLOR THEMES
// ============================================================================

import * as THREE from 'three';

export type Scenario = 'base' | 'upside' | 'downside' | 'extreme';

export const SCENARIO_THEMES: Record<
  Scenario,
  {
    primary: THREE.Color;
    secondary: THREE.Color;
    glow: THREE.Color;
    hex: number;
    label: string;
    description: string;
    icon: string;
    tip: string;
  }
> = {
  base: {
    primary: new THREE.Color('#22d3d3'),
    secondary: new THREE.Color('#14b8a6'),
    glow: new THREE.Color('#5eead4'),
    hex: 0x22d3d3,
    label: 'Base',
    description: 'Current trajectory',
    icon: '📊',
    tip: 'Baseline projection using current growth rates and market conditions.',
  },
  upside: {
    primary: new THREE.Color('#34d399'),
    secondary: new THREE.Color('#10b981'),
    glow: new THREE.Color('#6ee7b7'),
    hex: 0x34d399,
    label: 'Upside',
    description: '+18% Growth',
    icon: '🚀',
    tip: 'Optimistic scenario with accelerated growth and improved retention.',
  },
  downside: {
    primary: new THREE.Color('#fbbf24'),
    secondary: new THREE.Color('#f59e0b'),
    glow: new THREE.Color('#fcd34d'),
    hex: 0xfbbf24,
    label: 'Downside',
    description: 'Conservative',
    icon: '⚠️',
    tip: 'Defensive scenario accounting for market headwinds and slower growth.',
  },
  extreme: {
    primary: new THREE.Color('#f472b6'),
    secondary: new THREE.Color('#ec4899'),
    glow: new THREE.Color('#f9a8d4'),
    hex: 0xf472b6,
    label: 'Extreme',
    description: '+35% Expansion',
    icon: '⚡',
    tip: 'Aggressive expansion with new markets and product lines.',
  },
};

